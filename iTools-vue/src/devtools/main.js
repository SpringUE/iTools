import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import '../styles/common.less';
import devtools from './utils/devtools'

function renderApp(Vue) {
  Vue.use(ElementUI);
  
  // 定义全局过滤器
  Vue.filter('formatTimeConsuming', (value) => devtools.formatTimeConsuming(value));
  Vue.filter('formatResponseSize', (value) => devtools.formatResponseSize(value));
  Vue.filter('formatInterceptorInfo', (value) => devtools.formatInterceptorInfo(value));

  new Vue({
    render: h => h(App)
  }).$mount('#app')
}

let sender

function createPanelCallback(panel) {
  chrome.devtools.panels.iTools = panel
  devtools.log('iTools is aready --> ', panel)

  renderApp(Vue)

  sender = setInterval(() => {
    devtools.sendMessage({code:'devtoolsNotes', data:"I'm devtools"})
  }, 1000 * 30)
}

if(chrome.devtools) {
  if(!chrome.devtools.panels.iTools) {
    chrome.devtools.panels.create('iTools', null, '/devtools.html', createPanelCallback)
    devtools.initMessager()
  }
  chrome.devtools.panels.onPanelClosed.addListener(function(panel) {
    // 在面板关闭时执行的操作
    devtools.log(panel.title + "面板已关闭");
    devtools.removeMessager()
    sender = null
  });
} else {
  renderApp(Vue)
}


