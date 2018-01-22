const recvWindow = 30000;

(function () {
	const lib = ({_, CryptoJS, request}) => {
		return {
			getData: ({coins, apiKey, secretKey, denominators, conversions}) => {
				const signRequest = qs => {
					const timestamp = Date.now();
					qs = _.extend(qs, {recvWindow, timestamp});
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
							return reject(error);
						}
						resolve(JSON.parse(body));
					});
				});
				
				const setConversionRates = priceData => {
					_.each(conversions, conversionFrom => {
						_.each(conversionFrom, conversionTo => {
							conversionTo.price = _.find(priceData, {symbol: conversionTo.symbol}).price;
							if (conversionTo.inverted) {
								conversionTo.price = 1 / conversionTo.price;
							}
						});
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
						const price = (+_.find(priceData, {symbol}).price);
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
								converted: _.reduce(conversions[denominator], (result, conversion, coin) => {
									result[coin] = {
										symbol: conversion.symbol,
										buyAvg: _.round(tradeData.avg * conversion.price, 8)
									};
									return result;
								}, {})
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
						}));
			}
		};
	};
	
	if (typeof window === 'object') {
		window._binanceAPI = lib;
	} else if (typeof module === 'object') {
		module.exports = lib;
	}
}());
