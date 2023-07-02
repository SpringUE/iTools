import Vue from 'vue'
import Router from 'vue-router'
import {
  BasicLayout
} from './layouts'
import Home from './views/Home.vue'

// hack router push callback
const originalPush = Router.prototype.push
Router.prototype.push = function push (location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject)
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(Router)

export default new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: '/home',
      component: BasicLayout,
      children: [
        {
          path: 'home',
          name: 'Home',
          component: Home
        }
      ]
    }
  ]
})
