// ─────────────────────────────────────────
//  modal.js — "add subject" modal
// ─────────────────────────────────────────

import { state, MAX, sortSubjects, setFaltas, getFaltas } from './state.js';
import { saveSubjects, saveFaltasByName, ensureFaltasDefaults } from './storage.js';
import { initCarousel } from './carousel.js';
import { showToast } from './ui.js';

const modalEl = document.getElementById('addModal');
const nameInput = document.getElementById('newSubjectName');
const daySelect = document.getElementById('newSubjectDay');
const day2Row = document.getElementById('secondDayRow');
const day2Select = document.getElementById('newSubjectDay2');
const addDayBtn = document.getElementById('addDayBtn');
const removeDayBtn = document.getElementById('removeDayBtn');

// ── Open / close ──────────────────────────────────────────────────────────────

export function openAddModal() {
  nameInput.value = '';
  daySelect.value = '';
  day2Select.value = '';
  day2Row.style.display = 'none';
  modalEl.classList.add('open');
}

export function closeAddModal() {
  modalEl.classList.remove('open');
  hideSecondDay();
}

export function handleOverlayClick(e) {
  if (e.target.id === 'addModal') closeAddModal();
}

// ── Second day toggle ─────────────────────────────────────────────────────────

export function showSecondDay() {
  day2Row.style.display = 'flex';
  addDayBtn.style.display = 'none';
}

export function hideSecondDay() {
  day2Row.style.display = 'none';
  day2Select.value = '';
  addDayBtn.style.display = 'flex';
}

// ── Add subject ───────────────────────────────────────────────────────────────

export function addSubject() {
  const name = nameInput.value.trim();
  const day = daySelect.value;
  const day2 = day2Select.value;

  if (!name || !day) { showToast('Preencha todos os campos.'); return; }
  if (day2Row.style.display !== 'none' && !day2) {
    showToast('Selecione o segundo dia ou remova-o.'); return;
  }
  if (day2 && day === day2) { showToast('Os dois dias não podem ser iguais.'); return; }

  // Verifica se já existe uma aula com esse nome (para herdar as faltas)
  const existingFaltas = state.subjects.some(s => s.name === name)
    ? getFaltas(name)
    : MAX;

  // Adiciona o primeiro dia
  const newSubject = { name, day };
  state.subjects.push(newSubject);

  // Adiciona o segundo dia, se informado
  if (day2) {
    state.subjects.push({ name, day: day2 });
  }

  // Garante que o contador compartilhado existe (usa o valor já existente ou MAX)
  setFaltas(name, existingFaltas);

  state.idx = sortSubjects(newSubject);

  closeAddModal();
  saveSubjects();
  saveFaltasByName();
  initCarousel();

  const msg = day2
    ? `"${name}" adicionada em ${day} e ${day2}!`
    : `"${name}" adicionada!`;
  showToast(msg);
}
