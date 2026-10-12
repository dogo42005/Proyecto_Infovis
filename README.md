# Proyecto_Infovis

Visualización multisensorial para la web (HTML, CSS y [Tone.js](https://tonejs.github.io/), sin librerías de gráficos). La V1 mostraba la relación entre el aumento del uso de teléfonos móviles y la distracción como causa de muertes en el tránsito en Chile; tras la revisión, el profesor señaló que esa forma de mostrar los gráficos no dejaba ver una relación. El equipo pivotó a mostrar una sola variable — uso de internet en el mundo — en un mapa interactivo en vez de dos variables comparadas en gráficos de línea.

## Versión actual en la página (V3, mapa mundial)

`index.html` / `js/main.js` muestran un mapa del mundo con la frontera real de cada país. Dentro de cada uno hay hasta 36 iconos de dispositivos (celular, laptop, computador) repartidos en puntos fijos dentro de su propia superficie (no cerca de un centroide). La cantidad de iconos visibles **no es solo el % de uso de internet**: pondera ese % por la población del país (usuarios estimados = % × población, en escala raíz cuadrada y normalizada contra el país más conectado del mundo) — así China (36 iconos, ~1.300 millones de usuarios estimados) pesa mucho más en el mapa que Islandia (1 icono, ~98% de uso pero menos de 400 mil habitantes), aunque ambos tengan un % parecido.

- **Mapa**: proyección equirectangular hecha a mano (sin librería de mapas). Cada país es su polígono real (Natural Earth, 110m, dominio público) — frontera visible, relleno propio, y es también el área clickeable completa (no solo un punto central).
- **Slider de año** (2000-2024) y **scroll del mouse** sobre el mapa: ambos cambian el año mostrado y recalculan los iconos de todos los países.
- **Botón "Reproducir cronología"**: avanza automáticamente año por año.
- **Hover** sobre un país: tooltip con el nombre del país y su % exacto de uso de internet en el año activo.
- **Clic en cualquier parte de un país** (no solo el centro) lo selecciona: se ocultan los iconos de todos los demás países y arranca una sonificación de notificaciones (Tone.js) solo para ese país — el intervalo entre capas sigue la misma cantidad de íconos que se ve ese año (no el % crudo), así que un país con 0 íconos queda en silencio y uno con muchos suena más caótico. Un segundo clic en el mismo país lo deselecciona (vuelven a verse todos).
- **Botón "Sonido global"**: un único flujo de sonido (no 169 en paralelo — sonaba demasiado) que sigue el **% mundial de uso de internet ponderado por población** (suma de usuarios estimados / suma de población de todos los países con datos, no el promedio simple entre países), mostrando de nuevo todos los iconos. Va de 6.7% en 2000 a 72.7% en 2024, igual de lento/rápido que un país cualquiera según ese dato. Todo el audio pasa por un limitador compartido (`Tone.Limiter`).
- **Botón "Silenciar todo"**: detiene cualquier sonificación activa (selección o global) y deselecciona.

### Datos

- **Uso de internet**: Banco Mundial, *Individuals using the Internet (% of population)* (`IT.NET.USER.ZS`), crudo en `data/cruda_mundial/`. Procesado por `data/procesamiento/procesar_datos_mundial.py`, que descarta los agregados regionales/de ingreso que vienen mezclados con los países en el CSV del Banco Mundial (usando el campo `Region` de los metadatos — vacío en agregados, no en países reales). Resultado: `data/procesada_mundial/mundial_uso_internet.csv` — 210 países, 2000-2024. Se excluyó 2025 porque el Banco Mundial casi no tiene datos reportados todavía para ese año.
- **Población total**: Banco Mundial, *Population, total* (`SP.POP.TOTL`), bajada directo de su API pública (`data/cruda_mundial/poblacion_total_worldbank.json`). Procesada por la misma función de filtrado de agregados. Resultado: `data/procesada_mundial/mundial_poblacion.csv` — `iso3, anio, poblacion`.
- **Fronteras de países**: `js/mapa/mundo_paises.geojson`, de [Natural Earth](https://www.naturalearthdata.com/) (dominio público) vía el mirror [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector), resolución 110m (177 países). `js/main.js` lo convierte a `<path>` SVG en el navegador con la misma proyección que ubica los iconos.
- **Puntos de icono por país y conteo por año**: `data/procesamiento/procesar_datos_mundial.py`, función `procesar_fronteras_y_puntos()`. Para cada país, genera una nube fija de hasta 36 puntos dentro de su polígono real (rejection sampling con punto-en-polígono hecho a mano, semilla fija para que sea reproducible) y precalcula, por año, cuántos de esos puntos se muestran según la fórmula de usuarios estimados. Resultado: `mundial_puntos_icono.csv` (`iso3, idx, lon, lat`) y `mundial_iconos.csv` (`iso3, anio, icono_count, pct_usuarios_internet, poblacion, usuarios_estimados`).
- **% mundial por año**: misma función de ponderación pero agregada a nivel planeta, función `procesar_promedio_mundial()`. Resultado: `mundial_promedio.csv` (`anio, pct_mundial, usuarios_estimados, poblacion`), usado solo por el botón "Sonido global".
- **Iconos**: SVG de [twitter/twemoji](https://github.com/twitter/twemoji) (CC-BY 4.0) en `js/iconos/` — celular (`1f4f1`), laptop (`1f4bb`) y computador de escritorio (`1f5a5`). No existe un emoji oficial de "tablet" en Unicode, así que no se incluyó.
- **Sonidos de notificación**: tres efectos en `js/sonido/notificaciones/`, usados para la cacofonía por país. El sonido de choque de auto de la V1 (`js/sonido/choque-auto.mp3`) y los centroides de `js/mapa/paises_centroides.csv` quedan sin uso en esta versión (se mantienen por si una futura iteración los necesita).

### Limitaciones conocidas

- Natural Earth a 110m no resuelve ~40 países muy chicos (microestados, islas) — quedan fuera del mapa interactivo aunque tengan datos de uso de internet. Fiyi, por su forma partida por el antimeridiano, solo alcanzó 10 de los 36 puntos pedidos.
- La fórmula de ponderación (raíz cuadrada de usuarios estimados, normalizada contra el máximo global) es una elección de diseño para que el mapa se note legible — no es un estándar estadístico ni representa usuarios reales con precisión.

## Versión anterior (V1, Chile — archivada)

La V1 completa (gráficos de línea de fallecidos por distracción vs. abonados móviles en Chile, con su propia sonificación) quedó documentada en [`readme_V1.md`](readme_V1.md) y es recuperable desde el historial de git; el código actual de `index.html`/`js/main.js` ya no la muestra.
