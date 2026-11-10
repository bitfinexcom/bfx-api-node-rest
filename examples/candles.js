'use strict'

const { RESTv2 } = require('../')
const rest = new RESTv2({ transform: true })

const SYMBOL = 'tBTCUSD'
const TIME_FRAME = '1m'

const run = async () => {
  const candles = await rest.candles({
    timeframe: TIME_FRAME,
    symbol: SYMBOL,
    query: {
      start: Date.now() - (24 * 60 * 60 * 1000),
      end: Date.now(),
      limit: 1000
    }
  })

  const [lastCandle] = candles

  console.log('recv %d candles for %s %s', candles.length, SYMBOL, TIME_FRAME)
  console.log('latest %s', JSON.stringify({
    mts: new Date(lastCandle.mts).toLocaleString(),
    open: lastCandle.open,
    high: lastCandle.high,
    low: lastCandle.low,
    close: lastCandle.close,
    volume: lastCandle.volume
  }, null, 2))
}

try {
  run()
} catch (e) {
  console.log('error: %s', e.stack)
}
