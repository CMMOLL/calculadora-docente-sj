(function(){
  window.CODIGOS = window.CODIGOS || {};

  const withV = (url) => window.__assetVersion ? `${url}?v=${window.__assetVersion}` : url;

  async function fetchJson(url){
    try{
      const r = await fetch(url, { cache:'no-store' });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }catch(e){
      console.warn('E66 loader:', url, e);
      return null;
    }
  }

  function numFrom(el){
    const x = parseFloat((el?.value || '').toString().replace(',', '.'));
    return Number.isFinite(x) ? x : 0;
  }

  function calcDesdeTabla(tabla, { tipo, horas=1, dias=0, antigAnios=0 }){
    if(!tabla || !Array.isArray(tabla.tramos)) return 0;
    const t = tabla.tramos.find(x => antigAnios >= Number(x.desde) && antigAnios <= Number(x.hasta));
    if(!t) return 0;
    const base = Number(t.importes?.[tipo]) || 0;
    const factor = (tipo==='HCNM'||tipo==='HCNS') ? Math.max(1, Number(horas)||1) : 1;
    const imp30 = base * factor;                  // valor por 30 días
    return +((imp30/30) * (Number(dias)||0)).toFixed(2); // prorrata por días
  }

  function mesAnterior(ym){ // "2025-08" -> "2025-07"
    const [y,m] = ym.split('-').map(Number);
    const d = new Date(y, m-1, 1);
    d.setMonth(d.getMonth()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }

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

  window.CODIGOS.E66 = {
    _cache: new Map(),   // key: "YYYY-MM" -> { vigente, previa }
    _lastKey: null,

    /** Carga E66_{YYYY-MM}.json y su mes anterior (si existe) */
    async ensureLoaded(mesISO){
      const sel = document.getElementById('indicePeriodo');
      const ym = mesISO || (sel && sel.value) || null;
      if(!ym){ console.warn('E66: no se detectó período YYYY-MM'); return false; }
      if(this._cache.has(ym)){ this._lastKey = ym; return true; }

      const prev = mesAnterior(ym);
      const urlV = withV(`data/codigos/E66/E66_${ym}.json`);
      const urlP = withV(`data/codigos/E66/E66_${prev}.json`);

      const [vigente, previa] = await Promise.all([ fetchJson(urlV), fetchJson(urlP) ]);
      if(!vigente){ console.warn('E66 vigente no encontrado:', urlV); return false; }

      this._cache.set(ym, { vigente, previa });
      this._lastKey = ym;
      return true;
    },

    /** Importe mes vigente para 30 días (prorrateado por días) */
    getImporte(params){
      const key = this._lastKey || document.getElementById('indicePeriodo')?.value;
      const data = key ? this._cache.get(key) : null;
      if(!data){ this.ensureLoaded(); return 0; }
      return calcDesdeTabla(data.vigente, params);
    },

    /** Importe mes anterior (para F66). Si no hay archivo -> ratio índices */
    getImportePrev(params){
      const key = this._lastKey || document.getElementById('indicePeriodo')?.value;
      const data = key ? this._cache.get(key) : null;
      if(!data){ this.ensureLoaded(); return 0; }

      if(data.previa){
        return calcDesdeTabla(data.previa, params);
      }

      // Fallback por índices en UI
      const idx     = numFrom(document.getElementById('indiceMes'));
      const idxPrev = numFrom(document.getElementById('indiceMesPrev'));
      if(!(idx>0 && idxPrev>0)) return 0;

      const v = calcDesdeTabla(data.vigente, params);
      return +((v * (idxPrev/idx))).toFixed(2);
    }
  };
})();

