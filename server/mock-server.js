// Simple SSE + items mock server for local testing
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = process.env.MOCK_PORT || 4000

let clients = []
let idCounter = 1000

// load sample items
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'sample.json'), 'utf8'))
let items = sample.items.slice(0, 8)

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

  res.writeHead(404)
  res.end('not found')
})

server.listen(PORT, () => {
  console.log(`Mock server listening http://localhost:${PORT}`)
})

// periodic new items
setInterval(() => {
  const newItem = {
    id: `mock-${++idCounter}`,
    title: `Mock Item ${idCounter}`,
    price: `$${(Math.random() * 500 + 20).toFixed(0)}`,
    image: '/assets/sample1.jpg',
    whatsapp: 'https://wa.me/000000000',
    group: 'MockGroup',
    time: 'now',
  }
  items.unshift(newItem)
  if (items.length > 100) items.pop()
  broadcast(newItem)
  console.log('broadcast', newItem.id)
}, 5000)
