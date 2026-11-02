# Tree: concept mock

A clickable prototype of a tree-sponsorship website for planting in Nepal. It is a design study, not a product.

- Nothing is for sale. No payment is taken, no email is stored, and no request leaves the site.
- Every number is sample data. There are no real partners, reviews, customers or awards.
- The site makes no carbon or offset claims.
- Working name "Rukh" is a placeholder.

## Run it

- Build: `python3 build.py` (Python 3, no packages). It reads `src/` and writes `docs/`.
- Open: `python3 -m http.server --directory docs`, then http://127.0.0.1:8000
- Live copy: GitHub Pages, branch `main`, folder `/docs`.

## Layout

- `src/pages/` page bodies, `src/partials/` header, footer and head, `src/svg/` inline drawings.
- `docs/assets/style.css` and `docs/assets/app.js` are written by hand. Everything else in `docs/` is built.

GitHub Pages terms do not allow running an online business there, so a real shop needs other hosting.
