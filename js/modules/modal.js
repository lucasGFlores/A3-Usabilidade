// ─────────────────────────────────────────
//  modal.js — "add subject" modal + "edit subject" modal
// ─────────────────────────────────────────

import { state, MAX, sortSubjects, setFaltas, getFaltas } from './state.js';
import { saveSubjects, saveFaltasByName, truancyData } from './storage.js';
import { initCarousel } from './carousel.js';
import { showConfirm, showToast } from './ui.js';

const modalEl = document.getElementById('addModal');
const modalTittle = document.getElementById('modalTitle');
const modalDescription = document.querySelector(".modal-sub");
const nameInput = document.getElementById('newSubjectName');
const daySelect = document.getElementById('newSubjectDay');
const day2Row = document.getElementById('secondDayRow');
const day2Select = document.getElementById('newSubjectDay2');
const addDayBtn = document.getElementById('addDayBtn');
const removeDayBtn = document.getElementById('removeDayBtn');
const btnConfirm = document.querySelector(".btn-confirm")


//
let _confirm_button_callback = null;
let _editing_original_name = null;
let _hide_button_func = null;
let _qtd_days_on_a_class_per_week = null
export function buttonCallback() {
  _confirm_button_callback()
}
export function hideButtonCallback() {
  _hide_button_func();
}
function setHideButtonAddClassMode() {
  _hide_button_func = hideSecondDay;
}
function setHideButtonEditClassMode() {
  _hide_button_func = () => {
    btnConfirm.classList.add('warning')
    hideSecondDay()
  }
}
// ── Open / close (add) ────────────────────────────────────────────────────────

export function openAddModal() {
  modalTittle.textContent = "Nova matéria";
  modalDescription.textContent = "Adicione uma matéria para acompanhar.";
  btnConfirm.textContent = "Adicionar matéria"
  _confirm_button_callback = addSubject;
  nameInput.value = '';
  daySelect.value = '';
  day2Select.value = '';
  hideSecondDay()
  setHideButtonAddClassMode();
  modalEl.classList.add('open');
}

export function closeModal() {
  modalEl.classList.remove('open');
  btnConfirm.classList.remove('warning');
  hideSecondDay();
}

export function handleOverlayClick(e) {
  if (e.target.id === 'addModal') closeModal();
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

  closeModal();
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
  modalTittle.textContent = "Editar matéria";
  modalDescription.textContent = `Altere o nome ou o dia da semana dessa matéria. ${entries.length >= 2 ? "\nCaso retire o segundo dia da matéria e salvar ela será removida." : ""}`;
  btnConfirm.textContent = "Editar matéria"
  _confirm_button_callback = confirmEditSubject;
  _editing_original_name = name;
  _qtd_days_on_a_class_per_week = entries.length;
  setHideButtonEditClassMode();

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
  btnConfirm.classList.remove('warning');
  hideSecondDay();
  _editing_original_name = null;
}

export function handleEditOverlayClick(e) {
  if (e.target.id === 'editModal') closeEditModal();
}


export function confirmEditSubject() {
  const newName = nameInput.value.trim();
  const newDay = daySelect.value;
  const newDay2 = day2Select.value;
  const oldName = _editing_original_name;
  const oldQtdDaysOnWeek = _qtd_days_on_a_class_per_week;
  verifyEditInputs(newName, newDay, newDay2);

  if (oldQtdDaysOnWeek >= 2 && newDay2 === "") {
    showConfirm({

      title: `Deseja modificar a "${_editing_original_name}" ?`,
      message: "Não só o nome poderá ser alterado, como um dos dias serão deletados da sua agenda, Tem certeza que quer remover?",
      proceedLabel: "Sim, modificar removendo dias",
      cancelLabel: "Cancelar",
      variant: "danger",
      onProceed: () => SubmitChanges(newName, newDay, newDay2, oldName),
      onCancel: () => { }
    })
    return;
  }
  showConfirm({
    title: `Deseja modificar a "${_editing_original_name}" ?`,
    message: "O nome e o dia da matéria serão alterados.",
    proceedLabel: "Sim, modificar.",
    cancelLabel: "Cancelar",
    variant: "neutral",
    onProceed: () => SubmitChanges(newName, newDay, newDay2, oldName),
    onCancel: () => { }
  });
}
function verifyEditInputs(newName, newDay, newDay2) {
  const oldName = _editing_original_name;
  if (!newName || !newDay) { showToast('Preencha todos os campos.'); return; }
  if (day2Row.style.display !== 'none' && !newDay2) {
    showToast('Selecione o segundo dia ou remova-o.'); return;
  }
  if (newDay2 && newDay === newDay2) { showToast('Os dois dias não podem ser iguais.'); return; }

  const nameConflict = newName !== oldName && state.subjects.some(s => s.name === newName);
  if (nameConflict) { showToast('Já existe uma matéria com esse nome.'); return; }


}
function SubmitChanges(newName, newDay, newDay2, oldName) {
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
