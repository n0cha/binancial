<template>
	<div id="app">
		<el-container direction="horizontal">
			<sidebar-component :active="sidebarOpened"/>
			<el-container direction="vertical">
				<header-component :openSidebar="openSidebar" :title="title"/>
				<el-main>
					<router-view></router-view>
				</el-main>
			</el-container>
			<dimmer :active="obfuscatorActive" :closeSidebar="closeSidebar"/>
		</el-container>
	</div>
</template>
<script>
	import Header from 'components/Header'
	import Sidebar from 'components/Sidebar'
	import Dimmer from 'components/Dimmer'
	import {mapActions, mapState} from 'vuex'
	
	export default {
		name: 'App',
		methods: {
			...mapActions(['handleResize', 'openSidebar', 'closeSidebar'])
		},
		computed: {
			...mapState({
				sidebarOpened: state => {
					return state.ui.sidebarOpened
				},
				obfuscatorActive: state => {
					return state.ui.obfuscatorActive
				},
				title: state => {
					return state.route.meta.title
				}
			})
		},
		components: {
			'header-component': Header,
			'sidebar-component': Sidebar,
			Dimmer
		},
		created: function () {
			window.addEventListener('resize', this.handleResize)
		}
	}
</script>

<style lang="scss">
	// You can import all your SCSS variables using webpack alias
	@import '~scss_vars';
	@import './style.scss';</style>
