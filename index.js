'use strict'

/**
 * A Node.JS reference implementation of the Bitfinex REST APIs
 *
 * To use, construct a new instance of either the {@link RESTv1} or
 * {@link RESTv2} classes. All API methods return promises and accept a
 * callback as the last parameter; the callback will be called with `(error,
 * response)`.
 *
 * To minimize the data sent over the network the transmitted data is
 * structured in arrays. In order to reconstruct key / value pairs, set
 * `opts.transform` to `true` when creating an interface.
 *
 * @license MIT
 * @module bfx-api-node-rest
 * @example <caption>query candles</caption>
 * const debug = require('debug')('bfx:api:rest:examples:candles')
 * const { RESTv2 } = require('bfx-api-node-rest')
 * const rest = new RESTv2({ transform: true })
 *
 * const SYMBOL = 'tBTCUSD'
 * const TIME_FRAME = '1m'
 *
 * const candles = await rest.candles({
 *   timeframe: TIME_FRAME,
 *   symbol: SYMBOL,
 *   query: {
 *     start: Date.now() - (24 * 60 * 60 * 1000),
 *     end: Date.now(),
 *     limit: 1000
 *   }
 * })
 *
 * const [lastCandle] = candles
 *
 * debug('recv %d candles for %s %s', candles.length, SYMBOL, TIME_FRAME)
 * debug('latest %s', JSON.stringify({
 *   mts: new Date(lastCandle.mts).toLocaleString(),
 *   open: lastCandle.open,
 *   high: lastCandle.high,
 *   low: lastCandle.low,
 *   close: lastCandle.close,
 *   volume: lastCandle.volume
 * }, null, 2))
 *
 * @example <caption>query trades</caption>
 * const debug = require('debug')('bfx:api:rest:examples:trades')
 * const { RESTv2 } = require('bfx-api-node-rest')
 * const rest = new RESTv2({ transform: true })
 *
 * const SYMBOL = 'tBTCUSD'
 * const trades = await rest.trades(SYMBOL)
 * const [lastTrade] = trades
 *
 * debug('recv %d trades for %s', trades.length, SYMBOL)
 * debug('last %s', JSON.stringify({
 *   mts: new Date(lastTrade.mts).toLocaleString(),
 *   price: lastTrade.price,
 *   amount: lastTrade.amount,
 *   id: lastTrade.id
 * }, null, 2))
 */

module.exports = {
  RESTv1: require('./lib/rest1'),
  RESTv2: require('./lib/rest2')
}
