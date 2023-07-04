
import devtools from './utils/devtools'

function createPanelCallback(panel) {
  // devtools.log('chrome.devtools', chrome.devtools)
  // devtools.log('chrome.devtools.network', chrome.devtools.network)
  devtools.log('iTools is aready --> ', panel)
}

const msgQueue = []

chrome.devtools.panels.create('iTools', null, '/devtools.html', createPanelCallback)
devtools.initMessager(msgQueue)