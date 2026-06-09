# Gemini for Recruiters & Sourcers: From Intake to Search Strategy

An interactive **build-along** guide. You perform a real action at each step, copy ready
Gemini prompts, and tick a checklist that persists and drives a real progress bar.

**Live site:** https://danamove.github.io/gemini-recruiters-guide/

## What it covers
Turn messy intake notes, vague job descriptions, and scattered hiring manager feedback into
a clear, sourcing-ready search strategy using Gemini in Google Workspace. Eight steps, one
worked example (a senior product-security search) running through all of them:

1. Start with the messy intake
2. Clean the signal (facts vs assumptions)
3. Extract the real must-haves
4. Translate feedback into sourcing implications
5. Build the target profile
6. Produce the sourcing brief
7. Make it repeatable
8. Turn the workflow into a Gem (with full, copy-ready Gem instructions)

Plus two bonus sections: common mistakes, and how to judge whether the output is good.

## Technical
Fully static: HTML, CSS, JavaScript. No backend, no network dependencies, no binary assets
(the favicon and figures are inline). Progress is stored locally in `localStorage`.

- `index.html` content and all screens
- `style.css` visual system (`bx-` namespace, Gemini blue-to-purple palette)
- `app.js` navigation, checklist, progress, copy-to-clipboard

## Run locally
Open `index.html`, or serve the folder:

```bash
python -m http.server 8000
# then http://localhost:8000/index.html
```

## License
Original content. Free to use and learn from.
