'use strict'

const test = require('brittle')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const { SocksProxyAgent } = require('socks-proxy-agent')
const proxyquire = require('proxyquire')

const fetchCalls = []
const fetchStub = async (...args) => {
  fetchCalls.push(args)
  return null
}

const RESTv2 = proxyquire('../../lib/rest2', {
  'node-fetch': fetchStub
})

// TODO: Move other tests here where appropriate (unit)

test('RESTv2', (t) => {
  t.test('default connection url', (t) => {
    t.test('is a static member on the class', (t) => {
      t.ok(_isString(RESTv2.url) && !_isEmpty(RESTv2.url))
    })
  })

  t.test('getURL', (t) => {
    t.test('returns the URL the instance was constructed with', (t) => {
      const rest = new RESTv2({ url: 'test' })
      t.is(rest.getURL(), 'test', 'instance does not use provided URL')
    })
  })

  t.test('usesAgent', (t) => {
    t.test('returns true if an agent was passed to the constructor', (t) => {
      const rest = new RESTv2({
        agent: new SocksProxyAgent('socks4://127.0.0.1:9998')
      })

      t.ok(rest.usesAgent(), 'usesAgent() does not indicate agent presence when one was provided')
    })

    t.test('returns false if no agent was passed to the constructor', (t) => {
      const rest = new RESTv2()
      t.ok(!rest.usesAgent(), 'usesAgent() indicates agent presence when none provided')
    })
  })

  t.test('trades', (t) => {
    t.test('correctly builds query string', (t) => {
      t.plan(1)
      const rest = new RESTv2()

      rest._makePublicRequest = (url) => {
        t.is(url, '/trades/tBTCUSD/hist?start=1&end=2&limit=3&sort=4')
      }

      const params = { symbol: 'tBTCUSD', start: 1, end: 2, limit: 3, sort: 4 }
      rest.trades(params)
    })
  })

  t.test('request body', (t) => {
    t.test('excludes nullish', (t) => {
      const rest = new RESTv2()
      rest._apiKey = 'key'
      rest._apiSecret = 'secret'
      // the stubbed fetch resolves null, so the request rejects later; only the
      // request opts are under test here
      rest._makeAuthRequest('path', { a: 1, b: '', c: null, d: undefined }).catch(() => {})

      const lastCall = fetchCalls.at(-1)
      t.ok(lastCall, 'should be called')
      const reqOpts = lastCall[1]

      t.is.coercively(typeof reqOpts, 'object', 'argument isnt an object')
      t.alike(reqOpts.body, JSON.stringify({ a: 1, b: '' }))
    })
  })

  t.test('listener methods', (t) => {
    const testMethod = (name, url, method, ...params) => {
      t.test(name, (t) => {
        t.test('calls correct endpoint', (t) => {
          t.plan(1)
          const rest = new RESTv2()
          // async: some methods chain .then() on the request
          rest[method] = async (reqURL) => {
            t.is(reqURL, url)
          }
          rest[name](...params)
        })
      })
    }

    // TODO: add rest...
    testMethod('symbols', '/conf/pub:list:pair:exchange', '_makePublicRequest', {})
    testMethod('inactiveSymbols', '/conf/pub:list:pair:exchange:inactive', '_makePublicRequest', {})
    testMethod('futures', '/conf/pub:list:pair:futures', '_makePublicRequest', {})
    testMethod('ledgers', '/auth/r/ledgers/hist', '_makeAuthRequest', {})
    testMethod('ledgers', '/auth/r/ledgers/USD/hist', '_makeAuthRequest', { filters: 'USD' })
    testMethod('generateInvoice', '/auth/w/deposit/invoice', '_makeAuthRequest', {})
    testMethod('marketAveragePrice', '/calc/trade/avg?symbol=fUSD&amount=100', '_makePublicPostRequest', { symbol: 'fUSD', amount: 100 })
    testMethod('keepFunding', '/auth/w/funding/keep', '_makeAuthRequest', { type: 'type', id: 'id' })
    testMethod('cancelOrderMulti', '/auth/w/order/cancel/multi', '_makeAuthRequest', { id: [123] })
    testMethod('orderMultiOp', '/auth/w/order/multi', '_makeAuthRequest', { ops: [['oc_multi', { id: [1] }]] })
    testMethod('invalidateAuthToken', '/auth/w/token/del', '_makeAuthRequest', { authToken: 'token' })
  })
})
