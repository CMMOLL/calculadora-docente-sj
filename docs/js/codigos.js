(function(){
  window.CODIGOS = window.CODIGOS || {};

  const withVersion = (url) => {
    const v = window.__assetVersion ? `?v=${window.__assetVersion}` : '';
    return url + v;
  };

  function parseNumber(el) {
    const n = parseFloat((el?.value || '').toString().replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  async function safeFetchJson(url){
    try{
      const r = await fetch(url, { cache:'no-store' });
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }catch(e){
      console.warn('No se pudo cargar', url, e);
      return null;
    }
  }

  function calcularImporteDesdeTabla(tabla, { tipo, horas=1, dias=0, antigAnios=0 }){
    if(!tabla || !Array.isArray(tabla.tramos)) return 0;
    const tramo = tabla.tramos.find(t => antigAnios >= Number(t.desde) && antigAnios <= Number(t.hasta));
    if(!tramo) return 0;
    const base = Number(tramo.importes?.[tipo]) || 0;
    const factorHoras = (tipo === 'HCNM' || tipo === 'HCNS') ? Math.max(1, Number(horas)||1) : 1;
    const importe30 = base * factorHoras;        // importe por 30 días
    const prorrata  = (Number(dias)||0) / 30;
    return +(importe30 * prorrata).toFixed(2);
  }

  window.CODIGOS.E66 = {
    _vigente: null,
    _previa:  null,
    _loaded:  false,

    async ensureLoaded(){
      if(this._loaded) return true;
      const vigente = await safeFetchJson(withVersion('data/codigos/E66.json'));
      // previa es opcional
      const previa  = await safeFetchJson(withVersion('data/codigos/E66_prev.json'));
      this._vigente = vigente;
      this._previa  = previa; // puede ser null
      this._loaded  = !!vigente; // con vigente ya podemos trabajar
      return this._loaded;
    },

    /** Mes vigente */
    getImporte(params){
      // permitir uso sin await: si aún no cargó, devolver 0 y lanzar carga en background
      if(!this._loaded){ this.ensureLoaded(); return 0; }
      return calcularImporteDesdeTabla(this._vigente, params);
    },

    /** Mes anterior (para F66). Si no hay archivo previo: fallback por razón de índices */
    getImportePrev(params){
      if(!this._loaded){ this.ensureLoaded(); return 0; }

      if(this._previa){
        return calcularImporteDesdeTabla(this._previa, params);
      }

      // Fallback por ratio de índices
      const idx = parseNumber(document.getElementById('indiceMes'));
      const idxPrev = parseNumber(document.getElementById('indiceMesPrev'));
      if(!(idx > 0 && idxPrev > 0)) return 0;

      // calcular con vigente y ajustar por ratio
      const vigente = calcularImporteDesdeTabla(this._vigente, params);
      const ratio = idxPrev / idx;
      return +((vigente * ratio)).toFixed(2);
    }
  };
})();