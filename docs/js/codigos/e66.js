// js/codigos/e66.js
(function () {
  const MOD = {};
  const INDICES_URL = 'data/indices.json';
  const BASE_URL    = 'data/codigos/E66.base.json'; // Ene-2024

  // Cache
  let indicesMap = null;      // { "YYYY-MM": number }
  let baseData   = null;      // { mes/baselineMonth, tramos:[{desde,hasta,importes:{...}}] }
  let baseYM     = '2024-01'; // mes base
  let baseIndex  = null;      // índice(2024-01)

  // Utils
  const prevYM = k => {
    let [y, m] = k.split('-').map(Number);
    m -= 1; if (m === 0) { y -= 1; m = 12; }
    return `${y}-${String(m).padStart(2,'0')}`;
  };
  async function loadJSON(url){
    const v = window.__assetVersion ? `?v=${window.__assetVersion}` : '';
    const r = await fetch(url + v, { cache: 'no-store' });
    if (!r.ok) throw new Error('No se pudo cargar: ' + url);
    return r.json();
  }
  async function ensureIndices(){
    if (indicesMap) return;
    const j = await loadJSON(INDICES_URL);
    indicesMap = j.indices || j; // soporta {indices:{...}} o {...}
  }
  async function ensureBase(){
    if (baseData) return;
    baseData = await loadJSON(BASE_URL);
    baseYM = baseData.baselineMonth || baseData.mes || baseYM;
    await ensureIndices();
    baseIndex = Number(indicesMap[baseYM]);
    if (!Number.isFinite(baseIndex)) throw new Error('Índice base no disponible para ' + baseYM);
  }

  // Selecciona tramo por antigüedad y devuelve el importe base (30 días) de Ene-2024
  function getBaseValorE66({ tipo, horas, antigAnios }) {
    if (!baseData || !Array.isArray(baseData.tramos)) return 0;
    const a = Number(antigAnios) || 0;
    const tramo = baseData.tramos.find(tr => a >= Number(tr.desde) && a <= Number(tr.hasta));
    if (!tramo || !tramo.importes) return 0;
    let base30 = Number(tramo.importes[tipo]) || 0;
    // Si alguna modalidad por hora necesitara factor, aplicarlo aquí.
    return base30;
  }

  function calcEscalado({ ym, dias, tipo, horas, antigAnios, usarMesAnterior }) {
    const d = Number(dias) || 0;
    if (d <= 0) return 0;

    const refYM  = usarMesAnterior ? prevYM(ym) : ym;
    const idxRef = Number(indicesMap[refYM]);
    if (!Number.isFinite(idxRef) || !Number.isFinite(baseIndex) || baseIndex <= 0) return 0;

    const base30 = getBaseValorE66({ tipo, horas, antigAnios }); // Ene-2024
    if (!Number.isFinite(base30) || base30 <= 0) return 0;

    const factor  = idxRef / baseIndex;      // variación índice vs Ene-2024
    const prorr   = (base30 / 30) * d;       // prorrateo por días
    return prorr * factor;
  }

  MOD.ensureLoaded = async function (ym) {
    await ensureIndices();
    await ensureBase();
  };

  // E66 (índice del mes seleccionado)
  MOD.getImporte = function ({ ym, tipo, horas, dias, antigAnios }) {
    try { return calcEscalado({ ym, dias, tipo, horas, antigAnios, usarMesAnterior:false }); }
    catch { return 0; }
  };

  // F66 (índice del mes anterior)
  MOD.getImportePrev = function ({ ym, tipo, horas, dias, antigAnios }) {
    try { return calcEscalado({ ym, dias, tipo, horas, antigAnios, usarMesAnterior:true }); }
    catch { return 0; }
  };

  window.CODIGOS = window.CODIGOS || {};
  window.CODIGOS.E66 = MOD;
})();
