// scripts/generar_indices.mjs
// Uso: node scripts/generar_indices.mjs
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PERIODS_DIR = path.join(ROOT, 'data', 'periods');
const REGISTRY_PATH = path.join(PERIODS_DIR, 'index.json');

// 👉 Tus valores oficiales (Ene-2024 .. Jul-2025)
const VALORES = {
  "2024-01": 315.298,
  "2024-02": 362.5927,
  "2024-03": 416.1934,
  "2024-04": 450.876,
  "2024-05": 482.4059,
  "2024-06": 513.9357,
  "2024-07": 544.7719,
  "2024-08": 572.0105,
  "2024-09": 600.611,
  "2024-10": 621.6324,
  "2024-11": 638.4165,
  "2024-12": 653.7385,
  "2025-01": 671.3894,
  "2025-02": 686.16,
  "2025-03": 702.6278,
  "2025-04": 728.652,
  "2025-05": 749.0265,
  "2025-06": 760.2619,
  "2025-07": 772.4261
};

function indiceJson(periodo, valor) {
  const [yyyy, mm] = periodo.split('-');
  return {
    _meta: {
      periodo,
      fuente: "Provincia de San Juan",
      actualizado: `${yyyy}-${mm}-01`,
      norma: ""
    },
    valor_indice: Number(valor)
  };
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function writeJSON(filePath, obj) {
  const pretty = JSON.stringify(obj, null, 2);
  await fs.writeFile(filePath, pretty + '\n', 'utf-8');
}

async function main() {
  // 1) Crear/actualizar carpetas y archivos por período
  const periods = Object.keys(VALORES).sort(); // orden cronológico
  for (const periodo of periods) {
    const dir = path.join(PERIODS_DIR, periodo);
    await ensureDir(dir);
    const jsonPath = path.join(dir, 'indice.json');
    const data = indiceJson(periodo, VALORES[periodo]);
    await writeJSON(jsonPath, data);
    console.log('✓ escrito', path.relative(ROOT, jsonPath));
  }

  // 2) Fusionar/crear registry index.json
  let registry = { _meta: {}, available: [], default: '2025-10' }; // mantenemos default actual
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf-8');
    const cur = JSON.parse(raw);
    registry = { ...registry, ...cur };
  } catch {
    // no existe, lo creamos desde cero
  }

  // Unimos y ordenamos disponibles sin duplicados
  const merged = new Set([...(registry.available || []), ...periods]);
  registry.available = Array.from(merged).sort();
  registry._meta = {
    actualizado: new Date().toISOString().slice(0,10),
    descripcion: "Registro de períodos disponibles para datos de liquidación"
  };

  await writeJSON(REGISTRY_PATH, registry);
  console.log('✓ actualizado', path.relative(ROOT, REGISTRY_PATH));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
