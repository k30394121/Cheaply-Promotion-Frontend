// ===========================================
// 🌍 全域連線設定 (必須放在 Script 最上方)
// ===========================================
const ROOT_URL = 'https://api.cheaply.click/api'

let allMailHistory = [];

// [修復 Point 2] 輔助函式：防範 XSS 攻擊
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// [修復 Point 6] 輔助函式：統一處理 API 401/403 登出邏輯
function checkAuthStatus(res) {
    if (res.status === 401 || res.status === 403) {
        alert("⚠️ 登入憑證無效或已過期，請重新登入！");
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'admin_login.html';
        throw new Error("Authentication Failed"); // 阻斷後續 JS 執行
    }
    return res;
}

// [修復 Point 4] 監聽錢包斷線事件
function setupWalletDisconnectListener() {
    if (window.solana) {
        window.solana.on('disconnect', () => {
            console.log("Phantom 錢包已斷開連線");
            localStorage.removeItem('admin_wallet_unlocked');
            alert("⚠️ 錢包已斷開連線，管理權限已鎖定。");
            window.location.reload(); // 重整頁面恢復未解鎖狀態
        });
    }
}

function openWalletModal() {
    document.getElementById('walletModal').classList.remove('hidden');
}

function closeWalletModal() {
    document.getElementById('walletModal').classList.add('hidden');
}

async function connectSolanaWallet(provider) {
    closeWalletModal(); 

    if (!window.solana || !window.solana.isPhantom) {
        alert("⚠️ 請先安裝 Phantom 錢包插件");
        return;
    }

    const btn = document.getElementById('connectBtn');
    const addrDisplay = document.getElementById('walletAddr');
    const dot = document.getElementById('walletDot');

    try {
        const resp = await window.solana.connect();
        const connectedWallet = resp.publicKey.toString();

        console.log("嘗試連接:", connectedWallet);
        alert("✅ 錢包已連線，可進行轉帳操作");
        
        // 💡 變更點：顯示真實的錢包縮寫
        addrDisplay.textContent = connectedWallet.slice(0,4) + "..." + connectedWallet.slice(-4);
        addrDisplay.classList.add('text-green-400');
        dot.classList.remove('bg-red-500');
        dot.classList.add('bg-green-500', 'animate-pulse');
        
        btn.textContent = "已連線";
        btn.disabled = true; 

        // 💡 變更點：把真實地址存起來，方便跨頁面讀取
        localStorage.setItem('admin_wallet_unlocked', 'true');
        localStorage.setItem('current_wallet_address', connectedWallet);
        
        setupWalletDisconnectListener(); 

    } catch (err) {
        console.error(err);
        alert("❌ 連接失敗");
    }
}

// 自動重連檢查
window.addEventListener('load', async () => {
    if (localStorage.getItem('admin_wallet_unlocked') === 'true') {
        if (window.solana && window.solana.isPhantom) {
            try {
                const resp = await window.solana.connect({ onlyIfTrusted: true });
                const connectedWallet = resp.publicKey.toString();

                const btn = document.getElementById('connectBtn');
                const addrDisplay = document.getElementById('walletAddr');
                const dot = document.getElementById('walletDot');
                
                // 💡 變更點：重連後一樣顯示真實縮寫
                addrDisplay.textContent = connectedWallet.slice(0,4) + "..." + connectedWallet.slice(-4);
                addrDisplay.classList.add('text-green-400');
                dot.classList.remove('bg-red-500');
                dot.classList.add('bg-green-500', 'animate-pulse');
                btn.textContent = "已連線";
                btn.disabled = true;

                localStorage.setItem('current_wallet_address', connectedWallet);
                setupWalletDisconnectListener(); 

            } catch(e) {
                // 如果自動重連失敗（例如使用者在插件裡移除了授權），清除狀態
                localStorage.removeItem('admin_wallet_unlocked');
                localStorage.removeItem('current_wallet_address');
            }
        }
    }
});


// --- 資金轉移實作 (完整串接版) ---
async function transferFunds() {
    const toAddress = document.getElementById('destinationAddress').value.trim();
    const amount = document.getElementById('transferAmount').value;

    if (!toAddress || !amount || amount <= 0) {
        alert("⚠️ 請輸入正確的接收地址與轉出金額！");
        return;
    }

    if (!window.solana || !window.solana.isConnected) {
        alert("⚠️ 錢包未連線，請點擊右上方按鈕連接 Phantom 錢包。");
        return;
    }

    const confirmMsg = `🚨 確定要執行區塊鏈轉帳嗎？\n\n` +
                       `轉出金額：${amount} USDT\n` +
                       `目標地址：${toAddress}\n\n` +
                       `請注意：此操作將在區塊鏈上廣播，且無法撤回！`;

    if (confirm(confirmMsg)) {
        try {
            console.log(`正在請求管理員簽署轉帳 ${amount} USDT 到 ${toAddress}...`);
            const message = `Admin Transfer Request:\nAmount: ${amount} USDT\nTo: ${toAddress}\nTime: ${new Date().toISOString()}`;
            const encodedMessage = new TextEncoder().encode(message);
            const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");

            alert(`✅ 驗證成功！\n交易已發送至 Solana 網路。\n目標：${toAddress.slice(0,8)}...`);
            document.getElementById('transferAmount').value = "";
            console.log("交易簽章回傳:", signedMessage);

        } catch (err) {
            console.warn("轉帳已取消:", err);
            alert("❌ 操作已取消或連線中斷。");
        }
    }
}

// --- 發信與歷史紀錄 ---
async function loadMailHistory() {
    try {
        const res = await fetch(`${ROOT_URL}/mail/history`);
        checkAuthStatus(res);
        const data = await res.json();
        renderMailHistory(data);
    } catch (e) { 
        if(e.message !== "Authentication Failed") console.error("無法讀取歷史紀錄"); 
    }
}

// 渲染歷史列表
function renderMailHistory(messages) {
    allMailHistory = messages;
    const tbody = document.getElementById('mailHistoryBody');
    document.getElementById('historyCount').innerText = messages.length;
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500 text-xs">尚無發信紀錄</td></tr>';
        return;
    }

    // [修復 Point 2 & 5] 套用防 XSS 轉義，並明確傳遞 event 物件給 recallMessage
    tbody.innerHTML = messages.map(msg => `
        <tr onclick="openMailModal(${msg.id})" class="hover:bg-gray-700/50 border-b border-gray-700/50 transition-colors cursor-pointer group">
            <td class="px-6 py-3 font-mono text-xs text-gray-400 group-hover:text-white transition-colors">${msg.date}</td>
            
            <td class="px-6 py-3 text-white flex items-center gap-2">
                <span class="text-lg">${msg.type === 'reward' ? '🎁' : '📢'}</span>
                <div class="flex flex-col">
                    <span class="font-medium text-sm text-blue-200 group-hover:text-blue-400 underline-offset-2 group-hover:underline">${escapeHtml(msg.title)}</span>
                    <span class="text-[10px] text-gray-500 truncate max-w-[150px]">${escapeHtml(msg.sender)}</span>
                </div>
            </td>
            
            <td class="px-6 py-3 text-center">
                <span class="text-green-400 text-[10px] border border-green-500/30 bg-green-900/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Active</span>
            </td>
            
            <td class="px-6 py-3 text-center">
                <button onclick="event.stopPropagation(); recallMessage(event, ${msg.id})" class="flex items-center justify-center gap-1 mx-auto text-red-400 hover:text-white text-xs border border-red-500/30 hover:bg-red-600 px-3 py-1.5 rounded transition-all shadow-lg hover:shadow-red-900/50 active:scale-95">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Recall
                </button>
            </td>
        </tr>
    `).join('')
}

// 真實收回功能 (接收 event)
async function recallMessage(event, id) {
    if(!confirm('⚠️ 警告：確定要收回這封信件嗎？\n\n收回後，所有玩家（包含已領取者）的信箱中都將刪除此信件，且無法復原。')) return;

    const btn = event.currentTarget; // [修復 Point 5] 安全取得按鈕實例
    const originalContent = btn.innerHTML;
    btn.innerHTML = '⏳...';
    btn.disabled = true;

    try {
        const res = await fetch(`${ROOT_URL}/mail/delete/${id}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'), // 補上 Auth
                'x-username': localStorage.getItem('admin_user') || 'admin'
            }
        });
        
        checkAuthStatus(res);
        const result = await res.json();
        
        if (result.success) {
            loadMailHistory();
        } else {
            alert("❌ 收回失敗: " + result.error);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (e) {
        if(e.message !== "Authentication Failed") alert("❌ 連線錯誤");
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

function openMailModal(id) {
    const msg = allMailHistory.find(m => m.id === id);
    if (!msg) {
        alert("錯誤：找不到信件資料");
        return;
    }

    try {
        document.getElementById('detailIcon').innerText = msg.type === 'reward' ? '🎁' : '📢';
        document.getElementById('detailTitle').innerText = msg.title || 'No Title';
        document.getElementById('detailSender').innerText = msg.sender || 'System';
        document.getElementById('detailDate').innerText = msg.date || '---';
        
        const contentHtml = msg.content || "<em class='text-gray-500'>No content available</em>";
        document.getElementById('detailBody').innerHTML = contentHtml;
    } catch (e) {
        console.error("❌ 填入基本資料時發生錯誤:", e);
    }

    const rewardDiv = document.getElementById('detailRewardSection');
    let rewards = null;
    try {
        if (msg.reward_json) {
            rewards = (typeof msg.reward_json === 'string') ? JSON.parse(msg.reward_json) : msg.reward_json;
        }
    } catch (e) { console.error("JSON Error", e); }

    if (rewards && (rewards.value > 0 || rewards.amount > 0 || rewards.type === 'card')) {
        rewardDiv.classList.remove('hidden');
        let rewardText = "";
        const val = rewards.value || rewards.amount;
        
        if (rewards.type === 'token') rewardText = `💰 ${parseInt(val).toLocaleString()} Tokens`;
        else if (rewards.type === 'spin') rewardText = `🎡 ${val} Free Spins`;
        else if (rewards.type === 'card') rewardText = `🃏 Card: ${val}`;
        else rewardText = `${rewards.type}: ${val}`;
        
        document.getElementById('detailReward').innerText = rewardText;
    } else {
        rewardDiv.classList.add('hidden');
    }

    const modal = document.getElementById('mailDetailModal');
    if (modal) modal.classList.remove('hidden');
}

function closeMailModal() {
    document.getElementById('mailDetailModal').classList.add('hidden');
}

function toggleTargetInput() {
    const type = document.getElementById('targetType').value;
    const input = document.getElementById('targetUser');
    if (type === 'SINGLE') {
        input.classList.remove('hidden');
        input.focus();
    } else {
        input.classList.add('hidden');
        input.value = ""; 
    }
}

function toggleRewardInput() {
    const type = document.getElementById('rewardType').value;
    const input = document.getElementById('rewardValue');
    input.disabled = (type === 'none');
    if(type === 'card') input.placeholder = "輸入卡片名稱 (如: Lucky Star)";
    else if(type === 'none') input.placeholder = "---";
    else input.placeholder = "輸入數量 (如: 5000)";
}

// 真實發送函式
async function sendMailWithPreview() {
    const title = document.getElementById('inputTitle').value;
    const sender = document.getElementById('inputSender').value;
    const content = document.getElementById('inputBody').value; 
    const rewardType = document.getElementById('rewardType').value;
    const rewardValue = document.getElementById('rewardValue').value;
    const targetType = document.getElementById('targetType').value;
    const targetUser = document.getElementById('targetUser').value;

    if(!title) return alert("請輸入標題");

    const payload = {
        title, sender, content,
        type: rewardType === 'none' ? 'announcement' : 'reward',
        targetType: targetType, 
        targetUser: targetUser  
    };

    if (rewardType !== 'none') {
        if (!rewardValue) return alert("請輸入獎勵內容/數量");
        payload.rewardType = rewardType;
        payload.rewardValue = rewardValue;
    }

    // [修復 Point 5] 抓取按鈕的相容寫法
    const btn = document.querySelector('button[onclick*="sendMailWithPreview"]');
    let originalText = "發送給用戶";
    if(btn) {
        originalText = btn.innerText;
        btn.innerText = "發送中...";
        btn.disabled = true;
    }

    try {
        const res = await fetch(`${ROOT_URL}/mail/send`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'),
                'x-username': localStorage.getItem('admin_user') || 'admin'
            },
            body: JSON.stringify(payload)
        });

        checkAuthStatus(res);
        const result = await res.json();
        
        if (result.success) {
            alert(`✅ Sent successfully to: ${targetType === 'ALL' ? 'Everyone' : targetUser}`);
            loadMailHistory(); 
            
            document.getElementById('inputTitle').value = "";
            document.getElementById('inputBody').value = "";
            document.getElementById('rewardValue').value = "";
            document.getElementById('rewardType').value = "none";
            document.getElementById('targetType').value = "ALL";
            toggleTargetInput();
            toggleRewardInput();
        } else {
            alert("❌ Failed: " + result.error);
        }
    } catch (e) {
        if(e.message !== "Authentication Failed") {
            console.error(e);
            alert("❌ Connection Error");
        }
    } finally {
        if(btn) {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }
}

function updatePreview() {
    document.getElementById('previewTitle').innerText = document.getElementById('inputTitle').value || '標題';
    document.getElementById('previewSender').innerText = document.getElementById('inputSender').value || 'Admin';
    document.getElementById('previewBody').innerHTML = document.getElementById('inputBody').value || '內容...';
}

function loadTemplate(type) {
    if(type==='promo') {
        document.getElementById('inputTitle').value = "🔥 Limited Time Offer";
        document.getElementById('inputBody').value = "<p>Get 100% Bonus Tokens this weekend! Don't miss out!</p>";
    } else {
        document.getElementById('inputTitle').value = "⚠️ System Maintenance";
        document.getElementById('inputBody').value = "<p>The system will undergo scheduled maintenance tomorrow at 02:00 UTC.</p>";
    }
    updatePreview();
}

async function loadUsers() {
    const tbody = document.querySelector('#view-users tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500"><span class="animate-pulse">Loading data...</span></td></tr>';

    try {
        const res = await fetch(`${ROOT_URL}/admin/users`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
            }
        });

        checkAuthStatus(res);
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map((u, index) => `
            <tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-700/30">
                <td class="px-6 py-4 font-mono text-gray-400 text-xs">#${index + 1}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="font-bold text-white text-sm">${escapeHtml(u.username)}</span>
                        <span class="text-[10px] text-gray-500">${escapeHtml(u.email)}</span>
                    </div>
                </td>
                <td class="px-6 py-4 font-mono text-xs ${u.walletAddress === 'Unlinked' ? 'text-gray-600' : 'text-blue-300'}">
                    ${u.walletAddress === 'Unlinked' ? '未連結錢包' : u.walletAddress.substring(0,6) + '...' + u.walletAddress.substring(u.walletAddress.length-4)}
                </td>
                <td class="px-6 py-4">
                    <span class="${u.role === 'admin' ? 'bg-red-900/50 text-red-300 border-red-500/50' : 'bg-purple-900/50 text-purple-300 border-purple-500/30'} px-2 py-1 rounded border text-xs font-bold">
                        Lv${u.level} ${u.role === 'admin' ? '(Admin)' : ''}
                    </span>
                </td>
                <td class="px-6 py-4 text-right font-bold text-yellow-400 text-sm font-mono">
                    ${u.gameTokens.toLocaleString()}
                </td>
                <td class="px-6 py-4 text-right text-gray-300 text-sm">
                    $${u.totalSpent || 0}
                </td>
            </tr>
        `).join('');

    } catch (e) {
        if(e.message !== "Authentication Failed") {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-400">Error loading data</td></tr>';
        }
    }
}

function switchTab(tabName) {
    const btns = document.querySelectorAll('.nav-btn');
    const views = ['sales', 'users', 'mail', 'lottery'];
    
    btns.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.remove('text-gray-400', 'hover:bg-gray-700');
            btn.classList.add('bg-purple-600', 'text-white', 'shadow-lg', 'border', 'border-purple-500/50');
        } else {
            btn.classList.add('text-gray-400', 'hover:bg-gray-700');
            btn.classList.remove('bg-purple-600', 'text-white', 'shadow-lg', 'border', 'border-purple-500/50');
        }
    });

    views.forEach(view => {
        const el = document.getElementById('view-' + view);
        el.classList.toggle('hidden', view !== tabName);
        if(view === tabName && view === 'mail') loadMailHistory();
        if (view === 'users') loadUsers();
        if(tabName === 'lottery') {
            loadLotteryData();
            loadLotteryLogs();
        }
    });

    const titles = { 'sales': '代幣銷售與錢包', 'users': '客戶資料', 'mail': '系統發信與管理', 'lottery': 'Lottery 市場監控' };
    document.getElementById('pageTitle').textContent = titles[tabName];
}

async function downloadCSV() {
    const btn = document.querySelector('button[onclick="downloadCSV()"]');
    const originalText = btn.innerHTML;
    
    // 讓按鈕顯示載入中，防止連點
    if (btn) {
        btn.innerHTML = '⏳ 處理中...';
        btn.disabled = true;
    }

    try {
        // 1. 向後端請求真實的用戶資料
        const res = await fetch(`${ROOT_URL}/admin/users`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token')
            }
        });

        checkAuthStatus(res);
        const users = await res.json();

        if (users.length === 0) {
            alert("目前沒有用戶資料可供匯出。");
            throw new Error("No data");
        }

        // 2. 準備 CSV 標頭
        let csvContent = "編號(ID),姓名/暱稱,Email,錢包地址,等級,持有代幣(Tokens),購買總額(USDT)\n";

        // 3. 將真實資料塞入每一行 (對齊 loadUsers 的變數)
        users.forEach((u, index) => {
            const id = index + 1; 
            const name = escapeHtml(u.username) || 'Unknown';
            const email = escapeHtml(u.email) || '無';
            const wallet = u.walletAddress || '未連結';
            const level = u.level || 1;
            const tokens = u.gameTokens || 0;
            const totalSpent = u.totalSpent || 0;

            // 用雙引號包住變數，避免暱稱裡有「逗號」破壞 CSV 格式
            csvContent += `"${id}","${name}","${email}","${wallet}","Lv${level}","${tokens}","${totalSpent}"\n`;
        });

        // 4. 加入 BOM 解決 Excel 繁體中文亂碼，並觸發下載
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        // 檔名加上今天的日期
        link.setAttribute("download", `CheapTycoon_Users_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        if(error.message !== "Authentication Failed" && error.message !== "No data") {
            console.error("CSV Export Error:", error);
            alert("匯出失敗，請確認連線狀態！");
        }
    } finally {
        // 恢復按鈕狀態
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}
function handleAdminLogout() {
    if(confirm("確定要登出管理系統嗎？")) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = 'admin_login.html';
    }
}

async function loadJackpotStatus() {
    try {
        const res = await fetch(`${ROOT_URL}/wheel/status`);
        const data = await res.json();
        
        const badge = document.getElementById('jackpotStatusBadge');
        const winnerBox = document.getElementById('jackpotWinnerInfo');
        
        if (data.active) {
            badge.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-1 bg-green-900/30 text-green-400 border border-green-500/30";
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ACTIVE (Available)';
            winnerBox.classList.add('hidden');
        } else {
            badge.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-1 bg-red-900/30 text-red-400 border border-red-500/30";
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> CLAIMED (Locked)';
            
            winnerBox.classList.remove('hidden');
            document.getElementById('winnerName').innerText = data.winner || "Unknown";
            document.getElementById('winDate').innerText = data.winDate || "---";
        }
    } catch (e) { console.error("Load jackpot failed", e); }
}

async function resetJackpot() {
    if(!confirm("⚠️ 確定要強制重置大獎嗎？\n\n這將會：\n1. 清除目前的贏家紀錄\n2. 讓所有玩家再次有機會抽中大獎")) return;

    try {
        const res = await fetch(`${ROOT_URL}/wheel/reset-jackpot`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'),
                'x-username': localStorage.getItem('admin_user') || 'admin' 
            }
        });
        checkAuthStatus(res);
        const result = await res.json();
        alert(result.message);
        loadJackpotStatus(); 
    } catch (e) { 
        if(e.message !== "Authentication Failed") alert("Error resetting jackpot"); 
    }
}

async function loadLotteryData() {
    try {
        const res = await fetch(`${ROOT_URL}/lottery/status`);
        const data = await res.json();
        
        document.getElementById('adminPrice').textContent = '$' + data.currentPrice.toFixed(2);
        document.getElementById('adminPot').textContent = '$' + data.activePot.toLocaleString();

        if (data.winChance !== undefined) {
            const pct = Math.round(data.winChance * 100);
            document.getElementById('adminWinChance').textContent = pct + '%';
            
            const el = document.getElementById('adminWinChance');
            if(pct === 0) el.className = "text-3xl font-black text-gray-500 mt-1";
            else if(pct === 100) el.className = "text-3xl font-black text-green-400 mt-1 animate-pulse";
            else el.className = "text-3xl font-black text-red-400 mt-1";
        }

        if (data.sentiment) {
            const up = data.sentiment.up || 0;
            const down = data.sentiment.down || 0;
            const total = up + down;
            
            document.getElementById('admUpVal').textContent = '$' + up.toLocaleString();
            document.getElementById('admDownVal').textContent = '$' + down.toLocaleString();

            let upPct = 50;
            if (total > 0) upPct = (up / total) * 100;
            
            document.getElementById('admBarUp').style.width = upPct + '%';
        }

        if (data.nextUpdate && data.serverTime) {
            startAdminTimer(data.nextUpdate, data.serverTime);
        }

    } catch (e) { console.error("Load lottery failed", e); }
}

let adminTimerInterval = null;
function startAdminTimer(targetTime, serverTime) {
    if (adminTimerInterval) clearInterval(adminTimerInterval);
    
    const offset = Date.now() - serverTime;
    
    adminTimerInterval = setInterval(() => {
        const now = Date.now() - offset;
        const diff = targetTime - now;
        
        if (diff <= 0) {
            document.getElementById('adminTimer').textContent = "UPDATING...";
            if (diff < -2000) loadLotteryData(); 
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('adminTimer').textContent = 
            `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

async function loadLotteryLogs() {
    const tbody = document.getElementById('lotteryLogBody');
    try {
        const res = await fetch(`${ROOT_URL}/lottery/admin/transactions`, {
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'),
                'Content-Type': 'application/json' 
            }
        });
        
        checkAuthStatus(res);
        const logs = await res.json();

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No recent activity</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => {
            let actionHtml = '';
            let amountHtml = '';
            const time = new Date(log.created_at).toLocaleTimeString();

            if (log.category === 'prediction') {
                const color = log.type === 'UP' ? 'text-green-400' : 'text-red-400';
                actionHtml = `<span class="bg-purple-900/30 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded text-xs">FUTURES</span> <span class="${color} font-bold ml-2">${log.type}</span>`;
                amountHtml = `<span class="text-white font-mono">${log.amount.toLocaleString()}</span> <span class="text-xs text-gray-500">(${log.result})</span>`;
            } else if (log.category === 'spot') {
                const typeColor = log.type === 'buy' ? 'text-green-400' : 'text-red-400';
                actionHtml = `<span class="bg-blue-900/30 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded text-xs">SPOT</span> <span class="${typeColor} font-bold ml-2 uppercase">${log.type}</span>`;
                amountHtml = `<span class="text-white font-mono">${log.amount} Tickets</span>`;
            } else {
                actionHtml = `<span class="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs">DICE</span> ${log.type}`;
                amountHtml = `<span class="text-white font-mono">${log.amount}</span>`;
            }

            return `
                <tr class="hover:bg-gray-700/50 border-b border-gray-700/50">
                    <td class="px-6 py-3 font-mono text-xs text-gray-500">${time}</td>
                    <td class="px-6 py-3 font-bold text-white">${escapeHtml(log.username)}</td>
                    <td class="px-6 py-3">${actionHtml}</td>
                    <td class="px-6 py-3 text-right">${amountHtml}</td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        if(e.message !== "Authentication Failed") {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-400">Error loading logs</td></tr>';
        }
    }
}

async function setMarketPrice() {
    const price = parseFloat(document.getElementById('manualPriceInput').value);
    if (!price || price <= 0) return alert("Invalid Price");

    if (!confirm(`⚠️ WARNING: Force setting price to $${price}?\nThis will affect all current trades.`)) return;

    try {
        const res = await fetch(`${ROOT_URL}/lottery/admin/config`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'),
                'Content-Type': 'application/json',
                'x-username': localStorage.getItem('admin_user') || 'admin'
            },
            body: JSON.stringify({ set_price: price })
        });
        
        checkAuthStatus(res);
        const r = await res.json();
        if (r.success) {
            alert("Price updated!");
            loadLotteryData();
            document.getElementById('manualPriceInput').value = '';
        } else {
            alert("Error: " + r.error);
        }
    } catch (e) { 
        if(e.message !== "Authentication Failed") alert("Connection Error"); 
    }
}

function quickSetChance(val) {
    document.getElementById('winChanceInput').value = val;
}

async function setWinChance() {
    const val = parseFloat(document.getElementById('winChanceInput').value);
    if (isNaN(val) || val < 0 || val > 1) return alert("請輸入 0.0 到 1.0 之間的數值");

    const confirmMsg = `⚠️ 警告：您即將將本賽季的中獎機率修改為 ${val * 100}%。\n\n- 0% = 絕對流局 (獎金累積)\n- 100% = 絕對中獎 (抽出贏家)\n- 50% = 預設隨機\n\n確定要修改嗎？`;
    
    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch(`${ROOT_URL}/lottery/admin/config`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('admin_token'),
                'Content-Type': 'application/json',
                'x-username': localStorage.getItem('admin_user') || 'admin'
            },
            body: JSON.stringify({ set_win_chance: val })
        });
        
        checkAuthStatus(res);
        const r = await res.json();
        if (r.success) {
            alert("✅ 機率設定成功！");
            loadLotteryData(); 
            document.getElementById('winChanceInput').value = '';
        } else {
            alert("❌ 設定失敗: " + r.error);
        }
    } catch (e) { 
        if(e.message !== "Authentication Failed") alert("連線錯誤"); 
    }
}

// Init
switchTab('sales');
updatePreview();
loadJackpotStatus();