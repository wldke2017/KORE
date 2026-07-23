// Kore Exchange App Logic

document.addEventListener('DOMContentLoaded', () => {

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
