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
