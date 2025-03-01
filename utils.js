// utils.js (工具函数)

// 显示消息提示
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 显示加载动画
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// 隐藏加载动画
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 格式化日期 (YYYY/MM/DD)
// 现在 formatDate 函数接受一个可选的 timestamp 参数, 如果不传, 则使用当前时间
function formatDate(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Blob 转 Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 检查网络状态
function checkNetwork() {
    return navigator.onLine;
}

// 添加事件监听的通用函数
function on(element, event, handler) {
    if (element && event && handler) {
        element.addEventListener(event, handler, false);
    }
}

// 移除事件监听的通用函数
function off(element, event, handler) {
    if (element && event) {
        element.removeEventListener(event, handler, false);
    }
}

//尝试解析JSON字符串，如果失败返回null
function tryParseJSONObject(jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return null;
};

// 新增：获取校准后的时间戳
async function getCalibratedTimestamp() {
    // 尝试从localStorage中读取校准后的时间
    const localTimestamp = localStorage.getItem('calibratedTimestamp');
    if (localTimestamp) {
        return parseInt(localTimestamp, 10);
    }

     return Date.now(); // 如果无法获取校准时间，则返回设备当前时间(注意：这里不应该再调用/api/time, 否则会循环)
}

export { showMessage, showLoading, hideLoading, formatDate, blobToBase64, checkNetwork, on, off, tryParseJSONObject, getCalibratedTimestamp };