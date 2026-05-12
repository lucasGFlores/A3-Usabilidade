// ─────────────────────────────────────────
//  app.js — FaltaCount
//  Swipe / carousel support included.
// ─────────────────────────────────────────

/* ══════════════════════════════
   STATE
══════════════════════════════ */

const MAX = 10;

// Week order starting on Monday (Brazilian convention)
const DAY_ORDER = {
  'segunda-feira': 0,
  'terça-feira': 1,
  'quarta-feira': 2,
  'quinta-feira': 3,
  'sexta-feira': 4,
  'sábado': 5,
  'domingo': 6,
};

/**
 * Sorts subjects in-place by day of week.
 * Returns the new index of the subject that was active before sorting.
 * @param {object} currentSubject  reference to keep track of
 * @returns {number} new index of currentSubject
 */
function sortSubjects(currentSubject) {
  subjects.sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);
  return subjects.indexOf(currentSubject);
}


/* ══════════════════════════════
   PERSISTENCE (localStorage) <----- Subject ------->
══════════════════════════════ */

const STORAGE_KEY = 'faltacount_subjects';

/** Saves the current subjects array to localStorage. */
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('FaltaCount: could not read localStorage', e);
  }
  // Default first-run data
  return [{ name: 'Usabilidade', day: 'quinta-feira', faltas: 10 }];
}

let subjects = loadData();
let idx = 0; // currently visible slide index


/* ══════════════════════════════
   Truancy
══════════════════════════════ */
function registerTruancy(subject, date) {
  if (!truancy_data.has(subject.name)) {
    truancy_data.set(subject.name, [date]);
    return;
  }
  // Append date to existing array (was spread incorrectly before)
  truancy_data.set(subject.name, [...truancy_data.get(subject.name), date]);
}

function getTruancy(subject) {
  if (!truancy_data.has(subject.name)) {
    return [];
  }
  return truancy_data.get(subject.name);
}

/* ══════════════════════════════
   PERSISTENCE (localStorage) — truancy
   Uses a reactive Map via Proxy, similar to React's useEffect:
   any .set() on truancy_data automatically persists to localStorage.
══════════════════════════════ */

const STORAGE_KEY_TRUANCY = 'faltacount_truancy';

/**
 * Creates a Map that runs `effect(map)` automatically after every .set().
 * The effect receives the updated Map so it can decide what to do
 * (e.g. persist, re-render, log) — same mental model as useEffect.
 *
 * @param {Map}      initialMap  — the Map to wrap
 * @param {Function} effect      — callback(map) fired after every mutation
 * @returns {Proxy<Map>}
 */
function createReactiveMap(initialMap, effect) {
  return new Proxy(initialMap, {
    get(target, prop) {
      const value = target[prop];
      // Intercept only .set() — bind it so `this` stays correct,
      // then trigger the effect after the native set runs.
      if (prop === 'set') {
        return function (...args) {
          Map.prototype.set.apply(target, args);
          effect(target);
          return target; // keep Map's chainable return value
        };
      }
      // For everything else (.get, .has, .entries, Symbol.iterator…)
      // return the native value, bound so methods work correctly.
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function persistTruancy(map) {
  localStorage.setItem(
    STORAGE_KEY_TRUANCY,
    JSON.stringify(Array.from(map.entries()))
  );
}

function loadTruancyData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRUANCY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return new Map(parsed);
    }
  } catch (e) {
    console.warn('FaltaCount: could not read localStorage', e);
  }
  const defaults = new Map();
  defaults.set('Usabilidade', []);
  return defaults;
}

// Every .set() on truancy_data automatically calls persistTruancy —
// no manual saveTruancyData() calls needed anywhere.
const truancy_data = createReactiveMap(loadTruancyData(), persistTruancy);


/* ══════════════════════════════
   DOM REFERENCES
══════════════════════════════ */

const track = document.getElementById('swipeTrack');
const navDots = document.getElementById('navDots');
const arrowPrev = document.getElementById('arrowPrev');
const arrowNext = document.getElementById('arrowNext');
const arrows = document.getElementById('swipeArrows');

/* ══════════════════════════════
   RING SETUP
   The active ring element lives in the current slide.
   We re-query it whenever the slide changes.
══════════════════════════════ */

const CIRC = 2 * Math.PI * 66;

function getRing() {
  return document.getElementById('ringFill');
}

function initRing() {
  const ring = getRing();
  if (ring) ring.style.strokeDasharray = CIRC;
}

/* ══════════════════════════════
   HELPERS
══════════════════════════════ */

/**
 * Returns the status color based on remaining absences.
 * @param {number} faltas
 * @returns {string} hex color
 */
function statusColor(faltas) {
  const ratio = faltas / MAX;
  if (ratio > 0.5) return '#6dcf30'; // safe    — green
  if (ratio > 0.25) return '#f47b3e'; // warning — orange
  return '#dd2222';                   // danger  — red
}

/* ══════════════════════════════
   SLIDE RENDERING
   Each subject gets its own .swipe-slide in the track.
   Only the active slide shows live IDs; others are decorative.
══════════════════════════════ */

/**
 * Builds the inner HTML for a slide.
 * @param {object} s   subject object
 * @param {number} i   slide index
 * @param {boolean} active  whether this is the currently active slide
 */
function buildSlideHTML(s, i, active) {
  const color = statusColor(s.faltas);
  const ratio = s.faltas / MAX;

  let badgeText, badgeClass;
  if (ratio > 0.5) { badgeText = '✓ Tranquilo'; badgeClass = 'status-safe'; }
  else if (ratio > 0.25) { badgeText = '⚠ Atenção'; badgeClass = 'status-warning'; }
  else { badgeText = '✕ Perigo'; badgeClass = 'status-danger'; }

  const offset = CIRC * (1 - s.faltas / MAX);

  // Active slide uses well-known IDs so updateUI() can find them.
  // Inactive slides use data attributes only (no IDs) to avoid duplicates.
  const idAttrs = active
    ? `id="subjectName"`
    : `data-name`;
  const idDay = active ? `id="weekdayLabel"` : `data-day`;
  const idDot = active ? `id="dayDot"` : `data-dot`;
  const idRing = active ? `id="ringFill"` : `data-ring`;
  const idCount = active ? `id="countDisplay"` : `data-count`;
  const idBadge = active ? `id="statusBadge"` : `data-badge`;

  return `
    <div class="subject-card">
      <div class="subject-name" ${idAttrs}>${s.name}</div>
      <div class="subject-day">
        <span class="day-dot" ${idDot} style="background:${color}"></span>
        <span ${idDay}>${s.day}</span>
      </div>
    </div>

    <div class="circle-section">
      <div class="ring-wrapper">
        <svg class="ring-svg" viewBox="0 0 160 160" aria-hidden="true">
          <circle class="ring-bg" cx="80" cy="80" r="66"/>
          <circle class="ring-fill" cx="80" cy="80" r="66"
                  ${idRing}
                  style="stroke:${color};
                         stroke-dasharray:${CIRC};
                         stroke-dashoffset:${offset}"/>
        </svg>
        <div class="ring-center">
          <span class="ring-number" ${idCount}>${s.faltas}</span>
          <span class="ring-label">faltas</span>
        </div>
      </div>
      <div class="faltas-label">faltas restantes</div>
      <div class="faltas-status ${badgeClass}" ${idBadge}>${badgeText}</div>
    </div>
  `;
}

/**
 * Re-renders the entire track from the subjects array.
 * Preserves the current idx.
 */
function renderTrack() {
  track.innerHTML = '';

  subjects.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'swipe-slide';
    slide.id = `slide-${i}`;
    slide.innerHTML = buildSlideHTML(s, i, i === idx);
    track.appendChild(slide);
  });

  initRing();
  renderDots();
  updateArrows();
  goToSlide(idx, false); // position without animation
}

/* ══════════════════════════════
   UI UPDATE
   Syncs the active slide's visible elements with subjects[idx].
══════════════════════════════ */

function updateUI() {
  const s = subjects[idx];
  const color = statusColor(s.faltas);
  const ratio = s.faltas / MAX;
  const ring = getRing();

  document.getElementById('subjectName').textContent = s.name;
  document.getElementById('weekdayLabel').textContent = s.day;
  document.getElementById('countDisplay').textContent = s.faltas;
  document.getElementById('dayDot').style.background = color;

  if (ring) {
    ring.style.stroke = color;
    ring.style.strokeDashoffset = CIRC * (1 - ratio);
  }

  const badge = document.getElementById('statusBadge');
  if (ratio > 0.5) { badge.textContent = '✓ Tranquilo'; badge.className = 'faltas-status status-safe'; }
  else if (ratio > 0.25) { badge.textContent = '⚠ Atenção'; badge.className = 'faltas-status status-warning'; }
  else { badge.textContent = '✕ Perigo'; badge.className = 'faltas-status status-danger'; }
}

/* ══════════════════════════════
   NAV DOTS
══════════════════════════════ */

function renderDots() {
  navDots.innerHTML = '';
  subjects.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `nav-dot${i === idx ? ' active' : ''}`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    dot.addEventListener('click', () => navigateTo(i));
    navDots.appendChild(dot);
  });
}

function updateDots() {
  const dots = navDots.querySelectorAll('.nav-dot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === idx);
    d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
  });
}

/* ══════════════════════════════
   ARROW BUTTONS
══════════════════════════════ */

function updateArrows() {
  if (subjects.length > 1) {
    arrows.classList.add('visible');
  } else {
    arrows.classList.remove('visible');
  }
  arrowPrev.disabled = idx === 0;
  arrowNext.disabled = idx === subjects.length - 1;
}

/* ══════════════════════════════
   NAVIGATION
══════════════════════════════ */

/**
 * Moves the track to show slide at position `to`.
 * @param {number}  to        target index
 * @param {boolean} animate   whether to use CSS transition
 */
function goToSlide(to, animate = true) {
  if (animate) {
    track.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
  } else {
    track.style.transition = 'none';
  }
  track.style.transform = `translateX(-${to * 100}%)`;
}

/**
 * Navigates to a given index, re-renders IDs, and updates all indicators.
 * @param {number} to
 */
function navigateTo(to) {
  if (to < 0 || to >= subjects.length) return;

  const prev = idx;
  idx = to;

  // Re-render only the two affected slides (prev and next)
  // to swap the well-known IDs onto the active one.
  [prev, idx].forEach(i => {
    const slide = document.getElementById(`slide-${i}`);
    if (slide) {
      slide.innerHTML = buildSlideHTML(subjects[i], i, i === idx);
    }
  });

  initRing();
  goToSlide(idx);
  updateDots();
  updateArrows();
  updateUI();
}

/* ══════════════════════════════
   SWIPE (TOUCH + MOUSE)
══════════════════════════════ */

let touchStartX = 0;
let touchStartY = 0;
let dragDeltaX = 0;
let isDragging = false;
let isHorizontal = null; // null = undecided, true = horiz, false = vertical

const SWIPE_THRESHOLD = 50;  // px to commit a swipe
const DRAG_RESISTANCE = 0.3; // pull-back factor when at first/last slide

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

  // Decide axis on first significant move
  if (isHorizontal === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
    isHorizontal = Math.abs(dx) > Math.abs(dy);
  }

  if (!isHorizontal) return; // vertical scroll — let browser handle

  dragDeltaX = dx;

  // Apply resistance at the edges
  let resistedDx = dx;
  if ((idx === 0 && dx > 0) || (idx === subjects.length - 1 && dx < 0)) {
    resistedDx = dx * DRAG_RESISTANCE;
  }

  const base = idx * 100; // % offset of current slide
  track.style.transform = `translateX(calc(-${base}% + ${resistedDx}px))`;
}

function pointerEnd() {
  if (!isDragging) return;
  isDragging = false;
  track.classList.remove('dragging');

  if (!isHorizontal) return; // was a vertical scroll

  const vw = track.parentElement.offsetWidth;

  if (dragDeltaX < -SWIPE_THRESHOLD && idx < subjects.length - 1) {
    navigateTo(idx + 1);
  } else if (dragDeltaX > SWIPE_THRESHOLD && idx > 0) {
    navigateTo(idx - 1);
  } else {
    // Snap back to current slide
    goToSlide(idx);
  }
}

// Touch events
track.addEventListener('touchstart', e => pointerStart(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
track.addEventListener('touchmove', e => { pointerMove(e.touches[0].clientX, e.touches[0].clientY); if (isHorizontal) e.preventDefault(); }, { passive: false });
track.addEventListener('touchend', pointerEnd);
track.addEventListener('touchcancel', pointerEnd);

// Mouse events (for desktop testing)
track.addEventListener('mousedown', e => { pointerStart(e.clientX, e.clientY); });
window.addEventListener('mousemove', e => { if (isDragging) pointerMove(e.clientX, e.clientY); });
window.addEventListener('mouseup', pointerEnd);

/* ══════════════════════════════
   KEYBOARD NAVIGATION
══════════════════════════════ */

document.addEventListener('keydown', e => {
  if (document.getElementById('addModal').classList.contains('open')) return;
  if (e.key === 'ArrowLeft') navigateTo(idx - 1);
  if (e.key === 'ArrowRight') navigateTo(idx + 1);
});

/* ══════════════════════════════
   THEME
══════════════════════════════ */

function toggleTheme() {
  document.body.className = document.body.classList.contains('dark') ? 'light' : 'dark';
}

/* ══════════════════════════════
   ABSENCE REGISTRATION
══════════════════════════════ */

function registrarFalta() {
  const s = subjects[idx];
  if (s.faltas <= 0) { showToast('Sem faltas restantes!'); return; }
  s.faltas--;
  registerTruancy(s, new Date().toLocaleDateString('pt-BR'))
  updateUI();
  saveData();
  showToast(`Falta registrada. Restam ${s.faltas} faltas.`);
}

/* ══════e═══════════════════════
   MODAL
══════════════════════════════ */

function openAddModal() {
  document.getElementById('newSubjectName').value = '';
  document.getElementById('newSubjectDay').value = '';
  document.getElementById('addModal').classList.add('open');
}

function closeAddModal() {
  document.getElementById('addModal').classList.remove('open');
}

function handleOverlayClick(e) {
  if (e.target.id === 'addModal') closeAddModal();
}

function addSubject() {
  const name = document.getElementById('newSubjectName').value.trim();
  const day = document.getElementById('newSubjectDay').value;
  if (!name || !day) { showToast('Preencha todos os campos.'); return; }

  const newSubject = { name, day, faltas: MAX };
  subjects.push(newSubject);
  idx = sortSubjects(newSubject); // sort by weekday, track new subject's position

  closeAddModal();
  saveData();
  renderTrack(); // rebuild all slides
  showToast(`"${name}" adicionada!`);
}
/* ══════════════════════════════
   CALENDAR MODAL
══════════════════════════════ */

function openCalendarModal() {
  const s = subjects[idx];
  const dates = getTruancy(s); // array of 'DD/MM/YYYY' strings

  // ── Header ──────────────────────────────────────────────
  document.getElementById('calendarTitle').textContent = s.name;
  document.getElementById('calendarSubtitle').textContent = s.day;

  // ── Build calendar for current month ────────────────────
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const today = now.getDate();

  // Set of absent dates as 'D/M/YYYY' for fast lookup
  const absentSet = new Set(
    dates.map(d => {
      // stored as 'DD/MM/YYYY' from toLocaleDateString('pt-BR')
      const [dd, mm, yyyy] = d.split('/');
      return `${parseInt(dd)}/${parseInt(mm)}/${yyyy}`;
    })
  );

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  document.getElementById('calendarMonthLabel').textContent =
    `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Reorder: week starts on Monday (0=Mon … 6=Sun)
  const startOffset = (firstDay + 6) % 7;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // Day-of-week headers
  ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach(d => {
    const th = document.createElement('div');
    th.className = 'cal-header';
    th.textContent = d;
    grid.appendChild(th);
  });

  // Empty cells before the 1st
  for (let i = 0; i < startOffset; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day cal-empty';
    grid.appendChild(blank);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${d}/${month + 1}/${year}`;
    const isAbs = absentSet.has(key);
    const isTod = d === today;

    const cell = document.createElement('div');
    cell.className = 'cal-day' +
      (isAbs ? ' cal-absent' : '') +
      (isTod ? ' cal-today' : '');
    cell.textContent = d;
    grid.appendChild(cell);
  }

  // ── Absence list below calendar ──────────────────────────
  const list = document.getElementById('calendarAbsenceList');
  if (dates.length === 0) {
    list.innerHTML = '<p class="cal-empty-msg">Nenhuma falta registrada.</p>';
  } else {
    list.innerHTML = dates
      .slice()
      .reverse() // most recent first
      .map(d => `<div class="cal-absence-item">
                   <span class="cal-absence-dot"></span>${d}
                 </div>`)
      .join('');
  }

  document.getElementById('calendarModal').classList.add('open');
}

function closeCalendarModal() {
  document.getElementById('calendarModal').classList.remove('open');
}

function handleCalendarOverlayClick(e) {
  if (e.target.id === 'calendarModal') closeCalendarModal();
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ══════════════════════════════
   INIT
══════════════════════════════ */

renderTrack();
