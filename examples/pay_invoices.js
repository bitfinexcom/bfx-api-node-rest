'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:rest:examples:pay')
const { RESTv2 } = require('../')

/**
 * populate apiKey and apiSecret
 */
const rest2 = new RESTv2({
  apiKey: '',
  apiSecret: '',
  transform: true
})

const runInvoiceNew = async () => {
  const params = {
    amount: 2,
    currency: 'USD',
    payCurrencies: ['BTC', 'ETH', 'UST-ETH', 'LNX'],
    orderId: 'order123',
    duration: 86399,
    webhook: 'https://example.com/api/order/myORder12345',
    redirectUrl: 'https://example.com/order/myORder12345',
    customerInfo: {
      nationality: 'DE',
      residCountry: 'GB',
      residCity: 'London',
      residZipCode: 'WC2H 7NA',
      residStreet: '5-6 Leicester Square',
      fullName: 'John Doe',
      email: 'john@example.com'
    }
  }

  const response = await rest2.payInvoiceCreate(params)

  debug('Invoice: %s', JSON.stringify(response, null, 4))
}

const runInvoiceList = async () => {
  const response = await rest2.payInvoiceList({
    limit: 1,
    start: Date.now() - 60 * 24 * 100
  })

  debug('Invoices: %s', JSON.stringify(response, null, 4))
}

const main = async () => {
  try {
    await runInvoiceNew()
    await runInvoiceList()
  } catch (error) {
    debug('error: %s', error.stack)
  }
}

main()
