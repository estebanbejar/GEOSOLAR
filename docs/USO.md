# Uso de GEOSOLAR

## Controles comunes

Elegir un laboratorio en la navegación superior. Modificar los parámetros con los campos o las barras. El cajetín de indicadores muestra fecha, hora, referencia temporal y resultados del laboratorio. «Restablecer» recupera sus parámetros iniciales.

«Reproducir» y «Pausar» controlan la animación. Se pausa al cambiar determinados parámetros y cuando la pestaña queda oculta. Los botones PNG guardan figuras; «Descargar datos» guarda las curvas y sus parámetros como CSV. «Guardar escenario» conserva los parámetros en JSON; «Abrir escenario» los recupera.

## Órbita Tierra–Sol

Seleccionar día del año, evento o punto de vista. La hora del cajetín es el reloj del año didáctico; no se simula rotación terrestre diaria. Los cuerpos tienen tamaños ampliados, con el Sol algo mayor que la Tierra. ET positiva significa tiempo solar verdadero adelantado respecto al solar medio.

## Geometría solar

El selector de día está en el panel lateral. La declinación comienza en «Según fecha»; en «Manual» puede fijarse un valor independiente del día. Cambiar el día en modo manual conserva esa declinación. La hora es solar.

Las figuras 1–4 muestran relaciones geométricas. Las figuras 5–6 son cartas polar y cartesiana: trayectorias de referencia, intermedias, líneas horarias y trayectoria seleccionada. El punto dorado representa el instante actual si el Sol está sobre el horizonte. No se dibuja analema.

## Layouts

- **Filas fijas:** el hueco se calcula para tres horas centrales de invierno; la fecha de la escena no modifica ese criterio de diseño. El desvío cero orienta el frente hacia el ecuador: Sur para latitudes ≥ 0° y Norte para latitudes negativas; la longitud de fila discurre E–O. La flecha granate identifica el frente, el vector amarillo el Sol. Los escenarios anteriores conservan su desvío, pero se corrige su interpretación en latitudes negativas; véase el [informe de compatibilidad](CORRECCION_FILAS_HEMISFERIO_SUR.md).
- **Este–Oeste:** el hueco inferior es manual. Cada conjunto contiene dos caras; con giro cero la cumbrera está alineada N–S.
- **Seguidor:** se puede dimensionar el paso en invierno o fijarlo mediante GCR. Las pendientes suben hacia Norte/Este cuando son positivas. Las dos gráficas mensuales usan el mismo paso, con y sin backtracking.

Colores: azulado para cara frontal; azul oscuro para incidencia posterior o rasante; rojo para sombra geométrica sobre la cara frontal; gris para noche o Sol oculto por terreno. No son porcentajes de pérdida energética.

En las gráficas diarias, el eje izquierdo expresa superficie sin Sol directo y el derecho los ángulos: con la normal θ (0° perpendicular) y con el plano η (90° perpendicular). θ+η=90°. Por la noche se omiten los datos angulares y porcentajes.

La referencia horaria puede ser solar o civil con huso IANA, por ejemplo `Europe/Madrid` o `Atlantic/Canary`. La fecha y el horario de verano importan al interpretar horas civiles.
