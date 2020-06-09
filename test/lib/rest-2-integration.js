/* eslint-env mocha */
'use strict'

const assert = require('assert')
const RESTv2 = require('../../lib/rest2')
const { MockRESTv2Server } = require('bfx-api-mock-srv')

const getTestREST2 = (args = {}) => {
  return new RESTv2({
    apiKey: 'dummy',
    apiSecret: 'dummy',
    url: 'http://localhost:9999',
    ...args
  })
}

const getTestFundingOffer = () => ([
  41215275, 'fUSD', 1524784806000, 1524784806000, 1000, 1000, 'FRRDELTAVAR',
  null, null, 0, 'ACTIVE', null, null, null, 0, 30, 0, 0, null, 0, 0.00207328
])

const getTestFundingLoan = () => ([
  2993678, 'fUSD', -1, 1524786468000, 1524786468000, 200, 0, 'ACTIVE', null,
  null, null, 0.002, 7, 1524786468000, 1524786468000, 0, 0, null, 0, 0.002, 0
])

const getTestFundingCredit = () => ([
  26190108, 'fUSD', -1, 1524846786000, 1524846786000, 32.91281465, 0, 'ACTIVE',
  null, null, null, 0.002, 7, 1524786468000, null, 0, 0, null, 0, 0.002, 0, null
])

const auditTestFundingOffer = (fo = {}) => {
  assert.strictEqual(fo.id, 41215275)
  assert.strictEqual(fo.symbol, 'fUSD')
  assert.strictEqual(fo.mtsCreate, 1524784806000)
  assert.strictEqual(fo.mtsUpdate, 1524784806000)
  assert.strictEqual(fo.amount, 1000)
  assert.strictEqual(fo.amountOrig, 1000)
  assert.strictEqual(fo.type, 'FRRDELTAVAR')
  assert.strictEqual(fo.flags, 0)
  assert.strictEqual(fo.status, 'ACTIVE')
  assert.strictEqual(fo.rate, 0)
  assert.strictEqual(fo.period, 30)
  assert.strictEqual(fo.notify, false)
  assert.strictEqual(fo.hidden, false)
  assert.strictEqual(fo.renew, false)
  assert.strictEqual(fo.rateReal, 0.00207328)
}

const auditTestFundingLoan = (fl = {}) => {
  assert.strictEqual(fl.id, 2993678)
  assert.strictEqual(fl.symbol, 'fUSD')
  assert.strictEqual(fl.side, -1)
  assert.strictEqual(fl.mtsCreate, 1524786468000)
  assert.strictEqual(fl.mtsUpdate, 1524786468000)
  assert.strictEqual(fl.amount, 200)
  assert.strictEqual(fl.flags, 0)
  assert.strictEqual(fl.status, 'ACTIVE')
  assert.strictEqual(fl.rate, 0.002)
  assert.strictEqual(fl.period, 7)
  assert.strictEqual(fl.mtsOpening, 1524786468000)
  assert.strictEqual(fl.mtsLastPayout, 1524786468000)
  assert.strictEqual(fl.notify, false)
  assert.strictEqual(fl.hidden, false)
  assert.strictEqual(fl.renew, false)
  assert.strictEqual(fl.rateReal, 0.002)
  assert.strictEqual(fl.noClose, false)
}

const auditTestFundingCredit = (fc = {}) => {
  assert.strictEqual(fc.id, 26190108)
  assert.strictEqual(fc.symbol, 'fUSD')
  assert.strictEqual(fc.side, -1)
  assert.strictEqual(fc.mtsCreate, 1524846786000)
  assert.strictEqual(fc.mtsUpdate, 1524846786000)
  assert.strictEqual(fc.amount, 32.91281465)
  assert.strictEqual(fc.flags, 0)
  assert.strictEqual(fc.status, 'ACTIVE')
  assert.strictEqual(fc.rate, 0.002)
  assert.strictEqual(fc.period, 7)
  assert.strictEqual(fc.mtsOpening, 1524786468000)
  assert.strictEqual(fc.mtsLastPayout, null)
  assert.strictEqual(fc.notify, false)
  assert.strictEqual(fc.hidden, false)
  assert.strictEqual(fc.renew, false)
  assert.strictEqual(fc.rateReal, 0.002)
  assert.strictEqual(fc.noClose, false)
  assert.strictEqual(fc.positionPair, null)
}

describe('RESTv2 integration (mock server) tests', () => {
  let srv = null

  afterEach(async () => {
    if (srv) {
      await srv.close()
    }

    srv = null
  })

  // [rest2MethodName, finalMockResponseKey, rest2MethodArgs]
  const methods = [
    // public
    ['ticker', 'ticker.tBTCUSD', ['tBTCUSD']],
    ['tickers', 'tickers', [['tBTCUSD', 'tETHUSD']]],
    ['tickersHistory', 'tickers_hist', [['tBTCUSD', 'tETHUSD'], 'start', 'end', 'limit']],
    ['liquidations', 'liquidations.start.end.limit.sort', ['start', 'end', 'limit', 'sort']],
    ['stats', 'stats.key.context', ['key', 'context']],
    ['candles', 'candles.trade:30m:tBTCUSD.hist', [{ timeframe: '30m', symbol: 'tBTCUSD', section: 'hist' }]],
    ['statusMessages', 'status_messages.deriv.ALL', ['deriv', ['ALL']]],
    ['publicPulseProfile', 'public_pulse_profile.nickname', ['nickname']],
    ['publicPulseHistory', 'public_pulse_hist', ['limit', 'end']],
    // mocking server not really aware of public post requests so commenting out for now
    // ['marketAveragePrice', 'market_average_price.fUSD.100', [{ symbol: 'fUSD', amount: 100 }]],

    // private
    ['alertList', 'alerts.price', ['price']],
    ['alertSet', 'alert_set.type.symbol.price', ['type', 'symbol', 'price']],
    ['alertDelete', 'alert_del.symbol.price', ['symbol', 'price']],
    ['accountTrades', 'trades.BTCUSD.0.10.50.1', ['BTCUSD', 0, 10, 50, 1]],
    ['wallets', 'wallets'],
    ['logins', 'logins_hist', ['start', 'end', 'limit']],
    ['changeLogs', 'change_log', ['start', 'end', 'limit']],
    ['walletsHistory', 'wallets_hist.end.currency', ['end', 'currency']],
    ['activeOrders', 'active_orders'],
    ['orderHistory', 'orders.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['positions'],
    ['positionsHistory', 'positions_hist.start.end.limit', ['start', 'end', 'limit']],
    ['positionsSnapshot', 'positions_snap.start.end.limit', ['start', 'end', 'limit']],
    ['positionsAudit', 'positions_audit.id.start.end.limit', ['id', 'start', 'end', 'limit']],
    ['fundingOffers', 'f_offers.sym', ['sym']],
    ['fundingOfferHistory', 'f_offer_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingLoans', 'f_loans.sym', ['sym']],
    ['fundingLoanHistory', 'f_loan_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingCredits', 'f_credits.sym', ['sym']],
    ['fundingCreditHistory', 'f_credit_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['fundingTrades', 'f_trade_hist.sym.start.end.limit', ['sym', 'start', 'end', 'limit']],
    ['marginInfo', 'margin_info.k', ['k']],
    ['fundingInfo', 'f_info.k', ['k']],
    ['derivsPositionCollateralSet', 'derivs_pos_col_set.symbol.collateral', ['symbol', 'collateral']],
    ['performance'],
    ['calcAvailableBalance', 'calc.sym.dir.rate.type', ['sym', 'dir', 'rate', 'type']],
    ['addPulse', 'add_pulse.title.content', [{ title: 'title', content: 'content' }]],
    ['deletePulse', 'delete_pulse.pid', [{ pid: 'pid' }]],
    ['pulseHistory', 'pulse_hist.1', [{ isPublic: 1 }]],
    ['generateInvoice', 'generate_invoice.LNX.wallet.amount', [{ currency: 'LNX', wallet: 'wallet', amount: 'amount' }]],
    ['keepFunding', 'keep_funding.type.id', [{ type: 'type', id: 'id' }]],
    ['cancelOrderMulti', 'cancel_order_multi.123', [{ id: [123] }]],
    ['orderMultiOp', 'order_multi_op', [[[]]]]
  ]

  methods.forEach((m) => {
    const name = m[0]
    const dataKey = m[1] || m[0]
    const args = m[2] || []

    it(`${name}: fetches expected data`, (done) => {
      srv = new MockRESTv2Server({ listen: true })
      const r = getTestREST2()
      srv.setResponse(dataKey, [42])

      args.push((err, res) => {
        if (err) {
          return done(err)
        }

        assert.deepStrictEqual(res, [42])
        done()
      })

      r[name].apply(r, args)
    })
  })

  it('correctly parses funding offer response', async () => {
    srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_offers.fUSD', [getTestFundingOffer()])

    const [fo] = await r.fundingOffers('fUSD')
    auditTestFundingOffer(fo)
  })

  it('correctly parses funding loan response', async () => {
    srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_loans.fUSD', [getTestFundingLoan()])

    const [fo] = await r.fundingLoans('fUSD')
    auditTestFundingLoan(fo)
  })

  it('correctly parses funding credit response', async () => {
    srv = new MockRESTv2Server({ listen: true })
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_credits.fUSD', [getTestFundingCredit()])

    const [fc] = await r.fundingCredits('fUSD')
    auditTestFundingCredit(fc)
  })
})
