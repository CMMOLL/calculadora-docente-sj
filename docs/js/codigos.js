(function(){
  window.CODIGOS = window.CODIGOS || {};

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

  function calcE60Mensual(indice, antigAnios){
    const base0 = Math.round(Number(indice || 0) * 39 * 100) / 100;
    const factor = 1 + pctE60(antigAnios);
    return base0 * factor;
  }

  function calcE60Prorrateado(indice, dias, antigAnios){
    const imp30 = calcE60Mensual(indice, antigAnios);
    return Math.round((imp30 / 30 * Number(dias || 0)) * 100) / 100;
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

(function(){
  window.CODIGOS = window.CODIGOS || {};
  if (window.CODIGOS.E66) return; // idempotente

  let __E66_BASE = null;

  async function loadE66Base(){
    if (__E66_BASE) return __E66_BASE;
    try {
      const v = window.__assetVersion ? `?v=${window.__assetVersion}` : '';
      const res = await fetch('docs/data/codigos/E66.base.json' + v, { cache: 'no-store' });
      __E66_BASE = await res.json();
    } catch(e){
      __E66_BASE = { baselineMonth: '2024-01', CARGOS:[{clave:'default', mensual:0}], HCNM:[{clave:'default', mensual:0}], HCNS:[{clave:'default', mensual:0}], overrides:[] };
    }
    return __E66_BASE;
  }

  function matchBaseRecord(bucket, ctx){
    if (ctx.categoria || ctx.puntos){
      const byCat = bucket.find(r =>
        (ctx.categoria ? String(r.categoria) === String(ctx.categoria) : true) &&
        (ctx.puntos    ? Number(r.puntos)    === Number(ctx.puntos)    : true)
      );
      if (byCat) return byCat;
    }
    if (typeof ctx.antigAnios !== 'undefined'){
      const a = Math.max(0, Math.floor(Number(ctx.antigAnios||0)));
      const byTramo = bucket.find(r =>
        (typeof r.min !== 'undefined' && typeof r.max !== 'undefined') &&
        a >= Number(r.min) && a <= Number(r.max)
      );
      if (byTramo) return byTramo;
    }
    return bucket.find(r => r.clave === 'default') || null;
  }

  function aplicarOverrides(base, month, tipo, rec){
    if (!Array.isArray(base.overrides)) return rec;
    const o = base.overrides.find(x =>
      x && x.month === month && x.tipo === tipo &&
      ((rec?.clave && x.clave === rec.clave) || (!rec?.clave && !x.clave))
    );
    if (o) return { ...rec, mensual: Number(o.mensual||0) };
    return rec;
  }

  async function getE66MensualForMonth(ctx){
    const base = await loadE66Base();
    const bucket = base?.[ctx.tipo] || [];
    let rec = matchBaseRecord(bucket, ctx);
    if (!rec) return 0;

    rec = aplicarOverrides(base, ctx.month, ctx.tipo, rec);

    const mensualBase = Number(rec.mensual || 0);
    const idxBase = Number((window.getIndiceByMonth && window.getIndiceByMonth(base.baselineMonth)) || 0);
    const idxMes  = Number((window.getIndiceByMonth && window.getIndiceByMonth(ctx.month)) || 0);
    if (!mensualBase || !idxBase || !idxMes) return 0;

    return Math.round((mensualBase * (idxMes / idxBase)) * 100) / 100;
  }

  async function calcE66_F66(ctx){
    const mensualPrev = await getE66MensualForMonth({ ...ctx, month: ctx.monthPrev });
    const mensualAct  = await getE66MensualForMonth({ ...ctx, month: ctx.monthActual });

    const e66Base = Math.round(((mensualAct  / 30) * Number(ctx.diasBase||0)) * 100) / 100;
    const f66Exc  = Math.round(((mensualPrev / 30) * Number(ctx.diasExc ||0)) * 100) / 100;

    return { e66Base, f66Exc };
  }

  window.CODIGOS.E66 = {
    loadE66Base,
    getE66MensualForMonth,
    calcE66_F66
  };

  try {
    const el = document.getElementById('optE66');
    if (el && !el.__hookedE66) { el.addEventListener('change', () => (typeof update==='function') && update()); el.__hookedE66 = true; }
  } catch {}
})();
