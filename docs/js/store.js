// docs/js/store.js — Mini store ESM (vanilla) con fallbacks de IDs y lectura robusta
export const state = {
  ym: null,            // "YYYY-MM"
  categoriaId: 0,
  indiceActual: 0,
  indicePrevio: 0,
  // días son opcionales; si existen en el DOM los tomamos, si no, que los calcule calculateLiq
  diasBase: undefined,
  diasExc: undefined,
};

const subs = new Set();

export function subscribe(fn) {
  subs.add(fn);
  try { fn(state); } catch (e) {}
  return () => subs.delete(fn);
}

// set() ignora claves undefined (no pisa con "vacío")
export function set(patch) {
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (state[k] !== v) { state[k] = v; changed = true; }
  }
  if (changed) for (const fn of subs) { try { fn(state); } catch(e){} }
}

function pickEl(ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function toNumberSafe(x) {
  if (x == null) return 0;
  const s = String(x);
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function syncFromDOM() {
  // Mes seleccionado
  const ymEl = document.getElementById('indicePeriodo');
  const ym = (ymEl?.value || '').trim();

  // Categoría (aceptamos catId o cargoId)
  const catEl = pickEl(['catId', 'cargoId']);
  const categoriaId = Number(catEl?.value || 0);

  // Índices con PUNTOS.prevYM si existe
  const ymPrev = (window.PUNTOS?.prevYM?.(ym)) || ym;
  const getIdx = window.CARGOS?.getIndice?.bind(window.CARGOS) || (() => 0);
  const indiceActual = getIdx(ym) || 0;
  const indicePrevio = getIdx(ymPrev) || 0;

  // Intento de lectura de días desde el DOM (opcional)
  // Aceptamos: #diasBase / #diasBaseLabel y #diasExc / #diasExcedente / #diasExcedentes
  const diasBaseEl = pickEl(['diasBase', 'diasBaseLabel']);
  const diasExcEl  = pickEl(['diasExc', 'diasExcedente', 'diasExcedentes']);
  const diasBase = diasBaseEl ? toNumberSafe(diasBaseEl.dataset?.value ?? diasBaseEl.textContent) : undefined;
  const diasExc  = diasExcEl  ? toNumberSafe(diasExcEl.dataset?.value  ?? diasExcEl.textContent)  : undefined;

  set({ ym, categoriaId, indiceActual, indicePrevio, diasBase, diasExc });
}

