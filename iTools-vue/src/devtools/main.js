import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import '../styles/common.less';
import devtoolsUtil from './utils/devtools'

Vue.use(ElementUI);

// 定义全局过滤器
Vue.filter('formatTimeConsuming', (value) => devtoolsUtil.formatTimeConsuming(value));
Vue.filter('formatResponseSize', (value) => devtoolsUtil.formatResponseSize(value));
Vue.filter('formatInterceptorInfo', (value) => devtoolsUtil.formatInterceptorInfo(value));


new Vue({
  render: h => h(App)
}).$mount('#app')
