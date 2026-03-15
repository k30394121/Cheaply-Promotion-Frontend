# 🎮 Cheaply Promotion Platform - Official Frontend

Welcome to the official frontend repository for the **Cheaply Promotion Game**. 

This repository contains the complete frontend source code (HTML, CSS, Vanilla JS) that powers our user interface, animations, and Web3 wallet interactions.

## 🛡️ Transparency & Trust: Why is this Open Source?

In the Web3 space, trust is everything. We understand that connecting your wallet to a new decentralized application (DApp) or promotional platform requires caution. 

We have open-sourced our entire frontend architecture for one simple reason: **To prove that our wallet connection logic is 100% clean and safe.** By reviewing the code in this repository (specifically files like `buy-tokens.js` and `wallet.js`), anyone can independently verify that:
1. **No Malicious Code:** We do not have any hidden scripts that attempt to drain your wallet or steal your private keys.
2. **Safe Signatures:** We only request standard signatures and transactions strictly necessary for purchasing tokens or binding your account.
3. **What You See Is What You Get:** The UI you interact with directly matches the code here.

## 🏗️ Architecture: What is NOT in this Repository?

To ensure the fairness of the game and the absolute security of our tokenomics, we utilize a **Hybrid Architecture (Off-chain Logic + On-chain Settlement)**.

Therefore, the following core systems are **intentionally kept closed-source** and securely hosted on our private backend servers:
* **Random Number Generation (RNG):** The logic and probabilities for the gacha, lottery, and wheel spins. (This prevents malicious actors from calculating exact outcomes or exploiting the RNG).
* **Database & User Balances:** The actual off-chain ledgers (`users.db`) that store your game tokens and promo tokens securely before they are minted/withdrawn on-chain.
* **Server Authority (`server.js`):** The backend API endpoints that validate every single transaction and anti-cheat mechanism.

When you click "Spin" or "Draw", this frontend simply sends a secure API request to our backend. The backend does the heavy lifting, calculates the fair result, and returns it to this frontend for the visual celebration.

## 🔗 Official Links

* **Official App:** https://game.cheaply.click/
* **Promotional Website:** https://promotion.cheaply.click/
* **Discord Community:** https://discord.com/invite/mXnTCtapGF
* **X (Twitter):** [@Cheaply147988](https://x.com/Cheaply147988)

## ⚠️ Security Disclaimer
Please ensure you are always interacting with our official domains. The Cheaply team will **never** DM you first, ask for your seed phrase, or ask you to send funds to a random address. Always verify the transactions in your Phantom wallet before approving.
