# Evolución del dashboard: navegación y reportes HTML

> **Demostración pública y sintética.** Todos los nombres, cifras, agrupaciones y registros son ficticios. Las demos reproducen la estructura general y los patrones de interacción de la solución, pero fueron reconstruidas sin utilizar datos ni código visual del entorno productivo.

## Contexto del proyecto

Un **coloquio** es una instancia breve de capacitación sobre un contenido de seguridad. No todas las personas necesitan completar los mismos contenidos: la necesidad depende de él puesto, las tareas que hacen y el departamento al que pertenecen. Algunos contenidos se definen como prioritarios para concentrar el seguimiento durante una etapa del año.

El panel permite comparar esas necesidades con las capacitaciones registradas. De esa comparación surge el porcentaje de avance del programa, el detalle de las personas que todavía tienen contenidos pendientes y revisar ,hacer seguimiento de la cantidad y avance de las actividades realizadas por cada capacitador.

Entre resumen el panel permite:
- Cantidad de personas que requieren cada capacitación.
- Personas capacitadas, pendientes y porcentaje de avance.
- Comparaciones por capacitación, gerencia, zona, organización y reparto.
- Seguimiento de capacitaciones prioritarias.
- Actividad histórica de capacitadores.
- Evolución mensual de las capacitaciones realizadas.
- Situación particular de una persona mediante su número de identificación interno.
- Detalle nominal de personas que todavía tienen capacitaciones pendientes.
- Cobertura y cumplimiento de capacitaciones obligatorias de SG-SST.

En este caso utilizo dos términos que conviene distinguir:

- **Capacitador responsable:** tiene asignado un universo de personas y contenidos sobre el que debe hacer dictar a ese universo de personas.
- **Capacitador que dictó:** es quien figura en el registro de una capacitación realizada. Puede coincidir o no con el responsable del universo. Es decir, Juancito esta a cargo de capacitar al sujeto X. Pero lo capacito Pedrito, pero en el avance del programa es indistinto quien lo dicto.

Esta es la segunda etapa del [caso de seguimiento de coloquios](../). La primera reemplazó un proceso basado en Excel y Power Query por una base SQLite y un dashboard en Streamlit. Esta actualización aborda dos problemas que aparecieron después, con el uso cotidiano: se empezaron a sumar información que iba siendo necesaria tener para tomar decisiones. Como necesitaba estar a disposción rapidamente se empezo a alojar en espacios que capaz no eran lo mejor. De esta manera se fue generando dificultad para navegar pantallas que habían acumulado demasiada información y para el usuario promedio habia que navegar entre un monton de cosas para encontrar lo que realmente querian ver.Hacia lento el programa, y para la gente menos informatica se les complicaba encontrar lo que querian. 

Mientras GitHub Pages no está configurado, las reconstrucciones pueden consultarse como archivos fuente dentro del repositorio:

- [Fuente de la réplica del dashboard](./demo/dashboard.html)
- [Fuente del reporte HTML interactivo](./demo/index.html)

## Qué cambió

| Antes | Problema | Ahora | Solución aportada |
|---|---|---|---|
| **Navegación del dashboard.** Una misma pantalla se extendía verticalmente y contenía indicadores, filtros, gráficos, tablas, mapas de calor y listados. Los componentes estaban separados por títulos, pero aparecían uno debajo del otro dentro de una página larga. | Si una persona necesitaba consultar un solo gráfico o un mapa de calor, tenía que desplazarse a través de todos los bloques anteriores hasta encontrarlo. Parte del contenido no era relevante para su consulta. Además, cuando se agregaba o modificaba un componente, los bloques siguientes cambiaban de posición y quienes usaban el tablero dejaban de encontrarlos donde estaban acostumbrados. | El menú lateral separa las preguntas principales en **pantallas**. Dentro de cada pantalla, controles segmentados permiten elegir una **sección** que contiene uno o dos componentes relacionados entre sí. | La navegación se volvió predecible: primero se elige el tipo de consulta y después el análisis puntual. En Streamlit, la selección también permite ejecutar la preparación específica de la sección elegida en lugar de calcular todos los análisis de la pantalla en cada actualización. |
| **Reporte semanal.** Dos coordinadores preparaban el reporte del avance del programa y el seguimiento de aproximadamente 30 capacitadores. Descargaban PNGs generados por el tablero, extraían CSVs, tomaban otras capturas con la herramienta de recortes y prepraban Excels con los pendientes de capacitar de cada capacitador. | Al haber un solo filtro de fechas que impactaba todo el tablero, para extractos había que configurar fechas y filtros varias veces, descargar archivos separados, comprobar que todos correspondieran al mismo período y reunirlos manualmente. Un filtro mal aplicado podía hacer que una parte del reporte no coincidiera con el resto. El material tampoco ofrecía en un único lugar el panorama general para jefaturas, la actividad del período y el detalle operativo de cada capacitador. | Desde la pantalla `Reportes`, cada coordinador selecciona una única vez las fechas de actividad. El sistema consulta la base y genera dos HTML autocontenidos: uno para `Grupo A` y otro para `Grupo B`, con aproximadamente 15 capacitadores en cada uno. | Cada archivo reúne el avance general del programa anual, el detalle del Grupo especifico, la actividad de la semana y todos los pendientes. Las cifras provienen directamente de las mismas fuentes y reglas del tablero. La generación reemplaza el armado manual y mantiene la revisión y el envío bajo control humano. |

## El problema de navegación anterior

El crecimiento del dashboard era útil desde el punto de vista funcional: cada nuevo gráfico, tabla o mapa respondía una consulta real. El problema era que la interfaz seguía creciendo hacia abajo. Dentro de `Resumen`, por ejemplo, podían convivir los indicadores generales, el avance por capacitación, las prioridades por capacitador, comparaciones por gerencia y zona, mapas de calor y listados operativos.

Los títulos ayudaban a separar visualmente cada bloque, pero no resolvían la navegación. Para llegar a una visualización ubicada al final había que atravesar todas las anteriores. Al actualizar el tablero o incorporar un nuevo análisis, el desplazamiento necesario cambiaba y los elementos dejaban de ocupar una ubicación estable.

La siguiente animación es una **reconstrucción sintética del funcionamiento anterior**. No es una grabación del entorno productivo: utiliza datos ficticios y apila los componentes para mostrar el recorrido que exigía una sola pantalla.

![Reconstrucción sintética de la pantalla Resumen anterior, con todos sus análisis apilados verticalmente](./assets/dashboard-resumen-anterior.gif)

## Pantallas y secciones

Reorganicé la interfaz en dos niveles:

- Una **pantalla** representa una pregunta principal y se elige desde el menú lateral. `Resumen` y `Avance por Capacitador` son dos ejemplos.
- Una **sección** representa un análisis puntual dentro de una pantalla. Se selecciona mediante un control horizontal y muestra sólo los componentes relacionados con esa consulta.

La separación no es solamente visual. La versión productiva utiliza navegación condicional con `st.radio` y `st.segmented_control`. Los indicadores generales compartidos por una pantalla siguen calculándose una vez, pero las consultas y transformaciones específicas de las secciones inactivas no se ejecutan hasta que el usuario las elige. Esto evitó el comportamiento anterior de las pestañas de Streamlit, que preparaban contenido que todavía no se estaba consultando.

### Resumen

`Resumen` conserva los indicadores generales del programa y permite cambiar entre análisis como el avance por capacitación y las prioridades por capacitador. En lugar de apilar todas las tablas y gráficos, el área principal se reemplaza cuando cambia la sección.

![Pantalla Resumen con el avance por capacitación seleccionado](./assets/dashboard-resumen.png)

La sección de prioridades conserva la distinción operativa entre `Convenio A` y `Convenio B`, presenta sus indicadores agregados y compara el avance ponderado de los capacitadores responsables.

![Pantalla Resumen con las prioridades por capacitador y los convenios A y B](./assets/dashboard-prioritarias-capacitador.png)

### Avance por Capacitador

Esta pantalla permite seleccionar un capacitador responsable y consultar el universo que tiene asignado. Sus secciones separan el avance por contenido, el desglose por organización y las personas que todavía tienen capacitaciones pendientes.

La información sirve para acompañar el trabajo de capacitación y señalar tareas pendientes, pero no pretende medir por sí sola la calidad o efectividad profesional de una persona. Los capacitadores también realizan otras tareas que no forman parte de estos indicadores.

![Pantalla Avance por Capacitador con el avance por capacitación seleccionado](./assets/dashboard-avance-capacitador.png)

La réplica pública implementa estos flujos seleccionados con información sintética. No reproduce las seis pantallas ni todas las variantes administrativas del sistema productivo.

## Cómo se preparaba el seguimiento semanal

El seguimiento está dividido entre dos coordinadores y dos convenios. Cada coordinador trabaja con aproximadamente 15 capacitadores de `Grupo A` o `Grupo B`. La separación responde a la organización operativa del programa, pero ese criterio no es necesario para comprender la solución técnica.

Antes de esta actualización, preparar el material implicaba combinar distintas salidas:

1. Configurar el período de consulta dentro del dashboard.
2. Descargar PNG que resumían el avance general y los contenidos prioritarios.
3. Descargar CSV con personas y capacitaciones pendientes.
4. Tomar capturas de otros componentes que no formaban parte de los PNG exportables.
5. Organizar parte de la información en un Excel consolidado.
6. Preparar, cuando se solicitaba, un CSV o detalle específico para un capacitador.
7. Revisar que las fechas y filtros utilizados en cada archivo coincidieran antes de enviarlos.

Los archivos cumplían objetivos diferentes. Los PNG y las capturas mostraban la situación general o una comparación visual; los CSV contenían el detalle nominal necesario para saber a qué personas debía capacitar cada responsable y en qué contenidos; el Excel se utilizaba para reunir y distribuir parte de ese material.

El proceso completo demandaba aproximadamente una hora semanal entre ambos coordinadores. Es una estimación: podía variar según la cantidad de archivos individuales solicitados y no existía una medición formal. El principal problema no era solamente el tiempo, sino también la posibilidad de aplicar fechas distintas, omitir un archivo o distribuir información que no coincidiera con el resto del paquete.

## Qué genera ahora el sistema

Desde la pantalla `Reportes`, el coordinador ingresa una fecha inicial y una fecha final para representar el período de actividad que quiere revisar. Con esas fechas se generan dos documentos, uno para cada grupo que le corresponde a cada capacitador.

![Pantalla Reportes con la selección del período y las salidas de los convenios A y B](./assets/dashboard-reportes.png)

Cada HTML combina dos ventanas temporales distintas:

- **Actividad del período:** utiliza exactamente las fechas elegidas. Cuenta las capacitaciones registradas por cada capacitador que dictó una actividad, muestra qué contenidos se realizaron y resume su distribución.
- **Avance acumulado y pendientes:** toma desde el 1 de enero hasta la última fecha disponible del año de seguimiento. Compara las capacitaciones realizadas con las necesidades y asignaciones vigentes.

Los dos documentos comparten el mismo resumen agregado del programa, que contempla a los aproximadamente 30 capacitadores. Después, cada archivo muestra únicamente el detalle del grupo correspondiente a su coordinador: cerca de 15 capacitadores, sus indicadores y sus pendientes nominales. Un convenio no recibe el detalle individual del otro, aunque ambos ven el mismo panorama agregado.

Todos los integrantes de un grupo, el coordinador y las jefaturas destinatarias reciben el mismo HTML de ese grupo. Esta distribución es intencional y forma parte del funcionamiento definido para el programa.

## Qué contiene el reporte HTML

El documento reúne información que antes estaba distribuida entre varias pantallas, secciones y descargas:

- Avance acumulado de las capacitaciones prioritarias del primer y segundo semestre.
- Totales de personas capacitadas, necesidades y porcentaje ponderado.
- Comparación del avance prioritario por capacitador responsable.
- Actividad realizada dentro de las fechas elegidas.
- Cantidad de capacitaciones registradas por cada capacitador que dictó actividades.
- Distribución de esa actividad por contenido de capacitación.
- Inclusión de capacitadores sin actividad durante el período, para que la ausencia de registros también sea visible.
- Personas y contenidos que continúan pendientes para cada capacitador responsable.
- Filtro para mostrar sólo capacitaciones prioritarias o todos los contenidos pendientes.
- Descarga CSV del detalle que está visible después de aplicar los filtros.
- Tooltips que explican el significado y la fórmula de los indicadores.
- Notas metodológicas sobre asignaciones, alcance y motivos por los que los porcentajes pueden cambiar.

El listado de pendientes se obtiene cruzando el universo vigente de necesidades, la asignación actual de cada persona a un capacitador y las capacitaciones registradas durante el período acumulado. El resultado no es una lista cargada manualmente: se calcula a partir de las vistas y registros de la base.

![Reporte HTML autocontenido con el resumen general y el avance por capacitador](./assets/reporte-html.png)

## Por qué elegí un HTML autocontenido

El HTML permite reunir información para distintas audiencias dentro de un único archivo. Una jefatura puede comenzar por el panorama general; un coordinador puede revisar la actividad y comparar avances; un capacitador puede filtrar su nombre y consultar las personas que todavía tiene pendientes.

Frente al conjunto anterior de PNG, capturas, CSV y Excel, el formato aporta:

- Un único archivo por convenio.
- Apertura local en cualquier navegador, sin instalar Python ni conectarse al dashboard.
- Diseño adaptable para computadoras y teléfonos.
- Mejor control visual que una planilla utilizada como informe.
- Más interacción que un documento estático como PDF.
- Filtros, tooltips y descarga CSV sin conexión a un servidor.

El documento incluye su estructura, estilos, datos e interacción. Python realiza las consultas y calcula los indicadores antes de generar el archivo. JavaScript no redefine las reglas de negocio: se limita a cambiar paneles visibles, abrir ayudas, filtrar información ya calculada y construir el CSV local.

## Una salida determinista en lugar de un reporte generado de forma ad hoc

Una alternativa posible por la cual podrian haber optado los coordinadores previa a esta solución era entregar a una herramienta de IA los PNG, capturas, CSV y Excel para pedirle que armara un reporte.  Decidí anticiparme porque una generación de ese tipo podía modificar cifras, nombres, colores o criterios, o producir conclusiones que después no fueran controladas de manera consistente.

El reporte actual no interpreta libremente los extractos. Consume directamente los datos utilizados por el tablero, aplica reglas definidas en código y produce siempre la misma salida para las mismas fuentes y fechas. Esto mantiene unificados el dashboard y el documento distribuido, sin impedir que la revisión y el envío sigan siendo decisiones humanas.

Esa alternativa hubiese probablemente generado multiples problemas, como enojo por parte de los capacitadores si se reportaban mal sus avances, retrabajos porque habria que haber controlado porque tenia esos resultados el reporte que ya habia pasado previamente con otro de los tableros que ya habia generado por lo tanto me decidi anticipar. 

## Evolución técnica de la solución

La primera versión concentraba gran parte de la orquestación en la aplicación principal. A medida que se incorporaron consultas, pantallas y exportaciones, esa estructura generó llamadas repetidas, componentes duplicados y más trabajo del necesario durante cada actualización de Streamlit.

La arquitectura actual separa dos recorridos relacionados:

```text
SQLite y vistas SQL
├── loaders, caché y normalización
│   └── orquestación de pantallas y servicios compartidos
│       └── dashboard Streamlit
│           └── navegador
└── loaders de reporting
    └── modelo explícito del reporte
        └── renderer Python
            └── HTML + CSS + JavaScript + datos
                ├── navegador
                └── CSV generado localmente
```

La separación es progresiva y no pretende describir capas completamente aisladas: todavía existe lógica de orquestación y transformación en `app.py`, en algunas pantallas y en los loaders. Sin embargo, la evolución permitió definir responsabilidades más claras y probar los contratos entre ellas.

### SQL, loaders y rendimiento

Las mejoras no consistieron en reducir indiscriminadamente la cantidad de loaders. El sistema tiene hoy más capacidades y, por lo tanto, también más puntos de entrada. Los cambios verificables fueron:

- Eliminé loaders y código de carga que ya no tenían consumidores.
- Reemplacé vistas redundantes por una vista operativa canónica para construir el universo vigente.
- Sustituí un cálculo que realizaba una consulta por cada capacitación por una única consulta consolidada y cruces en memoria.
- Reutilicé resultados cacheados para obtener totales y mapas organizativos sin volver a consultar las mismas fuentes.
- Separé los loaders generales de los necesarios exclusivamente para los reportes.
- Extraje componentes compartidos de navegación y presentación para evitar repetir comportamientos entre pantallas.
- Cambié pestañas que preparaban todo su contenido por controles segmentados y condiciones que ejecutan el análisis seleccionado.

El efecto combinado es menor trabajo redundante sobre SQLite, menos transformaciones repetidas y actualizaciones más ágiles cuando una persona cambia de sección. No publico un benchmark de rendimiento porque no se realizó una medición controlada antes y después.

## Cómo preservé las reglas de cálculo

La reorganización visual y el nuevo formato no debían producir indicadores diferentes. Para evitarlo:

- El resumen general del dashboard y el reporte reutilizan las mismas fuentes y funciones de cálculo del avance.
- Los cálculos específicos del reporte se encuentran separados en servicios con contratos explícitos de datos.
- Hay pruebas automatizadas sobre navegación, servicios, contratos de DataFrames, filtros y generación del HTML.
- El renderer se prueba con datos sintéticos para verificar estructura, contenido, escape de valores e interacción.
- Realizo auditorías ocasionales comparando el HTML generado con las pantallas equivalentes del dashboard.

El feedback de las primeras revisiones también produjo cambios visibles. Se agregaron tooltips para explicar qué mide cada indicador y notas metodológicas al final del documento para aclarar por qué una modificación de necesidades, licencias, traslados o asignaciones puede cambiar los porcentajes.

## Mi participación

La necesidad no surgió de un único pedido formal. Distintas personas plantearon problemas parciales: agrupar CSV, reunir componentes para no enviar capturas separadas y reducir el tiempo perdido preparando el reporte. También señalaron errores derivados de configurar manualmente los filtros de fecha varias veces.

A partir de esos pedidos diseñé e implementé individualmente la reorganización de la navegación, las optimizaciones de consultas, el modelo de reporting y el renderer HTML. Los coordinadores aportaron el contexto operativo y el feedback necesario para ajustar la salida a la forma en que realizan el seguimiento.

## Adopción inicial

Los dos coordinadores utilizan los reportes semanalmente desde hace dos semanas. Durante este período inicial, la generación y el primer control contra el dashboard no demandaron más de aproximadamente cinco minutos por ciclo.

La comparación con la hora semanal del proceso anterior debe leerse como una estimación operativa temprana, no como un estudio formal de ahorro. Todavía no existe una ventana de observación suficiente para afirmar un resultado sostenido de largo plazo.


## Próximo avance

La interfaz operativa sigue construida en Streamlit. Existe en otro repositorio un primer borrador de migración hacia React y TypeScript con FastAPI como backend.

El objetivo no es cambiar de tecnología por sí mismo. Streamlit permitió entregar rápidamente una herramienta útil, pero ofrece menos control sobre el layout y utiliza un modelo de ejecución basado en reruns. Una separación más explícita entre frontend y API permitiría construir interacciones más flexibles, controlar mejor la experiencia visual y evolucionar la interfaz sin volver a implementar las reglas que ya fueron validadas.

## Alcance y privacidad

Este caso excluye nombres de empresa, personas, ubicaciones, correos, rutas, métricas productivas y código fuente corporativo. Las demos, capturas y animaciones utilizan información ficticia y no fueron construidas a partir de una copia anonimizada de la base real.
