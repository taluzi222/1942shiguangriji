// 健康记录相关变量
let lastSaveTimeout = null;

// 初始化健康记录系统
function initializeHealth() {
    const bloodPressureHigh = document.getElementById('bloodPressureHigh');
    const bloodPressureLow = document.getElementById('bloodPressureLow');
    const sleepQuality = document.getElementById('sleepQuality');
    const mood = document.getElementById('mood');

    // 加载今日记录
    loadTodayHealth();

    // 添加输入事件监听
    [bloodPressureHigh, bloodPressureLow, sleepQuality, mood].forEach(element => {
        element.addEventListener('change', () => {
            // 防抖：延迟2秒保存，避免频繁保存
            if (lastSaveTimeout) {
                clearTimeout(lastSaveTimeout);
            }
            lastSaveTimeout = setTimeout(saveHealthRecord, 2000);
        });
    });

    // 添加输入验证
    bloodPressureHigh.addEventListener('input', validateBloodPressure);
    bloodPressureLow.addEventListener('input', validateBloodPressure);
}

// 加载今日健康记录
function loadTodayHealth() {
    const today = formatDate();
    const healthData = JSON.parse(localStorage.getItem('healthRecords') || '{}');
    const todayRecord = healthData[today] || {};

    // 填充表单
    document.getElementById('bloodPressureHigh').value = todayRecord.bloodPressureHigh || '';
    document.getElementById('bloodPressureLow').value = todayRecord.bloodPressureLow || '';
    document.getElementById('sleepQuality').value = todayRecord.sleepQuality || '';
    document.getElementById('mood').value = todayRecord.mood || '';
}

// 保存健康记录
async function saveHealthRecord() {
    const today = formatDate();
    const healthData = JSON.parse(localStorage.getItem('healthRecords') || '{}');

    // 获取当前值
    const record = {
        bloodPressureHigh: document.getElementById('bloodPressureHigh').value,
        bloodPressureLow: document.getElementById('bloodPressureLow').value,
        sleepQuality: document.getElementById('sleepQuality').value,
        mood: document.getElementById('mood').value,
        timestamp: Date.now()
    };

    // 验证数据
    if (!validateHealthData(record)) {
        return;
    }

    // 添加健康建议
    record.advice = generateHealthAdvice(record);

    // 保存到本地存储
    healthData[today] = record;
    localStorage.setItem('healthRecords', JSON.stringify(healthData));

    // 同步到GitHub
    try {
        await syncHealthDataToGitHub(healthData);
        showMessage('健康记录已保存', 'success');
    } catch (error) {
        console.error('同步健康记录失败:', error);
        showMessage('健康记录已本地保存，但同步失败', 'warning');
    }

    // 显示健康建议
    showHealthAdvice(record.advice);
}

// 验证血压输入
function validateBloodPressure(event) {
    const input = event.target;
    const value = input.value;

    // 只允许输入数字
    if (!/^\d*$/.test(value)) {
        input.value = value.replace(/\D/g, '');
    }

    // 限制数值范围
    if (value !== '') {
        const num = parseInt(value);
        if (input.id === 'bloodPressureHigh') {
            if (num < 60) input.value = '60';
            if (num > 200) input.value = '200';
        } else {
            if (num < 40) input.value = '40';
            if (num > 120) input.value = '120';
        }
    }
}

// 验证健康数据
function validateHealthData(data) {
    if (data.bloodPressureHigh && data.bloodPressureLow) {
        const high = parseInt(data.bloodPressureHigh);
        const low = parseInt(data.bloodPressureLow);

        if (high <= low) {
            showMessage('收缩压应该大于舒张压', 'warning');
            return false;
        }
    }

    return true;
}

// 生成健康建议
function generateHealthAdvice(record) {
    let advice = [];

    // 血压建议
    if (record.bloodPressureHigh && record.bloodPressureLow) {
        const high = parseInt(record.bloodPressureHigh);
        const low = parseInt(record.bloodPressureLow);
        
        if (high >= 140 || low >= 90) {
            advice.push({
                type: 'warning',
                title: '血压偏高',
                content: [
                    '限制盐分摄入',
                    '保持心情舒畅',
                    '适量运动',
                    '规律作息',
                    '建议咨询医生'
                ]
            });
        } else if (high <= 90 || low <= 60) {
            advice.push({
                type: 'warning',
                title: '血压偏低',
                content: [
                    '适当补充盐分',
                    '多食用含铁食物',
                    '避免剧烈运动',
                    '注意保暖',
                    '如感觉不适请及时就医'
                ]
            });
        } else {
            advice.push({
                type: 'success',
                title: '血压正常',
                content: ['继续保持良好的生活习惯！']
            });
        }
    }

    // 睡眠建议
    const sleepAdvice = {
        'very-good': {
            type: 'success',
            title: '睡眠质量很好',
            content: ['继续保持当前的作息时间！']
        },
        'good': {
            type: 'success',
            title: '睡眠质量不错',
            content: ['保持当前作息时间']
        },
        'normal': {
            type: 'info',
            title: '睡眠质量一般',
            content: [
                '睡前1小时不要看手机',
                '保持房间安静黑暗',
                '适当运动有助于睡眠'
            ]
        },
        'bad': {
            type: 'warning',
            title: '睡眠质量较差',
            content: [
                '固定作息时间',
                '睡前避免咖啡因',
                '睡前可以喝杯温牛奶',
                '做些放松运动'
            ]
        },
        'very-bad': {
            type: 'error',
            title: '睡眠质量很差',
            content: [
                '建议看医生咨询',
                '检查睡眠环境',
                '避免午后饮茶',
                '晚上不要过度劳累'
            ]
        }
    };

    if (record.sleepQuality) {
        advice.push(sleepAdvice[record.sleepQuality]);
    }

    // 心情建议
    const moodAdvice = {
        'very-happy': {
            type: 'success',
            title: '心情非常好',
            content: ['祝您保持好心情！']
        },
        'happy': {
            type: 'success',
            title: '心情不错',
            content: ['继续保持积极乐观的态度！']
        },
        'normal': {
            type: 'info',
            title: '心情平静',
            content: ['这是很好的状态']
        },
        'sad': {
            type: 'warning',
            title: '心情不太好',
            content: [
                '听听喜欢的音乐',
                '和家人聊聊天',
                '出去散散步',
                '做些自己喜欢的事'
            ]
        },
        'very-sad': {
            type: 'error',
            title: '心情很差',
            content: [
                '找人倾诉',
                '做些放松的活动',
                '适当运动',
                '保持规律作息',
                '如果持续心情低落，建议咨询医生'
            ]
        }
    };

    if (record.mood) {
        advice.push(moodAdvice[record.mood]);
    }

    return advice;
}

// 显示健康建议
function showHealthAdvice(advice) {
    if (!advice || advice.length === 0) return;

    const modal = document.createElement('div');
    modal.className = 'health-advice-modal';
    
    let html = `
        <div class="health-advice-content">
            <h3>今日健康建议</h3>
            <div class="advice-list">
    `;

    advice.forEach(item => {
        html += `
            <div class="advice-item ${item.type}">
                <h4>${item.title}</h4>
                <ul>
                    ${item.content.map(text => `<li>${text}</li>`).join('')}
                </ul>
            </div>
        `;
    });

    html += `
            </div>
            <button class="btn" onclick="this.parentElement.parentElement.remove()">知道了</button>
        </div>
    `;

    modal.innerHTML = html;
    document.body.appendChild(modal);
}