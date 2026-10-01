#!/usr/bin/env bash
# Hender fra Nord — placeholder media generator.
#
# Builds slow Ken Burns loops, "films", posters and gallery derivatives from
# the existing lookbook photos in public/images/uploads. Everything written
# here is a PLACEHOLDER and is flagged `placeholder: true` in
# src/content/hender-fra-nord. Replace with real footage after the shoot.
#
# Usage: bash scripts/hender-fra-nord/make-placeholders.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/public/images/uploads"
OUT="$ROOT/public/media/hender-fra-nord"
mkdir -p "$OUT/loops" "$OUT/films" "$OUT/posters" "$OUT/stills" "$OUT/captions"

FPS=25
FRAMES=200 # 8 s
GRADE="eq=saturation=0.84:contrast=0.97:gamma=1.02"

# crop_for <img> <ratio: 169|45> <focus 0..1>
# Prints an ffmpeg crop filter that cuts the requested aspect ratio out of the
# source, sliding the window along the long axis to <focus>.
crop_for() {
  local img="$1" ratio="$2" focus="$3" w h cw ch
  read -r w h < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of 'csv=p=0:s=\ ' "$img")
  if [ "$ratio" = "169" ]; then num=16; den=9; else num=4; den=5; fi
  # Largest crop of num:den that fits.
  if [ $((w * den)) -gt $((h * num)) ]; then
    ch=$h; cw=$((h * num / den)); cw=$((cw - cw % 2))
  else
    cw=$w; ch=$((w * den / num)); ch=$((ch - ch % 2))
  fi
  echo "crop=${cw}:${ch}:(iw-${cw})*${focus}:(ih-${ch})*${focus}"
}

# clip <name> <img> <ratio> <focus> <mode: loop|film> <zoom> <drift -1..1>
clip() {
  local name="$1" img="$SRC/$2" ratio="$3" focus="$4" mode="$5" z="$6" dx="$7"
  local size dir suffix e
  if [ "$ratio" = "169" ]; then size=1280x720; suffix=""; else size=720x900; suffix="-4x5"; fi
  if [ "$mode" = "loop" ]; then
    dir=loops
    # 0 -> 1 -> 0: breathes in and out, so the loop point is seamless.
    e="(0.5-0.5*cos(2*PI*on/$((FRAMES - 1))))"
  else
    dir=films
    e="(0.5-0.5*cos(PI*on/$((FRAMES - 1))))"
  fi
  local crop; crop="$(crop_for "$img" "$ratio" "$focus")"
  local big_w=${size%x*} big_h=${size#*x}
  ffmpeg -v error -y -i "$img" -vf "\
${crop},scale=$((big_w * 3)):$((big_h * 3)):flags=lanczos,\
zoompan=z='1+${z}*${e}':x='(iw-iw/zoom)*(0.5+${dx}*0.5*(2*${e}-1))':y='(ih-ih/zoom)*0.5':d=${FRAMES}:s=${size}:fps=${FPS},\
${GRADE},format=yuv420p" \
    -frames:v "$FRAMES" -an -c:v libx264 -preset slow -crf 28 -profile:v high \
    -g 50 -movflags +faststart "$OUT/$dir/${name}${suffix}.mp4"

  # Poster = first frame (zoom 1), so nothing jumps when playback begins.
  if [ "$ratio" = "169" ]; then
    ffmpeg -v error -y -i "$img" -vf "${crop},scale=1600:900:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/posters/${name}.webp"
    ffmpeg -v error -y -i "$img" -vf "${crop},scale=800:450:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/posters/${name}-800.webp"
  else
    ffmpeg -v error -y -i "$img" -vf "${crop},scale=720:900:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/posters/${name}-4x5.webp"
  fi
}

# og <name> <img> <focus> — 1200x630 JPEG for social cards.
og() {
  local img="$SRC/$2" crop
  crop="$(crop_for "$img" 169 "$3")"
  ffmpeg -v error -y -i "$img" -vf "${crop},scale=1200:675:flags=lanczos,crop=1200:630,${GRADE}" -frames:v 1 -q:v 4 "$OUT/posters/${1}-og.jpg"
}

# still <img> — graded gallery derivatives (full + small) in webp.
still() {
  local base="${1%.*}" img="$SRC/$1" w
  w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$img")
  ffmpeg -v error -y -i "$img" -vf "${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/stills/${base}.webp"
  ffmpeg -v error -y -i "$img" -vf "scale=$((w / 2 - (w / 2) % 2)):-2:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/stills/${base}-sm.webp"
}

echo "· cover"
clip cover          img_3697.jpeg 169 0.50 loop 0.07  0.4
clip cover          img_3697.jpeg 45  0.42 loop 0.06  0.0
og   cover          img_3697.jpeg 0.50

echo "· ullvogna"
clip ullvogna-hero  img_3763.jpeg 169 0.30 loop 0.06 -0.3
clip ullvogna-hero  img_3763.jpeg 45  0.30 loop 0.05  0.0
clip ullvogna-film  img_3757.jpeg 169 0.40 film 0.10  0.3
og   ullvogna       img_3763.jpeg 0.30

echo "· lillavendel"
clip lillavendel-hero img_3721.jpeg 169 0.45 loop 0.06  0.3
clip lillavendel-hero img_3721.jpeg 45  0.40 loop 0.05  0.0
clip lillavendel-film img_3726.jpeg 169 0.45 film 0.10 -0.3
og   lillavendel      img_3721.jpeg 0.45

echo "· alvadal"
clip alvadal-hero   zpw10.jpeg    169 0.50 loop 0.06  0.4
clip alvadal-hero   zpw10.jpeg    45  0.52 loop 0.05  0.0
clip alvadal-film   img_3718.jpeg 169 0.50 film 0.10  0.2
og   alvadal        zpw10.jpeg    0.50

echo "· moia-form"
clip moia-form-hero img_3759.jpeg 169 0.40 loop 0.06 -0.3
clip moia-form-hero img_3759.jpeg 45  0.40 loop 0.05  0.0
clip moia-form-film img_3720.jpeg 169 0.40 film 0.10  0.3
og   moia-form      img_3759.jpeg 0.40

echo "· keli-bijou (hidden by default)"
clip keli-bijou-hero img_3720.jpeg 169 0.35 loop 0.06 0.2
clip keli-bijou-hero img_3720.jpeg 45  0.35 loop 0.05 0.0
og   keli-bijou      img_3720.jpeg 0.35

echo "· coming (stills only)"
for pair in "dyra-pa-garden:img_3711.jpeg:0.55" "skredderen-fra-damaskus:img_3718.jpeg:0.40"; do
  IFS=: read -r name file focus <<<"$pair"
  img="$SRC/$file"
  crop="$(crop_for "$img" 45 "$focus")"
  ffmpeg -v error -y -i "$img" -vf "${crop},scale=720:900:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/posters/${name}-4x5.webp"
  crop="$(crop_for "$img" 169 "$focus")"
  ffmpeg -v error -y -i "$img" -vf "${crop},scale=1600:900:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/posters/${name}.webp"
done

echo "· stills"
for f in "$SRC"/*.jpeg; do still "$(basename "$f")"; done

echo "done:"
du -sh "$OUT"
