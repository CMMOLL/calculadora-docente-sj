# Calculadora Docente – Repo base

App de cálculo en un solo `index.html` (HTML+CSS+JS). Los parámetros variables están en `data/current.json`.
Un workflow mensual archiva `current.json` en `data/YYYY/MM.json` para mantener historial.

## Estructura
```
/
├── .github/workflows/archive-data.yml
├── data/
│   ├── current.json
│   ├── 2024/.gitkeep
│   └── 2025/.gitkeep
├── index.html
└── README.md
```

## Paso a paso (administrador)
1. **Editar** `data/current.json` con los valores del mes (índices, puntos, cargos).
2. **Commit + push** a `main`.
3. La página (si está en GitHub Pages o local) leerá `./data/current.json` cuando lo activemos en el código.
4. El día 1, el workflow copia `current.json` a `data/YYYY/MM.json`. También podés ejecutarlo manualmente en *Actions* > *Run workflow*.

> Nota: por ahora el `index.html` está **sin cambios** (no lee el JSON todavía). Se activa en el siguiente paso.
