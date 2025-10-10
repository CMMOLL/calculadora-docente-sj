// ====================== Índice provincial (valor punto) ======================
// Modelo principal: data/periods/index.json + data/periods/AAAA-MM/indice.json
// Fallback (compatibilidad): data/indices.json con { valores: { "AAAA-MM": number } }

const PERIODS_REGISTRY_PATH = 'data/periods/index.json';
let __registry = null;
const __indiceCache = new Map(); // key: "AAAA-MM" -> number

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json();
}

async function loadRegistry() {
  if (__registry) return __registry;
  const data = await fetchJSON(PERIODS_REGISTRY_PATH);
  if (!data || !Array.isArray(data.available) || typeof data.default !== 'string') {
    throw new Error('index.json inválido: faltan "available" o "default"');
  }
  __registry = data;
  return data;
}

async function loadIndiceFromPeriods(periodo) {
  if (__indiceCache.has(periodo)) return __indiceCache.get(periodo);
  const obj = await fetchJSON(`data/periods/${periodo}/indice.json`);
  const valor = obj?.valor_indice;
  if (typeof valor !== 'number') {
    throw new Error(`indice.json inválido para ${periodo}: falta "valor_indice" numérico`);
  }
  __indiceCache.set(periodo, valor);
  return valor;
}

let __legacyIndices = null;
async function loadLegacyIndices() {
  if (__legacyIndices) return __legacyIndices;
  try {
    const data = await fetchJSON('data/indices.json'); // existente en tu repo
    if (!data?.valores || typeof data.valores !== 'object') {
      throw new Error('data/indices.json inválido: falta "valores"');
    }
    __legacyIndices = data.valores; // { "AAAA-MM": number }
  } catch {
    __legacyIndices = null;
  }
  return __legacyIndices;
}

/**
 * API estable (consumir siempre esta)
 * - Si no pasás periodo => usa el default del registry.
 * - Intenta leer formato nuevo; si no existe, cae al legacy.
 */
export async function getValorIndice(periodo) {
  const reg = await loadRegistry();
  const selected = periodo || reg.default;

  // 1) nuevo formato por períodos
  try {
    if (reg.available.includes(selected)) {
      return await loadIndiceFromPeriods(selected);
    }
  } catch (e) {
    console.warn('[indices] periods falló, intento legacy:', e.message);
  }

  // 2) fallback legacy
  const legacy = await loadLegacyIndices();
  if (legacy && typeof legacy[selected] === 'number') {
    return legacy[selected];
  }

  throw new Error(`No hay índice para ${selected} (periods/ y legacy fallaron)`);
}

// Helpers para UI / validaciones
export async function getPeriodosDisponibles() {
  const { available } = await loadRegistry();
  return available.slice();
}

export async function getPeriodoDefault() {
  const { default: def } = await loadRegistry();
  return def;
}
