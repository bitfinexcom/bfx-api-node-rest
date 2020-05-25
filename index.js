'use strict'

/**
 * A Node.JS reference implementation of the Bitfinex REST APIs
 *
 * To use, construct a new instance of either the `RESTv1` or `RESTv2` classes.
 * All API methods return promises and accept a callback as the last parameter; the
 * callback will be called with `(error, response)`.
 *
 * To minimize the data sent over the network the transmitted data is structured in
 * arrays. In order to reconstruct key / value pairs, set `opts.transform` to `true`
 * when creating an interface.
 *
 * ## Features
 *
 * * Official implementation
 * * {@link module:bfx-api-node-rest.RESTv2|REST v2 API}
 * * {@link module:bfx-api-node-rest.RESTv1|REST v1 API}
 *
 * ## Installation
 *
 * ```bash
 *   npm i --save bfx-api-node-rest
 * ```
 *
 * ### Quickstart
 *
 * ```js
 * const { RESTv2 } = require('bfx-api-node-rest')
 * const rest = new RESTv2({ transform: true })
 *
 * // do something with the RESTv2 instance
 * ```
 *
 * @license MIT
 * @module bfx-api-node-rest
 */

module.exports = {
  RESTv1: require('./lib/rest1'),
  RESTv2: require('./lib/rest2')
}
