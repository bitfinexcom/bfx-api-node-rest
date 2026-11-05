'use strict'

const setup = require('@bitfinex/lint-js')
const { defaultIgnores } = require('@bitfinex/lint-js/lib/ignores')

module.exports = setup({
  ignores: [...defaultIgnores, 'docs/']
})
