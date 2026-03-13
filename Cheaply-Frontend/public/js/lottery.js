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
// 🛠️ 全域變數與狀態
// ===========================================
let data = { price: 0, tokens: 0, tickets: 0, activePot: 0 };
let pendingAction = null;
let rollMode = 'under';
let currentWinChance = 50;
let currentMultiplier = 1.95;
let isRolling = false;
let currentRotation = 0;
let updateTimerInterval = null;
let seasonInterval = null;
let selectedDuration = 20000;
let payoutValue = 10;


// ===========================================
// 🏗️ 初始化與輪詢
// ===========================================
async function init() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }
    
    updateFuturesCalc(); 
    updateHeaderStatus();
    
    await Promise.all([
        fetchUserData(), 
        fetchMarketData(), 
        fetchHistory(), 
        checkMyPosition()
    ]);

    setInterval(() => {
        fetchMarketData();
        checkMyPosition();
        fetchHistory(); 
    }, 5000);

    setInterval(updateTimers, 1000);
    setTimeout(() => startTour(false), 1000);
}

// ===========================================
// 📡 資料獲取 API
// ===========================================
async function fetchUserData() {
    try {
        const res = await fetch(`${API_BASE}/user`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
        const u = await res.json(); data.tokens = u.gameTokens;
        
        const resH = await fetch(`${API_BASE}/lottery/holdings`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
        const h = await resH.json(); data.tickets = h.tickets || 0;
        
        updateUI();
    } catch(e) { console.error("User data error", e); }
}

async function fetchMarketData() {
    try {
        const res = await fetch(`${API_BASE}/lottery/status`);
        const r = await res.json();
        
        if (r.currentPrice) {
            data.price = r.currentPrice;
            const poolEl = document.getElementById('prizePool');
            if(poolEl) poolEl.textContent = '$' + r.activePot.toLocaleString(); 
            updateUI(); 
            
            if (r.seasonEndsAt && r.serverTime) {
                startSeasonTimer(r.seasonEndsAt, r.serverTime);
            }
            if (r.nextUpdate && r.serverTime) {
                startCountdown(r.nextUpdate, r.serverTime);
            }

            // FIX 1: 保留 RWD class min-w-[60px] md:min-w-[80px]，不用寫死寬度
            const changeEl = document.getElementById('priceChange');
            const pct = r.changePercent || 0;
            if(changeEl) {
                changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                if (pct >= 0) {
                    changeEl.className = 'inline-flex items-center justify-center min-w-[60px] md:min-w-[80px] text-green-300 text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-lg backdrop-blur-sm shadow-lg border border-green-500/30 bg-green-900/60 transition-colors duration-300';
                } else {
                    changeEl.className = 'inline-flex items-center justify-center min-w-[60px] md:min-w-[80px] text-red-300 text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-lg backdrop-blur-sm shadow-lg border border-red-500/30 bg-red-900/60 transition-colors duration-300';
                }
            }
        }
    } catch (e) { console.error("Market data error", e); }
}

async function fetchHistory() {
    try {
        const res = await fetch(`${API_BASE}/lottery/history`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } });
        const list = await res.json();
        const tbody = document.getElementById('historyList');
        if (!tbody) return;

        if (!list || list.length === 0) { 
            tbody.innerHTML = '<tr><td colspan="3" class="py-6 text-center text-gray-500 italic">No recent activity</td></tr>'; 
            return; 
        }
        
        tbody.innerHTML = list.map(item => `
            <tr class="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td class="py-3 pl-2"><div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${item.category === 'futures' ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}"></span><span class="font-bold text-gray-300 text-xs md:text-sm">${item.type.toUpperCase()}</span></div></td>
                <td class="py-3 text-center"><span class="text-[10px] font-bold px-2 py-0.5 rounded ${item.result === 'WIN' ? 'bg-green-500/20 text-green-400' : (item.result === 'LOSS' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-400')}">${item.result || '-'}</span></td>
                <td class="py-3 text-right pr-2 font-mono text-gray-300 text-xs md:text-sm">${item.pnl ? (item.pnl > 0 ? '<span class="text-green-400">+' + item.pnl.toLocaleString() + '</span>' : '<span class="text-red-400">' + item.pnl.toLocaleString() + '</span>') : item.amount.toLocaleString()}</td>
            </tr>`).join('');
    } catch(e) {}
}

async function checkMyPosition() {
    try {
        const res = await fetch(`${API_BASE}/lottery/predict/my`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const r = await res.json();
        
        const inputArea = document.getElementById('predictionInputArea');
        const cardArea = document.getElementById('myPositionCard');

        if (r.hasPosition && r.data) {
            const p = r.data;
            inputArea.classList.add('hidden');
            cardArea.classList.remove('hidden');

            const isUp = p.direction === 'UP';
            document.getElementById('posDirection').textContent = isUp ? 'HIGHER' : 'LOWER';
            document.getElementById('posIcon').textContent = isUp ? '🐂' : '🐻';
            
            const amountDisplay = document.getElementById('posAmount');
            const bg = document.getElementById('posBg');

            if (p.status === 'WIN') {
                amountDisplay.innerHTML = `<button onclick="claimReward()" class="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-4 py-1 rounded-lg animate-pulse shadow-[0_0_15px_#facc15] transition-all">CLAIM 💰</button>`;
                bg.className = 'absolute inset-0 opacity-50 bg-yellow-600 animate-pulse';
            } else {
                amountDisplay.textContent = p.amount.toLocaleString() + ' TKN';
                bg.className = isUp ? 'absolute inset-0 opacity-20 bg-green-500' : 'absolute inset-0 opacity-20 bg-red-500';
            }
        } else {
            inputArea.classList.remove('hidden');
            cardArea.classList.add('hidden');
        }
    } catch (e) { console.error("Check position error", e); }
}

// ===========================================
// 📺 UI 互動與頁面切換
// ===========================================

// FIX 3: switchTab 按鈕 class 改為符合 HTML 原始 RWD 結構
function switchTab(tab) {
    document.getElementById('view-spot').classList.add('hidden');
    document.getElementById('view-futures').classList.add('hidden');
    document.getElementById('view-dice').classList.add('hidden');
    document.getElementById('view-' + tab).classList.remove('hidden');

    const btnActive = "tab-active flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold uppercase no-tap-highlight transition-all";
    const btnInactive = "flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-bold uppercase text-gray-500 no-tap-highlight transition-all";

    document.getElementById('tab-spot').className = (tab === 'spot') ? btnActive : btnInactive;
    document.getElementById('tab-futures').className = (tab === 'futures') ? btnActive : btnInactive;
    document.getElementById('tab-dice').className = (tab === 'dice') ? btnActive : btnInactive;
}

function updateUI() {
    const priceEl = document.getElementById('marketPrice');
    if(priceEl) priceEl.textContent = '$' + data.price.toFixed(2);
    
    const tokensEl = document.getElementById('gameTokens');
    if(tokensEl) tokensEl.textContent = Math.floor(data.tokens).toLocaleString();
    
    const ticketsEl = document.getElementById('heldTickets');
    if(ticketsEl) ticketsEl.textContent = data.tickets.toLocaleString();
    
    const balEl = document.getElementById('walletBalance');
    if(balEl) balEl.textContent = Math.floor(data.tokens).toLocaleString();
}

// ===========================================
// 🎲 Dice Game 邏輯
// ===========================================

// FIX 2: setMode 按鈕 class 改為 flex-1，符合 HTML 原始結構
function setMode(mode) {
    if(isRolling) return;
    rollMode = mode;
    const btnActive = "mode-btn-active flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl border border-white/10 text-[9px] md:text-sm font-black uppercase no-tap-highlight transition-all";
    const btnInactive = "flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 text-[9px] md:text-sm font-black uppercase no-tap-highlight transition-all";
    document.getElementById('btn-under').className = mode === 'under' ? btnActive : btnInactive;
    document.getElementById('btn-over').className = mode === 'over' ? btnActive : btnInactive;
    updateFuturesCalc();
}

function updateFuturesCalc() {
    const val = document.getElementById('winChanceSlider').value;
    const wagerInput = document.getElementById('diceAmount').value;
    const wager = parseFloat(wagerInput) || 0;

    currentWinChance = parseFloat(val);
    
    if(!isRolling) {
        document.getElementById('centerDisplay').textContent = currentWinChance.toFixed(2) + "%";
        document.getElementById('centerLabel').textContent = "WIN CHANCE";
    }
    
    document.getElementById('label-under').textContent = currentWinChance;
    document.getElementById('label-over').textContent = (100 - currentWinChance);

    currentMultiplier = (100 / Math.max(1, currentWinChance)) * 0.95;
    document.getElementById('multiplierDisplay').textContent = "x" + currentMultiplier.toFixed(2);
    
    const profit = (wager * currentMultiplier) - wager;
    document.getElementById('profitDisplay').textContent = profit > 0 ? profit.toLocaleString(undefined, {maximumFractionDigits:2}) : "0.00";

    const circle = document.getElementById('chanceCircle');
    const circumference = 565.48; 
    const offset = circumference * (1 - (currentWinChance / 100));
    circle.style.strokeDashoffset = offset;

    if (rollMode === 'under') {
        circle.setAttribute('transform', 'rotate(-90 100 100)');
    } else {
        circle.setAttribute('transform', 'translate(200, 0) scale(-1, 1) rotate(-90 100 100)');
    }
}

function setFuturesPercent(pct) { 
    if(isRolling) return;
    const amt = Math.floor(data.tokens * pct);
    document.getElementById('diceAmount').value = amt;
    updateFuturesCalc(); 
}

function requestRoll() {
    if(isRolling) return;
    const amt = parseFloat(document.getElementById('diceAmount').value);
    if (!amt || amt <= 0) return alert("Invalid Wager");
    const target = rollMode === 'under' ? `< ${currentWinChance}` : `> ${100 - currentWinChance}`;
    
    showConfirm(`
        Roll Mode: <b>${rollMode.toUpperCase()}</b><br>
        Wager: <b class="text-white">${amt.toLocaleString()}</b><br>
        Target: <b class="text-green-400">${target}</b><br>
        Profit: <b class="text-yellow-400">x${currentMultiplier.toFixed(2)}</b>
    `, () => submitRoll(amt));
}

async function submitRoll(amt) {
    if (data.tokens < amt) return alert("Insufficient Tokens");

    data.tokens -= amt;
    updateUI(); 

    try {
        isRolling = true;
        const res = await fetch(`${API_BASE}/lottery/futures/trade`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + localStorage.getItem('token') 
            }, 
            body: JSON.stringify({ type: rollMode, amount: amt, chance: currentWinChance }) 
        });
        
        const r = await res.json();
        
        if (r.success) {
            spinAnimation(r); 
        } else {
            data.tokens += amt; 
            updateUI(); 
            alert(r.error);
            isRolling = false; 
        }
    } catch (e) { 
        data.tokens += amt;
        updateUI();
        console.error(e);
        alert("Network Error"); 
        isRolling = false; 
    }
}

function spinAnimation(result) {
    const spinnerGroup = document.getElementById('spinnerGroup');
    const centerText = document.getElementById('centerDisplay');
    const centerLabel = document.getElementById('centerLabel');
    
    centerLabel.textContent = "ROLLING...";
    spinnerGroup.style.transition = 'none'; 
    spinnerGroup.style.transform = 'rotate(0deg)';
    
    const targetValue = parseFloat(result.roll);
    const targetAngle = targetValue * 3.6; 
    const spins = 5; 
    const totalTravel = (360 * spins) + targetAngle;
    const duration = 3000;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); 
        const currentDegree = totalTravel * ease;
        
        spinnerGroup.style.transform = `rotate(${currentDegree}deg)`;
        
        let displayVal = (currentDegree % 360) / 3.6;
        if (displayVal < 0) displayVal += 100;
        if (displayVal >= 99.995) displayVal = 0; 
        centerText.textContent = displayVal.toFixed(2);

        if (progress < 1) requestAnimationFrame(animate);
        else finishRoll(result);
    }
    requestAnimationFrame(animate);
}

function finishRoll(result) {
    const centerText = document.getElementById('centerDisplay');
    const centerLabel = document.getElementById('centerLabel');
    const spinnerGroup = document.getElementById('spinnerGroup');

    const finalVal = parseFloat(result.roll).toFixed(2);
    centerText.textContent = finalVal;
    centerLabel.textContent = result.status === 'won' ? "WINNER!" : "TRY AGAIN";
    
    if(result.status === 'won') {
        centerText.classList.remove('text-white');
        centerText.classList.add('text-green-400');
        triggerConfetti();
    } else {
        centerText.classList.remove('text-white');
        centerText.classList.add('text-red-500');
    }

    setTimeout(() => {
        openResultModal(result);
        fetchUserData();
        fetchHistory(); 
        fetchMarketData();

        setTimeout(() => {
            centerText.classList.remove('text-green-400', 'text-red-500');
            spinnerGroup.style.transform = 'rotate(0deg)';
            centerText.textContent = "0.00"; 
            isRolling = false;
        }, 2000); 
    }, 500);
}

// ===========================================
// 📈 Futures (High/Low) 邏輯
// ===========================================

// FIX 5: updatePayoutUI 只更新 requiredMoveDisplay 的文字，不覆蓋外層的 "Target:" 標籤
function updatePayoutUI(val) {
    payoutValue = val;
    document.getElementById('payoutDisplay').textContent = val + '%';
    document.getElementById('payoutTrack').style.width = val + '%';
    document.getElementById('payoutThumb').style.left = val + '%';

    const requiredMove = (val * 0.1).toFixed(1); 
    const displayEl = document.getElementById('requiredMoveDisplay');
    if (displayEl) {
        // FIX 5: 只更新 span 的文字內容，不影響外層 "Target:" 的文字
        displayEl.textContent = `+/- ${requiredMove}%`;
    }
}

// FIX 4: selectDuration 按鈕 class 改為符合 HTML 原始 RWD 結構
function selectDuration(ms, btn) {
    selectedDuration = ms;
    document.querySelectorAll('.duration-btn').forEach(b => {
        b.className = "duration-btn py-2 md:py-3 rounded-lg md:rounded-xl border border-white/10 text-gray-400 text-[10px] md:text-xs no-tap-highlight";
    });
    btn.className = "duration-btn active py-2 md:py-3 rounded-lg md:rounded-xl border border-purple-500 bg-purple-500/20 text-white font-bold text-[10px] md:text-xs no-tap-highlight transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]";
}

async function placePrediction(direction) {
    const amt = parseFloat(document.getElementById('predictionAmount').value);
    if (!amt || amt <= 0) return alert("Please enter amount");
    if (data.tokens < amt) return alert("Insufficient Tokens");

    const btn = event.currentTarget;
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span class="animate-spin text-xl">⏳</span>';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/lottery/predict`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                direction: direction,
                amount: amt,
                duration: selectedDuration,
                payoutRatio: payoutValue
            })
        });
        
        const r = await res.json();
        if (r.success) {
            data.tokens = r.newBalance;
            updateUI();
            addActivePosition(direction, amt, selectedDuration, payoutValue);
            document.getElementById('predictionAmount').value = '';
        } else {
            alert(r.error);
        }
    } catch(e) { 
        console.error(e); 
        alert("Connection Error");
    } finally {
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

function addActivePosition(dir, amt, dur, payout) {
    const container = document.getElementById('activePositions');
    const endTime = Date.now() + dur;
    const id = 'pos-' + Date.now();
    
    const html = `
        <div id="${id}" class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center animate-modal mb-2">
            <div class="flex items-center gap-3">
                <div class="bg-slate-900 p-2 rounded-lg text-2xl">${dir === 'UP' ? '🐂' : '🐻'}</div>
                <div>
                    <div class="text-xs text-gray-400 font-bold uppercase">${dir} | ${payout}% Payout</div>
                    <div class="text-white font-bold">${amt.toLocaleString()} TKN</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-[10px] text-gray-500 uppercase">Ends In</div>
                <div class="text-yellow-400 font-mono font-bold timer" data-end="${endTime}">Calculating...</div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('afterbegin', html);
}

// ===========================================
// ⏱️ 計時器邏輯
// ===========================================
function startCountdown(targetTime, serverTime) {
    if (updateTimerInterval) clearInterval(updateTimerInterval);
    const timeOffset = Date.now() - serverTime; 

    function update() {
        const adjustedNow = Date.now() - timeOffset;
        const diff = targetTime - adjustedNow;
        const timerEl = document.getElementById('priceTimer');

        if (diff <= 0) {
            clearInterval(updateTimerInterval);
            if(timerEl) {
                timerEl.textContent = "UPDATING...";
                timerEl.classList.add('text-yellow-400', 'animate-pulse');
            }
            setTimeout(() => {
                fetchMarketData();
                fetchUserData();
                checkMyPosition();
                if(timerEl) timerEl.classList.remove('text-yellow-400', 'animate-pulse');
            }, 3000);
            return;
        }

        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const pad = (n) => n < 10 ? '0' + n : n;
        if(timerEl) timerEl.textContent = `00:${pad(m)}:${pad(s)}`;
    }
    update();
    updateTimerInterval = setInterval(update, 1000);
}

function startSeasonTimer(targetTime, serverTime) {
    if (seasonInterval) clearInterval(seasonInterval);
    const timeOffset = Date.now() - serverTime; 

    function update() {
        const now = Date.now() - timeOffset;
        const diff = targetTime - now;
        const el = document.getElementById('seasonTimer');

        if (diff <= 0) {
            if(el) el.textContent = "Ending...";
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const hStr = hours < 10 ? '0' + hours : hours;
        const mStr = minutes < 10 ? '0' + minutes : minutes;
        if(el) el.textContent = `${days}d ${hStr}h ${mStr}m`;
    }
    update();
    seasonInterval = setInterval(update, 60000);
}

function updateTimers() {
    document.querySelectorAll('.timer').forEach(el => {
        const end = parseInt(el.getAttribute('data-end'));
        const diff = end - Date.now();
        
        if (diff <= 0) {
            el.textContent = "Settling...";
            el.classList.add('text-yellow-400', 'animate-pulse');
            
            if (diff > -2000 && diff < -1000) {
                checkMyPosition();
                fetchHistory();
            }
            if(diff < -10000) {
                const row = el.closest('div[id^="pos-"]');
                if(row) row.remove();
            }
        } else {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if (h > 0) el.textContent = `${h}h ${m}m ${s}s`;
            else el.textContent = `${m}m ${s}s`;
        }
    });
}

// ===========================================
// 🔄 Spot Trading (Ticket)
// ===========================================
function requestSpotTrade(type) {
    const qty = parseFloat(document.getElementById('spotAmount').value);
    if (!qty || qty <= 0) return alert("Invalid Qty");
    const cost = qty * data.price;
    let msg = type === 'buy' ? `Buying <b>${qty} Tickets</b><br>Cost: <b class="text-yellow-400">${Math.floor(cost).toLocaleString()}</b>` : `Selling <b>${qty} Tickets</b><br>Return: <b class="text-yellow-400">${Math.floor(cost).toLocaleString()}</b><br><span class="text-xs text-red-400 font-bold">(Pool Deducted)</span>`;
    showConfirm(msg, () => executeSpot(type, qty));
}

async function executeSpot(type, qty) {
    try {
        const res = await fetch(`${API_BASE}/lottery/${type}`, { 
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + localStorage.getItem('token') 
            }, 
            body: JSON.stringify({ amount: qty }) 
        });
        const r = await res.json();
        if (r.success) { 
            triggerConfetti(); 
            await fetchUserData(); 
            fetchHistory(); 
            fetchMarketData(); 
            document.getElementById('spotAmount').value = ''; 
        } else { alert(r.error); }
    } catch (e) { alert("Error"); }
}

// ===========================================
// 👤 Header UI 邏輯
// ===========================================
async function updateHeaderStatus() {
    const username = localStorage.getItem('currentUser') || 'Guest';
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (username && username !== 'Guest') {
        const firstLetter = username.charAt(0).toUpperCase();
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-600 text-white relative";

        let unreadCount = 0;
        try {
            const res = await fetch(`${API_BASE}/mail?t=${Date.now()}`, {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if(res.ok) {
                const msgs = await res.json();
                unreadCount = msgs.filter(m => !m.read).length;
            }
        } catch(e) { console.error("Mail check failed", e); }

        let inboxLabelHtml = 'System Inbox';
        let avatarDotHtml = '';
        if (unreadCount > 0) {
            inboxLabelHtml += `<span class="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">${unreadCount}</span>`;
            avatarDotHtml = `<span class="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span></span>`;
        }

        avatarBtn.innerHTML = firstLetter + avatarDotHtml;
        dropdownContent.innerHTML = `
            <div class="px-4 py-3 border-b border-gray-700/50">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="text-sm font-bold text-white truncate">${username}</p>
            </div>
            <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> Profile
            </a>
            <a href="mail.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> ${inboxLabelHtml} 
            </a>
            <div class="h-px bg-gray-700 my-1 mx-2"></div>
            <button onclick="handleLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg> Log Out
            </button>`;
    } else {
        avatarBtn.innerText = "?";
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold bg-slate-700 text-gray-300 hover:bg-slate-600";
        dropdownContent.innerHTML = `<a href="login.html" class="block px-4 py-2 text-sm text-yellow-400 font-bold">Log In</a>`;
    }
}

function setMaxAmount() {
    const balanceText = document.getElementById('walletBalance').innerText;
    const balance = parseInt(balanceText.replace(/,/g, '')) || 0;
    document.getElementById('predictionAmount').value = balance;
}

// ===========================================
// 🔔 Modal & Helper Functions
// ===========================================
function showConfirm(msg, action) {
    document.getElementById('confirmMessage').innerHTML = msg;
    document.getElementById('confirmModal').classList.remove('hidden');
    document.getElementById('confirmModal').classList.add('flex');
    pendingAction = action;
}
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
    document.getElementById('confirmModal').classList.remove('flex');
    pendingAction = null;
}
function openResultModal(r) {
    const isWin = r.status === 'won';
    document.getElementById('resultIcon').textContent = isWin ? "🏆" : "📉";
    document.getElementById('resultTitle').textContent = isWin ? "WINNER" : "REKT";
    document.getElementById('resultTitle').className = isWin ? "text-4xl md:text-5xl font-black italic text-green-400 mb-2 uppercase tracking-tighter drop-shadow-lg" : "text-4xl md:text-5xl font-black italic text-red-500 mb-2 uppercase tracking-tighter drop-shadow-lg";
    document.getElementById('resultAmount').textContent = (isWin ? '+' : '') + r.finalPnL.toLocaleString();
    document.getElementById('resultAmount').className = isWin ? "text-3xl md:text-4xl font-black font-nums text-green-400" : "text-3xl md:text-4xl font-black font-nums text-red-400";
    document.getElementById('resultModal').classList.remove('hidden');
    document.getElementById('resultModal').classList.add('flex');
    if(isWin) triggerConfetti();
}
function closeResultModal() {
    document.getElementById('resultModal').classList.add('hidden');
    document.getElementById('resultModal').classList.remove('flex');
}
function triggerConfetti() { confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#a855f7', '#fbbf24', '#22c55e'] }); }
function claimReward() {
    fetch(`${API_BASE}/lottery/predict/claim`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
    .then(r => r.json()).then(r => {
        if(r.success) { triggerConfetti(); openResultModal({ status: 'won', finalPnL: r.payout }); fetchUserData(); checkMyPosition(); } 
        else { alert(r.error || "Claim failed"); }
    });
}

function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function handleLogout() { document.getElementById('logoutModal').classList.remove('hidden'); }
function closeLogoutModal() { document.getElementById('logoutModal').classList.add('hidden'); }
function confirmLogout() { localStorage.clear(); window.location.href = 'login.html'; }

window.onclick = function(event) { 
    const btn = document.getElementById('userAvatarBtn');
    const menu = document.getElementById('userDropdown');
    if (btn && menu && !btn.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.add('hidden');
    }
}

// ===========================================
// 📖 Driver.js 教學
// ===========================================
let tutorialDriver = null;
let lotteryPausedStep = 0; 
window.isSkipping = false;

// 新增 startIndex 參數以支援恢復進度
function startTour(force = false, startIndex = 0) {
    if (!force && localStorage.getItem('lottery_tutorial_seen') === 'true') return;
    
    // 清除舊實例的防呆機制
    window.isSkipping = false;
    if (tutorialDriver) { 
        window.isSkipping = true; 
        tutorialDriver.destroy(); 
        window.isSkipping = false;
        tutorialDriver = null; 
    }

    const steps = [
        { popover: { title: 'Welcome to the Market! 📈', description: 'This is where the real action happens. Trade tickets, predict prices, and play dice games.' } },
        { element: '#tour-pool', popover: { title: 'Season Prize Pool 🏆', description: 'Every ticket purchase contributes to this pool. The jackpot winner takes it all!' } },
        { element: '#tour-price', popover: { title: 'Ticket Price 🏷️', description: 'The current price of one ticket. This price fluctuates based on supply and demand.' } },
        { element: '#tab-spot', popover: { title: 'Spot Trading 🔄', description: 'Buy low, sell high! Purchase tickets to hold for the lottery or trade them for profit.' }, onHighlightStarted: () => { switchTab('spot'); } },
        { element: '#tab-futures', popover: { title: 'Futures Prediction 🔮', description: 'Predict if the price will go UP or DOWN. High risk, high reward!' }, onHighlightStarted: () => { switchTab('futures'); } },
        { element: '#priceTimer', popover: { title: 'Settlement Timer ⏱️', description: 'Predictions are settled when this timer hits zero. Winners are paid immediately.' } },
        { element: '#tab-dice', popover: { title: 'Dice Game 🎲', description: 'Test your luck with fair odds. Roll Over or Under to win instant tokens.' }, onHighlightStarted: () => { switchTab('dice'); } }
    ];

    const driver = window.driver.js.driver;
    tutorialDriver = driver({
        showProgress: true, animate: true, overlayColor: 'rgba(0,0,0,0.9)', 
        nextBtnText: 'Next', prevBtnText: 'Back', doneBtnText: 'Start Trading!', 
        popoverClass: 'driverjs-theme', allowClose: false, 
        showButtons: ['next', 'previous', 'close'], overlayClickNext: false, 
        steps: steps,
        
        // 💡 修正 1：用更安全的方式判斷是否為最後一步
        onNextClick: (element, step, { state }) => {
            if (state.activeIndex === steps.length - 1) {
                // 最後一步：完成導覽
                window.isSkipping = true; 
                localStorage.setItem('lottery_tutorial_seen', 'true');
                tutorialDriver.destroy(); 
                switchTab('spot');
            } else {
                tutorialDriver.moveNext();
            }
        },
        
        // 💡 修正 2：先銷毀釋放觸控，再彈出確認視窗
        onDestroyStarted: (element, step, { state }) => {
            if (window.isSkipping) {
                tutorialDriver.destroy();
                return;
            } 
            
            // 📱【手機版關鍵修復】：記錄當前步驟並強制銷毀
            lotteryPausedStep = state.activeIndex;
            window.isSkipping = true;
            tutorialDriver.destroy();
            
            // 顯示確認視窗（此時背景已經乾淨，手機絕對按得到）
            const modal = document.getElementById('skipModal');
            if(modal.parentNode !== document.body) document.body.appendChild(modal);
            modal.classList.remove('hidden');
        }
    });
    
    // 從指定的步驟啟動
    tutorialDriver.drive(startIndex);
}

// 💡 修正 3：對應的按鈕邏輯
function closeSkipModal() { 
    document.getElementById('skipModal').classList.add('hidden'); 
    // 按下取消：重新喚醒 Driver，並回到剛才中斷的地方
    startTour(true, lotteryPausedStep);
}

function confirmSkip(e) {
    if(e) { e.stopPropagation(); e.preventDefault(); }
    document.getElementById('skipModal').classList.add('hidden');
    localStorage.setItem('lottery_tutorial_seen', 'true');
    // 不需要再呼叫 destroy，因為前面已經徹底銷毀過了
}


// ===========================================
// 📖 Info Modal
// ===========================================
function openInfoModal() {
    const modal = document.getElementById('infoModal');
    const panel = document.getElementById('infoPanel');
    if(modal && panel) {
        modal.classList.remove('hidden');
        setTimeout(() => panel.classList.remove('translate-y-full'), 10);
    }
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    const panel = document.getElementById('infoPanel');
    if(modal && panel) {
        panel.classList.add('translate-y-full');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// 🌍 全域綁定
window.switchTab = switchTab;
window.setMode = setMode;
window.setFuturesPercent = setFuturesPercent;
window.requestRoll = requestRoll;
window.requestSpotTrade = requestSpotTrade;
window.toggleUserMenu = toggleUserMenu;
window.handleLogout = handleLogout;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.startTour = startTour;
window.closeSkipModal = closeSkipModal;
window.confirmSkip = confirmSkip;
window.setMaxAmount = setMaxAmount;
window.placePrediction = placePrediction;
window.closeConfirmModal = closeConfirmModal;
window.closeResultModal = closeResultModal;
window.claimReward = claimReward;
window.updatePayoutUI = updatePayoutUI;
window.selectDuration = selectDuration;
window.updateFuturesCalc = updateFuturesCalc;
window.openInfoModal = openInfoModal;
window.closeInfoModal = closeInfoModal;

document.getElementById('confirmBtn').onclick = () => { if(pendingAction) pendingAction(); closeConfirmModal(); };

window.addEventListener('load', init);