// ─────────────────────────────────────────
//  modal.js — "add subject" modal
// ─────────────────────────────────────────

import { state, MAX, sortSubjects } from './state.js';
import { saveSubjects }             from './storage.js';
import { initCarousel }             from './carousel.js';
import { showToast }                from './ui.js';

const modalEl     = document.getElementById('addModal');
const nameInput   = document.getElementById('newSubjectName');
const daySelect   = document.getElementById('newSubjectDay');

// ── Open / close ──────────────────────────────────────────────────────────────

export function openAddModal() {
  nameInput.value = '';
  daySelect.value = '';
  modalEl.classList.add('open');
}

export function closeAddModal() {
  modalEl.classList.remove('open');
}

export function handleOverlayClick(e) {
  if (e.target.id === 'addModal') closeAddModal();
}

// ── Add subject ───────────────────────────────────────────────────────────────

export function addSubject() {
  const name = nameInput.value.trim();
  const day  = daySelect.value;

  if (!name || !day) { showToast('Preencha todos os campos.'); return; }

  const newSubject = { name, day, faltas: MAX };
  state.subjects.push(newSubject);
  state.idx = sortSubjects(newSubject); // sort and track new position

  closeAddModal();
  saveSubjects();
  initCarousel();
  showToast(`"${name}" adicionada!`);
}
