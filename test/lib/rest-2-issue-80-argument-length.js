'use strict'

const test = require('brittle')
const http = require('http')
const REST2 = require('../../lib/rest2')

// each test starts its own server: don't reuse keep-alive sockets (Node 19+ default)
http.globalAgent = new http.Agent({ keepAlive: false })

const PORT = 1337
const bhttp = new REST2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: `http://localhost:${PORT}`
})

const testResBody = '["ente", "gans", "scholle"]'

test('rest2 api client: issue 80 - argumment length auth request', async (t) => {
  let server = null

  const startServer = () => new Promise((done) => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(testResBody)
    })

    server.listen(PORT, done)
  })

  const closeServer = () => {
    server.close()
  }

  await t.test('errors if no payload defined', async (t) => {
    await startServer()
    t.teardown(closeServer)
    await bhttp._makeAuthRequest('/auth/r/orders')
  })

  await t.test('succeeds with the right argument length', async (t) => {
    await startServer()
    t.teardown(closeServer)
    const res = await bhttp._makeAuthRequest('/auth/r/orders', {})

    t.alike(res, ['ente', 'gans', 'scholle'])
  })
})
