# ADR-0001: Objetivo del sistema

**Fecha:** 2025-10-10  
**Estado:** Aprobado  
**Autor:** Miguel Moll (Liquidación de Sueldos)  
**Repositorio:** Liquidacion-Sueldos-Docentes-SJ

---

## Contexto
Se requiere una definición clara, trazable y auditable del objetivo del sistema de liquidación para colegios privados de San Juan, con alineación a normativa provincial y nacional, y con bases parametrizables que permitan escalar a presentaciones oficiales.

## Decisión
- Documentar el **objetivo ejecutivo** y sus **KPI** en `docs/01-objetivo.md` (referenciado desde `README.md`).
- Usar **ADR** como mecanismo estándar para registrar decisiones relevantes (arquitectura, datos, reglas de negocio, integraciones).
- Cualquier cambio en objetivo/KPI se gestionará por **Pull Request** con revisión técnica y contable.

## Alternativas consideradas
1. **Solo README principal:** simple pero sin trazabilidad de decisiones a lo largo del tiempo.  
2. **Gestión en issues sin ADR:** útil para discusión, pero pobre como fuente canónica y difícil de auditar.  
3. **ADR + README (Elegida):** equilibrio entre claridad pública y registro histórico de decisiones.

## Consecuencias
- Existe una **fuente de verdad** para el objetivo y su evolución.
- Cambios futuros quedarán **auditables** (PR + ADR actualizado/nuevo).
- Facilita **onboarding** y revisiones (contables, técnicas).

## Métricas/KPIs (resumen)
- Exactitud ≥ **99,5%** frente a liquidaciones de referencia auditadas.
- Reducción de tiempo de armado ≥ **60%** vs. proceso manual.
- **100%** de conceptos con fórmula y desglose visibles.
- Actualización **mensual** de índices/tablas **sin tocar código**.

## Fuera de alcance (por ahora)
- ARCA/integraciones externas; presentaciones oficiales automáticas; seguridad avanzada.
- Convertir KPIs en SMART (umbral + fecha + método de medición) y sumar KPI de performance (p.ej., “calcular 1 recibo < 150ms en cliente”).

## Riesgos & Mitigaciones
- Cambios normativos inesperados; 
- Fuentes de datos incompletas; 
- Controles de calidad de datos.

## Impacto en la hoja de ruta
- Próximos ADR sugeridos:
  - ADR-0002: Esquema de datos (índices, incrementos, nomencladores, multiplicadores, topes).
  - ADR-0003: Orden de cálculo y motor (básicos, A/E/F, licencias, SAC, descuentos, contribuciones).
  - ADR-0004: Estrategia de versionado mensual y compatibilidad hacia atrás.
  - ADR-0005: Formatos de exportación para presentaciones oficiales.

## Enlaces
- Documento del objetivo: `docs/01-objetivo.md`
- README del repositorio: `README.md`
