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

export function statusColor(faltas) {
  const ratio = faltas / MAX;
  if (ratio > 0.5) return '#6dcf30';
  if (ratio > 0.25) return '#f47b3e';
  return '#dd2222';
}

function statusBadge(ratio) {
  if (ratio > 0.5) return { text: '✓ Tranquilo', cls: 'status-safe' };
  if (ratio > 0.25) return { text: '⚠ Atenção', cls: 'status-warning' };
  return { text: '✕ Perigo', cls: 'status-danger' };
}

// ── Edit callback ─────────────────────────────────────────────────────────────

/**
 * Função chamada ao clicar no botão de editar de qualquer card.
 * Registrada externamente via setOnEditSubject() — evita importar modal.js
 * aqui e criar dependência circular.
 * @type {((name: string) => void) | null}
 */
let _onEditSubject = null;

/**
 * Registra a função que será chamada ao clicar no botão de editar.
 * Chame isso no app.js antes de initCarousel().
 * @param {(name: string) => void} fn
 */
export function setOnEditSubject(fn) {
  _onEditSubject = fn;
}

// ── Slide builder (createElement) ────────────────────────────────────────────

/**
 * Builds a slide's DOM subtree using createElement.
 * Retorna um DocumentFragment com o subject-card e o circle-section prontos.
 * O botão de editar recebe um addEventListener direto — sem onclick inline.
 *
 * Active slides get well-known element IDs so updateActiveSlide() can reach
 * them by ID. Inactive slides use data-* attributes to avoid ID collisions.
 *
 * @param {{ name: string, day: string }} s
 * @param {boolean} active
 * @returns {DocumentFragment}
 */
export function buildSlide(s, active) {
  const faltas = getFaltas(s.name);
  const color = statusColor(faltas);
  const ratio = faltas / MAX;
  const badge = statusBadge(ratio);
  const offset = CIRC * (1 - ratio);

  const frag = document.createDocumentFragment();

  // ── subject-card ───────────────────────────────────────────────────────────

  const card = document.createElement('div');
  card.className = 'subject-card';

  const nameEl = document.createElement('div');
  nameEl.className = 'subject-name';
  nameEl.textContent = s.name;
  if (active) nameEl.id = 'subjectName'; else nameEl.dataset.name = s.name;

  const dayRow = document.createElement('div');
  dayRow.className = 'subject-day';

  const dot = document.createElement('span');
  dot.className = 'day-dot';
  dot.style.background = color;
  if (active) dot.id = 'dayDot'; else dot.dataset.dot = '';

  const dayLabel = document.createElement('span');
  dayLabel.textContent = s.day;
  if (active) dayLabel.id = 'weekdayLabel'; else dayLabel.dataset.day = s.day;

  dayRow.appendChild(dot);
  dayRow.appendChild(dayLabel);

  // Botão de editar — listener direto, sem depender de window
  const editBtn = document.createElement('button');
  editBtn.className = 'subject-edit-btn';
  editBtn.setAttribute('aria-label', 'Editar matéria');
  editBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
         aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>`;
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_onEditSubject) _onEditSubject(s.name);
  });

  card.appendChild(nameEl);
  card.appendChild(dayRow);
  card.appendChild(editBtn);
  frag.appendChild(card);

  // ── circle-section ─────────────────────────────────────────────────────────

  const section = document.createElement('div');
  section.className = 'circle-section';

  const ringWrapper = document.createElement('div');
  ringWrapper.className = 'ring-wrapper';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'ring-svg');
  svg.setAttribute('viewBox', '0 0 160 160');
  svg.setAttribute('aria-hidden', 'true');

  const bgCircle = document.createElementNS(svgNS, 'circle');
  bgCircle.setAttribute('class', 'ring-bg');
  bgCircle.setAttribute('cx', '80');
  bgCircle.setAttribute('cy', '80');
  bgCircle.setAttribute('r', '66');

  const fillCircle = document.createElementNS(svgNS, 'circle');
  fillCircle.setAttribute('class', 'ring-fill');
  fillCircle.setAttribute('cx', '80');
  fillCircle.setAttribute('cy', '80');
  fillCircle.setAttribute('r', '66');
  fillCircle.style.stroke = color;
  fillCircle.style.strokeDasharray = CIRC;
  fillCircle.style.strokeDashoffset = offset;
  if (active) fillCircle.id = 'ringFill'; else fillCircle.dataset.ring = '';

  svg.appendChild(bgCircle);
  svg.appendChild(fillCircle);

  const ringCenter = document.createElement('div');
  ringCenter.className = 'ring-center';

  const countEl = document.createElement('span');
  countEl.className = 'ring-number';
  countEl.textContent = faltas;
  if (active) countEl.id = 'countDisplay'; else countEl.dataset.count = faltas;

  const ringLabel = document.createElement('span');
  ringLabel.className = 'ring-label';
  ringLabel.textContent = 'faltas';

  ringCenter.appendChild(countEl);
  ringCenter.appendChild(ringLabel);
  ringWrapper.appendChild(svg);
  ringWrapper.appendChild(ringCenter);

  const faltasLabel = document.createElement('div');
  faltasLabel.className = 'faltas-label';
  faltasLabel.textContent = 'faltas restantes';

  const badgeEl = document.createElement('div');
  badgeEl.className = `faltas-status ${badge.cls}`;
  badgeEl.textContent = badge.text;
  if (active) badgeEl.id = 'statusBadge'; else badgeEl.dataset.badge = '';

  section.appendChild(ringWrapper);
  section.appendChild(faltasLabel);
  section.appendChild(badgeEl);
  frag.appendChild(section);

  return frag;
}

// ── Track rendering ───────────────────────────────────────────────────────────

const track = document.getElementById('swipeTrack');

export function renderTrack() {
  track.innerHTML = '';
  state.subjects.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'swipe-slide';
    slide.id = `slide-${i}`;
    slide.appendChild(buildSlide(s, i === state.idx));
    track.appendChild(slide);
  });
  initRing();
}

export function refreshSlides(prevIdx, affectedName) {
  if (affectedName !== undefined) {
    state.subjects.forEach((s, i) => {
      if (s.name === affectedName) {
        const slide = document.getElementById(`slide-${i}`);
        if (slide) {
          slide.innerHTML = '';
          slide.appendChild(buildSlide(s, i === state.idx));
        }
      }
    });
  } else {
    [prevIdx, state.idx].forEach(i => {
      const slide = document.getElementById(`slide-${i}`);
      if (slide) {
        slide.innerHTML = '';
        slide.appendChild(buildSlide(state.subjects[i], i === state.idx));
      }
    });
  }
  initRing();
}

// ── Active-slide DOM sync ─────────────────────────────────────────────────────

export function updateActiveSlide() {
  const s = state.subjects[state.idx];
  const faltas = getFaltas(s.name);
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
