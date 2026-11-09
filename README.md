# Sleekmirror

Android app that looks at one outfit photo and scores outfit, grooming, and presentation for a chosen occasion. The photo is sent to OpenAI for that check, then dropped. The app keeps the written result, not the image.

The client is a Nuxt app inside Capacitor. The same Nuxt process serves the API (Nitro) against MongoDB.

## Requirements

- Node.js 22
- A MongoDB database
- An OpenAI API key
- Android Studio, with SDK 36, to run the app on a device or emulator

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server is [http://localhost:3000](http://localhost:3000). It includes the `/api` routes.

`npm run dev` does not read `API_BASE`. The client uses the API host set in `nuxt.config.ts`. Production builds (`npm run build:server`, `npm run cap:sync`) read `API_BASE` and fall back to `https://sleekmirror-api.convenotes.com`.

## Environment

Copy `.env.example` to `.env`. Nuxt maps `NUXT_*` names onto `runtimeConfig`.

| Variable | Used for |
| --- | --- |
| `NUXT_MONGODB_URI` | Database connection. Required for the API. |
| `NUXT_OPENAI_API_KEY` | Outfit checks. |
| `NUXT_JWT_SECRET` | Access tokens. Dev has a built-in fallback. Set a real value in production. |
| `NUXT_JWT_REFRESH_SECRET` | Refresh tokens. Same rule as the access secret. |
| `API_BASE` | API origin baked into production and Android builds. |

On the server, set the secrets as runtime environment variables, not image build args. `Dockerfile.prod` expects `NUXT_MONGODB_URI`, `NUXT_OPENAI_API_KEY`, `NUXT_JWT_SECRET`, and `NUXT_JWT_REFRESH_SECRET`.

`NUXT_R2_WORKER_URL` and `NUXT_R2_WORKER_SECRET` belong to the old media gateway in `worker/`. New checks do not upload photos. `POST /api/files` returns 410.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server with the API. |
| `npm run build` | Production Nuxt build. |
| `npm run build:server` | Same build with `NODE_ENV=production`. This is what CI runs. |
| `npm run preview` | Serve the production build locally. |
| `npm run cap:sync` | Static web build, then copy it and the native plugins into `android/`. |
| `npm run cap:run` | Open the already-synced Android project. |
| `npm run full` | `cap:sync`, then run on Android. |
| `npm run migrate:r2` | One-off move of old MongoDB file blobs to R2. Not part of normal development. |

## Android

Sync the web build into the native project, then launch it:

```bash
npm run full
```

After a web-only change, `npm run cap:run` is enough if the native project is already synced.

Release signing reads `android/key.properties` when that file exists. It stays out of git. A debug build does not need it. CI (`.github/workflows/android.yml`) runs `cap:sync` and `assembleDebug`.

The application id is `com.sleekmirror.app`.

## Updates

Live updates are manual Capgo downloads, not the plugin's auto-update. On launch, and again when Settings opens, the app reads `version.json` from `https://sleekmirror-capgo.acdev.app`. A newer bundle is downloaded and applied on the next restart. Settings shows the current bundle, the latest bundle, and a restart button when an update is waiting.

Pushing app changes to the `prod` branch runs `.github/workflows/capgo-production.yml`, which uploads the zip and publishes `version.json`. You can also start that workflow by hand.

## Backend deploy

`Dockerfile.prod` builds the Nuxt server and runs `node .output/server/index.mjs` on port 3000. Point Coolify at that Dockerfile and expose port 3000.

`.github/workflows/backend.yml` checks that `npm run build:server` produces `.output/server/index.mjs`.

## How a check works

1. The app signs in with the device id (`device:<identifier>`). That string is the Support ID in Settings.
2. The account gets 10 scans, renewed at the next UTC midnight.
3. The user confirms they are an adult and consents to sending the photo to OpenAI. Withdrawing consent blocks new checks.
4. `POST /api/checks/run` accepts the image as multipart form data, asks the model for a score, and stores the text result on the user. The image buffer is wiped in the request. It is not written to MongoDB or R2.

Email OTP routes exist, and the code is only logged on the server. The Settings UI for linking an email is hidden until mail sending exists.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | Vue client: camera, check history, settings. |
| `server/` | Nitro API, Mongoose models, auth. |
| `shared/` | Code imported by both sides, such as the daily scan allowance. |
| `android/` | Capacitor Android project. |
| `worker/` | Old Cloudflare Worker in front of R2. See `worker/README.md`. |
| `.github/workflows/` | Android build, backend build, and the production OTA upload. |
