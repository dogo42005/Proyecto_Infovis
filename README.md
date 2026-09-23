# Proyecto_Infovis

El proyecto es una visualización multisensorial construida para la web que vivirá directamente en el navegador utilizando HTML, CSS y eventos de interacción, enfocada en mostrar la relación entre el aumento del uso de teléfonos móviles y los accidentes de peatones. A medida que avanza una animación temporal donde el ritmo de los cambios es parte integral del mensaje, la pantalla simulará la vista de una calle que se irá bloqueando progresivamente con ventanas emergentes (pop-ups) para representar la distracción visual. Esta narrativa interactiva se complementará con una capa de sonificación, utilizando la librería Tone.js y distintos íconos auditivos en formato MP3, integrando recursos como el archivo Audio_proyecto.mp3 junto con efectos de bocinas y choques, logrando así una pieza inmersiva donde el diseño asegura que la información no solo se vea, sino que realmente se entienda.

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

De todo lo anterior, `index.html` solo consume estos tres (los demás quedan procesados pero sin usar, disponibles para futuras iteraciones):

- `dataset_principal.csv`: une abonados móviles (SUBTEL) con fallecidos y siniestros por atropello (CONASET), 2000-2025.
- `conaset_causas_peaton.csv`: fallecidos por imprudencia y alcohol del peatón, 2000-2025.
- `conaset_causas_conductor.csv`: fallecidos por causas atribuibles al conductor (alcohol, imprudencia, drogas/fatiga, distracción), 2000-2025.