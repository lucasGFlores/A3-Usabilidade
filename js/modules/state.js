// ─────────────────────────────────────────
//  state.js — shared constants and app state
// ─────────────────────────────────────────

/** Maximum absences allowed before failing. */
export const MAX = 10;

/** Week order starting on Monday (Brazilian convention). */
export const DAY_ORDER = {
  'segunda-feira': 0,
  'terça-feira': 1,
  'quarta-feira': 2,
  'quinta-feira': 3,
  'sexta-feira': 4,
  'sábado': 5,
  'domingo': 6,
};

/**
 * Mutable app state. Modules import this object and mutate its properties
 * directly — keeps a single source of truth without a heavy state manager.
 *
 * `faltasByName` é o mapa canônico de faltas: { [nomeMatéria]: number }.
 * Os objetos em `subjects` NÃO armazenam faltas diretamente — use sempre
 * getFaltas() / setFaltas() para ler e escrever.
 */
export const state = {
  /** @type {{ name: string, day: string }[]} */
  subjects: [],

  /**
   * Contador compartilhado de faltas por nome de matéria.
   * Todas as aulas com o mesmo nome leem/escrevem aqui.
   * @type {Record<string, number>}
   */
  faltasByName: {},

  /** Index of the currently visible slide. */
  idx: 0,
};

// ── Faltas helpers ────────────────────────────────────────────────────────────

/**
 * Retorna a quantidade de faltas de uma matéria (por nome).
 * @param {string} name
 * @returns {number}
 */
export function getFaltas(name) {
  return state.faltasByName[name] ?? MAX;
}

/**
 * Define a quantidade de faltas de uma matéria (por nome).
 * Afeta todos os slides que compartilham esse nome.
 * @param {string} name
 * @param {number} value
 */
export function setFaltas(name, value) {
  state.faltasByName[name] = value;
}

// ── Sort ──────────────────────────────────────────────────────────────────────

/**
 * Sorts state.subjects in-place by day of week.
 * @param {object} currentSubject — kept to find its new position after sort
 * @returns {number} new index of currentSubject
 */
export function sortSubjects(currentSubject) {
  state.subjects.sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);
  return state.subjects.indexOf(currentSubject);
}
