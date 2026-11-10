'use strict'

const test = require('brittle')
const http = require('http')
const REST2 = require('../../lib/rest2')

const PORT = 1338
const bhttp = new REST2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: `http://localhost:${PORT}`
})

const testResBody = `[1765.3,
  0.56800816,
  1767.6,
  1.3874,
  -62.2,
  -0.034,
  1765.3,
  14063.54589155,
  1834.2,
  1726.3 ]`

test('rest2 api client', async (t) => {
  let server = null

  const closeServer = () => new Promise((done) => {
    if (server) {
      server.close(() => {
        server = null
        done()
      })
    } else {
      done()
    }
  })

  await t.test('gets a response as JSON', async (t) => {
    t.teardown(closeServer)
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(testResBody)
    })

    return new Promise((resolve) => {
      server.listen(PORT, () => {
        bhttp.ticker({ symbol: 'tBTCUSD' }, (err, res) => {
          t.is(err, null)
          t.alike(res, JSON.parse(testResBody))

          resolve()
        })
      })
    })
  })
})
