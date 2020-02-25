/* eslint-env mocha */
'use strict'

const assert = require('assert')
const http = require('http')
const REST2 = require('../../lib/rest2')

const PORT = 1337
const bhttp = new REST2({
  apiKey: 'dummy',
  apiSecret: 'dummy',
  url: `http://localhost:${PORT}`
})

const testResBody = '["ente", "gans", "scholle"]'

describe('rest2 api client: issue 80 - argumment length auth request', () => {
  let server = null

  beforeEach((done) => {
    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(testResBody)
    })

    server.listen(PORT, done)
  })

  afterEach(() => {
    server.close()
  })

  it('errors if no payload defined', async () => {
    await bhttp._makeAuthRequest('/auth/r/orders')
  })

  it('succeeds with the right argument length', async () => {
    const res = await bhttp._makeAuthRequest('/auth/r/orders', {})

    assert.deepStrictEqual(res, ['ente', 'gans', 'scholle'])
  })
})
