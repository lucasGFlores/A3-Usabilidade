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

/* ─────────────────────────────────────────
     showConfirm({ title, message, proceedLabel, cancelLabel, variant, onProceed, onCancel })
     
     Parâmetros:
       title        — Título em negrito (obrigatório)
       message      — Texto explicativo (obrigatório)
       proceedLabel — Texto do botão de confirmação  (padrão: "Continuar")
       cancelLabel  — Texto do botão de cancelamento (padrão: "Cancelar")
       variant      — "danger" | "neutral"           (padrão: "danger")
       onProceed    — Callback ao confirmar
       onCancel     — Callback ao cancelar (opcional)
  ───────────────────────────────────────── */

const ICONS = {
  danger: `<svg viewBox="0 0 24 24" fill="none" stroke="#ea7b7b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
  neutral: `<svg viewBox="0 0 24 24" fill="none" stroke="#828be3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>`,
};

let _proceedCallback = null;
let _cancelCallback = null;

const overlay = document.getElementById('confirmOverlay');
const sheet = document.getElementById('confirmSheet');
const iconEl = document.getElementById('confirmIcon');
const titleEl = document.getElementById('confirmTitle');
const messageEl = document.getElementById('confirmMessage');
const proceedBtn = document.getElementById('confirmProceedBtn');
const cancelBtn = document.getElementById('confirmCancelBtn');

export function showConfirm({ title, message, proceedLabel = 'Continuar', cancelLabel = 'Cancelar', variant = 'danger', onProceed, onCancel }) {
  titleEl.textContent = title;
  messageEl.textContent = message;
  proceedBtn.textContent = proceedLabel;
  cancelBtn.textContent = cancelLabel;

  sheet.setAttribute('data-variant', variant);
  iconEl.innerHTML = ICONS[variant] ?? ICONS.danger;

  _proceedCallback = onProceed ?? null;
  _cancelCallback = onCancel ?? null;

  overlay.classList.add('is-open');
  proceedBtn.focus();
}

function hideConfirm() {
  overlay.classList.remove('is-open');
}

proceedBtn.addEventListener('click', () => {
  hideConfirm();
  _proceedCallback?.();
});

cancelBtn.addEventListener('click', () => {
  hideConfirm();
  _cancelCallback?.();
});

// Fechar ao clicar fora do sheet
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) {
    hideConfirm();
    _cancelCallback?.();
  }
});

// Fechar com Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
    hideConfirm();
    _cancelCallback?.();
  }
});
// ── Theme ─────────────────────────────────────────────────────────────────────

/** Toggles between 'dark' and 'light' body class. */
export function toggleTheme() {
  document.body.className = document.body.classList.contains('dark') ? 'light' : 'dark';
}
