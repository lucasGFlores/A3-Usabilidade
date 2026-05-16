// ─────────────────────────────────────────
//  app.js — entry point
//
//  Imports every module, wires them together, and re-exposes the functions
//  that the HTML calls via inline onclick attributes.
//  (Inline onclicks require globals; this is the single place that creates them.)
// ─────────────────────────────────────────

import { state }                              from './modules/state.js';
import { loadSubjects }                       from './modules/storage.js';
import { toggleTheme, showToast }             from './modules/ui.js';
import { initCarousel, navigateTo,
         setNavigationCallback }              from './modules/carousel.js';
import { updateActiveSlide }                  from './modules/slides.js';
import { updateFaltaBtn, registrarFalta,
         desfazerFalta }                      from './modules/absences.js';
import { openAddModal, closeAddModal,
         handleOverlayClick, addSubject }     from './modules/modal.js';
import { openCalendarModal, closeCalendarModal,
         shiftCalendarMonth,
         handleCalendarOverlayClick }         from './modules/calendar.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────

state.subjects = loadSubjects();

// After every navigation the active-slide UI and the absence button must sync.
setNavigationCallback(() => {
  updateActiveSlide();
  updateFaltaBtn();
});

initCarousel();
updateFaltaBtn();

// ── Global re-exports (required by HTML inline onclick attributes) ─────────────

window.toggleTheme                 = toggleTheme;
window.navigateTo                  = navigateTo;
window.registrarFalta              = registrarFalta;
window.desfazerFalta               = desfazerFalta;
window.openAddModal                = openAddModal;
window.closeAddModal               = closeAddModal;
window.handleOverlayClick          = handleOverlayClick;
window.addSubject                  = addSubject;
window.openCalendarModal           = openCalendarModal;
window.closeCalendarModal          = closeCalendarModal;
window.shiftCalendarMonth          = shiftCalendarMonth;
window.handleCalendarOverlayClick  = handleCalendarOverlayClick;
