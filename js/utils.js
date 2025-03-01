// 工具函数：显示加载动画
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// 工具函数：隐藏加载动画
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 工具函数：显示消息提示
function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        borderRadius: '5px',
        backgroundColor: type === 'success' ? '#4CAF50' : 
                       type === 'error' ? '#f44336' : 
                       type === 'warning' ? '#ff9800' : '#2196F3',
        color: 'white',
        zIndex: '10000',
        animation: 'fadeIn 0.3s, fadeOut 0.3s 2.7s'
    });

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);
    
    // 3秒后移除
    setTimeout(() => {
        toast.remove();
        style.remove();
    }, 3000);
}

// 工具函数：格式化日期
function formatDate(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 工具函数：生成唯一ID
function generateUID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 工具函数：检查网络状态
function checkNetwork() {
    return navigator.onLine;
}

// 工具函数：设置主题
function setTheme(themeName) {
    const themes = {
        light: {
            '--bg-color': '#f5f5f5',
            '--card-bg': '#ffffff',
            '--text-primary': '#333333',
            '--text-secondary': '#666666',
            '--primary-color': '#4CAF50',
            '--secondary-color': '#45a049',
            '--border-color': '#dddddd'
        },
        dark: {
            '--bg-color': '#333333',
            '--card-bg': '#424242',
            '--text-primary': '#ffffff',
            '--text-secondary': '#bbbbbb',
            '--primary-color': '#66bb6a',
            '--secondary-color': '#4caf50',
            '--border-color': '#555555'
        },
        warm: {
            '--bg-color': '#fff5e6',
            '--card-bg': '#ffffff',
            '--text-primary': '#663300',
            '--text-secondary': '#996633',
            '--primary-color': '#ff9933',
            '--secondary-color': '#ff8000',
            '--border-color': '#ffcc99'
        }
    };

    const theme = themes[themeName] || themes.light;
    for (const [property, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(property, value);
    }
}

// 工具函数：设置字体大小
function setFontSize(size) {
    const sizes = {
        small: '14px',
        medium: '16px',
        large: '18px',
        'extra-large': '20px'
    };

    document.documentElement.style.fontSize = sizes[size] || sizes.medium;
}

// 工具函数：设置高对比度模式
function setHighContrast(enabled) {
    if (enabled) {
        document.documentElement.classList.add('high-contrast');
    } else {
        document.documentElement.classList.remove('high-contrast');
    }
}

// 工具函数：加载设置
function loadSavedSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    
    // 应用主题
    setTheme(settings.theme || 'light');
    
    // 应用字体大小
    setFontSize(settings.fontSize || 'medium');
    
    // 应用高对比度设置
    setHighContrast(settings.highContrast || false);
    
    // 更新设置表单
    document.getElementById('theme').value = settings.theme || 'light';
    document.getElementById('fontSize').value = settings.fontSize || 'medium';
    document.getElementById('highContrast').checked = settings.highContrast || false;
}

// 工具函数：保存设置
function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
}