'use strict'

const { Order } = require('bfx-api-node-models')
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
  const ops = [
    [
      'on',
      new Order({
        type: 'EXCHANGE LIMIT',
        symbol: 'tBTCUSD',
        price: '13',
        amount: '0.001',
        gid: 7,
        cid: 8
      })
    ],
    [
      'on',
      {
        type: 'EXCHANGE LIMIT',
        symbol: 'tBTCUSD',
        price: '9',
        amount: '0.001',
        gid: 7,
        cid: 8
      }
    ]
  ]
  const response = await rest2.orderMultiOp(ops)

  console.log('Order new submit status: %s', response.status)
  console.log('Order new submit message: %s', response.text)
}

/**
 * Order Cancel Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderCancel = async () => {
  const orderID = 123
  const ops = [
    ['oc', { id: orderID }]
  ]
  const response = await rest2.orderMultiOp(ops)

  console.log('Order cancel status: %s', response.status)
  console.log('Order cancel message: %s', response.text)
}

/**
 * Order Cancel Multi Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderCancelMulti = async () => {
  const orderIDs = [123, 124]
  const ops = [
    ['oc_multi', { id: orderIDs }]
  ]
  const response = await rest2.orderMultiOp(ops)

  console.log('Order cancel multi status: %s', response.status)
  console.log('Order cancel multi message: %s', response.text)
}

/**
 * Order Update Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runOrderUpdate = async () => {
  const orderID = 123
  const ops = [
    ['ou', { id: orderID, price: '15', amount: '0.001' }]
  ]
  const response = await rest2.orderMultiOp(ops)

  console.log('Order update status: %s', response.status)
  console.log('Order update message: %s', response.text)
}

/**
 * Multiple Operations Example
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const runMixMultiple = async () => {
  const orderID = 1189090779
  const orderOneID = 1189092193
  const orderTwoID = 1189092194
  const orderIDs = [1189092195, 1189092196]
  const ops = [
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
    ['ou', { id: orderID, price: '8', amount: '0.001' }]
  ]
  const response = await rest2.orderMultiOp(ops)

  console.log('Mixed operations status: %s', response.status)
  console.log('Mixed operations message: %s', response.text)
}

try {
  runOrderNew()
  runOrderCancel()
  runOrderCancelMulti()
  runOrderUpdate()
  runMixMultiple()
} catch (error) {
  console.log('error: %s', error.stack)
}
