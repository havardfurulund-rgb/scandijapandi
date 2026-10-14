# Claude: Japan launch, Dyra på Gården + Skredderen fra Damaskus
[CoS] Ready to paste. English only for all customer-facing copy (Japan market). Do NOT publish/merge without Havard's GO.

Source files on the box: /workspace/scandi-makers/launch/
- copy/PRODUCTS.md: 6 products, prices (NOK + JPY), copy, photo filenames
- copy/BRAND-STORIES.md: both brand stories
- img/*.jpg: photos (converted from HEIC). Logos: /workspace/scandi-makers/logo/final/

## Brand roles (Havard): copy must follow these
- Scandi Japandi Collection = CURATED PLATFORM for Nordic design craft. Not a producer. Never "our wool", "we make", "from our farm". Each product is credited to its maker ("by Dyra på Gården").
- Stammehandverk = collective that designs and produces (wool, natural-fibre clothing, made-to-measure tailoring, art craft). "We make" OK, in Norwegian like the site.
- Kita no Te = magazine (editorial), not a shop.
- HIERARCHY: Stammehandverk (collective) → brands Dyra på Gården (wool) and Skredderen fra Damaskus (made-to-measure tailoring). Scandi Japandi Collection = independent curated platform (goal: 500+ Nordic designers/producers); Stammehandverk is one of the makers presented. Credit as "Stammehandverk / Dyra på Gården". The Scandi Japandi bio/profile names no individual makers.

## Image rule (Havard)
- Product LISTING images = ONLY the real photos as studio cutouts from /workspace/scandi-makers/launch/product-studio/ (IMG_<id>_studio_2000x2500.jpg for 4:5, IMG_<id>_studio_2000x2000.jpg for square). The product is not altered (cutout + global grading only).
- AI-generated images (instagram/ai/) are ONLY for Instagram/Substack. NEVER on product pages.
- IMG_5476 (cardigan): the photo is cropped at the frame edge. Use it, but replace it with a new photo when Havard takes one.

## Tasks
1. **Scandi Japandi Collection:** add the 6 Dyra wool products from copy/PRODUCTS.md, using exactly those titles, prices (show JPY first, NOK second) and photos. Mark them as one-of-a-kind (stock = 1). Fields marked [CONFIRM] stay hidden or read "Details on request" until the farm confirms. Never guess fibre content.
2. **Brand pages:** Both brands are made at Langrønningen, a farm in Norway; link the two pages to each other ("Also made at Langrønningen"). Create "Dyra på Gården" and "Skredderen fra Damaskus" pages with the stories and logos (light logo on dark backgrounds, dark logo on light). Interview placeholders must NOT be visible on the live site; leave them out until we have content.
3. **Skredderen:** add 4 made-to-measure listings ("from" prices: shirt 4,800 NOK/¥79,800, trousers 6,500/¥107,800, jacket 12,800/¥212,800, alteration 1,200/¥19,800, an enquiry or booking button rather than add-to-cart). Wording: "made to measure / skreddersøm etter mål". No images exist yet, so use the logo as a placeholder image.
4. **stammehandverk.no:** all products (the 6 Dyra pieces + Skredderen) also go here. The site is on Netlify and has no GitHub repo yet. Create a repo (e.g. havardfurulund-rgb/stammehandverk), import the current site source (Netlify deploy download, or rebuild if the source is unavailable), and connect Netlify to the repo for continuous deploys. Report what you needed from Havard (Netlify access).
5. **Raise all prices:** every existing Scandi Japandi product goes up to match the premium level, roughly +40–80%, so that nothing undercuts the hand-knit pieces (¥29,800–¥198,000). Send me a before/after table before merging.
6. One PR per site. Add a JPY price display with a fixed rate of 16.6 (configurable).

Out of scope: no ads, no SoMe, no emails. CoS handles the push after GO.
