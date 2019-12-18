'use strict'

const debug = require('debug')('bfx:rest2')
const rp = require('request-promise')
const Promise = require('bluebird')
const _isEmpty = require('lodash/isEmpty')
const { URLSearchParams } = require('url')
const { genAuthSig, nonce, isClass } = require('bfx-api-node-util')
const {
  FundingCredit,
  FundingLoan,
  FundingOffer,
  FundingTrade,
  MarginInfo,
  Order,
  Position,
  Trade,
  PublicTrade,
  TradingTicker,
  TradingTickerHist,
  FundingTicker,
  FundingTickerHist,
  Wallet,
  WalletHist,
  Alert,
  Candle,
  Movement,
  LedgerEntry,
  Liquidations,
  UserInfo,
  Currency,
  StatusMessagesDeriv,
  Notification
} = require('bfx-api-node-models')

const RESTv1 = require('./rest1')

const BASE_TIMEOUT = 15000
const API_URL = 'https://api.bitfinex.com'

/**
 * Communicates with v2 of the Bitfinex HTTP API
 */
class RESTv2 {
  /**
   * Instantiate a new REST v2 transport.
   *
   * @param {Object} opts
   * @param {string?} opts.affCode - affiliate code to be applied to all orders
   * @param {string} opts.apiKey
   * @param {string} opts.apiSecret
   * @param {string} opts.authToken - optional auth option
   * @param {string} opts.url - endpoint URL
   * @param {boolean} opts.transform - default false
   * @param {Object} opts.agent - optional node agent for connection (proxy)
   */
  constructor (opts = {
    affCode: null,
    apiKey: '',
    apiSecret: '',
    authToken: '',
    company: '',
    url: API_URL,
    transform: false,
    agent: null
  }) {
    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._authToken = opts.authToken || ''
    this._company = opts.company || ''
    this._transform = !!opts.transform
    this._agent = opts.agent
    this._affCode = opts.affCode

    // Used for methods that are not yet implemented on REST v2
    this._rest1 = new RESTv1(opts)
  }

  /**
   * Parses response into notification object and then
   * extracts the info element
   * @param {Object} Notification.notify_info
   */
  _takeResNotifyInfo (data) {
    const notification = new Notification(data)
    return notification.notifyInfo
  }

  /**
   * @param {string} path
   * @param {Object} payload
   * @param {Method} cb
   * @param {Object|Function} transformer - model class or function
   * @private
   */
  _makeAuthRequest (path, payload = {}, cb, transformer) {
    if ((!this._apiKey || !this._apiSecret) && !this._authToken) {
      const e = new Error('missing api key or secret')
      return this._cb(e, null, cb)
    }

    const url = `${this._url}/v2${path}`
    const n = nonce()
    const keys = () => {
      const sigPayload = `/api/v2${path}${n}${JSON.stringify(payload)}`
      const { sig } = genAuthSig(this._apiSecret, sigPayload)
      return { 'bfx-apikey': this._apiKey, 'bfx-signature': sig }
    }
    const auth = (this._authToken)
      ? { 'bfx-token': this._authToken }
      : keys()

    debug('POST %s', url)

    return rp({
      url,
      method: 'POST',
      headers: {
        'bfx-nonce': n,
        ...auth
      },
      agent: this._agent,
      body: payload,
      json: true
    }).then((data) => {
      return this._response(data, transformer, cb)
    })
  }

  /**
   * @param {string} path
   * @param {Method} cb
   * @param {Object|Function} transformer - model class or function
   * @private
   */
  _makePublicRequest (path, cb, transformer) {
    const url = `${this._url}/v2${path}`

    debug('GET %s', url)

    return rp({
      url,
      method: 'GET',
      timeout: BASE_TIMEOUT,
      agent: this._agent,
      json: true
    }).then((data) => {
      return this._response(data, transformer, cb)
    })
  }

  /**
   * NOTE: New API method, only returns a promise. Callback support will be
   *       deprecated!
   *
   * @param {string} path
   * @param {Object} body
   * @param {Object|Function} transformer - model class or function
   * @return {Promise} p
   * @private
   */
  _makePublicPostRequest (path, body, transformer) {
    const url = `${this._url}/v2${path}`

    debug('POST %s', url)

    return rp({
      url,
      method: 'POST',
      timeout: BASE_TIMEOUT,
      agent: this._agent,
      json: true,
      body
    }).then((data) => {
      return this._response(data, transformer)
    })
  }

  /**
   * Legacy REST1 public method wrapper, that also provides legacy cb
   * support. Oh my!
   *
   * @deprecated
   * @param {string} method - REST1 method name
   * @param {Method?} cb - optional legacy cb
   * @return {Promise} p - use this
   * @private
   */
  _makePublicLegacyRequest (method, cb) {
    return new Promise((resolve, reject) => {
      this._rest1.make_public_request(method, (err, data) => {
        return this._cb(err, data, cb)
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * See _makePublicLegacyRequest
   * @param {string} method
   * @param {Object?} params
   * @param {Method?} cb
   * @return {Promise} p
   * @private
   */
  _makeAuthLegacyRequest (method, params = {}, cb) {
    return new Promise((resolve, reject) => {
      this._rest1.make_request(method, params, (err, data) => {
        return this._cb(err, data, cb)
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * @param {Object} data
   * @param {Object|Function} transformer - model class or function
   * @return {Object|Object[]} finalData
   * @private
   */

  _doTransform (data, transformer) {
    if (isClass(transformer)) {
      return this._classTransform(data, transformer)
    } else if (typeof transformer === 'function') {
      return transformer(data)
    } else {
      return data
    }
  }

  /**
   * @param {Object} data
   * @param {Object} ModelClass
   * @return {Object|Object[]} finalData
   * @private
   */
  _classTransform (data, ModelClass) {
    if (!data || data.length === 0) return []
    if (!ModelClass || !this._transform) return data

    if (Array.isArray(data[0])) {
      return data.map(row => new ModelClass(row, this))
    }

    return new ModelClass(data, this)
  }

  /**
   * @param {Object} data
   * @param {Object|Function} transformer - model class or function
   * @return {Object|Object[]} finalData
   * @private
   */
  _response (data, transformer, cb) {
    try {
      const res = (this._transform)
        ? this._doTransform(data, transformer)
        : data

      return this._cb(null, res, cb)
    } catch (e) {
      return this._cb(e, null, cb)
    }
  }

  /**
   * @param {Error?}
   * @param {Response?}
   * @param {Method?} cb
   * @return {Promise} p
   * @private
   */
  _cb (err, res, cb) {
    return new Promise((resolve, reject) => {
      const _isCbFunc = cb && typeof cb === 'function'
      if (err) {
        if (err.error && err.error[1] === 10114) {
          err.message += ' see https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
        }

        if (_isCbFunc) cb(err)
        return reject(err)
      } else {
        if (_isCbFunc) cb(null, res)
        return resolve(res)
      }
    })
  }

  /**
   * @param {Array[]} data order matters
   * @return {Array[]} merged arr of currencies and names sorted with no pairs repeated adding pool and explorer to each
   * @private
   */
  _genCurrencyList (data) {
    if (!Array.isArray(data) || data.length !== 5) {
      return data
    }

    const transformArrToObj = (arr) => {
      const obj = {}
      arr.forEach((c) => {
        if (!Array.isArray(c)) {
          obj[c] = c
        } else if (c.length > 1) {
          obj[c[0]] = c[1]
        }
      })
      return obj
    }

    const listedCurr = transformArrToObj(data[0])
    const mapedCurrSym = transformArrToObj(data[1])
    const mapedCurrLabel = transformArrToObj(data[2])
    const pool = transformArrToObj(data[3])
    const explorer = transformArrToObj(data[4])

    const allCurrObj = {
      ...listedCurr,
      ...mapedCurrSym,
      ...mapedCurrLabel
    }

    // Assigne explores of pool to currencies
    Object.keys(pool).forEach((key) => {
      if (!explorer[key]) {
        if (explorer[pool[key]]) {
          explorer[key] = explorer[pool[key]]
        }
      }
    })

    const allCurArr = []
    Object.keys(allCurrObj).forEach((key) => {
      const cPool = pool[key] || null
      const cExpl = explorer[key] || []
      const cName = allCurrObj[key]
      const cSymbol = mapedCurrSym[key] || key
      allCurArr.push([key, cName, cPool, cExpl, cSymbol])
    })

    return allCurArr
  }

  /**
   * @param {string} symbol - i.e. tBTCUSD
   * @param {string} prec - i.e. P0
   * @param {Method} cb
   * @see https://docs.bitfinex.com/v2/reference#rest-public-books
   */
  orderBook (symbol = 'tBTCUSD', prec = 'P0', cb) {
    return this._makePublicRequest(`/book/${symbol}/${prec}`, cb)
  }

  /**
   * @param {Method?} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-platform-status
   */
  status (cb = () => {}) {
    return this._makePublicRequest('/platform/status', cb)
  }

  /**
   * @param {string?} type
   * @param {string[]} keys
   * @param {Method?} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#status
   */
  statusMessages (type = 'deriv', keys = ['ALL'], cb) {
    const url = `/status/${type}?keys=${keys.join(',')}`
    const transformer = (type === 'deriv') ? StatusMessagesDeriv : null

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-ticker
   */
  ticker (symbol = 'tBTCUSD', cb) {
    const transformer = (data) => {
      const ticker = [symbol, ...data]
      return (symbol[0] === 't')
        ? new TradingTicker(ticker)
        : new FundingTicker(ticker)
    }

    return this._makePublicRequest(`/ticker/${symbol}`, cb, transformer)
  }

  /**
   * @param {string[]} symbols
   * @param {Method?} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-tickers
   */
  tickers (symbols = [], cb) {
    const transformer = (data) => {
      return data.map(ticker => (
        (ticker[0] || '')[0] === 't'
          ? new TradingTicker(ticker)
          : new FundingTicker(ticker)
      ))
    }

    const url = `/tickers?symbols=${symbols.join(',')}`
    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {string[]} symbols
   * @param {number?} start
   * @param {number?} end
   * @param {number?} limit
   * @param {Method?} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-tickers-history
   */
  tickersHistory (symbols = [], start, end, limit = 250, cb) {
    const transformer = (data) => {
      return data.map(ticker => (
        (ticker[0] || '')[0] === 't'
          ? new TradingTickerHist(ticker)
          : new FundingTickerHist(ticker)
      ))
    }

    const s = (start) ? `&start=${start}` : ''
    const e = (end) ? `&end=${end}` : ''
    const params = `?symbols=${symbols.join(',')}${s}${e}&limit=${limit}`
    const url = `/tickers/hist${params}`

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {string} key
   * @param {string} context
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-stats
   */
  stats (key = 'pos.size:1m:tBTCUSD:long', context = 'hist', cb) {
    return this._makePublicRequest(`/stats1/${key}/${context}`, cb)
  }

  /**
   *
   * @param {Object} opts
   * @param {string} opts.timeframe - 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M
   * @param {string} opts.symbol
   * @param {string} opts.section - hist, last
   * @param {Method} cb
   * @return {Promise} p
   * @see http://docs.bitfinex.com/v2/reference#rest-public-candles
   */
  candles ({
    timeframe = '1m',
    symbol = 'tBTCUSD',
    section = 'hist',
    query = {}
  }, cb) {
    let url = `/candles/trade:${timeframe}:${symbol}/${section}`

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, Candle)
  }

  /**
   * Query configuration information
   *
   * @param {string[]} keys
   * @param {Method?} cb
   */
  conf (keys = [], cb = () => {}) {
    if (_isEmpty(keys)) {
      return Promise.resolve([])
    }

    const url = `/conf/${keys.join(',')}`
    return this._makePublicRequest(url, cb)
  }

  /**
   * Get a list of valid currencies ids, full names, pool and explorer
   *
   * @param {Method?} cb - legacy callback
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-currencies
   */
  currencies (cb = () => {}) {
    const suffix = (this._company) ? ':' + this._company : ''
    const url = `/conf/${[
      `pub:list:currency${suffix}`,
      `pub:map:currency:sym${suffix}`,
      `pub:map:currency:label${suffix}`,
      `pub:map:currency:pool${suffix}`,
      `pub:map:currency:explorer${suffix}`
    ].join(',')}`

    return this._makePublicRequest(url, cb, (data) => {
      const res = this._genCurrencyList(data)
      return this._doTransform(res, Currency)
    })
  }

  /**
   * @param {string} type
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-list
   */
  alertList (type = 'price', cb) {
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  /**
   * @param {string} type
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-set
   */
  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, cb, Alert)
  }

  /**
   * @param {string} symbol
   * @param {number} price
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete
   */
  alertDelete (symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/del', { symbol, price }, cb)
  }

  /**
   * @param {string} symbol
   * @param {number?} start
   * @param {number?} end
   * @param {number?} limit
   * @param {number?} sort - if 1, sorts results oldest first
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-trades
   */
  trades (symbol = 'tBTCUSD', start = null, end = null, limit = null, sort = null, cb) {
    const query = {}

    if (start !== null) query.start = start
    if (end !== null) query.end = end
    if (limit !== null) query.limit = limit
    if (sort !== null) query.sort = sort

    let url = `/trades/${symbol}/hist`

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, PublicTrade)
  }

  /**
   * @param {string} symbol
   * @param {number?} start
   * @param {number?} end
   * @param {number?} limit
   * @param {number?} sort - if 1, sorts results oldest first
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-liquidations
   */
  liquidations (start = null, end = null, limit = null, sort = null, cb) {
    const query = {}

    if (start !== null) query.start = start
    if (end !== null) query.end = end
    if (limit !== null) query.limit = limit
    if (sort !== null) query.sort = sort

    let url = '/liquidations/hist'

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, Liquidations)
  }

  /**
   * @param {string?} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {number} sort - if 1, sorts results oldest first
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-trades-hist
   */
  accountTrades (symbol, start = null, end = null, limit = null, sort = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/trades/${symbol}/hist`
      : '/auth/r/trades/hist'

    return this._makeAuthRequest(url, {
      start, end, limit, sort
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets
   */
  wallets (cb) {
    return this._makeAuthRequest('/auth/r/wallets', {}, cb, Wallet)
  }

  /**
   * @param {number} end
   * @param {string} currency
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets-hist
   */
  walletsHistory (end = Date.now(), currency = null, cb) {
    return this._makeAuthRequest('/auth/r/wallets/hist', { end, currency }, cb, WalletHist)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets
   */
  userInfo (cb) {
    return this._makeAuthRequest('/auth/r/info/user', {}, cb, UserInfo)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
   */
  activeOrders (cb) {
    return this._makeAuthRequest('/auth/r/orders', {}, cb, Order)
  }

  /**
   * @param {string?} ccy - i.e. ETH
   * @param {number?} start
   * @param {number?} end
   * @param {number?} limit - default 25
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#movements
   */
  movements (ccy, start = null, end = Date.now(), limit = 25, cb) {
    const url = ccy
      ? `/auth/r/movements/${ccy}/hist`
      : '/auth/r/movements/hist'

    return this._makeAuthRequest(url, { start, end, limit }, cb, Movement)
  }

  /**
   * @param {string?} ccy - i.e. ETH
   * @param {number?} start
   * @param {number?} end
   * @param {number?} limit - default 25
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#ledgers
   */
  ledgers (ccy, start = null, end = Date.now(), limit = 25, cb) {
    const url = ccy
      ? `/auth/r/ledgers/${ccy}/hist`
      : '/auth/r/ledgers/hist'

    return this._makeAuthRequest(url, { start, end, limit }, cb, LedgerEntry)
  }

  /**
   * @param {string?} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#orders-history
   */
  orderHistory (symbol, start = null, end = null, limit = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/orders/${symbol}/hist`
      : '/auth/r/orders/hist'

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, Order)
  }

  /**
   * @param {string} symbol
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {number} orderID
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-order-trades
   */
  orderTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, orderID, cb) {
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderID}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions
   */
  positions (cb) {
    return this._makeAuthRequest('/auth/r/positions', {}, cb, Position)
  }

  /**
  * @param {Number} start
  * @param {Number} end
  * @param {Number} limit
  * @param {Method} cb
  * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-history
   */
  positionsHistory (start = 0, end = Date.now(), limit = 50, cb) {
    return this._makeAuthRequest('/auth/r/positions/hist', {
      start, end, limit
    }, cb, Position)
  }

  /**
  * @param {Array[]} id
  * @param {Number} start
  * @param {Number} end
  * @param {Number} limit
  * @param {Method} cb
  * @return {Promise} p
  * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-audit
   */
  positionsAudit (id = [], start = 0, end = Date.now(), limit = 250, cb) {
    return this._makeAuthRequest('/auth/r/positions/audit', {
      id, start, end, limit
    }, cb, Position)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers
   */
  fundingOffers (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}`, {}, cb, FundingOffer)
  }

  /**
   * @param {string} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers-hist
   */
  fundingOfferHistory (symbol, start = null, end = null, limit = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/offers/${symbol}/hist`
      : '/auth/r/funding/offers/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingOffer)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans
   */
  fundingLoans (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}`, {}, cb, FundingLoan)
  }

  /**
   * @param {string} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans-hist
   */
  fundingLoanHistory (symbol, start = null, end = null, limit = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/loans/${symbol}/hist`
      : '/auth/r/funding/loans/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingLoan)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits
   */
  fundingCredits (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}`, {}, cb, FundingCredit)
  }

  /**
   * @param {string} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits-hist
   */
  fundingCreditHistory (symbol, start = null, end = null, limit = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/credits/${symbol}/hist`
      : '/auth/r/funding/credits/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingCredit)
  }

  /**
   * @param {string} symbol - optional, omit/leave empty for all
   * @param {number} start
   * @param {number} end
   * @param {number} limit
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-trades-hist
   */
  fundingTrades (symbol = 'fBTC', start = 0, end = Date.now(), limit = null, cb) {
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/trades/${symbol}/hist`
      : '/auth/r/funding/trades/hist'

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingTrade)
  }

  /**
   * @param {string} key
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-margin
   */
  marginInfo (key = 'base', cb) {
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  /**
   * @param {string} key
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-funding
   */
  fundingInfo (key = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  /**
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-performance
   */
  performance (cb) {
    return this._makeAuthRequest('/auth/r/stats/perf:1D/hist', {}, cb)
  }

  /**
   * @param {string} symbol
   * @param {string} dir
   * @param {number} rate
   * @param {string} type
   * @param {Method} cb
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-calc-bal-avail
   */
  calcAvailableBalance (symbol = 'tBTCUSD', dir, rate, type, cb) {
    return this._makeAuthRequest('/auth/calc/order/avail', {
      symbol,
      dir,
      rate,
      type
    }, cb)
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {Method?} cb - legacy callback
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-symbols
   */
  symbols (cb = () => {}) {
    const url = '/conf/pub:list:pair:exchange'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {Method?} cb - legacy callback
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-futures
   */
  futures (cb = () => {}) {
    const url = '/conf/pub:list:pair:futures'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Changes the collateral value of an active derivatives position for a certain pair.
   *
   * @param {string} symbol
   * @param {number} collateral
   * @param {Method?} cb - legacy callback
   * @return {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-deriv-pos-collateral-set
   */

  derivsPositionCollateralSet (symbol, collateral, cb) {
    const url = '/auth/w/deriv/collateral/set'
    const isRequestValid = (res) => !!(res && res[0] && res[0][0])
    return this._makeAuthRequest(url, {
      symbol, collateral
    }, cb, isRequestValid)
  }

  /**
   * Get a list of valid symbol names and details
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbol-details
   */
  symbolDetails (cb) {
    return this._makePublicLegacyRequest('symbols_details', cb)
  }

  /**
   * Request information about your account
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-account-info
   */
  accountInfo (cb) {
    return this._makeAuthLegacyRequest('account_infos', {}, cb)
  }

  /**
   * Request account withdrawl fees
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-fees
   */
  accountFees (cb) {
    return this._makeAuthLegacyRequest('account_fees', {}, cb)
  }

  /**
   * Returns a 30-day summary of your trading volume and return on margin
   * funding.
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-summary
   */
  accountSummary (cb) {
    return this._makeAuthLegacyRequest('summary', {}, cb)
  }

  /**
   * Fetch the permissions of the key being used to generate this request
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#auth-key-permissions
   */
  keyPermissions (cb) {
    return this._makeAuthLegacyRequest('key_info', {}, cb)
  }

  /**
   * Request your wallet balances
   *
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances
   */
  balances (cb) {
    return this._makeAuthLegacyRequest('balances', {}, cb)
  }

  /**
   * @param {Object} params
   * @param {number} params.position_id
   * @param {Method} cb
   * @return {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-close-position
   */
  closePosition (params, cb) {
    return this._rest1.make_request('positions/close', params, cb)
  }

  /**
   * @param {Object} settings - key:value map
   * @param {Method} cb
   * @return {Promise} p
   */
  updateSettings (settings, cb) {
    return this._makeAuthRequest('/auth/w/settings/set', {
      settings
    }, cb)
  }

  /**
   * @param {string[]} keys
   * @param {Method} cb
   * @return {Promise} p
   */
  deleteSettings (keys, cb) {
    return this._makeAuthRequest('/auth/w/settings/del', { keys }, cb)
  }

  /**
   * @param {string[]} keys
   * @param {Method} cb
   * @return {Promise} p
   */
  getSettings (keys, cb) {
    return this._makeAuthRequest('/auth/r/settings', { keys }, cb)
  }

  /**
   * @param {string} ccy1 - i.e. BTC
   * @param {string} ccy2 - i.e. USD
   * @return {Promise} p - resolves to currenct exchange rate
   */
  exchangeRate (ccy1, ccy2) {
    return this._makePublicPostRequest('/calc/fx', {
      ccy1,
      ccy2
    }).then(res => res[0])
  }

  /**
   * @param {Object} opts
   * @param {number} opts.ttl
   * @param {string} opts.scope
   * @param {boolean} opts.writePermission
   * @param {Method} cb
   * @return {Promise} p
   */
  generateToken ({ ttl, scope, writePermission } = {}, cb) {
    return this._makeAuthRequest('/auth/w/token', {
      ttl, scope, writePermission
    }, cb)
  }

  /**
   * Submit new order
   *
   * @param {Order} order - models.Order
   * @param {Method} cb
   */
  submitOrder (order, cb) {
    const packet = order.toNewOrderPacket()

    if (this._affCode) {
      if (!packet.meta) {
        packet.meta = {}
      }

      packet.meta.aff_code = packet.meta.aff_code || this.affCode // eslint-disable-line
    }

    return this._makeAuthRequest('/auth/w/order/submit', packet, cb)
      .then((res) => {
        // 2 orders can be returned if OCO was used. But due to the interface
        // we can only return one. User should use getOrders instead
        return this._takeResNotifyInfo(res)[0] || []
      })
  }

  /**
   * Update existing order
   *
   * @param {Objet} order - updates to order
   * @param {Method} cb
   */
  updateOrder (changes, cb) {
    return this._makeAuthRequest('/auth/w/order/update', changes, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Cancel existing order
   *
   * @param {int} id - order id
   * @param {Method} cb
   */
  cancelOrder (id, cb) {
    return this._makeAuthRequest('/auth/w/order/cancel', { id }, cb)
      .then(this._takeResNotifyInfo)
  }

  submitOrderMulti () {
    return Promise.reject(new Error('Not implemented - requires work on WS as well'))
  }

  /**
   * Claim existing open position
   *
   * @param {int} id - position id
   * @param {Method} cb
   */
  claimPosition (id, cb) {
    return this._makeAuthRequest('/auth/w/position/claim', { id }, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Submit new funding offer
   *
   * @param {Object} offer - models.Offer
   * @param {Method} cb
   */
  submitFundingOffer (offer, cb) {
    const packet = offer.toNewOrderPacket()

    if (this._affCode) {
      if (!packet.meta) {
        packet.meta = {}
      }

      packet.meta.aff_code = packet.meta.aff_code || this._affCode // eslint-disable-line
    }

    return this._makeAuthRequest('/auth/w/funding/offer/submit', packet, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Cancel existing funding offer
   *
   * @param {int} id - offer id
   * @param {Method} cb
   */
  cancelFundingOffer (id, cb) {
    return this._makeAuthRequest('/auth/w/funding/offer/cancel', { id }, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Close funding
   *
   * @param {Object} params
   * @param {int} param.id - funding id
   * @param {string} param.type - funding type LIMIT | FRRDELTAVAR
   * @param {*} cb
   */
  closeFunding (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/close', params, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Submit automatic funding
   *
   * @param {Object} params
   * @param {int} params.status
   * @param {string} params.currency - currency i.e fUSD
   * @param {number} params.amount - amount to borrow/lend
   * @param {number} params.rate - if == 0 then FRR is used
   * @param {int} params.period - time the offer remains locked in for
   * @param {*} cb
   */
  submitAutoFunding (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/auto', params, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * Execute a balance transfer between wallets
   *
   * @param {number} params.amount - amount to transfer
   * @param {string} params.from - wallet from
   * @param {string} params.to - wallet to
   * @param {string} params.currency - currency from
   * @param {string} params.currencyTo - currency to
   * @param {Method} cb
   * @return {Promise} p
   */
  transfer (params, cb) {
    params.currency_to = params.currencyTo
    return this._makeAuthRequest('/auth/w/transfer', params, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * @param {Object} params
   * @param {string} wallet - wallet i.e exchange, margin
   * @param {string} method - protocol method i.e bitcoin, tetherus
   * @param {int} opRenew - if 1 then generates a new address
   * @param {*} cb
   */
  getDepositAddress (params, cb) {
    params.op_renew = params.opRenew
    return this._makeAuthRequest('/auth/w/deposit/address', params, cb)
      .then(this._takeResNotifyInfo)
  }

  /**
   * @param {object} params
   * @param {string} wallet - wallet i.e exchange, margin
   * @param {string} method - protocol method i.e bitcoin, tetherus
   * @param {number} amount - amount to withdraw
   * @param {string} address - destination address
   * @param {*} cb
   */
  withdraw (params, cb) {
    return this._makeAuthRequest('/auth/w/withdraw', params, cb)
      .then(this._takeResNotifyInfo)
  }
}

module.exports = RESTv2
