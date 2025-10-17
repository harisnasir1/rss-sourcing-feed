// Proxies the upstream listing endpoint so the frontend can call /api/product/getlisting
// without exposing secrets. Configure env vars in Vercel:
// - RUNPOD_URL: https://.../api/product/getlisting (your upstream)
// - RUNPOD_KEY: optional API key
export default async function handler(req: any, res: any) {
  try {
    const upstream = process.env.RUNPOD_URL
    if (!upstream) {
      res.status(500).json({ error: 'RUNPOD_URL not set' })
      return
    }

    // Preserve incoming query string on the upstream URL
    const url = new URL(upstream)
    for (const [k, v] of Object.entries(req.query)) {
      if (Array.isArray(v)) v.forEach((val) => url.searchParams.append(k, String(val)))
      else url.searchParams.set(k, String(v))
    }

    const headers: Record<string, string> = { accept: 'application/json' }
    const key = process.env.RUNPOD_KEY
    if (key) {
      headers['authorization'] = `Bearer ${key}`
      headers['x-api-key'] = key
    }

    const r = await fetch(url.toString(), { headers })
    const text = await r.text()
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8'
    res.status(r.status).setHeader('content-type', ct).send(text)
  } catch (err: any) {
    res.status(502).json({ error: 'Upstream fetch failed', detail: err?.message || String(err) })
  }
}
