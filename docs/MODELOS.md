# Modelos y convenciones

Los modelos se han adaptado de los prototipos MATLAB de IRRADIANCE, de Esteban Sánchez. GEOSOLAR es independiente de MATLAB durante su uso y no modifica los prototipos originales.

## Geometría y tiempo

Ángulos en grados. Coordenadas locales Este/Norte/Cenit; acimut desde el Sur, Este negativo y Oeste positivo. En cenit/nadir el acimut es indeterminado. En los polos el marco horizontal es convencional. Se clasifican día/noche polar y contactos del horizonte.

- Geometría básica: δ=23,45 sin[360(284+n)/365], año didáctico 2026 de 365 días.
- Layouts: δ=−23,44 cos[360(n−355)/365,2422].
- Órbita: Kepler con a=1 UA, e=0,0167, periodo de 365 días, oblicuidad 23,44° y perihelio fijado el 3 de enero. Los eventos se derivan del modelo calibrado al equinoccio de marzo. No es una efeméride exacta de 2026.
- La ET orbital usa una aproximación armónica NOAA independiente de Kepler; los layouts utilizan la aproximación anual con B=2π(n−81)/364.

La conversión civil usa longitud, ET y zona IANA. Una hora civil ambigua selecciona la segunda ocurrencia; una inexistente avanza por el cambio de horario. Las cartas solares usan horas solares constantes; no incorporan analema.

## Filas fijas y E–O

Las sombras se calculan proyectando las mesas sobre cada receptora, recortando y uniendo los polígonos sin contar solapes dos veces. Se distingue sombra geométrica de cara sin Sol directo, que incluye incidencia posterior. Terreno horizontal y mesas iguales y finitas.

En fijo: b=L cos β, H=L sin β, d=HK, P=b+d y LCR=b/P. K usa 1801 posiciones de las tres horas centrales del invierno de cada hemisferio. En E–O: P=2L cos β+0,05+d y LCR=2L cos β/P. El hueco de cumbrera es 5 cm.

LCR es cobertura horizontal del patrón repetitivo. No incluye pasillos, caminos, márgenes o límites de parcela.

## Seguimiento

Eje N–S que sigue su pendiente, terreno plano inclinado, límites mecánicos y backtracking geométrico. Se comprueba altura libre positiva durante todo el intervalo de giro. GCR=L/paso horizontal E–O; no es el LCR proyectado del fijo.

Las horas sin sombras suman intervalos de un minuto con todas las filas libres y Sol frontal visible. Pueden ser varios intervalos separados. La comparación mensual usa el día 21 de cada mes y el mismo paso con/sin BT.

## Límites

Modelos educativos aproximados, sin efemérides de precisión. No se incluyen producción eléctrica, irradiación anual PVGIS, respuesta bifacial, pérdidas eléctricas, diodos bypass, suciedad o editor libre de parcelas. Evitar sombra no determina por sí solo la energía eléctrica obtenida.
