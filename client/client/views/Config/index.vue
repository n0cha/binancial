<template>
	<div>
		<el-form ref="form" label-width="120px">
			<el-form-item label="API key">
				<el-input v-model="apiKey"></el-input>
			</el-form-item>
			<el-form-item label="Secret key">
				<el-input v-model="secretKey"></el-input>
			</el-form-item>
			<el-form-item label="">
				<div class="info"><p>
					The API key and Secret key are not stored on the server. They're stored locally in a secure cookie. They do pass to the server with each request, protected by HTTPS encryption. Despite this, make sure the key pair you supply here is limited to read access.
				</p></div>
			</el-form-item>
			<el-form-item label="Markets">
				<el-checkbox-group v-model="denominators">
					<el-checkbox label="BTC" name="denominators" border></el-checkbox>
					<el-checkbox label="ETH" name="denominators" border></el-checkbox>
					<el-checkbox label="BNB" name="denominators" border></el-checkbox>
					<el-checkbox label="USDT" name="denominators" border></el-checkbox>
				</el-checkbox-group>
			</el-form-item>
			<el-form-item label="Symbols">
				<el-table :data="coins" style="width: 100%">
					<el-table-column prop="symbol" label="Symbol"></el-table-column>
					<el-table-column label="">
						<template slot-scope="scope">
							<el-button
									size="mini"
									type="danger"
									@click="deleteSymbol(scope.symbol)">Delete</el-button>
						</template>
					</el-table-column>
				</el-table>
			</el-form-item>
			<el-form-item label="Add symbol">
				<el-input v-model="symbol"></el-input><el-button @click="addSymbol()">Add</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<script>
	export default {
		name: 'Configuration',
		components: {},
		props: {
			symbol: ''
		},
		data() {
			return {
				apiKey: this.$cookies.get('apiKey'),
				secretKey: this.$cookies.get('secretKey'),
				denominators: [],
				coins: [
					{symbol: 'XRP'}
				]
			};
		},
		watch: {
			apiKey: function (value) {
				this.$cookies.set('apiKey', value, null, null, null, true)
			},
			secretKey: function (value) {
				this.$cookies.set('apiKey', value, null, null, null, true)
			},
			denominators: value => console.log(value)
		},
		methods: {
			deleteSymbol(symbol) {
				console.log(symbol);
			},
			addSymbol() {
				this.coins.push({symbol: this.symbol.toUpperCase()})
				this.symbol = ''
				console.log(this.coins)
			}
		}
	}
</script>

<style>
	.info {
		background-color: #fdf6ec;
		padding: 8px 16px;
		border-radius: 4px;
		border-left: 5px solid #e6a23c;
		line-height: 1.8em;
	}
</style>
