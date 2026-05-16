// ─────────────────────────────────────────
//  storage.js — localStorage persistence
// ─────────────────────────────────────────

import { state, MAX, getFaltas, setFaltas } from './state.js';

const STORAGE_KEY = 'faltacount_subjects';
const STORAGE_KEY_FALTAS = 'faltacount_faltas_by_name';   // ← novo
const STORAGE_KEY_TRUANCY = 'faltacount_truancy';

// ── Subjects ─────────────────────────────────────────────────────────────────

/**
 * Persists state.subjects to localStorage.
 * Subjects NÃO carregam faltas — apenas name + day.
 */
export function saveSubjects() {
  // Salva só os campos estruturais; faltas ficam em faltasByName
  const lean = state.subjects.map(({ name, day }) => ({ name, day }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
}

/**
 * Loads subjects from localStorage, falling back to a default first-run entry.
 * Retorna objetos { name, day } — sem faltas.
 */
export function loadSubjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Compatibilidade: se o dado antigo ainda tiver .faltas, ignora
        return parsed.map(({ name, day }) => ({ name, day }));
      }
    }
  } catch (e) {
    console.warn('FaltaCount: could not read subjects from localStorage', e);
  }
  return [{ name: 'Usabilidade', day: 'quinta-feira' }];
}

// ── faltasByName ──────────────────────────────────────────────────────────────

/**
 * Persists state.faltasByName to localStorage.
 * Deve ser chamado sempre que setFaltas() for usado.
 */
export function saveFaltasByName() {
  localStorage.setItem(STORAGE_KEY_FALTAS, JSON.stringify(state.faltasByName));
}

/**
 * Loads faltasByName from localStorage.
 * Para nomes não encontrados, o default é MAX (nenhuma falta ainda).
 * @returns {Record<string, number>}
 */
export function loadFaltasByName() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FALTAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('FaltaCount: could not read faltasByName from localStorage', e);
  }
  return {};
}

/**
 * Garante que todo subject carregado tenha uma entrada em faltasByName.
 * Subjects novos começam com MAX faltas restantes.
 * Chame depois de carregar subjects E faltasByName.
 */
export function ensureFaltasDefaults() {
  state.subjects.forEach(({ name }) => {
    if (!(name in state.faltasByName)) {
      state.faltasByName[name] = MAX;
    }
  });
}

// ── Truancy (reactive Map) ────────────────────────────────────────────────────

/**
 * Creates a Map that automatically runs `effect(map)` after every `.set()`.
 * Mirrors the mental model of React's useEffect: any mutation triggers a side
 * effect (here, persistence) without manual wiring at every call site.
 *
 * @param {Map}      initialMap
 * @param {Function} effect  — callback(map) fired after each .set()
 * @returns {Proxy<Map>}
 */
function createReactiveMap(initialMap, effect) {
  return new Proxy(initialMap, {
    get(target, prop) {
      const value = target[prop];
      if (prop === 'set') {
        return function (...args) {
          Map.prototype.set.apply(target, args);
          effect(target);
          return target;
        };
      }
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
    console.warn('FaltaCount: could not read truancy from localStorage', e);
  }
  const defaults = new Map();
  defaults.set('Usabilidade', []);
  return defaults;
}

/**
 * Reactive Map of { subjectName → string[] } absence dates ('DD/MM/YYYY').
 * Any `.set()` call automatically persists to localStorage.
 */
export const truancyData = createReactiveMap(loadTruancyData(), persistTruancy);

// ── Truancy helpers ───────────────────────────────────────────────────────────

/** Appends `date` to the truancy list for `subject`. */
export function registerTruancy(subject, date) {
  const existing = truancyData.has(subject.name)
    ? truancyData.get(subject.name)
    : [];
  truancyData.set(subject.name, [...existing, date]);
}

/** Returns the array of absence dates for `subject` (never undefined). */
export function getTruancy(subject) {
  return truancyData.get(subject.name) ?? [];
}
