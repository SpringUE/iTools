// console.log
export function log(...args) {
    console.log(...args);
}

// console.error
export function logError(...args) {
    console.error(...args);
}

const msgQueue = []

/**
 * 初始化事件消息系统
 * @param {Array} msgQueue 消息队列
 */
export function initMessager() {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if(!message?.code) {
            log('无指令消息：', message, sender, sendResponse)
            return;
        }
        const listerner = msgQueue.find(x => x.code === message?.code)
        if(listerner && listerner.callback) {
            listerner.callback(message, sender, sendResponse)
        } else {
            // log('无匹配的指令消息：', message, sender, sendResponse)
        }
    });
}
/**
 * 注册消息接收事件
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function onMessage(code, callback) {
    const listerner = msgQueue.find(x => x.code === code)
    if(!listerner) {
        msgQueue.push({code, callback})
    } else {
        logError('事件code冲突：'+ code)
    }
}
/**
 * 发送消息
 * @param {Object} message 消息内容
 */
export function sendMessage(message) {
    chrome.runtime.sendMessage(message);
}


export default {
    log,
    logError,
    initMessager,
    onMessage,
    sendMessage,
}