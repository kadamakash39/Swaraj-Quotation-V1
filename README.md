<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/cf50c42e-e9c9-44e5-bbbe-8e0a1ceea0ef

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and add:
   - `GEMINI_API_KEY` for AI features
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. In Supabase, create a table named `app_state` with these columns:
   - `key` (text, primary key)
   - `value` (jsonb)
4. Run the app:
   `npm run dev`
