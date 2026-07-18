# Aitch website

Static site, zero build step. Two routes:

| Route | File | For |
|---|---|---|
| `/` | `index.html` | **Product landing** — value prop, target user, how it works, pricing, CTA to the Telegram bot |
| `/project` | `project.html` | **Project hub** — team, solution, architecture, Stage 1 → Stage 2 → pilot roadmap, getting started |

`cleanUrls` in `vercel.json` serves `project.html` at `/project` (no `.html` suffix).

## Run locally

```bash
cd site
npx serve .            # → http://localhost:3000
# or
python -m http.server  # → http://localhost:8000
```

## Deploy to Vercel

The fastest path (no framework, no build):

```bash
cd site
npx vercel            # preview deploy
npx vercel --prod     # production
```

Or from the Vercel dashboard: **New Project → import the repo → set Root Directory to
`site` → Framework Preset: Other → Deploy.** There is no build command and no output
directory to configure — Vercel serves the static files directly.

## Design constraints

- **Palette: red + blue only.** No green anywhere — status is shown with `DONE` / `OPEN` /
  `DRAFT` badges in blue / red / neutral, never colour-coded green.
- Single shared stylesheet (`styles.css`), system fonts, no external JS or fonts — loads
  instantly and has nothing to break.
- The primary CTA everywhere is the Telegram bot:
  [t.me/harshils_hackathon_claw_bot](https://t.me/harshils_hackathon_claw_bot).

> Update the GitHub links (currently pointing at the owner profile) to the repository URL
> once the repo is pushed.
