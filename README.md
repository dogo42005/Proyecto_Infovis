# Proyecto_Infovis

El proyecto es una visualización multisensorial para la web (HTML, CSS, [Plotly.js](https://plotly.com/javascript/) y [Tone.js](https://tonejs.github.io/)) sobre la relación entre el aumento del uso de teléfonos móviles y los accidentes de tránsito en Chile, con foco en el peatón.

El mensaje central: entre 2000 y 2025 casi todos los indicadores de seguridad vial mejoraron — los atropellos a peatones cayeron a la mitad — pero el peatón es la única pieza que no mejoró: explica cada vez más de esas muertes, justo en los años en que el celular se volvió parte de la calle. Un gráfico titular muestra que la distracción (peatón + conductor, 2010→2025) ya explica un 16 % de las muertes en el tránsito, casi el doble que en 2010.

`index.html` / `js/main.js` combinan:
- Un gráfico titular en barras apiladas con el hallazgo principal.
- Cuatro paneles de apoyo (fallecidos por atropello, % atribuible al peatón, fallecidos por causa del conductor, uso del celular) como tarjetas de lectura rápida — número grande, delta y silueta de la serie — con el gráfico de línea completo detrás de "Ver evolución completa".
- Un slider de año y un botón "Reproducir cronología" que sincronizan los cuatro gráficos entre sí.
- Sonificación: un sonido de choque continuo (`js/sonido/choque-auto.mp3`) cuyo volumen sigue el uso del celular de cada año y cuyo timbre se abre según el % de fallecidos atribuible al peatón — dos parámetros sonoros distintos, no solo volumen.

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

De todo lo anterior, `index.html` consume estos cinco (los demás quedan procesados pero sin usar, disponibles para futuras iteraciones):

- `dataset_principal.csv`: une abonados móviles (SUBTEL) con fallecidos y siniestros por atropello (CONASET), 2000-2025.
- `conaset_causas_peaton.csv`: fallecidos por imprudencia y alcohol del peatón, 2000-2025.
- `conaset_causas_conductor.csv`: fallecidos por causas atribuibles al conductor (alcohol, imprudencia, drogas/fatiga, distracción), 2000-2025.
- `conaset_distraccion.csv`: fallecidos y siniestros por la subcausa específica de "no prestar atención" — peatón que "cruza la calzada en forma sorpresiva o descuidada" y conductor que "no atiende a las condiciones de tránsito del momento" (renombrada "Distracción del conductor" por CONASET recién en 2025) — 2000-2025. Alimenta el gráfico titular, recortado a 2010-2025: antes de esa fecha el conteo del conductor es un artefacto de clasificación de Carabineros, no un cambio real de conducta.
- `conaset_evolucion_general.csv`: serie histórica de fallecidos en todo tipo de siniestro, 1972-2025. Se usa como denominador del gráfico titular, para calcular qué porcentaje de todas las muertes en el tránsito es por distracción.