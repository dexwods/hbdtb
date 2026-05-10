# hbdtb

Small birthday gift site hosted on GitHub Pages.

## Local run

You can open `index.html` directly, but **the microphone usually requires `https://` or `http://localhost`**.

If you have Python installed, run a local static server:

```bash
cd hbdtb
python -m http.server 5173
```

Then visit `http://localhost:5173`.

If you don't have Python yet, the easiest option is to **deploy to GitHub Pages** (below) and test there over HTTPS.

## GitHub Pages

In GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**

- Branch: `main`
- Folder: `/ (root)`