
import devtoolsUtil from './utils/devtools'


function createPanelCallback(panel) {
  devtoolsUtil.log('chrome.devtools', chrome.devtools)
  devtoolsUtil.log('chrome.devtools.network', chrome.devtools.network)
  devtoolsUtil.log('自定义面板创建成功！panel --> ', panel)
  

  // const object = chrome.devtools.network
  // let networkKeys = []
  // for (const key in object) {
  //     networkKeys.push(key);
  // }
  // devtoolsUtil.log(networkKeys.join(','));
}

chrome.devtools.panels.create('iTools', null, '/devtools.html', createPanelCallback)
