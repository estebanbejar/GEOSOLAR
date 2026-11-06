# Validación

Ejecutar `node scripts/check.cjs` con Node.js 24. No se necesitan paquetes adicionales, MATLAB ni red para repetir las pruebas.

| Comprobación | Alcance |
|---|---|
| 581 comparaciones MATLAB | Posición solar, regímenes del día, órbita/eventos, sombras, incidencia, seguimiento y horas libres. |
| 2178 invariantes | Vectores, simetrías, unión de polígonos, extremos de E–O, geometría independiente del seguidor y horas civiles. |
| 111 combinaciones de dibujo | Terreno, sombras y grupos de mesas para tres layouts y cámaras de −180° a +180°. |
| 45 casos de iluminación/color | Frente, posterior, noche, sombra frontal, ocultación por terreno y dirección solar nocturna. |
| 106 comprobaciones de cartas | Orientación cardinal, cenit, horizonte, polos, trayectorias y líneas horarias; centro según hemisferio, continuidad al mediodía, etiquetas y marcador solar. |
| 38 comprobaciones de interfaz | Ejecución con sustitutos DOM/Canvas: controles, navegación, fechas, siete indicadores y modos manual/fecha. |

Las referencias numéricas están en `tests/reference/matlab.json`, exportadas con MATLAB R2026a Update 5 a partir de funciones puras de los prototipos. Tolerancia general 1e−8; duración del día cerca de contactos 1e−6 horas. El acimut se compara circularmente.

`tests/reference/comparison.json` se regenera y no se versiona. Los sustitutos DOM/Canvas no verifican la disposición CSS ni constituyen pruebas de navegador. Se han revisado manualmente imágenes calculadas y se han incorporado observaciones del usuario sobre versiones locales. Quedan por ampliar las pruebas sistemáticas de navegadores, accesibilidad y adaptación móvil.
