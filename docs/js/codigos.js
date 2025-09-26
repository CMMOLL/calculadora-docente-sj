(function(){
  window.CODIGOS = window.CODIGOS || {};

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
  function getPuntos116Acumulados(ym) {
    if (window.PUNTOS && typeof window.PUNTOS.get116 === 'function') {
      const v = Number(window.PUNTOS.get116(ym));
      if (Number.isFinite(v) && v > 0) return v;
    }
    if (window.CODIGOS?.E66) {
      const g = window.CODIGOS.E66;
      if (typeof g.getPuntos116 === 'function') {
        const v = Number(g.getPuntos116(ym));
        if (Number.isFinite(v) && v > 0) return v;
      }
      if (typeof g.getPuntosCategoria === 'function') {
        const v = Number(g.getPuntosCategoria(116, ym));
        if (Number.isFinite(v) && v > 0) return v;
      }
    }
    return 492;
  }

  function valorHoraMensual(ym, nivel) {
    const divisor = (nivel === 'HCNS') ? 12 : 15;
    if (!ym || !divisor) return 0;
    const getIdx = (window.CARGOS?.getIndice?.bind(window.CARGOS)) || (() => 0);
    const indice = Number(getIdx(ym));
    if (!Number.isFinite(indice) || indice <= 0) return 0;
    const puntos = getPuntos116Acumulados(ym);
    if (!Number.isFinite(puntos) || puntos <= 0) return 0;
    const a01_116 = puntos * indice;
    return a01_116 / divisor;
  }

  function ymPrevOf(ym) {
    if (window.PUNTOS?.prevYM) return window.PUNTOS.prevYM(ym);
    const [Y, M] = String(ym || '').split('-').map(Number);
    if (!Y || !M) return '';
    const d = new Date(Y, M - 1, 1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
