# Cambios

## 0.7.2 · Filas fijas orientadas hacia el ecuador

- Corrección física del laboratorio 03 en latitudes negativas: orientación efectiva única para dimensionamiento, geometría, sombras e incidencia.
- Control de desvío respecto al ecuador, flecha frontal basada en los vértices, acimut efectivo en indicadores, tablas y CSV.
- Escenarios JSON versión 1 compatibles: conservan alpha; cambia expresamente su interpretación austral. Identificador del modelo fijo: `fixed-equator-v2`.
- Regresión de resultados septentrionales y de 04/05; 280 configuraciones australes nuevas. Se conservan las mejoras de 0.7.1.
- Cámara del 03 adaptada al cruzar hemisferios: giro de 180° una sola vez, conservando los ajustes posteriores y las cámaras guardadas explícitamente en escenarios.
- Etiqueta del control «Acimut» y franja inferior reservada para la dirección del frente, sin tapar las mesas.
- Detalles y alcance de la revisión visual: [informe](docs/CORRECCION_FILAS_HEMISFERIO_SUR.md).

## 0.7.1 · Carta solar del hemisferio Sur

- La carta cartesiana se centra en el Norte para latitudes negativas, con Oeste a la izquierda y Este a la derecha.
- Trayectorias, líneas horarias, etiquetas y marcador solar comparten esa referencia visual; se conserva el corte de las curvas en el cenit y en el extremo del eje.
- El acimut del modelo, los datos exportados y la carta polar conservan sus convenciones.

## 0.7.0 · Primera versión del repositorio

Cinco laboratorios con identidad USAL: órbita, geometría solar, filas fijas, Este–Oeste y seguimiento geométrico N–S.

- Fecha, hora y referencia temporal integradas en los siete casilleros superiores.
- Órbita con eventos, fechas y distancias, curvas de declinación/ET y explicación de la ecuación del tiempo.
- Seis figuras de geometría solar, incluidas cartas polar y cartesiana, trayectorias intermedias, líneas horarias y marcador del Sol. Selector de día único en el panel lateral; declinación inicialmente «Según fecha», con modo manual disponible.
- Orden de dibujo corregido en layouts y leyenda frontal/posterior/sombra/noche.
- Ambos ángulos de incidencia en gráficos, tablas y CSV.
- Comparación del giro en doce fechas, con/sin backtracking y exportación.
- Animación, exportación PNG/CSV y escenarios JSON.
- Distribución autónoma sin conexión, pruebas reproducibles y preparación de GitHub Pages.

Las siguientes fases —productividad PVGIS, strings y series horarias— no forman parte de esta versión.
