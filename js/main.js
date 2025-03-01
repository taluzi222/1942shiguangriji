// 全局配置
const CONFIG = {
    // R2配置
    R2_ENDPOINT: 'https://bc6cb265019d4f3ba35544e1868c813b.r2.cloudflarestorage.com/time-diary',
    R2_ACCESS_KEY: 'dac07d91a6232d85a49f4661c1308b4a',
    R2_SECRET_KEY: '0acd624608419cdc3d6c6c181f3d53a8981e42f1a7b8163ecc4d28a44c47e924',
    R2_BUCKET: 'time-diary',
    
    // GitHub配置
    GITHUB_TOKEN: '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',
    GITHUB_REPO: 'time',
    GITHUB_OWNER: 'taluzi222',
    
    // 和风天气API配置
    WEATHER_KEY: 'a42cb4bd0b47498ebb4f0611108b9d19',
    LOCATION: '111.68,36.25'
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 应用初始化
async function initializeApp() {
    showLoading();
    try {
        // 初始化各个模块
        await Promise.all([
            initializeRecording(),
            initializePhotoUpload(),
            initializeWeather(),
            initializeHealth(),
            initializeSettings()
        ]);

        // 加载保存的设置
        loadSavedSettings();

        // 初始化事件监听
        setupEventListeners();

        // 检查并恢复未完成的上传
        checkPendingUploads();

        showMessage('系统初始化成功', 'success');
    } catch (error) {
        console.error('初始化失败:', error);
        showMessage('系统初始化失败，请刷新页面重试', 'error');
    } finally {
        hideLoading();
    }
}

// 设置事件监听
function setupEventListeners() {
    // 网络状态监听
    window.addEventListener('online', () => {
        showMessage('网络已连接', 'success');
        checkPendingUploads();
    });

    window.addEventListener('offline', () => {
        showMessage('网络已断开，数据将在恢复连接后同步', 'warning');
    });

    // 页面可见性变化监听
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateWeather();
            loadTodayHealth();
        }
    });

    // 页面卸载前保存
    window.addEventListener('beforeunload', (event) => {
        savePendingData();
    });

    // 错误处理
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('全局错误:', error);
        showMessage('操作出错，请重试', 'error');
    };

    // 导出按钮事件
    document.getElementById('exportBtn').addEventListener('click', () => {
        document.querySelector('.export-controls').style.display = 'flex';
    });

    document.getElementById('confirmExportBtn').addEventListener('click', exportData);
}

// 检查待上传数据
async function checkPendingUploads() {
    if (!navigator.onLine) return;

    const pendingUploads = JSON.parse(localStorage.getItem('pendingUploads') || '[]');
    if (pendingUploads.length === 0) return;

    showMessage('正在同步未上传的数据...', 'info');
    
    for (const item of pendingUploads) {
        try {
            if (item.type === 'audio') {
                await uploadToR2(item.data, item.path);
            } else if (item.type === 'photo') {
                await uploadToR2(item.data, item.path);
            }
            // 从待上传列表中移除
            pendingUploads.splice(pendingUploads.indexOf(item), 1);
        } catch (error) {
            console.error('同步失败:', error);
        }
    }

    localStorage.setItem('pendingUploads', JSON.stringify(pendingUploads));
    showMessage('数据同步完成', 'success');
}

// 保存待处理数据
function savePendingData() {
    // 保存录音数据
    if (isRecording) {
        stopRecording();
    }

    // 保存健康记录
    saveHealthRecord();

    // 保存其他未完成的更改
    const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
    if (pendingChanges.length > 0) {
        localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
    }
}

// 导出数据
async function exportData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showMessage('请选择导出时间范围', 'warning');
        return;
    }

    showLoading();
    try {
        // 获取指定时间范围的数据
        const data = await fetchDataByDateRange(startDate, endDate);
        
        // 创建导出文件
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `diary_export_${startDate}_to_${endDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('数据导出成功', 'success');
    } catch (error) {
        console.error('导出失败:', error);
        showMessage('数据导出失败', 'error');
    } finally {
        hideLoading();
    }
}

// 获取指定时间范围的数据
async function fetchDataByDateRange(startDate, endDate) {
    const data = {
        health: {},
        recordings: [],
        photos: []
    };

    // 获取健康记录
    const healthRecords = JSON.parse(localStorage.getItem('healthRecords') || '{}');
    Object.keys(healthRecords).forEach(date => {
        if (date >= startDate && date <= endDate) {
            data.health[date] = healthRecords[date];
        }
    });

    // 获取录音记录
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    data.recordings = recordings.filter(record => 
        record.date >= startDate && record.date <= endDate
    );

    // 获取照片记录
    const photos = JSON.parse(localStorage.getItem('photos') || '[]');
    data.photos = photos.filter(photo => 
        photo.date >= startDate && photo.date <= endDate
    );

    return data;
}