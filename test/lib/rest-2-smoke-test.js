/* eslint-env mocha */
'use strict'

const assert = require('assert')
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

describe('rest2 api client', () => {
  let server = null

  afterEach((done) => {
    if (server) {
      server.close(() => {
        server = null
        done()
      })
    } else {
      done()
    }
  })

  it('gets a response as JSON', async () => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(testResBody)
    })

    return new Promise((resolve) => {
      server.listen(PORT, () => {
        bhttp.ticker('tBTCUSD', (err, res) => {
          assert.strictEqual(err, null)
          assert.deepStrictEqual(res, JSON.parse(testResBody))

          resolve()
        })
      })
    })
  })
})
