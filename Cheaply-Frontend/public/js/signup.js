// 🌍 1. 統一 API 基礎路徑
const API_BASE = 'https://api.cheaply.click/api';

// ===========================================
// ✨ 3. 動畫與特效系統
// ===========================================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    for(let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute rounded-full opacity-30 animate-float';
        const size = Math.random() * 6 + 2 + 'px';
        particle.style.width = size;
        particle.style.height = size;
        particle.style.backgroundColor = Math.random() > 0.5 ? '#fbbf24' : '#f472b6';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ===========================================
// 🔔 4. Toast 通知系統
// ===========================================
function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toast-notification');

    // FIX 1: 防呆必須在所有操作之前，原本 toast.querySelector('div') 在 if(!toast) 之前執行會直接 null 爆炸
    if (!toast) return;

    const container = toast.querySelector('div');
    const icon = document.getElementById('toast-icon');
    const titleEl = document.getElementById('toast-title');
    const msgEl = document.getElementById('toast-message');

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (type === 'success') {
        icon.innerText = '✅';
        titleEl.className = "font-bold text-sm text-green-400";
        if (container) container.className = "bg-gray-900/95 backdrop-blur border-l-4 border-green-500 text-white px-6 py-4 rounded-r-lg shadow-2xl flex items-center gap-4 min-w-[300px]";
    } else if (type === 'error') {
        icon.innerText = '❌';
        titleEl.className = "font-bold text-sm text-red-400";
        if (container) container.className = "bg-gray-900/95 backdrop-blur border-l-4 border-red-500 text-white px-6 py-4 rounded-r-lg shadow-2xl flex items-center gap-4 min-w-[300px]";
    } else {
        icon.innerText = 'ℹ️';
        titleEl.className = "font-bold text-sm text-purple-400";
        if (container) container.className = "bg-gray-900/95 backdrop-blur border-l-4 border-purple-500 text-white px-6 py-4 rounded-r-lg shadow-2xl flex items-center gap-4 min-w-[300px]";
    }

    toast.classList.remove('translate-x-full');
    setTimeout(() => toast.classList.add('translate-x-full'), 3000);
}

// ===========================================
// 🚀 5. Phantom 錢包連接邏輯
// ===========================================
async function connectPhantom() {
    const input = document.getElementById('walletInput');
    const btn = input.parentNode.querySelector('button');

    if (!window.solana || !window.solana.isPhantom) {
        showToast("Wallet Not Found", "Please install Phantom Wallet extension.", "error");
        setTimeout(() => window.open("https://phantom.app/", "_blank"), 1500);
        return;
    }

    try {
        btn.disabled = true;
        btn.innerHTML = '<svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

        const resp = await window.solana.connect();
        const address = resp.publicKey.toString();

        input.value = address;
        input.classList.add("text-green-400", "font-bold", "bg-purple-900/80");
        
        btn.innerText = "Connected";
        btn.classList.remove("bg-purple-700");
        btn.classList.add("bg-green-600");
        
        showToast("Connected!", "Wallet address retrieved.", "success");

    } catch (err) {
        console.error(err);
        btn.innerText = "Connect";
        btn.disabled = false;
        showToast("Connection Cancelled", "Request rejected by user.", "error");
    }
}

// ===========================================
// 📝 6. 表單驗證與 UI 互動
// ===========================================
function updateRuleUI(element, isValid, hasInput) {
    const defaultIcon = element.querySelector('.icon-default');
    const checkIcon = element.querySelector('.icon-check');
    const crossIcon = element.querySelector('.icon-cross');

    element.classList.remove('text-purple-300', 'req-valid', 'req-invalid');
    defaultIcon.classList.add('hidden');
    checkIcon.classList.add('hidden');
    crossIcon.classList.add('hidden');

    if (isValid) {
        element.classList.add('req-valid');
        checkIcon.classList.remove('hidden');
    } else if (hasInput) {
        element.classList.add('req-invalid');
        crossIcon.classList.remove('hidden');
    } else {
        element.classList.add('text-purple-300');
        defaultIcon.classList.remove('hidden');
    }
}

function clearServerError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorMsg = document.getElementById(fieldId + 'Error');
    if (!input) return;
    
    if (input.classList.contains('input-error')) {
        input.classList.remove('input-error', 'animate-shake');
        input.classList.add('border-purple-500/30');
    }
    if (errorMsg) errorMsg.classList.remove('show');
}

function showServerError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorMsg = document.getElementById(fieldId + 'Error');
    const errorText = document.getElementById(fieldId + 'ErrorText');

    if (!input) return showToast("Error", message, "error");

    input.classList.remove('border-purple-500/30');
    input.classList.add('input-error', 'animate-shake');
    
    if (errorMsg && errorText) {
        errorText.textContent = message;
        errorMsg.classList.add('show');
    } else {
        showToast("Error", message, "error");
    }
}

// ===========================================
// 📡 7. 註冊請求 (一鍵直接註冊)
// ===========================================
async function handleRegister(e) {
    e.preventDefault();
    
    let isValid = true;
    const elEmail = document.getElementById('email');
    const elName = document.getElementById('fullName');
    const elPass = document.getElementById('password');
    const elConfirm = document.getElementById('confirmPassword');
    const elTerms = document.getElementById('terms');
    const elTermsLabel = document.getElementById('termsLabel');
    const elTermsRow = document.getElementById('termsRow'); // FIX 2: 整個 row 的容器
    const elInvite = document.getElementById('inviteCode');
    const elWallet = document.getElementById('walletInput');
    const elIT = document.getElementById('it_bg');
    const btn = document.querySelector('button[type="submit"]');

    // 重置錯誤狀態
    [elEmail, elName, elPass, elConfirm].forEach(el => el.classList.remove('input-error', 'animate-shake'));
    
    // FIX 2: 重置 terms 的紅色視覺反饋（label + checkbox + row 外框）
    if (elTermsLabel) elTermsLabel.classList.remove('text-red-400', 'animate-shake');
    if (elTerms) elTerms.classList.remove('border-red-500');
    if (elTermsRow) elTermsRow.classList.remove('bg-red-900/10', 'border', 'border-red-500/30');

    clearServerError('email');
    clearServerError('fullName'); 

    const markError = (el) => {
        el.classList.add('input-error', 'animate-shake');
        el.addEventListener('input', function() { this.classList.remove('input-error'); }, { once: true });
    };

    // 1. 本地防呆驗證
    if (!elEmail.value.includes('@')) { markError(elEmail); isValid = false; }

    const nameVal = elName.value.trim();
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameVal) { 
        markError(elName); isValid = false; 
    } else if (!nameRegex.test(nameVal)) {
        markError(elName);
        const errText = document.getElementById('fullNameErrorText');
        if(errText) errText.textContent = "English & Numbers only";
        const errMsg = document.getElementById('fullNameError');
        if(errMsg) errMsg.classList.add('show');
        isValid = false;
    }

    const passVal = elPass.value;
    if (passVal.length < 8 || !(/[a-zA-Z]/.test(passVal) && /[0-9]/.test(passVal))) {
        markError(elPass); isValid = false;
    }

    if (passVal !== elConfirm.value || !elConfirm.value) { markError(elConfirm); isValid = false; }

    // FIX 2: Terms 驗證失敗時的完整視覺反饋
    // 原本只對 label 加 animate-shake，但 label 是 inline 元素，transform 不生效
    // 現在改為：
    //   a) elTermsLabel 已在 HTML 加了 inline-block → shake 動畫生效
    //   b) 同時對 checkbox 加紅色邊框
    //   c) 對整個 row 加紅色背景提示
    if (elTerms && !elTerms.checked) {
        if (elTermsLabel) {
            elTermsLabel.classList.add('text-red-400', 'animate-shake');
        }
        if (elTerms) {
            elTerms.classList.add('border-red-500');
        }
        if (elTermsRow) {
            elTermsRow.classList.add('bg-red-900/10', 'border', 'border-red-500/30');
        }

        // 勾選後自動清除所有紅色反饋
        const clearTermsError = () => {
            if (elTermsLabel) elTermsLabel.classList.remove('text-red-400', 'animate-shake');
            if (elTerms) elTerms.classList.remove('border-red-500');
            if (elTermsRow) elTermsRow.classList.remove('bg-red-900/10', 'border', 'border-red-500/30');
        };
        elTerms.addEventListener('change', clearTermsError, { once: true });

        isValid = false;
    }

    // 2. 發送 API 請求
    if (isValid) {
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="animate-pulse">Registering...</span>';

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: elEmail.value.trim(),
                    username: elName.value.trim(),
                    password: elPass.value,
                    inviteCode: elInvite ? elInvite.value.trim() : "",
                    walletAddress: elWallet ? elWallet.value.trim() : "",
                    itBackground: elIT ? elIT.checked : false
                })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Non-JSON response received");
                showToast("Server Error", "Invalid server response. Please check backend.", "error");
                btn.disabled = false;
                btn.innerHTML = originalText;
                return;
            }

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("Account Created!", "Redirecting to login...", "success");
                btn.classList.replace("bg-purple-600", "bg-green-500");
                btn.innerHTML = 'Success';
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                if (data.error && data.error.includes("Email")) showServerError('email', "Email already registered");
                else if (data.error && data.error.includes("Username")) showServerError('fullName', "Username taken");
                else if (data.error && data.error.includes("invitation")) showServerError('inviteCode', "Invalid invitation code");
                else showToast("Registration Failed", data.error || "Unknown error", "error");
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } catch (err) {
            console.error("Register network error:", err);
            showToast("Network Error", "Cannot connect to server.", "error");
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// ===========================================
// 🚀 8. 初始化事件監聽
// ===========================================
window.addEventListener('DOMContentLoaded', () => {
    initParticles();

    const elEmail = document.getElementById('email');
    if(elEmail) elEmail.addEventListener('input', () => clearServerError('email'));
    
    const elFullName = document.getElementById('fullName');
    if(elFullName) elFullName.addEventListener('input', () => clearServerError('fullName'));
    
    const elInvite = document.getElementById('inviteCode');
    if(elInvite) elInvite.addEventListener('input', () => clearServerError('inviteCode'));
    
    const passInput = document.getElementById('password');
    const ruleLength = document.getElementById('rule-length');
    const ruleAlphanum = document.getElementById('rule-alphanum');

    if (passInput) {
        passInput.addEventListener('input', function() {
            const val = this.value;
            const hasInput = val.length > 0;
            const isLengthValid = val.length >= 8;
            if(ruleLength) updateRuleUI(ruleLength, isLengthValid, hasInput);
            
            const isAlphanumValid = /[a-zA-Z]/.test(val) && /[0-9]/.test(val);
            if(ruleAlphanum) updateRuleUI(ruleAlphanum, isAlphanumValid, hasInput);
            
            if(this.classList.contains('input-error')) {
                this.classList.remove('input-error');
            }
        });
    }

    const form = document.getElementById('registerForm');
    if(form) form.addEventListener('submit', handleRegister);
    
    window.connectPhantom = connectPhantom;
});