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
// 🛠️ 狀態變數
// ===========================================
let allMessages = [];
let currentFilter = 'all';

// DOM 元素快取
let messageListContainer;
let messageContentArea;
let inboxView;
let detailView;
let listStatus;
let emptyHint;

// ===========================================
// 📨 核心功能：信件處理
// ===========================================

async function fetchMessages(retryCount = 0) {
    if (retryCount === 0) {
        listStatus.innerText = "Refreshing...";
        if (allMessages.length === 0) {
            messageListContainer.innerHTML = '<div class="p-10 text-center text-purple-400 animate-pulse">Connecting to server...</div>';
        }
    }

    try {
        const res = await fetch(`${API_BASE}/mail`, {
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (res.status === 401 || res.status === 403) {
            alert("Session expired. Please log in again.");
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        if (!res.ok) throw new Error(`Server Error: ${res.status}`);

        allMessages = await res.json();
        renderMessageList(); 

    } catch (e) {
        console.error(`Attempt ${retryCount + 1} failed:`, e);

        if (retryCount < 2) {
            setTimeout(() => fetchMessages(retryCount + 1), 1000);
        } else {
            listStatus.innerText = "Connection Error";
            messageListContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center mt-10 space-y-4">
                    <p class="text-red-400 font-bold">⚠️ Connection Error</p>
                    <button onclick="fetchMessages()" class="px-6 py-2 bg-purple-600 rounded-full text-white text-sm hover:bg-purple-500 transition shadow-lg">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }
}

function renderMessageList() {
    const displayMessages = allMessages.filter(msg => {
        if (currentFilter === 'all') return true;
        return msg.type === currentFilter;
    });

    listStatus.innerText = `Showing ${displayMessages.length} messages`;

    if (displayMessages.length === 0) {
        messageListContainer.innerHTML = '<p class="text-center text-purple-400/50 mt-10 italic">No messages found.</p>';
        return;
    }

    messageListContainer.innerHTML = displayMessages.map(msg => {
        const icon = msg.type === 'reward' ? '🎁' : '📢';
        const previewText = msg.content.replace(/<[^>]*>?/gm, '').substring(0, 40) + '...';

        return `
        <div onclick="openMessage(${msg.id})" 
             class="group cursor-pointer flex items-center gap-4 p-4 rounded-xl transition-all duration-200 border relative overflow-hidden
                    ${msg.read 
                        ? 'bg-purple-900/20 border-purple-500/10 hover:bg-purple-800/30 text-purple-300' 
                        : 'bg-gradient-to-r from-purple-800/60 to-pink-900/40 border-yellow-500/30 hover:border-yellow-500/50 text-white shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]'
                    }">
            ${!msg.read ? '<div class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full unread-glow shadow-[0_0_10px_#fbbf24]"></div>' : ''}
            <div class="ml-4 text-2xl flex-shrink-0 ${!msg.read ? 'animate-pulse' : 'opacity-70'}">${icon}</div>
            <div class="flex-1 min-w-0 overflow-hidden">
                <div class="flex justify-between items-baseline mb-1">
                    <h4 class="text-sm md:text-base truncate ${msg.read ? 'font-medium' : 'font-bold text-yellow-100'}">${msg.sender}</h4>
                    <span class="text-xs ${msg.read ? 'text-purple-400' : 'text-yellow-200/70'} flex-shrink-0 ml-2">${msg.date}</span>
                </div>
                <p class="text-sm md:text-base truncate ${msg.read ? 'font-normal' : 'font-semibold'}">${msg.title}</p>
                <p class="text-xs truncate opacity-70 group-hover:opacity-100 transition-opacity">${previewText}</p>
            </div>
        </div>
    `}).join('');
}

async function openMessage(id) {
    const msg = allMessages.find(m => m.id === id);
    if (!msg) return;

    if (!msg.read) {
        fetch(`${API_BASE}/mail/read`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ id: msg.id })
        });
        msg.read = true;
        renderMessageList();
    }

    // FIX 3: 隱藏空白提示
    if (emptyHint) emptyHint.classList.add('hidden');

    let actionBtn = '';
    
    if (msg.type !== 'announcement' && msg.reward && msg.reward.type && msg.reward.type !== 'none') {
        if (msg.claimed) {
            actionBtn = `<div class="mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-600 text-center text-gray-400 font-mono text-sm">✅ Reward Claimed</div>`;
        } else {
            let btnText = 'Claim Reward';
            let btnColor = 'from-yellow-500 to-orange-600'; 
            if (msg.reward.type === 'token') btnText = `💰 Claim ${msg.reward.value.toLocaleString()} Tokens`;
            else if (msg.reward.type === 'card') { btnText = `🃏 Claim Card: ${msg.reward.value}`; btnColor = 'from-pink-500 to-purple-600'; }
            else if (msg.reward.type === 'spin') { btnText = `🎡 Claim ${msg.reward.value} Free Spins`; btnColor = 'from-blue-500 to-cyan-600'; }

            actionBtn = `<button onclick="claimReward(${msg.id})" class="w-full mt-8 py-4 bg-gradient-to-r ${btnColor} hover:brightness-110 text-white font-bold rounded-xl shadow-lg animate-pulse transition-transform active:scale-95 text-lg">${btnText}</button>`;
        }
    }

    const icon = msg.type === 'reward' ? '🎁' : '📢';
    
    // 保留 emptyHint 元素，只替換其他內容
    const existingHint = document.getElementById('emptyHint');
    messageContentArea.innerHTML = `
        <div class="mb-8 animate-fadeInDown relative">
            <button onclick="deleteMessage(${msg.id})" class="absolute top-0 right-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors" title="Delete Message">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>

            <div class="flex items-center justify-between mb-4 pr-10">
                <div class="flex items-center gap-3">
                    <span class="text-4xl bg-purple-800/50 p-3 rounded-2xl border border-purple-500/30">${icon}</span>
                    <div><p class="text-purple-300 text-sm">From:</p><p class="text-white font-bold text-lg">${msg.sender}</p></div>
                </div>
                <p class="text-purple-400 text-sm bg-purple-950/50 px-3 py-1 rounded-full border border-purple-500/20">${msg.date}</p>
            </div>
            
            <h2 class="text-2xl md:text-3xl font-bold text-white mb-6 pb-4 border-b border-purple-500/30 leading-tight">${msg.title}</h2>
            
            <div class="prose prose-invert max-w-none text-purple-100 prose-p:text-purple-100 prose-headings:text-white prose-strong:text-yellow-300">
                ${msg.content}
            </div>
            ${actionBtn}
        </div>
    `;

    // 處理 RWD 視圖切換
    if (window.innerWidth < 768) {
        inboxView.classList.add('-translate-x-1/4', 'opacity-50');
        detailView.classList.remove('hidden', 'translate-x-full');
    } else {
        detailView.classList.remove('hidden');
        detailView.classList.remove('md:opacity-0', 'md:pointer-events-none');
    }
}

async function claimReward(id) {
    try {
        const res = await fetch(`${API_BASE}/mail/claim`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Success", "Reward claimed successfully!", "success");
            fetchMessages();
            setTimeout(() => openMessage(id), 500);
        } else {
            showToast("Error", data.error, "error");
        }
    } catch (e) { 
        showToast("Error", "Server Connection Failed", "error");
    }
}

async function deleteMessage(id) {
    if (!confirm("Are you sure you want to delete this message?")) return;

    const index = allMessages.findIndex(m => m.id === id);
    if (index > -1) allMessages.splice(index, 1);
    renderMessageList();
    backToInbox();

    try {
        await fetch(`${API_BASE}/mail/delete`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ id })
        });
        showToast("Deleted", "Message removed from inbox", "success");
    } catch (e) {
        console.error("Delete failed", e);
    }
}

// ===========================================
// 📺 UI 互動邏輯
// ===========================================

// FIX 1 & 2: 更新篩選按鈕樣式，同時處理桌機版與手機版的 filter-btn
function filterMessages(type) {
    currentFilter = type;

    // 找出所有帶有 filter-btn class 的按鈕（桌機 + 手機都會選到）
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.id === `btn-${type}`) {
            // Active 狀態
            btn.classList.remove('bg-white/5', 'text-purple-300', 'border', 'border-white/5', 'hover:bg-white/5');
            btn.classList.add('bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'text-white', 'shadow-md');
        } else {
            // Inactive 狀態
            btn.classList.remove('bg-gradient-to-r', 'from-purple-600', 'to-pink-600', 'text-white', 'shadow-md', 'bg-purple-600');
            btn.classList.add('bg-white/5', 'text-purple-300', 'border', 'border-white/5');
        }
    });

    if (allMessages.length === 0) fetchMessages();
    else renderMessageList();
}

function backToInbox() {
    inboxView.classList.remove('-translate-x-1/4', 'opacity-50');
    detailView.classList.add('translate-x-full');
    setTimeout(() => {
        detailView.classList.add('hidden');
        // FIX 3: 回到收件匣時顯示空白提示
        if (emptyHint) emptyHint.classList.remove('hidden');
    }, 300);
}

function showToast(title, message, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');

    titleEl.innerText = title;
    msgEl.innerText = message;
    
    if (type === 'success') {
        icon.innerText = '🎉';
        titleEl.className = "font-bold text-sm text-green-400";
        toast.querySelector('div').className = "bg-gray-800/95 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-green-500/50 min-w-[300px]";
    } else {
        icon.innerText = '❌';
        titleEl.className = "font-bold text-sm text-red-400";
        toast.querySelector('div').className = "bg-gray-800/95 backdrop-blur text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-red-500/50 min-w-[300px]";
    }

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function getSmartUser() {
    // 因為有 checkLogin，這裡理論上一定會拿到值
    return localStorage.getItem('currentUser') || 'Unknown User';
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

async function updateHeaderStatus() {
    const username = getSmartUser();
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (!avatarBtn || !dropdownContent) return; // 安全檢查

    if (username && !username.startsWith('Guest_') && username !== 'Guest') {
        const firstLetter = username.charAt(0).toUpperCase();
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-600 text-white relative";

        let unreadCount = 0;
        let weeklySpins = 0;

        try {
            // 同時檢查信箱與轉盤狀態
            const [mailRes, wheelRes] = await Promise.all([
                fetch(`${API_BASE}/mail?t=${Date.now()}`, { 
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } 
                }),
                fetch(`${API_BASE}/wheel/status`, { 
                    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } 
                })
            ]);

            if(mailRes.ok) {
                const msgs = await mailRes.json();
                unreadCount = msgs.filter(m => !m.read).length;
            }
            if(wheelRes.ok) {
                const wheelData = await wheelRes.json();
                weeklySpins = wheelData.weeklySpins || 0;
            }
        } catch(e) { console.error("Header status sync failed", e); }

        // 紅點顯示
        let avatarDotHtml = '';
        if (unreadCount > 0 || weeklySpins > 0) {
            avatarDotHtml = `
                <span class="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
                </span>`;
        }

        avatarBtn.innerHTML = firstLetter + avatarDotHtml;
        
        // 構建下拉選單
        let dropdownHtml = `
            <div class="px-4 py-3 border-b border-gray-700/50">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="text-sm font-bold text-white truncate">${username}</p>
            </div>`;
        
        if (weeklySpins > 0) {
            dropdownHtml += `
            <a href="wheel.html" class="block px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 hover:bg-yellow-500/20 transition-colors">
                <div class="flex items-center gap-2 text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
                    <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    New Reward
                </div>
                <p class="text-xs text-yellow-200/80 mt-0.5">Your ${weeklySpins} spins are ready!</p>
            </a>`;
        }

        dropdownHtml += `
            <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Profile
            </a>
            <a href="mail.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                System Inbox ${unreadCount > 0 ? `<span class="ml-auto bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">${unreadCount}</span>` : ''}
            </a>
            <div class="h-px bg-gray-700 my-1 mx-2"></div>
            <button onclick="handleLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Log Out
            </button>
        `;
        dropdownContent.innerHTML = dropdownHtml;
    }
}

// 🌍 全域綁定 (給 HTML onclick 使用)
window.fetchMessages = fetchMessages;
window.filterMessages = filterMessages;
window.backToInbox = backToInbox;
window.openMessage = openMessage;
window.claimReward = claimReward;
window.deleteMessage = deleteMessage;

// 🚀 初始化
window.addEventListener('DOMContentLoaded', () => {
    messageListContainer = document.getElementById('messageListContainer');
    messageContentArea = document.getElementById('messageContentArea');
    inboxView = document.getElementById('inboxView');
    detailView = document.getElementById('detailView');
    listStatus = document.getElementById('listStatus');
    emptyHint = document.getElementById('emptyHint'); // FIX 3: 快取空白提示元素

    updateHeaderStatus();
    setTimeout(fetchMessages, 100);
});

window.addEventListener('focus', () => {
    if (allMessages.length === 0) fetchMessages();
});

window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
        inboxView.classList.remove('-translate-x-1/4', 'opacity-50');
        detailView.classList.remove('hidden', 'translate-x-full');
        // FIX 3: 桌機版 resize 時，若內容為空則顯示空白提示
        if (messageContentArea.querySelector('.animate-fadeInDown') === null) {
            if (emptyHint) emptyHint.classList.remove('hidden');
        }
    } else {
        if (!detailView.classList.contains('hidden')) {
            inboxView.classList.add('-translate-x-1/4', 'opacity-50');
        }
    }
});