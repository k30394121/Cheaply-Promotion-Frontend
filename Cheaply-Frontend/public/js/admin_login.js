// ===========================================
// 🌍 全域連線設定 (必須放在 Script 最上方)
// ===========================================
// 自動根據目前的埠口決定 API 路徑
const ROOT_URL = 'https://api.cheaply.click/api';

// ===========================================
// 🛡️ 登入處理邏輯
// ===========================================
document.getElementById('adminLoginForm').addEventListener('submit', handleLogin);

async function handleLogin(e) {
    e.preventDefault(); // 防止表單重整
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');

    // 1. UI 變更為讀取中
    const originalText = btn.innerHTML;
    btn.innerHTML = `⏳ 驗證中...`;
    btn.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        // 2. 呼叫後端 API 進行真實驗證 (使用 ROOT_URL)
        const res = await fetch(`${ROOT_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            // ✅ 關鍵檢查：後端回傳的 role 是不是 admin
            if (data.role === 'admin') {
                // 登入成功：存入 Token
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', data.username);
                
                // 跳轉到後台
                window.location.href = 'admin_game.html';
            } else {
                // 雖然帳密對了，但不是管理員
                throw new Error("權限不足：您不是管理員");
            }
        } else {
            throw new Error("帳號或密碼錯誤");
        }

    } catch (err) {
        // 顯示錯誤訊息
        btn.innerHTML = originalText;
        btn.disabled = false;
        errorMsg.textContent = err.message || "登入失敗";
        errorMsg.classList.remove('hidden');
        
        // 錯誤震動特效
        const form = document.getElementById('adminLoginForm');
        form.classList.add('animate-pulse');
        setTimeout(() => form.classList.remove('animate-pulse'), 200);
    }
}