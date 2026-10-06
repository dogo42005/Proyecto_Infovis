# Proyecto_Infovis

Visualización multisensorial para la web (HTML, CSS y [Tone.js](https://tonejs.github.io/), sin librerías de gráficos). La V1 mostraba la relación entre el aumento del uso de teléfonos móviles y la distracción como causa de muertes en el tránsito en Chile; tras la revisión, el profesor señaló que esa forma de mostrar los gráficos no dejaba ver una relación. El equipo pivotó a mostrar una sola variable — uso de internet en el mundo — en un mapa interactivo en vez de dos variables comparadas en gráficos de línea.

## Versión actual en la página (V2, mapa mundial)

`index.html` / `js/main.js` muestran un mapa del mundo donde cada país tiene un cluster de hasta 10 iconos de dispositivos (celular, laptop, computador); la cantidad de iconos visibles es proporcional al % de población que usa internet en ese país y año (≈1 ícono cada 10%).

- **Mapa**: proyección equirectangular hecha a mano (sin librería de mapas), países ubicados por su centroide (lon/lat), con una grilla de referencia (graticule) de fondo. No se dibujan fronteras reales — es un mapa de símbolos proporcionales (pictograma), no un mapa coroplético.
- **Slider de año** (2000-2024) y **scroll del mouse** sobre el mapa: ambos cambian el año mostrado y recalculan los iconos de todos los países.
- **Botón "Reproducir cronología"**: avanza automáticamente año por año.
- **Hover** sobre un país: tooltip con el nombre del país y su % exacto de uso de internet en el año activo.
- **Doble clic** sobre un país: parte una sonificación de notificaciones (Tone.js) que se van solapando — el intervalo entre capas es más corto mientras mayor es el % de uso de ese país, así que los países con más internet suenan más caóticos. Queda centrada (mono).
- **Clic simple en un país y luego clic simple en otro**: la sonificación pasa a estéreo — el primer país queda panneado a la izquierda, el segundo a la derecha, cada uno con su propio ritmo de solapamiento según su propio dato. Un tercer clic en un país nuevo reemplaza al más antiguo de los dos activos.
- **Botón "Silenciar países"**: detiene toda la sonificación activa.

### Datos

- **Uso de internet**: Banco Mundial, *Individuals using the Internet (% of population)* (`IT.NET.USER.ZS`), crudo en `data/cruda_mundial/`. Procesado por `data/procesamiento/procesar_datos_mundial.py`, que descarta los agregados regionales/de ingreso que vienen mezclados con los países en el CSV del Banco Mundial (usando el campo `Region` de los metadatos — vacío en agregados, no en países reales). Resultado: `data/procesada_mundial/mundial_uso_internet.csv` — 210 países, 2000-2024 (`pais, iso3, anio, pct_usuarios_internet`). Se excluyó 2025 porque el Banco Mundial casi no tiene datos reportados todavía para ese año.
- **Posición de cada país**: centroides (lon/lat) de [gavinr/world-countries-centroids](https://github.com/gavinr/world-countries-centroids) (MIT), que vienen en ISO2; se cruzan con la tabla ISO 3166-1 de [lukes/ISO-3166-Countries-with-Regional-Codes](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes) (MIT) para obtener el ISO3 y unirlos con el indicador del Banco Mundial. Mismo script, función `procesar_centroides()`. Resultado: `data/procesada_mundial/mundial_centroides.csv` — 207 de los 210 países (Hong Kong, Macao y Kosovo quedan fuera por no tener un código ISO3 compatible entre ambas fuentes).
- **Iconos**: SVG de [twitter/twemoji](https://github.com/twitter/twemoji) (CC-BY 4.0) en `js/iconos/` — celular (`1f4f1`), laptop (`1f4bb`) y computador de escritorio (`1f5a5`). No existe un emoji oficial de "tablet" en Unicode, así que no se incluyó.
- **Sonidos de notificación**: tres efectos en `js/sonido/notificaciones/`, usados para la cacofonía por país. El sonido de choque de auto de la V1 (`js/sonido/choque-auto.mp3`) queda sin uso en esta versión.

### Limitaciones conocidas

- Al no haber fronteras reales, países pequeños y cercanos entre sí (ej. Europa occidental) tienen sus clusters de iconos superpuestos — se distinguen por el tooltip al hacer hover, no visualmente.
- El cálculo de iconos (`round(% / 10)`, máximo 10) es una elección de diseño para que la proporción se note a simple vista, no un estándar estadístico.

## Versión anterior (V1, Chile — archivada)

La V1 completa (gráficos de línea de fallecidos por distracción vs. abonados móviles en Chile, con su propia sonificación) quedó documentada en [`readme_V1.md`](readme_V1.md) y es recuperable desde el historial de git; el código actual de `index.html`/`js/main.js` ya no la muestra.
