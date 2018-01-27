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
							<span style="width: 70px"><label>{{market.symbol}}</label></span>
							<span data-number v-tooltip="'Total amount of this coin you own'">{{market.totalQty}}</span>
							<span data-number v-tooltip="'Estimated value of your assets in this coin'">{{formatCurrency(market.totalValue)}}</span>
							<span data-number="dimmed" v-tooltip="'Potential quantity if all coins below are converted to this asset'">{{market.potentialQty}}</span>
							<span data-number="dimmed" v-tooltip="'Potential value if all coins below are converted to this asset'">{{formatCurrency(market.potentialValue)}}</span>
						</el-row>
					</div>
				</div>
			</el-card>
			<el-card>
				<div slot="header">
					<span>Coins</span>
				</div>
				<div id="assetList" class="-bin-list">
					<div v-for="coin in coinAssets" :key="coin.symbol">
						<el-row>
							<span style="width: 70px"><label>{{coin.symbol}}</label></span>
							<span data-number="positive" v-tooltip="'Amount of this coin you own available for trading'">{{formatNumber(coin.freeQty)}}</span>
							<span data-number="negative" v-tooltip="'Amount of this coin you own locked in an order'">{{formatNumber(coin.lockedQty)}}</span>
							<span data-number v-tooltip="'Estimated value of your total assets in this coin'">{{formatCurrency(coin.totalValue)}}</span>
						</el-row>
						<div v-for="pair in coin.trades" :key="pair.tradeSymbol">
							<el-row :gutter="2">
								<el-col :span="5"><span><label>{{pair.tradeSymbol}}</label></span></el-col>
								<el-col :span="5"><span data-number v-tooltip="'Quantity of your current assets in this coin bought through this market'">{{formatNumber(pair.boughtQty)}}</span></el-col>
								<el-col :span="5"><span data-number v-tooltip="'Average price paid for your current assets in this coin through this market'">{{pair.avgBuyPrice ? formatNumber(pair.avgBuyPrice) : 'N/A'}}</span>
								</el-col>
								<el-col :span="5"><span data-number v-tooltip="'Current price of this coin in this market'">{{formatNumber(pair.currentPrice)}}</span></el-col>
								<el-col :span="4"><span
										:data-number="isFinite(pair.ratio) ? (pair.ratio > 1 ? 'positive' : 'negative') : ''"
										v-tooltip="'Current profit margin'">{{pair.avgBuyPrice ? delta(pair.ratio) : 'N/A'}}</span>
								</el-col>
							</el-row>
	<!--
							<el-row	v-for="conversion in coin.conversions" :key="conversion.symbol">
							<el-col :span="6"><span>{{conversion.symbol}}</span></el-col>
							<el-col :span="6"><span data-number>{{formatNumber(conversion.price)}}</span></el-col>
							<el-col :span="6"><span data-number>{{conversion.buyAvg ? formatNumber(conversion.buyAvg) : 'N/A'}}</span></el-col>
							<el-col :span="6"><span :data-number="isFinite(conversion.ratio) ? (conversion.ratio > 1 ? 'positive' : 'negative') : ''">{{conversion.buyAvg ? delta(conversion.ratio) : 'N/A'}}</span></el-col>
							
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
			update: function (data) {
				if (data instanceof Error) {
					this.$store.commit('setConnectionState', +data.message)
					return
				}
				
				this.$store.commit('setConnectionState', 200)
				this.marketData = data
			},
			delta: value => (value < 1) ? `-${_.round((1 - value) * 100, 2)}%` : `+${_.round((value - 1) * 100, 2)}%`,
			formatNumber: value => {
				value = String(value).split('.')
				value[1] = _.padEnd(value[1], 8, '0')
				return value.join('.')
			},
			formatCurrency: function (value) {
				value = String(value).split('.')
				value[1] = _.padEnd(value[1], 2, '0')
				return `${this.currencySymbol} ${value.join('.')}`
			}
		},
		computed: {
			marketAssets: function () {
				return this.marketData.markets
			},
			coinAssets: function () {
				return _.map(this.marketData.coins, coin => {
					return _.assign(coin, {
						trades: _.map(coin.trades, trade => {
							return _.assign(trade, {
								ratio: trade.currentPrice / trade.avgBuyPrice
							})
						})
					})
				})
			},
			allSymbols: function () {
				return _.map(this.coins, 'symbol')
			}
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
				marketData: {}
			}
		}
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
