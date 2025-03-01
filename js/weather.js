// 天气相关变量
let weatherData = null;
let weatherLastUpdate = null;

// 初始化天气系统
function initializeWeather() {
    const weatherBtn = document.getElementById('weatherBtn');
    const closeWeatherBtn = document.querySelector('.modal .close-btn');
    const weatherModal = document.getElementById('weatherModal');
    const weatherVoiceBtn = document.getElementById('weatherVoiceBtn');
    const refreshWeatherBtn = document.getElementById('refreshWeatherBtn');

    // 点击查看天气
    weatherBtn.addEventListener('click', async () => {
        weatherModal.style.display = 'block';
        await updateWeather();
    });

    // 关闭天气窗口
    closeWeatherBtn.addEventListener('click', () => {
        weatherModal.style.display = 'none';
    });

    // 点击空白处关闭
    weatherModal.addEventListener('click', (e) => {
        if (e.target === weatherModal) {
            weatherModal.style.display = 'none';
        }
    });

    // 语音播报
    weatherVoiceBtn.addEventListener('click', () => {
        if (weatherData) {
            speakWeather(weatherData);
        }
    });

    // 刷新天气
    refreshWeatherBtn.addEventListener('click', updateWeather);

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && weatherModal.style.display === 'block') {
            weatherModal.style.display = 'none';
        }
    });
}

// 更新天气信息
async function updateWeather() {
    showLoading();
    try {
        // 检查是否需要更新（5分钟更新一次）
        const now = Date.now();
        if (weatherLastUpdate && (now - weatherLastUpdate < 300000)) {
            hideLoading();
            return;
        }

        // 获取实时天气
        const response = await axios.get(`https://devapi.qweather.com/v7/weather/now`, {
            params: {
                key: CONFIG.WEATHER_KEY,
                location: CONFIG.LOCATION
            }
        });

        // 获取天气预报
        const forecastResponse = await axios.get(`https://devapi.qweather.com/v7/weather/3d`, {
            params: {
                key: CONFIG.WEATHER_KEY,
                location: CONFIG.LOCATION
            }
        });

        // 获取生活指数
        const lifeResponse = await axios.get(`https://devapi.qweather.com/v7/indices/1d`, {
            params: {
                key: CONFIG.WEATHER_KEY,
                location: CONFIG.LOCATION,
                type: '1,2,3,8'  // 运动,洗车,穿衣,舒适度
            }
        });

        weatherData = {
            now: response.data.now,
            forecast: forecastResponse.data.daily,
            lifeIndices: lifeResponse.data.daily
        };

        weatherLastUpdate = now;
        displayWeather(weatherData);
        showMessage('天气信息已更新', 'success');
    } catch (error) {
        console.error('获取天气失败:', error);
        showMessage('获取天气失败', 'error');
        
        // 使用缓存的天气数据
        const cachedWeather = localStorage.getItem('cachedWeather');
        if (cachedWeather) {
            weatherData = JSON.parse(cachedWeather);
            displayWeather(weatherData);
            showMessage('显示缓存的天气信息', 'warning');
        }
    } finally {
        hideLoading();
    }
}

// 显示天气信息
function displayWeather(data) {
    const weatherInfo = document.getElementById('weatherInfo');
    const now = data.now;
    const forecast = data.forecast;
    const indices = data.lifeIndices;

    let html = `
        <div class="current-weather">
            <h3>当前天气</h3>
            <div class="weather-main">
                <div class="weather-temp">${now.temp}°C</div>
                <div class="weather-desc">${now.text}</div>
            </div>
            <div class="weather-details">
                <p>体感温度: ${now.feelsLike}°C</p>
                <p>风向: ${now.windDir} ${now.windScale}级</p>
                <p>湿度: ${now.humidity}%</p>
                <p>能见度: ${now.vis}公里</p>
            </div>
        </div>
        <div class="weather-forecast">
            <h3>未来三天预报</h3>
            <div class="forecast-container">
    `;

    forecast.forEach(day => {
        html += `
            <div class="forecast-day">
                <h4>${formatDate(new Date(day.fxDate))}</h4>
                <div class="day-weather">
                    <span>白天: ${day.textDay}</span>
                    <span>${day.tempMax}°C</span>
                </div>
                <div class="night-weather">
                    <span>夜间: ${day.textNight}</span>
                    <span>${day.tempMin}°C</span>
                </div>
                <div class="day-details">
                    <p>风向: ${day.windDirDay}</p>
                    <p>风力: ${day.windScaleDay}级</p>
                    <p>日出: ${day.sunrise}</p>
                    <p>日落: ${day.sunset}</p>
                </div>
            </div>
        `;
    });

    html += `</div>`;

    if (indices) {
        html += `
            <div class="life-indices">
                <h3>生活指数</h3>
                <div class="indices-container">
        `;

        indices.forEach(index => {
            html += `
                <div class="index-item">
                    <h4>${index.name}</h4>
                    <p class="index-level">${index.category}</p>
                    <p class="index-desc">${index.text}</p>
                </div>
            `;
        });

        html += `</div></div>`;
    }

    weatherInfo.innerHTML = html;

    // 缓存天气数据
    localStorage.setItem('cachedWeather', JSON.stringify(data));
}

// 语音播报天气
function speakWeather(data) {
    const now = data.now;
    const today = data.forecast[0];
    
    const text = `
        当前温度${now.temp}度，${now.text}。
        风向${now.windDir}，风力${now.windScale}级。
        今天最高温度${today.tempMax}度，最低温度${today.tempMin}度。
        白天${today.textDay}，夜间${today.textNight}。
    `;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();
    
    // 播放新的语音
    window.speechSynthesis.speak(utterance);
}