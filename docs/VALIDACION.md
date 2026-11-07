# Validación

Ejecutar `node scripts/check.cjs` con Node.js 24. No se necesitan paquetes adicionales, MATLAB ni red para repetir las pruebas.

| Comprobación | Alcance |
|---|---|
| 581 comparaciones MATLAB | Posición solar, regímenes del día, órbita/eventos, sombras, incidencia, seguimiento y horas libres. |
| 2178 invariantes | Vectores, simetrías, unión de polígonos, extremos de E–O, geometría independiente del seguidor y horas civiles. |
| 111 combinaciones de dibujo | Terreno, sombras y grupos de mesas para tres layouts y cámaras de −180° a +180°. |
| 45 casos de iluminación/color | Frente, posterior, noche, sombra frontal, ocultación por terreno y dirección solar nocturna. |
| 106 comprobaciones de cartas | Orientación cardinal, cenit, horizonte, polos, trayectorias y líneas horarias; centro según hemisferio, continuidad al mediodía, etiquetas y marcador solar. |
| 280 configuraciones australes de filas fijas | Normales de vértices dibujados, simetría del paso, ausencia de solapes, ventana invernal, incidencia, noche, regresión del Norte y de 04/05. |
| 51 comprobaciones de interfaz | Sustitutos DOM/Canvas: controles, navegación, fechas, modos, escenarios antiguos, persistencia de cámara y exportaciones. |

Las referencias numéricas están en `tests/reference/matlab.json`, exportadas con MATLAB R2026a Update 5 a partir de funciones puras de los prototipos. Tolerancia general 1e−8; duración del día cerca de contactos 1e−6 horas. El acimut se compara circularmente.

`tests/reference/comparison.json` se regenera y no se versiona. Los sustitutos DOM/Canvas no verifican la disposición CSS ni constituyen pruebas de navegador. Se han revisado manualmente imágenes calculadas y se han incorporado observaciones del usuario sobre versiones locales. Quedan por ampliar las pruebas sistemáticas de navegadores, accesibilidad y adaptación móvil.

Para la corrección 0.7.2 se añaden salidas congeladas del commit actual previo (`tests/reference/pre_fixed_equator_v071.json`), sin alterar las referencias MATLAB. La tolerancia de sombra relativa es 1e−8; la máxima sombra observada en el barrido nuevo es cero. La revisión de capturas reales de navegador está pendiente por restricciones de acceso del entorno. Véase [informe de la corrección](CORRECCION_FILAS_HEMISFERIO_SUR.md).
