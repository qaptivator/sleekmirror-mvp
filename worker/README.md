# Sleekmirror Media Gateway (Cloudflare Worker + R2)

This Worker provides a secure, private gateway between the Sleekmirror backend/clients and your Cloudflare R2 bucket.

## Features
- **Private by Default**: Direct unauthenticated requests to images are completely blocked.
- **HMAC Signed URLs**: Clients access images using short-lived tamper-proof signed URLs (`?exp=...&sig=...`).
- **Internal Service Channel**: The Nuxt backend securely uploads, downloads (for GPT-4o analysis), and deletes images via `/internal/file/:key` authenticated with `X-Service-Key`.
- **Zero Egress Fees & Edge Caching**: Served via Cloudflare's global edge network.

---

## Deployment Instructions

### 1. Install Dependencies
Open a terminal in this `worker` directory:
```bash
cd worker
npm install
```

### 2. Login to Cloudflare via Wrangler
```bash
npx wrangler login
```
*(Or use your API token by setting `CLOUDFLARE_API_TOKEN`)*

### 3. Verify Bucket Name in `wrangler.toml`
Ensure `bucket_name` matches your Cloudflare R2 bucket:
```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "sleekmirror-storage"
```

### 4. Set the AUTH_SECRET on Cloudflare
Choose a strong random secret (e.g. 32-64 characters) and set it as an encrypted secret on Cloudflare:
```bash
npx wrangler secret put AUTH_SECRET
```
*Paste your chosen secret when prompted.*

### 5. Deploy the Worker
```bash
npx wrangler deploy
```
Once deployed, Cloudflare will output your Worker's URL (e.g., `https://sleekmirror-media-gateway.<subdomain>.workers.dev`).

---

## Backend Configuration
In your Sleekmirror root `.env`:
```env
NUXT_R2_WORKER_URL="https://sleekmirror-media-gateway.<subdomain>.workers.dev"
NUXT_R2_WORKER_SECRET="the-exact-same-secret-you-put-in-wrangler"
```
