# First Step School — Daily Lesson-Plan Generator

Auto-generates a branded **PNG poster** of tomorrow's class plan from a teacher's
diary photo, using **Groq LLM** for OCR + structuring and **`@vercel/og`** for
PNG export.

> School: **First Step School, Saurabh Vihar** • Built for UKG and primary classes.

## Live flow

1. Teacher opens the URL on phone.
2. Picks **class** → uploads diary photo (or types text).
3. Groq Vision reads the page → Groq LLM structures it into JSON.
4. App renders a 1600×2520 PNG poster (parents section + teachers video brief).
5. Principal approves → PNG broadcast on parent WhatsApp group.

## Quick start

```bash
git clone git@github.com:bhupenderkumar/firststep-daily.git
cd firststep-daily
cp .env.example .env.local       # add GROQ_API_KEY at minimum
npm install
npm run dev
```

Open <http://localhost:3000>, upload a sample diary photo and click **Generate
Plan**. The PNG opens at `/api/render?id=<plan-id>`.

## Deploy

```bash
npx vercel link
npx vercel env add GROQ_API_KEY
git push                # auto-deploys on Vercel
```

Set a Vercel Cron in the dashboard pointing at `/api/cron` for nightly teacher
reminders.

## Architecture

See [`AUTOMATED-DAILY-PLAN-SYSTEM.md`](../AUTOMATED-DAILY-PLAN-SYSTEM.md) for
the full design doc.

```
Teacher → Next.js (Vercel) → Groq Vision + LLM → @vercel/og → PNG → WhatsApp
```

## Key files

| Path | Purpose |
|---|---|
| `app/page.tsx` | Teacher upload form |
| `app/api/extract/route.ts` | Groq vision + JSON structuring |
| `app/api/render/route.ts` | JSX → PNG via `@vercel/og` |
| `components/PlanPoster.tsx` | Poster layout (school logo, sections) |
| `lib/groq.ts` | Groq client + system prompt |
| `lib/schema.ts` | Zod schema for the structured plan |

## Models

- Vision OCR: `meta-llama/llama-4-scout-17b-16e-instruct`
- Structuring: `llama-3.3-70b-versatile`

## License

Private — © First Step School, Saurabh Vihar.
