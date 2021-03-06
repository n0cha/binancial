<template>
	<div>
		<div v-if="!marketAssets || !coinAssets.length">
			<div class="info"><p>
				There's nothing to show. This is probably because you haven't configured Binancial yet.
				Unless there's a problem with the connection or your API Key.
				Click on the cogwheel in the top-right to go to the Configuration screen.
			</p></div>
		</div>
		<div v-if="marketAssets && coinAssets.length">
			<el-card>
				<div slot="header">
					<span>Markets</span>
				</div>
				<div id="marketList" class="-bin-list">
					<div v-for="market in marketAssets" :key="market.symbol">
						<el-row>
							<span class="-bin-cell" style="width: 70px"><label>{{market.symbol}}</label></span>
							<span class="-bin-cell" data-number v-tooltip="'Total amount of this coin you own'">{{market.totalQty}}</span>
							<span class="-bin-cell" data-number v-tooltip="'Current value of this coin'">
								<i class="md-icon -bin-change" :class="'-bin-change-' + trend(market.change)">trending_{{trend(market.change)}}</i>
								{{formatCurrency(market.value)}}
							</span>
							<span class="-bin-cell" data-number v-tooltip="'Estimated value of your assets in this coin'">{{formatCurrency(market.totalValue)}}</span>
							<span class="-bin-cell" data-number="dimmed" v-tooltip="'Potential quantity if all coins below are converted to this asset'">{{market.potentialQty}}</span>
							<span class="-bin-cell" data-number="dimmed" v-tooltip="'Potential value if all coins below are converted to this asset'">{{formatCurrency(market.potentialValue)}}</span>
						</el-row>
					</div>
				</div>
			</el-card>
			<el-card>
				<div slot="header">
					<span>Coins</span>
					<div class="-bin-headerControls">
						<label>Sort by:&nbsp;</label>
						<el-select v-model="sortBy" placeholder="Sort by">
							<el-option v-for="option in sortByOptions" :key="option.value" :label="option.label" :value="option.value"></el-option>
						</el-select>
					</div>
				</div>
				<div id="assetList" class="-bin-list">
					<div v-for="coin in coinAssets" :key="coin.symbol">
						<el-row>
							<span class="-bin-cell" style="width: 70px"><label>{{coin.symbol}}</label></span>
							<span class="-bin-operator">(</span>
							<span class="-bin-cell" data-number="positive" v-tooltip="'Amount of this coin you own available for trading'">{{formatNumber(coin.freeQty)}}</span>
							<span class="-bin-operator">+</span>
							<span class="-bin-cell" data-number="negative" v-tooltip="'Amount of this coin you own locked in an order'">{{formatNumber(coin.lockedQty)}}</span>
							<span class="-bin-operator">) x</span>
							<span class="-bin-cell" data-number v-tooltip="'Current value of this coin'">
								<i class="md-icon -bin-change" :class="'-bin-change-' + trend(coin.change)">trending_{{trend(coin.change)}}</i>
								{{formatCurrency(coin.value)}}
							</span>
							<span class="-bin-operator">=</span>
							<span class="-bin-cell" data-number v-tooltip="'Value of your total assets in this coin'">{{formatCurrency(coin.totalValue)}}</span>
						</el-row>
						<div v-for="pair in coin.trades" :key="pair.tradeSymbol">
							<el-row :gutter="2">
								<el-col :span="3"><span class="-bin-cell"><label>{{pair.tradeSymbol}}</label></span></el-col>
								<el-col :span="4"><span class="-bin-cell" data-number v-tooltip="'Quantity of your current assets in this coin bought through this market'">{{formatNumber(pair.boughtQty)}}</span></el-col>
								<el-col :span="4"><span class="-bin-cell" data-number v-tooltip="'Average price paid for your current assets in this coin through this market'">{{formatNumber(pair.avgBuyPrice)}}</span></el-col>
								<el-col :span="4">
									<span class="-bin-cell" data-number v-tooltip="'Current price of this coin in this market'">
										<i class="md-icon -bin-change" :class="'-bin-change-' + trend(pair.change)">trending_{{trend(pair.change)}}</i>
										{{formatNumber(pair.currentPrice)}}
									</span>
								</el-col>
								<el-col :span="3"><span class="-bin-cell" :class="highlightHigh(pair.ratio, true)"
										:data-number="isFinite(pair.ratio) ? (pair.ratio > 1 ? 'positive' : 'negative') : ''"
										v-tooltip="'Current profit margin'">{{delta(pair.ratio)}}</span>
								</el-col>
								<el-col :span="3"><span class="-bin-cell" data-number v-tooltip="'Last price you sold this coin for through this market'">{{formatNumber(pair.lastSellPrice)}}</span></el-col>
								<el-col :span="3"><span class="-bin-cell" :class="highlightLow(pair.lastSellRatio)"
                    :data-number="isFinite(pair.lastSellRatio) ? (pair.lastSellRatio > 1 ? 'positive' : 'negative') : ''"
                    v-tooltip="'Current price compared to last sell price'">{{delta(pair.lastSellRatio)}}</span>
								</el-col>
							</el-row>
<!--
							<el-row	:gutter="2" v-for="conversion in pair.conversions" :key="conversion.conversionSymbol">
								<el-col :span="5">&nbsp;</el-col>
								<el-col :span="5"><span class="-bin-cell">{{conversion.conversionSymbol}}</span></el-col>
								<el-col :span="5"><span class="-bin-cell" data-number>{{formatNumber(conversion.convertedAvgBuyPrice)}}</span></el-col>
								<el-col :span="5">&nbsp;</el-col>
								<el-col :span="4"><span class="-bin-cell"
                    :data-number="isFinite(conversion.ratio) ? (conversion.ratio > 1 ? 'positive' : 'negative') : ''"
								>{{conversion.convertedAvgBuyPrice ? delta(conversion.ratio) : 'N/A'}}</span></el-col>
							</el-row>
-->
						</div>
					</div>
				</div>
			</el-card>
		</div>
	</div>
</template>

<script>
	import _ from 'lodash'
	import api from '../../modules/api.js'
	
	export default {
		name: 'Dashboard',
		components: {},
		mounted: function () {
			api.subscribe('dashboard', this.update.bind(this))
		},
		methods: {
			trend: change => change > 1 ? 'up' : (change < 1 ? 'down' : 'flat'),
			update: function (data) {
				if (data instanceof Error) {
					this.$store.commit('setConnectionState', +data.message)
					return
				}
				
				this.$store.commit('setConnectionState', 200)
				this.marketData = data
			},
			delta: value => isFinite(value) ? (value < 1) ? `-${_.round((1 - value) * 100, 2)}%` : `+${_.round((value - 1) * 100, 2)}%` : 'N/A',
			formatNumber: value => _.isNumber(value) ? value.toFixed(8) : 'N/A',
			formatCurrency: function (value) {
				value = _.round(value, 2).toFixed(2)
				return `${this.currencySymbol} ${value}`
			},
			highlightLow(value) {
				return value <= 1 - this.highlightThreshold ? 'highlight' : '';
			},
			highlightHigh(value) {
				return value >= 1 + this.highlightThreshold ? 'highlight' : '';
			}
		},
		computed: {
			highlightThreshold: () => 0.5,
			marketAssets: function () {
				return this.marketData.markets
			},
			coinAssets: function () {
				let coinAssets = _.map(this.marketData.coins, coin => {
					return _.assign(coin, {
						trades: _.map(coin.trades, trade => {
							return _.assign(trade, {
								ratio: trade.currentPrice / trade.avgBuyPrice,
								lastSellRatio: trade.currentPrice / trade.lastSellPrice/*,
								conversions: _.map(trade.conversions, conversion => {
									return _.assign(conversion, {
										ratio: trade.currentPrice / conversion.convertedAvgBuyPrice
									});
								})*/
							})
						})
					})
				})
				
				coinAssets =  _.sortBy(coinAssets, this.sortBy)
				
				if (coinAssets.length && _.isNumber(coinAssets[0][this.sortBy])) {
					coinAssets.reverse();
				}
				
				return coinAssets;
			},
			allSymbols: function () {
				return _.map(this.coins, 'symbol')
			}
		},
		watch: {
			sortBy: value => localStorage.setItem('sortBy', value)
		},
		data() {
			return {
				currencySymbol: localStorage.getItem('currency') || 'USD',
				notification: '',
				expandedCoins: [],
				markets: ['BTC', 'ETH', 'BNB', 'USDT'],
				apiKey: this.$cookies.get('apiKey'),
				secretKey: this.$cookies.get('secretKey'),
				denominators: JSON.parse(localStorage.getItem('denominators') || '[]'),
				coins: JSON.parse(localStorage.getItem('coins') || '[]'),
				conversions: JSON.parse(localStorage.getItem('conversions') || '[]'),
				updateInterval: localStorage.getItem('updateInterval') || 5000,
				marketData: {},
				sortBy: localStorage.getItem('sortBy') || 'symbol',
				sortByOptions: [
					{label: 'Symbol', value: 'symbol'},
					{label: 'Total quantity', value: 'totalQty'},
					{label: 'Free quantity', value: 'freeQty'},
					{label: 'Locked quantity', value: 'lockedQty'},
					{label: 'Value', value: 'value'},
					{label: 'Total value', value: 'totalValue'}
				]
			}
		}
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
