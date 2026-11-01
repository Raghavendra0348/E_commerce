# Interface languages

The storefront and admin header include language selectors for English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali and Marathi. Switching languages updates supported interface labels immediately without reloading or navigating away. The browser stores `storefront_language`; other tabs synchronize through the storage event. Invalid preferences fall back to English, and selection still works when storage is blocked.

`Frontend/src/lib/translations.js` contains the source-English dictionary. Each translation row follows the order **HI, TA, TE, KN, ML, BN, MR**. `useTranslation()` supplies `t(source, values)`, the selected code and an Indian locale. `<T>` translates React text, while shared buttons translate their string children without manipulating the DOM. `LanguageSync` updates the document's language metadata and handles cross-tab changes. No translation service or additional library is required.

Covered copy includes navigation, category labels, search placeholder, common buttons, filters/sorting, homepage collection headings, account/order labels, checkout steps and several form labels. Unknown copy falls back to English. Product names/descriptions, customer reviews, addresses, API error messages, marketing text embedded in images and untranslated longer copy remain in their original language. This is interface localization, not automatic translation of catalog data.

To extend coverage, add a complete seven-language row and wrap source copy in `<T>` or call `t()`. `node Frontend/scripts/localize-ui.mjs` can migrate supported JSX text and metadata labels; review the resulting diff. Placeholder names such as `{name}` must remain present in every language. Regional-language copy should receive native-speaker review before release.

Tests cover all dictionary rows, live selection and return to English, preserving search/cart/route state, browser-language metadata, cross-tab updates, storage failures, and restoring a saved preference on initialization.
