// ─────────────────────────────────────────
//  calendar.js — calendar modal
// ─────────────────────────────────────────

import { state, DAY_ORDER }  from './state.js';
import { getTruancy }        from './storage.js';
import { statusColor }       from './slides.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho',   'Agosto',    'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Calendar state ────────────────────────────────────────────────────────────

// Persisted across month navigations while the modal is open.
let calYear      = null;
let calMonth     = null; // 0-based
let calAbsentSet = null;
let calClassDay  = null;

// ── Date key ──────────────────────────────────────────────────────────────────

/** Builds a 'D/M/YYYY' lookup key — consistent with the storage format. */
function dateKey(day, month1based, year) {
  return `${day}/${month1based}/${year}`;
}

// ── Grid rendering ────────────────────────────────────────────────────────────

/**
 * Renders the calendar grid for the given year/month.
 * @param {number} year
 * @param {number} month       0-based
 * @param {Set<string>} absentSet
 * @param {number} classDayNum  Mon=0 … Sun=6
 */
function renderCalendarGrid(year, month, absentSet, classDayNum) {
  const today      = new Date();
  const todayKey   = dateKey(today.getDate(), today.getMonth() + 1, today.getFullYear());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJS  = new Date(year, month, 1).getDay(); // 0=Sun
  const startOffset = (firstDayJS + 6) % 7;              // shift to Mon=0

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // Weekday headers
  ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach(label => {
    const th = document.createElement('div');
    th.className = 'cal-weekday';
    th.textContent = label;
    grid.appendChild(th);
  });

  // Empty leading cells
  for (let i = 0; i < startOffset; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day cal-empty';
    grid.appendChild(blank);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate  = new Date(year, month, d);
    const cellDow   = (cellDate.getDay() + 6) % 7; // Mon=0
    const key       = dateKey(d, month + 1, year);
    const isAbsent  = absentSet.has(key);
    const isToday   = key === todayKey;
    const isClassDay = cellDow === classDayNum;
    const isPast    = cellDate < today && cellDate.toDateString() !== today.toDateString();
    const isPresent = isClassDay && isPast && !isAbsent;

    const cell = document.createElement('div');
    cell.className = ['cal-day',
      isAbsent   && 'cal-absent',
      isToday    && 'cal-today',
      isClassDay && 'cal-class-day',
      isPresent  && 'cal-present',
    ].filter(Boolean).join(' ');
    cell.textContent = d;
    grid.appendChild(cell);
  }

  // Disable "next month" button when already at current month
  const now = new Date();
  document.getElementById('calNavNext').disabled =
    year === now.getFullYear() && month === now.getMonth();
}

// ── Absence history list ──────────────────────────────────────────────────────

function renderAbsenceHistory(dates) {
  const list = document.getElementById('calendarAbsenceList');
  if (dates.length === 0) {
    list.innerHTML = '<p class="cal-empty-msg">Nenhuma falta registrada.</p>';
    return;
  }
  list.innerHTML = [...dates]
    .reverse()
    .map(d => `<div class="cal-absence-item"><span class="cal-absence-dot"></span>${d}</div>`)
    .join('');
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Opens the calendar modal for the current subject. */
export function openCalendarModal() {
  const s     = state.subjects[state.idx];
  const dates = getTruancy(s);

  // Header
  document.getElementById('calendarTitle').textContent    = s.name;
  document.getElementById('calendarSubtitle').textContent = s.day;
  const dot = document.getElementById('calendarDayDot');
  if (dot) dot.style.background = statusColor(s.faltas);

  // Build absence set in 'D/M/YYYY' format
  calAbsentSet = new Set(
    dates.map(d => {
      const [dd, mm, yyyy] = d.split('/');
      return dateKey(parseInt(dd), parseInt(mm), yyyy);
    })
  );

  calClassDay = DAY_ORDER[s.day] ?? -1;

  const now = new Date();
  calYear  = now.getFullYear();
  calMonth = now.getMonth();

  renderCalendarGrid(calYear, calMonth, calAbsentSet, calClassDay);
  document.getElementById('calendarMonthLabel').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  renderAbsenceHistory(dates);

  document.getElementById('calendarModal').classList.add('open');
}

/**
 * Shifts the displayed calendar month by `delta` months.
 * Called by the prev/next buttons in the HTML.
 * @param {number} delta  -1 or +1
 */
export function shiftCalendarMonth(delta) {
  calMonth += delta;
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0;  calYear++; }

  document.getElementById('calendarMonthLabel').textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;
  renderCalendarGrid(calYear, calMonth, calAbsentSet, calClassDay);
}

export function closeCalendarModal() {
  document.getElementById('calendarModal').classList.remove('open');
}

export function handleCalendarOverlayClick(e) {
  if (e.target.id === 'calendarModal') closeCalendarModal();
}
