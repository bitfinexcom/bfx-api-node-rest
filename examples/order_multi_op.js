'use strict'

process.env.DEBUG = '*'

const { Order } = require('bfx-api-node-models')
const debug = require('debug')('bfx:api:rest:examples:candles')
const { RESTv2 } = require('../')

/**
 * populate apiKey and apiSecret
 */
const rest2 = new RESTv2({
  apiKey: '',
  apiSecret: '',
  transform: true
})

/**
 * Order New Example
 * orders can be plain object literals: { foo: 'bar', ... }
 * or instances of Order class: new Order({ foo: 'bar', ... })
 */
const runOrderNew = async () => {
  const response = await rest2.orderMultiOp({
    ops: [
      [
        'on',
        new Order({
          type: 'EXCHANGE LIMIT',
          symbol: 'tBTCUSD',
          price: '13',
          amount: '0.001'
        })
      ],
      [
        'on',
        {
          type: 'EXCHANGE LIMIT',
          symbol: 'tBTCUSD',
          price: '9',
          amount: '0.001'
        }
      ]
    ]
  })

  debug('Order new submit status: %s', response.status)
  debug('Order new submit message: %s', response.text)
}

/**
 * Order Cancel Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderCancel = async () => {
  const orderID = 123
  const response = await rest2.orderMultiOp({
    ops: [
      ['oc', { id: orderID }]
    ]
  })

  debug('Order cancel status: %s', response.status)
  debug('Order cancel message: %s', response.text)
}

/**
 * Order Cancel Multi Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderCancelMulti = async () => {
  const orderIDs = [123, 124]
  const response = await rest2.orderMultiOp({
    ops: [
      ['oc_multi', { id: orderIDs }]
    ]
  })

  debug('Order cancel multi status: %s', response.status)
  debug('Order cancel multi message: %s', response.text)
}

/**
 * Order Update Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderUpdate = async () => {
  const orderID = 123
  const response = await rest2.orderMultiOp({
    ops: [
      ['ou', { id: orderID, price: '15', amount: '0.001' }]
    ]
  })

  debug('Order update status: %s', response.status)
  debug('Order update message: %s', response.text)
}

/**
 * Multiple Operations Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runMixMultiple = async () => {
  const orderID = 122
  const orderOneID = 123
  const orderTwoID = 124
  const orderIDs = [125, 126]
  const response = await rest2.orderMultiOp({
    ops: [
      [
        'on',
        new Order({
          type: 'EXCHANGE LIMIT',
          symbol: 'tBTCUSD',
          price: '13',
          amount: '0.001'
        })
      ],
      ['oc', { id: orderOneID }],
      ['oc', { id: orderTwoID }],
      ['oc_multi', { id: orderIDs }],
      ['ou', { id: orderID, price: '15', amount: '0.001' }]
    ]
  })

  debug('Mixed operations status: %s', response.status)
  debug('Mixed operations message: %s', response.text)
}

try {
  runOrderNew()
  runOrderCancel()
  runOrderCancelMulti()
  runOrderUpdate()
  runMixMultiple()
} catch (error) {
  debug('error: %s', error.stack)
}
