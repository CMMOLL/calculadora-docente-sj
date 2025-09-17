(function () {
  const E66_URL = 'data/codigos/E66.json';

  function buscaTramo(tramos, anios) {
    return tramos.find(t => anios >= t.desde && anios <= t.hasta) || null;
  }

  async function loadJSON(url) {
    const v = window.__assetVersion ? `?v=${window.__assetVersion}` : '';
    const res = await fetch(url + v, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar ' + url);
    return await res.json();
  }

  const CODIGOS = (window.CODIGOS = window.CODIGOS || {});
  CODIGOS.E66 = {
    _data: null,
    async init(){ try { this._data = await loadJSON(E66_URL); } catch(e){ console.warn('E66 no cargó', e); this._data=null; } },

    /** @param {{tipo:'CARGOS'|'HCNM'|'HCNS', horas?:number, dias:number, antigAnios:number}} p */
    getImporte({ tipo, horas=1, dias, antigAnios }) {
      if (!this._data || !Array.isArray(this._data.tramos)) return 0;
      const tramo = buscaTramo(this._data.tramos, antigAnios);
      if (!tramo || !tramo.importes || !tramo.importes[tipo]) return 0;

      const base30 = Number(tramo.importes[tipo]) || 0;      // CARGOS: por 30 días; HxC: por 1 hora en 30 días
      const ratio  = Math.max(0, Math.min(30, dias)) / 30;
      if (tipo === 'CARGOS') return base30 * ratio;
      const hs = Math.max(0, Number(horas) || 0);
      return base30 * hs * ratio;
    }
  };

  CODIGOS.E66.init();
})();
