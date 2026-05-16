// ─────────────────────────────────────────
//  slides.js — slide HTML, track rendering, active-slide UI sync
// ─────────────────────────────────────────

import { state, MAX, getFaltas } from './state.js';

// ── Ring geometry ─────────────────────────────────────────────────────────────

/** Full circumference of the progress ring (r = 66). */
export const CIRC = 2 * Math.PI * 66;

/** Returns the SVG ring element on the active slide. */
export function getRing() {
  return document.getElementById('ringFill');
}

/** Stamps the dasharray onto the ring so CSS transitions work correctly. */
export function initRing() {
  const ring = getRing();
  if (ring) ring.style.strokeDasharray = CIRC;
}

// ── Status helpers ────────────────────────────────────────────────────────────

/**
 * Returns the accent colour for a given remaining-absence count.
 * @param {number} faltas
 * @returns {string} hex colour
 */
export function statusColor(faltas) {
  const ratio = faltas / MAX;
  if (ratio > 0.5) return '#6dcf30'; // safe    — green
  if (ratio > 0.25) return '#f47b3e'; // warning — orange
  return '#dd2222';                   // danger  — red
}

/**
 * Returns the badge label and CSS class for a given absence ratio.
 * @param {number} ratio  faltas / MAX
 * @returns {{ text: string, cls: string }}
 */
function statusBadge(ratio) {
  if (ratio > 0.5) return { text: '✓ Tranquilo', cls: 'status-safe' };
  if (ratio > 0.25) return { text: '⚠ Atenção', cls: 'status-warning' };
  return { text: '✕ Perigo', cls: 'status-danger' };
}

// ── Slide HTML builder ────────────────────────────────────────────────────────

/**
 * Builds the inner HTML string for a single carousel slide.
 *
 * Faltas são lidas de getFaltas(s.name) — compartilhadas entre todos os
 * slides com o mesmo nome de matéria.
 *
 * Active slides get well-known element IDs so updateActiveSlide() can reach
 * them by ID. Inactive slides use data-* attributes to avoid ID collisions.
 *
 * @param {{ name: string, day: string }} s
 * @param {boolean} active
 * @returns {string}
 */
export function buildSlideHTML(s, active) {
  const faltas = getFaltas(s.name);        // ← leitura centralizada
  const color = statusColor(faltas);
  const ratio = faltas / MAX;
  const badge = statusBadge(ratio);
  const offset = CIRC * (1 - ratio);

  const id = (liveId, dataAttr) => active ? `id="${liveId}"` : dataAttr;

  return `
    <div class="subject-card">
      <div class="subject-name" ${id('subjectName', 'data-name')}>${s.name}</div>
      <div class="subject-day">
        <span class="day-dot" ${id('dayDot', 'data-dot')} style="background:${color}"></span>
        <span ${id('weekdayLabel', 'data-day')}>${s.day}</span>
      </div>
    </div>

    <div class="circle-section">
      <div class="ring-wrapper">
        <svg class="ring-svg" viewBox="0 0 160 160" aria-hidden="true">
          <circle class="ring-bg"   cx="80" cy="80" r="66"/>
          <circle class="ring-fill" cx="80" cy="80" r="66"
                  ${id('ringFill', 'data-ring')}
                  style="stroke:${color};
                         stroke-dasharray:${CIRC};
                         stroke-dashoffset:${offset}"/>
        </svg>
        <div class="ring-center">
          <span class="ring-number" ${id('countDisplay', 'data-count')}>${faltas}</span>
          <span class="ring-label">faltas</span>
        </div>
      </div>
      <div class="faltas-label">faltas restantes</div>
      <div class="faltas-status ${badge.cls}" ${id('statusBadge', 'data-badge')}>${badge.text}</div>
    </div>
  `;
}

// ── Track rendering ───────────────────────────────────────────────────────────

const track = document.getElementById('swipeTrack');

/**
 * Rebuilds every slide in the carousel from state.subjects.
 * Called after adding a subject or on first load.
 * Positioning (goToSlide) is handled by the caller.
 */
export function renderTrack() {
  track.innerHTML = '';
  state.subjects.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'swipe-slide';
    slide.id = `slide-${i}`;
    slide.innerHTML = buildSlideHTML(s, i === state.idx);
    track.appendChild(slide);
  });
  initRing();
}

/**
 * Re-renders only the slides affected by a navigation event or by a
 * faltas mutation.
 *
 * Se `affectedName` for passado, todos os slides com aquele nome de
 * matéria são re-renderizados (para sincronizar o contador compartilhado).
 * Caso contrário, só os dois slides afetados pela navegação são atualizados.
 *
 * @param {number} prevIdx
 * @param {string} [affectedName]  — nome da matéria cujas faltas mudaram
 */
export function refreshSlides(prevIdx, affectedName) {
  if (affectedName !== undefined) {
    // Atualiza todos os slides que compartilham esse nome
    state.subjects.forEach((s, i) => {
      if (s.name === affectedName) {
        const slide = document.getElementById(`slide-${i}`);
        if (slide) slide.innerHTML = buildSlideHTML(s, i === state.idx);
      }
    });
  } else {
    // Atualização de navegação: só os dois slides envolvidos
    [prevIdx, state.idx].forEach(i => {
      const slide = document.getElementById(`slide-${i}`);
      if (slide) slide.innerHTML = buildSlideHTML(state.subjects[i], i === state.idx);
    });
  }
  initRing();
}

// ── Active-slide DOM sync ─────────────────────────────────────────────────────

/**
 * Syncs the active slide's visible elements to match state.subjects[state.idx].
 * Called after any mutation that changes faltas (register / undo absence).
 *
 * Faltas são lidas de getFaltas(s.name), garantindo que o valor seja sempre
 * o contador compartilhado da matéria, não um campo local do slide.
 */
export function updateActiveSlide() {
  const s = state.subjects[state.idx];
  const faltas = getFaltas(s.name);          // ← leitura centralizada
  const color = statusColor(faltas);
  const ratio = faltas / MAX;
  const ring = getRing();
  const badge = statusBadge(ratio);

  document.getElementById('subjectName').textContent = s.name;
  document.getElementById('weekdayLabel').textContent = s.day;
  document.getElementById('countDisplay').textContent = faltas;
  document.getElementById('dayDot').style.background = color;

  if (ring) {
    ring.style.stroke = color;
    ring.style.strokeDashoffset = CIRC * (1 - ratio);
  }

  const badgeEl = document.getElementById('statusBadge');
  badgeEl.textContent = badge.text;
  badgeEl.className = `faltas-status ${badge.cls}`;
}
