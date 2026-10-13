// V3 — mapa mundial de uso de internet. Cada país es su polígono real
// (frontera visible, clickeable en toda su superficie). La cantidad de
// íconos de dispositivos no es solo el % de uso: se pondera por población
// (usuarios estimados = % × población, escala raíz cuadrada) y se reparte en
// puntos fijos dentro del país real (ver procesar_datos_mundial.py). Clickear
// un país lo selecciona — se ocultan los íconos de los demás y solo suena
// ese país; un botón aparte hace sonar el mundo entero a la vez.

function parseCSVLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cells.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

function parseCell(v) {
  if (v === '') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

async function fetchCSV(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}: ${res.status}`);
  const text = await res.text();
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = parseCSVLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const cells = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = parseCell(cells[i]); });
    return row;
  });
}

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}: ${res.status}`);
  return res.text();
}

// Proyección equirectangular simple: lon [-180,180] -> x [0,W], lat [90,-90] -> y [0,H].
const MAP_W = 960;
const MAP_H = 480;
function project(lon, lat) {
  return { x: ((lon + 180) / 360) * MAP_W, y: ((90 - lat) / 180) * MAP_H };
}

const ICONOS = [
  ['icono-0', 'js/iconos/1f4f1-celular.svg'],
  ['icono-1', 'js/iconos/1f4bb-laptop.svg'],
  ['icono-2', 'js/iconos/1f5a5-computador.svg'],
];

async function cargarIconos(defs) {
  for (const [id, path] of ICONOS) {
    const svgText = await fetchText(path);
    const inner = svgText.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    defs.insertAdjacentHTML('beforeend', `<symbol id="${id}" viewBox="0 0 36 36">${inner}</symbol>`);
  }
}

function anilloToPath(ring) {
  return ring.map(([lon, lat], i) => {
    const { x, y } = project(lon, lat);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + 'Z';
}

function geometryToPath(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates.map(anilloToPath).join(' ');
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly) => poly.map(anilloToPath).join(' ')).join(' ');
  }
  return '';
}

// ISO_A3 viene en "-99" para un puñado de países (Francia, Noruega) en este
// dataset de Natural Earth; se cae a ADM0_A3 o WB_A3 en esos casos (mismo
// criterio que data/procesamiento/procesar_datos_mundial.py).
function codigoPais(props) {
  for (const campo of ['ISO_A3', 'ADM0_A3', 'WB_A3']) {
    const v = props[campo];
    if (v && v !== '-99') return v;
  }
  return null;
}

const ICON_SIZE = 6;

async function main() {
  const [usoRows, iconosRows, puntosRows, promedioRows, paisesGeo] = await Promise.all([
    fetchCSV('data/procesada_mundial/mundial_uso_internet.csv'),
    fetchCSV('data/procesada_mundial/mundial_iconos.csv'),
    fetchCSV('data/procesada_mundial/mundial_puntos_icono.csv'),
    fetchCSV('data/procesada_mundial/mundial_promedio.csv'),
    fetch('js/mapa/mundo_paises.geojson').then((r) => r.json()),
  ]);

  const defs = document.querySelector('#mapa-mundo defs');
  await cargarIconos(defs);

  const serieByIso3 = new Map();
  usoRows.forEach((r) => {
    if (!serieByIso3.has(r.iso3)) serieByIso3.set(r.iso3, {});
    serieByIso3.get(r.iso3)[r.anio] = r.pct_usuarios_internet;
  });

  const pctMundialByAnio = {}; // anio -> % mundial ponderado por población
  promedioRows.forEach((r) => { pctMundialByAnio[r.anio] = r.pct_mundial; });
  // El % mundial real va de ~6.7% (2000) a ~72.7% (2024), nunca 0-100 —
  // estirar el intervalo contra ese rango real (no contra 0-100) hace que el
  // cambio de ritmo entre el inicio y el final de la cronología se note.
  const pctMundialValores = promedioRows.map((r) => r.pct_mundial);
  const pctMundialMin = Math.min(...pctMundialValores);
  const pctMundialMax = Math.max(...pctMundialValores);

  const countByIso3Anio = new Map(); // iso3 -> {anio: icono_count}
  iconosRows.forEach((r) => {
    if (!countByIso3Anio.has(r.iso3)) countByIso3Anio.set(r.iso3, {});
    countByIso3Anio.get(r.iso3)[r.anio] = r.icono_count;
  });

  const puntosByIso3 = new Map(); // iso3 -> [{x,y}] (ya proyectados)
  puntosRows.forEach((r) => {
    if (!puntosByIso3.has(r.iso3)) puntosByIso3.set(r.iso3, []);
    puntosByIso3.get(r.iso3).push(project(r.lon, r.lat));
  });

  // Capa de fondo: TODOS los países del geojson (177), con su forma real —
  // da contexto geográfico aunque no tengan datos. Solo los que sí tienen
  // puntos/uso de internet quedan interactivos (clase .con-datos).
  const capaFondo = document.getElementById('capa-paises-fondo');
  const capaIconos = document.getElementById('capa-iconos');
  const paisesInfo = new Map(); // iso3 -> { pais, serie, puntos, countByAnio }

  let fondoHtml = '';
  paisesGeo.features.forEach((feat) => {
    const iso3 = codigoPais(feat.properties);
    if (!iso3) return;
    const d = geometryToPath(feat.geometry);
    const tieneDatos = serieByIso3.has(iso3) && puntosByIso3.has(iso3);
    fondoHtml += `<path class="pais-borde${tieneDatos ? ' con-datos' : ''}" data-iso3="${iso3}" fill-rule="evenodd" d="${d}" />`;
    if (tieneDatos) {
      paisesInfo.set(iso3, {
        pais: feat.properties.NAME || feat.properties.ADMIN || iso3,
        serie: serieByIso3.get(iso3),
        puntos: puntosByIso3.get(iso3),
        countByAnio: countByIso3Anio.get(iso3) || {},
      });
    }
  });
  capaFondo.innerHTML = fondoHtml;

  // Capa de íconos: un <g> por país CON datos, con sus <use> ya ubicados en
  // los puntos precalculados (reposar/ocultar según el año solo cambia
  // display, no posición).
  let iconosHtml = '';
  paisesInfo.forEach((info, iso3) => {
    let usos = '';
    info.puntos.forEach(({ x, y }, i) => {
      usos += `<use class="icono-dispositivo" href="#icono-${i % 3}" x="${(x - ICON_SIZE / 2).toFixed(2)}" y="${(y - ICON_SIZE / 2).toFixed(2)}" width="${ICON_SIZE}" height="${ICON_SIZE}" style="display:none" />`;
    });
    iconosHtml += `<g class="pais-iconos" data-iso3="${iso3}">${usos}</g>`;
  });
  capaIconos.innerHTML = iconosHtml;

  paisesInfo.forEach((info, iso3) => {
    info.usosEls = Array.from(capaIconos.querySelector(`[data-iso3="${CSS.escape(iso3)}"]`).children);
    info.borde = capaFondo.querySelector(`.pais-borde[data-iso3="${CSS.escape(iso3)}"]`);
  });

  const slider = document.getElementById('year-slider');
  const yearBadge = document.getElementById('year-badge');
  const tooltip = document.getElementById('tooltip');
  const mapaCard = document.querySelector('.mapa-card');
  const mapaSvg = document.getElementById('mapa-mundo');

  let currentYear = Number(slider.value);
  let selectedIso3 = null;

  function refrescarIconos() {
    paisesInfo.forEach((info, iso3) => {
      const count = info.countByAnio[currentYear] || 0;
      const mostrarPais = !selectedIso3 || iso3 === selectedIso3;
      info.usosEls.forEach((el, i) => { el.style.display = (mostrarPais && i < count) ? '' : 'none'; });
    });
  }

  function setYear(anio) {
    currentYear = anio;
    slider.value = anio;
    yearBadge.textContent = anio;
    refrescarIconos();
  }

  // --- Tooltip ---
  function positionTooltip(evt) {
    const rect = mapaCard.getBoundingClientRect();
    tooltip.style.left = `${evt.clientX - rect.left}px`;
    tooltip.style.top = `${evt.clientY - rect.top}px`;
  }
  function showTooltip(iso3, evt) {
    const info = paisesInfo.get(iso3);
    if (!info) return;
    const pct = info.serie[currentYear];
    tooltip.querySelector('.tt-pais').textContent = info.pais;
    tooltip.querySelector('.tt-pct').textContent =
      pct === undefined ? 'sin dato' : `${pct.toFixed(1)}% usa internet`;
    tooltip.style.display = 'block';
    positionTooltip(evt);
  }
  function hideTooltip() { tooltip.style.display = 'none'; }

  capaFondo.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.pais-borde.con-datos');
    if (el) showTooltip(el.dataset.iso3, e);
  });
  capaFondo.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') positionTooltip(e);
  });
  capaFondo.addEventListener('mouseout', (e) => {
    const el = e.target.closest('.pais-borde.con-datos');
    if (!el) return;
    const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.pais-borde') : null;
    if (related !== el) hideTooltip();
  });

  // --- Sonificación ---
  const NOTIF_URLS = [
    'js/sonido/notificaciones/u_03k5gu83c1-livechat-129007.mp3',
    'js/sonido/notificaciones/universfield-new-notification-036-485897.mp3',
    'js/sonido/notificaciones/universfield-new-notification-057-494255.mp3',
  ];
  let notifBuffers = [];
  let layerCounter = 0;
  let masterBus = null;
  const activeAudio = new Map(); // iso3 (o GLOBAL_KEY) -> { layers: [], timerId }
  let globalSoundOn = false;
  const GLOBAL_KEY = '__MUNDO__';

  function cargarBuffers() {
    return Promise.all(NOTIF_URLS.map((url) => new Promise((resolve) => {
      const buf = new Tone.ToneAudioBuffer(url, () => resolve(buf));
    }))).then((bufs) => { notifBuffers = bufs; });
  }

  function spawnLayer(iso3) {
    const rec = activeAudio.get(iso3);
    if (!rec || notifBuffers.length === 0) return;
    const buf = notifBuffers[layerCounter % notifBuffers.length];
    layerCounter += 1;
    const player = new Tone.Player(buf).connect(masterBus);
    player.volume.value = -8;
    player.start(Tone.now() + 0.02);
    rec.layers.push(player);
    setTimeout(() => {
      const idx = rec.layers.indexOf(player);
      if (idx >= 0) rec.layers.splice(idx, 1);
      player.dispose();
    }, buf.duration * 1000 + 80);
  }

  function getIconCount(iso3, anio) {
    const info = paisesInfo.get(iso3);
    if (!info) return 0;
    const v = info.countByAnio[anio];
    return v === undefined ? 0 : v;
  }

  // Devuelve el intervalo en ms para la próxima capa, o null si debe quedar
  // en silencio por ahora. El país seleccionado sigue la misma cantidad de
  // íconos que se ve en el mapa ese año (no el % crudo); el sonido global es
  // UN solo flujo (no 169 en paralelo, para que no sature) que sigue el %
  // mundial ponderado por población — mismo criterio, a escala del planeta.
  function intervaloMs(iso3) {
    if (iso3 === GLOBAL_KEY) {
      const pct = pctMundialByAnio[currentYear] || 0;
      const t = (pct - pctMundialMin) / (pctMundialMax - pctMundialMin);
      return Math.max(120, 2200 - t * (2200 - 120));
    }
    const count = getIconCount(iso3, currentYear);
    return count === 0 ? null : Math.max(150, 1800 - count * 45.8);
  }

  function scheduleNext(iso3) {
    const rec = activeAudio.get(iso3);
    if (!rec) return;
    const intervalMs = intervaloMs(iso3);
    if (intervalMs === null) {
      rec.timerId = setTimeout(() => scheduleNext(iso3), 500);
      return;
    }
    rec.timerId = setTimeout(() => {
      spawnLayer(iso3);
      scheduleNext(iso3);
    }, intervalMs);
  }

  function activarAudioPais(iso3) {
    if (activeAudio.has(iso3)) return;
    activeAudio.set(iso3, { layers: [], timerId: null });
    spawnLayer(iso3);
    scheduleNext(iso3);
  }

  function desactivarAudioPais(iso3) {
    const rec = activeAudio.get(iso3);
    if (!rec) return;
    clearTimeout(rec.timerId);
    rec.layers.forEach((p) => { try { p.stop(); } catch (e) { /* ya se detuvo sola */ } p.dispose(); });
    activeAudio.delete(iso3);
  }

  function actualizarEstadoVisualSeleccion() {
    paisesInfo.forEach((info) => { if (info.borde) info.borde.classList.remove('seleccionado'); });
    if (selectedIso3) {
      const info = paisesInfo.get(selectedIso3);
      if (info && info.borde) info.borde.classList.add('seleccionado');
    }
  }

  function actualizarBotonGlobal() {
    globalBtn.setAttribute('aria-pressed', String(globalSoundOn));
    globalBtn.textContent = globalSoundOn ? '◼ Detener sonido global' : '🌐 Sonido global';
  }

  function deseleccionar() {
    if (selectedIso3) desactivarAudioPais(selectedIso3);
    selectedIso3 = null;
    actualizarEstadoVisualSeleccion();
    refrescarIconos();
  }

  function pararSonidoGlobal() {
    if (!globalSoundOn) return;
    globalSoundOn = false;
    desactivarAudioPais(GLOBAL_KEY);
    actualizarBotonGlobal();
  }

  async function seleccionarPais(iso3) {
    if (!paisesInfo.has(iso3)) { deseleccionar(); return; }
    await Tone.start();
    pararSonidoGlobal();
    if (selectedIso3 === iso3) { deseleccionar(); return; }
    if (selectedIso3) desactivarAudioPais(selectedIso3);
    selectedIso3 = iso3;
    activarAudioPais(iso3);
    actualizarEstadoVisualSeleccion();
    refrescarIconos();
  }

  async function activarSonidoGlobal() {
    await Tone.start();
    deseleccionar();
    globalSoundOn = true;
    actualizarBotonGlobal();
    activarAudioPais(GLOBAL_KEY);
  }

  mapaSvg.addEventListener('click', (e) => {
    const el = e.target.closest('.pais-borde.con-datos');
    if (el) seleccionarPais(el.dataset.iso3).catch((err) => console.error(err));
    else deseleccionar();
  });

  const globalBtn = document.getElementById('global-audio-btn');
  globalBtn.addEventListener('click', () => {
    if (globalSoundOn) pararSonidoGlobal();
    else activarSonidoGlobal().catch((err) => console.error(err));
  });

  document.getElementById('stop-audio-btn').addEventListener('click', () => {
    pararSonidoGlobal();
    deseleccionar();
  });

  // --- Slider, scroll y reproducción automática ---
  slider.addEventListener('input', (e) => setYear(Number(e.target.value)));

  let wheelLock = false;
  mapaSvg.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => { wheelLock = false; }, 90);
    const dir = e.deltaY > 0 ? 1 : -1;
    const anio = Math.max(2000, Math.min(2024, currentYear + dir));
    setYear(anio);
  }, { passive: false });

  const playBtn = document.getElementById('play-btn');
  let playing = false;
  let playTimer = null;
  let autoActivoGlobalPorPlay = false;
  function stopPlay() {
    playing = false;
    playBtn.textContent = '▶ Reproducir cronología';
    playBtn.setAttribute('aria-pressed', 'false');
    clearTimeout(playTimer);
    if (autoActivoGlobalPorPlay) {
      pararSonidoGlobal();
      autoActivoGlobalPorPlay = false;
    }
  }
  function play() {
    playing = true;
    playBtn.textContent = '■ Detener';
    playBtn.setAttribute('aria-pressed', 'true');
    // Si no hay país seleccionado ni sonido global prendido, la cronología
    // sonaría en silencio total — se activa el sonido global solo (y se
    // apaga de nuevo al terminar/detener), así siempre se escucha avanzar.
    if (!globalSoundOn && !selectedIso3) {
      autoActivoGlobalPorPlay = true;
      activarSonidoGlobal().catch((err) => console.error(err));
    }
    let anio = currentYear >= 2024 ? 2000 : currentYear;
    const tick = () => {
      if (!playing) return;
      setYear(anio);
      if (anio >= 2024) { stopPlay(); return; }
      anio += 1;
      playTimer = setTimeout(tick, 450);
    };
    tick();
  }
  playBtn.addEventListener('click', () => { if (playing) stopPlay(); else play(); });

  masterBus = new Tone.Limiter(-3).toDestination();
  setYear(currentYear);
  cargarBuffers();
}

main().catch((err) => {
  console.error(err);
  document.querySelector('.mapa-card').innerHTML =
    '<p style="color:#ff8080;padding:16px">No se pudieron cargar los datos. Si abriste este archivo directamente (file://), levanta un servidor local — ver README.</p>';
});
