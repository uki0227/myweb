document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素綁定
    const inputMinuend = document.getElementById('minuend');
    const inputSubtrahend = document.getElementById('subtrahend');
    const btnRandom = document.getElementById('btn-random');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnReset = document.getElementById('btn-reset');
    const errorMsg = document.getElementById('error-msg');

    // 狀態變數
    let historySteps = []; // 儲存每一步的 UI 狀態
    let currentStepIndex = -1; // -1 表示尚未開始計算

    // 初始化與驗證
    function init() {
        let mVal = parseInt(inputMinuend.value);
        let sVal = parseInt(inputSubtrahend.value);
        
        if (isNaN(mVal) || isNaN(sVal)) return false;
        
        if (mVal < sVal) {
            errorMsg.textContent = "被減數必須大於或等於減數！";
            return false;
        } else {
            errorMsg.textContent = "";
        }

        // 轉換為陣列 (由右至左: index 0 為個位，3 為千位)
        let mArr = String(mVal).padStart(4, '0').split('').map(Number).reverse();
        let sArr = String(sVal).padStart(4, '0').split('').map(Number).reverse();
        
        calculateSteps(mArr, sArr);
        renderStep(-1); // 繪製初始狀態
        return true;
    }

    // 核心演算法：預先計算所有步驟的借位狀態
    function calculateSteps(mArr, sArr) {
        historySteps = [];
        
        // 拷貝陣列供計算使用
        let currentM = [...mArr];
        let currentB = [null, null, null, null]; // 借位顯示區
        let isCrossed = [false, false, false, false]; // 是否有刪除線
        let currentR = [null, null, null, null]; // 答案區
        
        // 初始狀態 (Step -1)
        historySteps.push({
            m: [...currentM],
            b: [...currentB],
            crossed: [...isCrossed],
            r: [...currentR],
            activeCol: -1
        });

        // 依序計算個(0), 十(1), 百(2), 千(3)
        for (let i = 0; i < 4; i++) {
            // 退位判斷
            if (currentM[i] < sArr[i]) {
                // 尋找高位數借位 (處理連續借位/多重退位)
                let borrowIndex = i + 1;
                while (borrowIndex < 4 && currentM[borrowIndex] === 0) {
                    borrowIndex++;
                }

                // 執行借位
                if (borrowIndex < 4) {
                    // 將借來的沿路賦值
                    for (let k = borrowIndex; k > i; k--) {
                        if (k === borrowIndex) {
                            currentM[k] -= 1;
                            currentB[k] = currentM[k];
                            isCrossed[k] = true;
                        } else {
                            // 途經的 0 變成 9
                            currentM[k] = 9;
                            currentB[k] = 9;
                            isCrossed[k] = true;
                        }
                    }
                    // 當前位數加 10
                    currentM[i] += 10;
                    currentB[i] = currentM[i];
                    isCrossed[i] = true;
                }
            }

            // 計算當前位數相減結果
            currentR[i] = currentM[i] - sArr[i];

            // 儲存此步驟狀態 (深拷貝)
            historySteps.push({
                m: [...currentM],       // 記憶當下陣列數值
                originalM: [...mArr],   // 保留原始輸入以供顯示
                b: [...currentB],
                crossed: [...isCrossed],
                r: [...currentR],
                activeCol: i            // 標示高亮行
            });
        }
    }

    // 渲染畫面功能
    function renderStep(stepIndex) {
        // 取出對應步驟的資料 (加 1 是因為 historySteps[0] 是初始狀態)
        const state = historySteps[stepIndex + 1];
        
        // 填入原始數字與符號
        for (let i = 0; i < 4; i++) {
            // 若為初始狀態且該位數為前導0，則不顯示 (例如 0198 顯示為 198)
            let mStr = state.originalM ? state.originalM[i] : parseInt(inputMinuend.value.toString().padStart(4, '0').split('').reverse()[i]);
            let sStr = parseInt(inputSubtrahend.value.toString().padStart(4, '0').split('').reverse()[i]);
            
            document.getElementById(`m${i}`).textContent = mStr;
            document.getElementById(`s${i}`).textContent = sStr;
            
            // 處理借位與刪除線
            const cellM = document.getElementById(`m${i}`);
            if (state.crossed[i]) {
                cellM.classList.add('strikethrough');
            } else {
                cellM.classList.remove('strikethrough');
            }

            document.getElementById(`b${i}`).textContent = state.b[i] !== null ? state.b[i] : "";
            document.getElementById(`r${i}`).textContent = state.r[i] !== null ? state.r[i] : "";

            // 高亮目前計算直行
            const cols = [
                document.getElementById(`b${i}`),
                document.getElementById(`m${i}`),
                document.getElementById(`s${i}`),
                document.getElementById(`r${i}`)
            ];
            
            if (state.activeCol === i) {
                cols.forEach(el => el.classList.add('active-col'));
            } else {
                cols.forEach(el => el.classList.remove('active-col'));
            }
        }

        // 按鈕狀態更新
        btnPrev.disabled = stepIndex < 0;
        btnNext.disabled = stepIndex >= 3;
    }

    // 事件監聽器
    btnNext.addEventListener('click', () => {
        if (currentStepIndex < 3) {
            currentStepIndex++;
            renderStep(currentStepIndex);
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentStepIndex >= 0) {
            currentStepIndex--;
            renderStep(currentStepIndex);
        }
    });

    btnReset.addEventListener('click', () => {
        if (init()) {
            currentStepIndex = -1;
            renderStep(currentStepIndex);
        }
    });

    btnRandom.addEventListener('click', () => {
        let max = 9999;
        let m = Math.floor(Math.random() * max) + 1;
        let s = Math.floor(Math.random() * m); // 確保減數 <= 被減數
        
        // 特意製造借位情境機率 (例如個位數 m < s)
        if (Math.random() > 0.3) { 
           m = Math.floor(m / 10) * 10 + 2; // 個位設為 2
           s = Math.floor(s / 10) * 10 + 8; // 個位設為 8
           if(m < s) [m, s] = [s, m];
        }

        inputMinuend.value = m;
        inputSubtrahend.value = s;
        btnReset.click();
    });

    // 監聽輸入框變更 (若修改則重置狀態)
    inputMinuend.addEventListener('change', btnReset.click);
    inputSubtrahend.addEventListener('change', btnReset.click);

    // 初始化第一次畫面
    init();
});