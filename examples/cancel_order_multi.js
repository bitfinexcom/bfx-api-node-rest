'use strict'

process.env.DEBUG = '*'

const debug = require('debug')('bfx:api:rest:examples:cancelordermulti')
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
 * Cancel orders using internal Order ID
 * you can obtain your order id's by calling rest2.activeOrders()
 */
const cancelOrdersById = async () => {
  const orderIDs = [123, 124]
  const response = await rest2.cancelOrderMulti({
    id: orderIDs
  })

  debug('Cancel orders by ID status: %s', response.status)
  debug('Cancel orders by ID message: %s', response.text)
}

/**
 * Cancel orders using client order id and client order id date
 * you can obtain your client order id's and client order id date by calling rest2.activeOrders()
 */
const cancelOrdersByClientOrderId = async () => {
  const clientOrderID = 7701
  const clientOrderIDDate = '2020-05-28'
  const response = await rest2.cancelOrderMulti({
    cid: [
      [clientOrderID, clientOrderIDDate]
    ]
  })

  debug('Cancel orders by client order ID status: %s', response.status)
  debug('Cancel orders by client order ID message: %s', response.text)
}

/**
 * Cancel orders using group id
 * you can obtain your group id's by calling rest2.activeOrders()
 */
const cancelOrdersByGroupId = async () => {
  const groupIDs = [8800, 8801]
  const response = await rest2.cancelOrderMulti({
    gid: groupIDs
  })

  debug('Cancel orders by group ID status: %s', response.status)
  debug('Cancel orders by group ID message: %s', response.text)
}

/**
 * Multiple Operations Example
 * you can obtain your order, client order, group id's
 * and client order id date by calling rest2.activeOrders()
 */
const runMixMultiple = async () => {
  const orderIDs = [123]
  const groupIDs = [123]
  const clientOrderID = 7701
  const clientOrderIDDate = '2020-05-28'
  const response = await rest2.cancelOrderMulti({
    id: orderIDs,
    gid: groupIDs,
    cid: [
      [clientOrderID, clientOrderIDDate]
    ]
  })

  debug('Mixed operations status: %s', response.status)
  debug('Mixed operations message: %s', response.text)
}

try {
  cancelOrdersById()
  cancelOrdersByGroupId()
  cancelOrdersByClientOrderId()
  runMixMultiple()
} catch (error) {
  debug('error: %s', error.stack)
}
