# Evolución del dashboard: navegación y reportes HTML

> **Demostración pública y sintética.** Todos los nombres, cifras, agrupaciones y registros son ficticios. Las demos reproducen la estructura general y los patrones de interacción de la solución, pero fueron reconstruidas sin utilizar datos ni código visual del entorno productivo.

Este dashboard permite consultar el avance de un programa interno de capacitación y hacer el seguimiento individual de cada capacitador. Es la continuación del [caso de seguimiento de coloquios](../), cuya primera etapa reemplazó un proceso basado en Excel y Power Query por una base SQLite y un dashboard en Streamlit.

Esta actualización se concentró en dos problemas que aparecieron con el uso: la dificultad para navegar un dashboard que había acumulado demasiado contenido y la preparación manual de los reportes semanales.

## El problema: demasiado contenido en cada pantalla

A medida que el dashboard creció, sus pantallas incorporaron más indicadores, tablas, gráficos y mapas de calor. El contenido estaba dividido por títulos, pero seguía ubicado en una única página extensa.

Para llegar a la información necesaria había que desplazarse demasiado. Además, no todas las visualizaciones eran relevantes para todas las personas que consultaban el tablero. Cuando se agregaba o modificaba un bloque, el resto del contenido cambiaba de posición y resultaba difícil volver a encontrarlo.

## La solución: pantallas y secciones

Opté por dividir la interfaz en dos niveles de navegación:

- Una **pantalla** es una opción principal del menú lateral, como `Resumen` o `Reportes`.
- Una **sección** es un bloque de análisis dentro de una pantalla, seleccionado mediante las pestañas ubicadas sobre el contenido.

Cada sección responde una pregunta concreta y muestra como máximo uno o dos gráficos o tablas relacionados. De esta manera, el usuario elige primero qué pantalla necesita y después qué análisis quiere consultar, sin recorrer todos los componentes del dashboard.

### Pantalla Resumen

La pantalla `Resumen` concentra los indicadores generales del programa. Sus secciones permiten cambiar entre distintos análisis sin cargar todos los gráficos uno debajo del otro.

![Pantalla Resumen y sus secciones](./assets/dashboard-resumen.png)

### Pantalla Reportes

La pantalla `Reportes` separa la generación de documentos del resto de los análisis. Allí se selecciona el período y se inicia la preparación de los reportes HTML.

![Pantalla para generar reportes HTML](./assets/dashboard-reportes.png)

## Reportes HTML semanales

El seguimiento semanal estaba a cargo de dos coordinadores y alcanzaba a cerca de 30 capacitadores. Para preparar la información se combinaban PNG y CSV descargados del dashboard, capturas de pantalla y archivos Excel con los pendientes de capacitación. El resultado podía distribuirse como un libro consolidado o como archivos individuales, y generalmente se concentraba en las capacitaciones prioritarias del trimestre.

La preparación de ese material demandaba aproximadamente una hora semanal entre ambos coordinadores. Para simplificarla, desarrollé dos reportes HTML autocontenidos, uno por coordinador. Cada archivo reúne el avance general del programa y permite consultar el avance y todos los pendientes de cada capacitador, con la posibilidad de filtrar los contenidos prioritarios.

Los reportes se abren localmente en un navegador y no requieren ingresar al dashboard ni instalar Python. La generación quedó automatizada; la revisión y el envío continúan siendo decisiones manuales.

## Demos navegables

- [Explorar el dashboard público](https://jminolli-e.github.io/case-studies/coloquios/actualizacion/demo/dashboard.html)
- [Abrir un reporte HTML de ejemplo](https://jminolli-e.github.io/case-studies/coloquios/actualizacion/demo/)

## Estado actual y próximo avance

La interfaz operativa continúa construida en Streamlit. Prioriza la utilidad diaria, la trazabilidad de la información y la aplicación consistente de las reglas de cálculo.

Ya existe una prueba inicial de migración a React y TypeScript. El próximo avance será convertirla en un frontend operativo con una experiencia visual más cuidada, utilizando Node.js como entorno de desarrollo y conservando las reglas ya validadas en la solución actual.

## Alcance y privacidad

La hora semanal corresponde a una estimación del tiempo que demandaba el proceso anterior; no representa una medición formal de ahorro posterior a la implementación.

Este caso excluye nombres de empresa, personas, ubicaciones, correos, rutas, métricas productivas y código fuente corporativo. Las demos y capturas utilizan datos ficticios y no fueron construidas a partir de una copia anonimizada de la base real.
