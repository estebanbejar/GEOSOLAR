# Créditos y aviso de uso · GEOSOLAR HTML 0.7.3

Actualización fija: 8 de noviembre de 2026. Base: GEOSOLAR 0.7.2, commit `f3c936f64ada9dcf8a14c8e6c3c0b8e4cd7ef490`.

Se implementa el texto aprobado por el autor en este hilo, adaptado del [encargo de la suite MATLAB](https://github.com/estebanbejar/GEOSOLAR_MATLAB/blob/main/docs/PROMPT_CREDITOS_GEOSOLAR_HTML.md).

## Adaptaciones acordadas

- No se incluyen créditos a PVGIS/JRC, cartografía, geocodificación u otras dependencias ausentes de HTML. El autor aprobó expresamente esta adaptación.
- Se conserva el nombre completo, la afiliación, la asignatura, la titulación, el aviso docente, ORCID y el enlace inmediato a la Escuela.
- Se reconoce Codex de OpenAI bajo la dirección del autor. No se atribuyen modelos concretos sin documentación de su participación en HTML.
- Se mantiene íntegro `LICENSE`, incluido su copyright original. Se incorpora su texto en un desplegable que funciona sin conexión.
- La versión y la fecha corresponden a esta entrega HTML; no se usa la fecha de apertura ni la versión MATLAB.

## Navegación y alcance

Créditos es una página informativa al extremo derecho de los cinco laboratorios; no recibe numeración. Al entrar se detiene la animación. Los estados de los laboratorios se conservan; se recuperan al regresar. El enlace de salto y el foco apuntan al título de Créditos durante su lectura.

No se modifican los modelos científicos, el dibujo de las gráficas ni los formatos de escenarios o exportaciones. Los cambios se limitan a la navegación compartida, contenido informativo, estilos, atribuciones, versión y pruebas.

## Comprobaciones

- `node scripts/check.cjs`: pruebas previas, validación de créditos y 61 comprobaciones de interfaz.
- `node scripts/build.cjs`: generación de `dist/index.html` y `site/` sin dependencias remotas.
- Revisión real en escritorio (1280 × 900) y móvil (390 × 844): lectura completa, enlaces, foco, licencia y ausencia de desbordamiento horizontal.
- Prueba real de animación y conservación de latitud −34,6°, siete filas, cámara 150° y la hora detenida al entrar y volver de Créditos.
- Distribución autónoma abierta en el navegador: scripts y estilos integrados y licencia completa presente.
- Los seis enlaces se contrastan con los destinos aprobados; la web de la Escuela y ORCID se han abierto para verificar su accesibilidad. ORCID requiere JavaScript para mostrar su contenido.

Capturas: [escritorio](../review/creditos_escritorio.png), [móvil](../review/creditos_movil.png). Evidencia de navegador: [JSON](../review/creditos_navegador.json).

Los cambios se preparan en una rama de revisión del repositorio. No se activa la publicación de GitHub Pages en este paso.
