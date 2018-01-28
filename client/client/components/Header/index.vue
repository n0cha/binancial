<template>
	<el-header>
		<div class="header-container">
			<div class="header-title">Binancial</div>
		</div>
		<el-button :round="true" size="medium" class="-bin-bigIcon" @click="nav('/config')" v-tooltip="'Configuration'">
			<i class="md-icon">settings</i>
		</el-button>
		<el-button :round="true" size="medium" class="-bin-bigIcon" @click="nav('/')" v-tooltip="'Dashboard'">
			<i class="md-icon">keyboard_arrow_left</i>
		</el-button>
		<span v-if="$store.state.connectionState === 500" class="-bin-bigIcon -bin-flash" v-tooltip="'There\'s a problem communicating with the server'">
			<i class="md-icon">cloud_off</i>
		</span>
		<el-button v-if="$store.state.connectionState === 400" class="-bin-bigIcon -bin-flash" v-tooltip="'Your credentials are incorrect, please set API key and Secret Key in the configuration'" @click="nav('/config')">
			<i class="md-icon">lock</i>
		</el-button>
	</el-header>
</template>

<script>
	export default {
		name: 'Header',
		props: ['openSidebar', 'title'],
		methods: {
			nav(path) {
				this.$router.push(path);
			}
		}
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
