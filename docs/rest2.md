<a name="RESTv2"></a>

## RESTv2
Communicates with v2 of the Bitfinex HTTP API

**Kind**: global class  

* [RESTv2](#RESTv2)
    * [new RESTv2(opts)](#new_RESTv2_new)
    * [._takeResNotifyInfo()](#RESTv2+_takeResNotifyInfo)
    * [.orderBook(symbol, prec, cb)](#RESTv2+orderBook)
    * [.status(cb)](#RESTv2+status) ⇒ <code>Promise</code>
    * [.statusMessages(type, keys, cb)](#RESTv2+statusMessages) ⇒ <code>Promise</code>
    * [.ticker(symbol, cb)](#RESTv2+ticker) ⇒ <code>Promise</code>
    * [.tickers(symbols, cb)](#RESTv2+tickers) ⇒ <code>Promise</code>
    * [.tickersHistory(symbols, start, end, limit, cb)](#RESTv2+tickersHistory) ⇒ <code>Promise</code>
    * [.stats(key, context, cb)](#RESTv2+stats) ⇒ <code>Promise</code>
    * [.candles(opts, cb)](#RESTv2+candles) ⇒ <code>Promise</code>
    * [.conf(keys, cb)](#RESTv2+conf)
    * [.currencies(cb)](#RESTv2+currencies) ⇒ <code>Promise</code>
    * [.alertList(type, cb)](#RESTv2+alertList) ⇒ <code>Promise</code>
    * [.alertSet(type, symbol, price)](#RESTv2+alertSet) ⇒ <code>Promise</code>
    * [.alertDelete(symbol, price)](#RESTv2+alertDelete) ⇒ <code>Promise</code>
    * [.trades(symbol, start, end, limit, sort, cb)](#RESTv2+trades) ⇒ <code>Promise</code>
    * [.liquidations(symbol, start, end, limit, sort, cb)](#RESTv2+liquidations) ⇒ <code>Promise</code>
    * [.accountTrades(symbol, start, end, limit, sort, cb)](#RESTv2+accountTrades) ⇒ <code>Promise</code>
    * [.wallets(cb)](#RESTv2+wallets) ⇒ <code>Promise</code>
    * [.walletsHistory(end, currency, cb)](#RESTv2+walletsHistory) ⇒ <code>Promise</code>
    * [.userInfo(cb)](#RESTv2+userInfo) ⇒ <code>Promise</code>
    * [.activeOrders(cb)](#RESTv2+activeOrders) ⇒ <code>Promise</code>
    * [.movements(ccy, start, end, limit, cb)](#RESTv2+movements) ⇒ <code>Promise</code>
    * [.ledgers(ccy, start, end, limit, cb)](#RESTv2+ledgers) ⇒ <code>Promise</code>
    * [.orderHistory(symbol, start, end, limit, cb)](#RESTv2+orderHistory) ⇒ <code>Promise</code>
    * [.orderTrades(symbol, start, end, limit, orderID, cb)](#RESTv2+orderTrades) ⇒ <code>Promise</code>
    * [.positions(cb)](#RESTv2+positions) ⇒ <code>Promise</code>
    * [.positionsHistory(start, end, limit, cb)](#RESTv2+positionsHistory) ⇒ <code>Promise</code>
    * [.positionsAudit(id, start, end, limit, cb)](#RESTv2+positionsAudit) ⇒ <code>Promise</code>
    * [.fundingOffers(symbol, cb)](#RESTv2+fundingOffers) ⇒ <code>Promise</code>
    * [.fundingOfferHistory(symbol, start, end, limit, cb)](#RESTv2+fundingOfferHistory) ⇒ <code>Promise</code>
    * [.fundingLoans(symbol, cb)](#RESTv2+fundingLoans) ⇒ <code>Promise</code>
    * [.fundingLoanHistory(symbol, start, end, limit, cb)](#RESTv2+fundingLoanHistory) ⇒ <code>Promise</code>
    * [.fundingCredits(symbol, cb)](#RESTv2+fundingCredits) ⇒ <code>Promise</code>
    * [.fundingCreditHistory(symbol, start, end, limit, cb)](#RESTv2+fundingCreditHistory) ⇒ <code>Promise</code>
    * [.fundingTrades(symbol, start, end, limit, cb)](#RESTv2+fundingTrades) ⇒ <code>Promise</code>
    * [.marginInfo(key, cb)](#RESTv2+marginInfo) ⇒ <code>Promise</code>
    * [.fundingInfo(key, cb)](#RESTv2+fundingInfo) ⇒ <code>Promise</code>
    * [.performance(cb)](#RESTv2+performance) ⇒ <code>Promise</code>
    * [.calcAvailableBalance(symbol, dir, rate, type, cb)](#RESTv2+calcAvailableBalance) ⇒ <code>Promise</code>
    * [.symbols(cb)](#RESTv2+symbols) ⇒ <code>Promise</code>
    * [.futures(cb)](#RESTv2+futures) ⇒ <code>Promise</code>
    * [.derivsPositionCollateralSet(symbol, collateral, cb)](#RESTv2+derivsPositionCollateralSet) ⇒ <code>Promise</code>
    * ~~[.symbolDetails(cb)](#RESTv2+symbolDetails) ⇒ <code>Promise</code>~~
    * ~~[.accountInfo(cb)](#RESTv2+accountInfo) ⇒ <code>Promise</code>~~
    * ~~[.accountFees(cb)](#RESTv2+accountFees) ⇒ <code>Promise</code>~~
    * ~~[.accountSummary(cb)](#RESTv2+accountSummary) ⇒ <code>Promise</code>~~
    * ~~[.keyPermissions(cb)](#RESTv2+keyPermissions) ⇒ <code>Promise</code>~~
    * ~~[.balances(cb)](#RESTv2+balances) ⇒ <code>Promise</code>~~
    * ~~[.closePosition(params, cb)](#RESTv2+closePosition) ⇒ <code>Promise</code>~~
    * [.updateSettings(settings, cb)](#RESTv2+updateSettings) ⇒ <code>Promise</code>
    * [.deleteSettings(keys, cb)](#RESTv2+deleteSettings) ⇒ <code>Promise</code>
    * [.getSettings(keys, cb)](#RESTv2+getSettings) ⇒ <code>Promise</code>
    * [.exchangeRate(ccy1, ccy2)](#RESTv2+exchangeRate) ⇒ <code>Promise</code>
    * [.generateToken(opts, cb)](#RESTv2+generateToken) ⇒ <code>Promise</code>
    * [.submitOrder(order, cb)](#RESTv2+submitOrder)
    * [.updateOrder(order, cb)](#RESTv2+updateOrder)
    * [.cancelOrder(id, cb)](#RESTv2+cancelOrder)
    * [.claimPosition(id, cb)](#RESTv2+claimPosition)
    * [.submitFundingOffer(offer, cb)](#RESTv2+submitFundingOffer)
    * [.cancelFundingOffer(id, cb)](#RESTv2+cancelFundingOffer)
    * [.closeFunding(params, cb)](#RESTv2+closeFunding)
    * [.submitAutoFunding(params, cb)](#RESTv2+submitAutoFunding)
    * [.transfer(cb)](#RESTv2+transfer) ⇒ <code>Promise</code>
    * [.getDepositAddress(params, wallet, method, opRenew, cb)](#RESTv2+getDepositAddress)
    * [.withdraw(params, wallet, method, amount, address, cb)](#RESTv2+withdraw)

<a name="new_RESTv2_new"></a>

### new RESTv2(opts)
Instantiate a new REST v2 transport.


| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.affCode | <code>string</code> | affiliate code to be applied to all orders |
| opts.apiKey | <code>string</code> |  |
| opts.apiSecret | <code>string</code> |  |
| opts.authToken | <code>string</code> | optional auth option |
| opts.url | <code>string</code> | endpoint URL |
| opts.transform | <code>boolean</code> | default false |
| opts.agent | <code>Object</code> | optional node agent for connection (proxy) |

<a name="RESTv2+_takeResNotifyInfo"></a>

### resTv2.\_takeResNotifyInfo()
Parses response into notification object and then
extracts the info element

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type |
| --- | --- |
| Notification.notify_info | <code>Object</code> | 

<a name="RESTv2+orderBook"></a>

### resTv2.orderBook(symbol, prec, cb)
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-books  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | i.e. tBTCUSD |
| prec | <code>string</code> | <code>&quot;P0&quot;</code> | i.e. P0 |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+status"></a>

### resTv2.status(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-platform-status  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+statusMessages"></a>

### resTv2.statusMessages(type, keys, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#status  

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> | <code>&quot;deriv&quot;</code> | 
| keys | <code>Array.&lt;string&gt;</code> |  | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+ticker"></a>

### resTv2.ticker(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-ticker  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+tickers"></a>

### resTv2.tickers(symbols, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-tickers  

| Param | Type |
| --- | --- |
| symbols | <code>Array.&lt;string&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+tickersHistory"></a>

### resTv2.tickersHistory(symbols, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-tickers-history  

| Param | Type | Default |
| --- | --- | --- |
| symbols | <code>Array.&lt;string&gt;</code> |  | 
| start | <code>number</code> |  | 
| end | <code>number</code> |  | 
| limit | <code>number</code> | <code>250</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+stats"></a>

### resTv2.stats(key, context, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-stats  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;pos.size:1m:tBTCUSD:long&quot;</code> | 
| context | <code>string</code> | <code>&quot;hist&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+candles"></a>

### resTv2.candles(opts, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: http://docs.bitfinex.com/v2/reference#rest-public-candles  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.timeframe | <code>string</code> | 1m, 5m, 15m, 30m, 1h, 3h, 6h, 12h, 1D, 7D, 14D, 1M |
| opts.symbol | <code>string</code> |  |
| opts.section | <code>string</code> | hist, last |
| cb | <code>Method</code> |  |

<a name="RESTv2+conf"></a>

### resTv2.conf(keys, cb)
Query configuration information

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type |
| --- | --- |
| keys | <code>Array.&lt;string&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+currencies"></a>

### resTv2.currencies(cb) ⇒ <code>Promise</code>
Get a list of valid currencies ids, full names, pool and explorer

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-currencies  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>Method</code> | legacy callback |

<a name="RESTv2+alertList"></a>

### resTv2.alertList(type, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-list  

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> | <code>&quot;price&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+alertSet"></a>

### resTv2.alertSet(type, symbol, price) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-set  

| Param | Type | Default |
| --- | --- | --- |
| type | <code>string</code> | <code>&quot;price&quot;</code> | 
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| price | <code>number</code> | <code>0</code> | 

<a name="RESTv2+alertDelete"></a>

### resTv2.alertDelete(symbol, price) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-alert-delete  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| price | <code>number</code> | <code>0</code> | 

<a name="RESTv2+trades"></a>

### resTv2.trades(symbol, start, end, limit, sort, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-trades  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> |  |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| sort | <code>number</code> | <code></code> | if 1, sorts results oldest first |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+liquidations"></a>

### resTv2.liquidations(symbol, start, end, limit, sort, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-liquidations  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> |  |
| start | <code>number</code> |  |
| end | <code>number</code> |  |
| limit | <code>number</code> |  |
| sort | <code>number</code> | if 1, sorts results oldest first |
| cb | <code>Method</code> |  |

<a name="RESTv2+accountTrades"></a>

### resTv2.accountTrades(symbol, start, end, limit, sort, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-trades-hist  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | optional, omit/leave empty for all |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| sort | <code>number</code> | <code></code> | if 1, sorts results oldest first |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+wallets"></a>

### resTv2.wallets(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-wallets  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+walletsHistory"></a>

### resTv2.walletsHistory(end, currency, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-wallets-hist  

| Param | Type | Default |
| --- | --- | --- |
| end | <code>number</code> |  | 
| currency | <code>string</code> | <code>null</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+userInfo"></a>

### resTv2.userInfo(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-wallets  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+activeOrders"></a>

### resTv2.activeOrders(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-orders  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+movements"></a>

### resTv2.movements(ccy, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#movements  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ccy | <code>string</code> |  | i.e. ETH |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> |  |  |
| limit | <code>number</code> | <code>25</code> | default 25 |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+ledgers"></a>

### resTv2.ledgers(ccy, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#ledgers  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ccy | <code>string</code> |  | i.e. ETH |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> |  |  |
| limit | <code>number</code> | <code>25</code> | default 25 |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+orderHistory"></a>

### resTv2.orderHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#orders-history  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | optional, omit/leave empty for all |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+orderTrades"></a>

### resTv2.orderTrades(symbol, start, end, limit, orderID, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-order-trades  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| start | <code>number</code> | <code></code> | 
| end | <code>number</code> | <code></code> | 
| limit | <code>number</code> | <code></code> | 
| orderID | <code>number</code> |  | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+positions"></a>

### resTv2.positions(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-positions  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+positionsHistory"></a>

### resTv2.positionsHistory(start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-positions-history  

| Param | Type | Default |
| --- | --- | --- |
| start | <code>Number</code> | <code>0</code> | 
| end | <code>Number</code> |  | 
| limit | <code>Number</code> | <code>50</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+positionsAudit"></a>

### resTv2.positionsAudit(id, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-positions-audit  

| Param | Type | Default |
| --- | --- | --- |
| id | <code>Array.&lt;Array&gt;</code> |  | 
| start | <code>Number</code> | <code>0</code> | 
| end | <code>Number</code> |  | 
| limit | <code>Number</code> | <code>250</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingOffers"></a>

### resTv2.fundingOffers(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingOfferHistory"></a>

### resTv2.fundingOfferHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-offers-hist  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | optional, omit/leave empty for all |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+fundingLoans"></a>

### resTv2.fundingLoans(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingLoanHistory"></a>

### resTv2.fundingLoanHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-loans-hist  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | optional, omit/leave empty for all |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+fundingCredits"></a>

### resTv2.fundingCredits(symbol, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingCreditHistory"></a>

### resTv2.fundingCreditHistory(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-credits-hist  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> |  | optional, omit/leave empty for all |
| start | <code>number</code> | <code></code> |  |
| end | <code>number</code> | <code></code> |  |
| limit | <code>number</code> | <code></code> |  |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+fundingTrades"></a>

### resTv2.fundingTrades(symbol, start, end, limit, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-funding-trades-hist  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;fBTC&quot;</code> | optional, omit/leave empty for all |
| start | <code>number</code> | <code>0</code> |  |
| end | <code>number</code> |  |  |
| limit | <code>number</code> | <code></code> |  |
| cb | <code>Method</code> |  |  |

<a name="RESTv2+marginInfo"></a>

### resTv2.marginInfo(key, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-info-margin  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;base&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+fundingInfo"></a>

### resTv2.fundingInfo(key, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-info-funding  

| Param | Type | Default |
| --- | --- | --- |
| key | <code>string</code> | <code>&quot;fUSD&quot;</code> | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+performance"></a>

### resTv2.performance(cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-performance  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+calcAvailableBalance"></a>

### resTv2.calcAvailableBalance(symbol, dir, rate, type, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-calc-bal-avail  

| Param | Type | Default |
| --- | --- | --- |
| symbol | <code>string</code> | <code>&quot;tBTCUSD&quot;</code> | 
| dir | <code>string</code> |  | 
| rate | <code>number</code> |  | 
| type | <code>string</code> |  | 
| cb | <code>Method</code> |  | 

<a name="RESTv2+symbols"></a>

### resTv2.symbols(cb) ⇒ <code>Promise</code>
Get a list of valid symbol names

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-symbols  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>Method</code> | legacy callback |

<a name="RESTv2+futures"></a>

### resTv2.futures(cb) ⇒ <code>Promise</code>
Get a list of valid symbol names

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-public-futures  

| Param | Type | Description |
| --- | --- | --- |
| cb | <code>Method</code> | legacy callback |

<a name="RESTv2+derivsPositionCollateralSet"></a>

### resTv2.derivsPositionCollateralSet(symbol, collateral, cb) ⇒ <code>Promise</code>
Changes the collateral value of an active derivatives position for a certain pair.

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v2/reference#rest-auth-deriv-pos-collateral-set  

| Param | Type | Description |
| --- | --- | --- |
| symbol | <code>string</code> |  |
| collateral | <code>number</code> |  |
| cb | <code>Method</code> | legacy callback |

<a name="RESTv2+symbolDetails"></a>

### ~~resTv2.symbolDetails(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Get a list of valid symbol names and details

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-public-symbol-details  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountInfo"></a>

### ~~resTv2.accountInfo(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request information about your account

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-account-info  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountFees"></a>

### ~~resTv2.accountFees(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request account withdrawl fees

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-fees  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+accountSummary"></a>

### ~~resTv2.accountSummary(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Returns a 30-day summary of your trading volume and return on margin
funding.

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-summary  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+keyPermissions"></a>

### ~~resTv2.keyPermissions(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Fetch the permissions of the key being used to generate this request

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#auth-key-permissions  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+balances"></a>

### ~~resTv2.balances(cb) ⇒ <code>Promise</code>~~
***Deprecated***

Request your wallet balances

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-wallet-balances  

| Param | Type |
| --- | --- |
| cb | <code>Method</code> | 

<a name="RESTv2+closePosition"></a>

### ~~resTv2.closePosition(params, cb) ⇒ <code>Promise</code>~~
***Deprecated***

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  
**See**: https://docs.bitfinex.com/v1/reference#rest-auth-close-position  

| Param | Type |
| --- | --- |
| params | <code>Object</code> | 
| params.position_id | <code>number</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+updateSettings"></a>

### resTv2.updateSettings(settings, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| settings | <code>Object</code> | key:value map |
| cb | <code>Method</code> |  |

<a name="RESTv2+deleteSettings"></a>

### resTv2.deleteSettings(keys, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type |
| --- | --- |
| keys | <code>Array.&lt;string&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+getSettings"></a>

### resTv2.getSettings(keys, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type |
| --- | --- |
| keys | <code>Array.&lt;string&gt;</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+exchangeRate"></a>

### resTv2.exchangeRate(ccy1, ccy2) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p - resolves to currenct exchange rate  

| Param | Type | Description |
| --- | --- | --- |
| ccy1 | <code>string</code> | i.e. BTC |
| ccy2 | <code>string</code> | i.e. USD |

<a name="RESTv2+generateToken"></a>

### resTv2.generateToken(opts, cb) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type |
| --- | --- |
| opts | <code>Object</code> | 
| opts.ttl | <code>number</code> | 
| opts.scope | <code>string</code> | 
| opts.writePermission | <code>boolean</code> | 
| cb | <code>Method</code> | 

<a name="RESTv2+submitOrder"></a>

### resTv2.submitOrder(order, cb)
Submit new order

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>Order</code> | models.Order |
| cb | <code>Method</code> |  |

<a name="RESTv2+updateOrder"></a>

### resTv2.updateOrder(order, cb)
Update existing order

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| order | <code>Objet</code> | updates to order |
| cb | <code>Method</code> |  |

<a name="RESTv2+cancelOrder"></a>

### resTv2.cancelOrder(id, cb)
Cancel existing order

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>int</code> | order id |
| cb | <code>Method</code> |  |

<a name="RESTv2+claimPosition"></a>

### resTv2.claimPosition(id, cb)
Claim existing open position

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>int</code> | position id |
| cb | <code>Method</code> |  |

<a name="RESTv2+submitFundingOffer"></a>

### resTv2.submitFundingOffer(offer, cb)
Submit new funding offer

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| offer | <code>Object</code> | models.Offer |
| cb | <code>Method</code> |  |

<a name="RESTv2+cancelFundingOffer"></a>

### resTv2.cancelFundingOffer(id, cb)
Cancel existing funding offer

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>int</code> | offer id |
| cb | <code>Method</code> |  |

<a name="RESTv2+closeFunding"></a>

### resTv2.closeFunding(params, cb)
Close funding

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| param.id | <code>int</code> | funding id |
| param.type | <code>string</code> | funding type LIMIT | FRRDELTAVAR |
| cb | <code>\*</code> |  |

<a name="RESTv2+submitAutoFunding"></a>

### resTv2.submitAutoFunding(params, cb)
Submit automatic funding

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| params.status | <code>int</code> |  |
| params.currency | <code>string</code> | currency i.e fUSD |
| params.amount | <code>number</code> | amount to borrow/lend |
| params.rate | <code>number</code> | if == 0 then FRR is used |
| params.period | <code>int</code> | time the offer remains locked in for |
| cb | <code>\*</code> |  |

<a name="RESTv2+transfer"></a>

### resTv2.transfer(cb) ⇒ <code>Promise</code>
Execute a balance transfer between wallets

**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  
**Returns**: <code>Promise</code> - p  

| Param | Type | Description |
| --- | --- | --- |
| params.amount | <code>number</code> | amount to transfer |
| params.from | <code>string</code> | wallet from |
| params.to | <code>string</code> | wallet to |
| params.currency | <code>string</code> | currency from |
| params.currencyTo | <code>string</code> | currency to |
| cb | <code>Method</code> |  |

<a name="RESTv2+getDepositAddress"></a>

### resTv2.getDepositAddress(params, wallet, method, opRenew, cb)
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>Object</code> |  |
| wallet | <code>string</code> | wallet i.e exchange, margin |
| method | <code>string</code> | protocol method i.e bitcoin, tetherus |
| opRenew | <code>int</code> | if 1 then generates a new address |
| cb | <code>\*</code> |  |

<a name="RESTv2+withdraw"></a>

### resTv2.withdraw(params, wallet, method, amount, address, cb)
**Kind**: instance method of [<code>RESTv2</code>](#RESTv2)  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> |  |
| wallet | <code>string</code> | wallet i.e exchange, margin |
| method | <code>string</code> | protocol method i.e bitcoin, tetherus |
| amount | <code>number</code> | amount to withdraw |
| address | <code>string</code> | destination address |
| cb | <code>\*</code> |  |

