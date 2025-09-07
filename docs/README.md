# Liquidación de Sueldos Docentes – SJ

Calculadora simple (HTML+CSS+JS) para estimar liquidaciones docentes con criterio **30/360**, desgloses por mes, **días de aguinaldo** y **décimas**.  
👉 **Versión en vivo:** https://cmmoll.github.io/Liquidacion-Sueldos-Docentes-SJ/

---

## ✨ Funcionalidades
- Cálculo por **30/360** con desgloses mensuales.
- **Décimas** visibles/ocultas según reglas (BAJA/SUPLENTE).
- Panel de **índices** y radio.
- UI limpia y responsive (layout 2/3 columnas).
- Datos externos en JSON (índices y horas cátedra).

---

## 📁 Estructura
```text
/
├─ .github/                 # Workflows / configuración de GitHub
├─ docs/                    # 🔸 Carpeta publicada por GitHub Pages (main/docs)
│  ├─ index.html            # App principal (home)
│  ├─ css/
│  │  └─ styles.css
│  ├─ images/
│  │  └─ favicon-*.png
│  ├─ data/
│  │  ├─ current.json
│  │  ├─ indices.json
│  │  └─ horas_catedra.json
│  └─ .nojekyll             # Desactiva Jekyll para Pages
└─ README.md                # Este archivo
