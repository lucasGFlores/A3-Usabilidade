// ─────────────────────────────────────────
//  carousel.js — navigation, swipe, dots, arrow buttons, keyboard
// ─────────────────────────────────────────

import { state } from './state.js';
import { renderTrack, refreshSlides, initRing } from './slides.js';

// ── DOM references ────────────────────────────────────────────────────────────

const track = document.getElementById('swipeTrack');
const navDots = document.getElementById('navDots');
const arrowPrev = document.getElementById('arrowPrev');
const arrowNext = document.getElementById('arrowNext');
const arrowsEl = document.getElementById('swipeArrows');

// ── Slide positioning ─────────────────────────────────────────────────────────

/**
 * Translates the track to show the slide at `to`.
 * @param {number}  to
 * @param {boolean} animate
 */
export function goToSlide(to, animate = true) {
  track.style.transition = animate
    ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
    : 'none';
  track.style.transform = `translateX(-${to * 100}%)`;
}

// ── Nav dots ──────────────────────────────────────────────────────────────────

/** Rebuilds all nav dots (called after subjects list changes). */
export function renderDots() {
  navDots.innerHTML = '';
  state.subjects.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `nav-dot${i === state.idx ? ' active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', String(i === state.idx));
    dot.addEventListener('click', () => navigateTo(i));
    navDots.appendChild(dot);
  });
}

/** Updates only the active class on existing dots (cheaper than rebuild). */
export function updateDots() {
  navDots.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === state.idx);
    dot.setAttribute('aria-selected', String(i === state.idx));
  });
}

// ── Arrow buttons ─────────────────────────────────────────────────────────────

/** Shows/hides arrows and sets their disabled state to match current position. */
export function updateArrows() {
  arrowsEl.classList.toggle('visible', state.subjects.length > 1);
  arrowPrev.disabled = state.idx === 0;
  arrowNext.disabled = state.idx === state.subjects.length - 1;
}

// ── Navigation ────────────────────────────────────────────────────────────────

/**
 * Callback invoked after idx changes so other modules can sync their UI.
 * Set by app.js via setNavigationCallback() to avoid circular imports.
 * @type {Function|null}
 */
let onNavigate = null;

/** @param {Function} cb */
export function setNavigationCallback(cb) { onNavigate = cb; }

/**
 * Navigates to slide `to`, re-renders affected slides, and updates all
 * navigation indicators. Fires onNavigate() so external modules can sync.
 * @param {number} to
 */
export function navigateTo(to) {
  if (to < 0 || to >= state.subjects.length) return;

  const prev = state.idx;
  state.idx = to;

  refreshSlides(prev);
  goToSlide(state.idx);
  updateDots();
  updateArrows();

  onNavigate?.();
}

export function navigateToRight() {
  navigateTo(state.idx + 1)
}
export function navigateToLeft() {
  navigateTo(state.idx - 1)
}
/**
 * Full carousel initialisation: re-renders the track, dots, arrows and
 * positions without animation. Called after the subjects list changes shape.
 */
export function initCarousel() {
  renderTrack();
  renderDots();
  updateArrows();
  goToSlide(state.idx, false);
}

// ── Swipe (touch + mouse) ─────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 50;   // px to commit a swipe
const DRAG_RESISTANCE = 0.3;  // pull-back factor at first/last slide

let touchStartX = 0;
let touchStartY = 0;
let dragDeltaX = 0;
let isDragging = false;
let isHorizontal = null; // null = undecided

function pointerStart(clientX, clientY) {
  touchStartX = clientX;
  touchStartY = clientY;
  dragDeltaX = 0;
  isDragging = true;
  isHorizontal = null;
  track.style.transition = 'none';
  track.classList.add('dragging');
}

function pointerMove(clientX, clientY) {
  if (!isDragging) return;

  const dx = clientX - touchStartX;
  const dy = clientY - touchStartY;

  if (isHorizontal === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
    isHorizontal = Math.abs(dx) > Math.abs(dy);
  }
  if (!isHorizontal) return;

  dragDeltaX = dx;

  const atEdge = (state.idx === 0 && dx > 0) || (state.idx === state.subjects.length - 1 && dx < 0);
  const resistedDx = atEdge ? dx * DRAG_RESISTANCE : dx;

  track.style.transform = `translateX(calc(-${state.idx * 100}% + ${resistedDx}px))`;
}

function pointerEnd() {
  if (!isDragging) return;
  isDragging = false;
  track.classList.remove('dragging');
  if (!isHorizontal) return;

  if (dragDeltaX < -SWIPE_THRESHOLD && state.idx < state.subjects.length - 1) navigateTo(state.idx + 1);
  else if (dragDeltaX > SWIPE_THRESHOLD && state.idx > 0) navigateTo(state.idx - 1);
  else goToSlide(state.idx);
}

// Touch
track.addEventListener('touchstart', e => pointerStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
track.addEventListener('touchmove', e => { pointerMove(e.touches[0].clientX, e.touches[0].clientY); if (isHorizontal) e.preventDefault(); }, { passive: false });
track.addEventListener('touchend', pointerEnd);
track.addEventListener('touchcancel', pointerEnd);

// Mouse (desktop testing)
track.addEventListener('mousedown', e => {
  if (e.target.closest('.subject-edit-btn')) return; // ← adicionar
  pointerStart(e.clientX, e.clientY);
});
window.addEventListener('mousemove', e => { if (isDragging) pointerMove(e.clientX, e.clientY); });
window.addEventListener('mouseup', pointerEnd);

// ── Keyboard navigation ───────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (document.getElementById('addModal').classList.contains('open')) return;
  if (e.key === 'ArrowLeft') navigateTo(state.idx - 1);
  if (e.key === 'ArrowRight') navigateTo(state.idx + 1);
});
