'use strict'
/* eslint-disable */
/* legacy API interface, not cleaned up with new eslint rules */

const request = require('request')
const debug = require('debug')('bfx:rest1')
const { genAuthSig, nonce } = require('bfx-api-node-util')
const API_URL = 'https://api.bitfinex.com'

/**
 * Communicates with v1 of the Bitfinex HTTP API
 *
 * @class
 * @deprecated
 */
class RESTv1 {
  /**
   * Instantiate a new REST v1 transport.
   *
   * @param {object} [opts={}] - options
   * @param {string} [opts.apiKey=''] - API key
   * @param {string} [opts.apiSecret=''] - API secret
   * @param {string} [opts.url='https://api.bitfinex.com'] - endpoint URL
   * @param {object} [opts.agent] - node agent for connection (proxy)
   * @param {Function} [opts.nonceGenerator] - should return a nonce
   */
  constructor (opts = {}) {
    this._url = opts.url || API_URL
    this._apiKey = opts.apiKey || ''
    this._apiSecret = opts.apiSecret || ''
    this._agent = opts.agent
    this._generateNonce = (typeof opts.nonceGenerator === 'function')
      ? opts.nonceGenerator
      : nonce
  }

  /**
   * @param {string} body - raw JSON
   * @param {Function} cb - callback
   * @private
   */
  _parse_req_body (body, cb) {
    let result

    try {
      result = JSON.parse(body)
    } catch (error) {
      return cb(error)
    }

    if (typeof result.message === 'string') {
      if (result.message.indexOf('Nonce is too small') !== -1) {
        result.message += ' See https://github.com/bitfinexcom/bitfinex-api-node/blob/master/README.md#nonce-too-small for help'
      }

      return cb(new Error(result.message))
    }

    return cb(null, result)
  }

  /**
   * @param {string} path - path
   * @param {object} params - params
   * @param {Function} cb - callback
   * @private
   */
  make_request (path, params, cb) {
    if (!this._apiKey || !this._apiSecret) {
      return cb(new Error('missing api key or secret'))
    }

    const payload = Object.assign({
      request: `/v1/${path}`,
      nonce: JSON.stringify(this._generateNonce())
    }, params)

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64')
    const { sig } = genAuthSig(this._apiSecret, payloadBase64)
    const url = `${this._url}/v1/${path}`

    debug('POST %s', url)

    return request({
      url,
      method: 'POST',
      timeout: 15000,
      agent: this._agent,
      headers: {
        'X-BFX-APIKEY': this._apiKey,
        'X-BFX-PAYLOAD': payloadBase64,
        'X-BFX-SIGNATURE': sig
      }
    }, (err, res, body) => {
      if (err) return cb(err)
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        return cb(
          new Error(`HTTP code ${res.statusCode} ${res.statusMessage || ''}`)
        )
      }

      this._parse_req_body(body, cb)
    })
  }

  /**
   * @param {string} path - path
   * @param {Function} cb - callback
   * @private
   */
  make_public_request (path, cb) {
    const url = `${this._url}/v1/${path}`

    debug('GET %s', url)

    return request({
      method: 'GET',
      agent: this._agent,
      timeout: 15000,
      url
    }, (err, res, body) => {
      if (err) return cb(err)
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        return cb(
          new Error(`HTTP code ${res.statusCode} ${res.statusMessage || ''}`)
        )
      }

      this._parse_req_body(body, cb)
    })
  }

  /**
   * @param {string} [symbol='BTCUSD'] - symbol
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-ticker
   */
  ticker (symbol = 'BTCUSD', cb) {
    if (!cb) {
      cb = (err, data) => {
        if (err) {
          console.error(err)
        }

        console.log(data)
      }
    }

    return this.make_public_request(`pubticker/${symbol}`, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} cb - callback
   */
  today (symbol, cb) {
    return this.make_public_request(`today/${symbol}`, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-stats
   */
  stats (symbol, cb) {
    return this.make_public_request(`stats/${symbol}`, cb)
  }

  /**
   * @param {string} currency - currency
   * @param {object} options - options
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-fundingbook
   */
  fundingbook (currency, options, cb) {
    let uri = `lendbook/${currency}`

    if (typeof options === 'function') {
      cb = options
    } else {
      const keys = Object.keys(options)

      for (let i = 0; i < keys.length; i++) {
        uri += `${i === 0 ? '/?' : '&'}${keys[i]}=${options[keys[i]]}`
      }
    }

    return this.make_public_request(uri, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {object} options - options
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-orderbook
   */
  orderbook (symbol, options, cb) {
    let uri = `book/${symbol}`

    if (typeof options === 'function') {
      cb = options
    } else {
      const keys = Object.keys(options)

      for (let i = 0; i < keys.length; i++) {
        uri += `${i === 0 ? '/?' : '&'}${keys[i]}=${options[keys[i]]}`
      }
    }

    return this.make_public_request(uri, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-trades
   */
  trades (symbol, cb) {
    return this.make_public_request('trades/' + symbol, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-lends
   */
  lends (currency, cb) {
    return this.make_public_request('lends/' + currency, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbols
   */
  get_symbols (cb) {
    return this.make_public_request('symbols', cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-public-symbol-details
   */
  symbols_details (cb) {
    return this.make_public_request('symbols_details', cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {number} amount - amount
   * @param {number} price - price
   * @param {string} exchange - exchange
   * @param {string} side - side
   * @param {string} type - type
   * @param {boolean} is_hidden - hidden flag
   * @param {boolean} postOnly - postonly flag
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-new-order
   */
  new_order (symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb) {
    if (typeof is_hidden === 'function') {
      cb = is_hidden
      is_hidden = false
    }

    if (typeof postOnly === 'function') {
      cb = postOnly
      postOnly = false
    }

    const params = {
      symbol,
      amount,
      price,
      exchange,
      side,
      type
    }

    if (postOnly) params.post_only = true
    if (is_hidden) params.is_hidden = true

    return this.make_request('order/new', params, cb)
  }

  /**
   * @param {object[]} orders - orders
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-multiple-new-orders
   */
  multiple_new_orders (orders, cb) {
    return this.make_request('order/new/multi', { orders }, cb)
  }

  /**
   * @param {number} order_id - order ID
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-cancel-order
   */
  cancel_order (order_id, cb) {
    return this.make_request('order/cancel', {
      order_id: parseInt(order_id)
    }, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-cancel-all-orders
   */
  cancel_all_orders (cb) {
    return this.make_request('order/cancel/all', {}, cb)
  }

  /**
   * @param {number[]} order_ids - order IDs
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-cancel-multiple-orders
   */
  cancel_multiple_orders (order_ids, cb) {
    return this.make_request('order/cancel/multi', {
      order_ids: order_ids.map(id => parseInt(id))
    }, cb)
  }

  /**
   * @param {number} order_id - order ID
   * @param {string} symbol - symbol
   * @param {number} amount - amount
   * @param {number} price - price
   * @param {string} exchange - exchange
   * @param {string} side - side
   * @param {string} type - type
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-replace-order
   */
  replace_order (order_id, symbol, amount, price, exchange, side, type, cb) {
    return this.make_request('order/cancel/replace', {
      order_id: parseInt(order_id),
      symbol,
      amount,
      price,
      exchange,
      side,
      type
    }, cb)
  }

  /**
   * @param {string} order_id - order ID
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-order-status
   */
  order_status (order_id, cb) {
    return this.make_request('order/status', {
      order_id: parseInt(order_id)
    }, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-active-orders
   */
  active_orders (cb) {
    return this.make_request('orders', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-orders-history
   */
  orders_history (cb) {
    return this.make_request('orders/hist', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-active-positions
   */
  active_positions (cb) {
    return this.make_request('positions', {}, cb)
  }

  /**
   * @param {string} position_id - position ID
   * @param {number} amount - amount
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-claim-position
   */
  claim_position (position_id, amount, cb) {
    return this.make_request('position/claim', {
      position_id: parseInt(position_id),
      amount
    }, cb)
  }

  /**
   * @param {string} currency - currency
   * @param {object} options - options
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-balance-history
   */
  balance_history (currency, options, cb) {
    const params = { currency }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('history', params, cb)
  }

  /**
   * @param {string} currency - currency
   * @param {object} options - options
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-deposit-withdrawal-history
   */
  movements (currency, options, cb) {
    const params = { currency }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('history/movements', params, cb)
  }

  /**
   * @param {string} symbol - symbol
   * @param {object} options - options
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-past-trades
   */
  past_trades (symbol, options, cb) {
    const params = { symbol }

    if (typeof options === 'function') {
      cb = options
    } else if (options && options.constructor.name === 'Object') {
      Object.assign(params, options)
    }

    return this.make_request('mytrades', params, cb)
  }

  /**
   * @param {string} currency - currency
   * @param {string} method - method
   * @param {string} wallet_name - wallet name
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-deposit
   */
  new_deposit (currency, method, wallet_name, cb) {
    return this.make_request('deposit/new', {
      currency,
      method,
      wallet_name
    }, cb)
  }

  /**
   * @param {string} currency - currency
   * @param {number} amount - amount
   * @param {number} rate - rate
   * @param {number} period - period
   * @param {string} direction - direction
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-new-offer
   */
  new_offer (currency, amount, rate, period, direction, cb) {
    return this.make_request('offer/new', {
      currency,
      amount,
      rate,
      period,
      direction
    }, cb)
  }

  /**
   * @param {string} offer_id - offer ID
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-cancel-offer
   */
  cancel_offer (offer_id, cb) {
    return this.make_request('offer/cancel', {
      offer_id: parseInt(offer_id)
    }, cb)
  }

  /**
   * @param {string} offer_id - offer ID
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-offer-status
   */
  offer_status (offer_id, cb) {
    return this.make_request('offer/status', {
      offer_id: parseInt(offer_id)
    }, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-offers
   */
  active_offers (cb) {
    return this.make_request('offers', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-active-credits
   */
  active_credits (cb) {
    return this.make_request('credits', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances
   */
  wallet_balances (cb) {
    return this.make_request('balances', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-active-funding-used-in-a-margin-position
   */
  taken_swaps (cb) {
    return this.make_request('taken_funds', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-total-taken-funds
   */
  total_taken_swaps (cb) {
    return this.make_request('total_taken_funds', {}, cb)
  }

  /**
   * @param {string} swap_id - swap ID
   * @param {Function} cb - callback
   */
  close_swap (swap_id, cb) {
    return this.make_request('swap/close', {
      swap_id: parseInt(swap_id)
    }, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-account-info
   */
  account_infos (cb) {
    return this.make_request('account_infos', {}, cb)
  }

  /**
   * @param {Function} cb - callback
   * @see https://docs.bitfinex.com/v1/reference#rest-auth-margin-information
   */
  margin_infos (cb) {
    return this.make_request('margin_infos', {}, cb)
  }

  /**
   * @param {string} withdrawType - "bitcoin", "litecoin", "darkcoin" or
   *   "mastercoin"
   * @param {string} walletSelected - origin of the wallet to withdraw from,
   *   can be "trading", "exchange", or "deposit"
   * @param {number} amount - amount to withdraw
   * @param {string} address - destination address for withdrawal
   */
  withdraw (withdrawType, walletSelected, amount, address, cb) {
    return this.make_request('withdraw', {
      withdrawType,
      walletSelected,
      amount,
      address
    }, cb)
  }

  /**
   * @param {number} amount - amount to transfer
   * @param {string} currency - currency of funds to transfer
   * @param {string} walletFrom - wallet to transfer from
   * @param {string} walletTo - wallet to transfer to
   */
  transfer (amount, currency, walletFrom, walletTo, cb) {
    return this.make_request('transfer', {
      amount,
      currency,
      walletFrom,
      walletTo
    }, cb)
  }
}

module.exports = RESTv1
