// ⚠️ 注意：在瀏覽器環境中，你需要確保 Manifest SDK 已經透過打包工具或 <script> 引入
// 假設 ManifestClient, OrderType 已可被存取 (例如 window.ManifestClient 或透過 import 打包)

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


// ==========================================
// ⚙️ 區塊鏈設定區
// ==========================================
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; 
const PROMO_PRICE = 0.25;
const RATE_GAME_PER_USDC = 40000;
const RATE_PROMO_RATIO = 0.0001; 
const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=e643fac0-76ad-43c6-98cf-61bcf83b8424";

// ==========================================
// 🛠️ 全域變數
// ==========================================
let userWalletAddress = null;
let userUSDCBalance = 0;
let pendingTx = null;

let connection;
if (typeof solanaWeb3 !== 'undefined') {
    connection = new solanaWeb3.Connection(RPC_ENDPOINT, "confirmed");
}

// ==========================================
// 🚀 Web3 錢包邏輯
// ==========================================
async function connectWallet() {
    if (!window.solana || !window.solana.isPhantom) {
        showToast("Wallet Not Found", "Please install Phantom.", "error");
        window.open("https://phantom.app/", "_blank");
        return;
    }
    try {
        const resp = await window.solana.connect();
        userWalletAddress = resp.publicKey.toString();
        updateWalletUI(userWalletAddress);
        showToast("Connected", "Fetching USDC balance...", "success");
        await fetchRealUSDCBalance(resp.publicKey);
    } catch (err) {
        console.error(err);
        showToast("Error", "Connection cancelled", "error");
    }
}

function disconnectWallet() {
    if (window.solana) window.solana.disconnect();
    userWalletAddress = null;
    location.reload();
}

async function fetchRealUSDCBalance(publicKey) {
    try {
        const usdcMint = new solanaWeb3.PublicKey(USDC_MINT);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: usdcMint });
        if (tokenAccounts.value.length > 0) {
            const balanceInfo = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
            userUSDCBalance = balanceInfo.uiAmount;
        } else {
            userUSDCBalance = 0;
        }
        document.getElementById('usdcBalanceDisplay').innerText = "$" + userUSDCBalance.toLocaleString();
    } catch (e) {
        console.error("Balance fetch error:", e);
        document.getElementById('usdcBalanceDisplay').innerText = "$0.00";
    }
}

// ==========================================
// 💰 UI 邏輯與計算
// ==========================================
async function fetchServerBalance() {
    try {
        const res = await fetch(`${API_BASE}/shop/balance`, {
            headers: { 
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'x-username': localStorage.getItem('currentUser') 
            }
        });
        const data = await res.json();
        document.getElementById('serverGameTokens').textContent = data.gameTokens.toLocaleString();
        document.getElementById('serverPromoTokens').textContent = data.promoTokens.toLocaleString(undefined, {maximumFractionDigits: 4});
    } catch (e) { console.error("API Error", e); }
}

function calc(source) {
    const elUSDC = document.getElementById('customUSDC');
    const elGame = document.getElementById('customGameTokens');
    const elPromo = document.getElementById('customPromoTokens');
    const elBtn = document.getElementById('customBtn');

    let usdc = 0, game = 0, promo = 0;
    if (source === 'usdc') {
        usdc = parseFloat(elUSDC.value) || 0;
        game = Math.floor(usdc * RATE_GAME_PER_USDC);
    } 
    promo = game * RATE_PROMO_RATIO;
    
    elGame.value = game > 0 ? game : '';
    elPromo.value = promo > 0 ? promo.toFixed(1) : '';

    if (usdc > 0 && game > 0) {
        elBtn.disabled = false;
        elBtn.className = "w-full mt-6 md:mt-8 py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg transform hover:scale-[1.02] no-tap-highlight";
        const tokensDisplay = game >= 1000000 ? (game / 1000000).toFixed(1) + 'M' : game.toLocaleString();
        elBtn.textContent = `Buy ${tokensDisplay} for $${usdc.toFixed(2)}`;
    } else {
        elBtn.disabled = true;
        elBtn.className = "w-full mt-6 md:mt-8 py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 bg-slate-700 text-slate-500 cursor-not-allowed no-tap-highlight";
        elBtn.textContent = "Enter Amount to Purchase";
    }
}

function purchaseCustom() {
    const elUSDC = document.getElementById('customUSDC');
    const elGame = document.getElementById('customGameTokens');
    const usdc = parseFloat(elUSDC.value) || 0;
    const game = parseInt(elGame.value) || 0; 
    if (usdc > 0) {
        askConfirmation(0, game, usdc, parseFloat((game * RATE_PROMO_RATIO).toFixed(1)));
    }
}

function askConfirmation(pkgId, gameAmount, cost, promoAmount) {
    if (!userWalletAddress) {
        showToast("Wallet Required", "Please connect Phantom wallet first.", "error");
        connectWallet();
        return;
    }

    pendingTx = { pkgId, gameAmount, cost, promoAmount };

    document.getElementById('confirmCost').textContent = '$' + cost.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('confirmGame').textContent = gameAmount.toLocaleString();
    document.getElementById('confirmPromo').textContent = promoAmount.toLocaleString(undefined, {maximumFractionDigits: 4});

    const confirmBtn = document.getElementById('confirmBtn');
    const fundsWarning = document.getElementById('fundsWarning');
    const tosCheckbox = document.getElementById('tosCheckbox');

    tosCheckbox.checked = false;

    const updateButtonState = () => {
        const hasFunds = userUSDCBalance >= cost;
        const hasAgreedToS = tosCheckbox.checked;

        if (!hasFunds) {
            fundsWarning.classList.remove('hidden');
        } else {
            fundsWarning.classList.add('hidden');
        }

        // FIX 2: 同時切換背景色（綠色漸層 ↔ 灰色），不只改透明度
        if (hasFunds && hasAgreedToS) {
            confirmBtn.disabled = false;
            confirmBtn.className = "flex-1 py-2.5 md:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white rounded-xl text-sm md:text-base font-bold transition-all shadow-lg shadow-green-900/20 no-tap-highlight";
        } else {
            confirmBtn.disabled = true;
            confirmBtn.className = "flex-1 py-2.5 md:py-3 bg-slate-600 text-slate-400 rounded-xl text-sm md:text-base font-bold transition-all opacity-50 cursor-not-allowed no-tap-highlight";
        }
    };

    updateButtonState();
    tosCheckbox.onchange = updateButtonState;

    // FIX 1: modal 用 classList.remove('hidden') + add('flex') 取代初始靠 hidden+flex 並存
    const modal = document.getElementById('confirmModal');
    const content = document.getElementById('confirmContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-90', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    const content = document.getElementById('confirmContent');

    // FIX 4: 先播退場動畫，再隱藏 modal（有視覺縮小效果）
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-90', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300); // 等 transition-all duration-300 結束

    // FIX 3: Cancel 時同步清除 pendingTx，避免殘留舊方案資料
    pendingTx = null;
}

// ==========================================
// 🚀 核心邏輯：向後端請求交易並簽名
// ==========================================
async function confirmPurchase() {
    if (!pendingTx) return;

    // 儲存本次交易資料後立即關閉 modal
    const txSnapshot = { ...pendingTx };
    closeConfirmModal();

    // FIX 1: overlay 同樣用 remove('hidden') + add('flex')
    const overlay = document.getElementById('overlay');
    const overlayText = document.getElementById('overlayText');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    try {
        const userPubKey = new solanaWeb3.PublicKey(userWalletAddress);
        const promoAmount = txSnapshot.promoAmount; 
        const costUSDC = txSnapshot.cost;

        // ==========================================
        // 🛑 第一階段：檢查並執行開戶 (Setup)
        // ==========================================
        overlayText.innerText = "Checking Market Setup...";
        
        const setupRes = await fetch(`${API_BASE}/shop/prepare-setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: JSON.stringify({ userWallet: userWalletAddress })
        });
        const setupData = await setupRes.json();
        if (!setupRes.ok) throw new Error(setupData.error || "Failed to prepare setup transaction");

        if (setupData.setupNeeded) {
            overlayText.innerText = "Step 1/2: Initializing Account (Approve in Wallet)...";
            
            const txBuffer = Uint8Array.from(atob(setupData.transaction), c => c.charCodeAt(0));
            const setupTx = solanaWeb3.Transaction.from(txBuffer);
            const signedSetupTx = await window.solana.signTransaction(setupTx);
            
            if (setupData.wrapperSecret) {
                const secretKey = new Uint8Array(setupData.wrapperSecret);
                const wrapperKeypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
                signedSetupTx.partialSign(wrapperKeypair);
            }

            overlayText.innerText = "Step 1/2: Confirming Setup on Blockchain...";
            const setupSignature = await connection.sendRawTransaction(signedSetupTx.serialize());
            await connection.confirmTransaction(setupSignature, "confirmed");
            console.log("✅ 開戶交易完成！Signature:", setupSignature);
        }

        // ==========================================
        // 🛒 第二階段：請求入金與下單交易 (Order)
        // ==========================================
        const stepText = setupData.setupNeeded ? "Step 2/2: " : "";
        overlayText.innerText = `${stepText}Preparing Order...`;

        const orderRes = await fetch(`${API_BASE}/shop/prepare-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: JSON.stringify({ 
                promoAmount: promoAmount,
                costUSDC: costUSDC,
                userWallet: userWalletAddress 
            })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.error || "Failed to prepare order");

        overlayText.innerText = `${stepText}Placing Order (Approve in Wallet)...`;
        
        const orderTxBuffer = Uint8Array.from(atob(orderData.transaction), c => c.charCodeAt(0));
        const orderTx = solanaWeb3.Transaction.from(orderTxBuffer);
        const response = await window.solana.signAndSendTransaction(orderTx);
        const finalSignature = response.signature;

        overlayText.innerText = "Confirming Order on Solana...";
        await connection.confirmTransaction(finalSignature, "confirmed");

        // ==========================================
        // 🎁 第三階段：後端驗證與發放代幣
        // ==========================================
        overlayText.innerText = "Claiming Game Tokens...";
        const buyRes = await fetch(`${API_BASE}/shop/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            body: JSON.stringify({ txHash: finalSignature, expectedWeb2Amount: txSnapshot.gameAmount })
        });

        const buyData = await buyRes.json();

        const errorTranslations = {
            "此交易雜湊已使用過": "This transaction has already been claimed.",
            "在區塊鏈上找不到此交易": "Transaction not found on blockchain. Please wait and retry.",
            "交易發送者與綁定錢包不符": "Transaction signer does not match your linked wallet.",
            "交易已成功，但未在市場成交任何代幣（可能是價格變動太快）。": "Transaction succeeded but no tokens were filled (price may have moved). Please try again.",
            "驗證失敗": "Server verification failed. Please contact support."
        };

        if (buyRes.ok) {
            const gameDisplay = buyData.gameReward?.toLocaleString() ?? '?';
            const promoDisplay = buyData.receivedPromo?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? '?';
            showToast("Purchase Successful!", `+${gameDisplay} Game Tokens & +${promoDisplay} Promo Tokens`, "success");
            if (typeof confetti === 'function') confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
            fetchServerBalance();
            if (buyData.newBalance !== undefined) {
                document.getElementById('serverGameTokens').textContent = buyData.newBalance.toLocaleString();
            }
            fetchRealUSDCBalance(userPubKey);
            
            const customUSDC = document.getElementById('customUSDC');
            if (customUSDC) {
                customUSDC.value = '';
                document.getElementById('customGameTokens').value = '';
                document.getElementById('customPromoTokens').value = '';
                const customBtn = document.getElementById('customBtn');
                customBtn.disabled = true;
                customBtn.className = "w-full mt-6 md:mt-8 py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300 bg-slate-700 text-slate-500 cursor-not-allowed no-tap-highlight";
                customBtn.textContent = "Enter Amount to Purchase";
            }
        } else {
            const rawError = buyData.error || "Server verification failed.";
            throw new Error(errorTranslations[rawError] || rawError);
        }

    } catch (e) {
        showToast("Transaction Failed", e.message || "User rejected or network error.", "error");
        console.error("Purchase Flow Error:", e);
    } finally {
        // FIX 1: overlay 關閉也用 add('hidden') + remove('flex')
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        pendingTx = null;
    }
}

// ==========================================
// 🎨 UI 輔助功能
// ==========================================
function showToast(title, message, type) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    const icon = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const msgEl = document.getElementById('toast-message');
    const container = toast.querySelector('div');

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (type === 'success') {
        icon.innerText = '✅';
        titleEl.className = "font-bold text-xs md:text-sm text-green-400";
        container.className = "bg-gray-900/95 backdrop-blur border-l-4 border-green-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl flex items-center gap-3 md:gap-4 w-full md:min-w-[300px]";
    } else {
        icon.innerText = '❌';
        titleEl.className = "font-bold text-xs md:text-sm text-red-400";
        container.className = "bg-gray-900/95 backdrop-blur border-l-4 border-red-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl flex items-center gap-3 md:gap-4 w-full md:min-w-[300px]";
    }
    toast.classList.remove('translate-x-full');
    setTimeout(() => toast.classList.add('translate-x-full'), 3000);
}

function updateWalletUI(addr) {
    const connectBtn = document.getElementById('connectBtn');
    const walletDisplay = document.getElementById('walletDisplay');
    const walletAddress = document.getElementById('walletAddress');
    
    if (connectBtn) connectBtn.style.display = 'none';
    if (walletDisplay) {
        walletDisplay.classList.remove('hidden');
        walletDisplay.classList.add('flex');
    }
    if (walletAddress) walletAddress.innerText = addr.slice(0, 4) + '...' + addr.slice(-4);
}

// Global Bindings
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.calc = calc;
window.purchaseCustom = purchaseCustom;
window.askConfirmation = askConfirmation;
window.confirmPurchase = confirmPurchase;
window.closeConfirmModal = closeConfirmModal;

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
    fetchServerBalance();
    if (window.solana && window.solana.isPhantom) {
        try {
            const resp = await window.solana.connect({ onlyIfTrusted: true });
            userWalletAddress = resp.publicKey.toString();
            updateWalletUI(userWalletAddress);
            fetchRealUSDCBalance(resp.publicKey);
        } catch (e) {}
    }
});