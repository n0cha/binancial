const _ = require('lodash');
const binance = require('./binance.js');
const coinMarketCap = require('./coinmarketcap');

const getBalance = (data, symbol) => {
	const balance = _.find(data.account.balances, {asset: symbol});
	return _.assign(balance, {
		free: (+balance.free),
		locked: (+balance.locked),
		total: (+balance.free) + (+balance.locked)
	});
};

const getCoinValue = (data, symbol, currency = 'USD') => {
	symbol = coinMarketCap.mapSymbol(symbol);
	return (+_.find(data.values, {symbol})[`price_${currency.toLowerCase()}`]);
};

const getCoinChange = (data, symbol) => {
	symbol = coinMarketCap.mapSymbol(symbol);
	return (+_.find(data.values, {symbol}).percent_change_24h);
};

const getSymbolPrice = (data, symbol) => {
	return (+_.find(data.prices, {symbol}).price);
};

const getCoinData = (data, symbol, currency) => {
	const balance = getBalance(data, symbol);
	const value = getCoinValue(data, symbol, currency);
	const change = getCoinChange(data, symbol);
	return {
		symbol,
		value,
		freeQty: balance.free,
		lockedQty: balance.locked,
		totalQty: balance.total,
		totalValue: _.round(balance.total * value, 2),
		change
	};
};

const getMarketsData = ({markets, coins, currency}, data) => {
	return _.map(markets, (marketSymbol) => {
		const coinData = getCoinData(data, marketSymbol, currency);
		
		const potentialQty = _.round(coinData.totalQty + _.sum(_.map(coins, coinSymbol => {
			return getBalance(data, coinSymbol).total * getSymbolPrice(data, coinSymbol + marketSymbol);
		})), 8);
		
		return _.assign(coinData, {
			potentialQty,
			potentialValue: _.round(potentialQty * coinData.value, 2)
		});
	});
};

const getRelevantTrades = (data, coinSymbol, markets) => {
	return _(markets).map(marketSymbol => {
		const symbol = coinSymbol + marketSymbol;
		return _.map(data.trades[symbol], trade => _.assign(trade, {symbol}));
	}).flatten().sortBy('time').reverse().value();
};

const getCoinRelevantTradeData = (data, coinSymbol, markets) => {
	let totalQty = getBalance(data, coinSymbol).total;
	
	const trades = getRelevantTrades(data, coinSymbol, markets);
	
	const result = {};
	
	_.each(markets, marketSymbol => {
		result[coinSymbol + marketSymbol] = {
			sumPrice: 0,
			sumQty: 0
		}
	});
	
	_.each(trades, trade => {
		if (!totalQty) {
			return;
		}
		
		const tradeQty = Math.min(+trade.qty, totalQty);
		const totalPrice = tradeQty * (+trade.price);
		if (trade.isBuyer) {
			result[trade.symbol].sumPrice += totalPrice;
			result[trade.symbol].sumQty += tradeQty;
		} else {
			result[trade.symbol].sumPrice -= totalPrice;
			result[trade.symbol].sumQty -= tradeQty;
		}
		
		totalQty -= tradeQty;
	});
	
	_.each(result, (symbolResult) => {
		symbolResult.averagePrice =  _.round(symbolResult.sumPrice / symbolResult.sumQty, 8);
	});
	
	return result;
};

const getSymbolChange = (data, symbol) => {
	return +data.change[symbol].priceChangePercent;
};

const getCoinsData = ({coins, markets, conversions, currency}, data) => {
	return _.map(coins, coinSymbol => {
		const coinData = getCoinData(data, coinSymbol, currency);
		const coinTradeData = getCoinRelevantTradeData(data, coinSymbol, markets);
		
		return _.assign(coinData, {
			trades: _.map(markets, marketSymbol => {
				const tradeSymbol = coinSymbol + marketSymbol;
				return {
					tradeSymbol,
					marketSymbol,
					currentPrice: getSymbolPrice(data, tradeSymbol),
					avgBuyPrice: coinTradeData[tradeSymbol].averagePrice,
					boughtQty: coinTradeData[tradeSymbol].sumQty,
					change: getSymbolChange(data, tradeSymbol)
				};
			})
		});
	});
};

module.exports = {
	getData: ({apiKey, secretKey, markets, coins, conversions, currency}) => {
		const bin = binance({apiKey, secretKey});
		
		return Promise.all([
				bin.getPrices(),
				bin.getAccountData(),
				coinMarketCap.getTicker({currency})
		]).then(data => {
			data = _.zipObject(['prices', 'account', 'values'], data);
			
			const symbols = _(coins)
					.map(coin => _.map(markets, market => coin + market))
					.flatten()
					.filter(symbol => _.find(data.prices, {symbol}))
					.value();
			
			return Promise.all([
				Promise.all(_.map(symbols, bin.getTrades)),
				Promise.all(_.map(symbols, bin.getChange))
			])
					.then(([tradesData, changeData]) => {
						data.trades = _.zipObject(symbols, tradesData);
						data.change = _.zipObject(symbols, changeData);
						return data;
					});
		}).then(data => {
			return {
				markets: getMarketsData({markets, coins, conversions, currency}, data),
				coins: getCoinsData({markets, coins, conversions, currency}, data)
			};
		})
	}
};
