// 录音相关变量
let mediaRecorder = null;
let audioChunks = [];
let recordingTimer = null;
let isRecording = false;

// 初始化录音系统
async function initializeRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await saveRecording(audioBlob);
            audioChunks = [];
        };

        // 添加录音按钮事件监听
        const recordBtn = document.getElementById('recordBtn');
        recordBtn.addEventListener('click', toggleRecording);

        return true;
    } catch (error) {
        showMessage('无法访问麦克风，请检查权限', 'error');
        console.error('录音初始化失败:', error);
        return false;
    }
}

// 切换录音状态
function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// 开始录音
function startRecording() {
    if (!mediaRecorder) {
        showMessage('录音系统未就绪', 'error');
        return;
    }

    mediaRecorder.start();
    isRecording = true;
    
    // 更新UI
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.classList.add('recording');
    recordBtn.querySelector('i').className = 'fas fa-stop';
    document.getElementById('recordingStatus').textContent = '正在录音...';
    
    // 开始计时
    let seconds = 0;
    recordingTimer = setInterval(() => {
        seconds++;
        document.getElementById('recordingTime').textContent = 
            `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }, 1000);
}

// 停止录音
function stopRecording() {
    if (!isRecording) return;

    mediaRecorder.stop();
    isRecording = false;
    
    // 更新UI
    const recordBtn = document.getElementById('recordBtn');
    recordBtn.classList.remove('recording');
    recordBtn.querySelector('i').className = 'fas fa-microphone';
    document.getElementById('recordingStatus').textContent = '录音已完成';
    
    // 停止计时
    clearInterval(recordingTimer);
    document.getElementById('recordingTime').textContent = '00:00';
}

// 保存录音
async function saveRecording(audioBlob) {
    showLoading();
    try {
        const fileName = `audio_${generateUID()}.wav`;
        const date = formatDate();
        const path = `recordings/${date}/${fileName}`;

        // 如果有网络，直接上传
        if (navigator.onLine) {
            // 上传到R2
            await uploadToR2(audioBlob, path);
            // 备份到GitHub
            await uploadToGitHub(audioBlob, path);
        } else {
            // 否则加入待上传队列
            addToPendingUploads({
                type: 'audio',
                data: audioBlob,
                path: path,
                timestamp: Date.now()
            });
        }

        // 保存录音记录
        saveRecordingInfo({
            id: generateUID(),
            fileName: fileName,
            date: date,
            path: path,
            duration: document.getElementById('recordingTime').textContent,
            timestamp: Date.now()
        });

        showMessage('录音保存成功', 'success');
    } catch (error) {
        console.error('保存录音失败:', error);
        showMessage('录音保存失败', 'error');
        
        // 保存到本地待上传队列
        addToPendingUploads({
            type: 'audio',
            data: audioBlob,
            path: `recordings/${formatDate()}/${generateUID()}.wav`,
            timestamp: Date.now()
        });
    } finally {
        hideLoading();
    }
}

// 保存录音信息到本地存储
function saveRecordingInfo(recordingInfo) {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    recordings.push(recordingInfo);
    localStorage.setItem('recordings', JSON.stringify(recordings));
}

// 播放录音预览
function playRecordingPreview(audioBlob) {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
}