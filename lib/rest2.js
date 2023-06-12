'use strict'

const debug = require('debug')('bfx:rest2')
const fetch = require('node-fetch')
const _isEmpty = require('lodash/isEmpty')
const _isString = require('lodash/isString')
const _isFunction = require('lodash/isFunction')
const _pick = require('lodash/pick')
const _omitBy = require('lodash/omitBy')
const _isNil = require('lodash/isNil')
const _isInteger = require('lodash/isInteger')
const _flatten = require('lodash/flatten')
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
  MovementInfo,
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
  Invoice,
  SymbolDetails,
  TransactionFee,
  AccountSummary,
  AuthPermission,
  CoreSettings
} = require('bfx-api-node-models')

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
   * @param {number} [opts.timeout] - default 15000
   */
  constructor (opts = {
    affCode: null,
    apiKey: '',
    apiSecret: '',
    authToken: '',
    company: '',
    url: API_URL,
    transform: false,
    agent: null,
    timeout: BASE_TIMEOUT
  }) {
    this._checkOpts(opts)

    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._authToken = opts.authToken || ''
    this._company = opts.company || ''
    this._transform = !!opts.transform
    this._agent = opts.agent
    this._affCode = opts.affCode
    this._timeout = _isInteger(opts.timeout)
      ? opts.timeout
      : BASE_TIMEOUT
  }

  /**
   * Check constructor options
   *
   * @param {object} opts - constructor options
   * @throws {Error} - throws an Error if check is not passed
   * @returns {undefined}
   * @private
   */
  _checkOpts (opts) {
    if (
      !_isNil(opts.timeout) &&
      !_isInteger(opts.timeout)
    ) {
      throw new Error('ERR_TIMEOUT_DATA_TYPE_ERROR')
    }
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

  async _request (url, reqOpts, transformer, cb) {
    try {
      const resp = await fetch(url, reqOpts)
      const raw = await resp.text()
      if (!resp.ok) {
        const err = this._apiError(resp, raw)
        throw err
      }
      const json = JSON.parse(raw)
      return this._response(json, transformer, cb)
    } catch (err) {
      return this._cb(err, null, cb)
    }
  }

  _apiError (resp, rawBody) {
    const err = new Error(`HTTP code ${resp.status} ${resp.statusText || ''}`)
    err.status = resp.status
    err.statustext = resp.statusText
    try {
      const [, code, response] = JSON.parse(rawBody)
      err.code = code
      err.response = response
    } catch (_err) {
      err.response = rawBody
    }

    return err
  }

  /**
   * @param {string} path - path
   * @param {object} payload - payload
   * @param {Function} [cb] - legacy callback
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
   * @private
   */
  async _makeAuthRequest (path, payload = {}, cb, transformer) {
    if ((!this._apiKey || !this._apiSecret) && !this._authToken) {
      const e = new Error('missing api key or secret')
      return this._cb(e, null, cb)
    }

    const url = `${this._url}/v2${path}`
    const n = nonce()
    const sanitizedPayload = _omitBy(payload, _isNil)
    const keys = () => {
      const sigPayload = `/api/v2${path}${n}${JSON.stringify(sanitizedPayload)}`
      const { sig } = genAuthSig(this._apiSecret, sigPayload)
      return { 'bfx-apikey': this._apiKey, 'bfx-signature': sig }
    }
    const auth = (this._authToken)
      ? { 'bfx-token': this._authToken }
      : keys()

    debug('POST %s', url)

    const reqOpts = {
      method: 'POST',
      timeout: this._timeout,
      headers: {
        'content-type': 'application/json',
        'bfx-nonce': n,
        ...auth
      },
      agent: this._agent,
      body: JSON.stringify(sanitizedPayload)
    }

    return this._request(url, reqOpts, transformer, cb)
  }

  /**
   * @param {string} path - path
   * @param {Function} [cb] - legacy callback
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
   * @private
   */
  async _makePublicRequest (path, cb, transformer) {
    if (cb !== null && typeof cb !== 'function') {
      throw new Error('callback must be a function')
    }
    const url = `${this._url}/v2${path}`

    debug('GET %s', url)

    const reqOpts = {
      method: 'GET',
      timeout: this._timeout,
      agent: this._agent
    }

    return this._request(url, reqOpts, transformer, cb)
  }

  /**
   * @param {string} path - path
   * @param {object} body - payload
   * @param {Function} [cb] - legacy callback
   * @param {object|Function} transformer - model class or function
   * @returns {Promise} p
   * @private
   */
  async _makePublicPostRequest (path, payload, cb, transformer) {
    const url = `${this._url}/v2${path}`

    debug('POST %s', url)

    const sanitizedPayload = _omitBy(payload, _isNil)

    const reqOpts = {
      method: 'POST',
      timeout: this._timeout,
      headers: {
        'content-type': 'application/json'
      },
      agent: this._agent,
      body: JSON.stringify(sanitizedPayload)
    }

    return this._request(url, reqOpts, transformer, cb)
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
   * @param {Function} [cb] - legacy callback
   * @returns {Promise<object|object[]>} finalData
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
   * @param {Function} [cb] - legacy callback
   * @returns {Promise} p
   * @private
   */
  _cb (err, res, cb) {
    const _isCbFunc = _isFunction(cb)

    if (err) {
      if (err.error && err.error[1] === 10114) {
        err.message += ' see https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }
      return _isCbFunc ? cb(err) : Promise.reject(err)
    }

    return _isCbFunc ? cb(null, res) : Promise.resolve(res)
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
   * @param {object} params        - parameters
   * @param {string} params.symbol - i.e. tBTCUSD
   * @param {string} params.prec   - i.e. P0
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-books
   */
  orderBook (params, cb = null) {
    const { symbol, prec } = params
    return this._makePublicRequest(`/book/${symbol}/${prec}`, cb)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} params.nickname - i.e. Bitfinex
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-profile
   */
  publicPulseProfile (params, cb = null) {
    const { nickname } = params
    return this._makePublicRequest(`/pulse/profile/${nickname}`, cb, PublicPulseProfile)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.limit  - Number of records (Max: 100)
   * @param {string} params.end    - Millisecond start time
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-hist
   */
  publicPulseHistory (params, cb = null) {
    const { limit, end } = params
    return this._makePublicRequest(`/pulse/hist?limit=${limit}&end=${end}`, cb, PulseMessage)
  }

  /**
   * @param {object} params              - parameters
   * @param {string} params.symbol       - Symbol you want information about i.e tBTCUSD, fUSD
   * @param {string} params.amount       - Amount. Positive for buy, negative for sell (ex. "1.123")
   * @param {string} [params.period]     - (optional) Maximum period for Margin Funding
   * @param {string} [params.rate_limit] - Limit rate/price (ex. "1000.5")
   * @param {Function} [cb]              - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-calc-market-average-price
   */
  marketAveragePrice (params, cb = null) {
    const usp = new URLSearchParams(params)
    return this._makePublicPostRequest(`/calc/trade/avg?${usp.toString()}`, {}, cb)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-platform-status
   */
  status (params = {}, cb = null) {
    return this._makePublicRequest('/platform/status', cb)
  }

  /**
   * @param {object} [params]        - parameters
   * @param {string} [params.type]   - type
   * @param {string[]} [params.keys] - keys
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#status
   */
  statusMessages (params = {}, cb = null) {
    const { type = 'deriv', keys = ['ALL'] } = params
    const url = `/status/${type}?keys=${keys.join(',')}`
    const transformer = (type === 'deriv') ? StatusMessagesDeriv : null

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-ticker
   */
  ticker (params, cb = null) {
    const { symbol } = params
    const transformer = (data) => {
      const ticker = [symbol, ...data]
      return (symbol[0] === 't')
        ? new TradingTicker(ticker)
        : new FundingTicker(ticker)
    }

    return this._makePublicRequest(`/ticker/${symbol}`, cb, transformer)
  }

  /**
   * @param {object} [params]           - parameters
   * @param {string[]} [params.symbols] - symbols
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-tickers
   */
  tickers (params = {}, cb = null) {
    const { symbols = [] } = params
    const transformer = (data) => {
      return data.map(ticker => (
        (ticker[0] || '')[0] === 't'
          ? new TradingTicker(ticker)
          : new FundingTicker(ticker)
      ))
    }

    const url = `/tickers?symbols=${symbols.length ? symbols.join(',') : 'ALL'}`
    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {object} [params]           - parameters
   * @param {string[]} [params.symbols] - symbols
   * @param {number} [params.start]     - query start timestamp
   * @param {number} [params.end]       - query end timestamp
   * @param {number} [params.limit]     - query limit
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-tickers-history
   */
  tickersHistory (params = {}, cb = null) {
    const { symbols = [], start, end, limit = 250 } = params
    const transformer = (data) => {
      return data.map(ticker => (
        (ticker[0] || '')[0] === 't'
          ? new TradingTickerHist(ticker)
          : new FundingTickerHist(ticker)
      ))
    }

    const s = (start) ? `&start=${start}` : ''
    const e = (end) ? `&end=${end}` : ''
    const query = `?symbols=${symbols.length ? symbols.join(',') : 'ALL'}${s}${e}&limit=${limit}`
    const url = `/tickers/hist${query}`

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * @param {object} params         - parameters
   * @param {string} params.key     - key
   * @param {string} params.context - context
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-stats
   */
  stats (params, cb = null) {
    const { key, context } = params
    return this._makePublicRequest(`/stats1/${key}/${context}`, cb)
  }

  /**
   * @param {object} params               - parameters
   * @param {string} params.timeframe     - 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M
   * @param {string} params.symbol        - symbol
   * @param {string} params.section       - hist, last
   * @param {object} [params.query]       - query params
   * @param {number} [params.query.sort]  - query sort param
   * @param {number} [params.query.start] - query sort param
   * @param {number} [params.query.end]   - query sort param
   * @param {number} [params.query.limit] - query sort param
   * @param {Function} [cb]               - legacy callback
   * @returns {Promise} p
   * @see http://docs.bitfinex.com/v2/reference#rest-public-candles
   */
  candles (params, cb = null) {
    const { timeframe, symbol, section, query = {} } = params
    let url = `/candles/trade:${timeframe}:${symbol}/${section}`

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, Candle)
  }

  /**
   * Query configuration information
   *
   * @param {object} [params]        - parameters
   * @param {string[]} [params.keys] - keys
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   */
  conf (params = {}, cb = null) {
    const { keys = [] } = params
    if (_isEmpty(keys)) {
      return this._response([], null, cb)
    }

    const url = `/conf/${keys.join(',')}`
    return this._makePublicRequest(url, cb)
  }

  /**
   * Get a list of valid currencies ids, full names, pool and explorer
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-currencies
   */
  async currencies (params = {}, cb = null) {
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
   * @param {object} params      - parameters
   * @param {string} params.type - type
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-list
   */
  alertList (params, cb = null) {
    const { type } = params
    return this._makeAuthRequest('/auth/r/alerts', { type }, cb, Alert)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.type   - type
   * @param {string} params.symbol - symbol
   * @param {number} params.price  - price
   * @param {Function} [cb] - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-set
   */
  alertSet (params, cb = null) {
    const { type, symbol, price } = params
    return this._makeAuthRequest('/auth/w/alert/set', { type, symbol, price }, cb, Alert)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {number} params.price  - price
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete
   */
  alertDelete (params, cb = null) {
    const { symbol, price } = params
    return this._makeAuthRequest('/auth/w/alert/del', { symbol, price }, cb)
  }

  /**
   * @param {object} params         - parameters
   * @param {string} params.symbol  - symbol
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {number} [params.sort]  - if 1, sorts results oldest first
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-trades
   */
  trades (params, cb = null) {
    const { symbol, start, end, limit, sort } = params
    const query = {}

    Object.assign(query, _omitBy({ start, end, limit, sort }, _isNil))

    let url = `/trades/${symbol}/hist`

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, PublicTrade)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {number} [params.sort]  - if 1, sorts results oldest first
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-liquidations
   */
  liquidations (params = {}, cb = null) {
    const { start, end, limit, sort } = params
    const query = {}

    Object.assign(query, _omitBy({ start, end, limit, sort }, _isNil))

    let url = '/liquidations/hist'

    if (Object.keys(query).length > 0) {
      url += `?${new URLSearchParams(query).toString()}`
    }

    return this._makePublicRequest(url, cb, Liquidations)
  }

  /**
   * @param {object} [params]        - parameters
   * @param {string} [params.symbol] - optional, omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {number} [params.sort]   - if 1, sorts results oldest first
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-trades-hist
   */
  accountTrades (params = {}, cb = null) {
    const { symbol, start, end, limit, sort } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/trades/${symbol}/hist`
      : '/auth/r/trades/hist'

    return this._makeAuthRequest(url, {
      start, end, limit, sort
    }, cb, Trade)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-logins-hist
   */
  logins (params = {}, cb = null) {
    const url = '/auth/r/logins/hist'
    const { start, end, limit } = params

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, Login)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets
   */
  wallets (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/wallets', params, cb, Wallet)
  }

  /**
   * @param {object} [params]          - parameters
   * @param {number} [params.end]      - query end
   * @param {string} [params.currency] - currency
   * @param {Function} [cb]            - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-wallets-hist
   */
  walletsHistory (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/wallets/hist', params, cb, WalletHist)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-info-user
   */
  userInfo (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/info/user', params, cb, UserInfo)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
   */
  activeOrders (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/orders', params, cb, Order)
  }

  /**
   * @param {object} params    - parameters
   * @param {Array} params.ids - order ids
   * @param {Function} cb      - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-orders
   */
  activeOrdersWithIds (params, cb = null) {
    const { ids } = params
    const url = '/auth/r/orders'
    return this._makeAuthRequest(url, { id: ids }, cb, Order)
  }

  /**
   * @param {object} [params]           - parameters
   * @param {string} [params.ccy]       - i.e. ETH
   * @param {number} [params.start]     - query start
   * @param {number} [params.end]       - query end
   * @param {number} [params.limit]     - query limit, default 25
   * @param {string} [params.address]   - query address
   * @param {Array<number>} [params.id] - Optional array of deposit/withdrawal ids
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#movements
   */
  movements (params = {}, cb = null) {
    const { ccy, start, end, limit = 25, id, address } = params
    const url = ccy
      ? `/auth/r/movements/${ccy}/hist`
      : '/auth/r/movements/hist'

    return this._makeAuthRequest(url, { start, end, limit, id, address }, cb, Movement)
  }

  /**
   * @param {object} [params]    - parameters
   * @param {number} [params.id] - movement id
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/movement-info
   */
  movementInfo (params, cb = null) {
    const { id } = params
    const url = '/auth/r/movements/info'

    return this._makeAuthRequest(url, { id }, cb, MovementInfo)
  }

  /**
   * @param {object} params                - parameters
   * @param {object|string} params.filters - filters
   * @param {number} [params.start]        - query start
   * @param {number} [params.end]          - query end
   * @param {number} [params.limit]        - default 25
   * @param {Function} [cb]                - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#ledgers
   */
  ledgers (params, cb = null) {
    const { filters, start, end, limit = 25 } = params
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
   * @param {object} [params]        - parameters
   * @param {string} [params.symbol] - optional, omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-orders-history
   */
  orderHistory (params = {}, cb = null) {
    const { symbol, start, end, limit } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/orders/${symbol}/hist`
      : '/auth/r/orders/hist'

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, Order)
  }

  /**
   * @param {object} params    - parameters
   * @param {Array} params.ids - order ids
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-orders-history
   */
  orderHistoryWithIds (params, cb = null) {
    const { ids } = params
    const url = '/auth/r/orders/hist'
    return this._makeAuthRequest(url, { id: ids }, cb, Order)
  }

  /**
   * @param {object} params           - parameters
   * @param {string} params.symbol    - symbol
   * @param {number} [params.start]   - query start
   * @param {number} [params.end]     - query end
   * @param {number} [params.limit]   - query limit
   * @param {number} params.orderId   - order ID
   * @param {Function} [cb]           - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-order-trades
   */
  orderTrades (params, cb = null) {
    const { symbol, start, end, limit, orderId } = params
    return this._makeAuthRequest(`/auth/r/order/${symbol}:${orderId}/trades`, {
      start, end, limit
    }, cb, Trade)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions
   */
  positions (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/positions', params, cb, Position)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-history
   */
  positionsHistory (params = {}, cb = null) {
    const { start, end, limit = 50 } = params
    return this._makeAuthRequest('/auth/r/positions/hist', {
      start, end, limit
    }, cb, Position)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number[]} [params.id]  - ids of positions to audit
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-audit
   */
  positionsAudit (params = {}, cb = null) {
    const { id, start, end, limit = 250 } = params
    return this._makeAuthRequest('/auth/r/positions/audit', {
      id, start, end, limit
    }, cb, Position)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-positions-snap
   */
  positionsSnapshot (params = {}, cb = null) {
    const { start, end, limit = 50 } = params
    return this._makeAuthRequest('/auth/r/positions/snap', {
      start, end, limit
    }, cb, Position)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers
   */
  fundingOffers (params, cb = null) {
    const { symbol } = params
    return this._makeAuthRequest(`/auth/r/funding/offers/${symbol}`, {}, cb, FundingOffer)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} [params.symbol] - omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers-hist
   */
  fundingOfferHistory (params, cb = null) {
    const { symbol = '', start, end, limit } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/offers/${symbol}/hist`
      : '/auth/r/funding/offers/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingOffer)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans
   */
  fundingLoans (params, cb = null) {
    const { symbol } = params
    return this._makeAuthRequest(`/auth/r/funding/loans/${symbol}`, {}, cb, FundingLoan)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} [params.symbol] - omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans-hist
   */
  fundingLoanHistory (params, cb = null) {
    const { symbol = '', start, end, limit } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/loans/${symbol}/hist`
      : '/auth/r/funding/loans/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingLoan)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits
   */
  fundingCredits (params, cb = null) {
    const { symbol } = params
    return this._makeAuthRequest(`/auth/r/funding/credits/${symbol}`, {}, cb, FundingCredit)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} [params.symbol] - omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits-hist
   */
  fundingCreditHistory (params, cb = null) {
    const { symbol = '', start, end, limit } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/credits/${symbol}/hist`
      : '/auth/r/funding/credits/hist'
    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingCredit)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} [params.symbol] - optional, omit/leave empty for all
   * @param {number} [params.start]  - query start
   * @param {number} [params.end]    - query end
   * @param {number} [params.limit]  - query limit
   * @param {Function} [cb] - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-funding-trades-hist
   */
  fundingTrades (params, cb = null) {
    const { symbol = '', start, end, limit } = params
    const url = !_isEmpty(symbol)
      ? `/auth/r/funding/trades/${symbol}/hist`
      : '/auth/r/funding/trades/hist'

    return this._makeAuthRequest(url, {
      start, end, limit
    }, cb, FundingTrade)
  }

  /**
   * @param {object} [params]     - parameters
   * @param {string} [params.key] - key
   * @param {Function} [cb]       - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-margin
   */
  marginInfo (params = {}, cb = null) {
    const { key = 'base' } = params
    return this._makeAuthRequest(`/auth/r/info/margin/${key}`, {}, cb, MarginInfo)
  }

  /**
   * @param {object} [params]       - parameters
   * @param {number} [params.start] - query start
   * @param {number} [params.end]   - query end
   * @param {number} [params.limit] - query limit
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-audit-hist
   */
  changeLogs (params = {}, cb = null) {
    const { start, end, limit } = params
    return this._makeAuthRequest('/auth/r/audit/hist', {
      start, end, limit
    }, cb, ChangeLog)
  }

  /**
   * @param {object} params     - parameters
   * @param {string} params.key - key
   * @param {Function} [cb]     - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-info-funding
   */
  fundingInfo (params, cb = null) {
    const { key } = params
    return this._makeAuthRequest(`/auth/r/info/funding/${key}`, {}, cb)
  }

  /**
   * @param {object} params      - parameters
   * @param {string} params.type - Specify the funding type ('credit' or 'loan')
   * @param {string} params.id   - The loan or credit id
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-keep-funding
   */
  keepFunding (params, cb = null) {
    const { type, id } = params
    return this._makeAuthRequest('/auth/w/funding/keep', { type, id }, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-performance
   */
  performance (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/stats/perf:1D/hist', params, cb)
  }

  /**
   * @param {object} params        - parameters
   * @param {string} params.symbol - symbol
   * @param {string} params.type   - type
   * @param {string} [params.dir]  - dir
   * @param {number} [params.rate] - rate
   * @param {string} [params.lev]  - lev
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/rest-auth-calc-order-avail
   */
  calcAvailableBalance (params, cb = null) {
    return this._makeAuthRequest('/auth/calc/order/avail', params, cb)
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-symbols
   */
  symbols (params = {}, cb = null) {
    const url = '/conf/pub:list:pair:exchange'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Get a list of inactive symbol names
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-symbols
   */
  inactiveSymbols (params = {}, cb = null) {
    const url = '/conf/pub:list:pair:exchange:inactive'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Get a list of valid symbol names
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-public-futures
   */
  futures (params = {}, cb = null) {
    const url = '/conf/pub:list:pair:futures'
    return this._makePublicRequest(url, cb, (data) => {
      return data && data[0]
    })
  }

  /**
   * Changes the collateral value of an active derivatives position for a certain pair.
   *
   * @param {object} params            - parameters
   * @param {string} params.symbol     - symbol
   * @param {number} params.collateral - collateral
   * @param {Function} [cb]            - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/v2/reference#rest-auth-deriv-pos-collateral-set
   */
  derivsPositionCollateralSet (params, cb = null) {
    const { symbol, collateral } = params
    const url = '/auth/w/deriv/collateral/set'
    const isRequestValid = (res) => !!(res && res[0] && res[0][0])
    return this._makeAuthRequest(url, {
      symbol, collateral
    }, cb, isRequestValid)
  }

  /**
   * Get a list of valid symbol names and details
   *
   * @param {object} [params]                     - parameters
   * @param {boolean} [params.includeFuturePairs] - optional, default value is true
   * @param {Function} [cb]                       - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-conf
   */
  symbolDetails (params = {}, cb = null) {
    const { includeFuturePairs = true } = params
    const url = `/conf/pub:info:pair${includeFuturePairs ? ',pub:info:pair:futures' : ''}`

    const transformer = (data) => {
      return data && this._classTransform(_flatten(data), SymbolDetails)
    }

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * Request account withdrawl fees
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   */
  accountFees (params = {}, cb = null) {
    const url = '/conf/pub:map:currency:tx:fee'
    const transformer = (data) => {
      return data && this._classTransform(data[0], TransactionFee)
    }

    return this._makePublicRequest(url, cb, transformer)
  }

  /**
   * Returns a 30-day summary of your trading volume and return on margin
   * funding.
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-summary
   */
  accountSummary (params = {}, cb = null) {
    const url = '/auth/r/summary'
    return this._makeAuthRequest(url, params, cb, AccountSummary)
  }

  /**
   * Fetch the permissions of the key or token being used to generate this request
   *
   * @param {object} [params] - parameters
   * @param {Function} [cb]   - legacy callback
   * @returns {Promise} p
   */
  keyPermissions (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/permissions', params, cb, AuthPermission)
  }

  /**
   * @param {object} params             - parameters
   * @param {number} params.position_id - position ID
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   *
   * @see https://docs.bitfinex.com/reference#rest-auth-submit-order
   */
  closePosition (params, cb = null) {
    return this.positions()
      .then(res => {
        if (!this._transform) {
          res = res.map(row => new Position(row, this))
        }

        const position = res.find(p => p.id === params.position_id && p.status === 'ACTIVE')
        if (!position) throw new Error('position not found')

        return position
      })
      .then(position => {
        const order = new Order({
          type: Order.type.MARKET,
          symbol: position.symbol,
          amount: position.amount * -1,
          flags: Order.flags.POS_CLOSE
        })

        return this.submitOrder({ order })
      })
      .then(res => this._cb(null, res, cb))
      .catch(err => this._cb(err, null, cb))
  }

  /**
   * @param {object} params          - parameters
   * @param {object} params.settings - key:value map
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   */
  updateSettings (params, cb = null) {
    const { settings } = params
    return this._makeAuthRequest('/auth/w/settings/set', {
      settings
    }, cb)
  }

  /**
   * @param {object} params        - parameters
   * @param {string[]} params.keys - keys
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   */
  deleteSettings (params, cb = null) {
    const { keys } = params
    return this._makeAuthRequest('/auth/w/settings/del', { keys }, cb)
  }

  /**
   * @param {object} params        - parameters
   * @param {string[]} params.keys - keys
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   */
  getSettings (params, cb = null) {
    const { keys } = params
    return this._makeAuthRequest('/auth/r/settings', { keys }, cb)
  }

  /**
   * @param {object} params        - parameters
   * @param {string[]} params.keys - keys
   * @param {Function} [cb]        - legacy callback
   * @returns {Promise} p
   */
  getCoreSettings (params, cb = null) {
    const { keys } = params
    return this._makeAuthRequest('/auth/r/settings/core', { keys }, cb, CoreSettings)
  }

  /**
   * @param {object} params      - parameters
   * @param {string} params.ccy1 - i.e. BTC
   * @param {string} params.ccy2 - i.e. USD
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   */
  async exchangeRate (params, cb = null) {
    const { ccy1, ccy2 } = params
    const res = await this._makePublicPostRequest('/calc/fx', { ccy1, ccy2 })
    return this._response(res[0], null, cb)
  }

  /**
   * @param {object} params                    - parameters
   * @param {string} params.scope              - scope of the token
   * @param {number} [params.ttl]              - time-to-live in seconds
   * @param {string[]} [params.caps]           - token caps/permissions
   * @param {boolean} [params.writePermission] - token write permission
   * @param {string} [params._cust_ip]         - user ip address
   * @param {Function} [cb]                    - legacy callback
   * @returns {Promise} p
   */
  generateToken (params, cb = null) {
    let opts = _pick(params || {}, ['ttl', 'scope', 'caps', 'writePermission', '_cust_ip'])
    opts = _omitBy(params, _isNil)
    if (!opts.scope) return this._cb(new Error('scope param is required'), null, cb)

    return this._makeAuthRequest('/auth/w/token', opts, cb)
  }

  /**
   * @param {object} params           - parameters
   * @param {string} params.authToken - target that will be invalidated
   * @param {Function} [cb]           - legacy callback
   * @returns {Promise} p
   */
  invalidateAuthToken (params, cb = null) {
    const { authToken } = params
    return this._makeAuthRequest('/auth/w/token/del', { token: authToken }, cb)
  }

  /**
   * Submit new order
   *
   * @param {object} params      - parameters
   * @param {Order} params.order - order model instance
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   */
  submitOrder (params, cb = null) {
    const { order } = params
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
        const data = orders[0] || []

        return (this._transform)
          ? this._doTransform(data, Order)
          : data
      })
  }

  /**
   * Update existing order
   *
   * @param {object} params - changes
   * @param {Function} [cb] - legacy callback
   * @returns {Promise} p
   */
  updateOrder (params, cb = null) {
    return this._makeAuthRequest('/auth/w/order/update', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel existing order
   *
   * @param {object} params    - parameters
   * @param {number} params.id - order id
   * @param {Function} [cb]    - legacy callback
   * @returns {Promise} p
   */
  cancelOrder (params, cb = null) {
    const { id } = params
    return this._makeAuthRequest('/auth/w/order/cancel', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel existing order using the cID
   *
   * @param {object} params      - parameters
   * @param {number} params.cid  - cid
   * @param {string} params.date - Date of order YYYY-MM-DD
   * @param {Function} cb        - legacy callback
   * @returns {Promise} p
   */
  cancelOrderWithCid (params, cb = null) {
    const { cid, date } = params
    return this._makeAuthRequest('/auth/w/order/cancel', { cid, cid_date: date }, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit multiple orders.
   *
   * @param {object} params                     - parameters
   * @param {Array<Order|object>} params.orders - list of orders (can be object literal or Order class instance)
   * @param {Function} [cb]                     - legacy callback
   * @returns {Promise} p
   */
  submitOrderMulti (params, cb = null) {
    const { orders } = params
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
   * @param {object} params                     - parameters
   * @param {Array<Order|object>} params.orders - list of orders (can be object literal or Order class instance)
   * @param {Function} [cb]                     - legacy callback
   * @returns {Promise} p
   */
  updateOrderMulti (params, cb = null) {
    const { orders } = params
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
   * @param {object} params         - parameters
   * @param {number[]} params.ids   - list of order ids to cancel
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   */
  cancelOrders (params, cb = null) {
    const { ids } = params
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
   * @param {object} params             - parameters
   * @param {MultiOrderOp[]} params.ops - array of order operations
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-order-multi
   */
  orderMultiOp (params, cb = null) {
    let { ops } = params
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
   * @param {object} params                       - Cancel order parameters
   * @param {number[]} [params.id]                - array of order ID's
   * @param {number[]} [params.gid]               - array of group ID's
   * @param {ClientOrderIdPayload[]} [params.cid] - i.e. [[ 1234, 2020-05-28']]
   * @param {number} [params.all]                 - flag, i.e. 1 to cancel all open orders
   * @param {Function} [cb]                       - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-order-cancel-multi
   */
  cancelOrderMulti (params, cb = null) {
    return this._makeAuthRequest('/auth/w/order/cancel/multi', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Claim existing open position
   *
   * @param {object} params    - parameters
   * @param {number} params.id - position id
   * @param {Function} [cb]    - legacy callback
   * @returns {Promise} p
   */
  claimPosition (params, cb = null) {
    const { id } = params
    return this._makeAuthRequest('/auth/w/position/claim', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit new funding offer
   *
   * @param {object} params             - parameters
   * @param {FundingOffer} params.offer - offer model instance
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   */
  submitFundingOffer (params, cb = null) {
    const { offer } = params
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
   * @param {object} params    - parameters
   * @param {number} params.id - offer id
   * @param {Function} [cb]    - legacy callback
   * @returns {Promise} p
   */
  cancelFundingOffer (params, cb = null) {
    const { id } = params
    return this._makeAuthRequest('/auth/w/funding/offer/cancel', { id }, cb)
      .then(_takeResNotify)
  }

  /**
   * Cancel all existing funding offers
   *
   * @param {object} params          - parameters
   * @param {string} params.currency - currency i.e USD
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   */
  cancelAllFundingOffers (params, cb = null) {
    const { currency } = params
    return this._makeAuthRequest('/auth/w/funding/offer/cancel/all', { currency }, cb)
      .then(_takeResNotify)
  }

  /**
   * Close funding
   *
   * @param {object} params      - parameters
   * @param {number} params.id   - funding id
   * @param {string} params.type - funding type LIMIT | FRRDELTAVAR
   * @param {Function} [cb]      - legacy callback
   * @returns {Promise} p
   */
  closeFunding (params, cb = null) {
    const { id, type } = params
    return this._makeAuthRequest('/auth/w/funding/close', { id, type }, cb)
      .then(_takeResNotify)
  }

  /**
   * Submit automatic funding
   *
   * @param {object} params          - parameters
   * @param {number} params.status   - status
   * @param {string} params.currency - currency i.e fUSD
   * @param {number} params.amount   - amount to borrow/lend
   * @param {number} params.rate     - if == 0 then FRR is used
   * @param {number} params.period   - time the offer remains locked in for
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   */
  submitAutoFunding (params, cb = null) {
    return this._makeAuthRequest('/auth/w/funding/auto', params, cb)
      .then(_takeResNotify)
  }

  /**
   * Execute a balance transfer between wallets
   *
   * @param {object} params            - parameters
   * @param {string} params.amount     - amount to transfer
   * @param {string} params.from       - wallet from
   * @param {string} params.to         - wallet to
   * @param {string} params.currency   - currency from
   * @param {string} params.currencyTo - currency to
   * @param {Function} [cb]            - legacy callback
   * @returns {Promise} p
   */
  transfer (params, cb = null) {
    const opts = _pick(params, ['amount', 'from', 'to', 'currency'])
    opts.currency_to = params.currencyTo
    return this._makeAuthRequest('/auth/w/transfer', opts, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} params         - parameters
   * @param {string} params.wallet  - wallet i.e exchange, margin
   * @param {string} params.method  - protocol method i.e bitcoin, tetherus
   * @param {number} params.opRenew - if 1 then generates a new address
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   */
  getDepositAddress (params, cb = null) {
    const opts = _pick(params, ['wallet', 'method'])
    opts.op_renew = params.opRenew
    return this._makeAuthRequest('/auth/w/deposit/address', opts, cb)
      .then(_takeResNotify)
  }

  /**
   * @param {object} params         - parameters
   * @param {string} params.wallet  - wallet i.e exchange, margin
   * @param {string} params.method  - protocol method i.e bitcoin, tetherus
   * @param {number} params.amount  - amount to withdraw
   * @param {string} params.address - destination address
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   */
  withdraw (params, cb = null) {
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
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-add
   */
  addPulse (params, cb = null) {
    return this._makeAuthRequest('/auth/w/pulse/add', params, cb, PulseMessage)
  }

  /**
   * @param {object} params             - parameters
   * @param {string} params.parent      - the parent id of the Pulse message
   * @param {string} params.content     - content of your Pulse message
   * @param {number} params.isPublic    - make Pulse message public
   * @param {string} params.isPin       - make Pulse message pinned
   * @param {string} params.attachments - Base64 encoded list of strings
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-add
   */
  addPulseComment (params, cb = null) {
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
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-public-pulse-hist
   */
  fetchPulseComments (params, cb = null) {
    const { parent = '' } = params || {}
    if (_isEmpty(parent)) {
      return this._cb(new Error('parent (pulse id value) is required for fetching comments'), null, cb)
    }
    return this.pulseHistory(params, cb)
  }

  /**
   * @param {object} params     - parameters
   * @param {string} params.pid - pulse id
   * @param {Function} [cb]     - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-del
   */
  deletePulse (params, cb = null) {
    return this._makeAuthRequest('/auth/w/pulse/del', params, cb)
  }

  /**
   * @param {object} params          - parameters
   * @param {number} params.isPublic - allows you to receive the public pulse history with the UID_LIKED field
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-pulse-hist
   */
  pulseHistory (params, cb = null) {
    return this._makeAuthRequest('/auth/r/pulse/hist', params, cb, PulseMessage)
  }

  /**
   * @param {object} params          - parameters
   * @param {string} params.currency - currency for which you wish to generate an invoice. Currently only LNX (Bitcoin Lightning Network) is available
   * @param {string} params.wallet   - wallet that will receive the invoice payment. Currently only 'exchange' is available
   * @param {string} params.amount   - amount that you wish to deposit (in BTC; min 0.000001, max 0.02)
   * @param {Function} [cb]          - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#rest-auth-deposit-invoice
   */
  generateInvoice (params, cb = null) {
    return this._makeAuthRequest('/auth/w/deposit/invoice', params, cb, Invoice)
  }

  /**
   *
   * @param {object} params                - parameters
   * @param {string} params.action         - Query action, use one of getPaymentsByUser, getInvoicesByUser,
   *                                         getInvoiceById, getPaymentById
   * @param {object} params.query          - Query params
   * @param {object} [params.query.offset] - Optional offset, supported only by getInvoicesByUser and getPaymentsByUser
   *                                         actions
   * @param {object} [params.query.txid]   - Optional payment hash, required by getInvoiceById and getPaymentById
   *                                         actions
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/lnx-invoice-payments
   */
  lnxInvoicePayments (params, cb = null) {
    const { action, query } = params
    return this._makeAuthRequest('/auth/r/ext/invoice/payments', { action, query }, cb)
  }

  /**
   * @param {object} params                                - invoice parameters
   * @param {string} params.amount                         - invoice amount in currency
   * @param {string} params.currency                       - invoice currency
   * @param {string[]} params.payCurrencies                - currencies in which invoice accepts the payments
   * @param {number} [params.duration]                     - optional, invoice expire time in seconds, minimal duration
   *                                                         is 5 mins and maximal duration is 3 days.
   *                                                         Default value is 15 minutes
   * @param {string} params.orderId                        - reference order identifier in merchant's platform
   * @param {string} [params.webhook]                      - the endpoint that will be called once the payment is
   *                                                         completed or expired
   * @param {string} [params.redirectUrl]                  - merchant redirect URL, this one is used in UI to redirect
   *                                                         customer to merchant's site once the payment is completed
   *                                                         or expired
   * @param {object} params.customerInfo                   - information related to customer against who the invoice
   *                                                         is issued
   * @param {string} params.customerInfo.nationality       - customer's nationality, alpha2 code or full country name
   *                                                         (alpha2 preffered)
   * @param {string} params.customerInfo.residCountry      - customer's residential country, alpha2 code or
   *                                                         full country name (alpha2 preffered)
   * @param {string} [params.customerInfo.residState]      - optional, customer's residential state/province
   * @param {string} params.customerInfo.residCity         - customer's residential city/town
   * @param {string} params.customerInfo.residZipCode      - customer's residential zip code/postal code
   * @param {string} params.customerInfo.residStreet       - customer's residential street address
   * @param {string} [params.customerInfo.residBuildingNo] - optional, customer's residential building number/name
   * @param {string} params.customerInfo.fullName          - customer's full name
   * @param {string} params.customerInfo.email             - customer's email address
   * @param {string} [params.customerInfo.ip]              - customer's ip
   * @param {object} [params.meta]                         - metadata
   * @param {string} [params.meta.env]                     - merchant environment, allowed values: production, test,
   *                                                         staging, development
   * @param {string[]} [params.meta.tags]                  - invoice tags, max number of tags is 5 and max length of
   *                                                         tag is 5 characters
   * @param {Function} [cb]                                - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#submit-invoice
   */
  payInvoiceCreate (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/create', params, cb)
  }

  /**
   * @param {object} params                                - invoice parameters
   * @param {string} params.amount                         - invoice amount in currency
   * @param {string} params.currency                       - invoice currency
   * @param {string[]} params.payCurrencies                - currencies in which invoice accepts the payments
   * @param {number} [params.duration]                     - optional, invoice expire time in seconds, minimal duration
   *                                                         is 5 mins and maximal duration is 3 days.
   *                                                         Default value is 15 minutes
   * @param {string} params.orderId                        - reference order identifier in merchant's platform
   * @param {string} [params.webhook]                      - the endpoint that will be called once the payment is
   *                                                         completed or expired
   * @param {string} [params.redirectUrl]                  - merchant redirect URL, this one is used in UI to redirect
   * @param {object} [params.meta]                         - metadata
   * @param {string} [params.meta.env]                     - merchant environment, allowed values: production, test,
   *                                                         staging, development
   * @param {string[]} [params.meta.tags]                  - invoice tags, max number of tags is 5 and max length of
   *                                                         tag is 5 characters
   * @param {Function} [cb]                                - legacy callback
   * @returns {Promise} p
   */
  payInvoiceCreatePos (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/create/pos', params, cb)
  }

  /**
   * @param {Array} param                                     - The parameter value.
   * @param {number} param[0]                                 - The number value.
   * @param {Object} param[1]                                 - An object containing the following properties:
   * @param {Object} param[1].id                              - The id property.
   * @param {Object} param[1].fields.customerInfo.tosAccepted - TOS Accepted by customer
   * @param {Object} param[1].privateNote                     - Private note
   *
   * @param {Function} [cb]                                   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#submit-invoice
   */
  payPublicInvoiceUpdate (params, cb = null) {
    return this._makePublicPostRequest('/auth/ext/pay/invoice/update', params, cb)
  }

  /**
   * @param {Array} param                                     - The parameter value.
   * @param {number} param[0]                                 - The number value.
   * @param {Object} param[1]                                 - An object containing the following properties:
   * @param {Object} param[1].id                              - The id property.
   * @param {Object} param[1].fields.customerInfo.tosAccepted - TOS Accepted by customer
   * @param {Object} param[1].privateNote                     - Private note
   *
   * @param {Function} [cb]                                   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#submit-invoice
   */
  payInvoiceUpdate (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/update', params, cb)
  }

  /**
   * @param {object} params                                - regenerate parameters
   * @param {string} params.id                             - invoice id
   * @param {string} params.ccy                            - invoice currency to be regenerated
   * @param {string} params.remoteIp                       - remote ip used to lock the regeneration
   * @param {Function} [cb]                                - legacy callback
   * @returns {Promise} p
   */
  payInvoiceRegenerate (params, cb = null) {
    return this._makePublicPostRequest('/ext/pay/invoice/regenerate', params, cb)
  }

  /**
   * @param {object} params                               - Feedback object
   * @param {boolean} params.detailed                     - Invoice id
   * @param {number} params.score                         - Rating, 1-5
   * @param {string} params.comment                       - Feedback comment
   * @param {string} params.remoteIp                      - Remote ip used to lock the regeneration
   * @param {Function} [cb]                               - legacy callback
   * @returns {Promise} p
   */
  payInvoiceFeedback (params, cb = null) {
    return this._makePublicPostRequest('/ext/pay/invoice/feedback', params, cb)
  }

  /**
   * @param {object} params                               - Feedback object
   * @param {boolean} params.detailed                     - invoice id
   * @param {number} params.score                         - Rating, 1-5
   * @param {string} params.category                      - Feedback category
   * @param {string} params.comment                       - Feedback comment
   * @param {string} params.remoteIp                      - Remote ip used to lock the regeneration
   * @param {Function} [cb]                               - legacy callback
   * @returns {Promise} p
   */
  payMerchantFeedback (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/merchant/feedback', params, cb)
  }

  /**
   * @param {object} params                               - list of feedbacks
   * @param {boolean} params.detailed                     - detailed
   * @param {Function} [cb]                               - legacy callback
   * @returns {Promise} p
   */
  payPublicInvoiceCurrencyDetailed (params = {}, cb = null) {
    return this._makePublicRequest('/ext/pay/invoice/currency/detailed', cb)
  }

  /**
   * @param {object} params                               - list of feedbacks
   * @param {boolean} params.detailed                     - detailed
   * @param {Function} [cb]                               - legacy callback
   * @returns {Promise} p
   */
  payInvoiceCurrencyDetailed (params, cb = null) {
    return this._makePublicPostRequest('/auth/r/ext/pay/currency/detailed', params, cb)
  }

  /**
   * @param {object}  parameters      - list of feedbacks
   * @param {boolean} params.detailed - detailed
   * @param {string?} params.id       - invoice id
   * @param {Function} [cb]           - legacy callback
   * @returns {Promise} p
   */
  payCurrencyList (params, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/currency/list', params, cb)
  }

  /**
   * @param {object} [params]       - query parameters
   * @param {string} [params.id]    - unique invoice identifier
   * @param {number} [params.start] - millisecond start time
   * @param {number} [params.end]   - millisecond end time
   * @param {number} [params.limit] - number of records (Max 100), default 10
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#invoice-list
   */
  payInvoiceList (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/invoices', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {number} [params.page]      - Current page, default 1 100
   * @param {number} [params.pageSize]  - Number of records per page, default 10, max 100
   * @param {string} [params.sort]      - Sort order, default asc, accepted values are asc and desc
   * @param {string} [params.sortField] - Sort field, default t, allowed values: t, amount, status
   * @param {string} [params.status]    - invoice status, allowed array item values are:
   *                                      CREATED, PENDING, COMPLETED, EXPIRED
   * @param {string[]} [params.fiat]    - fiat filter, should be array of strings
   * @param {string[]} [params.crypto]  - crypto filter, should be array of strings
   * @param {string} [params.id]        - unique invoice identifier
   * @param {string} [params.orderId]   - erchant order id
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/invoice-list-paginated
   */
  payInvoiceListPaginated (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/invoices/paginated', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {string} [params.status]    - invoice status, allowed array item values are:
   *                                      CREATED, PENDING, COMPLETED, EXPIRED
   * @param {string} [params.format]    - Aggregation format, allowed values: D - today's, W - this week, M - this month, Y - this year, A - all
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/invoice-count-stats
   */
  payInvoiceCountStats (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/invoice/stats/count', params, cb)
  }

  /**
   * Stats related to earnings during different intervals
   * @param {object} [params]           - query parameters
   * @param {string} [params.currency]  - Currency on which earnings will be calculated
   *                                      CREATED, PENDING, COMPLETED, EXPIRED
   * @param {string} [params.format]    - Aggregation format, allowed values: D - today's, W - this week, M - this month, Y - this year, A - all
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/invoice-earning-stats
   */
  payInvoiceStatsEarning (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/invoice/stats/earning', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {string} [params.id]        - invoice id of which events will be returned
   *
   * @returns {Promise} p
   */
  payInvoiceEvents (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/invoice/events', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {string} [params.id]        - invoice id to be paid
   * @param {string} [params.ccy]       - desired currency to pay invoice
   *
   * @returns {Promise} p
   */
  payInvoicePayInstant (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/instant', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {string} [params.type]      - type of image being uploaded, accepts: 'LOGO'
   * @param {string} [params.image]     - base64 string with the image data. e.g. data:image/png;base64,iVBORw****77uJgylyzjb2gbtz79m9d=
   *
   * @returns {Promise} p
   */
  payUploadImage (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/upload/image', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {string} params.id          - invoice id
   * @param {string} params.ccy         - payment currency
   * @param {string} params.remoteIp    - remote ip
   *
   * @returns {Promise} p
   */
  payCreditCardRates (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/credit-card/rates', params, cb)
  }

  /**
   * @param {object} params                 - query parameters
   * @param {string} params.id              - unique invoice identifier
   * @param {string} params.payCcy          - paid invoice currency, should be one of values under payCurrencies field
   *                                          on invoice
   * @param {number} [params.depositId]     - movement/deposit Id linked to invoice as payment
   * @param {number[]} [params.depositIds]  - movement/deposit ids list linked to invoice as payment
   * @param {number} [params.ledgerId]      - ledger entry Id linked to invoice as payment, use either depositId
   *                                          or ledgerId
   * @param {Function} [cb]                 - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/complete-invoice
   */
  payInvoiceComplete (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/complete', params, cb)
  }

  /**
   * @param {object} params                     - query parameters
   * @param {string} params.id                  - unique invoice identifier
   * @param {string} params.ccy                 - currency to be refunded
   * @param {string} params.amount              - amount to be refunded
   * @param {object} params.address             - address of refund
   * @param {object} params.address.address     - address of the wallet
   * @param {object} params.address.payment_id  - tag memo

   * @param {Function} [cb]                 - legacy callback
   * @returns {Promise} p
   */
  payRefundInvoice (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/refund', params, cb)
  }

  /**
   * @param {object} params                     - query parameters
   * @param {string} params.id                  - unique invoice identifier
   * @param {string} params.refundId            - id of the refund

   * @param {Function} [cb]                 - legacy callback
   * @returns {Promise} p
   */
  payInvoiceMarkRefunded (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/mark/refunded', params, cb)
  }

  /**
   * @param {object} params    - query parameters
   * @param {string} params.id - unique invoice identifier
   * @param {Function} [cb]    - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/expire-invoice
   */
  payInvoiceExpire (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/invoice/expire', params, cb)
  }

  /**
   * List bitfinex pay currency conversions
   * @param {Function} [cb]    - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/conversion-list
   */
  payCurrencyConversionList (cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/settings/convert/list', {}, cb)
  }

  /**
   * Add bitfinex pay currency conversions
   * @param {number} params.baseCcy     - Base currency that will be converted, could be bfx pay currency symbol (e.g. UST-ETH) or global api symbol (UST), result is stored as global api symbol!
   * @param {number} params.convertCcy  - Currency to which base currency will be converted, could be bfx pay currency symbol (e.g. UST-ETH) or global api symbol (UST), result is stored as global api symbol!
   * @param {Function} [cb]               - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/add-conversion
   */
  payAddCurrencyConversion (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/settings/convert/create', params, cb)
  }

  /**
   * Remove bitfinex pay currency conversions
   * @param {number} params.baseCcy     - Base currency that will be converted, could be bfx pay currency symbol (e.g. UST-ETH) or global api symbol (UST), result is stored as global api symbol!
   * @param {number} params.convertCcy  - Currency to which base currency will be converted, could be bfx pay currency symbol (e.g. UST-ETH) or global api symbol (UST), result is stored as global api symbol!
   * @param {Function} [cb]               - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/remove-conversion
   */
  payRemoveCurrencyConversion (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/settings/convert/remove', params, cb)
  }

  /**
   * Returns the daily limits for merchant
   * @param {string[]} [params.customerEmails]  - Optional, customer emails for e-commerce usage
   * @param {Function} [cb]                     - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/merchant-limits
   */
  payMerchantDailyLimit (params, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/settings/daily/limit', params, cb)
  }

  /**
   * Sets merchant settings
   * @param {string} params.key   - Setting key. Check doc link for possible values
   * @param {string} params.value - Setting value, if null it means unset
   * @param {Function} [cb]       - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/merchant-settings-write
   */
  payMerchantSettingsWrite (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/settings/set', params, cb)
  }

  /**
   * Sets merchant settings
   * @param {string} params.settings          - Setting keys and values
   * @param {string} params.settings[].key    - Setting key. Check doc link for possible values
   * @param {string} params.settings[].value  - Setting value, if null it means unset
   * @param {Function} [cb]                   - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/merchant-settings-write-batch
   */
  payMerchantSettingsWriteBatch (params, cb = null) {
    return this._makeAuthRequest('/auth/w/ext/pay/settings/set/batch', params, cb)
  }

  /**
   * Reads merchant settings
   * @param {string} params.key - Setting key. Check doc link for possible values
   * @param {Function} [cb]     - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/merchant-settings-read
   */
  payMerchantSettingsRead (params, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/settings/get', params, cb)
  }

  /**
   * Reads multiple merchant settings
   * @param {string[]} params.keys  - Setting keys, if empty array all settings will be returned
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference/merchant-settings-list
   */
  payMerchantSettingsList (params, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/settings/list', params, cb)
  }

  /**
   * @param {object} params         - query parameters
   * @param {string} params.ccy     - pay currency to search deposits for
   * @param {number} [params.start] - millisecond start time, if omitted it will be end - 1 day if end is present
   *                                  otherwise it will be yesterday. Min value is 1614758400000
   * @param {number} [params.end]   - Millisecond end time, if omitted it will be start + 1 day if start is present
   *                                  otherwise it will be current time. Max difference between start and end
   *                                  is 2 days!
   * @param {Function} [cb]         - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#complete-invoice
   */
  payDepositsUnlinked (params, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/deposits/unlinked', params, cb)
  }

  /**
   * @param {object} [params]           - query parameters
   * @param {number} [params.id]        - Deposit/Ledger entry Id to search for, use either id or from and to fields,
   *                                      id has priority over from, to fields
   * @param {number} [params.from]      - Millisecond start time
   * @param {number} [params.to]        - Millisecond end time
   * @param {string} [params.ccy]       - Pay currency to search deposits for
   * @param {boolean} [params.unlinked] - Include only unlinked payments
   * @param {Function} [cb]             - legacy callback
   * @returns {Promise} p
   * @see https://docs.bitfinex.com/reference#complete-invoice
   */
  payDeposits (params = {}, cb = null) {
    return this._makeAuthRequest('/auth/r/ext/pay/deposits', params, cb)
  }
}

RESTv2.url = API_URL

module.exports = RESTv2
