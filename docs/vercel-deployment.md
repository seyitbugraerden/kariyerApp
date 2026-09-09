# Vercel deployment

This project supports two build targets:

- `npm run build`: vinext / Cloudflare Workers for Sites.
- `npm run build:vercel`: Next.js for Vercel.

`vercel.json` selects the Next.js framework, the Vercel build command, and
the `.next` output directory. Keep the Vercel Root Directory at the repository
root. `postcss.config.mjs` enables Tailwind in the Next.js build.

The Vite preset publishes the Cloudflare build as static files, without a
Vercel-compatible application entrypoint. That can produce a successful
deployment that returns `404 NOT_FOUND` at `/`.

After pushing changes, check that the new Vercel build lists `/`, `/api/jobs`,
and `/api/platform-search`. Use the project's stable production domain;
an older deployment URL continues to refer to its original build.

For a local production check, run `npm run build:vercel`, then
`npm run start:vercel`. Configure runtime environment variables in Vercel
Project Settings; local `.env` files are not committed.
