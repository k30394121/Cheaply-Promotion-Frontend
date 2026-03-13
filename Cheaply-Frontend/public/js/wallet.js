// 🌍 統一 API 基礎路徑 (Nginx 轉發模式)
const API_BASE = 'https://api.cheaply.click/api';

// 🛡️ 立即執行：檢查登入狀態
(function checkLogin() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('currentUser');
    
    if (!token || !user) {
        alert("Please log in first!");
        window.location.replace('login.html');
    }
})();


/**
 * 連接錢包主函式
 * @param {string} walletType - 'phantom' | 'metamask' | 'solflare'
 */
async function connectWallet(walletType) {
    const statusMsg = document.getElementById('statusMsg');
    const walletBtns = document.querySelectorAll('.wallet-btn');
    
    // 1. UI 鎖定：避免重複點擊
    walletBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });

    // 2. 顯示連接中的狀態
    statusMsg.classList.remove('hidden');
    statusMsg.className = 'mt-6 p-4 bg-purple-900/50 rounded-xl border border-yellow-500/30 animate-pulse';
    statusMsg.innerHTML = `
        <div class="flex items-center justify-center gap-3 text-yellow-200">
            <svg class="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="font-bold tracking-wide">Requesting Connection...</span>
        </div>
    `;

    let address = null;

    try {
        // ==========================================
        // 🚀 A. 取得錢包地址 (Provider Logic)
        // ==========================================
        
        if (walletType === 'phantom' || walletType === 'solflare') {
            // --- Solana (Phantom / Solflare) ---
            // 檢查 window.solana 是否存在
            const provider = window.solana;
            
            if (!provider) {
                // 如果沒裝，嘗試導向下載頁面或拋錯
                window.open('https://phantom.app/', '_blank');
                throw new Error("Phantom wallet not found! Please install the extension.");
            }

            if (!provider.isPhantom) {
                throw new Error("Wallet provider is not Phantom.");
            }

            // 喚起視窗請求授權
            const resp = await provider.connect();
            address = resp.publicKey.toString();

        } else if (walletType === 'metamask') {
            // --- Ethereum (MetaMask) ---
            if (!window.ethereum) {
                window.open('https://metamask.io/', '_blank');
                throw new Error("MetaMask not found! Please install the extension.");
            }

            // 請求帳戶
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found.");
            }
            address = accounts[0];
        } else {
            throw new Error("Unsupported wallet type.");
        }

        // ==========================================
        // 💾 B. 後端存檔 (API Logic)
        // ==========================================
        
        if (address) {
            // 更新 UI：顯示存檔中
            statusMsg.className = 'mt-6 p-4 bg-blue-900/50 rounded-xl border border-blue-500/30';
            statusMsg.innerHTML = `
                <div class="flex items-center justify-center gap-3 text-blue-200">
                    <svg class="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="font-bold">Verifying & Saving...</span>
                </div>
            `;

            const token = localStorage.getItem('token');
            
            // 發送請求到 Nginx 代理的路徑
            const res = await fetch(`${API_BASE}/auth/bind-wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // 使用 JWT Token 驗證
                },
                body: JSON.stringify({ 
                    walletAddress: address,
                    walletType: walletType
                })
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || result.message || "Server rejected the binding.");
            }

            if (result.success) {
                // 🎉 C. 成功狀態
                statusMsg.className = 'mt-6 p-4 bg-green-900/50 rounded-xl border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]';
                statusMsg.innerHTML = `
                    <div class="flex flex-col items-center gap-2 text-green-200">
                        <div class="flex items-center gap-2">
                            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <span class="font-bold text-lg">Wallet Linked Successfully!</span>
                        </div>
                        <p class="text-xs opacity-75 font-mono">${address.slice(0, 6)}...${address.slice(-4)}</p>
                        <p class="text-sm mt-1 text-green-100">Redirecting to lobby...</p>
                    </div>
                `;
                
                // 本地快取 (非必要，但前端方便顯示)
                localStorage.setItem('user_wallet', address);
                
                // 延遲跳轉
                setTimeout(() => {
                    // 優先嘗試返回上一頁，否則回首頁
                    if (document.referrer && document.referrer.includes(window.location.host)) {
                        history.back();
                    } else {
                        window.location.href = 'wheel.html';
                    }
                }, 2000);
            }
        }

    } catch (err) {
        console.error("Wallet Error:", err);
        
        // ❌ D. 錯誤處理
        statusMsg.className = 'mt-6 p-4 bg-red-900/50 rounded-xl border border-red-500/30 shake-animation';
        statusMsg.innerHTML = `
            <div class="flex items-center justify-center gap-3 text-red-200">
                <svg class="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div class="text-left">
                    <p class="font-bold">Connection Failed</p>
                    <p class="text-xs opacity-80">${err.message || "Unknown error occurred"}</p>
                </div>
            </div>
        `;
        
        // 3秒後恢復按鈕狀態
        setTimeout(() => {
            walletBtns.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            });
        }, 3000);
    }
}