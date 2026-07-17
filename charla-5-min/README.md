# Charla 5 Min — Sistema de Seguimiento de Capacitaciones de Seguridad Industrial

## Resumen Ejecutivo

En la empresa donde trabajo existe un programa interno de seguridad industrial llamado **"Charla 5 Minutos"**: capacitaciones breves y obligatorias que el personal debe recibir periódicamente sobre riesgos específicos de su tarea (por ejemplo, uso de herramientas, trabajo en altura, manejo de cargas, protecciones eléctricas, etc.). No todo el personal necesita las mismas capacitaciones — depende de su perfil laboral (si es personal de campo/operativo o de oficina/administrativo) y de la unidad a la que pertenece dentro de la organización.

El programa es dictado por un grupo de personas del área de Seguridad Industrial a quienes en este documento voy a llamar **capacitadores**: son quienes recorren las distintas unidades y dictan estas charlas al personal a su cargo.

Diseñé y desarrollé de punta a punta la solución que hoy sostiene este programa: una **base de datos SQLite construida desde cero** (no existía ninguna base de datos antes) que centraliza y normaliza toda la información, y un **dashboard interactivo en Streamlit** que calcula y muestra en tiempo real quién necesita cada capacitación, quién ya la recibió, y cuánto falta.

Antes de este proyecto, todo esto se resolvía con un archivo Excel gigante alimentado por Power Query, sin base de datos real detrás, sin poder saber con certeza cuándo se había capacitado a alguien, y sin que ningún capacitador tuviera un listado formal y confiable de qué personas tenía a su cargo. El resultado de este proyecto fue reemplazar ese proceso informal por una fuente de datos confiable y auditable, y por una herramienta que le permite a cualquier capacitador o jefe de área responder en segundos preguntas que antes eran, directamente, imposibles de contestar con certeza.

## Contexto del Problema

### ¿Cómo se trabajaba antes de este proyecto?

Todo el seguimiento se hacía sobre un único archivo Excel, compuesto por tres solapas (personal operativo, personal administrativo, y una matriz de "qué capacitación necesita cada unidad organizativa"). Ese Excel no leía de una base de datos: se armaba con conexiones de **Power Query** que combinaban, mediante fórmulas, otros archivos Excel de origen. En los hechos, la "base de datos" del programa eran archivos planos pegoteados con fórmulas.

El flujo de trabajo de un capacitador era manual:

```mermaid
flowchart LR
    A["Archivos Excel<br/>de distintas áreas"] -->|"Power Query<br/>(fórmulas de combinación)"| B["Excel maestro<br/>3 solapas"]
    B --> C["El capacitador filtra<br/>su unidad a cargo"]
    C --> D["Revisa persona por persona<br/>un semáforo 🔴 / 🟢<br/>(formato condicional)"]
    D -.->|"¿Cuándo se dio<br/>esa capacitación?"| Q1(("❓ Sin dato"))
    D -.->|"¿Quién la dictó?"| Q2(("❓ Sin dato"))
    D -.->|"¿Es realmente todo mi<br/>universo de personas?"| Q3(("❓ Estimación"))
```

El capacitador filtraba manualmente la planilla por su unidad, y a partir de un semáforo rojo/verde (formato condicional de Excel) intentaba estimar si cada persona estaba o no capacitada. Ese semáforo no decía **cuándo** se había dictado la capacitación ni **quién** la había dictado — solo mostraba un estado aparente, sin ninguna trazabilidad real detrás.

### Limitaciones concretas que esto generaba

- **El universo de personas de cada capacitador era una estimación, no un dato certero.** No existía ninguna tabla que dijera formalmente "esta unidad organizativa está a cargo de tal capacitador". Cada capacitador sabía, de memoria y por experiencia, más o menos qué unidades le correspondían.
- **Cero trazabilidad histórica.** El semáforo mostraba un estado actual aparente, pero no había forma de auditar fecha ni responsable de cada capacitación dictada.
- **Errores de carga heredados y nunca corregidos.** Las fórmulas de Power Query arrastraban durante años nombres de capacitaciones mal tipeados, registros duplicados o inconsistentes, sin que nadie los hubiera detectado ni corregido.
- **Los jefes de área no tenían ninguna vista consolidada.** No podían ver el avance de una persona en particular, ni comparar el desempeño entre distintos capacitadores. Solo existía la planilla completa, que había que filtrar manualmente para sacar cualquier conclusión.
- **El sistema no escalaba.** Cualquier cambio en la estructura organizativa (una persona que cambiaba de unidad, una unidad que sumaba una capacitación nueva a su lista de necesidades) implicaba reconstruir a mano las conexiones de Power Query.

### Lo que se necesitaba

Una base de datos real y normalizada, que sirviera como única fuente de verdad, capaz de:

1. Definir formalmente qué universo de personas le corresponde a cada capacitador (no una estimación).
2. Registrar de forma auditable cada capacitación dictada: a quién, cuándo y por quién.
3. Calcular el porcentaje de avance de cumplimiento de forma reproducible, sin depender de fórmulas manuales.
4. Servir de base a una herramienta de consulta accesible para capacitadores, jefes de área y gestión.

## Objetivo de Negocio

- Reemplazar el proceso manual de Excel + Power Query por una base de datos relacional real, versionable y auditable.
- Darle a cada capacitador el universo exacto (nombre y apellido) de personas que debe capacitar, eliminando la estimación informal.
- Calcular el porcentaje de avance comparando, de forma consistente, personas con necesidad de capacitación contra personas efectivamente capacitadas en un período determinado.
- Construir un dashboard de autoservicio para que cada perfil de usuario (capacitador, jefe de área, gestión) resuelva sus propias consultas sin depender de un cruce manual de archivos.
- Detectar y corregir, durante el proceso de normalización, los errores de carga histórica que se habían acumulado durante años.

> **Sobre los indicadores de éxito:** al momento de este proyecto, la empresa no contaba con ninguna métrica confiable previa (lo que mostraba el Excel anterior no era trazable ni auditable). Por eso el criterio de éxito no fue "mejorar un número existente", sino **habilitar por primera vez la posibilidad de medir con confianza**: que cada capacitador supiera con nombre y apellido quién tiene pendiente, que el porcentaje de avance fuera reproducible, y que un jefe de área pudiera hacer seguimiento individual y comparar capacitadores — algo que antes no existía en ninguna forma.

## Arquitectura General

La solución se apoya en dos fuentes de información externas (las únicas que recibo de otras áreas): el histórico mensual de dónde está asignada cada persona dentro de la organización, y una tabla que clasifica a cada persona como operativa o administrativa. A partir de ahí, todo el resto del diseño — el esquema de la base de datos, las vistas, la matriz de necesidades por unidad y la asignación formal de capacitadores — es autoría propia.

```mermaid
flowchart TB
    subgraph Entrada["Fuentes de entrada (recibidas mensualmente)"]
        A1["Histórico de plantilla<br/>(unidad organizativa de cada persona, mes a mes)"]
        A2["Clasificación de personas<br/>(Operativo / Administrativo)"]
    end
    A1 --> DB[("Base de datos SQLite<br/>normalizada — diseño propio")]
    A2 --> DB
    DB --> V["Vistas SQL<br/>snapshot vigente de plantilla · universo por capacitador · SG-SST"]
    V --> L["Capa de acceso a datos<br/>(consultas + cache)"]
    L --> N["Capa de lógica de negocio<br/>(cálculo de universos y % de avance)"]
    N --> UI["Dashboard Streamlit<br/>5 vistas"]
    N --> R["Reportes exportables<br/>PNG / CSV"]
```

**Qué contiene la base de datos** que diseñé y construí:
- El histórico mensual de la estructura organizativa de cada persona.
- La clasificación de cada persona en un perfil (operativo, administrativo, o un caso especial fuera de esos dos universos).
- Una matriz de necesidades de capacitación por unidad organizativa (qué capacitaciones exige cada unidad).
- Una tabla de asignación formal de capacitadores por unidad organizativa — el dato que antes era solo "conocimiento tácito".
- El registro histórico, capacitación por capacitación, de cada evento dictado (fecha, persona, capacitador responsable).
- Vistas SQL que encapsulan las combinaciones de datos más usadas por el dashboard.

**El dashboard**, construido en Streamlit, se organiza en cinco vistas funcionales con filtros globales de fecha y componentes de indicadores reutilizables entre pestañas.

**La capa de reporting** genera exportaciones en PNG (tablas redibujadas con Matplotlib, pensadas para verse bien fuera del navegador, por ejemplo en una presentación) y en CSV.

## Tecnologías Utilizadas

| Tecnología | Propósito dentro del proyecto |
|---|---|
| Python | Lenguaje principal: acceso a datos, lógica de negocio e interfaz. |
| SQLite | Motor de base de datos relacional embebido; almacena y normaliza toda la información histórica. |
| Streamlit | Framework para construir el dashboard interactivo sin desarrollar un frontend desde cero. |
| Pandas | Transformación y agregación de los datos leídos desde SQL antes de graficarlos. |
| Plotly | Visualizaciones interactivas dentro del dashboard (barras, series temporales, mapas de calor). |
| Matplotlib | Generación de tablas exportables en PNG para reportes fuera del dashboard. |
| NumPy | Cálculos numéricos de soporte en el procesamiento de datos. |

## Principales Desafíos

```mermaid
flowchart LR
    D1["🗂️ No existía ninguna<br/>base de datos previa"] --> S1["Diseñar el modelo de datos<br/>completo desde cero"]
    D2["🧹 Errores de carga<br/>arrastrados por años"] --> S2["Proceso de staging:<br/>separar registros válidos<br/>de los dudosos, para auditar"]
    D3["👤 'Quién capacita a quién'<br/>era conocimiento informal"] --> S3["Tabla formal de asignación<br/>capacitador ↔ unidad organizativa"]
    D4["📅 Las personas cambian de<br/>unidad y de perfil en el tiempo"] --> S4["El universo de necesidad se<br/>reconstruye, no es un dato fijo"]
    D5["⚡ Alto volumen de datos<br/>y filtros interactivos en vivo"] --> S5["Cache: separar el cálculo<br/>pesado del liviano"]
```

- **No existía ninguna base de datos previa:** tuve que definir desde cero qué tablas necesitaba, cuáles debían ser históricas (con snapshot mensual) y cuáles de catálogo/clasificación, y cómo relacionarlas de forma consistente. No había ningún esquema previo del que partir.
- **Errores de carga históricos:** al migrar la información desde los archivos de origen aparecieron inconsistencias invisibles hasta ese momento — nombres de capacitación con variaciones de tipeo, registros duplicados, datos que no coincidían con el catálogo oficial. Construí un proceso de validación que separa los registros válidos de los que no cumplen el formato esperado, para poder revisarlos antes de incorporarlos a la base definitiva.
- **Formalizar "quién capacita a quién":** no existía ninguna tabla que asignara explícitamente qué capacitador era responsable de qué unidad organizativa (y por lo tanto, de qué personas). Tuve que relevar esa información y modelarla como una tabla propia, para que dejara de ser un dato informal en la cabeza de cada capacitador y pasara a ser algo consultable por cualquier usuario del sistema.
- **Calcular avance con datos que cambian en el tiempo:** las personas cambian de unidad organizativa y hasta de perfil (operativo/administrativo) mes a mes, y la necesidad de capacitación depende de esa unidad. Tuve que resolver cómo calcular, para cualquier rango de fechas, un universo de "necesidad" consistente, sin mezclar el estado actual de una persona con su estado histórico en el momento de cada capacitación.
- **Rendimiento sobre un volumen de datos considerable:** el histórico de capacitaciones y el histórico de plantilla acumulan decenas de miles de registros. Filtrar por fecha, unidad y capacitador en cada interacción del dashboard de forma ingenua hubiese sido lento. La solución fue separar el cálculo pesado (determinar qué universo de personas corresponde a cada capacitación, que cambia poco) del cálculo liviano (contar cuántas de esas personas se capacitaron en el rango de fechas elegido, que cambia todo el tiempo), cacheando el primero y dejando el segundo como una consulta simple.

## Solución Implementada

### Las cinco vistas del dashboard

```mermaid
flowchart TD
    APP["Dashboard Charla 5 Min"] --> T1["📊 Resumen<br/>Ejecutivo"]
    APP --> T2["👤 Por<br/>Capacitador"]
    APP --> T3["🔍 Por Persona<br/>/ Unidad"]
    APP --> T4["🗺️ Avance por<br/>Capacitador"]
    APP --> T5["📋 SG-SST"]

    T1 --- T1d["Necesidad vs. cumplimiento<br/>por capacitación · export a PNG"]
    T2 --- T2d["Charlas dictadas · evolución<br/>mensual · distribución por tipo<br/>(vista propia de cada capacitador)"]
    T3 --- T3d["Historial individual de una<br/>persona o unidad · export CSV"]
    T4 --- T4d["Mapa de calor por unidad<br/>+ listado de pendientes,<br/>nombre y apellido"]
    T5 --- T5d["Cobertura de un sistema de<br/>gestión de seguridad y salud<br/>ocupacional (independiente<br/>de la obligación formal)"]
```

- **Resumen ejecutivo:** vista general del programa completo — cuántas personas (operativas y administrativas) necesitan capacitación, cuántas ya la recibieron, comparación por capacitación con distinción visual de las consideradas prioritarias, y exportación de reportes en PNG para presentaciones.
- **Vista por capacitador:** pensada para que cada capacitador haga seguimiento de su propia gestión — cantidad de charlas dictadas, personas únicas capacitadas, evolución mensual y distribución por tipo de capacitación.
- **Vista por persona / unidad:** consulta puntual del historial de capacitaciones de un individuo o de una unidad completa, con exportación a CSV.
- **Avance por capacitador:** cruza el universo formal de personas a cargo de cada capacitador (ahora un dato real, no una estimación) contra las capacitaciones prioritarias, mostrando un mapa de calor por unidad y el listado concreto de quién falta capacitar.
- **SG-SST:** identifica quién recibió al menos una capacitación asociada a un sistema de gestión de seguridad y salud ocupacional, sin depender de que exista una obligación formal registrada para esa persona.

Todas las vistas comparten un filtro global de rango de fechas y componentes de tarjetas de indicadores reutilizables, para mantener consistencia visual y de comportamiento en toda la aplicación.

### Cómo se calcula el porcentaje de avance

La fórmula en sí es simple, pero lo que hay detrás de cada uno de sus dos términos no lo es:

```mermaid
flowchart LR
    P["Perfil de la persona<br/>(Operativo / Administrativo)"] --> U["Universo de necesidad<br/>(quién debería estar capacitado)"]
    O["Unidad organizativa vigente<br/>de esa persona"] --> U
    M["Matriz de necesidades<br/>por unidad organizativa"] --> U
    U -->|"se recalcula poco:<br/>se cachea"| C{"Cálculo de avance"}
    F["Rango de fechas elegido<br/>por el usuario en el dashboard"] -->|"consulta liviana,<br/>se recalcula todo el tiempo"| C
    C --> PCT["% Avance =<br/>Personas Capacitadas / Personas con Necesidad × 100"]
```

El **universo de necesidad** (quién debería estar capacitado) se reconstruye combinando el perfil de la persona, su unidad organizativa vigente y la matriz de necesidades por unidad. Es un cálculo relativamente estable en el tiempo, así que se cachea. El **conteo de personas capacitadas**, en cambio, depende directamente del rango de fechas que el usuario elige en el dashboard, así que se resuelve como una consulta liviana que se recalcula al vuelo. Separar estos dos cálculos es lo que permite que mover el filtro de fechas en el dashboard sea instantáneo, en vez de tener que recalcular desde cero quién pertenece a cada universo cada vez.

**Otros indicadores generados:** evolución mensual de charlas dictadas, mapa de calor de unidad organizativa × capacitación, listado de personas pendientes por capacitador con el detalle de qué les falta específicamente, y cobertura del submódulo SG-SST.

**Automatizaciones incorporadas:** cálculo del universo de necesidad cacheado y refrescado periódicamente sin intervención manual, clasificación automática de capacitaciones como "prioritarias", y generación automática de reportes descargables en PNG a partir de las tablas mostradas en pantalla (sin captura de pantalla manual).

## Resultados Obtenidos

> Como se mencionó antes, la empresa no contaba con ningún proceso de medición confiable previo al proyecto, por lo que no existe una línea de base numérica válida contra la cual comparar. Los indicadores que arrojaba el Excel anterior no eran trazables ni auditables, así que cualquier comparación porcentual "antes vs. después" sería engañosa. El foco de esta primera etapa estuvo puesto en poder reflejar correctamente la situación real por primera vez, no en demostrar una mejora sobre una métrica previa que, en los hechos, no existía.

- **Beneficio operativo:** cada capacitador dejó de trabajar con una estimación informal de su universo a cargo — ahora tiene, con nombre y apellido, exactamente quién debe capacitarse y quién está pendiente.
- **Beneficio de gestión:** los jefes de área pueden, por primera vez, hacer seguimiento individual del avance de una persona puntual y comparar el desempeño entre distintos capacitadores — algo que antes no existía en ninguna forma.
- **Beneficio analítico:** el proceso de normalización permitió detectar rápidamente errores de carga (nombres de capacitación mal cargados u otras inconsistencias) que antes pasaban inadvertidos dentro de las fórmulas del Excel, y habilitó el cálculo reproducible de un porcentaje de avance real.

## Lecciones Aprendidas

| Tipo | Aprendizaje |
|---|---|
| Técnica | Separar el cálculo estable (universo de necesidad) del cálculo variable (conteo por fecha) fue la decisión de diseño que más impactó en la performance del dashboard. |
| Técnica | Normalizar años de datos acumulados sin un proceso de validación previo requiere un mecanismo de staging desde el principio, en vez de descartar o forzar lo dudoso. |
| Funcional | Formalizar en una tabla algo que antes era "conocimiento tácito" de cada capacitador (qué unidades tiene a cargo) tuvo más impacto percibido que cualquier gráfico del dashboard. |
| Funcional | Cuando no existe una métrica previa confiable, el objetivo de un proyecto de datos no puede ser "demostrar una mejora": tiene que ser "establecer una medición correcta por primera vez". |
| Gestión | Construir la base de datos y el dashboard en solitario dio consistencia de criterio en todas las reglas de negocio, pero también concentró todo el conocimiento del sistema en una sola persona — un riesgo a tener en cuenta hacia adelante. |

## Capturas

![Dashboard - Resumen ejecutivo](assets/dashboard-resumen.png)

![Dashboard - Avance por unidad organizativa](assets/dashboard-mapa-calor.png)

*(Reemplazar por las capturas reales, recortadas o difuminadas para no exponer el nombre de la empresa.)*

## Próximos Pasos

- [ ] Modularizar la interfaz del dashboard, separándola de la orquestación de datos.
- [ ] Generar el diagrama completo de dependencias entre vistas SQL y funciones de carga.
- [ ] Terminar de documentar la tabla de asignación de capacitadores por unidad organizativa.
- [ ] Una vez consolidada la situación actual, incorporar métricas de trazabilidad histórica (por ejemplo, tiempos de resolución de pendientes) ahora que existe una fuente de datos confiable sobre la cual construirlas.

## Disclaimer

Este caso de estudio describe conceptos, metodologías y decisiones técnicas aplicadas en un entorno corporativo.
No se incluyen datos reales, información confidencial, propiedad intelectual ni detalles sensibles de la organización donde fue desarrollado.
