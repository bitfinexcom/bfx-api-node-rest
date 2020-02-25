/* eslint-env mocha */
'use strict'

const PORT = 1339

const assert = require('assert')
const http = require('http')
const RESTv1 = require('../../lib/rest1')

describe('rest integration test', () => {
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

  it('should get the fundingbook asks, zero bids, 100 asks', (done) => {
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
        if (err) throw err
        assert.ok(data)
        assert.strictEqual(data.bids.length, 0)
        assert.strictEqual(data.asks.length, 10)
        done()
      })
    })
  })

  it('new_order -- post_only: postonly used and true', (done) => {
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

      assert.strictEqual(payload.post_only, true)
      res.end(testResBody)
    })
    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', false, true, (err, data) => {
        if (err) throw err
        done()
      })
    })
  })

  it('new_order -- post_only: postonly not used and hidden true', (done) => {
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

      assert.strictEqual(payload.is_hidden, true)
      assert.strictEqual(payload.post_only, undefined)
      res.end(testResBody)
    })

    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', true, (err, data) => {
        if (err) throw err
        done()
      })
    })
  })

  it('new_order -- post_only: postonly not used and hidden not used', (done) => {
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

      assert.strictEqual(payload.is_hidden, undefined)
      assert.strictEqual(payload.post_only, undefined)
      res.end(testResBody)
    })
    server.listen(PORT, () => {
      bhttp.new_order('btcusd', '0.1', '0.1', 'bitfinex', 'buy', 'exchange limit', (err, data) => {
        if (err) throw err
        done()
      })
    })
  })
})
