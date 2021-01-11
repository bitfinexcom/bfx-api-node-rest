'use strict'

const debug = require('debug')('bfx:rest2')
const rp = require('request-promise')
const Promise = require('bluebird')
const _isEmpty = require('lodash/isEmpty')
const _isString = require('lodash/isString')
const _isFunction = require('lodash/isFunction')
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
  Notification,
  Login,
  ChangeLog,
  PublicPulseProfile,
  PulseMessage,
  Invoice
} = require('bfx-api-node-models')

const RESTv1 = require('./rest1')

const BASE_TIMEOUT = 15000
const API_URL = 'https://api.bitfinex.com'

/**
 * Parses response into notification object
 *
 * @param {object} data - notification
 * @returns {Notification} n
 * @private
 */
function _takeResNotify (data) {
  const notification = new Notification(data)
  return notification
}

/**
 * Communicates with v2 of the Bitfinex HTTP API
 */
class RESTv2 {
  /**
   * Instantiate a new REST v2 transport.
   *
   * @param {object} opts - options
   * @param {string} [opts.affCode] - affiliate code to be applied to all orders
   * @param {string} [opts.apiKey] - API key
   * @param {string} [opts.apiSecret] - API secret
   * @param {string} [opts.authToken] - optional auth option
   * @param {string} [opts.url] - endpoint URL
   * @param {boolean} [opts.transform] - default false
   * @param {object} [opts.agent] - optional node agent for connection (proxy)
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
   * @returns {boolean} url
   */
  getURL () {
    return this._url
  }

  /**
   * @returns {boolean} usesAgent
   */
  usesAgent () {
    return !!this._agent
  }

  /**
   * @param {string} path - path
   * @param {object} payload - payload
   * @param {Function} [cb] - callback
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
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
   * @param {string} path - path
   * @param {Function} [cb] - callback
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
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
   * @param {string} path - path
   * @param {object} body - payload
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
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
   * @param {Function?} [cb] - optional legacy cb
   * @returns {Promise} p - use this
   * @private
   */
  _makePublicLegacyRequest (method, cb) {
    return new Promise((resolve, reject) => {
      this._rest1.make_public_request(method, (err, data) => {
        return this._cb(err, data, cb) // eslint-disable-line
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * See _makePublicLegacyRequest
   *
   * @param {string} method - method (i.e. GET)
   * @param {?object} params - params
   * @param {Function?} [cb] - callback
   * @returns {Promise} p
   * @private
   */
  _makeAuthLegacyRequest (method, params = {}, cb) {
    return new Promise((resolve, reject) => {
      this._rest1.make_request(method, params, (err, data) => {
        return this._cb(err, data, cb) // eslint-disable-line
          .then(resolve)
          .catch(reject)
      })
    })
  }

  /**
   * @param {object} data
   * @param {object|Function} transformer - model class or function
   * @returns {object|object[]} finalData
   * @private
   */

  _doTransform (data, transformer) {
    if (isClass(transformer)) {
      return this._classTransform(data, transformer)
    } else if (_isFunction(transformer)) {
      return transformer(data)
    } else {
      return data
    }
  }

  /**
   * @param {object} data - data
   * @param {object} ModelClass - class
   * @returns {object|object[]} finalData
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
   * @param {object} data - data
   * @param {object|Function} transformer - model class or function
   * @param {Function} [cb] - callback
   * @returns {object|object[]} finalData
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
   * @param {Error} err - error
   * @param {object} res -resposne
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @private
   */
  _cb (err, res, cb) {
    return new Promise((resolve, reject) => {
      const _isCbFunc = _isFunction(cb)
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
   * @returns {Array[]} merged arr of currencies and names sorted with no pairs repeated adding pool and explorer to each
   * @private
   */
  _genCurrencyList (data) {
    if (!Array.isArray(data) || data.length !== 6) {
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
    const walletFx = transformArrToObj(data[5])

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
      const cWfx = walletFx[key] || []
      allCurArr.push([key, cName, cPool, cExpl, cSymbol, cWfx])
    })

    return allCurArr
  }

  /**
   * @param {string} symbol - i.e. tBTCUSD
   * @param {string} prec - i.e. P0
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-books
   */
  orderBook (symbol = 'tBTCUSD', prec = 'P0', cb) {
    return this._makePublicRequest(`/book/${symbol}/${prec}`, cb)
  }

  /**
   * @param {string} nickname - i.e. Bitfinex
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-profile
   */
  publicPulseProfile (nickname, cb) {
    return this._makePublicRequest(`/pulse/profile/${nickname}`, cb, PublicPulseProfile)
  }

  /**
   * @param {string} limit  - Number of records (Max: 100)
   * @param {string} end    - Millisecond start time
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-hist
   */
  publicPulseHistory (limit, end, cb) {
    return this._makePublicRequest(`/pulse/hist?limit=${limit}&end=${end}`, cb, PulseMessage)
  }

  /**
   * @param {object} params            - parameters
   * @param {string} params.symbol     - Symbol you want information about i.e tBTCUSD, fUSD
   * @param {string} params.amount     - Amount. Positive for buy, negative for sell (ex. "1.123")
   * @param {string} params.period     - (optional) Maximum period for Margin Funding
   * @param {string} params.rate_limit - Limit rate/price (ex. "1000.5")
   * @param {Function} [cb]            - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-calc-market-average-price
   */
  marketAveragePrice (params, cb) {
    const usp = new URLSearchParams(params)
    return this._makePublicPostRequest(`/calc/trade/avg?${usp.toString()}`, cb)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-platform-status
   */
  status (cb = () => {}) {
    return this._makePublicRequest('/platform/status', cb)
  }

  /**
   * @param {string} [type] - type
   * @param {string[]} [keys] - keys
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#status
   */
  statusMessages (type = 'deriv', keys = ['ALL'], cb) {
    const url = `/status/${type}?keys=${keys.join(',')}`
    const transformer = (type === 'deriv') ? StatusMessagesDeriv : null

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string[]} symbols - symbols
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string[]} symbols - symbols
   * @param {number} [start] - query start timestamp
   * @param {number} [end] - query end timestamp
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} key - key
   * @param {string} context - context
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-stats
   */
  stats (key = 'pos.size:1m:tBTCUSD:long', context = 'hist', cb) {
    return this._makePublicRequest(`/stats1/${key}/${context}`, cb)
  }

  /**
   *
   * @param {object} opts - options
   * @param {string} opts.timeframe - 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M
   * @param {string} opts.symbol - symbol
   * @param {string} opts.section - hist, last
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string[]} keys - keys
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {Function?} [cb] - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-currencies
   */
  currencies (cb = () => {}) {
    const suffix = (this._company) ? ':' + this._company : ''
    const url = `/conf/${[
      `pub:list:currency${suffix}`,
      `pub:map:currency:sym${suffix}`,
      `pub:map:currency:label${suffix}`,
      `pub:map:currency:pool${suffix}`,
      `pub:map:currency:explorer${suffix}`,
      `pub:map:currency:wfx${suffix}`
    ].join(',')}`

    return this._makePublicRequest(url, cb, (data) => {
      const res = this._genCurrencyList(data)
      return this._doTransform(res, Currency)
    })
  }

  /**
   * @param {string} type - type
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-list
   */
  alertList (type = 'price', cb) {
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  /**
   * @param {string} type - type
   * @param {string} symbol - symbol
   * @param {number} price - price
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-set
   */
  alertSet (type = 'price', symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, cb, Alert)
  }

  /**
   * @param {string} symbol - symbol
   * @param {number} price - price
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete
   */
  alertDelete (symbol = 'tBTCUSD', price = 0, cb) {
    return this._makeAuthRequest('/auth/w/alert/del', { symbol, price }, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {number} [sort] - if 1, sorts results oldest first
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {number} [sort] - if 1, sorts results oldest first
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} [symbol] - optional, omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {number} [sort] - if 1, sorts results oldest first
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-logins-hist
   */
  logins (start = 0, end = Date.now(), limit = 25, cb) {
    const url = '/auth/r/logins/hist'

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, Login)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets
   */
  wallets (cb) {
    return this._makeAuthRequest('/auth/r/wallets', {}, cb, Wallet)
  }

  /**
   * @param {number} [end] - query end
   * @param {string} [currency] - currency
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets-hist
   */
  walletsHistory (end = Date.now(), currency = null, cb) {
    return this._makeAuthRequest('/auth/r/wallets/hist', { end, currency }, cb, WalletHist)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-info-user
   */
  userInfo (cb) {
    return this._makeAuthRequest('/auth/r/info/user', {}, cb, UserInfo)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
   */
  activeOrders (cb) {
    return this._makeAuthRequest('/auth/r/orders', {}, cb, Order)
  }

  /**
   * @param {Array} [ids] - order ids
   * @param {Function} cb - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
   */
  activeOrdersWithIds (ids = [], cb) {
    const url = '/auth/r/orders'
    return this._makeAuthRequest(url, { id: ids }, cb, Order)
  }

  /**
   * @param {string} [ccy] - i.e. ETH
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit, default 25
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#movements
   */
  movements (ccy, start = null, end = Date.now(), limit = 25, cb) {
    const url = ccy
      ? `/auth/r/movements/${ccy}/hist`
      : '/auth/r/movements/hist'

    return this._makeAuthRequest(url, { start, end, limit }, cb, Movement)
  }

  /**
   * @param {object|string} filters - filters
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - default 25
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#ledgers
   */
  ledgers (filters, start = null, end = Date.now(), limit = 25, cb) {
    const parseFilters = (sent) => {
      if (_isString(sent)) return { ccy: sent }
      return sent || {}
    }

    const { ccy, category } = parseFilters(filters)
    const url = ccy
      ? `/auth/r/ledgers/${ccy}/hist`
      : '/auth/r/ledgers/hist'

    return this._makeAuthRequest(url, {
      start, end, limit, category
    }, cb, LedgerEntry)
  }

  /**
   * @param {string?} symbol - optional, omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {Array} [ids] - order ids
   * @param {Function} cb - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#orders-history
   */
  orderHistoryWithIds (ids = [], cb) {
    const url = '/auth/r/orders/hist'
    return this._makeAuthRequest(url, { id: ids }, cb, Order)
  }

  /**
   * @param {string} [symbol] - symbol
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {number} [orderID] - order ID
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-order-trades
   */
  orderTrades (symbol = 'tBTCUSD', start = null, end = null, limit = null, orderID, cb) {
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderID}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions
   */
  positions (cb) {
    return this._makeAuthRequest('/auth/r/positions', {}, cb, Position)
  }

  /**
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-history
   */
  positionsHistory (start = 0, end = Date.now(), limit = 50, cb) {
    return this._makeAuthRequest('/auth/r/positions/hist', {
      start, end, limit
    }, cb, Position)
  }

  /**
   * @param {Array[]} [id] - ids of positions to audit
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-audit
   */
  positionsAudit (id = [], start = 0, end = Date.now(), limit = 250, cb) {
    return this._makeAuthRequest('/auth/r/positions/audit', {
      id, start, end, limit
    }, cb, Position)
  }

  /**
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-snap
   */
  positionsSnapshot (start = 0, end = Date.now(), limit = 50, cb) {
    return this._makeAuthRequest('/auth/r/positions/snap', {
      start, end, limit
    }, cb, Position)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers
   */
  fundingOffers (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}`, {}, cb, FundingOffer)
  }

  /**
   * @param {string} [symbol] - omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} [symbol] - symbol
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans
   */
  fundingLoans (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}`, {}, cb, FundingLoan)
  }

  /**
   * @param {string} [symbol] - omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} [symbol] - symbol
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits
   */
  fundingCredits (symbol = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}`, {}, cb, FundingCredit)
  }

  /**
   * @param {string} [symbol] - omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} [symbol] - optional, omit/leave empty for all
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {string} key - key
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-margin
   */
  marginInfo (key = 'base', cb) {
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  /**
   * @param {number} [start] - query start
   * @param {number} [end] - query end
   * @param {number} [limit] - query limit
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-audit-hist
   */
  changeLogs (start = 0, end = Date.now(), limit = null, cb) {
    return this._makeAuthRequest('/auth/r/audit/hist', {
      start, end, limit
    }, cb, ChangeLog)
  }

  /**
   * @param {string} key - key
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-funding
   */
  fundingInfo (key = 'fUSD', cb) {
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  /**
   * @param {object} params      - parameters
   * @param {string} params.type - Specify the funding type ('credit' or 'loan')
   * @param {string} params.id   - The loan or credit id
   * @param {Function} [cb]      - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-keep-funding
   */
  keepFunding (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/keep', params, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-performance
   */
  performance (cb) {
    return this._makeAuthRequest('/auth/r/stats/perf:1D/hist', {}, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {string} dir - dir
   * @param {number} rate - rate
   * @param {string} type - type
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {Function?} [cb] - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-symbols
   */
  symbols (cb = () => {}) {
    const url = '/conf/pub:list:pair:exchange'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Get a list of inactive symbol names
   *
   * @param {Function?} [cb] - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-symbols
   */
  inactiveSymbols (cb = () => {}) {
    const url = '/conf/pub:list:pair:exchange:inactive'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {Function?} [cb] - legacy callback
   * @returns {Promise} p
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
   * @param {string} symbol - symbol
   * @param {number} collateral - collateral
   * @param {Function} [cb] - legacy callback
   * @returns {Promise} p
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
   * @param {Function} [cb] - callbak
   * @returns {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbol-details
   */
  symbolDetails (cb) {
    return this._makePublicLegacyRequest('symbols_details', cb)
  }

  /**
   * Request information about your account
   *
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-account-info
   */
  accountInfo (cb) {
    return this._makeAuthLegacyRequest('account_infos', {}, cb)
  }

  /**
   * Request account withdrawl fees
   *
   * @param {Function} [cb] - callback
   * @returns {Promise} p
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
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-summary
   */
  accountSummary (cb) {
    const url = '/auth/r/int/summary'
    const pickSummary = (res) => res && res[0] && res[0].summary
    return this._makeAuthRequest(url, { }, cb, pickSummary)
  }

  /**
   * Fetch the permissions of the key being used to generate this request
   *
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#auth-key-permissions
   */
  keyPermissions (cb) {
    return this._makeAuthLegacyRequest('key_info', {}, cb)
  }

  /**
   * Request your wallet balances
   *
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances
   */
  balances (cb) {
    return this._makeAuthLegacyRequest('balances', {}, cb)
  }

  /**
   * @param {object} params - parameters
   * @param {number} params.position_id - position ID
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @deprecated
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-close-position
   */
  closePosition (params, cb) {
    return this._rest1.make_request('positions/close', params, cb)
  }

  /**
   * @param {object} settings - key:value map
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  updateSettings (settings, cb) {
    return this._makeAuthRequest('/auth/w/settings/set', {
      settings
    }, cb)
  }

  /**
   * @param {string[]} keys - keys
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  deleteSettings (keys, cb) {
    return this._makeAuthRequest('/auth/w/settings/del', { keys }, cb)
  }

  /**
   * @param {string[]} keys - keys
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  getSettings (keys, cb) {
    return this._makeAuthRequest('/auth/r/settings', { keys }, cb)
  }

  /**
   * @param {string} ccy1 - i.e. BTC
   * @param {string} ccy2 - i.e. USD
   * @returns {Promise} p - resolves to currenct exchange rate
   */
  exchangeRate (ccy1, ccy2) {
    return this._makePublicPostRequest('/calc/fx', {
      ccy1,
      ccy2
    }).then(res => res[0])
  }

  /**
   * @param {object} opts - options
   * @param {number} opts.ttl - time-to-live
   * @param {string} opts.scope - scope
   * @param {boolean} opts.writePermission - write permission
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  generateToken ({ ttl, scope, writePermission, _cust_ip: custIp } = {}, cb) {
    return this._makeAuthRequest('/auth/w/token', {
      ttl, scope, writePermission, _cust_ip: custIp
    }, cb)
  }

  /**
   * Submit new order
   *
   * @param {Order} order - order model instance
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  submitOrder (order, cb) {
    const packet = order.toNewOrderPacket()

    if (this._affCode) {
      if (!packet.meta) {
        packet.meta = {}
      }

      packet.meta.aff_code = packet.meta.aff_code || this._affCode // eslint-disable-line
    }

    return this._makeAuthRequest('/auth/w/order/submit', packet, cb)
      .then((res) => {
        // 2 orders can be returned if OCO was used. But due to the interface
        // we can only return one. User should use getOrders instead
        const orders = _takeResNotify(res).notifyInfo || []
        return orders[0] || []
      })
  }

  /**
   * Update existing order
   *
   * @param {object} changes - updates to order
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  updateOrder (changes, cb) {
    return this._makeAuthRequest('/auth/w/order/update', changes, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel existing order
   *
   * @param {number} id - order id
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  cancelOrder (id, cb) {
    return this._makeAuthRequest('/auth/w/order/cancel', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel existing order using the cID
   *
   * @param {number} cid - cid
   * @param {string} date - Date of order YYYY-MM-DD
   * @param {Method} cb - callback
   * @returns {Promise} p
   */
  cancelOrderWithCid (cid, date, cb) {
    return this._makeAuthRequest('/auth/w/order/cancel', { cid, cid_date: date }, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit multiple orders.
   *
   * @param {order[]} orders - list of orders (can be object literal or Order class instance)
   * @param {Function} [cb]  - callback
   * @returns {Promise} p
   */
  submitOrderMulti (orders = [], cb) {
    if (!Array.isArray(orders)) {
      const e = new Error('orders should be an array')
      return this._cb(e, null, cb)
    }

    const payload = orders.map((order) => {
      // generate new packet from instance of Order class to ensure consistent payload signature
      const packet = (order instanceof Order ? order : new Order(order)).toNewOrderPacket()
      if (this._affCode) {
        packet.meta.aff_code = packet.meta.aff_code || this._affCode
      }

      return ['on', packet]
    })

    return this._makeAuthRequest('/auth/w/order/multi', { ops: payload }, cb)
      .then(_takeResNotify)
  }

  /**
   * Update multiple orders.
   *
   * @param {order[]} orders - list of orders (can be object literal or Order class instance)
   * @param {Function} [cb]  - callback
   * @returns {Promise} p
   */
  updateOrderMulti (orders = [], cb) {
    if (!Array.isArray(orders)) {
      const e = new Error('orders should be an array')
      return this._cb(e, null, cb)
    }

    const payload = orders.map((order) => {
      return ['ou', order]
    })

    return this._makeAuthRequest('/auth/w/order/multi', { ops: payload }, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel orders.
   *
   * @param {number[]} ids   - list of order ids to cancel
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  cancelOrders (ids = [], cb) {
    if (!Array.isArray(ids)) {
      const e = new Error('ids should be an array')
      return this._cb(e, null, cb)
    }

    const payload = ['oc_multi', { id: ids }]

    return this._makeAuthRequest('/auth/w/order/multi', { ops: [payload] }, cb)
      .then(_takeResNotify)
  }

  /**
   * @typedef {object} MultiOrderOpPayload
   * @property {number|number[]} [id] - array of order IDs or single order ID
   */

  /**
   * @typedef {Array} MultiOrderOp
   * @property {string} 0 - operation, i.e. 'oc', 'on', 'oc_multi', 'ou'
   * @property {MultiOrderOpPayload|Order} 1 - payload, i.e. { id: [1, 2] }
   */

  /**
   * Send Multiple order-related operations.
   *
   * @param {MultiOrderOp[]} ops - array of order operations
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-order-multi
   */
  orderMultiOp (ops = [], cb) {
    if (!Array.isArray(ops)) {
      const e = new Error('ops should be an array')
      return this._cb(e, null, cb)
    }

    if (ops.some((op) => !Array.isArray(op))) {
      const e = new Error('ops should contain only arrays')
      return this._cb(e, null, cb)
    }

    ops = ops.map((op) => {
      if (op[0] === 'on' && op[1]) {
        // to ensure consistent payload signature
        // generate new packet from instance of Order class
        const packet = (
          op[1] instanceof Order
            ? op[1]
            : new Order(op[1])
        ).toNewOrderPacket()

        if (this._affCode) {
          packet.meta.aff_code = packet.meta.aff_code || this._affCode
        }

        // update the payload order with enriched one
        op[1] = packet
      }
      return op
    })

    return this._makeAuthRequest('/auth/w/order/multi', { ops }, cb)
      .then(_takeResNotify)
  }

  /**
   * @typedef {Array} ClientOrderIdPayload
   * @property {number} 0 - client order ID
   * @property {string} 1 - client order ID date i.e. '2020-05-28'
   */

  /**
   * Cancel multiple orders simultaneously.
   *
   * @param {object} params         - Cancel order parameters
   * @param {number[]} [params.id]  - array of order ID's
   * @param {number[]} [params.gid] - array of group ID's
   * @param {ClientOrderIdPayload[]} [params.cid] - i.e. [[ 1234, 2020-05-28']]
   * @param {number} [params.all]   - flag, i.e. 1 to cancel all open orders
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-order-cancel-multi
   */
  cancelOrderMulti (params, cb) {
    return this._makeAuthRequest('/auth/w/order/cancel/multi', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Claim existing open position
   *
   * @param {number} id - position id
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  claimPosition (id, cb) {
    return this._makeAuthRequest('/auth/w/position/claim', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit new funding offer
   *
   * @param {object} offer - offer model instance
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  submitFundingOffer (offer, cb) {
    const packet = offer.toNewOfferPacket()

    if (this._affCode) {
      if (!packet.meta) {
        packet.meta = {}
      }

      packet.meta.aff_code = packet.meta.aff_code || this._affCode // eslint-disable-line
    }

    return this._makeAuthRequest('/auth/w/funding/offer/submit', packet, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel existing funding offer
   *
   * @param {number} id - offer id
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  cancelFundingOffer (id, cb) {
    return this._makeAuthRequest('/auth/w/funding/offer/cancel', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel all existing funding offers
   *
   * @param {object} params - parameters
   * @param {string} params.currency - currency i.e USD
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  cancelAllFundingOffers (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/offer/cancel/all', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Close funding
   *
   * @param {object} params - parameters
   * @param {number} params.id - funding id
   * @param {string} params.type - funding type LIMIT | FRRDELTAVAR
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  closeFunding (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/close', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit automatic funding
   *
   * @param {object} params - parameters
   * @param {number} params.status - status
   * @param {string} params.currency - currency i.e fUSD
   * @param {number} params.amount - amount to borrow/lend
   * @param {number} params.rate - if == 0 then FRR is used
   * @param {number} params.period - time the offer remains locked in for
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  submitAutoFunding (params, cb) {
    return this._makeAuthRequest('/auth/w/funding/auto', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Execute a balance transfer between wallets
   *
   * @param {object} params - parameters
   * @param {number} params.amount - amount to transfer
   * @param {string} params.from - wallet from
   * @param {string} params.to - wallet to
   * @param {string} params.currency - currency from
   * @param {string} params.currencyTo - currency to
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  transfer (params, cb) {
    params.currency_to = params.currencyTo
    return this._makeAuthRequest('/auth/w/transfer', params, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} params - parameters
   * @param {string} params.wallet - wallet i.e exchange, margin
   * @param {string} params.method - protocol method i.e bitcoin, tetherus
   * @param {nubmer} params.opRenew - if 1 then generates a new address
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  getDepositAddress (params, cb) {
    params.op_renew = params.opRenew
    return this._makeAuthRequest('/auth/w/deposit/address', params, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} params - parameters
   * @param {string} params.wallet - wallet i.e exchange, margin
   * @param {string} params.method - protocol method i.e bitcoin, tetherus
   * @param {number} params.amount - amount to withdraw
   * @param {string} params.address - destination address
   * @param {Function} [cb] - callback
   * @returns {Promise} p
   */
  withdraw (params, cb) {
    return this._makeAuthRequest('/auth/w/withdraw', params, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} params             - parameters
   * @param {string} params.title       - the title of your Pulse message
   * @param {string} params.content     - content of your Pulse message
   * @param {number} params.isPublic    - make Pulse message public
   * @param {string} params.isPin       - make Pulse message pinned
   * @param {string} params.attachments - Base64 encoded list of strings
   * @param {Function} [cb]             - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-add
   */
  addPulse (params, cb) {
    return this._makeAuthRequest('/auth/w/pulse/add', params, cb, PulseMessage)
  }

  /**
   * @param {object} params             - parameters
   * @param {string} params.parent      - the parent id of the Pulse message
   * @param {string} params.content     - content of your Pulse message
   * @param {number} params.isPublic    - make Pulse message public
   * @param {string} params.isPin       - make Pulse message pinned
   * @param {string} params.attachments - Base64 encoded list of strings
   * @param {Function} [cb]             - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-add
   */
  addPulseComment (params, cb) {
    const { parent = '' } = params || {}
    if (_isEmpty(parent)) {
      return this._cb(new Error('parent (pulse id value) is required for adding comments'), null, cb)
    }
    return this.addPulse(params, cb)
  }

  /**
   * @param {object} params             - parameters
   * @param {string} params.parent      - the parent id of the Pulse message
   * @param {number} params.isPublic    - fetched public comments of a pulse
   * @param {string} params.limit       - number of comments
   * @param {string} params.end         - fetch comments starting from a given time in milliseconds
   * @param {Function} [cb]             - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-hist
   */
  fetchPulseComments (params, cb) {
    const { parent = '' } = params || {}
    if (_isEmpty(parent)) {
      return this._cb(new Error('parent (pulse id value) is required for fetching comments'), null, cb)
    }
    return this.pulseHistory(params, cb)
  }

  /**
   * @param {object} params     - parameters
   * @param {string} params.pid - pulse id
   * @param {Function} [cb]     - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-del
   */
  deletePulse (params, cb) {
    return this._makeAuthRequest('/auth/w/pulse/del', params, cb)
  }

  /**
   * @param {object} params          - parameters
   * @param {number} params.isPublic - allows you to receive the public pulse history with the UID_LIKED field
   * @param {Function} [cb]          - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-hist
   */
  pulseHistory (params, cb) {
    return this._makeAuthRequest('/auth/r/pulse/hist', params, cb, PulseMessage)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} params.currency - currency for which you wish to generate an invoice. Currently only LNX (Bitcoin Lightning Network) is available
   * @param {string} params.wallet   - wallet that will receive the invoice payment. Currently only 'exchange' is available
   * @param {string} params.amount   - amount that you wish to deposit (in BTC; min 0.000001, max 0.02)
   * @param {Function} [cb]          - callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-deposit-invoice
   */
  generateInvoice (params, cb) {
    return this._makeAuthRequest('/auth/w/deposit/invoice', params, cb, Invoice)
  }
}

RESTv2.url = API_URL

module.exports = RESTv2
