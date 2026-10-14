## Versión principal

Una herramienta interna no deja de necesitar diseño después de su primera versión.

Hace un tiempo compartí cómo reemplacé un seguimiento basado en Excel y Power Query por una base SQLite y un dashboard en Streamlit para gestionar coloquios de seguridad.

Con el uso, el dashboard creció: sumó indicadores, comparaciones y tablas, pero algunas pantallas se volvieron demasiado extensas. Además, preparar el seguimiento semanal para dos convenios todavía exigía descargar CSV, separar pendientes, organizar hojas de Excel y reunir PNG o capturas. Entre los dos referentes, ese armado ocupaba alrededor de una hora por semana.

En esta nueva etapa implementé dos mejoras:

1. Reorganicé el dashboard en seis pantallas y agregué navegación interna por subsecciones. Así, cada vista responde una pregunta concreta y sólo renderiza el bloque seleccionado.
2. Incorporé la generación de dos reportes HTML autocontenidos, uno por convenio. Cada archivo reúne avance, actividad del período, detalle por capacitador, pendientes filtrables y descarga CSV.

El HTML se puede abrir localmente en cualquier navegador y no requiere acceso al dashboard. La distribución sigue siendo manual: automaticé la preparación de la información, no la decisión de revisarla y enviarla.

Los cambios están implementados y listos para comenzar a utilizarse. Todavía no presento métricas de adopción ni porcentajes de mejora porque esa validación viene después del uso real.

También inicié una migración hacia React, TypeScript y FastAPI. Hoy es una línea de evolución, no un reemplazo completo de Streamlit, y prefiero mostrarla de esa manera.

Este trabajo reutiliza un aprendizaje que vengo aplicando en otras automatizaciones: un HTML autocontenido puede ser una solución de reporting simple, portable e interactiva sin agregar infraestructura innecesaria.

Caso de estudio completo: https://github.com/jminolli-e/case-studies/tree/main/coloquios-evolucion

#Python #SQLite #Streamlit #Automatización #DataAnalytics #HTML

## Versión breve

Después de reemplazar un seguimiento en Excel por SQLite y Streamlit, el siguiente problema apareció dentro de la propia solución: el dashboard había crecido y preparar los reportes semanales todavía requería combinar CSV, hojas de Excel, PNG y capturas.

Reorganicé la interfaz en seis pantallas con subsecciones y agregué la generación de dos reportes HTML autocontenidos. Cada archivo reúne avance, actividad, detalle por capacitador, pendientes filtrables y descarga CSV.

El proceso anterior ocupaba alrededor de una hora semanal entre dos referentes. La nueva función ya está implementada y lista para comenzar a utilizarse, aunque su validación operativa todavía está pendiente; la revisión y el envío continúan siendo manuales.

También inicié una migración incremental hacia React, TypeScript y FastAPI, todavía sin presentarla como reemplazo completo del dashboard actual.

Caso de estudio completo: https://github.com/jminolli-e/case-studies/tree/main/coloquios-evolucion

#Python #SQLite #Streamlit #Automatización #DataAnalytics
