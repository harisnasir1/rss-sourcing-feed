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

Backend integration
-------------------

This frontend expects a simple JSON API and an optional Server-Sent Events (SSE) stream to receive new items in real-time. The WhatsApp ingestion backend can implement the following endpoints:

- GET /api/items
	- Response: 200 OK
	- Body: JSON object { items: Item[] }
	- Used by the frontend on load to populate the initial feed. If this endpoint is unavailable, the app falls back to the bundled `src/data/sample.json`.

- SSE /api/stream
	- Content-Type: text/event-stream
	- Each event's data should be a single Item serialized as JSON (one item per event). Example event payload:

		data: {"id":"abc123","title":"Yeezy Boost 350","price":"$250","image":"/assets/sample1.jpg","whatsapp":"https://wa.me/....","group":"Sneaker Group","time":"2h"}

	- The frontend prepends received items to the top of the list so they animate on entry.

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

