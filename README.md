# mono-reports-web

Frontend for MONO's income tracker — **Next.js 16 + TypeScript + Tailwind 4**.
Talks to `mono-reports-api` over HTTP with a JWT (stored in `localStorage`).

## Run (local dev)

```bash
npm install
# .env.local already points at the local API:
#   NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev        # http://localhost:3001  (port matches the API's CORS_ORIGIN)
```

Make sure `mono-reports-api` is running first (see its README). Log in with the seeded
owner: `owner@mono.local` / `changeme123`.

## Pages

- `/login` — owner login
- `/dashboard` — брудний/чистий дохід за період, дохід за місяцями, топ-квіти, борги
- `/catalog` — квіти/матеріали з двома цінами (закупівельна + продажна)
- `/bouquets` — список букетів
- `/bouquets/[id]` — конструктор: додаєш квіти з каталогу → живий брудний і чистий дохід,
  витрати по букету, статуси (підтвердити / продати / клонувати / скасувати)
- `/expenses` — загальні витрати (оренда, зарплата, реклама…)

## Production

Point `NEXT_PUBLIC_API_URL` at the deployed API and set the API's `CORS_ORIGIN` to this
app's URL. Deploy on Vercel or Cloudflare.
