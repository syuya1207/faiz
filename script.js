document.addEventListener('DOMContentLoaded', () => {
    // 正しい変身コードを '555' に変更
    const CODE_PHAIZ = "555"; 
    const statusText = document.getElementById('status-text');
    const codeInput = document.getElementById('code-input');
    const keypad = document.getElementById('keypad');
    const enterBtn = document.getElementById('enter-btn');
    const clearBtn = document.getElementById('clear-btn');
    const driverContainer = document.getElementById('driver-container');

    // Audio要素の取得
    const audio5a = document.getElementById('audio-5a'); 
    const audio5b = document.getElementById('audio-5b'); 
    const audio5c = document.getElementById('audio-5c'); 
    const audioStandby = document.getElementById('audio-standby');
    const audioCharge = document.getElementById('audio-charge'); 
    const audioComplete = document.getElementById('audio-complete');
    const audioError = document.getElementById('audio-error');
    const audioKeyPress = document.getElementById('audio-key-press');

    let currentCode = ""; // 内部で '555' を保持
    let displayCode = ""; // 表示用のコード（'555'）
    let currentState = 'READY'; 

    // --- 状態管理関数 ---

    function resetState() {
        currentState = 'READY';
        currentCode = "";
        displayCode = "";
        statusText.textContent = "READY";
        codeInput.textContent = "";
        driverContainer.classList.remove('status-standby', 'status-complete');
        stopAudio(audioCharge); 
        stopAudio(audioStandby);
        enterBtn.onmousedown = enterPress; 
        enterBtn.ontouchstart = enterPress;
        window.removeEventListener('deviceorientation', handleOrientation);
    }

    // --- 音声再生ヘルパー関数 ---
    function playAudio(audioElement, loop = false) {
        // 個別の5a/5b/5cの音、またはキー音は新しいAudioオブジェクトで再生
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

    // --- ギミック処理関数 ---

    // テンキー入力 (★ロジックを修正★)
    keypad.addEventListener('click', (e) => {
        if (currentState !== 'READY') return;

        const key = e.target.closest('.key');
        if (!key || key.id === 'enter-btn' || key.id === 'clear-btn') return;

        const num = key.getAttribute('data-num');
        
        // コードが3桁未満の場合のみ入力可能
        if (currentCode.length < 3) { 
            
            if (num === '5') {
                // 5が押された回数をチェックし、対応する音を鳴らす
                if (currentCode.length === 0) {
                    playAudio(audio5a, false);
                } else if (currentCode.length === 1) {
                    playAudio(audio5b, false);
                } else if (currentCode.length === 2) {
                    playAudio(audio5c, false);
                }
                
                // 内部コードと表示コードを更新
                currentCode += num; // 内部的には '555'
                displayCode += num; // 表示的にも '555'
                codeInput.textContent = displayCode;

            } else {
                // '5' 以外の数字が押された場合
                playAudio(audioKeyPress, false); 

                // 5以外の数字が混ざるとコードはエラーとしてリセット
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

    // ENTERキー処理
    function enterPress() {
        if (currentState === 'READY') {
            // 変身コードは '555' に変更
            if (currentCode === CODE_PHAIZ) {
                // STANDING BYへ移行
                statusText.textContent = "STANDING BY";
                driverContainer.classList.add('status-standby');
                
                // 1. STANDING BYの音を再生
                playAudio(audioStandby, false);

                // 2. STANDING BYの後にCHARGE音をループ再生
                // STANDBY音が約1.5秒と仮定
                setTimeout(() => {
                    playAudio(audioCharge, true); 
                }, 1500); 

                currentState = 'STANDBY';
                
                enterBtn.onmousedown = enterBtn.ontouchstart = null;
                window.addEventListener('deviceorientation', handleOrientation);

            } else if (currentCode.length > 0) {
                // ERROR処理 (555以外のコードはエラー)
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
        // 変身後のENTERは無効
    }

    // 回転検出の処理、変身完了処理、エクシードチャージ処理は変更なし
    function handleOrientation(event) {
        if (currentState !== 'STANDBY') return;
        const gamma = event.gamma; 
        if (Math.abs(gamma) > 80) { 
            completeHenshin();
        }
    }

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


    // 初期イベントリスナー設定
    enterBtn.onmousedown = enterPress;
    enterBtn.ontouchstart = enterPress;
    enterBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    
    resetState();
});

