// Kore Exchange App Logic

document.addEventListener('DOMContentLoaded', () => {

  // ── Banner Carousel ──────────────────────────────────────────────────────
  const track   = document.getElementById('carouselTrack');
  const dots    = document.querySelectorAll('.dot');
  const total   = 3;
  let current   = 0;
  let autoTimer = null;
  let isDragging = false;
  let startX   = 0;
  let dragDelta = 0;

  function goToSlide(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // Expose globally for inline onclick
  window.goToSlide = goToSlide;

  function nextSlide() { goToSlide(current + 1); }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(nextSlide, 2000);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  // Touch events
  track.addEventListener('touchstart', e => {
    stopAuto();
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
    dragDelta = e.touches[0].clientX - startX;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    if (Math.abs(dragDelta) > 40) {
      goToSlide(dragDelta < 0 ? current + 1 : current - 1);
    }
    isDragging = false;
    dragDelta = 0;
    setTimeout(startAuto, 3000);
  });

  // Mouse drag events
  track.addEventListener('mousedown', e => {
    stopAuto();
    startX = e.clientX;
    isDragging = true;
    track.classList.add('dragging');
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    dragDelta = e.clientX - startX;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    if (Math.abs(dragDelta) > 40) {
      goToSlide(dragDelta < 0 ? current + 1 : current - 1);
    }
    isDragging = false;
    dragDelta = 0;
    track.classList.remove('dragging');
    setTimeout(startAuto, 3000);
  });

  // Start auto-scroll
  startAuto();
  // ────────────────────────────────────────────────────────────────────────

  // Bottom Navigation Tab Switching
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all tabs
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Add active class to clicked tab
      item.classList.add('active');
    });
  });

  // Action Buttons Interactions
  const actionItems = document.querySelectorAll('.action-item');
  actionItems.forEach(item => {
    item.addEventListener('click', () => {
      const label = item.querySelector('.action-label').innerText;
      showToast(`${label} feature clicked`);
    });
  });

  // Login Button – navigation handled via onclick in HTML

  // Profile Button Handler
  const profileBtn = document.querySelector('.profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      showToast('Opening Account Profile...');
    });
  }

  // Coin Row Click Handler
  const coinRows = document.querySelectorAll('.coin-row');
  coinRows.forEach(row => {
    row.addEventListener('click', () => {
      const symbol = row.querySelector('.coin-symbol').innerText;
      const price = row.querySelector('.coin-price').innerText;
      showToast(`Selected ${symbol}: ${price}`);
    });
  });

  // Simple Toast Notification
  function showToast(message) {
    // Remove existing toast if present
    const existingToast = document.querySelector('.app-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.innerText = message;
    
    // Toast Styles
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#f7f230',
      color: '#111111',
      padding: '8px 18px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '700',
      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
      zIndex: '1000',
      transition: 'opacity 0.3s ease',
      opacity: '0'
    });

    document.body.appendChild(toast);
    
    // Animate In
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // Auto Dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

});
