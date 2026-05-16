// ─────────────────────────────────────────
//  ui.js — toast notifications and theme toggle
// ─────────────────────────────────────────

// ── Toast ─────────────────────────────────────────────────────────────────────

const toastEl = document.getElementById('toast');
let toastTimer = null;

/**
 * Displays a short toast message for ~2.8 s.
 * Calling it again while a toast is visible resets the timer.
 * @param {string} msg
 */
export function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

/** Toggles between 'dark' and 'light' body class. */
export function toggleTheme() {
  document.body.className = document.body.classList.contains('dark') ? 'light' : 'dark';
}
