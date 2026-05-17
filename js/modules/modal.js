// ─────────────────────────────────────────
//  modal.js — "add subject" modal + "edit subject" modal
// ─────────────────────────────────────────

import { state, MAX, sortSubjects, setFaltas, getFaltas } from './state.js';
import { saveSubjects, saveFaltasByName, truancyData } from './storage.js';
import { initCarousel } from './carousel.js';
import { showToast } from './ui.js';

const modalEl = document.getElementById('addModal');
const nameInput = document.getElementById('newSubjectName');
const daySelect = document.getElementById('newSubjectDay');
const day2Row = document.getElementById('secondDayRow');
const day2Select = document.getElementById('newSubjectDay2');
const addDayBtn = document.getElementById('addDayBtn');
const removeDayBtn = document.getElementById('removeDayBtn');
const btnConfirm = document.querySelector(".btn-confirm")


//
let _confirm_button_callback = null;
let _editingOriginalName = null;

export function buttonCallback() {
  _confirm_button_callback()
}
// ── Open / close (add) ────────────────────────────────────────────────────────

export function openAddModal() {
  nameInput.value = '';
  daySelect.value = '';
  day2Select.value = '';
  btnConfirm.value = "Adicionar matéria"
  _confirm_button_callback = addSubject;
  hideSecondDay()
  modalEl.classList.add('open');
}

export function closeAddModal() {
  modalEl.classList.remove('open');
  hideSecondDay();
}

export function handleOverlayClick(e) {
  if (e.target.id === 'addModal') closeAddModal();
}

// ── Second day toggle (add) ───────────────────────────────────────────────────

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

  const existingFaltas = state.subjects.some(s => s.name === name)
    ? getFaltas(name)
    : MAX;

  const newSubject = { name, day };
  state.subjects.push(newSubject);

  if (day2) {
    state.subjects.push({ name, day: day2 });
  }

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

// ── Open / close (edit) ───────────────────────────────────────────────────────

export function openEditModal(name) {
  const entries = state.subjects.filter(s => s.name === name);
  if (!entries.length) return;
  btnConfirm.textContent = "Editar matéria"
  _confirm_button_callback = confirmEditSubject;
  _editingOriginalName = name;

  nameInput.value = name;
  daySelect.value = entries[0].day;

  if (entries.length >= 2) {
    day2Select.value = entries[1].day;
    showSecondDay();
  } else {
    hideSecondDay()
  }
  modalEl.classList.add('open');
}

export function closeEditModal() {
  modalEl.classList.remove('open');
  hideSecondDay();
  _editingOriginalName = null;
}

export function handleEditOverlayClick(e) {
  if (e.target.id === 'editModal') closeEditModal();
}


export function confirmEditSubject() {
  const newName = nameInput.value.trim();
  const newDay = daySelect.value;
  const newDay2 = day2Select.value;
  const oldName = _editingOriginalName;
  if (!newName || !newDay) { showToast('Preencha todos os campos.'); return; }
  if (day2Row.style.display !== 'none' && !newDay2) {
    showToast('Selecione o segundo dia ou remova-o.'); return;
  }
  if (newDay2 && newDay === newDay2) { showToast('Os dois dias não podem ser iguais.'); return; }

  const nameConflict = newName !== oldName && state.subjects.some(s => s.name === newName);
  if (nameConflict) { showToast('Já existe uma matéria com esse nome.'); return; }

  // Remove entradas antigas e reinsere com novos dados
  state.subjects = state.subjects.filter(s => s.name !== oldName);
  const firstEntry = { name: newName, day: newDay };
  state.subjects.push(firstEntry);
  if (newDay2) state.subjects.push({ name: newName, day: newDay2 });

  // Migra faltas e histórico se o nome mudou
  if (newName !== oldName) {
    setFaltas(newName, getFaltas(oldName));
    delete state.faltasByName[oldName];

    const oldDates = truancyData.get(oldName) ?? [];
    truancyData.set(newName, oldDates);
    truancyData.set(oldName, []);
  }

  state.idx = sortSubjects(firstEntry);

  closeEditModal();
  saveSubjects();
  saveFaltasByName();
  initCarousel();

  showToast(`"${newName}" atualizada!`);
}
