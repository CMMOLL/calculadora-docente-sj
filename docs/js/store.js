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

  // Categoría (aceptamos catId o cargoId)
  const catEl = pickEl(['catId', 'cargoId']);
  const categoriaId = Number(catEl?.value || 0);

  // Índices con fallback explícito cuando el mes seleccionado no tiene índice.
  // Regla: mientras no exista índice del mes en curso, tanto 30 días como excedentes
  // usan el último índice conocido (mes anterior) y se normaliza el <select> a ese mes.

  const getIdx   = window.CARGOS?.getIndice?.bind(window.CARGOS) || (() => 0);
  const ym       = (ymEl?.value || '').trim();
  const ymPrev   = window.PUNTOS?.prevYM?.(ym) || ym;

  const indiceActual = getIdx(ym) || 0;
  let   indicePrevio = getIdx(ymPrev);
  if (!indicePrevio) indicePrevio = indiceActual;

  // Si el mes siguiente al seleccionado no tiene índice cargado,
  // usamos el índice actual también para el "anterior".
  const ymNext = (() => {
    const [y, m] = String(ym || '').split('-').map(Number);
    if (!y || !m) return '';
    const yy = (m === 12) ? (y + 1) : y;
    const mm = (m === 12) ? 1 : (m + 1);
    return `${yy}-${String(mm).padStart(2, '0')}`;
  })();

  if (!getIdx(ymNext)) {
    indicePrevio = indiceActual;
  }

  let ymResuelto           = ym;
  let indiceActualResuelto = indiceActual;
  let indicePrevioResuelto = indicePrevio;

  if (!indiceActualResuelto) {
    const idxPrev1 = getIdx(ymPrev) || 0;
    if (idxPrev1) {
      // ambos (30 días y excedentes) = último índice conocido
      indiceActualResuelto = idxPrev1;
      indicePrevioResuelto = idxPrev1;

      // normalizamos la UI al mes anterior
      if (ymEl && ymEl.value !== ymPrev) ymEl.value = ymPrev;
      ymResuelto = ymPrev;
    } else {
      // ni el mes ni el anterior tienen índice
      indicePrevioResuelto = 0;
    }
  }

  // Camino normal: si no caímos en el fallback, el previo es el mes anterior real;
  // si faltara, usamos el actual.
  if (indicePrevioResuelto == null) {
    const prevReal = getIdx(ymPrev) || 0;
    indicePrevioResuelto = prevReal || indiceActualResuelto;
  }

  // Intento de lectura de días desde el DOM (opcional)
  // Aceptamos: #diasBase / #diasBaseLabel y #diasExc / #diasExcedente / #diasExcedentes
  const diasBaseEl = pickEl(['diasBase', 'diasBaseLabel']);
  const diasExcEl  = pickEl(['diasExc', 'diasExcedente', 'diasExcedentes']);
  const diasBase = diasBaseEl ? toNumberSafe(diasBaseEl.dataset?.value ?? diasBaseEl.textContent) : undefined;
  const diasExc  = diasExcEl  ? toNumberSafe(diasExcEl.dataset?.value  ?? diasExcEl.textContent)  : undefined;

  set({ ym: ymResuelto, categoriaId, indiceActual: indiceActualResuelto, indicePrevio: indicePrevioResuelto, diasBase, diasExc });
}

// --- AÑOS SAC DINÁMICOS (según rows de desglose) ---
let _rowsSAC = []; // último desglose calculado para recalcular días SAC

function fillSACYearsFromRows(rows) {
  const years = Array.from(new Set((rows || []).map(r => r.y))).sort((a, b) => a - b);

  // Si no hay rows (o están vacíos), deja solo el año actual
  const list = (years.length ? years : [new Date().getFullYear()]);

  // Vaciar y volver a crear opciones
  selectAnioSAC.innerHTML = '';
  for (const y of list) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    selectAnioSAC.appendChild(opt);
  }
  // Por defecto, seleccionamos el último año disponible (el más nuevo)
  selectAnioSAC.value = String(list[list.length - 1]);
}

function updateDiasSAC() {
  const anio = Number(selectAnioSAC.value || 0);
  const sem  = Number(selectSemSAC.value  || 1);
  const dias = calcularSAC(_rowsSAC || [], anio, sem);
  diasSAC.textContent = String(dias);
}

// Recalcular días cuando cambia Año o Semestre
selectAnioSAC.addEventListener('change', updateDiasSAC);
selectSemSAC.addEventListener('change', updateDiasSAC);
