# WhatsApp Sourcing Feed (Vite + React + TypeScript)

This is a starter scaffold for a sourcing feed UI that surfaces WhatsApp group posts.

Features:
- Vite + React + TypeScript
- Tailwind CSS for styling
- Sample feed with 'Message on WhatsApp' buttons

Setup (Windows PowerShell):

1. Install dependencies

```powershell
cd whatsapp-sourcing-feed
npm install
```

2. Run the dev server

```powershell
npm run dev
```

3. Build

```powershell
npm run build
npm run preview
```

Notes:
- This is a UI scaffold. The data in `src/data/sample.json` is static. Replace with your API or ingestion pipeline that processes WhatsApp group posts.
- Tailwind is configured in `tailwind.config.cjs` and PostCSS in `postcss.config.cjs`.

Local dev and external API notes
--------------------------------

If you're testing against the external RunPod endpoint directly, set `VITE_RUNPOD_URL` in the project's `.env` file (already added) to:

```
VITE_RUNPOD_URL=https://rmizhq2lxoty3l-4000.proxy.runpod.net/api/product/getlisting
```

Notes:
- If you run the dev server and still see HTML instead of JSON, it's likely a CORS or proxy issue. Check the browser console network tab for the response body.
- If the endpoint requires an API key, set `VITE_RUNPOD_KEY` in `.env` and the app will include it in requests.
- When using external endpoints in development, make sure the endpoint allows requests from your origin or use a proxy.

Backend integration
-------------------

This frontend expects a simple JSON API to return a list of items and can optionally subscribe to a real-time stream if your backend provides one. The frontend will normalize common payload shapes (array, { items }, { data: { items } }, { results }).

Item JSON shape

The frontend expects each Item to have the following shape:

{
	id: string,
	title: string,
	price: string,
	image: string,      // URL or path to an image the frontend can load
	whatsapp: string,   // link to open/chat on WhatsApp
	group?: string,
	time?: string
}

Notes for the backend dev:
- Avoid sending duplicate `id` values (the frontend deduplicates on id).
- For the SSE stream, send one JSON item per event (no array). The frontend handles malformed events gracefully.

