// 上传到R2存储
async function uploadToR2(blob, path) {
    try {
        const formData = new FormData();
        formData.append('file', blob);
        
        const response = await axios.post(`${CONFIG.R2_ENDPOINT}/${path}`, formData, {
            headers: {
                'Authorization': `Bearer ${CONFIG.R2_ACCESS_KEY}`,
                'X-Secret-Key': CONFIG.R2_SECRET_KEY,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error('R2上传失败: ' + error.message);
    }
}

// 上传到GitHub
async function uploadToGitHub(blob, path) {
    try {
        const base64Data = await blobToBase64(blob);
        
        // 检查文件是否已存在
        const existingFile = await axios.get(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`
                }
            }
        ).catch(() => null);

        const requestData = {
            message: `添加文件: ${path}`,
            content: base64Data.split(',')[1],
            sha: existingFile?.data?.sha
        };

        await axios.put(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`,
            requestData,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        throw new Error('GitHub上传失败: ' + error.message);
    }
}

// 添加到待上传队列
function addToPendingUploads(item) {
    const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    pendingUploads.push(item);
    localStorage.setItem('pendingUploads', JSON.stringify(pendingUploads));
}

// 同步健康数据到GitHub
async function syncHealthDataToGitHub(healthData) {
    const content = btoa(JSON.stringify(healthData, null, 2));
    const path = 'health_records.json';

    try {
        // 检查文件是否存在
        const existingFile = await axios.get(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`
                }
            }
        ).catch(() => null);

        const requestData = {
            message: '更新健康记录',
            content: content,
            sha: existingFile?.data?.sha
        };

        await axios.put(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`,
            requestData,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        throw new Error('同步到GitHub失败: ' + error.message);
    }
}

// Blob转Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 从R2获取文件
async function getFromR2(path) {
    try {
        const response = await axios.get(`${CONFIG.R2_ENDPOINT}/${path}`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.R2_ACCESS_KEY}`,
                'X-Secret-Key': CONFIG.R2_SECRET_KEY
            },
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw new Error('从R2获取文件失败: ' + error.message);
    }
}

// 从GitHub获取文件
async function getFromGitHub(path) {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${path}`,
            {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`
                }
            }
        );
        
        const content = atob(response.data.content);
        return content;
    } catch (error) {
        throw new Error('从GitHub获取文件失败: ' + error.message);
    }
}

// 清理过期的本地缓存
function cleanupLocalStorage() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
    const now = Date.now();
    
    // 清理天气缓存
    const weatherData = localStorage.getItem('cachedWeather');
    if (weatherData) {
        const data = JSON.parse(weatherData);
        if (now - data.timestamp > maxAge) {
            localStorage.removeItem('cachedWeather');
        }
    }
    
    // 清理待上传队列中的过期项
    const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    const filteredUploads = pendingUploads.filter(item => now - item.timestamp <= maxAge);
    localStorage.setItem('pendingUploads', JSON.stringify(filteredUploads));
}