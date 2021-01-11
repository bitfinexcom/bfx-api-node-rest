/* eslint-env mocha */
'use strict'

const assert = require('assert')
const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')
const SocksProxyAgent = require('socks-proxy-agent')
const RESTv2 = require('../../lib/rest2')

// TODO: Move other tests here where appropriate (unit)

describe('RESTv2', () => {
  describe('default connection url', () => {
    it('is a static member on the class', () => {
      assert.ok(_isString(RESTv2.url) && !_isEmpty(RESTv2.url))
    })
  })

  describe('getURL', () => {
    it('returns the URL the instance was constructed with', () => {
      const rest = new RESTv2({ url: 'test' })
      assert.strictEqual(rest.getURL(), 'test', 'instance does not use provided URL')
    })
  })

  describe('usesAgent', () => {
    it('returns true if an agent was passed to the constructor', () => {
      const rest = new RESTv2({
        agent: new SocksProxyAgent('socks4://127.0.0.1:9998')
      })

      assert.ok(rest.usesAgent(), 'usesAgent() does not indicate agent presence when one was provided')
    })

    it('returns false if no agent was passed to the constructor', () => {
      const rest = new RESTv2()
      assert.ok(!rest.usesAgent(), 'usesAgent() indicates agent presence when none provided')
    })
  })

  describe('trades', () => {
    it('correctly builds query string', (done) => {
      const rest = new RESTv2()

      rest._makePublicRequest = (url) => {
        assert.strictEqual(url, '/trades/tBTCUSD/hist?start=1&end=2&limit=3&sort=4')
        done()
      }

      rest.trades('tBTCUSD', 1, 2, 3, 4)
    })
  })

  describe('listener methods', () => {
    const testMethod = (name, url, method, ...params) => {
      describe(name, () => {
        it('calls correct endpoint', (done) => {
          const rest = new RESTv2()
          rest[method] = (reqURL) => {
            assert.strictEqual(reqURL, url)
            done()
          }
          rest[name](...params)
        })
      })
    }

    // TODO: add rest...
    testMethod('symbols', '/conf/pub:list:pair:exchange', '_makePublicRequest')
    testMethod('inactiveSymbols', '/conf/pub:list:pair:exchange:inactive', '_makePublicRequest')
    testMethod('futures', '/conf/pub:list:pair:futures', '_makePublicRequest')
    testMethod('ledgers', '/auth/r/ledgers/hist', '_makeAuthRequest')
    testMethod('ledgers', '/auth/r/ledgers/USD/hist', '_makeAuthRequest', 'USD')
    testMethod('publicPulseProfile', '/pulse/profile/Bitfinex', '_makePublicRequest', 'Bitfinex')
    testMethod('addPulse', '/auth/w/pulse/add', '_makeAuthRequest')
    testMethod('addPulseComment', '/auth/w/pulse/add', '_makeAuthRequest', { parent: 'parent', content: 'content' })
    testMethod('fetchPulseComments', '/auth/r/pulse/hist', '_makeAuthRequest', { parent: 'parent' })
    testMethod('deletePulse', '/auth/w/pulse/del', '_makeAuthRequest')
    testMethod('publicPulseHistory', '/pulse/hist?limit=2&end=1589559090651', '_makePublicRequest', 2, 1589559090651)
    testMethod('pulseHistory', '/auth/r/pulse/hist', '_makeAuthRequest')
    testMethod('generateInvoice', '/auth/w/deposit/invoice', '_makeAuthRequest')
    testMethod('marketAveragePrice', '/calc/trade/avg?symbol=fUSD&amount=100', '_makePublicPostRequest', { symbol: 'fUSD', amount: 100 })
    testMethod('keepFunding', '/auth/w/funding/keep', '_makeAuthRequest', { type: 'type', id: 'id' })
    testMethod('cancelOrderMulti', '/auth/w/order/cancel/multi', '_makeAuthRequest', { id: [123] })
    testMethod('orderMultiOp', '/auth/w/order/multi', '_makeAuthRequest', [['oc_multi', { id: [1] }]])
  })
})
