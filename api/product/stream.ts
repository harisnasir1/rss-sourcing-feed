// Proxies an upstream SSE endpoint so the frontend can subscribe at /api/product/stream
// without exposing the upstream URL or secret. Configure in Vercel:
// - RUNPOD_SSE_URL: https://.../api/stream (your upstream SSE)
// - RUNPOD_KEY: optional API key
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const upstream = process.env.RUNPOD_SSE_URL
  if (!upstream) {
    res.status(500).json({ error: 'RUNPOD_SSE_URL not set' })
    return
  }

  res.writeHead(200, {
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Access-Control-Allow-Origin': '*',
  })
  res.write('\n')

  const headers: Record<string, string> = {}
  const key = process.env.RUNPOD_KEY
  if (key) {
    headers['authorization'] = `Bearer ${key}`
    headers['x-api-key'] = key
  }

  const controller = new AbortController()
  const signal = controller.signal

  try {
    const upstreamRes = await fetch(upstream, { headers, signal })
    if (!upstreamRes.ok || !upstreamRes.body) {
      const txt = await upstreamRes.text().catch(() => upstreamRes.statusText)
      res.write(`event: error\n`)
      res.write(`data: ${JSON.stringify({ status: upstreamRes.status, error: txt })}\n\n`)
      res.end()
      return
    }

    const reader = (upstreamRes.body as ReadableStream<Uint8Array>).getReader()
    const encoder = new TextDecoder()

    let closed = false
    req.on('close', () => {
      closed = true
      try { controller.abort() } catch {}
    })

    while (!closed) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        const chunk = encoder.decode(value)
        res.write(chunk)
      }
    }
  } catch (err: any) {
    res.write(`event: error\n`)
    res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })}\n\n`)
  } finally {
    res.end()
  }
}
