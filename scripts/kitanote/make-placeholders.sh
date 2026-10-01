#!/usr/bin/env bash
# 北の手 · Kita no Te — placeholder media generator.
#
# Cuts detail crops (objects, fabric, hands) out of the lookbook photos in
# public/images/uploads, following the photo rules in
# docs/brand/kitanote/designprofil-s07.jpg: hands and objects in frame, no one
# looking into the camera, no lifestyle styling. Builds slow Ken Burns loops,
# short "films", posters and gallery stills from them.
#
# Everything written here is a PLACEHOLDER and is flagged `placeholder: true`
# in src/content/kitanote. Replace with real footage after the shoot.
#
# Usage: bash scripts/kitanote/make-placeholders.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/public/images/uploads"
OUT="$ROOT/public/media/kitanote"
rm -rf "$OUT/loops" "$OUT/films" "$OUT/posters" "$OUT/stills"
mkdir -p "$OUT/loops" "$OUT/films" "$OUT/posters" "$OUT/stills" "$OUT/captions"

FPS=25
FRAMES=200 # 8 s
# Neutral, slightly lifted, saturation -10 % (profile: "Etterarbeid").
GRADE="eq=saturation=0.9:contrast=0.96:brightness=0.01"

# Crops are "w:h:x:y" in source pixels, chosen by eye on the contact sheet.

# loop <name> <img> <crop 4:3> <crop 4:5> <drift -1..1>
# 4:3 (1200x900) for the cover/hero image panel, 4:5 (720x900) for phones.
loop() {
  local name="$1" img="$SRC/$2" c43="$3" c45="$4" dx="$5"
  local e="(0.5-0.5*cos(2*PI*on/$((FRAMES - 1))))" # 0 -> 1 -> 0, seamless
  for v in "43:$c43:1200:900:" "45:$c45:720:900:-4x5"; do
    IFS=: read -r _ cw ch cx cy w h suffix <<<"$v"
    ffmpeg -v error -y -i "$img" -vf "\
crop=$cw:$ch:$cx:$cy,scale=$((w * 2)):$((h * 2)):flags=lanczos,\
zoompan=z='1+0.05*${e}':x='(iw-iw/zoom)*(0.5+${dx}*0.5*(2*${e}-1))':y='(ih-ih/zoom)*0.5':d=${FRAMES}:s=${w}x${h}:fps=${FPS},\
${GRADE},format=yuv420p" \
      -frames:v "$FRAMES" -an -c:v libx264 -preset slow -crf 29 -profile:v high \
      -g 50 -movflags +faststart "$OUT/loops/${name}${suffix}.mp4"
    # Poster = first frame (zoom 1), so nothing jumps when playback begins.
    ffmpeg -v error -y -i "$img" -vf "crop=$cw:$ch:$cx:$cy,scale=$w:$h:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/posters/${name}${suffix}.webp"
  done
  ffmpeg -v error -y -i "$img" -vf "crop=${c43},scale=800:600:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/posters/${name}-800.webp"
  # 1200x630 social card from the 4:3 crop.
  ffmpeg -v error -y -i "$img" -vf "crop=${c43},scale=1200:900:flags=lanczos,crop=1200:630,${GRADE}" -frames:v 1 -q:v 4 "$OUT/posters/${name}-og.jpg"
}

# film <name> <img> <crop 16:9>
film() {
  local name="$1" img="$SRC/$2" crop="$3"
  local e="(0.5-0.5*cos(PI*on/$((FRAMES - 1))))"
  ffmpeg -v error -y -i "$img" -vf "\
crop=$crop,scale=2560:1440:flags=lanczos,\
zoompan=z='1+0.08*${e}':x='(iw-iw/zoom)*0.5':y='(ih-ih/zoom)*0.5':d=${FRAMES}:s=1280x720:fps=${FPS},\
${GRADE},format=yuv420p" \
    -frames:v "$FRAMES" -an -c:v libx264 -preset slow -crf 29 -profile:v high \
    -g 50 -movflags +faststart "$OUT/films/${name}.mp4"
  ffmpeg -v error -y -i "$img" -vf "crop=$crop,scale=1600:900:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/posters/${name}.webp"
  ffmpeg -v error -y -i "$img" -vf "crop=$crop,scale=800:450:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 76 "$OUT/posters/${name}-800.webp"
}

# still <name> <img> <crop> <width> <height> — full + half-size webp.
still() {
  local name="$1" img="$SRC/$2" crop="$3" w="$4" h="$5"
  ffmpeg -v error -y -i "$img" -vf "crop=$crop,scale=$w:$h:flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 80 "$OUT/stills/${name}.webp"
  ffmpeg -v error -y -i "$img" -vf "crop=$crop,scale=$((w / 2)):$((h / 2)):flags=lanczos,${GRADE}" -frames:v 1 -c:v libwebp -quality 78 "$OUT/stills/${name}-sm.webp"
}

echo "· cover: wool hats on the bench"
loop cover img_3697.jpeg 920:690:110:110 560:700:270:70 0.3

echo "· ullvogna: knitted sleeve and mitten"
loop ullvogna-hero img_3763.jpeg 784:588:0:580 532:665:0:503 -0.3
film ullvogna-film img_3757.jpeg 640:360:100:700

echo "· lillavendel: linen shirt on the fence"
loop lillavendel-hero img_3726.jpeg 784:588:0:300 784:980:0:150 0.2
film lillavendel-film img_3711.jpeg 560:315:120:520

echo "· alvadal: hand on the wooden bench"
loop alvadal-hero img_3721.jpeg 560:420:0:600 448:560:0:560 0.3
film alvadal-film img_3697.jpeg 432:243:700:520

echo "· moia-form: wool cape"
loop moia-form-hero img_3759.jpeg 784:588:0:450 600:750:100:420 -0.2
film moia-form-film img_3720.jpeg 560:315:100:580

echo "· stills"
still hats    img_3697.jpeg 920:690:110:110 920 690
still hats-v  img_3697.jpeg 560:700:270:70  560 700
still bench   img_3697.jpeg 392:294:700:490 784 588
still mittens img_3757.jpeg 440:550:220:680 440 550
still cape    img_3759.jpeg 600:750:100:420 600 750
still shirt   img_3726.jpeg 784:980:0:150   784 980
still robe    img_3718.jpeg 520:650:120:350 520 650
still kimono  img_3720.jpeg 500:375:120:560 800 600
still dress   img_3711.jpeg 500:375:150:500 800 600

echo "done:"
du -sh "$OUT"
