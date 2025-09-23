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
})();


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


