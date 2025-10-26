<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tssegUeKaaJuzTBXyIT3q3NqBweu3zkh

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Netlify

1. Create a new site on [Netlify](https://app.netlify.com/) and connect it to your Git repository (or use the Netlify CLI with `netlify init`).
2. Ensure the following build settings either match the defaults in `netlify.toml` or are configured in the Netlify UI:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. Configure the required environment variables under **Site settings → Build & deploy → Environment**:
   - `VITE_API_URL=/.netlify/functions/api`
   - `DATABASE_URL` pointing at your Prisma database
   - `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` for the Vercel Postgres client (if applicable)
   - `GEMINI_API_KEY` for Gemini integrations
4. Trigger a deploy (either via Git push or from the Netlify dashboard). Netlify will build the React app and bundle the serverless API function automatically.
5. Once deployed, all `/api` requests will be proxied to the Netlify Function defined in `netlify/functions/api.ts` thanks to the redirect in `netlify.toml`.
