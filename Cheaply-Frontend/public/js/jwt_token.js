(function() {
    const originalFetch = window.fetch;

    // 劫持全域 fetch，攔截所有 API 請求 (如 /api/user, /api/shop/...)
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);

        // 捕捉後端 auth-middleware.js 回傳的 401/403 訊號
        if (response.status === 401 || response.status === 403) {
            console.warn("[Auth Guard] 偵測到身分驗證失效，準備跳轉...");
            localStorage.clear();
            window.location.href = 'login.html?reason=expired';

            // 重要：回傳 Pending Promise 以凍結後續業務邏輯，防止 UI 崩潰
            return new Promise(() => {});
        }
        return response;
    };
})();
