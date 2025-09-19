// docs/js/codigos/e66.js
(function(){
  window.CODIGOS = window.CODIGOS || {};
  // Si ya existe API completa, no redefinir
  if (window.CODIGOS.E66 && window.CODIGOS.E66.getImporte && window.CODIGOS.E66.getImportePrev) return;

  const BASE_PATH = 'data/codigos/E66.base.json';
  let __BASE = null;

  // Índice por mes 'YYYY-MM' provisto por la app
  function getIdx(ym){
    return (typeof window.getIndiceByMonth === 'function') ? Number(window.getIndiceByMonth(ym) || 0) : 0;
  }

  function prevYM(ym){
    if (!/^\d{4}-\d{2}$/.test(String(ym||''))) return '';
    const [y,m] = ym.split('-').map(Number);
    const d = new Date(y, m-1, 1); d.setMonth(d.getMonth() - 1);
    return ${d.getFullYear()}-;
  }

  async function loadBase(){
    if (__BASE) return __BASE;
    const v = window.__assetVersion ? ?v= : '';
    const res = await fetch(BASE_PATH + v, { cache: 'no-store' });
    __BASE = await res.json();
    return __BASE;
  }

  // Buscar tramo por antigüedad (inclusive)
  function findTramo(base, antigAnios){
    const a = Math.max(0, Math.floor(Number(antigAnios||0)));
    const arr = Array.isArray(base?.tramos) ? base.tramos : [];
    return arr.find(t => a >= Number(t?.desde ?? -1) && a <= Number(t?.hasta ?? 999)) || null;
  }

  // Devuelve importe mensual (30d) escalado al mes solicitado
  async function mensualEscalado({ month, tipo, antigAnios }){
    const base = await loadBase();
    const tramo = findTramo(base, antigAnios);
    if (!tramo || !tramo.importes) return 0;

    const key = String(tipo || 'CARGOS').toUpperCase(); // 'CARGOS'|'HCNM'|'HCNS'
    const mensualBase = Number(tramo.importes[key] || 0);

    // Soportar tanto "mes" como "baselineMonth" en el JSON base
    const ymBase = base.mes || base.baselineMonth || '2024-01';
    const idxBase = getIdx(ymBase);
    const idxMes  = getIdx(month);

    if (!mensualBase || !idxBase || !idxMes) return 0;
    return Math.round((mensualBase * (idxMes / idxBase)) * 100) / 100;
  }

  // === API pública ===
  async function getImporte({ ym, tipo='CARGOS', horas=1, dias=0, antigAnios=0 }){
    if (!ym) return 0;
    const mensual = await mensualEscalado({ month: ym, tipo, antigAnios });
    const mensualAjustado = (tipo === 'HCNM' || tipo === 'HCNS') ? (mensual * Number(horas||1)) : mensual;
    return Math.round(((mensualAjustado / 30) * Number(dias||0)) * 100) / 100;
  }

  async function getImportePrev({ ym, tipo='CARGOS', horas=1, dias=0, antigAnios=0 }){
    const prev = prevYM(ym);
    if (!prev) return 0;
    const mensualPrev = await mensualEscalado({ month: prev, tipo, antigAnios });
    const mensualAjustado = (tipo === 'HCNM' || tipo === 'HCNS') ? (mensualPrev * Number(horas||1)) : mensualPrev;
    return Math.round(((mensualAjustado / 30) * Number(dias||0)) * 100) / 100;
  }

  async function ensureLoaded(){ await loadBase(); return true; }

  window.CODIGOS.E66 = { ensureLoaded, getImporte, getImportePrev };
})();
