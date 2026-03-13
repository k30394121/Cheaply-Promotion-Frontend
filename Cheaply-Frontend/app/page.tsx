"use client";

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [pdfConfig, setPdfConfig] = useState<{ isOpen: boolean; title: string; src: string }>({ isOpen: false, title: '', src: '' });
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSubmenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubmenuOpen(!isSubmenuOpen);
  };

  const openPdf = (title: string, filename: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(filename, '_blank');
    } else {
      setPdfConfig({ isOpen: true, title: `${title.toUpperCase()} WHITEPAPER`, src: filename });
      document.body.style.overflow = 'hidden';
    }
    setIsMenuOpen(false);
  };

  const closePdf = () => {
    setPdfConfig({ isOpen: false, title: '', src: '' });
    document.body.style.overflow = 'auto';
  };

  const openRoadmapImage = () => {
    setIsRoadmapOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeRoadmapImage = () => {
    setIsRoadmapOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <Head>
        <title>Cheaply - Promotion Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          --dark-bg: #0a0e27;
          --darker-bg: #060a1f;
          --card-bg: rgba(255, 255, 255, 0.03);
          --border-color: rgba(255, 255, 255, 0.08);
          --text-primary: #ffffff;
          --text-secondary: #a0aec0;
        }

        body, html { font-family: 'Inter', sans-serif; background: var(--dark-bg); color: var(--text-primary); overflow-x: hidden; scroll-behavior: smooth; }
        button, a { -webkit-tap-highlight-color: transparent; }

        .grid-background { position: fixed; inset: 0; background-image: linear-gradient(rgba(79, 70, 229, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79, 70, 229, 0.03) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; z-index: 1; }
        .gradient-orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.15; pointer-events: none; z-index: 2; }
        .orb-1 { top: -10%; right: -10%; width: 600px; height: 600px; background: radial-gradient(circle, #4f46e5, transparent 70%); }
        .orb-2 { bottom: -15%; left: -10%; width: 700px; height: 700px; background: radial-gradient(circle, #7c3aed, transparent 70%); }

        .custom-navbar { position: fixed; top: 0; left: 0; width: 100%; height: 70px; z-index: 1000; backdrop-filter: blur(20px); background: rgba(10, 14, 39, 0.6); border-bottom: 1px solid var(--border-color); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .custom-navbar.scrolled { background: rgba(10, 14, 39, 0.95); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3); }
        .logo-container { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .logo-icon { width: 36px; height: 36px; background: var(--primary-gradient); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3); }
        .logo-text { font-size: 20px; font-weight: 700; }

        .menu-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 8px; color: white; font-weight: 600; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; cursor: pointer; }
        .menu-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
        .menu-container { position: relative; z-index: 1001; }
        #popup-menu { position: absolute; top: calc(100% + 16px); right: 0; z-index: 999; opacity: 0; visibility: hidden; transform: translateY(-10px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(15, 20, 45, 0.98); backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: 12px; min-width: 250px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5); }
        #popup-menu.active { opacity: 1; visibility: visible; transform: translateY(0); }
        .menu-item { display: flex; align-items: center; padding: 14px 18px; color: var(--text-secondary); text-decoration: none; font-weight: 500; font-size: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.2s ease; cursor: pointer; }
        .menu-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
        .submenu { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; background: rgba(0, 0, 0, 0.3); }
        .submenu.open { max-height: 200px; }
        .submenu a { display: block; padding: 12px 18px 12px 50px; color: var(--text-secondary); font-size: 13px; border-top: 1px solid rgba(255, 255, 255, 0.03); transition: all 0.2s ease; cursor: pointer; }
        .submenu a:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }

        .hero-section { position: relative; z-index: 10; min-height: 100vh; display: flex; align-items: center; padding: 100px 20px 60px; justify-content: center; }
        .hero-content { max-width: 1200px; margin: 0 auto; text-align: center; width: 100%; }
        .hero-logo img { border-radius: 50%; width: 200px; max-width: 100%; height: auto; margin: 0 auto 32px; filter: drop-shadow(0 0 30px rgba(79, 70, 229, 0.4)); }
        .hero-title { font-size: clamp(2rem, 8vw, 6rem); font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
        .hero-title .subtitle { display: block; font-size: clamp(1.75rem, 6vw, 4rem); color: var(--text-primary); }
        .hero-description { font-size: clamp(1rem, 3vw, 1.875rem); font-weight: 300; line-height: 1.6; color: var(--text-secondary); max-width: 700px; margin: 0 auto 32px; }
        .hero-highlight { color: #818cf8; font-weight: 600; }

        .big-buttons-grid { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 900px; margin: 0 auto 40px; }
        .social-buttons-grid { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 800px; margin: 0 auto 48px; }
        .stats-grid { display: grid; grid-template-columns: 1fr; gap: 16px; max-width: 1000px; margin: 0 auto; }

        .big-button { position: relative; background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%); border: 2px solid rgba(102, 126, 234, 0.4); border-radius: 20px; padding: 24px 20px; cursor: pointer; transition: all 0.4s; overflow: hidden; text-align: center; color: white;}
        .big-button:hover { border-color: rgba(102, 126, 234, 0.8); transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 48px rgba(102, 126, 234, 0.35); }
        .big-button:active { transform: scale(0.98); }
        .big-button-icon { font-size: 2.5rem; margin-bottom: 12px; position: relative; z-index: 1; animation: float 3s ease-in-out infinite; }
        .big-button-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 6px; position: relative; z-index: 1; }
        .big-button-desc { font-size: 0.875rem; color: var(--text-secondary); position: relative; z-index: 1; }

        .social-btn { background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%); border: 2px solid rgba(102, 126, 234, 0.3); border-radius: 12px; padding: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; color: white; font-weight: 600; font-size: 1.125rem; cursor: pointer; transition: all 0.3s; }
        .social-btn:hover { border-color: rgba(102, 126, 234, 0.7); transform: translateY(-3px) scale(1.02); }
        .social-btn:active { transform: scale(0.98); }

        .stat-card { background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%); border: 1.5px solid rgba(102, 126, 234, 0.2); border-radius: 16px; padding: 20px; transition: all 0.4s; }
        .stat-value { font-size: 2rem; font-weight: 800; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-label { font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
        .stat-description { font-size: 0.875rem; color: var(--text-secondary); }

        .content-section { position: relative; z-index: 10; padding: 60px 20px; }
        .section-container { max-width: 1100px; margin: 0 auto; }
        .section-card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 24px; padding: clamp(1.5rem, 5vw, 4rem); text-align: center; }
        .section-title { font-size: clamp(1.5rem, 5vw, 3rem); font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
        .section-description { font-size: clamp(0.9375rem, 2vw, 1.125rem); line-height: 1.7; color: var(--text-secondary); margin-bottom: 24px; max-width: 700px; margin: 0 auto; }
        .primary-btn { display: inline-block; padding: 14px 32px; background: var(--primary-gradient); border: none; border-radius: 12px; color: white; font-weight: 700; cursor: pointer; transition: all 0.3s; width: 100%; max-width: 300px; }
        .primary-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 14px 40px rgba(79, 70, 229, 0.5); }
        .primary-btn:active { transform: scale(0.98); }

        .roadmap-title { font-size: clamp(2rem, 6vw, 4rem); font-weight: 800; margin-bottom: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #f093fb 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .roadmap-image-container { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 16px; cursor: pointer; text-align: center; overflow: hidden; }
        .roadmap-image-container img { width: 100%; height: auto; border-radius: 12px; transition: transform 0.5s ease; }
        .roadmap-image-container:hover img { transform: scale(1.02); }

        /* =============================================
           FIX: Roadmap Modal — 手機版可讀性修正
           ============================================= */

        /* 手機版：橫向滾動容器，圖片以原始比例顯示不被壓縮 */
        .roadmap-modal-body {
          width: 100%;
          height: 100%;
          overflow: auto;               /* 雙向滾動 */
          -webkit-overflow-scrolling: touch;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 16px;
          box-sizing: border-box;
        }

        .roadmap-modal-img {
          /* 手機版：最小寬度設為螢幕 2x，確保細節可讀，使用者可左右滑動 */
          min-width: min(200vw, 1200px);
          max-width: min(200vw, 1200px);
          height: auto;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          /* 允許 pinch-to-zoom */
          touch-action: auto;
          cursor: zoom-in;
        }

        /* 桌機版：回到原本的置中 fit 模式 */
        @media (min-width: 768px) {
          .roadmap-modal-body {
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .roadmap-modal-img {
            min-width: unset;
            max-width: 90vw;
            max-height: 90vh;
            width: auto;
            cursor: default;
          }
        }

        footer { position: relative; z-index: 10; background: var(--darker-bg); border-top: 1px solid var(--border-color); padding: 40px 20px; text-align: center; }

        @media (min-width: 768px) {
          .custom-navbar { height: 80px; }
          .logo-icon { width: 42px; height: 42px; font-size: 20px; }
          .logo-text { font-size: 22px; }
          .menu-btn { padding: 10px 20px; font-size: 14px; }
          .hero-logo img { width: 280px; margin-bottom: 48px; }
          .hero-description { margin-bottom: 48px; }
          .big-buttons-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 48px; }
          .big-button { padding: 40px 24px; }
          .big-button-icon { font-size: 3rem; margin-bottom: 16px; }
          .big-button-title { font-size: 1.5rem; margin-bottom: 8px; }
          .social-buttons-grid { grid-template-columns: repeat(3, 1fr); margin-bottom: 64px; }
          .social-btn { padding: 20px; font-size: 1.25rem; }
          .stats-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
          .stat-card { padding: 24px; }
          .stat-value { font-size: 2.5rem; }
          .content-section { padding: 80px 24px; }
          .section-title { margin-bottom: 24px; }
          .section-description { margin-bottom: 32px; }
          .primary-btn { padding: 16px 40px; width: auto; }
          .roadmap-title { margin-bottom: 64px; }
          .roadmap-image-container { padding: 24px; border-radius: 24px; }
          .roadmap-image-container img { border-radius: 16px; }
          footer { padding: 48px 24px; }
        }

        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
      `}} />

      <div className="grid-background"></div>
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>

      <nav className={`custom-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center h-full">
          <div className="logo-container">
            <div className="logo-icon">C</div>
            <span className="logo-text">Cheaply</span>
          </div>

          <div className="menu-container" ref={menuRef}>
            <button className="menu-btn" onClick={toggleMenu}>
              <span className="text-xs md:text-sm uppercase tracking-wide">
                {isMenuOpen ? 'Close' : 'Menu'}
              </span>
              <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>

            <div id="popup-menu" className={isMenuOpen ? 'active' : ''}>
              <a href="#home" className="menu-item" onClick={toggleMenu}>
                <i className="fa-solid fa-house text-blue-400 w-5"></i>
                <span>Home</span>
              </a>

              <div className="relative">
                <div className="menu-item cursor-pointer flex justify-between items-center" onClick={toggleSubmenu}>
                  <div className="flex items-center">
                    <i className="fa-solid fa-file-alt text-purple-400 w-5"></i>
                    <span>Token Whitepapers</span>
                  </div>
                  <i 
                    className="fa-solid fa-chevron-down text-xs transition-transform duration-300" 
                    style={{ transform: isSubmenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  ></i>
                </div>
                <div className={`submenu ${isSubmenuOpen ? 'open' : ''}`}>
                  <a onClick={() => openPdf('ChMe Token', '/chmetokenwhitepaper.pdf')}>
                    <span className="text-blue-400 font-bold mr-2">●</span> ChMe Docs
                  </a>
                  <a onClick={() => openPdf('ChToken', '/Ch.pdf')}>
                    <span className="text-pink-400 font-bold mr-2">●</span> Ch Docs
                  </a>
                </div>
              </div>

              <a href="#roadmap" className="menu-item" onClick={toggleMenu}>
                <i className="fa-solid fa-map text-green-400 w-5"></i>
                <span>Roadmap</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section id="home" className="hero-section">
          <div className="hero-content fade-in-up">
            <div className="hero-logo">
              <img src="/icon.png" alt="Cheaply Promotion Platform" />
            </div>

            <h1 className="hero-title">
              <span className="subtitle">Innovation Lab</span>
            </h1>

            <p className="hero-description">
              Your Gateway to <span className="hero-highlight">New DeFi</span> on Solana <br /><br />
              Starts with a <span className="hero-highlight" style={{ color: '#f093fb' }}>Game</span>.
            </p>

            <div className="big-buttons-grid">
              <button className="big-button" onClick={() => window.location.href = '/home.html'}>
                <div className="big-button-icon">🎮</div>
                <div className="big-button-title">PROMO GAME</div>
                <div className="big-button-desc">Start Your Journey</div>
              </button>

              <button className="big-button" onClick={() => window.location.href = '#demo1'}>
                <div className="big-button-icon">🚀</div>
                <div className="big-button-title">DeFi Prototype</div>
                <div className="big-button-desc">Building in Progress</div>
              </button>

              <button className="big-button" onClick={() => window.location.href = '/About.html'}>
                <div className="big-button-icon">⚡</div>
                <div className="big-button-title">Core Mechanics</div>
                <div className="big-button-desc">How It Works</div>
              </button>
            </div>

            <div className="social-buttons-grid">
              {/* Join Discord 按鈕... */}
              <button className="social-btn" style={{ borderColor: '#5865F2' }} onClick={() => window.open('https://discord.gg/mXnTCtapGF', '_blank')}>
                <i className="fa-brands fa-discord" style={{ color: '#5865F2' }}></i>
                <span>Join Discord</span>
              </button>

              {/* Follow X 按鈕... */}
              <button className="social-btn" onClick={() => window.open('https://x.com/Cheaply147988', '_blank')}>
                <svg viewBox="0 0 24 24" width="24" height="24" className="md:w-[30px] md:h-[30px]" fill="currentColor" style={{ position: 'relative', zIndex: 1 }}>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Follow X</span>
              </button>

              {/* 新增：Follow Github 按鈕 */}
              <button className="social-btn" style={{ borderColor: '#ffffff' }} onClick={() => window.open('https://github.com/k30394121/Cheaply-Promotion-Frontend', '_blank')}>
                <i className="fa-brands fa-github" style={{ color: '#ffffff' }}></i>
                <span>Follow Github</span>
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">ChMe</div>
                <div className="stat-label">50M Tokens</div>
                <div className="stat-description">Total Supply</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">Game</div>
                <div className="stat-label">FREE</div>
                <div className="stat-description">Just For Fun</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Support</div>
                <div className="stat-description">Community Driven</div>
              </div>
            </div>
          </div>
        </section>

        <section id="whitepaper1" className="content-section">
          <div className="section-container">
            <div className="section-card">
              <h2 className="section-title">
                ChMe <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TOKEN WHITEPAPER</span>
              </h2>
              <p className="section-description">
                Designed for viral growth.<br />ChMe is the key to project expansion, featuring a unique exchange model that redefines how promotional value is captured.
              </p>
              <button onClick={() => openPdf('ChMe Token', '/chmetokenwhitepaper.pdf')} className="primary-btn">
                Read Document
              </button>
            </div>
          </div>
        </section>

        <section id="whitepaper2" className="content-section">
          <div className="section-container">
            <div className="section-card">
              <h2 className="section-title">
                Ch <span style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TOKEN WHITEPAPER</span>
              </h2>
              <p className="section-description">
                The future backbone of our DeFi protocol.<br />Token implementation is scheduled to activate simultaneously with the official Mainnet deployment.
              </p>
              <button onClick={() => openPdf('ChToken', '/Ch.pdf')} className="primary-btn" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', boxShadow: '0 8px 25px rgba(240, 147, 251, 0.3)' }}>
                Read Document
              </button>
            </div>
          </div>
        </section>

        <section id="roadmap" className="content-section">
          <div className="section-container">
            <h2 className="roadmap-title">PROJECT <br /><br /> ROADMAP</h2>
            <div className="roadmap-image-container" onClick={openRoadmapImage}>
              <img src="/roadmap.png" alt="Project Roadmap" />
              <p className="mt-4 text-sm text-gray-400 font-medium">
                <i className="fa-solid fa-expand mr-2"></i>Click to view full size
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base text-white" style={{ background: 'var(--primary-gradient)' }}>C</div>
            <span className="text-xl font-bold">Cheaply</span>
          </div>
          <p className="text-sm text-gray-400 mb-8">Build the future</p>
          <div className="text-xs text-gray-600 font-medium">
            © 2026 Cheaply Promotion Platform. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* PDF Viewer Modal */}
      {pdfConfig.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.97)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', background: 'var(--darker-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 className="text-white font-bold tracking-widest text-sm md:text-base truncate pr-4">{pdfConfig.title}</h3>
            <button onClick={closePdf} style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <div style={{ height: 'calc(100vh - 60px)', background: '#1a1a2e' }}>
            <iframe src={pdfConfig.src} style={{ width: '100%', height: '100%', border: 'none' }} />
          </div>
        </div>
      )}

      {/* FIX: Roadmap Modal — 手機版可讀性修正 */}
      {isRoadmapOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            // FIX 原始 bug: padding 原本寫 '16px md:padding-24px'（無效 CSS）
            // 現在改為純 JS 判斷，padding 移至 .roadmap-modal-body CSS class 處理
          }}
        >
          {/* 關閉按鈕：固定在右上角，不隨滾動移動 */}
          <button
            onClick={closeRoadmapImage}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              zIndex: 10000,
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          {/* 手機版提示文字：固定在底部 */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            zIndex: 10000,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
          }}
          className="md:hidden"
          >
            <i className="fa-solid fa-hand-pointer mr-1"></i>
            Scroll to explore · Pinch to zoom
          </div>

          {/* 滾動容器：手機版雙向滾動，桌機版置中 */}
          <div className="roadmap-modal-body" onClick={(e) => { if (e.target === e.currentTarget) closeRoadmapImage(); }}>
            <img
              src="/roadmap.png"
              alt="Project Roadmap"
              className="roadmap-modal-img"
            />
          </div>
        </div>
      )}
    </>
  );
}
