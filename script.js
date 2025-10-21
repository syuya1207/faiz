document.addEventListener('DOMContentLoaded', () => {
    const CODE_PHAIZ = "555";
    const statusText = document.getElementById('status-text');
    const codeInput = document.getElementById('code-input');
    const keypad = document.getElementById('keypad');
    const enterBtn = document.getElementById('enter-btn');
    const clearBtn = document.getElementById('clear-btn');
    const driverContainer = document.getElementById('driver-container');

    // Audio要素の取得
    const audioStandby = document.getElementById('audio-standby');
    const audioComplete = document.getElementById('audio-complete');
    const audioError = document.getElementById('audio-error');
    const audioCharge = document.getElementById('audio-charge');
    const audioKeyPress = document.getElementById('audio-key-press');

    let currentCode = "";
    let currentState = 'READY'; // READY, STANDBY, COMPLETE

    // --- 状態管理関数 ---

    function resetState() {
        currentState = 'READY';
        currentCode = "";
        statusText.textContent = "READY";
        codeInput.textContent = "";
        driverContainer.classList.remove('status-standby', 'status-complete');
        stopAudio(audioStandby);
        enterBtn.onmousedown = enterPress; 
        enterBtn.ontouchstart = enterPress;
        // READYに戻るときは、DeviceOrientation Eventを停止
        window.removeEventListener('deviceorientation', handleOrientation);
    }

    // --- 音声再生ヘルパー関数 ---

    function playAudio(audioElement, loop = false) {
        // キー入力音など、短い音は毎回新しいAudioオブジェクトで再生
        if (!loop && audioElement.id === 'audio-key-press') {
            const tempAudio = new Audio(audioElement.src);
            tempAudio.play().catch(e => console.error("Audio playback failed:", e));
            return;
        }

        if (loop) {
            stopAudio(audioStandby);
        }
        audioElement.loop = loop;
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.error("Audio playback failed:", e));
    }

    function stopAudio(audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
    }

    // --- ギミック処理関数 ---

    // テンキー入力
    keypad.addEventListener('click', (e) => {
        if (currentState !== 'READY') return;

        const key = e.target.closest('.key');
        if (!key || key.id === 'enter-btn' || key.id === 'clear-btn') return;

        const num = key.getAttribute('data-num');
        if (num !== null && currentCode.length < 4) {
            playAudio(audioKeyPress, false); 
            
            currentCode += num;
            codeInput.textContent = currentCode;
        }
    });

    // クリアボタン
    clearBtn.addEventListener('click', () => {
        if (currentState !== 'READY') return;
        currentCode = "";
        codeInput.textContent = "";
        statusText.textContent = "READY";
    });

    // ENTERキー処理 (変身/チャージをトリガー)
    function enterPress() {
        if (currentState === 'READY') {
            if (currentCode === CODE_PHAIZ) {
                // STANDING BYへ移行
                statusText.textContent = "STANDING BY";
                driverContainer.classList.add('status-standby');
                playAudio(audioStandby, true);

                currentState = 'STANDBY';
                
                // 変身完了トリガーを、スマホの回転に切り替え
                enterBtn.onmousedown = enterBtn.ontouchstart = null; // ボタンでの変身を無効化
                
                // ★DeviceOrientation Eventの登録★
                // ここでブラウザがセンサーアクセス許可を求める可能性がある
                window.addEventListener('deviceorientation', handleOrientation);

            } else if (currentCode.length > 0) {
                // ERROR処理
                statusText.textContent = "ERROR";
                playAudio(audioError);
                currentCode = "";
                codeInput.textContent = "";
                setTimeout(() => {
                    statusText.textContent = "READY";
                }, 1000);
            }
        }
        else if (currentState === 'COMPLETE') {
            exceedCharge();
        }
    }

    // ★回転検出（Device Orientation）の処理★
    function handleOrientation(event) {
        if (currentState !== 'STANDBY') return;
        
        // gamma: 左右の傾き (-90から90度)
        const gamma = event.gamma; 

        // 90度回転（ベルトに差し込む動作）を検出する
        // 80度を閾値とする (90度に近ければOK)
        if (Math.abs(gamma) > 80) { 
            completeHenshin();
        }
    }

    // 変身完了処理
    function completeHenshin() {
        if (currentState !== 'STANDBY') return;
        
        // ★DeviceOrientation Eventを解除して、誤動作を防ぐ★
        window.removeEventListener('deviceorientation', handleOrientation);

        stopAudio(audioStandby);
        playAudio(audioComplete);

        statusText.textContent = "COMPLETE";
        driverContainer.classList.remove('status-standby');
        driverContainer.classList.add('status-complete');
        currentState = 'COMPLETE';

        // ENTERボタンの役割を 'エクシードチャージ' に変更
        enterBtn.onmousedown = exceedCharge;
        enterBtn.ontouchstart = exceedCharge;
    }


    // エクシードチャージ処理 (変更なし)
    function exceedCharge() {
        if (currentState !== 'COMPLETE') return;

        playAudio(audioCharge);

        statusText.textContent = "EXCEED CHARGE";
        driverContainer.style.animation = 'complete-glow 0.3s 3 alternate';
        
        setTimeout(() => {
            statusText.textContent = "COMPLETE";
            driverContainer.style.animation = 'none';
        }, 1500);
    }

    // 初期イベントリスナー設定
    enterBtn.onmousedown = enterPress;
    enterBtn.ontouchstart = enterPress;

    enterBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // アプリ初期化
    resetState();
});
