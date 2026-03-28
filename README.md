# Voice Health

Web app to log **food** (voice → OpenRouter → CalorieNinjas) and **calories burned**, track **remaining kcal** vs a maintenance goal from **Mifflin–St Jeor** + activity. Stack: **React (Vite)**, **Firebase** (anonymous auth + Firestore), **GitHub Pages**.

## Setup

1. **Clone** and `npm install`.
2. Copy **`.env.example`** → **`.env`** and fill Firebase web app config (`VITE_FIREBASE_*`). Optional: `VITE_OPENROUTER_API_KEY` and `VITE_CALORIENINJAS_API_KEY` to skip the in-app key step.
3. In [Firebase Console](https://console.firebase.google.com/): enable **Anonymous** sign-in; create Firestore database.
4. Deploy **Firestore rules** from [`firestore.rules`](firestore.rules) (Console → Firestore → Rules).

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

Output in `dist/`. The build copies `index.html` to `404.html` for GitHub Pages SPA routing.

For a **project site** (`username.github.io/repo/`), set `VITE_BASE=/repo/` when building (and matching `base` in `vite.config.ts` via env).

## GitHub Pages (Actions)

Workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds and deploys. Configure repository **Settings → Pages** to use **GitHub Actions**. Add **repository secrets** for Firebase (and optional API keys). Optional variable **`VITE_BASE`** for project pages.

## Privacy / prototype note

API keys in the client bundle are visible to anyone who loads the site. Suitable for a **private** prototype; use a backend proxy for production.

## License

Private / use at your own risk. Not medical advice.
