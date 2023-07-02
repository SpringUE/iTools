// Chrome background中不能使用console.log
export function log(...args) {
    return chrome.devtools.inspectedWindow.eval(`
        console.log(...${JSON.stringify(args)});
    `);
}

// Chrome background中不能使用console.error
export function logError(...args) {
    return chrome.devtools.inspectedWindow.eval(`
        console.error(...${JSON.stringify(args)});
    `);
}


log("background start");

// 发送消息
function sendMessage(message) {
    chrome.runtime.sendMessage({ message });
}

sendMessage("Message from background")

// 接受消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    log("Message from DevTools:", message);

    if(typeof message === 'object' && message.code === 'webResponseHanlder') {
        log("拦截请求:", message);
        webResponseHanlder(message)
    }
});

function webResponseHanlder(message = {}) {
    const { responseHanlder, urls:_urls, successCallback, errorCallback } = message?.data || {}
    // 添加拦截规则
    /*
    callback: 必需的参数，指定一个回调函数，用于处理响应完成事件。这个函数在请求的响应完成后被调用，接收一个details对象参数，包含有关请求和响应的信息。你需要在这个回调函数中编写逻辑来处理和修改响应。
    filter: 必需的参数，指定一个过滤器对象，用于定义要拦截的请求规则。这个过滤器对象包含以下可选属性：
        urls: 数组，用于指定要拦截的URL模式。可以使用通配符（*）进行模式匹配。示例：["https://example.com/*"]。
        types: 数组，用于指定要拦截的请求类型。可以是"main_frame"、"sub_frame"、"stylesheet"、"script"、"image"、"font"、"object"、"xmlhttprequest"、"ping"、"csp_report"、"media"、"websocket"、"other"，或者空数组（[]）表示匹配任何类型的请求。
    extraInfoSpec（可选）: 一个字符串数组，用于指定要接收的附加信息的类型。可能的值包括"responseHeaders"、"blocking"、"extraHeaders"等。这些信息将传递给回调函数的details参数中，以供进一步处理。
    注意：由于Chrome限制了一些敏感的URL和协议（如https://chrome.google.com/*），在onCompleted事件中无法直接修改和阻止这些请求的响应，请确保你的拦截规则和代码逻辑是正确的。
    */

    let urls = [].concat(_urls) || ["<all_urls>"]
    chrome.webRequest.onBeforeRequest.addListener(
        function(details) {
            log("chrome.webRequest.onBeforeRequest --> details:", details);
            return new Promise((resolve, reject) => {
                chrome.webRequest.getContent(details.requestId, function(resData) {
                    if(responseHanlder) {
                        // 异步处理逻辑
                        responseHanlder(resData).then(modifiedRes => {
                            // 创建修改后的响应对象
                            var newResponse = {
                                redirectUrl: "data:text/plain;charset=utf-8," + encodeURIComponent(modifiedRes)
                            };
                            successCallback && successCallback(details)
                            sendMessage({code: 'webResponseHanldeCompleted', data: details})
                            resolve(newResponse);
                        })
                        .catch(error => {
                            logError("异步处理出错:", error);
                            errorCallback && errorCallback(error)
                            sendMessage({code: 'webResponseHanldeError', data: error})
                            reject(error);
                        });
                    } else {
                        successCallback && successCallback(details)
                        sendMessage({code: 'webResponseHanldeCompleted', data: details})
                        resolve(resData);
                    }
                });
            });
        },
        { urls },
        ["blocking"]
    );
}