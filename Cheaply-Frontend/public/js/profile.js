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
// 🔧 靜態資料設定
// ===========================================
const ALL_CARDS = [
    { id: 1, name: 'Supporter', category: 'Basic Achievement', description: 'First purchase of game tokens', reward: '+8,000 tokens', image: '🎁', gradient: 'from-green-500 to-emerald-700', border: 'border-green-400' },
    { id: 2, name: 'Collector', category: 'Basic Achievement', description: 'Spin 7 times consecutively', reward: '+20,000 tokens', image: '🎯', gradient: 'from-blue-500 to-indigo-700', border: 'border-blue-400' },
    { id: 3, name: 'Token Tycoon', category: 'Basic Achievement', description: 'Hold ≥ 101M game tokens', reward: '+200M tokens', image: '👑', gradient: 'from-purple-500 to-fuchsia-700', border: 'border-purple-400' },
    { id: 4, name: 'Lucky Star', category: 'Advanced Luck', description: 'Obtained from card gacha', reward: 'Double prize', image: '⭐', gradient: 'from-yellow-500 to-orange-700', border: 'border-yellow-400' },
    { id: 5, name: 'Double Chance', category: 'Advanced Luck', description: 'Obtained from card gacha', reward: 'Spin x2', image: '🎲', gradient: 'from-red-500 to-rose-700', border: 'border-red-400' },
    { id: 6, name: 'Fortune Booster', category: 'Advanced Luck', description: 'Obtained from card gacha', reward: '+10% Bonus', image: '💫', gradient: 'from-cyan-500 to-blue-700', border: 'border-cyan-400' }
];

// ===========================================
// 👤 Header 與 UI 邏輯
// ===========================================
async function updateHeaderStatus() {
    const username = localStorage.getItem('currentUser') || 'Guest';
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (username && !username.startsWith('Guest_') && username !== 'Guest') {
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-600 text-white relative";

        let unreadCount = 0;
        try {
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

        avatarBtn.innerHTML = username.charAt(0).toUpperCase() + avatarDotHtml;
        dropdownContent.innerHTML = `
            <div class="px-4 py-3 border-b border-gray-700/50">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="text-sm font-bold text-white truncate">${username}</p>
            </div>
            <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> Profile
            </a>
            <a href="mail.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> ${inboxLabelHtml} 
            </a>
            <div class="h-px bg-gray-700 my-1 mx-2"></div>
            <button onclick="handleLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> Log Out
            </button>`;
    } else {
        avatarBtn.innerText = "?";
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold bg-slate-700 text-gray-300 hover:bg-slate-600";
        dropdownContent.innerHTML = `<a href="login.html" class="block px-4 py-2 text-sm text-yellow-400 font-bold">Log In</a>`;
    }
}

function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function handleLogout() { document.getElementById('logoutModal').classList.remove('hidden'); }
function closeLogoutModal() { document.getElementById('logoutModal').classList.add('hidden'); }
function confirmLogout() { localStorage.clear(); window.location.href = 'login.html'; }
function showLogoutModal() { handleLogout(); } // Alias

// 點擊空白處關閉選單
window.addEventListener('click', function(e) {
    const btn = document.getElementById('userAvatarBtn');
    const menu = document.getElementById('userDropdown');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// ===========================================
// 🛠️ 核心功能：載入個人資料
// ===========================================
async function loadProfileData() {
    const token = localStorage.getItem('token');
    if (!token) { 
        alert("Please log in first!");
        localStorage.clear();
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        const res = await fetch(`${API_BASE}/user?t=${Date.now()}`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            }
        });
        
        if (res.status === 401 || res.status === 403) {
            alert("Session expired. Please log in again.");
            localStorage.clear(); 
            window.location.href = 'login.html';
            return;
        }

        if(!res.ok) throw new Error("Failed to load profile");
        
        const data = await res.json(); 

        // 更新文字資料
        updateText('profileUsername', data.username);
        updateText('profileGameTokens', data.gameTokens.toLocaleString());
        updateText('profilePromoTokens', (data.promoTokens || 0).toFixed(2));
        updateText('profileLevel', `Level ${data.userLevel}`);
        updateText('profileInviteCode', data.referralCode || 'NO-CODE');
        
        // 檢查新成就
        if (data.newUnlockedAchievements && data.newUnlockedAchievements.length > 0) {
            if (window.AchievementToast) AchievementToast.add(data.newUnlockedAchievements);
            document.getElementById('profileGameTokens').classList.add('animate-bounce');
        }

        // 處理加入日期
        let joinDateText = "Joined 2026"; 
        if (data.createdAt) {
            const dateObj = new Date(data.createdAt);
            const options = { year: 'numeric', month: 'short' };
            joinDateText = "Joined " + dateObj.toLocaleDateString('en-US', options);
        }
        updateText('profileJoinDate', joinDateText);
        
        // 錢包地址與頭像
        const walletAddr = data.walletAddress ? data.walletAddress : 'Not Connected';
        updateText('profileWalletAddress', walletAddr);
        document.getElementById('profileAvatarBig').textContent = data.username.charAt(0).toUpperCase();
        
        // 渲染卡片
        renderCards(data);

    } catch (err) {
        console.error(err);
        updateText('profileUsername', "Server Offline");
    }
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if(el) {
        el.textContent = text;
        el.classList.remove('animate-pulse');
    }
}

// ===========================================
// 🎴 卡片渲染邏輯
// ===========================================
function renderCards(userData) {
    const grid = document.getElementById('cardsGrid');
    const unlockedCards = ALL_CARDS.map(card => {
        let isUnlocked = false;
        if (userData.luckCards && userData.luckCards[card.name] > 0) isUnlocked = true;
        if (userData.achievements && userData.achievements[card.name]) isUnlocked = true;
        return { ...card, unlocked: isUnlocked };
    });

    const unlockedCount = unlockedCards.filter(c => c.unlocked).length;
    const percentage = Math.round((unlockedCount / ALL_CARDS.length) * 100);
    
    document.getElementById('collectionPercentage').textContent = `${percentage}%`;
    document.getElementById('collectionProgressBar').style.width = `${percentage}%`;

    grid.innerHTML = unlockedCards.map(card => `
        <button onclick="showCard(${card.id}, ${card.unlocked})" class="group relative rounded-xl p-3 border-2 transition-all duration-300 overflow-hidden ${
            card.unlocked ? `bg-gradient-to-br ${card.gradient} ${card.border} hover:scale-105 shadow-lg` : 'bg-gray-800 border-gray-700 hover:border-gray-500 opacity-60'
        }">
            <div class="text-4xl mb-2 text-center transition-transform group-hover:scale-110 ${card.unlocked ? '' : 'opacity-30 grayscale'}">${card.image}</div>
            <div class="text-white font-bold text-center text-xs md:text-sm truncate">${card.name}</div>
            ${!card.unlocked ? '<div class="absolute top-2 right-2"><svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg></div>' : ''}
        </button>
    `).join('');
}

function showCard(id, unlocked) {
    const card = ALL_CARDS.find(c => c.id === id);
    const modal = document.getElementById('cardModal');
    const content = document.getElementById('modalContent');
    content.className = `rounded-2xl p-8 max-w-md w-full border-4 shadow-2xl relative ${unlocked ? `bg-gradient-to-br ${card.gradient} ${card.border}` : 'bg-gray-800 border-gray-600'}`;
    content.innerHTML = `
        <button onclick="closeModal()" class="absolute top-4 right-4 text-white/70 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        <div class="text-center">
            <div class="text-8xl mb-4 ${unlocked ? 'animate-bounce' : 'opacity-40 grayscale'}">${card.image}</div>
            <h3 class="text-2xl font-bold text-white mb-2">${card.name}</h3>
            <div class="inline-block bg-black/20 rounded-full px-3 py-1 text-xs text-white/90 mb-6 border border-white/10">${card.category}</div>
            <div class="bg-black/20 rounded-xl p-4 text-left border border-white/10">
                <div class="mb-3"><p class="text-white/60 text-xs uppercase font-bold mb-1">Requirement</p><p class="text-white text-sm">${card.description}</p></div>
                <div><p class="text-white/60 text-xs uppercase font-bold mb-1">Reward</p><p class="text-yellow-300 font-bold text-sm">${card.reward}</p></div>
            </div>
            <div class="mt-6">${unlocked ? '<div class="text-green-300 font-bold flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> UNLOCKED</div>' : '<div class="text-gray-400 text-sm flex items-center justify-center gap-2"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg> LOCKED</div>'}</div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() { document.getElementById('cardModal').classList.add('hidden'); }

// ===========================================
// 🔗 錢包與剪貼簿邏輯
// ===========================================
function copyInviteCode() {
    const code = document.getElementById('profileInviteCode').innerText;
    if(code === '...' || code === 'NO-CODE') return;
    navigator.clipboard.writeText(code).then(() => {
        const btn = event.currentTarget;
        const original = btn.innerText;
        btn.innerText = "Copied!";
        btn.classList.replace('bg-yellow-600', 'bg-green-600');
        setTimeout(() => { btn.innerText = original; btn.classList.replace('bg-green-600', 'bg-yellow-600'); }, 2000);
    });
}

function openWalletModal() { document.getElementById('walletModal').classList.remove('hidden'); }
function closeWalletModal() { document.getElementById('walletModal').classList.add('hidden'); }

async function connectPhantomForProfile() {
    if (!window.solana || !window.solana.isPhantom) {
        alert("Please install Phantom Wallet extension!");
        window.open("https://phantom.app/", "_blank");
        return;
    }
    try {
        const resp = await window.solana.connect();
        const address = resp.publicKey.toString();
        const input = document.getElementById('newWalletInput');
        input.value = address;
        input.classList.add('border-green-500', 'text-green-400');
        setTimeout(() => input.classList.remove('border-green-500', 'text-green-400'), 1000);
    } catch (err) { console.error(err); }
}

async function saveWallet() {
    const val = document.getElementById('newWalletInput').value.trim();
    if(!val) return alert("Please enter a wallet address");

    const btn = document.getElementById('saveWalletBtn');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        const token = localStorage.getItem('token');
        if(!token) { window.location.href = 'login.html'; return; }

        const res = await fetch(`${API_BASE}/auth/bind-wallet`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ walletAddress: val })
        });

        const result = await res.json();
        
        if (result.success) {
            // 先改按鈕給使用者視覺回饋，再關閉 modal
            btn.innerText = "Saved!";
            btn.className = "flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold";

            setTimeout(() => {
                document.getElementById('profileWalletAddress').textContent = val;
                closeWalletModal();
                // modal 關閉後才重置狀態（雖然已不可見，但保持乾淨）
                btn.innerText = originalText;
                btn.className = "flex-1 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm md:text-base hover:bg-indigo-500 font-bold transition-colors shadow-lg";
                btn.disabled = false;
            }, 800);
        } else {
            alert("❌ Error: " + result.error);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("❌ Connection Error");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// 🌍 全域綁定 (給 HTML onclick 使用)
window.toggleUserMenu = toggleUserMenu;
window.handleLogout = handleLogout;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.showLogoutModal = showLogoutModal;
window.showCard = showCard;
window.closeModal = closeModal;
window.copyInviteCode = copyInviteCode;
window.openWalletModal = openWalletModal;
window.closeWalletModal = closeWalletModal;
window.connectPhantomForProfile = connectPhantomForProfile;
window.saveWallet = saveWallet;

// 初始化
window.addEventListener('pageshow', () => { 
    loadProfileData(); 
    updateHeaderStatus(); 
});