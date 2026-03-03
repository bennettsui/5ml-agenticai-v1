'use strict';

/* ═══════════════════════════════════════════════════════════════
   Page-lock authentication — sessionStorage based.
   Passwords are intentionally embedded client-side; this is a
   light operational gate, not a security perimeter.
   ═══════════════════════════════════════════════════════════════ */

const AUTH_PANELS = {
  reception: { pass: 'RD2026',      label: 'Reception',  href: '/event-checkin' },
  dashboard:  { pass: 'RD2026!',    label: 'Dashboard',  href: '/event-checkin/client' },
  admin:      { pass: 'RD2026admin', label: 'Admin Panel', href: '/event-checkin/admin' },
};

const SESSION_KEY = (panel) => `rds_auth_${panel}`;

function isAuthenticated(panel) {
  return sessionStorage.getItem(SESSION_KEY(panel)) === '1';
}

function setAuthenticated(panel) {
  sessionStorage.setItem(SESSION_KEY(panel), '1');
}

/* ── Inject overlay CSS ─────────────────────────────────────────── */
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #authOverlay {
      position: fixed; inset: 0; z-index: 9999;
      background: #0f172a;
      display: flex; align-items: center; justify-content: center;
    }
    #authBox {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 40px 44px;
      width: 100%; max-width: 380px;
      text-align: center;
    }
    #authBox h2 {
      font-size: 22px; font-weight: 800; margin: 0 0 4px;
      color: #f1f5f9;
    }
    #authBox .auth-subtitle {
      font-size: 13px; color: #64748b; margin-bottom: 28px;
    }
    #authBox .auth-label {
      display: block; text-align: left;
      font-size: 12px; font-weight: 600; color: #94a3b8;
      text-transform: uppercase; letter-spacing: .06em;
      margin-bottom: 6px;
    }
    #authBox .auth-input {
      width: 100%; box-sizing: border-box;
      padding: 11px 14px; font-size: 16px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px; color: #f1f5f9;
      outline: none; margin-bottom: 6px;
      transition: border-color .15s;
    }
    #authBox .auth-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.25); }
    #authBox .auth-error {
      font-size: 12px; color: #f87171;
      min-height: 18px; margin-bottom: 14px;
      text-align: left;
    }
    #authBox .auth-btn {
      width: 100%; padding: 11px;
      background: #3b82f6; color: #fff;
      border: none; border-radius: 8px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      transition: background .15s;
    }
    #authBox .auth-btn:hover { background: #2563eb; }
    #authBox .auth-btn:active { background: #1d4ed8; }

    /* Nav-password prompt modal */
    #navAuthModal {
      position: fixed; inset: 0; z-index: 9998;
      background: rgba(0,0,0,.65);
      display: flex; align-items: center; justify-content: center;
    }
    #navAuthModal.hidden { display: none; }
    #navAuthBox {
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 32px 36px;
      width: 100%; max-width: 340px;
    }
    #navAuthBox h3 {
      font-size: 17px; font-weight: 700; color: #f1f5f9;
      margin: 0 0 4px;
    }
    #navAuthBox .nav-auth-sub {
      font-size: 12px; color: #64748b; margin-bottom: 20px;
    }
    #navAuthBox .auth-input { width: 100%; box-sizing: border-box;
      padding: 10px 13px; font-size: 15px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px; color: #f1f5f9;
      outline: none; margin-bottom: 6px;
      transition: border-color .15s;
    }
    #navAuthBox .auth-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.25); }
    #navAuthBox .auth-error {
      font-size: 12px; color: #f87171;
      min-height: 16px; margin-bottom: 12px;
    }
    #navAuthBox .nav-auth-btns { display: flex; gap: 8px; }
    #navAuthBox .nav-auth-btns button {
      flex: 1; padding: 9px;
      border-radius: 7px; font-size: 13px; font-weight: 600;
      cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
    }
    #navAuthBox .nav-cancel-btn {
      background: rgba(255,255,255,0.05); color: #94a3b8;
    }
    #navAuthBox .nav-cancel-btn:hover { background: rgba(255,255,255,0.08); }
    #navAuthBox .nav-ok-btn {
      background: #3b82f6; color: #fff; border-color: transparent;
    }
    #navAuthBox .nav-ok-btn:hover { background: #2563eb; }
  `;
  document.head.appendChild(style);
})();

/* ── Page-lock overlay ──────────────────────────────────────────── */
function requireAuth(panel) {
  if (isAuthenticated(panel)) return; // already unlocked this session

  const cfg = AUTH_PANELS[panel];

  const overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.innerHTML = `
    <div id="authBox">
      <h2>🎟️ RD Symposium</h2>
      <p class="auth-subtitle">${cfg.label} — restricted access</p>
      <label class="auth-label" for="authPwInput">Password</label>
      <input class="auth-input" id="authPwInput" type="password"
        placeholder="Enter password" autocomplete="off" />
      <p class="auth-error" id="authError"></p>
      <button class="auth-btn" id="authSubmit">Unlock</button>
    </div>
  `;
  document.body.prepend(overlay);

  const input  = overlay.querySelector('#authPwInput');
  const errEl  = overlay.querySelector('#authError');
  const submit = overlay.querySelector('#authSubmit');

  // Focus after a tick so the browser doesn't steal focus
  setTimeout(() => input.focus(), 60);

  function attempt() {
    if (input.value === cfg.pass) {
      setAuthenticated(panel);
      overlay.remove();
    } else {
      errEl.textContent = 'Incorrect password. Please try again.';
      input.value = '';
      input.focus();
    }
  }

  submit.addEventListener('click', attempt);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
}

/* ── Nav-link interceptor ───────────────────────────────────────── */
// Call after DOM is ready to intercept nav <a> tags.
function initNavAuth() {
  // Build a nav-auth modal (reusable)
  const modal = document.createElement('div');
  modal.id = 'navAuthModal';
  modal.className = 'hidden';
  modal.innerHTML = `
    <div id="navAuthBox">
      <h3 id="navAuthTitle">Enter password</h3>
      <p class="nav-auth-sub" id="navAuthSub"></p>
      <input class="auth-input" id="navAuthInput" type="password"
        placeholder="Password" autocomplete="off" />
      <p class="auth-error" id="navAuthError"></p>
      <div class="nav-auth-btns">
        <button class="nav-cancel-btn" id="navCancelBtn">Cancel</button>
        <button class="nav-ok-btn"     id="navOkBtn">Go</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const navInput  = modal.querySelector('#navAuthInput');
  const navErr    = modal.querySelector('#navAuthError');
  const navTitle  = modal.querySelector('#navAuthTitle');
  const navSub    = modal.querySelector('#navAuthSub');
  const cancelBtn = modal.querySelector('#navCancelBtn');
  const okBtn     = modal.querySelector('#navOkBtn');

  let targetPanel = null;
  let targetHref  = null;

  function openNavModal(panel, href) {
    targetPanel = panel;
    targetHref  = href;
    const cfg   = AUTH_PANELS[panel];
    navTitle.textContent = `🔒 ${cfg.label}`;
    navSub.textContent   = `Enter the ${cfg.label} password to continue.`;
    navErr.textContent   = '';
    navInput.value       = '';
    modal.classList.remove('hidden');
    setTimeout(() => navInput.focus(), 60);
  }

  function closeNavModal() {
    modal.classList.add('hidden');
    targetPanel = null; targetHref = null;
  }

  function navAttempt() {
    const cfg = AUTH_PANELS[targetPanel];
    if (navInput.value === cfg.pass) {
      setAuthenticated(targetPanel);
      window.location.href = targetHref;
    } else {
      navErr.textContent = 'Incorrect password.';
      navInput.value = '';
      navInput.focus();
    }
  }

  cancelBtn.addEventListener('click', closeNavModal);
  okBtn.addEventListener('click', navAttempt);
  navInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navAttempt();
    if (e.key === 'Escape') closeNavModal();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeNavModal(); });

  // Intercept all nav links
  document.querySelectorAll('nav a[data-panel]').forEach(link => {
    link.addEventListener('click', (e) => {
      const panel = link.dataset.panel;
      const href  = link.href;
      if (isAuthenticated(panel)) return; // already authed — let it navigate
      e.preventDefault();
      openNavModal(panel, href);
    });
  });
}

// Auto-run nav init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavAuth);
} else {
  initNavAuth();
}
