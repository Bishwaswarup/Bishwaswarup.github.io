# Setup

```bash
npm install --legacy-peer-deps
npm run dev        # local dev server with hot reload
npm run build      # production build into dist/
```

## Content

Everything on the site comes from **`src/data/universe.js`**:

- `profile`: the CV dossier (interests, education, papers, experience, skills, honours).
- `bodies`: one entry per project (planet), the lab (station) and the side project (dwarf planet).
  - `importance` (1–5) sets planet size; `paper` adds a ring and links to `profile.papers`.
  - `moons`: findings / methods / features. `weight` 3 = headline result, 2 = key method, 1 = detail. Moon size follows weight.
  - `satellites`: links (`kind`: `paper`, `doi`, `code`).
  - `orbit`: Keplerian elements `a, e, i, node, argp, M0` (degrees). Inclination encodes distance from astrodynamics/GNC.
- Stars and last-push dates are fetched live from the GitHub API (`src/hooks/useGithubRepos.js`).

## Hosting: root GitHub user site

The site is built for **https://bishwaswarup.github.io/** (`base: '/'` in `vite.config.js`).

1. On GitHub, open `Bishwaswarup/space-portfolio` → **Settings → General → Repository name**,
   rename it to exactly **`Bishwaswarup.github.io`**.
2. Locally, point the remotes at the new name:
   ```bash
   git remote set-url origin https://github.com/Bishwaswarup/Bishwaswarup.github.io.git
   git remote set-url github https://github.com/Bishwaswarup/Bishwaswarup.github.io.git
   ```
3. **Settings → Pages → Source = GitHub Actions** (already set; check it survived the rename).
4. Push to `main`. `.github/workflows/deploy.yml` builds and deploys. The site is live at
   `https://bishwaswarup.github.io/` a minute or two later.

The old `/space-portfolio/` URL stops working after the rename.

## Controls

Drag to orbit, scroll to zoom, click a planet / moon / satellite / the star.
Keys: ← → cycle bodies · P dossier · Space pause · Esc overview.
