'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:rest:examples:symbol-details')
const { RESTv2 } = require('../')
const rest = new RESTv2({
  transform: true,
  url: 'https://api-pub.bitfinex.com',
  urlV1: 'https://api.bitfinex.com'
})

const run = async () => {
  const symbols = await rest.symbolDetails()

  debug('recv %d symbols', symbols.length)
  debug('first five: %s', JSON.stringify(symbols.slice(0, 5), null, 2))
}

run().catch(e => debug('error: %s', e.stack))
