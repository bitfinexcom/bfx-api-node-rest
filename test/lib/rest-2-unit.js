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
})
