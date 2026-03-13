// 🌍 1. 統一 API 基礎路徑
const API_BASE = 'https://api.cheaply.click/api';

// 🛡️ 2. 強制登入檢查 (守門員)
// 只要是 Guest 或未登入，直接跳轉，不執行後續任何程式碼
(function checkLogin() {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (!user || !token) {
        window.location.replace('login.html');
    }
})();


// ===========================================
// 👤 Header 與 UI 邏輯
// ===========================================
async function updateHeaderStatus() {
    const username = localStorage.getItem('currentUser') || 'Guest';
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (username !== 'Guest') {
        const firstLetter = username.charAt(0).toUpperCase();
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-600 text-white relative";

        let unreadCount = 0;
        try {
            // FIX 1: 使用 API_BASE 而非 ROOT_URL
            const res = await fetch(`${API_BASE}/mail?t=${Date.now()}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if(res.ok) {
                const msgs = await res.json();
                unreadCount = msgs.filter(m => !m.read).length;
            }
        } catch(e) { console.error("Mail check failed", e); }

        let inboxLabelHtml = 'System Inbox';
        let avatarDotHtml = '';
        if (unreadCount > 0) {
            inboxLabelHtml += `<span class="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">${unreadCount}</span>`;
            avatarDotHtml = `<span class="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span></span>`;
        }

        avatarBtn.innerHTML = firstLetter + avatarDotHtml;
        dropdownContent.innerHTML = `
            <div class="px-4 py-3 border-b border-gray-700/50">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="text-sm font-bold text-white truncate">${username}</p>
            </div>
            <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Profile
            </a>
            <a href="mail.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> ${inboxLabelHtml}
            </a>
            <div class="h-px bg-gray-700 my-1 mx-2"></div>
            <button onclick="handleLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg> Log Out
            </button>
        `;
    } else {
        avatarBtn.innerText = "?";
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold bg-slate-700 text-gray-300 hover:bg-slate-600";
        dropdownContent.innerHTML = `<a href="login.html" class="block px-4 py-2 text-sm text-yellow-400 font-bold">Log In</a>`;
    }
}

function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }

// FIX 4: handleLogout 改為同時 remove('hidden') 和 add('flex')，與其他頁面一致
function handleLogout() {
    const modal = document.getElementById('logoutModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
function confirmLogout() { localStorage.clear(); window.location.href = 'login.html'; }

window.addEventListener('click', function(e) {
    const btn = document.getElementById('userAvatarBtn');
    const menu = document.getElementById('userDropdown');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// ==========================================
// 🎴 卡片靜態資料
// ==========================================
const achievementCards = {
    'Supporter': {
        icon: '💎', name: 'Supporter', rarity: 'Achievement',
        effect: 'Unlocked by first purchase. Grants 8,000 game tokens.',
        style: 'bg-gradient-to-b from-blue-500 to-cyan-500',
        tagColor: 'bg-blue-800/60', descColor: 'bg-white/20'
    },
    'Collector': {
        icon: '🔒', unlockedIcon: '🎯', name: 'Collector', rarity: 'Achievement',
        effect: 'Spin wheel 7 times consecutively. Bonus +20,000 tokens on wins.',
        style: 'bg-gray-600',
        tagColor: 'bg-gray-800/60', descColor: 'bg-white/20'
    },
    'Token Tycoon': {
        icon: '👑', name: 'Token Tycoon', rarity: 'Achievement',
        effect: 'Hold ≥101M tokens. Instantly gain +200M tokens.',
        style: 'bg-gradient-to-b from-orange-500 to-yellow-500',
        tagColor: 'bg-yellow-700/60', descColor: 'bg-white/20'
    }
};

const luckCards = {
    'Lucky Star': {
        icon: '⭐', name: 'Lucky Star', rarity: 'Rare (4%)',
        effect: 'Double your next spin winnings (one-time use)',
        style: 'bg-yellow-500',
        tagColor: 'bg-yellow-700/50', descColor: 'bg-white/20'
    },
    'Double Chance': {
        icon: '🎲', name: 'Double Chance', rarity: 'Uncommon (15%)',
        effect: 'Spin twice in one turn (one-time use)',
        style: 'bg-gray-500',
        tagColor: 'bg-gray-700/50', descColor: 'bg-white/20'
    },
    'Fortune Booster': {
        icon: '✨', name: 'Fortune Booster', rarity: 'Epic (1%)',
        effect: 'Gain +10% of total tokens on level up (one-time use)',
        style: 'bg-gradient-to-b from-fuchsia-500 to-purple-600',
        tagColor: 'bg-purple-900/40', descColor: 'bg-white/20'
    }
};

let gachaData = {
    availableDraws: 0,
    newUserSequence: 0,
    weeklyDraws: 0,
    referralDraws: 0,
    nextResetTime: 0,
    luckCards: {},
    achievementCards: {}
};

let userReferralCode = 'LOADING...';

// ==========================================
// 🔧 核心功能：狀態載入與抽卡
// ==========================================
async function init() {
    await fetchState();
    setInterval(fetchState, 10000); 
}

async function fetchState() {
    try {
        // FIX 1: 使用 API_BASE
        const res = await fetch(`${API_BASE}/gacha/state`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token') 
            }
        });

        if (res.status === 401 || res.status === 403) {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        if (!res.ok) throw new Error("Server Error");
        const data = await res.json();
        
        gachaData = data;
        if (data.referralCode) {
            userReferralCode = data.referralCode;
        }
        updateDisplay();
    } catch (e) {
        console.error("Connect failed:", e);
        document.getElementById('statusMessage').textContent = "⚠️ Server Disconnected";
    }
}

async function drawCard() {
    if (gachaData.availableDraws <= 0) return alert('No draws available.');

    const btn = document.getElementById('drawBtn');
    // FIX 2: 使用 getElementById('drawBtnText') 取代 querySelector('span span')
    const btnText = document.getElementById('drawBtnText');
    const container = document.getElementById('cardContainer');
    
    btn.disabled = true;
    btnText.textContent = 'Shuffling...';
    
    container.className = 'relative w-full h-full transform-style-3d transition-flip-reset cursor-pointer';
    void container.offsetWidth; 
    container.classList.remove('rotate-y-180');
    container.classList.add('rotate-y-0');

    try {
        await new Promise(r => setTimeout(r, 800));
        
        // FIX 1: 使用 API_BASE
        const res = await fetch(`${API_BASE}/gacha/draw`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token') 
            }
        });
        const result = await res.json();
        
        if (result.error) throw new Error(result.error);

        container.classList.remove('transition-flip-reset');
        container.classList.add('card-shake');

        setTimeout(() => {
            container.classList.remove('card-shake');
            prepareCardVisuals(result.type);
            
            void container.offsetWidth;
            container.classList.add('transition-flip-reveal');
            container.classList.remove('rotate-y-0');
            container.classList.add('rotate-y-180');
            
            if (result.type !== 'EMPTY') {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
            
            fetchState();
            
            if (result.newUnlockedAchievements && result.newUnlockedAchievements.length > 0) {
                if (window.AchievementToast) AchievementToast.add(result.newUnlockedAchievements);
            }
            
            // FIX 2: 使用 getElementById('drawBtnText')
            btn.disabled = false; 
            btnText.textContent = 'Draw Card';

        }, 500);

    } catch (e) {
        alert(e.message);
        btn.disabled = false;
        // FIX 2: 使用 getElementById('drawBtnText')
        btnText.textContent = 'Draw Card';
    }
}

// ==========================================
// 🎨 畫面渲染
// ==========================================
function updateDisplay() {
    document.getElementById('availableDraws').textContent = gachaData.availableDraws;
    document.getElementById('referralCode').textContent = userReferralCode;
    document.getElementById('referralDraws').textContent = gachaData.referralDraws;
    
    let statusMsg = '';
    if (gachaData.newUserSequence < 3) statusMsg = `✨ New User Bonus: ${3 - gachaData.newUserSequence} draws left!`;
    else if (gachaData.weeklyDraws < 1) statusMsg = '📅 Weekly draw available!';
    else if (gachaData.referralDraws > 0) statusMsg = `👥 Referral bonus available!`;
    else statusMsg = `⏳ Next free draw in 7 days`;
    document.getElementById('statusMessage').textContent = statusMsg;

    if (gachaData.availableDraws > 0) {
        document.getElementById('nextDrawTime').textContent = 'Now!';
        document.getElementById('nextDrawTime').className = 'text-white text-xl font-bold';
    } else {
        const days = Math.ceil((gachaData.nextResetTime - Date.now()) / (24 * 60 * 60 * 1000));
        document.getElementById('nextDrawTime').textContent = `${days > 0 ? days : 1} Days`;
    }

    const drawBtn = document.getElementById('drawBtn');
    // FIX 2: 使用 getElementById('drawBtnText')
    const btnText = document.getElementById('drawBtnText');
    if (gachaData.availableDraws <= 0) {
        drawBtn.disabled = true;
        btnText.textContent = 'No Draws Left';
        drawBtn.classList.add('opacity-50', 'cursor-not-allowed', 'shadow-none');
    } else {
        drawBtn.disabled = false;
        btnText.textContent = 'Draw Card';
        drawBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'shadow-none');
    }

    renderCards();
}

function renderCards() {
    document.getElementById('achievementCards').innerHTML = Object.entries(achievementCards).map(([key, card]) => {
        const unlocked = gachaData.achievementCards[key];
        const icon = (key === 'Collector' && !unlocked) ? card.icon : (card.unlockedIcon || card.icon);
        const opacityClass = unlocked ? '' : 'opacity-50 grayscale';

        return `
            <div class="${card.style} ${opacityClass} rounded-xl p-4 text-center border-2 border-white/10 shadow-lg transform transition hover:scale-[1.02] flex flex-col items-center h-full">
                <div class="text-5xl mb-3 drop-shadow-md mt-2">${icon}</div>
                <h4 class="text-white font-bold text-lg mb-2">${card.name}</h4>
                <div class="${card.tagColor} w-full py-1 mb-3">
                    <span class="text-white text-xs uppercase font-bold tracking-wide">${card.rarity}</span>
                </div>
                <div class="${card.descColor} rounded-lg p-2 w-full flex-grow flex items-center justify-center">
                    <p class="text-white text-sm leading-tight">${card.effect}</p>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('luckCards').innerHTML = Object.entries(luckCards).map(([key, card]) => {
        const count = gachaData.luckCards[key] || 0;
        
        return `
            <div class="${card.style} rounded-xl p-4 text-center border-2 border-white/10 shadow-lg transform transition hover:scale-[1.02] flex flex-col items-center h-full">
                <div class="text-5xl mb-3 drop-shadow-md mt-2">${card.icon}</div>
                <h4 class="text-white font-bold text-lg mb-2">${card.name}</h4>
                <div class="${card.tagColor} w-full py-1 mb-3">
                    <span class="text-white text-xs uppercase font-bold tracking-wide">${card.rarity}</span>
                </div>
                <div class="${card.descColor} rounded-lg p-2 w-full mb-3 min-h-[50px] flex items-center justify-center">
                    <p class="text-white text-sm leading-tight">${card.effect}</p>
                </div>
                <div class="bg-black/40 rounded-full py-1 px-8">
                    <span class="text-white font-bold text-lg">×${count}</span>
                </div>
            </div>
        `;
    }).join('');
}

function prepareCardVisuals(type) {
    const front = document.getElementById('cardFront');
    const icon = document.getElementById('cardIcon');
    const name = document.getElementById('cardName');
    const rarity = document.getElementById('cardRarity');
    const effect = document.getElementById('cardEffect');

    front.className = 'absolute inset-0 rounded-2xl border-4 shadow-2xl backface-hidden rotate-y-180 overflow-hidden';
    
    if (type === 'EMPTY') {
        front.classList.add('bg-slate-700', 'border-slate-500');
        icon.textContent = '😢';
        name.textContent = 'No Luck...';
        rarity.textContent = 'Common';
        effect.textContent = "Don't give up! Try again next week.";
    } else {
        const card = luckCards[type];
        front.className += ' ' + card.style;
        front.classList.add('border-white/40');
        if(type === 'Fortune Booster') front.classList.add('card-glow');

        icon.textContent = card.icon;
        name.textContent = card.name;
        rarity.textContent = card.rarity;
        effect.textContent = card.effect;
    }
}

function copyReferralCode() {
    navigator.clipboard.writeText(userReferralCode).then(() => alert('Referral code copied!'));
}

window.addEventListener('load', () => {
    init(); 
    updateHeaderStatus();
});

window.addEventListener('pageshow', () => {
    fetchState(); 
    updateHeaderStatus();
});