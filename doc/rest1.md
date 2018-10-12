<a name="RESTv1"></a>

## RESTv1
Communicates with v1 of the Bitfinex HTTP API

**Kind**: global class  

* [RESTv1](#RESTv1)
    * [new RESTv1(opts)](#new_RESTv1_new)
    * [.ticker(symbol, cb)](#RESTv1+ticker)
    * [.today(symbol, cb)](#RESTv1+today)
    * [.stats(symbol, cb)](#RESTv1+stats)
    * [.fundingbook(currency, options, cb)](#RESTv1+fundingbook)
    * [.orderbook(symbol, options, cb)](#RESTv1+orderbook)
    * [.trades(symbol, cb)](#RESTv1+trades)
    * [.lends(symbol, cb)](#RESTv1+lends)
    * [.get_symbols(cb)](#RESTv1+get_symbols)
    * [.symbols_details(cb)](#RESTv1+symbols_details)
    * [.new_order(symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb)](#RESTv1+new_order)
    * [.multiple_new_orders(orders, cb)](#RESTv1+multiple_new_orders)
    * [.cancel_order(order_id, cb)](#RESTv1+cancel_order)
    * [.cancel_all_orders(cb)](#RESTv1+cancel_all_orders)
    * [.cancel_multiple_orders(order_ids, cb)](#RESTv1+cancel_multiple_orders)
    * [.replace_order(order_id, symbol, amount, price, exchange, side, type, cb)](#RESTv1+replace_order)
    * [.order_status(order_id, cb)](#RESTv1+order_status)
    * [.active_orders(cb)](#RESTv1+active_orders)
    * [.orders_history(cb)](#RESTv1+orders_history)
    * [.active_positions(cb)](#RESTv1+active_positions)
    * [.claim_position(position_id, amount, cb)](#RESTv1+claim_position)
    * [.balance_history(currency, options, cb)](#RESTv1+balance_history)
    * [.movements(currency, options, cb)](#RESTv1+movements)
    * [.past_trades(symbol, options, cb)](#RESTv1+past_trades)
    * [.new_deposit(currency, method, wallet_name, cb)](#RESTv1+new_deposit)
    * [.new_offer(currency, amount, rate, period, direction, cb)](#RESTv1+new_offer)
    * [.cancel_offer(offer_id, cb)](#RESTv1+cancel_offer)
    * [.offer_status(offer_id, cb)](#RESTv1+offer_status)
    * [.active_offers(cb)](#RESTv1+active_offers)
    * [.active_credits(cb)](#RESTv1+active_credits)
    * [.wallet_balances(cb)](#RESTv1+wallet_balances)
    * [.taken_swaps(cb)](#RESTv1+taken_swaps)
    * [.total_taken_swaps(cb)](#RESTv1+total_taken_swaps)
    * [.close_swap(swap_id, cb)](#RESTv1+close_swap)
    * [.account_infos(cb)](#RESTv1+account_infos)
    * [.margin_infos(cb)](#RESTv1+margin_infos)
    * [.withdraw(withdrawType, walletSelected, amount, address)](#RESTv1+withdraw)
    * [.transfer(amount, currency, walletFrom, walletTo)](#RESTv1+transfer)

<a name="new_RESTv1_new"></a>

### new RESTv1(opts)
Instantiate a new REST v1 transport.


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.apiKey | <code>string</code> |  |
| opts.apiSecret | <code>string</code> |  |
| opts.url | <code>string</code> | endpoint URL |
| opts.agent | <code>Object</code> | optional node agent for connection (proxy) |
| opts.nonceGenerator | <code>Method</code> | optional, should return a nonce |

<a name="RESTv1+ticker"></a>

### resTv1.ticker(symbol, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-ticker  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;BTCUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv1+today"></a>

### resTv1.today(symbol, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+stats"></a>

### resTv1.stats(symbol, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-stats  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+fundingbook"></a>

### resTv1.fundingbook(currency, options, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-fundingbook  

| Param | Type |
| --- | --- |
| currency | <code>string</code> | 
| options | <code>Object</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+orderbook"></a>

### resTv1.orderbook(symbol, options, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-orderbook  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| options | <code>Object</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+trades"></a>

### resTv1.trades(symbol, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-trades  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+lends"></a>

### resTv1.lends(symbol, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-lends  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+get_symbols"></a>

### resTv1.get_symbols(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-symbols  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+symbols_details"></a>

### resTv1.symbols_details(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-symbol-details  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+new_order"></a>

### resTv1.new_order(symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-new-order  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| amount | <code>number</code> | 
| price | <code>number</code> | 
| exchange | <code>string</code> | 
| side | <code>string</code> | 
| type | <code>string</code> | 
| is_hidden | <code>boolean</code> | 
| postOnly | <code>boolean</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+multiple_new_orders"></a>

### resTv1.multiple_new_orders(orders, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-multiple-new-orders  

| Param | Type |
| --- | --- |
| orders | <code>Array.&lt;Object&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+cancel_order"></a>

### resTv1.cancel_order(order_id, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-cancel-order  

| Param | Type |
| --- | --- |
| order_id | <code>number</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+cancel_all_orders"></a>

### resTv1.cancel_all_orders(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-cancel-all-orders  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+cancel_multiple_orders"></a>

### resTv1.cancel_multiple_orders(order_ids, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-cancel-multiple-orders  

| Param | Type |
| --- | --- |
| order_ids | <code>Array.&lt;number&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+replace_order"></a>

### resTv1.replace_order(order_id, symbol, amount, price, exchange, side, type, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-replace-order  

| Param | Type |
| --- | --- |
| order_id | <code>number</code> | 
| symbol | <code>string</code> | 
| amount | <code>number</code> | 
| price | <code>number</code> | 
| exchange | <code>string</code> | 
| side | <code>string</code> | 
| type | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+order_status"></a>

### resTv1.order_status(order_id, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-order-status  

| Param | Type |
| --- | --- |
| order_id | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+active_orders"></a>

### resTv1.active_orders(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-active-orders  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+orders_history"></a>

### resTv1.orders_history(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-orders-history  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+active_positions"></a>

### resTv1.active_positions(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-active-positions  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+claim_position"></a>

### resTv1.claim_position(position_id, amount, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-claim-position  

| Param | Type |
| --- | --- |
| position_id | <code>string</code> | 
| amount | <code>number</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+balance_history"></a>

### resTv1.balance_history(currency, options, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-balance-history  

| Param | Type |
| --- | --- |
| currency | <code>string</code> | 
| options | <code>Object</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+movements"></a>

### resTv1.movements(currency, options, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-deposit-withdrawal-history  

| Param | Type |
| --- | --- |
| currency | <code>string</code> | 
| options | <code>Object</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+past_trades"></a>

### resTv1.past_trades(symbol, options, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-past-trades  

| Param | Type |
| --- | --- |
| symbol | <code>string</code> | 
| options | <code>Object</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+new_deposit"></a>

### resTv1.new_deposit(currency, method, wallet_name, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-deposit  

| Param | Type |
| --- | --- |
| currency | <code>string</code> | 
| method | <code>string</code> | 
| wallet_name | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+new_offer"></a>

### resTv1.new_offer(currency, amount, rate, period, direction, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-new-offer  

| Param | Type |
| --- | --- |
| currency | <code>string</code> | 
| amount | <code>number</code> | 
| rate | <code>number</code> | 
| period | <code>number</code> | 
| direction | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+cancel_offer"></a>

### resTv1.cancel_offer(offer_id, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-cancel-offer  

| Param | Type |
| --- | --- |
| offer_id | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+offer_status"></a>

### resTv1.offer_status(offer_id, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-offer-status  

| Param | Type |
| --- | --- |
| offer_id | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+active_offers"></a>

### resTv1.active_offers(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-offers  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+active_credits"></a>

### resTv1.active_credits(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-active-credits  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+wallet_balances"></a>

### resTv1.wallet_balances(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+taken_swaps"></a>

### resTv1.taken_swaps(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-active-funding-used-in-a-margin-position  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+total_taken_swaps"></a>

### resTv1.total_taken_swaps(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-total-taken-funds  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+close_swap"></a>

### resTv1.close_swap(swap_id, cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  

| Param | Type |
| --- | --- |
| swap_id | <code>string</code> | 
| cb | <code>Method</code> | 

<a name="RESTv1+account_infos"></a>

### resTv1.account_infos(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-account-info  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+margin_infos"></a>

### resTv1.margin_infos(cb)
**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-margin-information  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv1+withdraw"></a>

### resTv1.withdraw(withdrawType, walletSelected, amount, address)
POST /v1/withdraw

**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  

| Param | Type | Description |
| --- | --- | --- |
| withdrawType | <code>string</code> | "bitcoin", "litecoin", "darkcoin" or "mastercoin" |
| walletSelected | <code>string</code> | origin of the wallet to withdraw from, can be "trading", "exchange", or "deposit" |
| amount | <code>number</code> | amount to withdraw |
| address | <code>string</code> | destination address for withdrawal |

<a name="RESTv1+transfer"></a>

### resTv1.transfer(amount, currency, walletFrom, walletTo)
POST /v1/transfer

**Kind**: instance method of <code>[RESTv1](#RESTv1)</code>  

| Param | Type | Description |
| --- | --- | --- |
| amount | <code>number</code> | amount to transfer |
| currency | <code>string</code> | currency of funds to transfer |
| walletFrom | <code>string</code> | wallet to transfer from |
| walletTo | <code>string</code> | wallet to transfer to |

