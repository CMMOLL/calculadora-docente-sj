# ADR-0002: Índice provincial mensual (valor punto)

**Fecha:** 2025-10-10  
**Estado:** Aprobado  
**Autor:** Miguel Moll

## Contexto
Para la liquidación docente en privados de San Juan, la base es el **valor del índice provincial (valor punto)** definido mensualmente. 
Generalmente se utiliza el índice del mes anterior, y se suma el % de incremento del IPC mensual (Inflación Mensual).

Este valor lo provee Miguel y es la única fuente de verdad en esta etapa.

## Decisión
- Mantener un archivo **por período** con el **valor del índice**.
- Validar el archivo con un **JSON Schema** simple.
- No se referencia ARCA ni fuentes nacionales por ahora.

## Estructura de archivos
/data/
/schemas/
indice.schema.json
/periodos/AAAA-MM/
indice.json


## Reglas
- `indice.json` contiene **un solo número**: `valor_indice`.
- Si falta el período seleccionado, el sistema mostrará error controlado (sin fallback automático por ahora).
- Los demás catálogos (nomenclador, multiplicadores, etc.) NO cambian en este ADR.

## Ejemplo (2025-10)
/data/periodos/2025-10/indice.json
```json
{
  "_meta": {
    "periodo": "2025-10",
    "fuente": "Provincia de San Juan",
    "actualizado": "2025-10-10",
    "norma": ""
  },
  "valor_indice": 1234.56
}
