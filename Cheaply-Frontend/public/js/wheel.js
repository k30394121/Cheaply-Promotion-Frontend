// ==========================================
// 🌍 全域變數與常數設定
// ==========================================
const API_BASE = 'https://api.cheaply.click/api';

// 🎲 遊戲狀態
let gameTokens = 0, promoTokens = 0, userLevel = 1;
let spinning = false, rotation = 0, tickerAngle = 0;
let spinData = { newUserSpins: 5, weeklySpins: 0 };
let selectedCards = [], userLuckCards = {};

const CARD_INFO = {
    'Lucky Star': { icon: '⭐', label: '2x Reward', color: 'border-yellow-500 text-yellow-400' },
    'Double Chance': { icon: '🎲', label: 'Reroll Best', color: 'border-blue-500 text-blue-400' }
};

const segments = [
    { id: 0, type: 'SMALL', label: 'Small', colorId: 'gradSmall', textColor: '#fff' },
    { id: 1, type: 'SMALL', label: 'Small', colorId: 'gradSmall', textColor: '#fff' },
    { id: 2, type: 'MID', label: 'Mid', colorId: 'gradMid', textColor: '#fff' },
    { id: 3, type: 'EMPTY', label: 'Empty', colorId: 'gradEmpty', textColor: '#9CA3AF' },
    { id: 4, type: 'GRAND', label: 'GRAND!', colorId: 'gradGrand', textColor: '#fff' },
    { id: 5, type: 'EMPTY', label: 'Empty', colorId: 'gradEmpty', textColor: '#9CA3AF' },
    { id: 6, type: 'MID', label: 'Mid', colorId: 'gradMid', textColor: '#fff' },
    { id: 7, type: 'EMPTY', label: 'Empty', colorId: 'gradEmpty', textColor: '#9CA3AF' }
];

const rewardTable = {
    SMALL: [1000, 3000000, 8000000, 25000000],
    MID: [1500, 7000000, 20000000, 75000000],
    GRAND: 500000000
};
let serverRewards = null;


// ==========================================
// 👤 使用者狀態與 Header UI (含 Mail 連結與紅點)
// ==========================================
function getSmartUser() {
    const user = localStorage.getItem('currentUser');
    if (user) return user;
    let guest = sessionStorage.getItem('tempGuestUser');
    if (!guest) {
        guest = 'Guest_' + Math.floor(Math.random() * 100000);
        sessionStorage.setItem('tempGuestUser', guest);
    }
    return guest;
}

// ✅ 動態更新 Header 狀態 (包含頭像與選單)
async function updateHeaderStatus() {
    const username = getSmartUser();
    const avatarBtn = document.getElementById('userAvatarBtn');
    const dropdownContent = document.getElementById('dropdownContent');

    if (username && !username.startsWith('Guest_') && username !== 'Guest') {
        // --- 登入狀態 ---
        const firstLetter = username.charAt(0).toUpperCase();
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-600 text-white relative";

        let unreadCount = 0;
        try {
            // 檢查信箱未讀數量
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
            avatarDotHtml = `
                <span class="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-slate-900"></span>
                </span>
            `;
        }

        avatarBtn.innerHTML = firstLetter + avatarDotHtml;
        dropdownContent.innerHTML = `
            <div class="px-4 py-3 border-b border-gray-700/50">
                <p class="text-xs text-gray-400">Signed in as</p>
                <p class="text-sm font-bold text-white truncate">${username}</p>
            </div>
            <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Profile
            </a>
            <a href="mail.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                ${inboxLabelHtml} 
            </a>
            <div class="h-px bg-gray-700 my-1 mx-2"></div>
            <button onclick="handleLogout()" class="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Log Out
            </button>
        `;
    } else {
        // --- 遊客狀態 ---
        avatarBtn.innerText = "?";
        avatarBtn.className = "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/20 shadow-lg flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 active:scale-95 bg-slate-700 text-gray-300 hover:bg-slate-600";
        dropdownContent.innerHTML = `
            <a href="login.html" class="block px-4 py-2 text-sm text-yellow-400 hover:bg-white/10 transition-colors font-bold">Log In</a>
            <a href="signup.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors">Register</a>
        `;
    }
}

// 點擊空白處關閉選單
window.addEventListener('click', function(e) {
    const btn = document.getElementById('userAvatarBtn');
    const menu = document.getElementById('userDropdown');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});


// ==========================================
// 🎡 轉盤初始化與圖形繪製
// ==========================================
function initWheel() {
    const svg = document.getElementById('wheel');
    const centerX = 150, centerY = 150, radius = 145;
    const anglePerSegment = 360 / segments.length;

    const defs = svg.querySelector('defs');
    svg.innerHTML = '';
    svg.appendChild(defs);

    segments.forEach((segment, i) => {
        const startAngle = i * anglePerSegment - 90;
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = ((startAngle + anglePerSegment) * Math.PI) / 180;
        
        // 1. 繪製區塊
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M 150 150 L ${centerX + radius * Math.cos(startRad)} ${centerY + radius * Math.sin(startRad)} A ${radius} ${radius} 0 0 1 ${centerX + radius * Math.cos(endRad)} ${centerY + radius * Math.sin(endRad)} Z`;
        path.setAttribute('d', pathData);
        path.setAttribute('fill', `url(#${segment.colorId})`);
        path.setAttribute('stroke', 'rgba(255,255,255,0.1)');
        svg.appendChild(path);

        // 2. 繪製金屬圓點 (Pins)
        const pinRad = (startAngle * Math.PI) / 180;
        const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pin.setAttribute('cx', centerX + (radius - 5) * Math.cos(pinRad));
        pin.setAttribute('cy', centerY + (radius - 5) * Math.sin(pinRad));
        pin.setAttribute('r', '3');
        pin.setAttribute('fill', '#e5e7eb');
        pin.setAttribute('filter', 'url(#metal)');
        svg.appendChild(pin);

        // 3. 繪製文字
        const textAngle = startAngle + anglePerSegment / 2;
        const textRad = (textAngle * Math.PI) / 180;
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', centerX + radius * 0.65 * Math.cos(textRad));
        txt.setAttribute('y', centerY + radius * 0.65 * Math.sin(textRad));
        txt.setAttribute('fill', segment.textColor);
        txt.setAttribute('font-size', '14');
        txt.setAttribute('font-weight', 'bold');
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('transform', `rotate(${textAngle + 90} ${centerX + radius * 0.65 * Math.cos(textRad)} ${centerY + radius * 0.65 * Math.sin(textRad)})`);
        txt.textContent = segment.label;
        svg.appendChild(txt);
    });
}


// ==========================================
// 🎰 遊戲核心：載入、顯示、轉動邏輯
// ==========================================
async function loadUserData() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // 🚀 關鍵：先呼叫 wheel/status 觸發後端日期檢查與補給發放
            const statusRes = await fetch(`${API_BASE}/wheel/status`, { 
                headers: { 'Authorization': 'Bearer ' + token } 
            });
            const statusData = await statusRes.json();
            serverRewards = statusData.rewards;

            // 抓取詳細使用者資料
            const res = await fetch(`${API_BASE}/user?t=${Date.now()}`, { 
                headers: { 'Authorization': 'Bearer ' + token } 
            });
            const data = await res.json();
            
            gameTokens = data.gameTokens || 0;
            promoTokens = data.promoTokens || 0;
            userLevel = data.userLevel || 1;
            
            // 同步轉盤次數 (優先使用 status 回傳的最新數字)
            spinData = { 
                newUserSpins: data.newUserSpins || 0, 
                weeklySpins: statusData.weeklySpins !== undefined ? statusData.weeklySpins : (data.weeklySpins || 0)
            };
            
            userLuckCards = data.luckCards || {};
        } catch (e) { 
            console.error("Load User Data Failed:", e); 
        }
    } else {
        // 遊客狀態保持不變
        gameTokens = 5000; userLevel = 1;
        spinData = { newUserSpins: 999, weeklySpins: 0 }; 
        userLuckCards = {};
    }
    renderPowerups(); 
    updateDisplay();
}

function updateDisplay() {
    const isMember = !!localStorage.getItem('token');
    document.getElementById('gameTokens').textContent = Math.floor(gameTokens).toLocaleString();
    document.getElementById('userLevel').textContent = 'Lv' + userLevel;

    // FIX 1: Update rewardLevel element to reflect current level
    const rewardLevelEl = document.getElementById('rewardLevel');
    if (rewardLevelEl) rewardLevelEl.textContent = 'Lv' + userLevel;

    // FIX 2: Update potSmall and potMid with level-appropriate reward values
    const potSmallEl = document.getElementById('potSmall');
    const potMidEl = document.getElementById('potMid');
    const potGrandEl = document.getElementById('potGrand');
    if (potSmallEl && potMidEl) {
        const activeRewards = serverRewards || rewardTable;
        const lvIndex = Math.min(userLevel, 4) - 1;
        const smallVal = activeRewards.SMALL[lvIndex];
        const midVal = activeRewards.MID[lvIndex];
        potSmallEl.textContent = smallVal >= 1000000 ? (smallVal / 1000000) + 'M' : (smallVal / 1000) + 'k';
        potMidEl.textContent = midVal >= 1000000 ? (midVal / 1000000) + 'M' : (midVal / 1000) + 'k';

        if (potGrandEl && activeRewards.GRAND) {
            potGrandEl.textContent = activeRewards.GRAND.toLocaleString(); 
        }
    }

    const promoEl = document.getElementById('promoTokens');
    if (promoEl) {
        promoEl.textContent = Number(promoTokens).toFixed(2);
    }
    
    const spinInfo = document.getElementById('spinInfo');
    const spinBtn = document.getElementById('spinBtn');
    
    if (!isMember) {
        spinInfo.innerHTML = '<span class="text-yellow-400 font-bold">🎮 Guest Mode: Unlimited Spins!</span>';
        spinBtn.disabled = false;
        spinBtn.querySelector('span').textContent = 'SPIN NOW';
        spinBtn.className = "group relative w-full md:w-auto min-w-[250px] px-8 py-5 rounded-2xl text-2xl font-bold transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] border-2 border-yellow-200 overflow-hidden";
    } else {
        const rem = spinData.newUserSpins + spinData.weeklySpins;
        spinInfo.textContent = rem > 0 ? `Spins left: ${rem}` : 'No spins left.';
        spinBtn.disabled = rem <= 0;
        spinBtn.querySelector('span').textContent = rem <= 0 ? 'No Spins Left' : 'SPIN NOW';
        
        if (rem <= 0) {
             spinBtn.className = "w-full md:w-auto min-w-[250px] px-8 py-5 rounded-2xl text-2xl font-bold bg-slate-700 text-slate-500 cursor-not-allowed border-2 border-slate-600";
        } else {
             spinBtn.className = "group relative w-full md:w-auto min-w-[250px] px-8 py-5 rounded-2xl text-2xl font-bold transition-all duration-300 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 hover:scale-105 shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] border-2 border-yellow-200 overflow-hidden cursor-pointer";
        }
    }

    var fmt = (n) => n >= 1000000 ? (n/1000000).toFixed(0)+'M' : (n/1000).toFixed(1)+'k';
    var thresholds = [0, 10000, 10000000, 100000000];
    var nextLevel = userLevel < 4 ? thresholds[userLevel] : 1000000000;
    var prevThreshold = userLevel > 1 ? thresholds[userLevel-1] : 0;
    var percent = userLevel < 4 ? ((gameTokens - prevThreshold) / (nextLevel - prevThreshold)) * 100 : 100;
    document.getElementById('levelProgressBar').style.width = Math.min(Math.max(percent, 5), 100) + '%';
    document.getElementById('levelProgress').textContent = fmt(gameTokens) + ' / ' + fmt(nextLevel);
}

async function spinWheel() {
    if (spinning) return;
    const token = localStorage.getItem('token');
    const remaining = (spinData.newUserSpins || 0) + (spinData.weeklySpins || 0);

    if (token && remaining <= 0) return alert("No spins left!");

    spinning = true;
    document.getElementById('spinBtn').disabled = true;

    if (token) {
        try {
            const response = await fetch(`${API_BASE}/wheel/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ activeCards: selectedCards })
            });
            const result = await response.json();
            
            const sequence = result.spinSequence || [result.targetIndex !== undefined ? result.targetIndex : result.finalTargetIndex];
            const spinInfo = document.getElementById('spinInfo');

            for (let i = 0; i < sequence.length; i++) {
                if (i > 0) {
                    spinInfo.innerHTML = '<span class="text-blue-300 animate-pulse">🎲 Double Chance! Rerolling...</span>';
                    await new Promise(r => setTimeout(r, 1000)); 
                }
                await runSingleSpin(sequence[i]);
            }

            // --- 重點：更新領取後的剩餘次數 ---
            gameTokens = result.newBalance;
            spinData = { 
                newUserSpins: result.newUserSpins, 
                weeklySpins: result.weeklySpins 
            };
            userLevel = result.userLevel;
            
            if (result.remainingCards) userLuckCards = result.remainingCards;
            
            if (result.newUnlockedAchievements && result.newUnlockedAchievements.length > 0) {
                if(typeof AchievementToast !== 'undefined') AchievementToast.add(result.newUnlockedAchievements);
            }
            handleResult(result.type, result.amount, result.usedCards, result.levelUpBonus);
            
            // 轉完後重新刷新 Header，這樣領取完次數後，紅點/公告會消失
            updateHeaderStatus();

        } catch (e) { 
            console.error(e);
            spinning = false; 
        }
    } else {
        // 遊客模式... (保持原樣)
        const targetIndex = Math.floor(Math.random() * segments.length);
        await runSingleSpin(targetIndex);
        let amount = (segments[targetIndex].type === 'EMPTY') ? 0 : 1000;
        gameTokens += amount;
        handleResult(segments[targetIndex].type, amount, [], 0);
    }
    
    spinning = false; 
    selectedCards = []; 
    updateDisplay(); 
    renderPowerups();
}

// 物理動畫
function runSingleSpin(targetIndex) {
    return new Promise(resolve => {
        const anglePerSegment = 360 / 8; // 45度

        // 1. 計算目標格子中心點距離 Index 起點的距離
        const distFromZeroCenter = (targetIndex * anglePerSegment) + (anglePerSegment / 2);

        // 2. 核心修正：
        // 因為 Index 0 本來就在頂部，要把 Index N 轉上來，就是「逆時針」旋轉
        const desiredRotation = -distFromZeroCenter;
        const currentRotationMod = rotation % 360;

        let delta = (desiredRotation - currentRotationMod) % 360;

        // 確保旋轉方向永遠為一致 (PDF 規範的負數旋轉)
        if (delta > 0) delta -= 360;

        // 3. 累積旋轉量 = 目前角度 + 偏移量 - (5圈基礎旋轉)
        const totalDelta = delta - (360 * 5);
        const targetRotation = rotation + totalDelta;

        const startTime = performance.now();
        const startRot = rotation;

        function animate(time) {
            let progress = Math.min((time - startTime) / 6000, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            rotation = startRot + (targetRotation - startRot) * ease;

            document.getElementById('wheel').style.transform = `rotate(${rotation}deg)`;

            // 指針擺動
            let mod = ((rotation % 45) + 45) % 45;
            tickerAngle = mod > 38 ? ((mod - 38) / 7) * -40 : tickerAngle * 0.6;
            document.getElementById('wheelTicker').style.transform = `translateX(-50%) rotate(${tickerAngle}deg)`;

            if (progress < 1) requestAnimationFrame(animate);
            else {
                document.getElementById('wheelTicker').style.transform = `translateX(-50%) rotate(0deg)`;
                resolve();
            }
        }
        requestAnimationFrame(animate);
    });
}


// ==========================================
// 🎉 結果顯示與 Modal 邏輯
// ==========================================
function handleResult(type, amount, usedCards, levelUpBonus) {
    if (amount > 0) {
        if(type === 'GRAND') {
            var duration = 5 * 1000;
            var animationEnd = Date.now() + duration;
            var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };
            var random = (min, max) => Math.random() * (max - min) + min;
            var interval = setInterval(function() {
                var timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                var particleCount = 50 * (timeLeft / duration);
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        } else {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }
    showModal(amount > 0, type, amount, usedCards, levelUpBonus);
}

function showModal(isWin, type, amount, usedCards, levelUpBonus) {
    const modal = document.getElementById('winnerModal');
    const token = localStorage.getItem('token');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const desc = document.getElementById('modalDesc');
    const amtDiv = document.getElementById('modalAmount').parentElement;
    const amtText = document.getElementById('modalAmount');
    const btn = document.getElementById('claimBtn');
    
    modal.classList.remove('hidden');

    const showBigWarning = (type === 'GRAND' || amount > 100000); // 只有大獎才吵遊客
    document.getElementById('guestWarning').classList.toggle('hidden', !(!token && showBigWarning));
    document.getElementById('guestSignUpBtn').classList.toggle('hidden', !(!token && showBigWarning));

    if (isWin) {
        icon.textContent = type === 'GRAND' ? '👑' : '🎉';
        title.textContent = type === 'GRAND' ? 'JACKPOT!!' : 'Big Win!';
        title.className = "text-3xl font-black text-yellow-400 mb-2 uppercase italic";
        btn.textContent = "CLAIM REWARD";
        btn.className = "w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-purple-900 font-black rounded-xl shadow-lg transform transition hover:scale-[1.02]";

        let descText = "You've struck luck! Here is your reward:";
        if (usedCards && usedCards.includes('Double Chance')) descText = "🎲 Double Chance! You kept BOTH rewards!";
        if (usedCards && usedCards.includes('Lucky Star')) descText += " ⭐ 2x Bonus Applied!";
        if (levelUpBonus && levelUpBonus > 0) {
             descText += `\n🚀 LEVEL UP! Fortune Booster: +${levelUpBonus.toLocaleString()} bonus!`;
        }
        desc.textContent = descText;
        desc.style.whiteSpace = 'pre-line';

        amtDiv.classList.remove('hidden');
        amtText.textContent = amount.toLocaleString();

    } else {
        icon.textContent = '😢';
        title.textContent = 'So Close!';
        title.className = "text-3xl font-black text-slate-400 mb-2 uppercase italic";
        btn.textContent = "TRY AGAIN";
        btn.className = "w-full py-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl shadow-lg transform transition hover:scale-[1.02]";
        desc.textContent = "It was empty this time. Don't give up!";
        amtDiv.classList.add('hidden');
    }
}


// ==========================================
// 🎴 功能輔助 (UI、卡片切換)
// ==========================================
function toggleUserMenu() { document.getElementById('userDropdown').classList.toggle('hidden'); }
function closeModal() { document.getElementById('winnerModal').classList.add('hidden'); }
function handleLogout() { document.getElementById('logoutModal').classList.remove('hidden'); }
function closeLogoutModal() { document.getElementById('logoutModal').classList.add('hidden'); }
function confirmLogout() { localStorage.clear(); window.location.href = 'login.html'; }

window.toggleCard = (c) => { 
    if(spinning)return; 
    const i=selectedCards.indexOf(c); 
    if(i>-1)selectedCards.splice(i,1); 
    else selectedCards.push(c); 
    renderPowerups(); 
};

function renderPowerups() {
    const c = document.getElementById('cardSelector');
    let h = ''; let has = false;
    ['Lucky Star', 'Double Chance'].forEach(n => {
        const cnt = userLuckCards[n] || 0;
        if (cnt > 0) { 
            has = true; const i = CARD_INFO[n]; const s = selectedCards.includes(n) ? 'card-selected' : 'border-purple-500/30 bg-purple-900/40 hover:bg-purple-800/60';
            h += `<div onclick="toggleCard('${n}')" class="cursor-pointer transition-all duration-300 rounded-xl border-2 p-2 flex items-center gap-3 min-w-[140px] ${s} ${i.color}">
                <span class="text-2xl">${i.icon}</span><div class="text-left"><div class="text-xs font-bold uppercase tracking-wider">${i.label}</div><div class="text-xs text-white/60">Owned: ${cnt}</div></div></div>`;
        }
    });
    c.innerHTML = has ? h : '<p class="text-purple-400/30 text-xs italic">Get power-up cards from Gacha!</p>';
}


// ==========================================
// 🚀 頁面初始化
// ==========================================
window.addEventListener('load', () => { 
    initWheel();
});

window.addEventListener('pageshow', () => { 
    loadUserData(); 
    updateHeaderStatus(); 
});
