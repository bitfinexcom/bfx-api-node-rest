'use strict'

const PORT = 1339

const test = require('brittle')
const http = require('http')
const RESTv1 = require('../../lib/rest1')

// each test starts its own server: don't reuse keep-alive sockets (Node 19+ default)
http.globalAgent = new http.Agent({ keepAlive: false })

test('rest integration test', async (t) => {
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

  await t.test('should get the fundingbook asks, zero bids, 100 asks', (t) => {
    t.plan(4)
    t.teardown(closeServer)

    const opts = { limit_bids: 0, limit_asks: 10 }
    const bhttp = new RESTv1({ url: `http://localhost:${PORT}` })

    const testResBody = [
      '{"bids":[],"asks":[',
      '{"rate":"72.25","amount":"67.5","period":30,"timestamp":"1495565109.0","frr":"No"},',
      '{"rate":"72.2501","amount":"297.58737203","period":2,"timestamp":"1495565054.0","frr":"No"},',
      '{"rate":"72.2601","amount":"200.0","period":2,"timestamp":"1495565002.0","frr":"No"},',
      '{"rate":"72.9535","amount":"211.8299","period":2,"timestamp":"1495565037.0","frr":"No"},',
      '{"rate":"73.0","amount":"1319.59397488","period":30,"timestamp":"1495564972.0","frr":"No"},',
      '{"rate":"76.0827","amount":"1511.9115692","period":30,"timestamp":"1495564965.0","frr":"Yes"},',
      '{"rate":"76.0827","amount":"19849.81630455","period":30,"timestamp":"1495564972.0","frr":"Yes"},',
      '{"rate":"76.0827","amount":"1052.68464219","period":30,"timestamp":"1495564972.0","frr":"Yes"},',
      '{"rate":"109.5","amount":"55.33131648","period":3,"timestamp":"1495565103.0","frr":"No"},',
      '{"rate":"153.1999","amount":"134.86","period":2,"timestamp":"1495565106.0","frr":"No"}]}'
    ].join('')

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp.fundingbook('USD', opts, (err, data) => {
        t.absent(err)
        t.ok(data)
        t.is(data.bids.length, 0)
        t.is(data.asks.length, 10)
      })
    })
  })

  await t.test('new_order -- post_only: postonly used and true', (t) => {
    t.plan(2)
    t.teardown(closeServer)

    const testResBody = '{}'
    const bhttp = new RESTv1({
      apiKey: 'dummykey',
      apiSecret: 'dummysecret',
      url: `http://localhost:${PORT}`
    })

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      const payload = JSON.parse(
        Buffer.from(req.headers['x-bfx-payload'], 'base64').toString('ascii')
      )

      t.is(payload.post_only, true)
      res.end(testResBody)
    })
    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', false, true, (err, data) => {
        t.absent(err)
      })
    })
  })

  await t.test('new_order -- post_only: postonly not used and hidden true', (t) => {
    t.plan(3)
    t.teardown(closeServer)

    const testResBody = '{}'
    const bhttp = new RESTv1({
      apiKey: 'dummykey',
      apiSecret: 'dummysecret',
      url: `http://localhost:${PORT}`
    })

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      const payload = JSON.parse(
        Buffer.from(req.headers['x-bfx-payload'], 'base64').toString('ascii')
      )

      t.is(payload.is_hidden, true)
      t.is(payload.post_only, undefined)
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', true, (err, data) => {
        t.absent(err)
      })
    })
  })

  await t.test('new_order -- post_only: postonly not used and hidden not used', (t) => {
    t.plan(3)
    t.teardown(closeServer)

    const testResBody = '{}'
    const bhttp = new RESTv1({
      apiKey: 'dummykey',
      apiSecret: 'dummysecret',
      url: `http://localhost:${PORT}`
    })

    server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      const payload = JSON.parse(
        Buffer.from(req.headers['x-bfx-payload'], 'base64').toString('ascii')
      )

      t.is(payload.is_hidden, undefined)
      t.is(payload.post_only, undefined)
      res.end(testResBody)
    })
    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', (err, data) => {
        t.absent(err)
      })
    })
  })
})
