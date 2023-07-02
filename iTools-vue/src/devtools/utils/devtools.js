// Chrome DevTools Extension中不能使用console.log
export function log(...args) {
    return chrome.devtools.inspectedWindow.eval(`
        console.log(...${JSON.stringify(args)});
    `);
}

// 一次性获取HAR所有信息
export function getNetworkHAR() {
    return new Promise((resolve, reject) => {
        try {
            chrome.devtools.network.getHAR((res) => {
                resolve(res)
            });
        } catch (error) {
            reject(error)
        }
    })
}

/**
 * 创建网络请求监听器
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function createNetworkListener(successCallback, errorCallback) {
    chrome.devtools.network.onRequestFinished.addListener(async (data) => {
        try {
            const {
                // 请求的类型，查询参数，以及url
                request,
                // 该方法可用于获取响应体
                getContent,
            } = data;
            const { method, queryString, url } = request

            // log(data);
            // log(request);

            successCallback && successCallback(data)

            // 将callback转为await promise
            // warn: content在getContent回调函数中，而不是getContent的返回值
            // const content = await new Promise((res, rej) => getContent(res));
            // log(content);
        } catch (err) {
            errorCallback && errorCallback(err)
            // log(err.stack || err.toString());
        }
    });
}

/**
 * 创建浏览器页签更新监听器
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function createTabUpdatedListener(successCallback, errorCallback) {
    /*
    chrome.tabs.onUpdated 事件是 chrome.tabs API 中的一个事件，用于监听标签页的更新事件。当标签页的任何属性发生变化时，此事件将被触发。
    chrome.tabs.onUpdated 事件的回调函数将接收两个参数：

    tabId（整数）：表示发生更新的标签页的唯一标识符（ID）。
    changeInfo（对象）：包含了标签页的更新信息。这个对象的属性包括：
    status：表示标签页的加载状态（如 “loading” 或 “complete”）。
    url：表示标签页的 URL 地址。
    title：表示标签页的标题。
    favIconUrl：表示标签页的网站图标的 URL 地址。
    pinned：表示标签页是否被固定。
    */
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        log('标签页 ' + tabId + ' 发生了更新');
        log('更新信息:', changeInfo);

        try {
            successCallback && successCallback(data)
        } catch (err) {
            errorCallback && errorCallback(err)
        }
    });
}

/**
 * 创建捕获页面即将加载的事件监听器
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function createwebNavigationListener(successCallback, errorCallback) {
    chrome.webNavigation.onCommitted.addListener(function (details) {
        // 判断是否是顶级框架加载
        if (details.frameId === 0) {
            log('页面刷新了');
            try {
                successCallback && successCallback(details)
            } catch (err) {
                errorCallback && errorCallback(err)
            }
            // 清空 Network 面板记录
            //   chrome.devtools.network.clear(function() {
            //     callback && callback(details)
            //     log('Network 面板记录已清空');
            //   });
        }
    });
}

/**
 * 格式化请求JS文件(借助background)
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function formatRequestJsFile(options = {}, successCallback, errorCallback) {
    const { responseHanlder, urls } = options

    const message = {
        code: 'webResponseHanlder',
        data: {
            responseHanlder, urls, successCallback, errorCallback
        }
    }
    sendMessageToBackground(message)
}


/**
 * 向background发送消息
 * @param {Object} message 消息内容
 */
export function sendMessageToBackground(message) {
    chrome.runtime.sendMessage({ message });
}

/**
 * 注册接收background消息事件
 * @param {Function} successCallback 成功回调函数
 * @param {Function} errorCallback 出错回调函数
 */
export function onBackgroundMessage(callback) {
    // 接收background发送的消息
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        log("Message from background:", message);
        callback && callback(message, sender, sendResponse)
    });
}

/**
 * 从URL中取文件名
 * @param {String} size request.request.url
 * @returns text
 */
export function getFileNameFromUrl(url) {
    if (!url) return ''
    const matchUrl = url?.match(/([^\/]+)$/)
    const fileName = matchUrl && matchUrl.length && matchUrl[0] || url
    return fileName
}

/**
 * 过滤发起程序
 * @param {Object} data 发起程序对象列表
 * @param {String} initiatorRegExp 过滤正则表达式
 * @returns 所有符合匹配的程序
 */
export function filterInitiator(data = [], initiatorRegExp) {
    let reg, result = []
    try {
        reg = new RegExp(initiatorRegExp);
        result = data.filter(x => {
            const isValidInitiator = reg.test(x.url)
            return isValidInitiator
        })
    } catch (error) {
        result = []
    }

    return result
}

/**
 * 从发起程序中取信息
 * @param {Object} data 发起程序对象
 * @param {String} initiatorRegExp 过滤正则表达式
 * @returns 发起程序信息
 */
export function getInitiator(data = {}, initiatorRegExp) {
    const { type, stack, url, lineNumber } = data
    if (type !== 'script') {
        return {
            name: getFileNameFromUrl(url),
            data,
            stackCallFrames: [getFileNameFromUrl(url)]
        }
    }

    let stackCallFrames = stack?.callFrames

    if (!stackCallFrames || !stackCallFrames.length) {
        stackCallFrames = stack?.parent?.callFrames
    }

    let [top] = stackCallFrames
    if (initiatorRegExp) {
        const _stackCallFrames = filterInitiator(stackCallFrames, initiatorRegExp);
        top = _stackCallFrames[0] || {}
    }

    return {
        name: getFileNameFromUrl(top?.url),
        data: top,
        stackCallFrames
    }
}

/**
 * 格式化耗时文本
 * @param {Number} time request.time值
 * @param {Object} timings request.timings对象
 * @returns text
 */
export function formatTimeConsuming(time, timings = {}) {
    const { blocked, connect, dns, receive, send, ssl, wait, _blocked_queueing } = timings
    if (time >= 1000) {
        return time.toFixed(2) + ' 秒'
    }

    return time.toFixed(0) + ' 毫秒'
}

/**
 * 格式化请求响应大小
 * @param {Number} size request.response.transferSize值
 * @returns text
 */
export function formatResponseSize(size) {
    // MB
    if (size >= 1000 * 1000) {
        return (size / 1000 * 1000).toFixed(2) + ' MB'
    }

    // KB
    if (size >= 1000) {
        return (size / 1000).toFixed(2) + ' KB'
    }

    // B
    return size + ' B'
}

/**
 * 格式化拦截处理信息
 * @param {Object} data 拦截处理结果对象
 * @returns text
 */
export function formatInterceptorInfo(data = {}) {
    const { match } = data
    // 是否匹配
    if (match) {
        return '已拦截：'
    }

    return '-'
}

/**
 * 打开资源面板
 * @param {String} url 资源URL
 * @param {Number} lineNumber 行号
 * @returns Promise
 */
export function openResource(url, lineNumber) {
    return new Promise((resolve, reject) => {
        chrome.devtools.panels.openResource(url, lineNumber, function (result) {
            if (result) {
                resolve(result);
            } else {
                reject(new Error('打开资源失败'));
            }
        });
    })
}

/**
 * 格式化响应源内容
 * @param {Object} data 拦截处理结果对象
 * @returns text
 */
export function sourceFormator(content, options = {}) {
    const { filePath = '', tabSize = 2, indentStyle = 'space' } = options

    return new Promise((resolve, reject) => {
        try {
            chrome.devtools.source.format({
                content,
                filePath,
                tabSize,
                indentStyle
            }, (formattedContent) => {
                resolve(formattedContent);
            });
        } catch (error) {
            reject(error)
        }
    })
}


export default {
    log,
    getNetworkHAR,
    createNetworkListener,
    createTabUpdatedListener,
    createwebNavigationListener,
    formatRequestJsFile,
    sendMessageToBackground,
    onBackgroundMessage,
    getFileNameFromUrl,
    filterInitiator,
    getInitiator,
    formatTimeConsuming,
    formatResponseSize,
    formatInterceptorInfo,
    openResource,
    sourceFormator,
}