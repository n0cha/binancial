<template>
	<div>
		<el-alert v-if="notification" title="Error requesting data" type="error" :description="notification" show-icon></el-alert>
		<h4>Markets</h4>
		<div id="marketList" class="-bin-list">
			<div v-for="market in marketAssets" :key="market.symbol">
				<el-row>
					<span style="width: 70px"><label>{{market.symbol}}</label></span>
					<span data-number>{{market.qty}}</span>
				</el-row>
			</div>
		</div>
		<h4>Assets</h4>
		<div id="assetList" class="-bin-list">
			<div v-for="coin in coinAssets" :key="coin.symbol">
				<el-row>
					<span style="width: 70px"><label>{{coin.symbol}}</label></span>
					<span data-number="positive">{{formatNumber(coin.free)}}</span>
					<span data-number="negative">{{formatNumber(coin.locked)}}</span>
				</el-row>
				<div v-for="pair in coin.pairs" :key="pair.symbol">
					<el-row :gutter="2">
						<el-col :span="6"><span>{{pair.symbol}}</span></el-col>
						<el-col :span="6"><span data-number>{{formatNumber(pair.price)}}</span></el-col>
						<el-col :span="6"><span data-number>{{pair.buyAvg ? formatNumber(pair.buyAvg) : 'N/A'}}</span></el-col>
						<el-col :span="6"><span :data-number="isFinite(pair.ratio) ? (pair.ratio > 1 ? 'positive' : 'negative') : ''">{{pair.buyAvg ? delta(pair.ratio) : 'N/A'}}</span></el-col>
					</el-row>
					<!--<el-row	v-for="conversion in coin.conversions" :key="conversion.symbol">-->
						<!--<el-col :span="6"><span>{{conversion.symbol}}</span></el-col>-->
						<!--<el-col :span="6"><span data-number>{{formatNumber(conversion.price)}}</span></el-col>-->
						<!--<el-col :span="6"><span data-number>{{conversion.buyAvg ? formatNumber(conversion.buyAvg) : 'N/A'}}</span></el-col>-->
						<!--<el-col :span="6"><span :data-number="isFinite(conversion.ratio) ? (conversion.ratio > 1 ? 'positive' : 'negative') : ''">{{conversion.buyAvg ? delta(conversion.ratio) : 'N/A'}}</span></el-col>-->
						<!---->
					<!--</el-row>-->
				</div>
			</div>
		</div>

		<!--<ul id="assetList">-->
			<!--<li v-for="coin in coinAssets">-->
				<!--<label>{{coin.symbol}}</label>-->
				<!--<span>{{coin.total}}</span>-->
				<!--<span>{{coin.free}}</span>-->
				<!--<span>{{coin.locked}}</span>-->
			<!--</li>-->
		<!--</ul>-->
		<!--<el-table :data="coinAssets" style="width: 100%" row-key="symbol" :expand-row-keys="expandedCoins">-->
			<!--<el-table-column type="expand">-->
				<!--<template slot-scope="coin">-->
					<!--<el-table :data="coin.symbols" style="width: 100%">-->
						<!--<el-table-column prop="symbol" label="Symbol"></el-table-column>-->
					<!--</el-table>-->
				<!--</template>-->
			<!--</el-table-column>-->
			<!--<el-table-column prop="symbol" label="Symbol"></el-table-column>-->
			<!--<el-table-column prop="total" label="Owned"></el-table-column>-->
			<!--<el-table-column prop="free" label="Free"></el-table-column>-->
			<!--<el-table-column prop="locked" label="Locked"></el-table-column>-->
		<!--</el-table>-->
		<!--{{marketData}}-->
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
				switch (typeof data) {
					case 'object':
						this.marketData = data;
						break;
					case 'string':
						this.notification = data;
						break;
				}
			},
			delta: value => (value < 1) ? `-${_.round((1 - value) * 100, 2)}%` : `+${_.round((value - 1) * 100, 2)}%`,
			formatNumber: value => {
				value = String(value).split('.');
				value[1] = _.padEnd(value[1], 8, '0');
				return value.join('.');
			}
		},
		computed: {
			marketAssets: function () {
				return _.map(this.marketData.denominators, (qty, symbol) => ({symbol, qty}));
			},
			coinAssets: function () {
				return _.sortBy(
						_.map(
								this.marketData.coins,
								(data, symbol) => _.assign(
										{symbol},
										_.assign(
												{pairs: _.sortBy(
														_.map(
																data.symbols,
																(symbolData, symbol) => _.assign(
																		{
																			symbol,
																			ratio: symbolData.price / symbolData.buyAvg,
																			converted: _.map(symbolData.converted, conversionData => _.assign(
																					{
																				
																					},
																					conversionData
																			))
																		},
																		symbolData
																)
														),
														'symbol'
												)},
												data
										)
								)
						),
				'symbol');
			},
			allSymbols: function () {
				return _.map(this.coins, 'symbol');
			}
		},
		data() {
			return {
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
