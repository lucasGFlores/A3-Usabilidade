// ─────────────────────────────────────────
//  absences.js — absence registration, undo, and button state
// ─────────────────────────────────────────

import { state, MAX, getFaltas, setFaltas } from './state.js';
import { saveFaltasByName, registerTruancy, getTruancy, truancyData } from './storage.js';
import { updateActiveSlide, refreshSlides } from './slides.js';
import { showToast } from './ui.js';

// ── Date helper ───────────────────────────────────────────────────────────────

/** Returns today's date as 'DD/MM/YYYY' — the canonical format used throughout. */
export function todayDateString() {
  return new Date().toLocaleDateString('pt-BR');
}

// ── Button state ──────────────────────────────────────────────────────────────

/**
 * Reflects whether today's absence is already recorded for the current subject.
 * Switches the button between "Faltei hoje" and "Desfazer falta" states.
 */
export function updateFaltaBtn() {
  const btn = document.querySelector('.btn-faltei');
  if (!btn) return;

  const s = state.subjects[state.idx];
  const alreadyAbsent = getTruancy(s).includes(todayDateString());

  if (alreadyAbsent) {
    btn.classList.add('undone');
    btn.innerHTML = `
      <svg class="icon-svg" aria-hidden="true"><use href="icons.svg#icon-alert-circle"/></svg>
      Desfazer falta
    `;
    btn.setAttribute('onclick', 'desfazerFalta()');
  } else {
    btn.classList.remove('undone');
    btn.innerHTML = `
      <svg class="icon-svg" aria-hidden="true"><use href="icons.svg#icon-alert-circle"/></svg>
      Faltei hoje
    `;
    btn.setAttribute('onclick', 'registrarFalta()');
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

/** Registers today's absence for the current subject. Called from HTML onclick. */
export function registrarFalta() {
  const s = state.subjects[state.idx];
  const faltas = getFaltas(s.name);

  if (faltas <= 0) { showToast('Sem faltas restantes!'); return; }

  const today = todayDateString();
  if (getTruancy(s).includes(today)) { showToast('Falta já registrada hoje!'); return; }

  setFaltas(s.name, faltas - 1);
  registerTruancy(s, today);
  saveFaltasByName();
  updateActiveSlide();
  refreshSlides(state.idx, s.name);   // sincroniza todos os slides do mesmo nome
  updateFaltaBtn();
  showToast(`Falta registrada. Restam ${getFaltas(s.name)} faltas.`);
}

/** Removes today's absence for the current subject. Called from HTML onclick. */
export function desfazerFalta() {
  const s = state.subjects[state.idx];
  const today = todayDateString();
  const dates = getTruancy(s);
  const pos = dates.indexOf(today);

  if (pos === -1) { showToast('Nenhuma falta de hoje para desfazer.'); return; }

  const updated = [...dates];
  updated.splice(pos, 1);
  truancyData.set(s.name, updated);

  setFaltas(s.name, Math.min(getFaltas(s.name) + 1, MAX));
  saveFaltasByName();
  updateActiveSlide();
  refreshSlides(state.idx, s.name);   // sincroniza todos os slides do mesmo nome
  updateFaltaBtn();
  showToast('Falta desfeita!');
}
