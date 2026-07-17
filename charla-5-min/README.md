# Charla 5 Min

## Resumen Ejecutivo

Sistema de seguimiento de capacitaciones de seguridad industrial, desarrollado end-to-end: base de datos SQLite normalizada desde cero + dashboard interactivo en Streamlit.

| | Antes | Después |
|---|---|---|
| Fuente de datos | Excel + Power Query | Base de datos SQLite normalizada |
| Universo por inspector | Estimado, informal | Tabla formal, con nombre y apellido |
| Trazabilidad | Semáforo rojo/verde, sin fecha ni responsable | Registro histórico auditable |
| Consulta | Filtrar manualmente una planilla enorme | Dashboard de autoservicio, 5 vistas |
| Errores de carga | Invisibles, arrastrados por años | Detectados y auditados en el proceso de normalización |

## Contexto del Problema

```mermaid
flowchart LR
    A[Archivos Excel de origen] -->|Power Query| B[Excel maestro<br/>3 solapas]
    B --> C[Inspector filtra<br/>su organización]
    C --> D["Semáforo 🔴🟢<br/>formato condicional"]
    D -.->|"¿Cuándo se capacitó?"| E((❓))
    D -.->|"¿Quién dictó la charla?"| F((❓))
    D -.->|"¿Es todo el universo real?"| G((❓))
```

**Limitaciones clave:**
- Universo de cada inspector = estimación, no dato certero (no existía tabla de asignación).
- Sin fecha ni responsable por capacitación → cero trazabilidad.
- Errores de carga heredados nunca auditados (nombres mal tipeados, duplicados).
- Jefes sin vista consolidada individual ni comparativa entre inspectores.
- Cada cambio organizativo rompía las conexiones de Power Query.

**Necesidad:** una base de datos real como fuente única de verdad, con universos formales, registro auditable y cálculo reproducible de avance.

## Objetivo de Negocio

- Base de datos relacional real, versionable y auditable — reemplazando Excel + Power Query.
- Universo exacto (nombre y apellido) por inspector, sin estimaciones.
- Cálculo de avance reproducible: mismo resultado ante la misma consulta.
- Dashboard de autoservicio para inspectores, jefes y gestión.
- Detección y corrección de errores de carga histórica.

> Como no existía ninguna métrica previa confiable, el criterio de éxito no fue "mejorar un número" sino **habilitar la posibilidad de medir por primera vez**.

## Arquitectura General

```mermaid
flowchart TB
    subgraph Entrada
        A1[Histórico mensual<br/>de plantilla]
        A2[Clasificación de personas<br/>Operativo / Administrativo]
    end
    A1 --> DB[(Base de datos SQLite<br/>normalizada)]
    A2 --> DB
    DB --> V[Vistas SQL<br/>snapshot vigente · universo por inspector · SG-SST]
    V --> L[Capa de acceso a datos<br/>consultas + cache]
    L --> N[Capa de negocio<br/>cálculo de universos y % avance]
    N --> UI[Dashboard Streamlit<br/>5 vistas]
    N --> R[Reportes PNG / CSV]
```

**Componentes:**
- **Base de datos SQLite** — diseñada íntegramente por mí: histórico de plantilla, clasificación de personas, matriz de necesidades por unidad, asignación formal de inspectores, registro histórico de charlas, vistas de consumo.
- **Dashboard Streamlit** — 5 vistas funcionales, filtros globales, componentes de KPI reutilizables.
- **Capa de reporting** — exportación a PNG (tablas redibujadas con Matplotlib) y CSV.

Única entrada externa: el histórico mensual de plantilla y la tabla de clasificación de personas. Todo el resto del diseño (esquema, vistas, matriz de necesidades, asignación de responsables) es autoría propia.

## Tecnologías Utilizadas

| Tecnología | Propósito |
|---|---|
| Python | Backend, lógica de negocio e interfaz |
| SQLite | Base de datos relacional embebida |
| Streamlit | Dashboard interactivo |
| Pandas | Transformación y agregación de datos |
| Plotly | Visualizaciones interactivas |
| Matplotlib | Exportación de tablas a PNG |
| NumPy | Cálculos numéricos de soporte |

## Principales Desafíos

```mermaid
flowchart LR
    D1["🗂️ Sin base de datos<br/>previa"] --> S1["Diseñar el modelo<br/>de datos desde cero"]
    D2["🧹 Errores de carga<br/>heredados"] --> S2["Proceso de staging:<br/>válidos vs. a revisar"]
    D3["👤 'Quién capacita<br/>a quién' era tácito"] --> S3["Tabla formal de<br/>asignación por organización"]
    D4["📅 Personas cambian de<br/>organización en el tiempo"] --> S4["Universo de necesidad<br/>reconstruido, no fijo"]
    D5["⚡ Volumen de datos<br/>y filtros en vivo"] --> S5["Cache: separar cálculo<br/>pesado del liviano"]
```

## Solución Implementada

### Las 5 vistas del dashboard

```mermaid
flowchart TD
    APP["Dashboard"] --> T1["📊 Resumen<br/>ejecutivo"]
    APP --> T2["👤 Por<br/>Inspector"]
    APP --> T3["🔍 Por Persona<br/>/ Organización"]
    APP --> T4["🗺️ Avance por<br/>Inspector"]
    APP --> T5["📋 SG-SST"]

    T1 --- T1d["Necesidad vs. cumplimiento<br/>por capacitación · export PNG"]
    T2 --- T2d["Charlas dictadas · evolución<br/>mensual · distribución por tipo"]
    T3 --- T3d["Historial individual<br/>export CSV"]
    T4 --- T4d["Mapa de calor por organización<br/>pendientes nombre y apellido"]
    T5 --- T5d["Cobertura de un sistema de<br/>gestión de seg. y salud ocupacional"]
```

### Cómo se calcula el avance

```mermaid
flowchart LR
    P["Perfil de la persona<br/>Operativo / Administrativo"] --> U["Universo de necesidad"]
    O["Organización vigente"] --> U
    M["Matriz de necesidades<br/>por organización"] --> U
    U -->|"cacheado, cambia poco"| C{" "}
    F["Filtro de fecha<br/>elegido por el usuario"] -->|"consulta liviana"| C
    C --> PCT["% Avance =<br/>Capacitados / Necesidad × 100"]
```

Separar el universo (estable, se cachea) del conteo por fecha (variable, se recalcula al vuelo) es lo que hace que mover el filtro de fechas en el dashboard sea instantáneo.

**Otros indicadores:** evolución mensual de charlas dictadas, mapa de calor organización × capacitación, listado de pendientes por inspector, cobertura del submódulo SG-SST.

**Automatizaciones:** cálculo del universo cacheado y refrescado sin intervención manual, clasificación automática de capacitaciones prioritarias, generación de reportes PNG sin captura de pantalla manual.

## Resultados Obtenidos

> No existía una línea de base confiable previa (los indicadores del Excel anterior no eran trazables), así que el foco de esta primera etapa fue **reflejar la situación real por primera vez**, no demostrar una mejora porcentual sobre una métrica inexistente.

- 🎯 **Operativo:** inspectores con universo exacto (nombre y apellido) en vez de estimación.
- 📈 **Gestión:** jefes con seguimiento individual y comparación entre inspectores — antes imposible.
- 🔎 **Analítico:** errores de carga históricos detectados vía el proceso de normalización; % de avance ahora reproducible.

## Lecciones Aprendidas

| Tipo | Aprendizaje |
|---|---|
| Técnica | Separar cálculo estable (universo) de cálculo variable (fecha) fue la decisión de mayor impacto en performance. |
| Técnica | Normalizar años de datos sin validación previa requiere un mecanismo de staging, no descartar ni forzar lo dudoso. |
| Funcional | Formalizar en una tabla lo que era "conocimiento tácito" de cada inspector tuvo más impacto percibido que cualquier gráfico. |
| Funcional | Sin métrica previa confiable, el objetivo no es "mejorar un número" sino "medir correctamente por primera vez". |
| Gestión | Construirlo en solitario dio consistencia de criterio, pero concentró todo el conocimiento del sistema en una persona — riesgo a futuro. |

## Capturas

![Dashboard - Resumen ejecutivo](assets/dashboard-resumen.png)

![Dashboard - Avance por organización](assets/dashboard-mapa-calor.png)

*(Reemplazar por las capturas reales, recortadas/difuminadas para no exponer el nombre de la empresa.)*

## Próximos Pasos

- [ ] Modularizar la interfaz, separándola de la orquestación de datos.
- [ ] Diagrama completo de dependencias entre vistas SQL y funciones de carga.
- [ ] Documentar por completo la tabla de asignación de responsables por organización.
- [ ] Incorporar métricas de trazabilidad histórica una vez consolidada la situación actual.

## Disclaimer

Este caso de estudio describe conceptos, metodologías y decisiones técnicas aplicadas en un entorno corporativo.
No se incluyen datos reales, información confidencial, propiedad intelectual ni detalles sensibles de la organización donde fue desarrollado.
