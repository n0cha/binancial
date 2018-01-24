const recvWindow = 30000;

(function () {
	const lib = ({_, CryptoJS, request}) => {
		return {
			getData: ({coins, apiKey, secretKey, denominators, conversions}) => {
				const signRequest = qs => {
					const timestamp = Date.now();
					qs = _.assign(qs, {recvWindow, timestamp});
					const queryString = _.map(qs, (value, key) => `${key}=${value}`).join('&');
					qs.signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(CryptoJS.enc.Hex);
					return qs;
				};
				
				const apiRequest = (endpoint, qs = {}, signed = false) => new Promise((resolve, reject) => {
					const baseUri = 'https://api.binance.com/';
					const uri = `${baseUri}${endpoint}`;
					const headers = {
						'X-MBX-APIKEY': apiKey
					};
					
					if (signed) {
						qs = signRequest(qs);
					}
					
					request({uri, qs, headers}, (error, response, body) => {
						if (error) {
							console.log(error);
							return reject(error);
						}
						resolve(JSON.parse(body));
					});
				});
				
				const setConversionRates = priceData => {
					_.each(conversions, conversion => {
						let symbol = `${conversion.from}${conversion.to}`;
						let symbolData = _.find(priceData, {symbol});
						if (!symbolData) {
							symbol = `${conversion.to}${conversion.from}`;
							symbolData = _.find(priceData, {symbol});
							conversion.inverted = true;
						}
						_.assign(conversion, {
							symbol,
							price: symbolData.price
						});
						if (conversion.inverted) {
							conversion.price = 1 / conversion.price;
						}
					});
				};
				
				const getGlobalData = () => {
					return Promise.all([
						apiRequest('api/v1/ticker/allPrices'),
						apiRequest('api/v3/account', {}, true)
					]).then(data => {
						const [priceData, accountData] = data;
						setConversionRates(priceData);
						return {priceData, accountData};
					});
				};
				
				const getDenominatorAssets = accountData => _.reduce(denominators, (result, denom) => {
					const assetData = _.find(accountData.balances, {asset: denom});
					result[denom] = (+assetData.free) + (+assetData.locked);
					return result;
				}, {});
				
				const calculateTradeAverage = ({tradesData, assetQty}) => {
					let sumPrice = 0;
					let sumQty = 0;
					_.each(tradesData.reverse(), trade => {
						const tradeQty = Math.min(+trade.qty, assetQty - sumQty);
						const price = (+trade.price);
						const total = tradeQty * price;
						if (trade.isBuyer) {
							sumPrice += total;
							sumQty += tradeQty;
						} else {
							sumPrice -= total;
							sumQty -= tradeQty;
						}
					});
					
					return {avg: _.round(sumPrice / sumQty, 8), qty: sumQty};
				};
				
				const processTradesData = ({tradesData, assetQty}) => calculateTradeAverage({tradesData, assetQty});
				
				const getCoinSymbolData = ({priceData, coin, assetQty}) => {
					const result = {};
					return Promise.all(_.map(denominators, denominator => {
						const symbol = `${coin}${denominator}`;
						const symbolPriceData = _.find(priceData, {symbol});
						if (!symbolPriceData) {
							return;
						}
						const price = (+symbolPriceData.price);
						return getSymbolData({symbol, denominator, price, assetQty})
								.then(symbolData => {
									result[symbol] = symbolData;
								});
					})).then(() => {
						return result;
					});
				};
				
				const getTradesData = ({symbol, assetQty}) => apiRequest('api/v3/myTrades', {symbol}, true)
						.then(tradesData => processTradesData({tradesData, assetQty}));
				
				const getSymbolData = ({symbol, denominator, price, assetQty}) => getTradesData({symbol, assetQty})
						.then(tradeData => {
							return {
								denominator,
								price,
								buyAvg: tradeData.avg,
								converted: _(conversions).filter({from: denominator}).map((conversion) => _.assign(conversion, {
									buyAvg: _.round(tradeData.avg * conversion.price, 8)
								})).value()
							};
						});
				
				const getCoinData = ({accountData, priceData, coin}) => {
					const assetData = _.find(accountData.balances, {asset: coin});
					const assetQty = (+assetData.free) + (+assetData.locked);
					return getCoinSymbolData({priceData, coin, assetQty})
							.then(symbolData => {
								return {
									free: (+assetData.free),
									locked: (+assetData.locked),
									total: assetQty,
									symbols: symbolData
								};
							});
				};
				
				const getCoinsData = ({accountData, priceData}) => {
					const result = {};
					return Promise.all(_.map(coins, coin => getCoinData({accountData, priceData, coin})
							.then(coinData => result[coin] = coinData)
					)).then(() => {
						return result;
					});
				};
				
				return getGlobalData()
						.then(data => Promise.all([
							getDenominatorAssets(data.accountData),
							getCoinsData(data)
						]))
						.then(([denominators, coins]) => ({
							denominators,
							coins
						}))
						.catch(err => {
							console.error(err);
							throw err;
						})
			}
		};
	};
	
	if (typeof window === 'object') {
		window._binanceAPI = lib;
	} else if (typeof module === 'object') {
		module.exports = lib;
	}
}());
