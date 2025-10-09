(function(){
  window.CODIGOS = window.CODIGOS || {};

  // Mostrar/ocultar sin tocar inline styles
function setVisible(elOrId, visible) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.classList.toggle('is-hidden', !visible);
}


  // --- DIAGNÓSTICO mín. (no altera cálculos) ---
console.log("[CODIGOS.JS] Cargado desde", location.pathname);
window.__pingMults = async () => {
  const r = await fetch('data/codigos/multiplicadores.json', { cache:'no-store' });
  console.log('[PING MULTS] HTTP', r.status);
  return r.ok ? r.json() : null;
};

// --- Multiplicadores (versión limpia) ---
window.MULTS = { default: 1, categorias: {} };

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const v = window.__assetVersion ? `?v=${encodeURIComponent(window.__assetVersion)}` : `?t=${Date.now()}`;
    const res = await fetch('data/codigos/multiplicadores.json' + v, { cache: 'no-store' });
    if (res.ok) window.MULTS = await res.json();
  } catch (e) {
    // si falla, MULTS queda con default=1
  }
});

// helper global
window.getMultiplicador = (c) =>
  (window.MULTS?.categorias?.[String(c)] ?? window.MULTS?.default ?? 1);

// Utilidad global para mostrar/ocultar por clase (en vez de tocar style.display)
window.setVisible = function setVisible(elOrId, visible) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.classList.toggle('is-hidden', !visible);
};



  const withV = (url) => window.__assetVersion ? `${url}?v=${window.__assetVersion}` : url;

  function pctE60(antigAnios){
    const a = Math.max(0, Math.floor(Number(antigAnios || 0)));
    if (a === 0) return 0.00;
    if (a === 1) return 0.10;
    if (a <= 4) return 0.15;
    if (a <= 6) return 0.30;
    if (a <= 9) return 0.40;
    if (a <= 11) return 0.50;
    if (a <= 14) return 0.60;
    if (a <= 16) return 0.70;
    if (a <= 19) return 0.80;
    if (a <= 21) return 1.00;
    if (a <= 23) return 1.10;
    if (a === 24) return 1.20;
    if (a <= 27) return 1.30;
    if (a <= 29) return 1.40;
    if (a <= 31) return 1.50;
    if (a <= 33) return 1.60;
    return 1.70;
  }

  function normalizarIndiceCargos(indice){
    if (indice && typeof indice === 'object'){
      const val = indice.cargos ?? indice.CARGOS ?? indice.base ?? indice.valor ?? indice.value;
      if (val != null) return Number(val) || 0;
    }
    return Number(indice || 0);
  }

  function calcE60Mensual(indice, antigAnios){
    const indiceCargos = normalizarIndiceCargos(indice);
    if (!indiceCargos) return 0;
    const base = indiceCargos * 39;
    const factor = 1 + pctE60(antigAnios);
    const total = base * factor;
    return Math.round(total * 100) / 100;
  }

  function calcE60Prorrateado(indice, dias, antigAnios){
    const importeMensual = calcE60Mensual(indice, antigAnios);
    const diasCalc = Number(dias || 0);
    if (!importeMensual || !diasCalc) return 0;
    return Math.round(((importeMensual / 30) * diasCalc) * 100) / 100;
  }

  window.CODIGOS.E60 = {
    id: "E60",
    soloTipo: "CARGO",
    getImporteBase({ dias = 30, antigAnios = 0, indiceActual }){
      return calcE60Prorrateado(indiceActual, dias, antigAnios);
    },
    getImporteComplemento({ dias = 0, antigAnios = 0, indiceAnterior }){
      return calcE60Prorrateado(indiceAnterior, dias, antigAnios);
    }
  };
  
  /* === Helpers Horas Catedra === */
  function getPuntos116Acumulados(ym) {
    const getA01For = window.PUNTOS?.getA01For;
    if (typeof getA01For === 'function') {
      const data = getA01For(116, ym) || {};
      const v = Number(data.actual);
      if (Number.isFinite(v) && v > 0) return v;
    }
    const base = Number(window.CARGOS?.getByCategoria?.(116)?.A01);
    if (Number.isFinite(base) && base > 0) return base;
    return 0;
  }

  function valorHoraMensual(ym, nivel) {
    const divisor = (nivel === 'HCNS') ? 12 : 15;
    if (!ym || divisor <= 0) return 0;
    const indice = Number(window.CARGOS?.getIndice?.(ym) || 0);
    if (!(indice > 0)) return 0;
    const puntos = getPuntos116Acumulados(ym);
    if (!(puntos > 0)) return 0;
    const a01Pesos = puntos * indice;
    return a01Pesos / divisor;
  }

  function ymPrevOf(ym) {
    if (window.PUNTOS?.prevYM) return window.PUNTOS.prevYM(ym);
    const [Y, M] = String(ym || '').split('-').map(Number);
    if (!Y || !M) return '';
    const d = new Date(Y, M - 1, 1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
  }
  window.CODIGOS.HC = {
    getImporteBase({ ym, dias = 30, horas = 0, nivel = 'HCNM' }) {
      if (!ym) return 0;
      const vh = valorHoraMensual(ym, nivel);
      if (!vh) return 0;
      const importe = vh * Number(horas || 0) * (Number(dias || 0) / 30);
      return Math.round(importe * 100) / 100;
    },
    getImporteComplemento({ ym, ymPrev, dias = 0, horas = 0, nivel = 'HCNM' }) {
      if (!ym) return 0;
      const key = ymPrev || ymPrevOf(ym);
      if (!key) return 0;
      const vhPrev = valorHoraMensual(key, nivel);
      if (!vhPrev) return 0;
      const importe = vhPrev * Number(horas || 0) * (Number(dias || 0) / 30);
      return Math.round(importe * 100) / 100;
    }
  };
  // === E29: Adicional calculado desde A01 cat. 116 ===
  function obtenerA01_116(ym) {
    if (!ym) return 0;

    // 1) Obtener el índice del mes (CARGOS.getIndice ya existe en el proyecto)
    const indice = Number(window.CARGOS?.getIndice?.(ym) || 0);
    if (!(indice > 0)) return 0;

    // 2) Obtener PUNTOS acumulados de la cat. 116 (no pesos)
    let puntos = 0;

    // Usa el helper existente (devuelve puntos, p.ej. 492)
    if (typeof getPuntos116Acumulados === 'function') {
      const val = Number(getPuntos116Acumulados(ym));
      if (Number.isFinite(val) && val > 0) puntos = val;
    }

    // Fallback al nomenclador si no hay helper
    if (!(puntos > 0)) {
      const base = Number(window.CARGOS?.getByCategoria?.(116)?.A01);
      if (Number.isFinite(base) && base > 0) puntos = base;
    }

    // 3) Formar SIEMPRE el A01 en pesos como puntos × índice
    if (!(puntos > 0)) return 0;
    return puntos * indice;
  }
  function calcularE29_30dias(ym) {
    const a01 = obtenerA01_116(ym);
    return (!a01 || Number.isNaN(a01)) ? 0 : a01 * 0.025;
  }

  function calcularE29_complemento(ymPrev, diasExc) {
    const d = Number(diasExc || 0);
    if (d <= 0) return 0;
    const a01Prev = obtenerA01_116(ymPrev);
    if (!a01Prev || Number.isNaN(a01Prev)) return 0;
    return (a01Prev * 0.025 / 30) * d;
  }

  window.CODIGOS.E29 = {
    id: "E29",
    getImporteBase: ({ ym, dias = 30 }) => {
      const diasCalc = Number(dias || 0);
      if (!ym || !(diasCalc > 0)) return 0;
      return calcularE29_30dias(ym) * (diasCalc / 30);
    },
    getImporteComplemento: ({ ymPrev, diasExc = 0 }) => {
      const diasCalc = Number(diasExc || 0);
      if (!ymPrev || !(diasCalc > 0)) return 0;
      return calcularE29_complemento(ymPrev, diasCalc);
    }
  };

  let prevE29Base = 0;
  let e29Timers = [];
  let e29Attached = false;

  function formatARS(value) {
    const val = Math.round(Number(value || 0) * 100) / 100;
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseARS(str) {
    if (typeof str !== 'string') str = String(str ?? '');
    const normalized = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
  }

  function diasBaseDesdeEtiqueta() {
    const label = document.getElementById('diasLiq');
    if (!label) return 0;
    const match = label.textContent?.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  function actualizarE29() {
    const mod = window.CODIGOS?.E29;
    if (!mod) return;

    const ymEl = document.getElementById('indicePeriodo') || document.getElementById('indiceMes');
    const ym = (ymEl?.value || '').trim();
    const diasBase = diasBaseDesdeEtiqueta();
    const diasExcEl = document.getElementById('diasExc');
    const diasExc = Number((diasExcEl?.dataset?.value ?? diasExcEl?.textContent ?? '0').toString().replace(/[^\d.-]/g, '')) || 0;

    const tipoSel = typeof window.getTipoCargo === 'function' ? (window.getTipoCargo() || '') : '';
    const esCargo = tipoSel !== 'HCNM' && tipoSel !== 'HCNS';
    const suplenteChecked = document.getElementById('suplente')?.checked === true;

    const baseRow = document.getElementById('rowE29');
    const baseCell = document.getElementById('e29Importe');
    const compRow = document.getElementById('rowE29_comp');
    const compCell = document.getElementById('e29CompImporte');
    const compBox = document.getElementById('complementoBox');

    const diasParaBase = (diasBase && diasBase > 0) ? Math.min(30, diasBase) : 0;
    const puedeMostrarBase = ym && diasParaBase > 0 && esCargo && suplenteChecked;

    let baseImporte = 0;
    if (puedeMostrarBase) {
      baseImporte = Number(mod.getImporteBase({ ym, dias: diasParaBase }) || 0);
    }
    const baseImporteRounded = Math.round(baseImporte * 100) / 100;

    if (baseCell) baseCell.textContent = formatARS(baseImporteRounded);

    const mostrarBase = puedeMostrarBase && baseImporteRounded > 0;
    if (baseRow) setVisible(baseRow, mostrarBase);


    const totalEl = document.getElementById('totalParcial');
    if (totalEl) {
      const baseSinE29 = parseARS(totalEl.textContent) - prevE29Base;
      const nuevoTotal = baseSinE29 + (mostrarBase ? baseImporteRounded : 0);
      totalEl.textContent = formatARS(nuevoTotal);
      prevE29Base = mostrarBase ? baseImporteRounded : 0;
    } else {
      prevE29Base = mostrarBase ? baseImporteRounded : 0;
    }

    const ymPrev = ym ? (window.PUNTOS?.prevYM?.(ym) || ymPrevOf(ym)) : '';
    let compImporte = 0;
    if (mostrarBase && ymPrev && diasExc > 0) {
      compImporte = Number(mod.getImporteComplemento({ ymPrev, diasExc }) || 0);
    }
    const compRounded = Math.round(compImporte * 100) / 100;

    if (compCell) compCell.textContent = formatARS(compRounded);

    const mostrarComp = mostrarBase && compRounded > 0;
    if (compRow) compRow.style.display = mostrarComp ? 'table-row' : 'none';
    if (compBox && mostrarComp && compBox.style.display === 'none') {
      compBox.style.display = '';
    }
  }

  function scheduleE29Updates() {
    e29Timers.forEach((id) => clearTimeout(id));
    e29Timers = [];
    actualizarE29();
    e29Timers.push(setTimeout(actualizarE29, 60));
    e29Timers.push(setTimeout(actualizarE29, 160));
  }

  function attachE29Integration() {
    if (e29Attached) return;
    const calc = window.calculateLiq;
    if (typeof calc !== 'function') {
      setTimeout(attachE29Integration, 50);
      return;
    }
    if (calc.__withE29) {
      e29Attached = true;
      scheduleE29Updates();
      return;
    }
    const wrapped = async function (...args) {
      const result = await calc.apply(this, args);
      scheduleE29Updates();
      return result;
    };
    wrapped.__withE29 = true;
    window.calculateLiq = wrapped;
    e29Attached = true;
    scheduleE29Updates();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachE29Integration);
  } else {
    attachE29Integration();
  }

  // === Resaltado de Códigos F (complemento) ===
(function attachFHighlight() {
  if (window.__F_HIGHLIGHT_ATTACHED__) return;
  window.__F_HIGHLIGHT_ATTACHED__ = true;

// === helper: formatea un TD de importe a "$ 0.000,00" (es-AR) sin romper nodos ===
function normalizeImporteTd(td) {
  if (!td) return;

  // no tocar celdas dentro del desglose mensual
  if (td.closest('table')?.classList.contains('meses')) return;

  // busco un nodo “número real” si existe; si no, uso el TD cuando es plano
  const numberNode =
    td.querySelector('[id$="Importe"], [id$="CompImporte"]') ||
    td.querySelector('[data-importe]') ||
    td.querySelector('.importe-value') ||
    (td.children.length === 0 ? td : null);

  if (!numberNode) return;

  const raw = (numberNode.textContent || '').trim();
  // si la celda está vacía o no hay dígitos, NO toco (evita $ 0,00 falsos)
  if (!/\d/.test(raw)) return;

  const norm = raw
    .replace(/\./g, '')       // saca miles
    .replace(',', '.')        // coma -> punto
    .replace(/[^\d.-]/g, ''); // deja números, signo y punto

  if (norm === '' || norm === '-' || norm === '.') return;

  const num = Number(norm);
  if (!Number.isFinite(num)) return;

  const val = Math.round(num * 100) / 100;
  numberNode.textContent = '$ ' + val.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

  function highlightFCodes(root = document) {
  const rows = root.querySelectorAll('.tabla-codigos tbody tr');
  rows.forEach(tr => {
    const tdCodigo  = tr.querySelector('td:first-child');
    const tdSigno   = tr.closest('table')?.classList.contains('tabla-codigos')
                    ? tr.querySelector('td:nth-child(2)')
                    : null;
    const tdImporte = tr.querySelector('td:last-child');
    if (!tdCodigo || !tdImporte) return;

    const code = (tdCodigo.textContent || '').trim();
    const isF  = /^F/.test(code);

    // Aplica/quita el highlight al código, al signo $ (si existe) y al importe
    [tdCodigo, tdSigno, tdImporte].forEach(td => {
      if (!td) return;
      td.classList.toggle('f-highlight', isF);
    });

    

    // Mantener el formato del número
    normalizeImporteTd(tdImporte);
  });
}

  if (typeof window !== 'undefined') window.highlightFCodes = highlightFCodes;

  // 1) Al cargar el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => highlightFCodes());
  } else {
    highlightFCodes();
  }

  // 2) Engancharse al recálculo principal sin romper el wrap del E29
  function hookCalculate() {
    const calc = window.calculateLiq;
    if (typeof calc === 'function' && !calc.__withFHighlight) {
      const wrapped = function (...args) {
        const res = calc.apply(this, args);
        // correr después del render de tablas
        Promise.resolve().then(() => highlightFCodes());
        return res;
      };
      wrapped.__withFHighlight = true;
      // preservar cualquier marca previa (p. ej. __withE29)
      Object.keys(calc).forEach(k => { if (!(k in wrapped)) wrapped[k] = calc[k]; });
      window.calculateLiq = wrapped;
    }
  }

  // Hook inmediato o reintento si todavía no existe calculateLiq
  if (typeof window.calculateLiq === 'function') {
    hookCalculate();
    Promise.resolve().then(() => highlightFCodes());
  } else {
    let tries = 0;
    const id = setInterval(() => {
      if (typeof window.calculateLiq === 'function') {
        clearInterval(id);
        hookCalculate();
        highlightFCodes();
      } else if (++tries > 50) {
        clearInterval(id);
      }
    }, 100);
  }
})();


})();


// === Getters necesarios por calculateLiq (HCNM/HCNS) ===
window.getTipoCargo = function () {
  const el = document.getElementById('tipoSeleccion');
  return (el?.value || '').trim();
};

window.getCategoriaId = function () {
  const el = document.getElementById('catId');
  const n = Number(el?.value || 0);
  return Number.isFinite(n) ? n : 0;
};

window.getHorasSeleccionadas = function () {
  const el = document.getElementById('horasValor');
  const raw = (el?.value ?? '').trim();
  if (raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

// === Toggle de paneles y recálculo para Horas Cátedra ===
document.addEventListener('DOMContentLoaded', () => {
  const selTipo = document.getElementById('tipoSeleccion');
  const panelCarg = document.getElementById('panelCargos');
  const horasCard = document.getElementById('horasCard');

  function refreshPanels() {
    const t = window.getTipoCargo();
    if (t === 'CARGOS') {
      if (panelCarg) panelCarg.style.display = 'block';
      if (horasCard) horasCard.style.display = 'none';
    } else if (t === 'HCNM' || t === 'HCNS') {
      if (panelCarg) panelCarg.style.display = 'none';
      if (horasCard) horasCard.style.display = 'block';
    } else {
      if (panelCarg) panelCarg.style.display = 'none';
      if (horasCard) horasCard.style.display = 'none';
    }

    ['rowHCNM','rowHCNS','rowHCNM_comp','rowHCNS_comp'].forEach((id) => {
      const tr = document.getElementById(id);
      if (tr) tr.style.display = 'none';
    });

    if (typeof update === 'function') {
      try { update(); } catch (e) {}
    }
  }

  selTipo?.addEventListener('change', refreshPanels);
  refreshPanels();
});
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('catId');
  const badge = document.getElementById('multBadge');

  function updateBadge() {
    if (!input || !badge || typeof getMultiplicador !== 'function') return;
    const cat = String(input.value || '').trim();
    if (!cat) { badge.style.display = 'none'; return; }
    const m = getMultiplicador(cat);
    badge.textContent = 'x' + m;
    // si es 1 (default) lo escondemos
    badge.style.display = (Number(m) !== 1) ? 'inline-block' : 'none';
  }

  // reaccionar cuando el usuario escribe / selecciona categoría
  input?.addEventListener('input', updateBadge);
  // y actualizar cuando todo terminó de cargar
  window.addEventListener('load', updateBadge);
});

/* ===== A56/F56 Estado Docente (excepciones 2024 + cascada 2025) ===== */
(function(){
  window.CODIGOS = window.CODIGOS || {};

  // === A56: Estado Docente =====================================================
  // Fuente unica de verdad: indices.json ya cargado en memoria.
  // Se asume un objeto global INDICES o un getter getIndice(ym).
  // Si tu proyecto expone otra variable, ajusta la funcion getIdx.

  const DEFAULT_CFG = {
    baselineMonth: '2024-01',
    cargoBase: 53388.38,
    mode: 'index_ratio',
    maxHoras: { HCNM: 18, HCNS: 15 }
  };

  const A56 = {};
  let CFG = { ...DEFAULT_CFG };
  let cfgLoaded = false;
  let indicesCheckDone = false;

  async function ready(){
    if (cfgLoaded) return true;
    try {
      const resp = await fetch('data/codigos/a56.config.json', { cache:'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      CFG = {
        ...DEFAULT_CFG,
        ...data,
        maxHoras: { ...DEFAULT_CFG.maxHoras, ...(data?.maxHoras || {}) }
      };
    } catch(err) {
      CFG = { ...DEFAULT_CFG };
      console.warn('[A56] Config por defecto aplicada:', err);
    }
    cfgLoaded = true;
    return true;
  }

  const YM = (y, m) => `${y}-${String(m).padStart(2, '0')}`;

  function getIdx(ym){
    const valFromCargos = Number(window.CARGOS?.getIndice?.(ym));
    if (Number.isFinite(valFromCargos) && valFromCargos > 0) return valFromCargos;
    const map = (window.INDICES && (window.INDICES.indices || window.INDICES)) || window.indices || {};
    const fallback = Number(map?.[ym]);
    if (Number.isFinite(fallback) && fallback > 0) return fallback;
    throw new Error(`[A56] Indice no encontrado para ${ym}`);
  }

  function validarIndicesEsperados(){
    try {
      const mar = getIdx(YM(2024, 3));
      const abr = getIdx(YM(2024, 4));
      const pct = (abr / mar) - 1;
      if (Math.abs(pct - 0.08333) > 0.001) {
        console.warn(`[A56] Advertencia: Mar->Abr no es +8.333%. Valor detectado: ${(pct * 100).toFixed(3)}%`);
      }
    } catch(err) {
      console.warn('[A56] No se pudo validar Mar->Abr:', err.message || err);
    }
    try {
      const nov = getIdx(YM(2024, 11));
      const dic = getIdx(YM(2024, 12));
      const pct = (dic / nov) - 1;
      if (Math.abs(pct - 0.024) > 0.0008) {
        console.warn(`[A56] Advertencia: Nov->Dic no es +2.4%. Valor detectado: ${(pct * 100).toFixed(3)}%`);
      }
    } catch(err) {
      console.warn('[A56] No se pudo validar Nov->Dic:', err.message || err);
    }
  }

  function getBaselineMonth(){
    return String(CFG?.baselineMonth || DEFAULT_CFG.baselineMonth);
  }

  function getCargoBase(){
    return Number(CFG?.cargoBase ?? DEFAULT_CFG.cargoBase);
  }

  function general2024(ym){
    const base = getCargoBase();
    if (!(base > 0)) return 0;
    const idxMes = getIdx(ym);
    const idxBase = getIdx(getBaselineMonth());
    if (!(idxBase > 0)) return 0;
    return base * (idxMes / idxBase);
  }

  const A56_OCT_FIJO = 106275.46;

  function valorOct2024(){
    return A56_OCT_FIJO;
  }

  function valorNov2024(){
    const idxOct = getIdx(YM(2024, 10));
    const idxNov = getIdx(YM(2024, 11));
    if (!(idxOct > 0) || !(idxNov > 0)) return 0;
    const factor = (idxNov / idxOct) + 0.01;
    return valorOct2024() * factor;
  }

  function valorDic2024(){
    return valorNov2024() * 1.024;
  }

  function desde2025(ym){
    const idxDic = getIdx(YM(2024, 12));
    const idxObj = getIdx(ym);
    if (!(idxDic > 0) || !(idxObj > 0)) return 0;
    return valorDic2024() * (idxObj / idxDic);
  }

  function clampHoras(nivel, horas){
    const max = (nivel === 'HCNS') ? (CFG.maxHoras?.HCNS || DEFAULT_CFG.maxHoras.HCNS) : (CFG.maxHoras?.HCNM || DEFAULT_CFG.maxHoras.HCNM);
    const h = Math.max(0, Math.floor(Number(horas || 0)));
    return Math.min(h, max);
  }

  function prorrateo(mensual, dias){
    return (Number(mensual || 0) / 30) * Number(dias || 0);
  }

  // === API ===
  A56.ready = ready;

  A56.mensualCargo = function(ym){
    if (!ym) return 0;
    const mode = String(CFG?.mode || DEFAULT_CFG.mode);
    if (mode !== 'index_ratio') return 0;
    if (!indicesCheckDone) {
      try { validarIndicesEsperados(); } catch(err) { console.warn('[A56] Validacion de indices:', err); }
      indicesCheckDone = true;
    }
    try {
      const parts = String(ym).split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (!Number.isFinite(y) || !Number.isFinite(m)) return 0;
      if (y === 2024) {
        if (m <= 9) return general2024(ym);
        if (m === 10) return valorOct2024();
        if (m === 11) return valorNov2024();
        if (m === 12) return valorDic2024();
      }
      if (y >= 2025) return desde2025(ym);
      return general2024(ym);
    } catch(err) {
      console.warn('[A56] mensualCargo error para', ym, err);
      return 0;
    }
  };

  A56.mensualHora = function(ym, nivel, horas){
    const mCargo = A56.mensualCargo(ym);
    const divisor = (nivel === 'HCNS') ? 15 : 18;
    const h = clampHoras(nivel, horas);
    return (mCargo / divisor) * h;
  };

  A56.prorrateo = function(mensual, dias){
    const valor = prorrateo(mensual, dias);
    return Math.round(valor * 100) / 100;
  };

  A56.hcnm = function(valorCargo){ return valorCargo / 18; };
  A56.hcns = function(valorCargo){ return valorCargo / 15; };

  window.CODIGOS.A56 = A56;
})();

// === Licencias: calcula fecha de finalización (inclusive) ===
document.addEventListener('DOMContentLoaded', () => {
  const ini  = document.getElementById('licInicio');
  const dias = document.getElementById('licDias');
  const fin  = document.getElementById('licFin');

  const fmt = (d) =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  function recompute() {
    if (!ini || !dias || !fin) return;
    const start = ini.value ? new Date(ini.value) : null;
    const n = Number.parseInt(dias.value, 10);

    if (!start || !Number.isFinite(n) || n <= 0) {
      fin.value = '';
      return;
    }

    // Regla inclusiva: fin = inicio + (días - 1)
    const end = new Date(start);
    end.setDate(end.getDate() + (n - 1));
    fin.value = fmt(end);
  }

  ini?.addEventListener('change', recompute);
  dias?.addEventListener('input', recompute);
  recompute();
});









