# Vercel Deployment (Monorepo: apps/web + apps/api)

This repo contains two apps:
- Web (Next.js): `apps/web`
- API (Express): `apps/api`

Deploy them as separate Vercel projects.

## 1) Deploy API (already done)
- Project name: terra-data-api
- Root Directory: `apps/api`
- Framework Preset: Other (Node.js / Express)
- Environment: add any API secrets your server needs
- Resulting domain example: `https://terra-data-api.vercel.app`

## 2) Deploy Web (Next.js)
Create a NEW project in Vercel for the web UI.

Project Settings:
- Root Directory: `apps/web`
- Framework Preset: Next.js
- Build Command: automatic (default)
- Output Directory: `.next` (default)

Environment Variables:
- `NEXT_PUBLIC_API_URL` = `https://terra-data-api.vercel.app` (or your API URL)
- Optional: `MAPBOX_ACCESS_TOKEN`, `NASA_API_KEY`

The web app proxies requests to the API using Next.js rewrites (already configured):
- `/api/:path*` → `${NEXT_PUBLIC_API_URL}/api/:path*`
- `/health` → `${NEXT_PUBLIC_API_URL}/health`

After deploy, your web domain (example): `https://terra-data-web.vercel.app`

## 3) Redeploy when needed
- Push to `main` triggers a redeploy automatically.
- Force redeploy with an empty commit:
  ```sh
  git commit --allow-empty -m "chore: trigger redeploy"
  git push origin main
  ```
- Or Dashboard → Deployments → Redeploy (optionally clear cache).

## 4) Common issues
- JSON `{ "error": "Not found", "message": "Route / not found" }` at `/`:
  You deployed the API, not the web app. Ensure a separate project with `Root Directory: apps/web`.
- Logo missing: The web uses `/public/terra/logo.svg` (ensure file exists). Code has been updated to use `.svg`.
- API calls fail in production: set `NEXT_PUBLIC_API_URL` to your public API domain (not `localhost`).

---
Maintainer checklist:
- [ ] API project live at `apps/api` (Express)
- [ ] Web project live at `apps/web` (Next.js)
- [ ] `NEXT_PUBLIC_API_URL` set on the web project
- [ ] Optional tokens set (`MAPBOX_ACCESS_TOKEN`, `NASA_API_KEY`)
