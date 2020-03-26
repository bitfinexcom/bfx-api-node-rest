# Bitfinex RESTv1 & RESTv2 APIs for Node.JS

[![Build Status](https://travis-ci.org/bitfinexcom/bfx-api-node-rest.svg?branch=master)](https://travis-ci.org/bitfinexcom/bfx-api-node-rest)
A Node.JS reference implementation of the Bitfinex REST APIs

To use, construct a new instance of either the `RESTv1` or `RESTv2` classes.
All API methods return promises and accept a callback as the last parameter; the
callback will be called with `(error, response)`.

To minimize the data sent over the network the transmitted data is structured in
arrays. In order to reconstruct key / value pairs, set `opts.transform` to `true`
when creating an interface.

## Features

* Official implementation
* REST v2 API
* REST v1 API

## Installation

```bash
  npm i --save bfx-api-node-rest
```

### Quickstart

```js
const { RESTv2 } = require('bfx-api-node-rest')
const rest = new RESTv2({ transform: true })

// do something with the RESTv2 instance
```

### Docs

Documentation at [https://docs.bitfinex.com/v2/reference](https://docs.bitfinex.com/v2/reference)

[See `docs/`](/docs) for JSDoc generated documentation of available methods.

## Example

```js
const { RESTv2 } = require('bfx-api-node-rest')

const rest = new RESTv2({
  apiKey: '...',
  apiSecret: '...',
  authToken: '...', // optional, has priority over API key/secret
  url: '...',       // optional
  transform: true,  // to have full models returned by all methods
  agent: null,      // optional proxy agent
})

rest.candles({
  timeframe: '1m',
  symbol: 'tBTCUSD',
  query: {
    start: Date.now() - (24 * 60 * 60 * 1000),
    end: Date.now(),
    limit: 1000,
  }
}).then((candles) => {
  // ...
}).catch((err) => {
  console.log(err)
})
```

### NOTE: v1 REST and WS clients

Both v1 client classes & server APIs have been deprecated, and will be removed.
In the meantime, some methods available via `RESTv1` have been exposed on
`RESTv2` to prevent future migration issues. Although the underlying
implementation of these methods is likely to change once they are fully ported
to v2, the signatures should remain the same.

## FAQ

### nonce too small

I make multiple parallel request and I receive an error that the nonce is too
small. What does it mean?

Nonces are used to guard against replay attacks. When multiple HTTP requests
arrive at the API with the wrong nonce, e.g. because of an async timing issue,
the API will reject the request.

If you need to go parallel, you have to use multiple API keys right now.

### Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request
