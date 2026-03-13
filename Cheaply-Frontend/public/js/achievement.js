// achievement.js - 修正版 (強制掛載到 window，解決 not defined 問題)
window.AchievementToast = {
    queue: [],
    isShowing: false,

    // 1. 初始化
    init() {
        // 建立容器 (如果沒有的話)
        if (!document.getElementById('achievement-toast-container')) {
            const container = document.createElement('div');
            container.id = 'achievement-toast-container';
            // 初始設為穿透，避免隱形擋住點擊
            container.style.pointerEvents = 'none'; 
            document.body.appendChild(container);
        }

        const stored = localStorage.getItem('pendingAchievements');
        if (stored) {
            try {
                this.queue = JSON.parse(stored);
                this.processQueue();
            } catch (e) {
                console.error("Achievement Data Error", e);
                localStorage.removeItem('pendingAchievements');
            }
        }
    },

    // 2. 加入新成就
    add(achievements) {
        if (!achievements || achievements.length === 0) return;
        
        console.log("🏆 New Achievement Received:", achievements); // Debug 用

        const currentQueue = JSON.parse(localStorage.getItem('pendingAchievements') || '[]');
        // 加個 ID 防重複
        const newItems = achievements.map(a => ({...a, id: Date.now() + Math.random()}));
        
        const updatedQueue = [...currentQueue, ...newItems];
        localStorage.setItem('pendingAchievements', JSON.stringify(updatedQueue));
        
        this.queue = updatedQueue;
        this.processQueue();
    },

    // 3. 處理佇列
    processQueue() {
        if (this.isShowing || this.queue.length === 0) return;

        const nextItem = this.queue[0];
        this.showToast(nextItem);
    },

    // 4. 顯示 UI
    showToast(item) {
        this.isShowing = true;
        const container = document.getElementById('achievement-toast-container');

        // 建立 HTML 結構
        const div = document.createElement('div');
        // 恢復滑鼠事件，讓 Toast 可以被點擊或關閉，並確保在最上層
        div.className = "bg-gray-900 border-l-4 border-yellow-500 rounded-lg shadow-2xl w-80 overflow-hidden toast-enter relative pointer-events-auto mb-4 z-50";
        
        // 根據獎勵類型顯示
        let rewardText = "";
        // 確保數值轉為數字再toLocaleString
        if (item.type === 'token') rewardText = `💰 +${Number(item.reward).toLocaleString()} Tokens`;
        else if (item.type === 'buff') rewardText = "✨ Passive Buff Activated";
        else rewardText = "🎉 Collection Unlocked";

        div.innerHTML = `
            <div class="p-4 flex items-center gap-4 bg-gradient-to-r from-gray-900 to-gray-800">
                <div class="text-4xl animate-bounce">🏆</div>
                <div>
                    <h4 class="text-yellow-500 font-black text-xs uppercase tracking-widest mb-1">Achievement Unlocked</h4>
                    <p class="text-white font-bold text-lg leading-none mb-1">${item.name}</p>
                    <p class="text-green-400 text-xs font-mono font-bold">${rewardText}</p>
                </div>
            </div>
            <div class="h-1 bg-gray-800 w-full">
                <div class="h-full bg-yellow-500" style="width: 100%; animation: progressShrink 4s linear forwards;"></div>
            </div>
        `;

        container.appendChild(div);

        // 4秒後移除
        setTimeout(() => {
            div.classList.remove('toast-enter');
            div.classList.add('toast-exit');

            setTimeout(() => {
                div.remove();
                
                // 更新 LocalStorage
                const currentQueue = JSON.parse(localStorage.getItem('pendingAchievements') || '[]');
                currentQueue.shift(); 
                localStorage.setItem('pendingAchievements', JSON.stringify(currentQueue));
                
                this.queue = currentQueue;
                this.isShowing = false;
                this.processQueue(); // 繼續播下一個
            }, 400); // 等待退場動畫
        }, 4000); // 顯示時間
    }
};

// 確保載入時自動執行
window.addEventListener('load', () => {
    if (window.AchievementToast) {
        window.AchievementToast.init();
        console.log("✅ Achievement System Loaded");
    }
});