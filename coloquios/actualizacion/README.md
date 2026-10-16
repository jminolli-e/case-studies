# Evolución del dashboard: navegación y reportes HTML

> **Demostración pública y sintética.** Todos los nombres, cifras, agrupaciones y registros son ficticios. Las demos reproducen la estructura general y los patrones de interacción de la solución, pero fueron reconstruidas sin utilizar datos ni código visual del entorno productivo.

Este dashboard permite consultar el avance de un programa interno de capacitación y revisar las personas y los contenidos pendientes asignados a cada capacitador. Es la continuación del [caso de seguimiento de coloquios](../), cuya primera etapa reemplazó un proceso basado en Excel y Power Query por una base SQLite y un dashboard en Streamlit.

Esta actualización resolvió dos problemas que aparecieron con el uso: la dificultad para navegar una interfaz que había acumulado demasiado contenido y la preparación manual de los reportes semanales.

**Probar las demos:**

- [Explorar el dashboard interactivo](https://jminolli-e.github.io/case-studies/coloquios/actualizacion/demo/dashboard.html)
- [Abrir un reporte HTML de ejemplo](https://jminolli-e.github.io/case-studies/coloquios/actualizacion/demo/)

## Antes y ahora

| Antes | Ahora |
|---|---|
| Pantallas extensas que requerían mucho desplazamiento. | Pantallas divididas en secciones orientadas a consultas concretas. |
| Gráficos, tablas y mapas de calor visibles al mismo tiempo. | Uno o dos elementos relacionados dentro de cada sección. |
| PNG, CSV, capturas y Excel preparados por separado. | Dos reportes HTML autocontenidos, uno por coordinador. |
| Seguimiento concentrado en las prioridades trimestrales. | Consulta del avance general y de todos los pendientes por capacitador. |

## El problema: demasiado contenido en cada pantalla

A medida que el dashboard creció, incorporó más indicadores, tablas, gráficos y mapas de calor. Aunque estaban separados por títulos, todos los componentes continuaban ubicados uno debajo del otro dentro de páginas extensas.

Para encontrar un análisis había que desplazarse demasiado. Además, no todas las visualizaciones eran relevantes para todas las consultas. Cuando se agregaba o modificaba un bloque, el resto cambiaba de posición y resultaba difícil volver a encontrar la información habitual.

## La solución: pantallas y secciones

Opté por dividir la interfaz en dos niveles de navegación:

- Una **pantalla** es una opción principal del menú lateral, como `Resumen` o `Reportes`.
- Una **sección** es un bloque de análisis dentro de una pantalla, seleccionado mediante las pestañas ubicadas sobre el contenido.

Cada sección responde una pregunta concreta y muestra como máximo uno o dos gráficos o tablas relacionados. Primero se elige la pantalla y después el análisis, sin recorrer todos los componentes del tablero.

### Pantalla Resumen

`Resumen` reúne los indicadores generales del programa. Sus pestañas permiten cambiar de sección sin cargar todos los análisis uno debajo del otro.

![Pantalla Resumen y sus secciones](./assets/dashboard-resumen.png)

*El menú lateral separa las pantallas principales; las pestañas ubicadas sobre la tabla permiten cambiar de sección.*

### Pantalla Reportes

`Reportes` separa la generación de documentos del resto de los análisis. Allí se selecciona el período y se inicia la preparación de los HTML.

![Pantalla para generar reportes HTML](./assets/dashboard-reportes.png)

*La generación semanal ocupa su propia pantalla y requiere únicamente seleccionar el período del reporte.*

## Reportes HTML semanales

El seguimiento estaba a cargo de dos coordinadores y alcanzaba a cerca de 30 capacitadores. Para preparar la información semanal se combinaban PNG y CSV descargados del dashboard, capturas de pantalla y archivos Excel con los pendientes. El resultado podía distribuirse como un libro consolidado o como archivos individuales y generalmente se concentraba en las capacitaciones prioritarias del trimestre.

La preparación demandaba aproximadamente una hora semanal entre ambos coordinadores. Para simplificarla, desarrollé dos reportes HTML autocontenidos, uno por coordinador. Cada documento reúne el avance general del programa y permite consultar el avance y todos los pendientes de cada capacitador, además de filtrar los contenidos prioritarios.

![Reporte HTML con el avance del programa](./assets/reporte-html.png)

*El documento integra los indicadores generales y el detalle por capacitador en un único archivo navegable.*

Los reportes se abren localmente en un navegador y no requieren ingresar al dashboard ni instalar Python. La generación quedó automatizada; la revisión y el envío continúan siendo decisiones manuales.

## Qué desarrollé

- Reorganicé la navegación y separé las vistas extensas en secciones específicas.
- Hice que cada sección renderice únicamente los componentes relacionados con la consulta elegida.
- Automaticé con Python la generación de los dos reportes HTML autocontenidos.
- Incorporé filtros y descarga CSV para consultar y distribuir los pendientes.

La reorganización redujo la cantidad de información presentada simultáneamente y convirtió un conjunto de archivos dispersos en un documento integrado por coordinador.

## Estado actual y próximo avance

La interfaz operativa continúa construida en Streamlit y prioriza la utilidad diaria, la trazabilidad y la aplicación consistente de las reglas de cálculo.

Ya existe una prueba inicial de migración a React y TypeScript. El próximo paso es convertirla progresivamente en el frontend operativo, utilizando el ecosistema de Node.js para desarrollar una experiencia visual más flexible sin perder las reglas validadas en la solución actual.

## Alcance y privacidad

La hora semanal corresponde a una estimación del tiempo que demandaba el proceso anterior; no representa una medición formal de ahorro posterior a la implementación.

Este caso excluye nombres de empresa, personas, ubicaciones, correos, rutas, métricas productivas y código fuente corporativo. Las demos y capturas utilizan datos ficticios y no fueron construidas a partir de una copia anonimizada de la base real.
