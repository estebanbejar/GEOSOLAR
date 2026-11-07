# Laboratorio 03: orientación hacia el ecuador

Versión 0.7.2, preparada el 7 de noviembre de 2026 y aprobada por el usuario para su publicación.

## Base e instrucciones

Se ha inspeccionado la rama `main` actual de `estebanbejar/GEOSOLAR`, commit `665069614900e3b5f5d8d20121c6aa2f2988a851` (0.7.1). Conserva las mejoras de la carta solar austral posteriores a 0.7.0 (`6c0ece30fa25a763c8169032e183adb13a5b76d9`). El árbol actual no contiene archivos `AGENTS.md`. Se han seguido el README (editar fuentes y regenerar la distribución), las convenciones de `docs/MODELOS.md` y la preparación inicial sin publicar. Tras revisar y aprobar la entrega, el usuario autorizó expresamente su publicación.

La entrega se prepara en una copia de trabajo independiente; no se han modificado proyectos MATLAB ni los originales de IRRADIANCE.

## Causa y corrección

Antes, `fixedDesign` seleccionaba la declinación invernal por hemisferio, pero tanto su dirección frontal como `layout` usaban `alpha` como acimut absoluto desde el Sur. Con latitud negativa y alpha = 0 esto orientaba las mesas al Sur y podía dar un hueco nulo indebido.

`fixedOrientation(p)` es la única conversión entre desvío y orientación efectiva:

- Latitud ≥ 0: acimut efectivo = alpha.
- Latitud < 0: acimut efectivo = 180° + alpha.
- Normalización circular a [−180°, 180°); −180° y +180° representan Norte.
- Acimut desde el Sur, Este negativo y Oeste positivo.

La función devuelve el marco frontal/posterior/longitudinal y la transformación del vector solar a ese marco. Se utiliza en el dimensionamiento y en los vértices de las mesas. Las normales se obtienen del producto vectorial de sus ejes; la proyección de sombras, los colores y la incidencia consumen esa misma geometría global. No se ha aplicado una rotación exclusiva del dibujo.

Con desvío cero, las normales [Este, Norte, Cenit] son [0, −sin β, cos β] en el Norte y [0, +sin β, cos β] en el Sur. La longitud de fila es E–O; es perpendicular a la dirección horizontal del frente. Para β = 0 la normal es vertical y la flecha conserva una orientación frontal convencional.

El dimensionamiento conserva las 1801 muestras de 10:30 a 13:30 solares con δ = −23,44° en el Norte y +23,44° en el Sur, independiente de la fecha mostrada. Se conservan b = L cos β, H = L sin β, d = H K y P = b + d. No se añade un hueco mínimo.

## Presentación y exportaciones

- El control se llama «Acimut»; su explicación aclara que representa el desvío respecto a la orientación hacia el ecuador y explica ambas bases.
- La flecha y la etiqueta del frente ocupan una franja inferior reservada, sin recuadro superpuesto a las mesas. La geometría y las sombras se encuadran por encima de esa franja, tanto en planta como en 3D.
- El indicador de paso muestra el acimut frontal efectivo.
- Flecha granate «Frente: Sur/Norte» con desvío cero. Su dirección se reconstruye a partir de los vértices efectivamente pasados al dibujo, independientemente de la cámara. El vector solar sigue siendo amarillo.
- En planta se conservan Norte arriba, Este a la derecha y referencias N/E/S/O.
- Las tablas y CSV del 03 añaden `desvio_ecuador_grados` y `acimut_frontal_desde_sur_grados`. Sus metadatos explican la interpretación.
- Las exportaciones PNG incluyen la flecha como parte del Canvas.
- Al cruzar de hemisferio con el control de latitud, se gira la cámara almacenada 180° una sola vez (−30° → 150° con la vista inicial). Dentro del mismo hemisferio, los cambios de latitud, fecha, inclinación y el redibujado conservan el giro elegido. Una cámara explícita de un escenario se respeta; si el escenario austral omite cámara, se inicializa en 150°. La geometría no depende de este ajuste. Las vistas de revisión usan −30° en el Norte y 150° en el Sur.

## Escenarios y diferencias deliberadas

Se conserva el formato JSON versión 1, la clave `alpha` y su valor, sin transformación destructiva al cargar. Los escenarios nuevos del 03 se identifican como `fixed-equator-v2`; el cargador acepta los anteriores `matlab-compat-v1`. Al cargar un escenario austral se muestra un aviso de la corrección.

**Los escenarios anteriores con latitud negativa cambian deliberadamente de resultado**: alpha pasa a interpretarse como desvío desde el Norte, hacia el ecuador. No se conserva su orientación física errónea previa. Cambian normales, disposición, paso, LCR, sombras e incidencia. El mismo desvío se conserva en el archivo.

Ejemplo con φ = −40°, alpha = 0°, β = 30°, L = 2 m, W = 10 m:

| Magnitud | Antes | Corregido |
|---|---:|---:|
| Frente | Sur | Norte |
| Hueco d | 0 m | 2,1582807303 m |
| Paso P | 1,7320508076 m | 3,8903315379 m |
| LCR | 100 % | 44,52193317 % |

El caso +40° con el mismo desvío coincide con el corregido. Los resultados anteriores del hemisferio Norte permanecen dentro de la tolerancia de regresión 1e−10. Las funciones y los comportamientos de 04 E–O y 05 Seguimiento se conservan, incluyendo sus modelos y formatos de exportación.

## Validación ejecutada

`node scripts/check.cjs` ejecuta la sintaxis y todas las pruebas; `node scripts/build.cjs` regenera la entrega autónoma sin dependencias remotas.

Pruebas nuevas `tests/fixed_hemispheres.cjs`:

- 280 configuraciones australes: latitudes −1°, −23,45°, −34,6°, −55° y −60°; desvíos −90°, −45°, −20°, 0°, 20°, 45° y 90°; inclinaciones 0°, 10°, 30° y 45°; 1 y 3 filas.
- Normales reconstruidas desde los vértices, ortogonalidad, direcciones longitudinales y correspondencia entre vértices probados y polígonos realmente enviados al Canvas.
- Igualdad del paso con latitudes y desvíos opuestos. Error máximo observado: 3,552713678800501e−15 m.
- Ausencia de solape mediante intervalos de la proyección de las mesas en el eje transversal: si esos intervalos no se solapan, tampoco pueden intersectarse las mesas; se permiten contactos de borde en el caso horizontal.
- 832 muestras independientes de la ventana invernal (aproximadamente cada 13 s), más el mediodía, por configuración. Máxima fracción de sombra geométrica observada: 0. Tolerancia de aceptación 1e−8 de área relativa; cubre redondeo y los umbrales de recorte existentes (distancia de proyección 1e−9 m, área de polígono 1e−12 m²). No representa una holgura constructiva ni un hueco mínimo.
- Incidencia frontal al mediodía invernal, noche, incidencia posterior y θ + η = 90° cuando son válidos. Con desvíos grandes puede existir incidencia posterior a otras horas: se conserva su clasificación física, sin confundirla con sombra geométrica.
- Regresión contra salidas congeladas de 0.7.1: 36 casos fijos septentrionales, 6 casos E–O en ambos hemisferios y 12 casos de seguimiento con/sin BT y pendientes. No se cambian ni regeneran las referencias MATLAB originales.
- Pruebas de interfaz: carga de escenario antiguo, conservación de alpha/cámara, fecha visualizada independiente del paso, metadatos y columnas CSV, guardado JSON y ausencia de cambios de formato en 04/05.

Se conservan las 581 comparaciones MATLAB, 2178 invariantes, 111 combinaciones de dibujo, 45 casos de iluminación y las 106 comprobaciones de cartas de la versión actual. La prueba de interfaz pasa de 38 a 51 comprobaciones. El informe automático completo se guarda en `review/tests.txt` en la entrega local.

## Revisión visual y limitación pendiente

`review/filas_norte.png` y `review/filas_sur.png` son vistas calculadas con el mismo código Canvas de la aplicación, revisadas visualmente. **No son capturas de navegador.** Los escenarios JSON contiguos permiten reproducirlas.

La captura en Chrome no pudo realizarse porque caducó la autorización de control del equipo. El navegador integrado tampoco accede al servidor local y su política rechaza archivos `file:`. No se han eludido esas restricciones. Por tanto, **la revisión de capturas reales de navegador solicitada queda pendiente**; las pruebas DOM/Canvas no la sustituyen.

Para completarla: abrir `dist/index.html` en Chrome, seleccionar el laboratorio 03 y cargar `review/escenario_norte.json` y `review/escenario_sur.json`. Comprobar las flechas de frente, la planta N/E, los huecos iguales, el mediodía, la noche y ambos ángulos. Girar la cámara y cambiar después la fecha/latitud para verificar que conserva su valor.

El usuario ha revisado la entrega HTML y confirmado la orientación, la cámara y la presentación antes de autorizar esta publicación. La limitación anterior corresponde a la captura automatizada del entorno; no sustituye una matriz de compatibilidad entre navegadores.
