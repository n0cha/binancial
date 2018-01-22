import Vue from 'vue'
import Router from 'vue-router'
import Dashboard from 'views/Dashboard'
import Post from 'views/Post'
import About from 'views/About'
import Config from 'views/Config'

Vue.use(Router)

export const routes = [
  {
    path: '/',
    component: Dashboard,
    meta: {
      title: 'Dashboard'
    }
  },
  {
    path: '/config',
    component: Config,
    meta: {
      title: 'Configuration'
    }
  },
  {
    path: '/post/:id',
    component: Post,
    meta: {
      title: 'Post'
    }
  },
  {
    path: '/about',
    component: About,
    meta: {
      title: 'About'
    }
  }
]
export const router = new Router({ mode: 'history', routes })
