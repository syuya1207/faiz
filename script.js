document.addEventListener('DOMContentLoaded', () => {
    // 正しい変身コードは '5a5b5c' に変更
    const CODE_PHAIZ = "5a5b5c"; 
    const statusText = document.getElementById('status-text');
    const codeInput = document.getElementById('code-input');
    const keypad = document.getElementById('keypad');
    const enterBtn = document.getElementById('enter-btn');
    const clearBtn = document.getElementById('clear-btn');
    const driverContainer = document.getElementById('driver-container');

    // Audio要素の取得
    const audio5a = document.getElementById('audio-5a'); // 新規追加
    const audio5b = document.getElementById('audio-5b'); // 新規追加
    const audio5c = document.getElementById('audio-5c'); // 新規追加
    const audioStandby = document.getElementById('audio-standby');
    const audioCharge = document.getElementById('audio-charge'); // 待機音として使用
    const audioComplete = document.getElementById('audio-complete');
    const audioError = document.getElementById('audio-error');
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
        // 待機音(charge)とstandby音を停止
        stopAudio(audioCharge); 
        stopAudio(audioStandby);
        enterBtn.onmousedown = enterPress; 
        enterBtn.ontouchstart = enterPress;
        window.removeEventListener('deviceorientation', handleOrientation);
    }

    // --- 音声再生ヘルパー関数 ---
    function playAudio(audioElement, loop = false) {
        if (!loop && (audioElement.id === 'audio-key-press' || audioElement.id.startsWith('audio-5'))) {
             // 5a/5b/5cの個別音とキー音は新しいAudioオブジェクトで再生
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

    // --- ギミック処理関数 ---

    // テンキー入力 (5a, 5b, 5cに対応)
    keypad.addEventListener('click', (e) => {
        if (currentState !== 'READY') return;

        const key = e.target.closest('.key');
        if (!key || key.id === 'enter-btn' || key.id === 'clear-btn') return;

        const num = key.getAttribute('data-num');
        if (num !== null && currentCode.length < 6) { // 5a5b5cは6文字
            
            // 5a, 5b, 5cの音源を再生
            if (num === '5a') {
                playAudio(audio5a, false);
            } else if (num === '5b') {
                playAudio(audio5b, false);
            } else if (num === '5c') {
                playAudio(audio5c, false);
            } else {
                playAudio(audioKeyPress, false); 
            }
            
            currentCode += num;
            codeInput.textContent = currentCode;
        }
    });

    // クリアボタン (変更なし)
    clearBtn.addEventListener('click', () => {
        if (currentState === 'READY' || currentState === 'STANDBY') {
            resetState();
        }
    });

    // ENTERキー処理
    function enterPress() {
        if (currentState === 'READY') {
            if (currentCode === CODE_PHAIZ) {
                // STANDING BYとCHARGEを連続再生
                statusText.textContent = "STANDING BY";
                driverContainer.classList.add('status-standby');
                
                // 1. STANDING BYの音を再生
                playAudio(audioStandby, false);

                // 2. STANDING BYの後にCHARGE音をループ再生
                // STANDBYの長さに合わせてsetTimeoutを設定
                // (ここではSTANDBY音が1.5秒だと仮定)
                setTimeout(() => {
                    playAudio(audioCharge, true); 
                }, 1500); 

                currentState = 'STANDBY';
                
                enterBtn.onmousedown = enterBtn.ontouchstart = null;
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
        // 変身後のENTERは無効化 (このギミックではチャージ機能は含まれないため)
    }

    // 回転検出の処理
    function handleOrientation(event) {
        if (currentState !== 'STANDBY') return;
        
        const gamma = event.gamma; 

        if (Math.abs(gamma) > 80) { 
            completeHenshin();
        }
    }

    // 変身完了処理
    function completeHenshin() {
        if (currentState !== 'STANDBY') return;
        
        window.removeEventListener('deviceorientation', handleOrientation);

        stopAudio(audioCharge); // ★ループしているCHARGE音を停止★
        playAudio(audioComplete);

        statusText.textContent = "COMPLETE";
        driverContainer.classList.remove('status-standby');
        driverContainer.classList.add('status-complete');
        currentState = 'COMPLETE';

        // 変身完了後はENTERボタンを無効化
        enterBtn.onmousedown = enterBtn.ontouchstart = null;
    }


    // 初期イベントリスナー設定
    enterBtn.onmousedown = enterPress;
    enterBtn.ontouchstart = enterPress;

    enterBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // アプリ初期化
    resetState();
});

