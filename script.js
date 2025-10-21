document.addEventListener('DOMContentLoaded', () => {
    // 定数と要素の取得（変更なし）
    const CODE_PHAIZ = "555"; 
    const statusText = document.getElementById('status-text');
    const codeInput = document.getElementById('code-input');
    const keypad = document.getElementById('keypad');
    const enterBtn = document.getElementById('enter-btn');
    const clearBtn = document.getElementById('clear-btn');
    const driverContainer = document.getElementById('driver-container');

    // Audio要素の取得（変更なし）
    const audio5a = document.getElementById('audio-5a'); 
    const audio5b = document.getElementById('audio-5b'); 
    const audio5c = document.getElementById('audio-5c'); 
    const audioStandby = document.getElementById('audio-standby');
    const audioCharge = document.getElementById('audio-charge'); 
    const audioComplete = document.getElementById('audio-complete');
    const audioError = document.getElementById('audio-error');
    const audioKeyPress = document.getElementById('audio-key-press');

    let currentCode = ""; 
    let displayCode = "";
    let currentState = 'READY'; 
    let sensorActive = false; // ★センサー有効フラグを追加★

    // --- 状態管理関数（変更なし） ---
    function resetState() {
        currentState = 'READY';
        currentCode = "";
        displayCode = "";
        statusText.textContent = sensorActive ? "READY" : "TAP TO ACTIVATE SENSOR";
        codeInput.textContent = "";
        driverContainer.classList.remove('status-standby', 'status-complete');
        stopAudio(audioCharge); 
        stopAudio(audioStandby);
        enterBtn.onmousedown = enterPress; 
        enterBtn.ontouchstart = enterPress;
        window.removeEventListener('deviceorientation', handleOrientation);
    }

    // --- 音声再生ヘルパー関数（変更なし） ---
    function playAudio(audioElement, loop = false) {
        if (!loop && (audioElement.id.startsWith('audio-5') || audioElement.id === 'audio-key-press')) {
            const tempAudio = new Audio(audioElement.src);
            tempAudio.play().catch(e => console.error("Audio playback failed:", e));
            return;
        }
        audioElement.loop = loop;
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.error("Audio playback failed:", e));
    }

    function stopAudio(audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }

    // --- センサー有効化関数（★新規追加★） ---
    function activateSensor() {
        if (sensorActive) return;

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13以降
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        statusText.textContent = "READY";
                        sensorActive = true;
                    } else {
                        statusText.textContent = "SENSOR BLOCKED";
                    }
                })
                .catch(console.error);
        } else {
            // Androidや古いiOS
            statusText.textContent = "READY";
            sensorActive = true;
        }
        // センサー有効化ボタンはREADY状態のENTERに置き換わったため、ここでは何もしない
    }

    // --- ギミック処理関数 ---

    // テンキー入力 (変更なし)
    keypad.addEventListener('click', (e) => {
        if (currentState !== 'READY') return;

        const key = e.target.closest('.key');
        if (!key || key.id === 'enter-btn' || key.id === 'clear-btn') return;

        const num = key.getAttribute('data-num');
        
        if (currentCode.length < 3) { 
            
            if (num === '5') {
                if (currentCode.length === 0) {
                    playAudio(audio5a, false);
                } else if (currentCode.length === 1) {
                    playAudio(audio5b, false);
                } else if (currentCode.length === 2) {
                    playAudio(audio5c, false);
                }
                
                currentCode += num; 
                displayCode += num; 
                codeInput.textContent = displayCode;

            } else {
                playAudio(audioKeyPress, false); 
                statusText.textContent = "ERROR";
                playAudio(audioError);
                currentCode = "";
                displayCode = "";
                codeInput.textContent = "";
                setTimeout(() => {
                    statusText.textContent = "READY";
                }, 1000);
            }
        }
    });

    // クリアボタン (変更なし)
    clearBtn.addEventListener('click', () => {
        if (currentState === 'READY' || currentState === 'STANDBY') {
            resetState();
        }
    });

    // ENTERキー処理 (★センサー有効化とSTANDBYロジックを変更★)
    function enterPress() {
        if (currentState === 'READY') {
            // 1. センサーが未有効の場合、ENTERがセンサー許可のトリガーになる
            if (!sensorActive) {
                 activateSensor();
                 return; // センサー許可画面が出たらここで終了
            }

            // 2. センサー有効後、コードチェック
            if (currentCode === CODE_PHAIZ) {
                // STANDING BYへ移行
                statusText.textContent = "STANDING BY";
                driverContainer.classList.add('status-standby');
                
                // 1. STANDING BYの音を再生
                playAudio(audioStandby, false);
                
                // 2. ★音声再生終了イベントでCHARGEを再生★
                audioStandby.onended = () => {
                    playAudio(audioCharge, true);
                    audioStandby.onended = null; // イベントを解除
                };

                currentState = 'STANDBY';
                
                enterBtn.onmousedown = enterBtn.ontouchstart = null;
                window.addEventListener('deviceorientation', handleOrientation);

            } else if (currentCode.length > 0) {
                // ERROR処理
                statusText.textContent = "ERROR";
                playAudio(audioError);
                currentCode = "";
                displayCode = "";
                codeInput.textContent = "";
                setTimeout(() => {
                    statusText.textContent = "READY";
                }, 1000);
            }
        }
    }

    // 回転検出の処理 (★判定ロジックをより厳密に変更★)
    function handleOrientation(event) {
        if (currentState !== 'STANDBY') return;
        
        // gamma: 左右の傾き (-90から90度)
        const gamma = event.gamma; 

        // 90度回転（ベルトに差し込む動作）を検出
        // Math.abs(gamma) > 80 で判定。
        // ※ただし、iPhoneで横持ちしている場合、gammaが小さくなる。
        //   ここでは、スマホが縦向きに近ければgamma、横向きに近ければbeta/alphaを考慮すべきだが、
        //   単純にスマホをベルトに差し込む「傾き」を検出するためにgammaを使用。
        if (Math.abs(gamma) > 80) { 
            completeHenshin();
        }
    }

    // 変身完了処理 (変更なし)
    function completeHenshin() {
        if (currentState !== 'STANDBY') return;
        window.removeEventListener('deviceorientation', handleOrientation);
        stopAudio(audioCharge); 
        playAudio(audioComplete);
        statusText.textContent = "COMPLETE";
        driverContainer.classList.remove('status-standby');
        driverContainer.classList.add('status-complete');
        currentState = 'COMPLETE';
        enterBtn.onmousedown = enterBtn.ontouchstart = null;
    }


    // 初期イベントリスナー設定 (変更なし)
    enterBtn.onmousedown = enterPress;
    enterBtn.ontouchstart = enterPress;
    enterBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 初期化時、センサー許可が必要な場合はメッセージを表示
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        statusText.textContent = "TAP TO ACTIVATE SENSOR";
    }
    resetState();
});

