# ADR-0002: Índice provincial mensual (valor punto)

**Fecha: 2025-10-10**
**Estado: Aprobado**
**Autor: Miguel Moll**

---

## Contexto

Para la liquidación docente en colegios privados de San Juan, la base es el valor del índice provincial (valor punto) definido mensualmente. Este valor es provisto internamente (fuente oficial) y debe quedar versionado por período para asegurar trazabilidad y auditoría. 

Nota de negocio: algunas liquidaciones utilizan el índice del mes anterior con ajuste (p.ej., IPC). Esa regla se documentará en un ADR aparte (ADR-0003) y no afecta al modelo de datos definido aquí. 

## Decisión

- Versionar el índice por período (AAAA-MM) en archivos separados.

- Mantener un registro de períodos con available[] y default.

- Proveer un script en tools/ para cargas masivas y mantener el registry.

- Validación opcional con JSON Schema. 


## Estructura de datos

data/
  periods/
    index.json               ← registro de períodos (available[], default)
    AAAA-MM/
      indice.json            ← valor punto del mes
data/schemas/
  indice.schema.json         ← (opcional) schema de indice.json
tools/
  generar_indices.mjs        ← script para cargas masivas y actualización del registry


*data/periods/AAAA-MM/indice.json (ejemplo 2025-10)*
{
  "_meta": {
    "periodo": "2025-10",
    "fuente": "Provincia de San Juan",
    "actualizado": "2025-10-10",
    "norma": ""
  },
  "valor_indice": 1234.56
}


*data/periods/index.json (ejemplo)*
{
  "_meta": {
    "actualizado": "2025-10-10",
    "descripcion": "Registro de períodos disponibles para datos de liquidación"
  },
  "available": ["2024-01", "2024-02", "...", "2025-10"],
  "default": "2025-10"
}


## Proceso operativo
**Alta manual de un nuevo mes**
- Crear carpeta: data/periods/AAAA-MM/.
- Crear indice.json (plantilla de arriba) con "_meta.periodo" = "AAAA-MM" y valor_indice numérico.
- Agregar "AAAA-MM" a available en data/periods/index.json.
- Default: “el default siempre apunta al último mes vigente publicado”.

*Verificar en la consola del navegador:*

await getValorIndice('AAAA-MM'); // debe devolver número


**Carga masiva / actualización por lotes (script)**

Script: tools/
          generar_indices.mjs

*Ejecución (desde la raíz del proyecto):*

node tools/generar_indices.mjs


## Comportamiento:

Crea/actualiza data/periods/AAAA-MM/indice.json para los períodos del objeto VALORES.

Fusiona data/periods/index.json: conserva existentes, añade nuevos, ordena y respeta el default actual.


## Reglas de integridad
- El nombre de carpeta AAAA-MM debe coincidir con "_meta.periodo".
- valor_indice es numérico. Formato del número (punto decimal, sin miles) y precisión (p.ej., hasta 4 decimales).
- data/periods/index.json:
- available[] lista solo meses existentes como carpeta.
- default apunta a un mes existente.

**En caso de error de lectura:**

- verificar existencia de data/periods/AAAA-MM/indice.json,

- coincidencia de "_meta.periodo",

- número válido en valor_indice.

## Consecuencias

- Auditabilidad: cada liquidación referencia un período inequívoco.

- Escalabilidad: permite sumar otros catálogos por mes (nomenclador, multiplicadores, topes) manteniendo el mismo patrón.

- Despliegue: diffs pequeños por período; rollback granular. 


## Riesgos / Mitigaciones

- Desfase de datos (mes listado sin archivo): el loader falla de forma controlada; revisar registry.
- Errores de formato: activar validación con data/schemas/indice.schema.json en CI. 
- Desalineación registry vs carpetas” como check de CI (lo resolves con una validación automática simple).

### Seguimiento

- ADR-0003: Regla de selección de índice (p.ej., “mes anterior + IPC”).

- ADR-0004: Validación automática en CI de indice.json contra indice.schema.json. 

- ADR-0002-indice-provincial

- Definition of Done

- Períodos requeridos existentes bajo data/periods/.

- index.json con available[] completo y default correcto.

- getValorIndice('AAAA-MM') devuelve el valor esperado en al menos 3 meses al azar.