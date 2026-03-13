// 🌍 1. 統一 API 基礎路徑 (Nginx 轉發模式)
const API_BASE = 'https://api.cheaply.click/api';

// 🛡️ 2. 防止已登入用戶進入 (立即執行)
(function checkLogin() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        window.location.replace('wheel.html'); 
    }
})();

// ===========================================
// 🛠️ 狀態變數
// ===========================================
let currentEmail = '';
let verifiedCode = ''; 

// ===========================================
// ✨ 動畫特效邏輯
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
        particle.style.backgroundColor = Math.random() > 0.5 ? '#60a5fa' : '#a78bfa';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ===========================================
// 📧 Step 1: 發送驗證碼
// ===========================================
async function handleForgotSubmit(e) {
    e.preventDefault();
    const elEmail = document.getElementById('email');
    const elError = document.getElementById('errorMsg');
    const btn = document.querySelector('#forgotForm button');
    const email = elEmail.value.trim();

    elError.classList.add('hidden');
    elEmail.classList.remove('input-error', 'animate-shake');

    if (!email || !email.includes('@')) {
        elEmail.classList.add('input-error', 'animate-shake');
        return;
    }

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Sending...";

    try {
        const res = await fetch(`${API_BASE}/auth/forgot-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
            currentEmail = email;
            document.getElementById('displayEmail').textContent = email;
            document.getElementById('resetModal').classList.remove('hidden');
            
            // 重置 Modal 狀態回第一階段
            resetModalUI();
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        elError.textContent = "⚠️ " + err.message;
        elError.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// ===========================================
// 🔑 Step 2: 驗證代碼
// ===========================================
async function checkCode() {
    const elCode = document.getElementById('verifyCode');
    const btn = document.getElementById('checkCodeBtn');
    const code = elCode.value;

    if(code.length !== 6) {
        elCode.classList.add('input-error', 'animate-shake');
        setTimeout(() => elCode.classList.remove('input-error', 'animate-shake'), 500);
        return;
    }

    btn.disabled = true;
    btn.innerText = "Verifying...";

    try {
        const res = await fetch(`${API_BASE}/auth/verify-code-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, code: code })
        });
        const data = await res.json();

        if (res.ok) {
            verifiedCode = code; // 存下來給第二階段用
            switchToStage2();
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.innerText = "VERIFY CODE";
    }
}

// ===========================================
// 🔒 Step 3: 重設密碼
// ===========================================
async function finalReset() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('resetBtn');
    const elPass = document.getElementById('newPassword');
    const elConfirm = document.getElementById('confirmPassword');
    
    // 驗證規則
    const isLengthOk = newPassword.length >= 8;
    const isMixOk = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);

    if (!isLengthOk || !isMixOk) {
        elPass.classList.add('input-error', 'animate-shake');
        updateRuleUI(document.getElementById('rule-length'), isLengthOk, true);
        updateRuleUI(document.getElementById('rule-alphanum'), isMixOk, true);
        return;
    }

    if (newPassword !== confirmPassword) {
        elConfirm.classList.add('input-error', 'animate-shake');
        setTimeout(() => elConfirm.classList.remove('input-error', 'animate-shake'), 500);
        return;
    }

    btn.disabled = true;
    btn.innerText = "Updating...";

    try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail, code: verifiedCode, newPassword })
        });
        const data = await res.json();

        if (res.ok) {
            btn.innerText = "Success!";
            btn.classList.add("bg-green-500");
            setTimeout(() => window.location.href = 'login.html', 1000);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.innerText = "CHANGE PASSWORD";
    }
}

// ===========================================
// 📺 UI 輔助邏輯
// ===========================================
function updateRuleUI(element, isValid, hasInput) {
    const defaultIcon = element.querySelector('.icon-default');
    const checkIcon = element.querySelector('.icon-check');
    const crossIcon = element.querySelector('.icon-cross');

    element.classList.remove('text-slate-500', 'req-valid', 'req-invalid');
    defaultIcon.classList.add('hidden'); checkIcon.classList.add('hidden'); crossIcon.classList.add('hidden');

    if (isValid) {
        element.classList.add('req-valid');
        checkIcon.classList.remove('hidden');
    } else if (hasInput) {
        element.classList.add('req-invalid');
        crossIcon.classList.remove('hidden');
    } else {
        element.classList.add('text-slate-500');
        defaultIcon.classList.remove('hidden');
    }
}

function switchToStage2() {
    document.getElementById('stage1-verify').classList.add('hidden');
    document.getElementById('stage2-reset').classList.remove('hidden');
    document.getElementById('modalTitle').innerText = "Create New Password";
    const desc = document.getElementById('modalDesc');
    desc.innerText = "Code Verified! Please set your new password.";
    desc.className = "text-green-400 text-sm mb-6 font-medium";
}

function resetModalUI() {
    document.getElementById('stage1-verify').classList.remove('hidden');
    document.getElementById('stage2-reset').classList.add('hidden');
    document.getElementById('verifyCode').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('checkCodeBtn').disabled = false;
    document.getElementById('checkCodeBtn').innerText = "VERIFY CODE";
    document.getElementById('modalTitle').innerText = "Verification";
    
    const desc = document.getElementById('modalDesc');
    desc.innerHTML = `Code sent to <span id="displayEmail" class="text-blue-400 font-mono">${currentEmail}</span><br><span class="text-xs text-slate-500">(Check server console)</span>`;
    desc.className = "text-slate-300 text-sm mb-6";
    
    // 重置規則 UI
    updateRuleUI(document.getElementById('rule-length'), false, false);
    updateRuleUI(document.getElementById('rule-alphanum'), false, false);
}

function closeModal() { document.getElementById('resetModal').classList.add('hidden'); }

// 🌍 全域綁定 (給 HTML onclick 使用)
window.checkCode = checkCode;
window.finalReset = finalReset;
window.closeModal = closeModal;

// 🚀 初始化
window.addEventListener('DOMContentLoaded', () => {
    initParticles();
    
    // 表單提交
    document.getElementById('forgotForm').addEventListener('submit', handleForgotSubmit);

    // 密碼即時驗證監聽
    const passInput = document.getElementById('newPassword');
    const ruleLength = document.getElementById('rule-length');
    const ruleAlphanum = document.getElementById('rule-alphanum');

    passInput.addEventListener('input', function() {
        const val = this.value;
        const hasInput = val.length > 0;
        const isLengthValid = val.length >= 8;
        updateRuleUI(ruleLength, isLengthValid, hasInput);
        const isAlphanumValid = /[a-zA-Z]/.test(val) && /[0-9]/.test(val);
        updateRuleUI(ruleAlphanum, isAlphanumValid, hasInput);
        
        this.classList.remove('input-error', 'animate-shake');
    });
});