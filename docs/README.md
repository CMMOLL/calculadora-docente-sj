# Objetivo del sistema (versión ejecutiva)

**Diseñar y desarrollar una plataforma web** que **automatice la liquidación de sueldos** de **docentes y no docentes** de colegios **privados de San Juan**, **cumpliendo** normativa **provincial y nacional**, **trazable y auditable**, con **datos parametrizables** (índices, convenios, topes, adicionales, aportes y contribuciones) y **capacidad de escalar** a **presentaciones oficiales** (exportes/archivos/reportes compatibles con las exigencias vigentes).

**Estado:** Propuesto
**Versión:** 1.0
**Última actualización:** 10-Oct-2025
**Propietario:** Miguel (Liquidación de Sueldos)
**Colaboración:** Dev / Contabilidad / Auditoría

---

## Problema que resuelve

* Procesos manuales, propensos a errores y lentos.
* Dificultad para seguir cambios normativos y aumentos por mes/categoría.
* Falta de trazabilidad, auditoría y formatos listos para presentar.

## Alcance funcional (MVP)

* **Modelado de cargos y horas** (docentes/no docentes; múltiples cargos por persona).
* **Motor de cálculo**: básicos, adicionales (antigüedad, radio/permanencia, E-códigos/A/F, SAC, licencias/prorrateos), descuentos legales, aportes y contribuciones.
* **Tablas parametrizables** por mes: índices, incrementos, nomencladores, multiplicadores, topes.
* **Gestión de novedades**: días, licencias, ausencias, diferencias de cargos, reconocimiento de servicios.
* **Liquidación mensual y recibo** (previsualización + PDF).
* **Auditoría**: desgloses y justificativos “cálculo a cálculo”.
* **Exportables**: planillas y archivos para carga externa (contabilidad, bancos, libros de sueldos digitales y/o presentaciones).
* **Usuarios/roles** (administrador, liquidación, auditor/contador, solo lectura).

## Fuera de alcance (MVP) – roadmap

* Portal de autogestión completo para empleados.
* Integraciones contables/ERP a medida (se dejan conectores genéricos/exportes).
* Motor tributario nacional completo (SICOSS/Libro Sueldo Digital AFIP) más allá de exportes compatibles iniciales.
* Notificaciones automáticas multicanal.

## Criterios de éxito (KPI)

* **Exactitud**: ≥99,5% de coincidencia con liquidaciones de referencia auditadas.
* **Tiempo**: reducción ≥60% del tiempo de armado por colegio vs. proceso manual actual.
* **Trazabilidad**: 100% de conceptos con explicación y fórmula visible.
* **Parametrización**: actualización mensual de índices y tablas sin tocar código.
* **Confiabilidad**: 0 caídas durante ventana de liquidación (picos de uso).
* **Cumplimiento**: validaciones contra topes/reglas claves antes de emitir recibos.

## Restricciones y supuestos

* **Normativa**: soportar normativa provincial San Juan + referencias nacionales aplicables y convenios de privados (docentes y no docentes).
* **Datos maestros**: nomencladores y tablas provienen de fuentes oficiales y se cargan mensualmente (JSON/CSV).
* **Auditoría**: cada cálculo debe quedar reproducible (mismo input ⇒ mismo output).
* **Privacidad**: datos personales bajo prácticas de seguridad y mínimos privilegios.
* **Escalabilidad**: preparada para múltiples colegios/plantas y períodos.

## Entregables de esta fase

1. **Documento de Objetivo y Éxito** (este doc).
2. **Mapa de conceptos** (catálogos: categorías, códigos A/E/F, adicionales, descuentos).
3. **Matriz de reglas** (qué se calcula, cómo, en qué orden, con ejemplos).
4. **Plan de datos** (formato y esquema para índices, nomencladores, incrementos, etc.).
5. **Plan de pruebas** (casos: maestro jornada simple, director, no docente, múltiples cargos, SAC, licencias, diferencias, etc.).

## Definition of Done (de esta etapa)

* Objetivo aprobado.
* KPI acordados.
* Lista de conceptos/reglas priorizada para el MVP.
* Esquemas de datos validados (ejemplo de archivos de un mes).
* Set mínimo de casos de prueba consensuado.

