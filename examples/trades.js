'use strict'

const { RESTv2 } = require('../')
const rest = new RESTv2({ transform: true })

const SYMBOL = 'tBTCUSD'

const run = async () => {
  const trades = await rest.trades(SYMBOL)
  const [lastTrade] = trades

  console.log('recv %d trades for %s', trades.length, SYMBOL)
  console.log('last %s', JSON.stringify({
    mts: new Date(lastTrade.mts).toLocaleString(),
    price: lastTrade.price,
    amount: lastTrade.amount,
    id: lastTrade.id
  }, null, 2))
}

try {
  run()
} catch (e) {
  console.log('error: %s', e.stack)
}
