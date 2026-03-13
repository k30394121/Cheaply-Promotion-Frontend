// 🌍 1. 統一 API 基礎路徑 (Nginx 轉發模式)
const API_BASE = 'https://api.cheaply.click/api';

// 🛡️ 2. 登入檢查 (立即執行)
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.replace('login.html');
}

// ===========================================
// 🛠️ 頁面邏輯變數
// ===========================================
let allPlayers = [];
let displayedCount = 0;
let loading = false;

// ===========================================
// 📡 資料獲取 API
// ===========================================
async function fetchLeaderboard() {
    try {
        const res = await fetch(`${API_BASE}/leaderboard`, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (res.status === 401 || res.status === 403) {
            console.warn("Auth token invalid, viewing as guest or limited access");
        }

        if (!res.ok) throw new Error("Network response was not ok");
        
        const data = await res.json();
        
        allPlayers = data.map(user => ({
            rank: user.rank,
            name: user.username,
            id: user.walletAddress && user.walletAddress !== "Not Connected" && user.walletAddress !== "Unlinked"
                ? user.walletAddress.substring(0, 6) + '...' + user.walletAddress.slice(-4) 
                : 'No-Wallet', 
            tokens: user.gameTokens,
            isUser: user.username === currentUser
        }));

        return allPlayers;

    } catch (error) {
        console.error("Failed to load leaderboard:", error);
        const loadingEl = document.getElementById('loading');
        if(loadingEl) loadingEl.innerHTML = '<p class="text-red-400">Failed to load rankings. <br> Please check your connection.</p>';
        return [];
    }
}

// ===========================================
// 🎨 UI 輔助樣式函式
// ===========================================
function getRankColor(rank) {
    if(rank === 1) return 'from-yellow-500/60 to-orange-600/60 border-yellow-400 shadow-xl shadow-yellow-500/40 bg-yellow-900/20';
    if(rank === 2) return 'from-gray-400/60 to-gray-600/60 border-gray-300 shadow-xl shadow-gray-400/30 bg-gray-800/20';
    if(rank === 3) return 'from-orange-500/60 to-red-600/60 border-orange-400 shadow-xl shadow-orange-500/30 bg-orange-900/20';
    return 'from-purple-600/50 to-purple-700/50 border-purple-400/70 hover:border-purple-300 hover:shadow-lg bg-purple-900/30';
}

function getRankIcon(rank) {
    if(rank === 1) return `<div class="text-3xl">🥇</div>`;
    if(rank === 2) return `<div class="text-3xl">🥈</div>`;
    if(rank === 3) return `<div class="text-3xl">🥉</div>`;
    return `<span class="text-white font-bold text-lg drop-shadow-md">#${rank}</span>`;
}

function getAvatarColor(rank) {
    if(rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-2 border-yellow-300';
    if(rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white border-2 border-gray-200';
    if(rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white border-2 border-orange-300';
    return 'bg-gradient-to-br from-purple-500 to-purple-700 text-white border-2 border-purple-400';
}

// ===========================================
// 📺 列表渲染邏輯
// ===========================================
function displayPlayers(startIndex, count) {
    const playersList = document.getElementById('playersList');
    const endIndex = Math.min(startIndex + count, allPlayers.length);

    for(let i = startIndex; i < endIndex; i++) {
        const player = allPlayers[i];
        const playerDiv = document.createElement('div');
        
        const highlightClass = player.isUser ? 'ring-4 ring-yellow-300 shadow-2xl shadow-yellow-400/50 scale-[1.02] z-10 relative' : '';
        
        playerDiv.className = `bg-gradient-to-r rounded-xl p-4 border-2 transition-all duration-300 ${getRankColor(player.rank)} ${highlightClass} backdrop-blur-sm`;
        playerDiv.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-12 text-center flex-shrink-0">
                    ${getRankIcon(player.rank)}
                </div>
                <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${getAvatarColor(player.rank)} shadow-lg">
                    ${player.name.charAt(0).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-white font-semibold text-lg truncate drop-shadow-md">
                        ${player.name}
                        ${player.isUser ? '<span class="text-yellow-300 text-sm ml-2 font-bold animate-pulse">★ YOU ★</span>' : ''}
                    </div>
                    <div class="text-purple-200 text-sm truncate font-mono">${player.id}</div>
                </div>
                <div class="text-right flex-shrink-0">
                    <div class="text-yellow-300 font-bold text-xl drop-shadow-lg">${player.tokens.toLocaleString()}</div>
                    <div class="text-purple-200 text-sm font-medium">tokens</div>
                </div>
            </div>
        `;
        playersList.appendChild(playerDiv);
    }

    displayedCount = endIndex;
    
    if(displayedCount >= allPlayers.length) {
        document.getElementById('endMessage').classList.remove('hidden');
    }
}

// FIX 1 & 2: 改用 getElementById 取代不穩定的 querySelector class 鏈
function updateUserRankDisplay() {
    const userPlayer = allPlayers.find(p => p.isUser);
    
    const rankBadge  = document.getElementById('myRankBadge');
    const avatar     = document.getElementById('myAvatar');
    const nameDisplay  = document.getElementById('myName');
    const idDisplay    = document.getElementById('myWallet');
    const tokensDisplay = document.getElementById('myTokens');
    
    if (userPlayer) {
        if (rankBadge)     rankBadge.innerHTML = `<span class="text-white font-bold text-sm md:text-lg drop-shadow-md">#${userPlayer.rank}</span>`;
        if (avatar)        avatar.textContent = userPlayer.name.charAt(0).toUpperCase();
        if (nameDisplay)   nameDisplay.textContent = userPlayer.name;
        if (idDisplay)     idDisplay.textContent = userPlayer.id;
        if (tokensDisplay) tokensDisplay.textContent = userPlayer.tokens.toLocaleString();
    } else {
        if (nameDisplay)   nameDisplay.textContent = currentUser || "Guest";
        if (tokensDisplay) tokensDisplay.textContent = "0";
        if (rankBadge)     rankBadge.innerHTML = `<span class="text-white font-bold text-sm md:text-lg drop-shadow-md">NR</span>`;
        if (idDisplay)     idDisplay.textContent = "Updating...";
    }
}

// ===========================================
// 🔄 滾動載入邏輯
// ===========================================
function handleScroll() {
    const content = document.getElementById('leaderboardContent');
    const loadMore = document.getElementById('loadMore');
    
    const scrollTop = content.scrollTop;
    const scrollHeight = content.scrollHeight;
    const clientHeight = content.clientHeight;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    
    if(distanceToBottom <= 300 && displayedCount < allPlayers.length && !loading) {
        loading = true;
        loadMore.classList.remove('hidden');
        
        setTimeout(() => {
            displayPlayers(displayedCount, 20);
            loadMore.classList.add('hidden');
            loading = false;
        }, 500);
    }
}

// ===========================================
// 🚀 初始化
// ===========================================
window.addEventListener('DOMContentLoaded', async () => {
    const loadingDiv = document.getElementById('loading');
    const playersList = document.getElementById('playersList');
    const content = document.getElementById('leaderboardContent');
    
    await fetchLeaderboard();
    
    if(loadingDiv) loadingDiv.classList.add('hidden');
    if(playersList) playersList.classList.remove('hidden');
    
    updateUserRankDisplay();
    displayPlayers(0, 20);
    
    if(content) content.addEventListener('scroll', handleScroll);
});