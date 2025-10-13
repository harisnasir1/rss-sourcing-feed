// Simple SSE + items mock server for local testing
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.MOCK_PORT || 4000

let clients = []
let idCounter = 1000

// load sample items
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'sample.json'), 'utf8'))
// preload up to 20 items so the feed is scrollable during local dev
let items = sample.items.slice(0, 20)

// images to rotate for generated mock items (use local assets in public/assets)
const IMAGES = ['/assets/placeholder_img.png']

// interval in ms for generating new mock items (can be overridden with MOCK_INTERVAL)
const INTERVAL = parseInt(process.env.MOCK_INTERVAL || '5000', 10)

function sendEvent(client, data) {
  client.write(`data: ${JSON.stringify(data)}\n\n`)
}

function broadcast(data) {
  clients.forEach((c) => sendEvent(c, data))
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/items') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ items }))
    return
  }

  if (req.url === '/api/stream') {
    res.writeHead(200, {
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': '*',
    })

    res.write('\n')
    clients.push(res)

    req.on('close', () => {
      clients = clients.filter((c) => c !== res)
    })

    return
  }

  if (req.url === '/api/emit') {
    // helpful testing endpoint: trigger a single broadcast immediately
    const newItem = createNewItem()
    items.unshift(newItem)
    if (items.length > 200) items.pop()
    broadcast(newItem)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true, item: newItem }))
    return
  }

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`Mock server listening http://localhost:${PORT}`)
})

// periodic new items
function createNewItem() {
  // omit image for generated mock items so the UI will rely on API images
  return {
    id: `mock-${++idCounter}`,
    title: `Mock Item ${idCounter}`,
    price: `$${(Math.random() * 500 + 20).toFixed(0)}`,
    whatsapp: 'https://wa.me/000000000',
    group: 'MockGroup',
    time: 'now',
  }
}

setInterval(() => {
  const newItem = createNewItem()
  items.unshift(newItem)
  if (items.length > 200) items.pop()
  broadcast(newItem)
  console.log('broadcast', newItem.id)
}, INTERVAL)
