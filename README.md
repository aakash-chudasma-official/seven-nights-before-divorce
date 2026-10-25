# Seven Nights Before Divorce

[Read the illustrated Hinglish novel](https://aakash-chudasma-official.github.io/seven-nights-before-divorce/)

An original contemporary Indian novel in natural Roman-script Hinglish. Twelve chapters, 30,190 story words, original cinematic artwork and a mobile-first reading interface.

## Reader

Adjustable18–28px text, light/dark/sepia themes, chapter navigation, bookmarks and saved reading position. Settings and progress stay in the same browser and origin; they do not automatically transfer to other devices. No login, payment integration, analytics or frontend paywall.

## Source and maintenance

- `chapters/`: definitive reviewed manuscript.
- `docs/`: buildless HTML/CSS/JavaScript reader, structured chapter JSON and compressed artwork. GitHub Pages serves main /docs.
- `MANUSCRIPT.md` and `MANUSCRIPT.html`: complete editable and offline reading copies.
- `WORD_COUNTS.json`: generated chapter counts and source hashes.
- `editorial/`: internal editorial report and source-bound review record.

After changing and reviewing story files, refresh the editorial hashes and run `python3 build_manuscript.py` followed by `python3 build_reader.py`. The reader build rejects changed story sources that do not match the reviewed hashes. To change appearance edit `docs/styles.css`; UI/cast text is in `docs/app.js`; metadata is in `docs/index.html`. Keep navigation and asset paths relative for repository subpaths.

## Rights and access

Copyright © 2026. All rights reserved. No open-source reuse licence is granted for the manuscript or artwork. Public-link distribution and a public repository do not restrict access to paying customers. The owner separately verifies Razorpay purchases and shares the reading link manually.
