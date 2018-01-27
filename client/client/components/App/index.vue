<template>
	<div id="app">
		<el-container class="page-layout" direction="horizontal">
			<el-container class="page-layout-inner" direction="vertical">
				<header-component :title="title"/>
				<el-main>
					<div class="main-content">
						<el-row class="container">
							<router-view></router-view>
						</el-row>
					</div>
				</el-main>
			</el-container>
		</el-container>
	</div>
</template>

<script>
	import Header from 'components/Header'
	import {mapState} from 'vuex'
	
	export default {
		name: 'App',
		computed: {
			...mapState({
				title: state => {
					return state.route.meta.title
				}
			})
		},
		components: {
			'header-component': Header
		},
		created: function () {
			window.addEventListener('resize', this.handleResize)
		}
	}
</script>

<style lang="scss">
	@import '~scss_vars';
	@import './style.scss';
</style>
