# GRAB AI Tutor server

A small Vercel serverless backend for the GRAB Tutor HTML app.

## Deploy
1. Import this repository into Vercel.
2. In Vercel Project Settings -> Environment Variables, add:
   - `OPENAI_API_KEY` = your secret OpenAI API key
   - `OPENAI_MODEL` = `gpt-5-mini` (optional)
3. Redeploy after adding environment variables.
4. Your tutor endpoint is `https://YOUR-VERCEL-PROJECT.vercel.app/api/chat`.

Never put the API key in the HTML file or share it in chat.

## Request shape
POST JSON: `{ "message": "...", "history": [], "program": [], "registers": [], "pc": 0 }`

Response JSON: `{ "reply": "..." }`
