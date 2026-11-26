# Pendientes informe E2 — Grupo 8

Entrega: **hoy jueves 26/11, 23:59** · un solo PDF por el formulario oficial

## Línea de tiempo (calendario del curso + commits)

| Etapa | Fecha | Qué es | Commit |
|---|---|---|---|
| **V1** | 29–30 oct (avance en clase) → lista el 2 nov | Teléfono que rota, sin base | `a01718b`, `b3bb295`, `3bd2288` (2 nov) |
| **R1** | mar 3 nov | Equipo docente | — |
| **V2** | 10 nov (avance en clase) | Base de cartón, aún sin marcas, y arreglo de errores | `6ee8d81` (11 nov) ⚠️ |
| **R2** | jue 12 nov | Revisión entre pares | — |
| **V3** | 13 nov (avance en clase) → 16 nov | Años alrededor, flecha "AÑO", sentido horario y vibración | `798f09a` (16 nov) |
| **R3** | mar 17 nov | Equipo docente | — |
| **V4** | 20–24 nov | Se quita la rotación: superficie táctil con 2 cámaras | `b956a02`, `87bc722`, `eff34b2` (20–22 nov) |

⚠️ **Ojo con las fechas de V1 y V2:**
- Los commits de "arreglo del sensor" son del **2 de noviembre, antes de R1**, así que pertenecen al **estado final de V1**, no a V2.
- V2 es principalmente un cambio **físico** (la base de cartón). Hay que respaldarla con fotos del 10 u 11 de noviembre.
- El único commit de esos días es `6ee8d81` (11 nov), un merge sin cambios de diseño.
- Si en V2 se arreglaron otros errores después de R1, hay que identificarlos. Si no, se escribe que V2 fue un cambio físico y que el código siguió igual.

---

## Fotos y videos (los pasas después)
- [ ] V1: foto del teléfono rotando sin base
- [ ] V1: video corto girando, con sonido
- [ ] V2: foto de la base de cartón
- [ ] V2: video corto
- [ ] V3: foto del círculo con años y flecha
- [ ] V3: video girando, con sonido y vibración
- [ ] V4: foto de la superficie táctil y del montaje de las 2 cámaras
- [ ] V4: **video final público** (link para la portada)

> En la E1 se descontó por tener un solo video. Ideal: video en las 4 versiones, o al menos en V1, V3 y V4.

---

## 1. Portada
- [ ] Link del video final público

## 2. Contexto general
- [ ] Revisar el propósito de la fisicalización (máx. 10 líneas) y ajustarlo a la V4 táctil
- [ ] Revisar el procesamiento de datos (máx. 8 líneas)

## 3. V1 — Teléfono que rota sin base
- [ ] Qué se descartó: alternativas pensadas el 29–30 de octubre y por qué no

## 4. R1 — Equipo docente
- [ ] Qué dijeron el profesor y los ayudantes
- [ ] Cada comentario: ¿adoptado o descartado, y por qué?

## 5. V2 — Base de cartón
- [ ] Por qué agregaron la base: ¿qué problema tenía el teléfono suelto? ¿Lo dijo R1?
- [ ] ¿Hubo arreglos de código después de R1? ¿Cuáles?
- [ ] Qué se descartó

## 6. R2 — Entre pares (12 nov) ✅ casi completo
Lo que ya está, a partir del formulario recibido:
- Mensaje entendido: "el uso de internet a lo largo de los años en el mundo"
- Lo físico: interacción tangible y representación del avance de los años
- Usarlo: "rotamos la caja… fue bastante intuitivo"
- Datos: los aprendieron por **la pantalla** (puntos en el mapa) y **la frecuencia del sonido**. La caja no comunicaba el dato.
- Conservar: la interacción física, el sonido y los puntos del mapa
- Cambiar: (a) el año más visible en pantalla, centrado o sobre el mapa; (b) en el objeto, indicar hacia qué lado avanzan los años y que son años

Falta:
- [x] Grupo que los evaluó: grupo 32 (¿también el 32, o fue otro?)
- [ ] **Respuesta a (a), el año en pantalla: hoy NO está hecho.** El año sigue chico al lado del slider. Hay que hacerlo o justificar por qué se descarta. En la E1 se descontó por dejar críticas sin respuesta.
- [x] Respuesta a (b): años alrededor y flecha "AÑO" en V3

## 7. V3 — Años y flecha (13–16 nov)
- [ ] ¿Se probó la vibración? ¿Se sentía a través del cartón?

## 8. R3 — Equipo docente
- [ ] Qué dijeron
- [ ] Cada comentario: ¿adoptado o descartado, y por qué?
- [ ] ¿La idea de quitar la rotación salió de R3?

## 9. V4 — Sin rotación, superficie táctil
- [ ] **Por qué quitaron la rotación, con detalle.** "Mejor fisicalización" ¿en qué sentido? ¿Imprecisión del sensor? ¿El 2000 no coincidía? ¿Acceso directo a un año? ¿Lo pidió R3?
- [ ] Cómo se usa: ¿se toca el año con el dedo?
- [ ] Qué pasó con la vibración y el sonido en V4
- [ ] Qué se descartó
- [ ] **Balance V1 → V4**: qué mejoró y qué decidieron **no** cambiar, y por qué

## 10. Feedback al otro grupo (R2, 12 nov) ✅ borrador listo, a partir de las fotos del formulario
- [ ] Revisar el borrador y confirmar el estado en que vieron el prototipo
- [ ] Agregar fotos del formulario como evidencia (`Fotos/IMG_20261126_1118*.jpg`)

**Proyecto evaluado (máx. 5 líneas)**
Grupo 32. Fisicalizan el impacto de los huracanes: un ventilador cuya intensidad representa la intensidad del huracán sopla sobre una casa de cartón, que se mueve más mientras más fuerte es el viento. El ventilador arranca automáticamente al correr la visualización. Lo vimos operativo: el ventilador y la casa respondían a los datos. [CONFIRMAR estado]

**Feedback dado (máx. 12 líneas)**
- *Mensaje:* se entiende al usarlo, no solo al verlo: la intensidad del huracán y su impacto en las estructuras.
- *Lo físico:* es una representación de los datos, no solo un control. El viento real sobre la casa transmite el impacto de un modo que la pantalla no logra.
- *Usarlo:* no hay interacción tangible del usuario. Basta con correr la visualización y el ventilador parte solo, así que el usuario observa pero no manipula.
- *Datos:* el impacto se aprende de forma cualitativa, pero se pierde lo cuantitativo. Es difícil notar diferencias sutiles de intensidad entre huracanes solo por el movimiento de la casa, porque la variación del viento tiene poca resolución perceptual.
- *Conservar:* el ventilador y la casa. Son el núcleo del proyecto y se entienden al verlos por primera vez.
- *Cambiar:* agrandar el tejado y añadir aletas de papel a los lados de la fachada que da al viento. Así aumenta la superficie expuesta, la respuesta de la casa se amplifica y las diferencias de intensidad se notan más.

**Lo que nos llevamos (máx. 5 líneas)**
La pérdida de lo cuantitativo que vimos en el grupo 32 era también nuestro problema: en R2 nos dijeron que la caja controlaba el tiempo, pero el dato solo llegaba por la pantalla y el sonido. Eso confirmó la decisión de que el objeto mostrara qué se recorre (años y flecha en V3). También confirmamos que nuestra fisicalización tiene algo que a la de ellos le faltaba: una interacción tangible en la que el usuario controla la exploración y no solo observa. [CONFIRMAR / ajustar]

## 11. Evaluación con usuarios (en la E1 sacaron 1/10)
- [ ] **Hacer la sesión hoy** si no se ha hecho: una persona externa que nunca vio el prototipo, 5 a 10 min (usar `HOJA_OBSERVADOR.md`)
- [ ] Fecha y versión evaluada (V4)
- [ ] Qué tocó primero, desde dónde miró, dónde dudó
- [ ] Qué creyó que significaba el sonido (cita textual)
- [ ] Bitácora: tiempo · cita textual · acción física
- [ ] Heurísticas que fallaron
- [ ] Las 3 preguntas de cierre
- [ ] Efecto en el proceso. Si se hace hoy, se puede escribir que lo aprendido queda como trabajo futuro, o se aplica un cambio chico con su commit.

## Página web (antes de exportar)
- [ ] **El encabezado dice "Proyecto InfoVis · V3"** (`index.html`, línea 121). Es exactamente el error que se descontó en la E1. Cambiarlo a V4.
- [ ] El año en grande, que pidió R2 (ver punto 6)
- [ ] ¿Hay leyenda de cuánto representa un ícono? También se descontó en la E1.
- [ ] Revisar que las instrucciones de la página describan la V4 táctil, no la brújula

## Cierre
- [ ] Cada crítica de R1, R2 y R3 tiene respuesta
- [ ] Ningún cambio se atribuye a una revisión anterior a su commit
- [ ] Convertir a PDF y subirlo por el formulario oficial
