# Festival banner color variants

The carousel now uses red, saffron orange, emerald green and royal purple in order. Home and kitchen retains the original red image. The other three banners are AI-edited color variants of the original Amazon artwork, rather than new official Amazon assets. Original JPG sources and provenance remain in `Frontend/public/banners/sources.json`.

Saved assets:
- `Frontend/public/banners/denim-orange.png`
- `Frontend/public/banners/ethnic-green.png`
- `Frontend/public/banners/fashion-purple.png`

Generated with the built-in imagegen tool. Prompt for each source image:

> Use case: precise-object-edit. Edit target: the attached original portrait festival banner. Change ONLY the broad red background/backdrop color to [color], including the empty upper area and lower outer background. Keep exact portrait composition and all product photographs completely unchanged in their original colors. Preserve gold border and string lights, sparkles, magenta/gold festival ribbons, all existing English promotional text and bank logos exactly as in source. Do not add any headings or text into the blank upper portion; website overlays its own heading there. Do not add arrows. Keep same 855:1368 aspect ratio and all original artwork fully visible, no cropping. Return just this single edited banner.

Colors: denim — rich warm saffron orange #e36b08; ethnic wear — deep emerald green #006b4f; fashion — rich royal purple #6b2690.

Original files retained; application links, carousel controls and overlay text stay functional. Each result was visually inspected before use.
