# Amazon.in guide import

Implemented and inspected on 2 November 2026 from the public [SiteStyleGuide page](https://sitestyleguide.com/amazon.in#top). This extends the existing storefront redesign and preserves the festival-card alignment correction.

## What was extracted and applied

| Guide data | How the clone uses it |
| --- | --- |
| 16 colors | All four neutrals and twelve accent colors are saved in the manifest and generated CSS. Existing storefront color variables now resolve to the imported values, including text, links, navigation, availability and promotional accents. |
| Three gradients | Saved exactly in the manifest. The gold gradient's obsolete `top` syntax is normalized to `to bottom` for browsers. Gold price ribbons use this generated gradient. |
| Type scale | Imported heading sizes from 28/36 down to 12/16, body 14/20, paragraph 12/12 and small/link/button values. General headings use the imported scale; card-specific layouts keep their own responsive sizing. |
| Five font-stack records | The guide's JSON also lists Ember Regular and Modern Text. Headings prefer Amazon Ember, festival headings prefer Modern Display, and body text uses Arial. These are font preferences, not downloaded font binaries. |
| Six radii and four shadow samples | Imported radii feed existing element shapes. Focused form controls and buttons use the guide's blue/white focus shadow. Existing surface shadows remain consistent with the extracted samples. |
| Eight breakpoints and six content widths | Preserved as reference variables. The catalog adapts relevant breakpoints into two phone columns, three from 1000px, four from 1280px and five from 1700px. These column counts are project choices: the guide does not provide grid-template rules. Existing page-specific widths and phone navigation remain in place. |
| ICO favicon | Downloaded and visually checked: an orange Amazon smile. Served locally from `/brand/amazon-reference.ico` and linked in `Frontend/index.html`. |
| Guide-labelled logo PNG | Downloaded and visually checked: it actually says Free Delivery / Easy Returns. Archived for evidence; the existing Amazon wordmark is retained. |

## How the data reaches the UI

Run from the repository root:

```powershell
node scripts/scrape-amazon-reference.mjs
```

The script reads the public HTML token blocks and parses the JSON and CSS values without executing the page's scripts. It validates the expected site, palette count and asset formats before writing files. It does not use the account-only download links or install any packages.

1. `Docs/reference/amazon-in.json` contains the extracted values, source URLs, retrieval time, limitations and asset SHA-256 hashes.
2. `Frontend/src/styles/reference/amazon-in.tokens.css` exposes the published variables with an `--ssg-` prefix to avoid colliding with application tokens.
3. `Frontend/src/main.jsx` loads the generated file before `amazon-reference.css`.
4. Existing `--amazon-*` variables refer to those imported values, so components continue using the same local design API while their values come from the guide.

For example, the guide's Deep Royal Blue becomes `--ssg-colour-deep-royal-blue`, then `--amazon-link`, then the rendered link and focus styles. Changing the imported value updates its consumers without editing each component. Re-run the script only when intentionally refreshing the reference; review changed assets visually before using them. Shadows were transcribed from the Elements section, which does not include them in its downloadable token block.

## What the guide does not supply

It is an unofficial extraction from a desktop capture, not Amazon's component source. It does not include full React components, exact grid column definitions, all mobile layouts or downloadable Amazon Ember font binaries. Its own text says unavailable fonts use a stand-in. No Ember font file is bundled or fetched by this change; this machine renders the Arial fallback. Installing or adding actual Ember files would require obtaining those files separately.

The mislabeled logo can be inspected at `Docs/reference/amazon-in-labelled-logo.png`. Applying it as the navbar logo would replace the wordmark with delivery/returns text, so it is deliberately excluded from the application assets.

## Validation

- Production build passes; all 92 existing frontend tests pass across 26 files.
- Browser checks confirmed imported runtime color values, Arial body text and the local ICO favicon configuration.
- Catalog checks at 1000/1280/1700/390/320px returned 3/4/5/2/2 columns respectively, with zero horizontal document overflow at every width.
- Desktop home, phone home, phone catalog and wide catalog were visually inspected. Existing festival-card controls and spacing remain present.
- Captures are under the ignored `output/playwright/guide-tokens-*.png` paths. Existing development servers were reused and left running.

No application dependencies, backend changes or database migrations were needed. The favicon and style data are local, so using them adds no requests to SiteStyleGuide during normal browsing.
