'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:rest:examples:trades')
const { RESTv2 } = require('../')
const rest = new RESTv2({ transform: true })

const SYMBOL = 'tBTCUSD'

const run = async () => {
  const trades = await rest.trades(SYMBOL)
  const [lastTrade] = trades

  debug('recv %d trades for %s', trades.length, SYMBOL)
  debug('last %s', JSON.stringify({
    mts: new Date(lastTrade.mts).toLocaleString(),
    price: lastTrade.price,
    amount: lastTrade.amount,
    id: lastTrade.id
  }, null, 2))
}

try {
  run()
} catch (e) {
  debug('error: %s', e.stack)
}
