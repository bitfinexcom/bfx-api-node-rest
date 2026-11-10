'use strict'
/* eslint camelcase: "off" */

const DNS = require('dns')
const test = require('brittle')
const _map = require('lodash/map')
const _keys = require('lodash/keys')
const _every = require('lodash/every')
const _values = require('lodash/values')
const _isArray = require('lodash/isArray')
const RESTv1 = require('../../lib/rest1')

const exists = (v) => v !== null && v !== undefined

test('REST v1', async (t) => {
  let skipPublic = process.env.SKIP_PUBLIC_REST

  if (!skipPublic) {
    await new Promise((done) => {
      DNS.resolve('api.bitfinex.com', (err) => {
        if (err) skipPublic = true
        done()
      })
    })
  }

  await t.test('errors', async (t) => {
    const bfx_rest = new RESTv1()
    const opts = { timeout: 5000 }
    await t.test('should error out if a bad endpoint is given', opts, async (t) => {
      await t.exception.all(bfx_rest.make_public_request())
    })
    await t.test('should fail on authenticated requests if no api_key and api_secret', opts, async (t) => {
      await t.exception.all(bfx_rest.account_infos())
    })
  })

  await t.test('public endpoints', async (t) => {
    const bfx_rest = new RESTv1()
    const opts = { timeout: 10000 } // bumped from 5k for moments of platform lag
    await t.test('should get a ticker', opts, (t) => {
      if (skipPublic) return

      t.plan(2)
      bfx_rest.ticker('BTCUSD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
      })
    })
    await t.test('should get the today endpoint', opts, (t) => {
      if (skipPublic) return

      t.plan(2)
      bfx_rest.today('BTCUSD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
      })
    })
    await t.test('should get the stats', opts, (t) => {
      if (skipPublic) return

      t.plan(2)
      bfx_rest.stats('BTCUSD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
      })
    })
    await t.test('should get the fundingbook', opts, (t) => {
      if (skipPublic) return

      t.plan(5)
      bfx_rest.fundingbook('USD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
        t.alike(_keys(data.bids[0]), ['rate', 'amount', 'period', 'timestamp', 'frr'])
        t.alike(_keys(data.asks[0]), ['rate', 'amount', 'period', 'timestamp', 'frr'])
        t.ok(_every([data.asks[0] + data.bids[0]]))
      })
    })

    await t.test('should get the orderbook', opts, (t) => {
      if (skipPublic) return

      t.plan(6)
      bfx_rest.orderbook('BTCUSD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
        t.alike(_keys(data), ['bids', 'asks'])
        t.alike(_keys(data.bids[0]), ['price', 'amount', 'timestamp'])
        t.alike(_keys(data.asks[0]), ['price', 'amount', 'timestamp'])
        t.ok(_every([data.asks[0] + data.bids[0]]))
      })
    })
    await t.test('should get recent trades', opts, (t) => {
      if (skipPublic) return

      t.plan(5)
      bfx_rest.trades('BTCUSD', (error, data) => {
        t.absent(error)
        t.ok(_isArray(data))
        t.is(data.length, 100)
        t.alike(_keys(data[0]), ['timestamp', 'tid', 'price', 'amount', 'exchange', 'type'])
        t.alike(
          _map(_values(data[0]), (v) => typeof (v)),
          ['number', 'number', 'string', 'string', 'string', 'string']
        )
      })
    })
    await t.test('should get recent lends', opts, (t) => {
      if (skipPublic) return

      t.plan(6)
      bfx_rest.lends('USD', (error, data) => {
        t.absent(error)
        t.ok(exists(data))
        t.ok(_isArray(data))
        t.is(data.length, 50)
        t.alike(_keys(data[0]), ['rate', 'amount_lent', 'amount_used', 'timestamp'])
        t.alike(
          _map(_values(data[0]), (v) => typeof (v)),
          ['string', 'string', 'string', 'number']
        )
      })
    })
    await t.test('should get symbols', opts, (t) => {
      if (skipPublic) return

      t.plan(2)
      bfx_rest.get_symbols((error, data) => {
        t.absent(error)
        t.is(data[0], 'btcusd')
      })
    })
    await t.test('should get symbol details', opts, (t) => {
      if (skipPublic) return

      t.plan(3)
      bfx_rest.symbols_details((error, data) => {
        t.absent(error)
        t.ok(exists(data))
        t.is(data[0].pair, 'btcusd')
      })
    })
  })
})
