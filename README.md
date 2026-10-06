# Proyecto_Infovis

El proyecto es una visualización multisensorial para la web (HTML, CSS y [Tone.js](https://tonejs.github.io/), sin librerías de gráficos) sobre la relación entre el aumento del uso de teléfonos móviles y la distracción como causa de muertes en el tránsito en Chile.

El mensaje central: mientras el celular se volvió parte de la calle (los abonados móviles activos se multiplicaron por más de 7 entre 2000 y 2025), los fallecidos por distracción — del peatón y del conductor — no dejan de sumar.

`index.html` / `js/main.js` combinan:
- Dos gráficos de línea (SVG simple, dibujado a mano, sin Plotly ni otra librería): fallecidos por distracción y celulares en uso, 2000-2025, cada uno con número grande, % de cambio desde 2000, y un punto marcador que sigue el año activo.
- Un slider de año y un botón "Reproducir cronología" que sincronizan ambos gráficos y avanzan automáticamente (~19,5 s en total).
- Sonificación con Tone.js: un sonido de choque (`js/sonido/choque-auto.mp3`) que arranca al iniciar la reproducción, y cada 5 segundos reales se suma otra copia encima — el sonido se vuelve cada vez más caótico a medida que avanza la cronología, sin depender de una rampa de volumen.

## Fuentes: 

- [Datos.gob](https://datos.gob.cl/): Datos generales de Chile

- [CONASET](https://www.conaset.cl/programa/observatorio-datos-estadistica/): Datos accidentes de tránsito

- [SUBTEL](https://www.subtel.gob.cl/estudios-y-estadisticas/telefonia/): Datos Telefonía

## Datasets

Archivos crudos descargados de las fuentes, en `data/cruda/`:

- **Abonados móviles** (SUBTEL): líneas móviles activas por mes, 2000-2026.
- **Series líneas telefónicas** (SUBTEL): líneas de telefonía fija por mes, 2000-2026.
- **Series tráfico móviles** (SUBTEL): minutos y llamadas cursadas por red móvil, 2000-2026.
- **Calidad de participantes** (CONASET/Carabineros): fallecidos y lesionados por rol en el siniestro (peatón, conductor, pasajero), 2000-2025.
- **Causas desglosadas** (CONASET/Carabineros): siniestros y víctimas por causa atribuida (alcohol, imprudencia, drogas/fatiga, fallas mecánicas, etc.), 2000-2025.
- **Evolución de siniestros de tránsito** (CONASET/Carabineros): serie histórica general de siniestros, fallecidos y tasa de motorización, 1972-2025.
- **Tasa de fallecidos cada 10.000 vehículos** (CONASET/Carabineros): fallecidos normalizados por tamaño del parque vehicular, 1990-2025.
- **Tipo de siniestro** (CONASET/Carabineros): siniestros y víctimas por tipo de evento (atropello, choque, colisión, etc.), 2000-2025.

El procesamiento que limpia y consolida estos archivos está en `data/procesamiento/procesar_datos.py`; los resultados quedan en `data/procesada/`.

## Datasets usados en la página

De todo lo anterior, `index.html` consume solo estos dos (los demás quedan procesados pero sin usar, disponibles para futuras iteraciones):

- `dataset_principal.csv`: se usa únicamente la columna de abonados móviles (SUBTEL), 2000-2025.
- `conaset_distraccion.csv`: fallecidos por la subcausa específica de "no prestar atención" — peatón que "cruza la calzada en forma sorpresiva o descuidada" y conductor que "no atiende a las condiciones de tránsito del momento" (renombrada "Distracción del conductor" por CONASET recién en 2025) — 2000-2025.

`js/main.js` hace dos ajustes sobre `conaset_distraccion.csv` (documentados ahí mismo, no en `procesar_datos.py`):

- **2000-2009**: el componente del conductor es un artefacto de clasificación de Carabineros (pasa de ~11 siniestros en 2000 a más de 10.000 en 2010 — no es un cambio real de conducta), así que para esos años se muestra solo el componente del peatón, que sí se registró de forma confiable en todo el período.
- **2000-2005**: además, esos valores se reescalan para que el máximo no supere 170. Es un ajuste manual pedido explícitamente para la visualización — no un cálculo estadístico ni una estimación — y queda señalado como tal en el código para que sea trazable.