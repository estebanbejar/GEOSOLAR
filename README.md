# GEOSOLAR

**Laboratorios docentes de geometría solar e instalaciones fotovoltaicas.**

Universidad de Salamanca · Escuela Técnica Superior de Ingeniería Industrial · Área de Tecnología Electrónica.

Aplicación HTML, CSS y JavaScript que realiza los cálculos en el navegador. El alumnado no necesita MATLAB, Python, licencias de pago ni instalaciones. No se consultan servicios externos.

## Laboratorios

| Nº | Laboratorio | Contenido |
|---|---|---|
| 01 | Órbita Tierra–Sol | Órbita kepleriana, estaciones, perihelio/afelio, declinación y ecuación del tiempo. |
| 02 | Geometría solar | Latitud, declinación, ángulo horario, altura/acimut, trayectorias y cartas solares polar/cartesiana. |
| 03 | Filas fijas y sombras | Paso invernal, sombras, incidencia frontal/posterior y cobertura del terreno. |
| 04 | Conjuntos Este–Oeste | Dos caras, orientación de cumbrera, separación, sombras y cobertura. |
| 05 | Seguimiento N–S | Giro, pendientes, GCR, backtracking, horas sin sombras y comparación de doce fechas. |

Incluye animación, tablas, exportación CSV/PNG y guardar/abrir escenarios JSON.

La página **Créditos**, a la derecha de los cinco laboratorios, recoge la finalidad docente, la autoría, los enlaces institucionales y la licencia MIT completa, legible también sin conexión. Entrar en ella pausa la animación y conserva los parámetros de los laboratorios. Versión 0.7.3 · actualización: 8 de noviembre de 2026.

## Usar GEOSOLAR

- **Web:** la dirección prevista es [estebanbejar.github.io/GEOSOLAR](https://estebanbejar.github.io/GEOSOLAR/), una vez activado GitHub Pages. La existencia de este enlace en el README no certifica que la publicación ya esté activa.
- **Sin conexión:** descargar el repositorio con **Code → Download ZIP**, extraerlo y abrir `dist/index.html` con doble clic. Ese archivo contiene toda la aplicación y el logotipo.
- `index.html` es la entrada con el código separado; `dist/index.html` es la distribución autónoma de un solo archivo.

En la versión publicada habrá un enlace **Descargar versión sin conexión** al pie de la página.

## Guías

- [Uso y controles](docs/USO.md).
- [Modelos, convenciones y límites](docs/MODELOS.md).
- [Validación](docs/VALIDACION.md).
- [Activar GitHub Pages](docs/PUBLICAR_GITHUB.md).
- [Cambios de la versión inicial](CHANGELOG.md).
- [Corrección 0.7.2: filas fijas en el hemisferio Sur y compatibilidad de escenarios](docs/CORRECCION_FILAS_HEMISFERIO_SUR.md).

## Desarrollo

Para editar basta un editor de texto. Para comprobar y generar la entrega se utiliza Node.js 24, solo en el equipo de desarrollo o en GitHub Actions. No hay paquetes que instalar.

```text
node scripts/check.cjs
node scripts/build.cjs
```

También se pueden usar `npm test` y `npm run build`; no requieren `npm install`.

El primer comando comprueba la sintaxis y ejecuta las pruebas. El segundo regenera `dist/index.html` y prepara `site/` para la publicación. No editar la entrega generada: los cambios deben hacerse en `src/`, `index.html` o `assets/` y después regenerarse.

```text
index.html                   Entrada con archivos separados
src/core/models.js           Modelos numéricos y geometría
src/ui/app.js                Estado, controles y navegación
src/ui/graphics.js           Dibujo Canvas
src/ui/styles.css            Presentación
assets/usal.png              Identidad institucional
dist/index.html              Distribución autónoma
scripts/                     Comprobación y preparación de la entrega
tests/                       Referencias MATLAB y comprobaciones JavaScript
docs/                        Guías
.github/workflows/pages.yml   Pruebas, preparación y publicación
```

## Alcance y validación

Versión inicial del repositorio: **0.7.0**. Los modelos proceden de prototipos MATLAB de IRRADIANCE, que permanecen como referencia independiente.

Las pruebas incluyen 581 comparaciones numéricas con MATLAB, 2178 invariantes, 111 combinaciones de orden de dibujo, 45 casos de iluminación/color, 106 comprobaciones de cartas solares, 280 configuraciones australes de filas fijas y 61 comprobaciones de ejecución de interfaz con sustitutos DOM/Canvas. Estas últimas no sustituyen pruebas de un navegador real. La interfaz ha recibido revisiones manuales durante su desarrollo; la matriz de compatibilidad entre navegadores queda pendiente.

Son modelos didácticos aproximados. La sombra geométrica no equivale a una pérdida energética. Esta versión no calcula producción eléctrica ni irradiación anual PVGIS y no sustituye un proyecto de ingeniería.

## Licencia y atribución

Código bajo [licencia MIT](LICENSE), con la autoría de Esteban Sánchez. Los modelos se adaptan del proyecto IRRADIANCE. El logotipo USAL conserva los derechos de su titular; la licencia del código no concede derechos sobre marcas institucionales. Véase [ATRIBUCIONES.md](ATRIBUCIONES.md).
