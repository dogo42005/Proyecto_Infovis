# Contexto del proyecto — Grupo 8, IIC2026 Visualización de Información (PUC)

> Archivo de contexto para continuar el trabajo en otro chat. Estado al **jueves 26 de noviembre de 2026**.

## Equipo y enlaces

- **Grupo 8:** Catalina Isabel Díaz Oyanedel, Diego Jesús Olivares Pérez, Joaquín Alonso Toro Parra, Rocío Antonia Márquez Correa.
- GitHub Pages: https://dogo42005.github.io/Proyecto_Infovis/
- Repositorio: https://github.com/dogo42005/Proyecto_Infovis
- Documento de Google del informe E2: [pegar link]

## El proyecto

"El mundo se llenó de pantallas, país por país": un mapa mundial (2000–2024) donde cada país muestra íconos de dispositivos proporcionales a su uso de internet, ponderado por población y densidad. Los datos son del Banco Mundial y las fronteras de Natural Earth; está hecho en HTML/SVG con Tone.js.

- **Sonificación:** al seleccionar un país suena una cacofonía de notificaciones cuyo ritmo sigue la cantidad de íconos de ese país en el año (con raíz cuadrada del conteo). El modo "sonido global" sigue el % mundial ponderado, que va de 6,7 % en 2000 a 72,7 % en 2024. Todo pasa por un limitador.
- **Total de íconos en el mapa:** 37 en 2000 y 507 en 2024. Los países con al menos un ícono pasan de 15 a 137. El gráfico está en `fisicalizacion/grafico_iconos_por_anio.png`.

## Entrega 2 (la actual)

- **Entrega: hoy, jueves 26 de noviembre, 23:59.** Un único PDF por el formulario oficial; por otra vía se descuenta 1 punto. El atraso descuenta 0,5 puntos por día o fracción. Esta entrega cierra el curso.
- **Requisitos:** fisicalización (representación física de los datos y/o interacción tangible), una capa digital que enriquezca la experiencia, sonificación integrada y materiales baratos (Physical Viz Toolkit con Protobject).
- **Pauta de evaluación:**

| Criterio | Peso |
|---|---|
| Proceso iterativo (≥ 4 versiones con evidencia propia) | 25 % |
| Rationale de la evolución | 25 % |
| Revisiones R1, R2 y R3 | 15 % |
| Prototipo final físico-digital | 15 % |
| Feedback al otro grupo | 10 % |
| Evaluación con usuarios (pensar en voz alta) | 10 % |

  Sobre la nota grupal se aplica un modificador individual que sale de R1 y R3.
- **Estructura obligatoria del PDF:**
  1. Portada con 3 enlaces (GitHub Pages, repositorio, video público).
  2. Contexto: propósito (máx. 10 líneas) y procesamiento de datos (máx. 8).
  3. V1.
  4. R1.
  5. V2.
  6. R2.
  7. V3.
  8. R3.
  9. V4, con un balance de qué mejoró y qué no se cambió.
  10. Feedback al otro grupo: proyecto evaluado (5 líneas), feedback dado (12), lo que se llevaron (5).
  11. Evaluación con usuarios: bitácora con tiempo, cita literal y acción; heurísticas de Zuk-Carpendale; 3 preguntas de cierre; efecto en el proceso.
- **Campos de cada versión:** identificación (fecha y commit), evidencia (fotos obligatorias, video si hay interacción), qué cambió (8 líneas), rationale (12), qué se descartó (5).
- **Campos de cada revisión:** fecha, síntesis y decisiones (adoptado o descartado, y por qué), máx. 10 líneas.
- Fotos de 4 maquetas hechas el mismo día no cuentan como 4 versiones; se penaliza fuertemente.

## Feedback recibido en la E1 (errores que no se pueden repetir)

| Criterio | Nota | Por qué bajó |
|---|---|---|
| Proceso | 21/25 | Un solo video (V4); hubo un hueco de commits. |
| Rationale | 22/25 | Casi no usaron principios del curso; V2 justificó el cambio de tema, pero no el diseño. |
| Revisiones | 13/15 | Dos críticas del grupo 14 quedaron sin respuesta; atribuyeron a R3 cambios hechos antes. |
| Feedback al otro grupo | 10/10 | — |
| Implementación | 12/15 | El mapa no transmite el cambio sin interactuar; no hay leyenda de cuánto vale un ícono; el ritmo no calza con los íconos; los textos estaban desactualizados (el encabezado decía "V3"). |
| Usuarios | 1/10 | No hicieron pensar en voz alta; usaron R2 como sustituto. |

## Cronología E2 (calendario del curso y commits)

| Etapa | Fecha | Qué es | Commits |
|---|---|---|---|
| V1 | 29 oct – 2 nov | Teléfono que rota, **sin base**. El teléfono actúa como perilla (artefacto 02 del kit): los 360° se dividen en 25 bandas de 14,4°, una por año, con 1,5° de histéresis. Si Protobject no entrega lecturas en 4 s, se usa `deviceorientation`. Brújula en pantalla y selector de país. | `a01718b`, `b3bb295`, `3bd2288` (2 nov) |
| R1 | mar 3 nov | Equipo docente. **Qué dijeron: pendiente.** | — |
| V2 | 10–11 nov | **Base de cartón** que gira, aún sin marcas. Es un cambio físico; el código sigue igual al de V1. | `6ee8d81` (11 nov, merge) |
| R2 | jue 12 nov | Entre pares con el **grupo 32** (nos evaluaron y los evaluamos). | — |
| V3 | 13–16 nov | **Años 2000–2024 alrededor del círculo** (radio ~17,5 cm, sentido horario) y **flecha "AÑO" de 24 cm** (`fisicalizacion/plantilla_anios_flecha.pdf`). El giro horario avanza los años (en Android `alpha` crecía al revés, se invirtió con 360 − ángulo). **Vibración** en Android: 15 ms por año y pulsos de 50 ms al ritmo de la sonificación. "Todos los países" en el teléfono activa el sonido global. | `798f09a` (16 nov) |
| R3 | mar 17 nov | Equipo docente. **Qué dijeron: pendiente.** | — |
| V4 | 20–24 nov | **Se quita el sistema rotacional** "para una mejor fisicalización" (el detalle del porqué está pendiente; lo sabe Joaquín). Superficie táctil con **2 cámaras** (artefacto 07 del kit, `Protobject.HandSensor`): una cenital ubica la punta del índice (x, y) y una frontal mide la altura para distinguir "sobre" de "tocando". Se entrena 1 punto por año (25) y dos alturas; luego, en "modo tocar", se elige el año más cercano (radio 0,045). Usa cámaras traseras. Se eliminaron `control.html` y `js/protobject-control.js`, con lo que la brújula y la vibración ya no están. | `b956a02`, `87bc722`, `eff34b2` (20–22 nov) |

## R2: feedback que recibimos del grupo 32

- **Mensaje:** "El uso de internet a lo largo de los años en el mundo".
- **Lo físico:** "Interacción tangible y representación del avance de años. Aporta en la comprensión y la retención".
- **Usarlo:** "Rotamos la caja, y vimos la respuesta de la interacción en la pantalla. Fue bastante intuitivo".
- **Datos:** lo aprendieron por **la pantalla** (puntos en el mapa) y la frecuencia del sonido. El objeto no comunicaba el dato.
- **Conservar:** la interacción física, el sonido y los puntos del mapa.
- **Cambiar:**
  - (a) el año más visible en pantalla, centrado o sobre el mapa. **No está hecho**: hay que hacerlo o justificar por qué se descarta.
  - (b) en el objeto, indicar hacia qué lado avanzan los años y que son años. **Resuelto en V3** con los años y la flecha.

## R2: feedback que dimos al grupo 32

- Su proyecto: un ventilador cuya intensidad representa la intensidad del huracán sopla sobre una casa de cartón.
- **Usarlo:** "Solo se debía correr la visualización y se iniciaba automáticamente el ventilador". No hay interacción tangible.
- **Datos:** el impacto se aprende de forma cualitativa, pero se pierde lo cuantitativo; cuesta notar diferencias sutiles de intensidad.
- **Conservar:** el ventilador y la casa, porque son intuitivos.
- **Cambiar:** un tejado que capte más viento y aletas de papel a los lados de la fachada, para aumentar la superficie expuesta.
- **Lo que nos llevamos:** su pérdida de lo cuantitativo era también nuestro problema (la caja no mostraba el dato), lo que confirmó los años y la flecha de V3.

## Pendientes principales (detalle en PENDIENTES_E2.md)

1. **Evaluación con usuarios:** hacerla hoy con una persona externa (hoja en HOJA_OBSERVADOR.md).
2. Qué se dijo en **R1 y R3** y las decisiones que se tomaron con cada comentario.
3. **Por qué se quitó la rotación en V4**, con detalle y anclado a principios.
4. Por qué se agregó la base de cartón en V2.
5. V1: alternativas descartadas.
6. **Página web:**
   - el encabezado dice "Proyecto InfoVis · V3" (`index.html`, línea 121), hay que cambiarlo a V4;
   - el año en grande (respuesta a R2 a);
   - una leyenda de cuánto vale un ícono;
   - las instrucciones deben describir la V4.
7. Fotos y videos de cada versión, y el link del video final.

## Principios del curso para anclar el rationale

Mapeo natural (sentido horario = avanzar); descubribilidad y affordances/signifiers (años y flecha visibles); feedback inmediato (el pulso por año); codificación redundante multisensorial (vista, oído y tacto con el mismo dato); evitar la saturación (un solo flujo de audio); legibilidad a distancia; heurísticas de Zuk-Carpendale (importancia del dato poco clara, tamaños o distancias engañosos, falta de contexto, saturación, color confuso, interacción no descubrible, sonido incomprensible sin explicación).

## Cómo trabajar

- Escribir en español de Chile, claro, respetando los máximos de líneas de cada campo.
- No inventar datos: lo que el grupo no ha confirmado se marca `[COMPLETAR]` o `[CONFIRMAR]`.
- Cada cambio debe citar un principio del curso y su revisión de origen, con fechas coherentes con los commits.
