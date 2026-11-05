'use strict'

const test = require('brittle')
const http = require('http')
const RESTv2 = require('../../lib/rest2')
const { MockRESTv2Server } = require('bfx-api-mock-srv')
const { Order } = require('bfx-api-node-models')

// each test starts its own server: don't reuse keep-alive sockets (Node 19+ default)
http.globalAgent = new http.Agent({ keepAlive: false })

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

const auditTestFundingOffer = (t, fo = {}) => {
  t.is(fo.id, 41215275)
  t.is(fo.symbol, 'fUSD')
  t.is(fo.mtsCreate, 1524784806000)
  t.is(fo.mtsUpdate, 1524784806000)
  t.is(fo.amount, 1000)
  t.is(fo.amountOrig, 1000)
  t.is(fo.type, 'FRRDELTAVAR')
  t.is(fo.flags, 0)
  t.is(fo.status, 'ACTIVE')
  t.is(fo.rate, 0)
  t.is(fo.period, 30)
  t.is(fo.notify, false)
  t.is(fo.hidden, false)
  t.is(fo.renew, false)
  t.is(fo.rateReal, 0.00207328)
}

const auditTestFundingLoan = (t, fl = {}) => {
  t.is(fl.id, 2993678)
  t.is(fl.symbol, 'fUSD')
  t.is(fl.side, -1)
  t.is(fl.mtsCreate, 1524786468000)
  t.is(fl.mtsUpdate, 1524786468000)
  t.is(fl.amount, 200)
  t.is(fl.flags, 0)
  t.is(fl.status, 'ACTIVE')
  t.is(fl.rate, 0.002)
  t.is(fl.period, 7)
  t.is(fl.mtsOpening, 1524786468000)
  t.is(fl.mtsLastPayout, 1524786468000)
  t.is(fl.notify, false)
  t.is(fl.hidden, false)
  t.is(fl.renew, false)
  t.is(fl.rateReal, 0.002)
  t.is(fl.noClose, false)
}

const auditTestFundingCredit = (t, fc = {}) => {
  t.is(fc.id, 26190108)
  t.is(fc.symbol, 'fUSD')
  t.is(fc.side, -1)
  t.is(fc.mtsCreate, 1524846786000)
  t.is(fc.mtsUpdate, 1524846786000)
  t.is(fc.amount, 32.91281465)
  t.is(fc.flags, 0)
  t.is(fc.status, 'ACTIVE')
  t.is(fc.rate, 0.002)
  t.is(fc.period, 7)
  t.is(fc.mtsOpening, 1524786468000)
  t.is(fc.mtsLastPayout, null)
  t.is(fc.notify, false)
  t.is(fc.hidden, false)
  t.is(fc.renew, false)
  t.is(fc.rateReal, 0.002)
  t.is(fc.noClose, false)
  t.is(fc.positionPair, null)
}

test('RESTv2 integration (mock server) tests', async (t) => {
  let srv = null

  const closeSrv = async () => {
    if (srv) {
      await srv.close()
    }

    srv = null
  }

  // [rest2MethodName, finalMockResponseKey, rest2MethodArgs]
  const methods = [
    // public
    ['ticker', 'ticker.tBTCUSD', [{ symbol: 'tBTCUSD' }]],
    ['tickers', 'tickers', [{ symbols: ['tBTCUSD', 'tETHUSD'] }]],
    ['tickersHistory', 'tickers_hist', [{ symbols: ['tBTCUSD', 'tETHUSD'], start: 'start', end: 'end', limit: 'limit' }]],
    ['liquidations', 'liquidations.start.end.limit.sort', [{ start: 'start', end: 'end', limit: 'limit', sort: 'sort' }]],
    ['stats', 'stats.key.context', [{ key: 'key', context: 'context' }]],
    ['candles', 'candles.trade:30m:tBTCUSD.hist', [{ timeframe: '30m', symbol: 'tBTCUSD', section: 'hist' }]],
    ['statusMessages', 'status_messages.deriv.ALL', [{ type: 'deriv', key: ['ALL'] }]],
    // mocking server not really aware of public post requests so commenting out for now
    // ['marketAveragePrice', 'market_average_price.fUSD.100', [{ symbol: 'fUSD', amount: 100 }]],

    // private
    ['alertList', 'alerts.price', [{ type: 'price' }]],
    ['alertSet', 'alert_set.type.symbol.price', [{ type: 'type', symbol: 'symbol', price: 'price' }]],
    ['alertDelete', 'alert_del.symbol.price', [{ symbol: 'symbol', price: 'price' }]],
    ['accountTrades', 'trades.BTCUSD.0.10.50.1', [{ symbol: 'BTCUSD', start: 0, end: 10, limit: 50, sort: 1 }]],
    ['wallets', 'wallets'],
    ['logins', 'logins_hist', [{ start: 'start', end: 'end', limit: 'limit' }]],
    ['changeLogs', 'change_log', [{ start: 'start', end: 'end', limit: 'limit' }]],
    ['walletsHistory', 'wallets_hist.end.currency', [{ end: 'end', currency: 'currency' }]],
    ['activeOrders', 'active_orders', [{}]],
    ['orderHistory', 'orders.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]],
    ['positions'],
    ['positionsHistory', 'positions_hist.start.end.limit', [{ start: 'start', end: 'end', limit: 'limit' }]],
    ['positionsSnapshot', 'positions_snap.start.end.limit', [{ start: 'start', end: 'end', limit: 'limit' }]],
    ['positionsAudit', 'positions_audit.id.start.end.limit', [{ id: 'id', start: 'start', end: 'end', limit: 'limit' }]],
    ['fundingOffers', 'f_offers.sym', [{ symbol: 'sym' }]],
    ['fundingOfferHistory', 'f_offer_hist.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]],
    ['fundingLoans', 'f_loans.sym', [{ symbol: 'sym' }]],
    ['fundingLoanHistory', 'f_loan_hist.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]],
    ['fundingCredits', 'f_credits.sym', [{ symbol: 'sym' }]],
    ['fundingCreditHistory', 'f_credit_hist.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]],
    ['fundingTrades', 'f_trade_hist.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]],
    ['marginInfo', 'margin_info.k', [{ key: 'k' }]],
    ['fundingInfo', 'f_info.k', [{ key: 'k' }]],
    ['derivsPositionCollateralSet', 'derivs_pos_col_set.symbol.collateral', [{ symbol: 'symbol', collateral: 'collateral' }]],
    ['performance'],
    ['calcAvailableBalance', 'calc.sym.dir.rate.type', [{ symbol: 'sym', dir: 'dir', rate: 'rate', type: 'type' }]],
    ['generateInvoice', 'generate_invoice.LNX.wallet.amount', [{ currency: 'LNX', wallet: 'wallet', amount: 'amount' }]],
    ['keepFunding', 'keep_funding.type.id', [{ type: 'type', id: 'id' }]],
    ['cancelOrderMulti', 'cancel_order_multi.123', [{ id: [123] }]],
    ['orderMultiOp', 'order_multi_op', [{ ops: [[]] }]],
    ['accountSummary', 'account_summary', [{}]],
    ['symbolDetails', 'info_pairs', [{}]],
    ['submitOrder', 'order_submit', [{ order: new Order({ type: 'EXCHANGE_MARKET', symbol: 'tBTCUST', price: 17832, amount: 0.3 }) }]],
    ['keyPermissions', 'auth_permissions', [{}]],
    ['getCoreSettings', 'core_settings', [[]]],
    ['invalidateAuthToken', 'delete_token', [[{}]]],
    ['movementInfo', 'movement_info.id', [{ id: 'id' }]],
    ['getWeightedAverages', 'weighted_averages.sym.start.end.limit', [{ symbol: 'sym', start: 'start', end: 'end', limit: 'limit' }]]
  ]

  for (const m of methods) {
    const name = m[0]
    const dataKey = m[1] || m[0]
    const args = m[2] || [{}]

    await t.test(`${name}: fetches expected data`, (t) => {
      t.plan(1)
      srv = new MockRESTv2Server({ listen: true })
      t.teardown(closeSrv)
      const r = getTestREST2()
      srv.setResponse(dataKey, [42])

      args.push((err, res) => {
        if (err) {
          return t.fail(err.message)
        }

        t.alike(res, [42])
      })

      r[name].apply(r, args)
    })
  }

  await t.test('correctly parses funding offer response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_offers.fUSD', [getTestFundingOffer()])

    const [fo] = await r.fundingOffers({ symbol: 'fUSD' })
    auditTestFundingOffer(t, fo)
  })

  await t.test('correctly parses funding loan response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_loans.fUSD', [getTestFundingLoan()])

    const [fo] = await r.fundingLoans({ symbol: 'fUSD' })
    auditTestFundingLoan(t, fo)
  })

  await t.test('correctly parses funding credit response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('f_credits.fUSD', [getTestFundingCredit()])

    const [fc] = await r.fundingCredits({ symbol: 'fUSD' })
    auditTestFundingCredit(t, fc)
  })

  await t.test('correctly parses accountSummary response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('account_summary', [
      null, null, null, null,
      [
        [0.001, 0.001, 0.001, null, null, -0.0002],
        [0.002, 0.0021, 0.0022, null, null, 0.00075]
      ],
      null, null, null, null,
      { leo_lev: 0, leo_amount_avg: 0.002 }
    ])

    const summary = await r.accountSummary()
    t.is(summary.makerFee, 0.001)
    t.is(summary.derivMakerRebate, -0.0002)
    t.is(summary.takerFeeToCrypto, 0.002)
    t.is(summary.takerFeeToStable, 0.0021)
    t.is(summary.takerFeeToFiat, 0.0022)
    t.is(summary.derivTakerFee, 0.00075)
    t.is(summary.leoLev, 0)
    t.is(summary.leoAmountAvg, 0.002)
  })

  await t.test('correctly parses symbolDetails response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('info_pairs', [
      [
        ['BTCUSD', [null, null, null, '0.0002', '2002.0', null, null, null, 0.2, 0.1]],
        ['BTCEUR', [null, null, null, '0.00021', '2000.0', null, null, null, null, null]]
      ]
    ])

    const details = await r.symbolDetails()
    t.is(details[0].pair, 'BTCUSD')
    t.is(details[0].initialMargin, 0.2)
    t.is(details[0].minimumMargin, 0.1)
    t.is(details[0].maximumOrderSize, '2002.0')
    t.is(details[0].minimumOrderSize, '0.0002')
    t.is(details[0].margin, true)

    t.is(details[1].pair, 'BTCEUR')
    t.is(details[1].initialMargin, null)
    t.is(details[1].minimumMargin, null)
    t.is(details[1].maximumOrderSize, '2000.0')
    t.is(details[1].minimumOrderSize, '0.00021')
    t.is(details[1].margin, false)
  })

  await t.test('correctly parses keyPermissions response', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    srv.setResponse('auth_permissions', [
      ['account', 0, 0],
      ['orders', 1, 0],
      ['funding', 0, 1],
      ['settings', 1, 1]
    ])

    const perms = await r.keyPermissions()
    t.is(perms[0].key, 'account')
    t.is(perms[0].read, false)
    t.is(perms[0].write, false)

    t.is(perms[1].key, 'orders')
    t.is(perms[1].read, true)
    t.is(perms[1].write, false)

    t.is(perms[2].key, 'funding')
    t.is(perms[2].read, false)
    t.is(perms[2].write, true)

    t.is(perms[3].key, 'settings')
    t.is(perms[3].read, true)
    t.is(perms[3].write, true)
  })

  await t.test('correctly executes closePosition method', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: true })

    const orderRes = [
      54866913445, null, 1607956105914, 'tBTCUST',
      1607956106828, 1607956106828, -20, -20, 'MARKET', null,
      null, null, 512, 'ACTIVE (note:POSCLOSE)', null, null,
      19107, 0, 0, 0, null, null, null, 0, 0, null, null, null,
      'API>BFX', null, null, null
    ]

    srv.setResponse('positions', [
      [
        'tBTCUST', 'ACTIVE', 20, 19112.589492392, 0, 0, -896.029847839973, -0.034477234990170615,
        13768.237954491486, 1.757758329330831, null, 145287699, null, null, null, 0, null, 0, 0,
        {
          reason: 'TRADE',
          order_id: 54864866189,
          order_id_oppo: 54866447371,
          liq_stage: null,
          trade_price: '19119.0',
          trade_amount: '0.59455843'
        }
      ]
    ])

    srv.setResponse('order_submit', [
      1567590617.442, 'on-req', 1235, null, [orderRes],
      null, 'SUCCESS', 'Submitting1 orders.'
    ])

    const order = await r.closePosition({ position_id: 145287699 })
    t.alike(order.toJS(), new Order(orderRes).toJS())
  })

  await t.test('correctly executes closePosition method without transform', async (t) => {
    srv = new MockRESTv2Server({ listen: true })
    t.teardown(closeSrv)
    const r = getTestREST2({ transform: false })

    const orderRes = [
      54866913445, null, 1607956105914, 'tBTCUST',
      1607956106828, 1607956106828, -20, -20, 'MARKET', null,
      null, null, 512, 'ACTIVE (note:POSCLOSE)', null, null,
      19107, 0, 0, 0, null, null, null, 0, 0, null, null, null,
      'API>BFX', null, null, null
    ]

    srv.setResponse('positions', [
      [
        'tBTCUST', 'ACTIVE', 20, 19112.589492392, 0, 0, -896.029847839973, -0.034477234990170615,
        13768.237954491486, 1.757758329330831, null, 145287699, null, null, null, 0, null, 0, 0,
        {
          reason: 'TRADE',
          order_id: 54864866189,
          order_id_oppo: 54866447371,
          liq_stage: null,
          trade_price: '19119.0',
          trade_amount: '0.59455843'
        }
      ]
    ])

    srv.setResponse('order_submit', [
      1567590617.442, 'on-req', 1235, null, [orderRes],
      null, 'SUCCESS', 'Submitting1 orders.'
    ])

    const order = await r.closePosition({ position_id: 145287699 })
    t.alike(order, orderRes)
  })

  await t.test('timeouts on a long-running request', async (t) => {
    srv = new MockRESTv2Server({ listen: false })
    t.teardown(closeSrv)
    srv._apiServer.get('/v2/slow', (req, res) => {
      setTimeout(() => {
        res.json([42])
      }, 300)
    })
    srv.listen()

    const r = getTestREST2({ timeout: 100 })
    try {
      await r._makePublicRequest('/slow')
      t.fail('should have timed out')
    } catch (err) {
      t.is(err.message, 'request timed out after 100ms')
    }
  })

  await t.test('succeeds when request is within timeout', async (t) => {
    srv = new MockRESTv2Server({ listen: false })
    t.teardown(closeSrv)
    srv._apiServer.get('/v2/fast', (req, res) => {
      setTimeout(() => {
        res.json([42])
      }, 100)
    })
    srv.listen()

    const r = getTestREST2({ timeout: 200 })
    const res = await r._makePublicRequest('/fast')
    t.alike(res, [42])
  })
})
