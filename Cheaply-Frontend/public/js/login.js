// 🌍 1. 統一 API 基礎路徑 (Nginx 轉發模式)
const API_BASE = 'https://api.cheaply.click/api';

// 🛡️ 2. 防止已登入用戶回到登入頁 (立即執行)
(function checkLogin() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        window.location.replace('wheel.html'); 
    }
})();

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
        particle.style.backgroundColor = Math.random() > 0.5 ? '#fbbf24' : '#f472b6';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.animationDuration = (3 + Math.random() * 4) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ===========================================
// 🔐 登入邏輯
// ===========================================
async function handleLogin(e) {
    e.preventDefault(); // 阻止表單預設提交

    const elUser = document.getElementById('loginUser');
    const elPass = document.getElementById('loginPass');
    const elError = document.getElementById('loginErrorMsg');
    const btn = document.getElementById('loginBtn');

    // 重置狀態
    elUser.classList.remove('input-error', 'animate-shake');
    elPass.classList.remove('input-error', 'animate-shake');
    elError.classList.add('hidden');

    const username = elUser.value.trim();
    const password = elPass.value;

    if(!username || !password) {
        showError("Please enter username and password");
        return;
    }

    const originalText = btn.innerText;
    btn.innerText = "Checking...";
    btn.disabled = true;

    try {
        // 🚀 使用 Nginx 代理路徑 /api
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            // 登入成功，儲存資訊
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentUser', data.username);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role || 'user');
            
            btn.innerText = "Welcome!";
            btn.classList.remove('from-yellow-400', 'to-orange-500');
            btn.classList.add('bg-green-500', 'text-white');
            
            // 延遲跳轉以顯示成功動畫
            setTimeout(() => window.location.href = 'wheel.html', 800);
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        console.error(err);
        btn.innerText = originalText;
        btn.disabled = false;
        
        // 判斷是網路錯誤還是帳密錯誤
        if (err.message === 'Failed to fetch') {
            showError("Cannot connect to server. Check your internet.");
        } else {
            showError(err.message || "Invalid username or password");
        }
    }
}

function showError(msg) {
    const elUser = document.getElementById('loginUser');
    const elPass = document.getElementById('loginPass');
    const elError = document.getElementById('loginErrorMsg');

    elUser.classList.add('input-error', 'animate-shake');
    elPass.classList.add('input-error', 'animate-shake');

    elError.textContent = "⚠️ " + msg;
    elError.classList.remove('hidden');

    const clearError = () => {
        elUser.classList.remove('input-error', 'animate-shake');
        elPass.classList.remove('input-error', 'animate-shake');
        elError.classList.add('hidden');
    };
    
    // 輸入時清除錯誤
    elUser.addEventListener('input', clearError, { once: true });
    elPass.addEventListener('input', clearError, { once: true });
}

// ===========================================
// 🚀 初始化
// ===========================================
window.addEventListener('DOMContentLoaded', () => {
    initParticles();
    
    // 綁定表單提交事件
    const loginForm = document.querySelector('form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});