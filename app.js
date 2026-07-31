/**
 * Kore Exchange – Main App Script
 * Features: Banner Carousel, Bottom Nav, Live Binance Prices, Toast Notifications
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ═══════════════════════════════════════════════════════════
  //  BANNER CAROUSEL
  // ═══════════════════════════════════════════════════════════
  const track    = document.getElementById('carouselTrack');
  const dotsEl   = document.querySelectorAll('#carouselDots .dot');
  const TOTAL    = 3;
  let current    = 0;
  let autoTimer  = null;
  let isDragging = false;
  let startX     = 0;
  let dragDelta  = 0;

  if (track) {
    window.goToSlide = function(index) {
      current = ((index % TOTAL) + TOTAL) % TOTAL;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsEl.forEach((d, i) => d.classList.toggle('active', i === current));
    };

    const nextSlide  = () => goToSlide(current + 1);
    const startAuto  = () => { stopAuto(); autoTimer = setInterval(nextSlide, 2800); };
    const stopAuto   = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };

    // Touch events
    track.addEventListener('touchstart', e => {
      stopAuto(); startX = e.touches[0].clientX; isDragging = true;
    }, { passive: true });

    track.addEventListener('touchmove', e => {
      if (!isDragging) return;
      dragDelta = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
      if (Math.abs(dragDelta) > 40) goToSlide(dragDelta < 0 ? current + 1 : current - 1);
      isDragging = false; dragDelta = 0;
      setTimeout(startAuto, 3000);
    });

    // Mouse drag
    track.addEventListener('mousedown', e => {
      stopAuto(); startX = e.clientX; isDragging = true;
      track.classList.add('dragging');
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      dragDelta = e.clientX - startX;
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      if (Math.abs(dragDelta) > 40) goToSlide(dragDelta < 0 ? current + 1 : current - 1);
      isDragging = false; dragDelta = 0;
      track.classList.remove('dragging');
      setTimeout(startAuto, 3000);
    });

    startAuto();
  }

  // ═══════════════════════════════════════════════════════════
  //  BOTTOM NAVIGATION – Active State
  // ═══════════════════════════════════════════════════════════
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ═══════════════════════════════════════════════════════════
  //  LIVE CRYPTO PRICES – Binance API (5 second refresh)
  // ═══════════════════════════════════════════════════════════
  const coinSymbols = [
    'BTC','ETH','TRUMP','XTZ','ADA','TRX','BNB','YFI',
    'ETC','XRP','SOL','USDC','LTC','KNC','DOGE','VET',
    'SHIB','QTUM','MELANIA'
  ];

  function formatPrice(price) {
    if (price < 0.00001)  return '$' + price.toFixed(8);
    if (price < 0.001)    return '$' + price.toFixed(6);
    if (price < 0.01)     return '$' + price.toFixed(5);
    if (price < 1)        return '$' + price.toFixed(4);
    if (price < 10)       return '$' + price.toFixed(3);
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  async function fetchLiveMarketData() {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!res.ok) return;
      const data = await res.json();

      const priceMap = {};
      data.forEach(item => {
        if (item.symbol.endsWith('USDT')) {
          priceMap[item.symbol.replace('USDT', '')] = {
            price:  parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent)
          };
        }
      });

      coinSymbols.forEach(sym => {
        const priceEl  = document.getElementById(`price-${sym}`);
        const changeEl = document.getElementById(`change-${sym}`);
        const coinData = priceMap[sym];
        if (!coinData) return;

        if (priceEl)  priceEl.textContent = formatPrice(coinData.price);
        if (changeEl) {
          const isUp  = coinData.change >= 0;
          const prefix = isUp ? '+' : '';
          changeEl.textContent = `${prefix}${coinData.change.toFixed(2)}%`;
          changeEl.className   = `coin-change ${isUp ? 'change-up' : 'change-down'}`;
        }
      });

    } catch (err) {
      console.warn('[Kore] Could not fetch market data:', err.message);
    }
  }

  if (document.getElementById('coinList')) {
    fetchLiveMarketData();
    setInterval(fetchLiveMarketData, 5000);
  }

  // ═══════════════════════════════════════════════════════════
  //  TOAST NOTIFICATION (global)
  // ═══════════════════════════════════════════════════════════
  window.showToast = function(message, type = 'gold') {
    const existing = document.querySelector('.toast');
    if (existing) { existing.classList.remove('toast-show'); existing.remove(); }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('toast-show'));
    });

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  };

  // ═══════════════════════════════════════════════════════════
  //  ACTION ITEMS – Require Login Check
  // ═══════════════════════════════════════════════════════════
  const actionItems = document.querySelectorAll('.action-item');
  actionItems.forEach(item => {
    item.addEventListener('click', () => {
      const isLoggedIn = !!localStorage.getItem('authToken');
      if (!isLoggedIn) {
        window.location.href = 'login.html';
      }
    });
  });

  // Profile button
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      const isLoggedIn = !!localStorage.getItem('authToken');
      window.location.href = isLoggedIn ? 'dashboard.html' : 'login.html';
    });
  }

  // Update Login Button state if logged in
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn && localStorage.getItem('authToken')) {
    loginBtn.textContent = 'Dashboard';
    loginBtn.onclick = () => window.location.href = 'dashboard.html';
  }

  // Coin row click handlers
  const coinRows = document.querySelectorAll('.coin-row');
  coinRows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't fire if onclick attr already handles it
      const sym = row.querySelector('.coin-symbol')?.innerText;
      if (sym) showToast(`${sym}/USDT selected`, 'gold');
    });
  });

});
