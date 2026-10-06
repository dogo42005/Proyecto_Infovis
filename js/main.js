// V2 — mapa mundial de uso de internet: un ícono de dispositivo por cada
// ~10% de la población conectada, por país y año. Doble clic en un país
// dispara una cacofonía de notificaciones (mono); un clic en un país y
// luego otro en un segundo país la pasa a estéreo (izquierda/derecha).

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

function dibujarGraticula(g) {
  let html = '';
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = project(lon, 0).x;
    html += `<line class="graticula" x1="${x}" y1="0" x2="${x}" y2="${MAP_H}" />`;
  }
  for (let lat = -90; lat <= 90; lat += 30) {
    const y = project(0, lat).y;
    html += `<line class="graticula" x1="0" y1="${y}" x2="${MAP_W}" y2="${y}" />`;
  }
  g.innerHTML = html;
}

// Hasta 10 iconos por país (uno cada ~10% de uso), en una grilla 5x2 centrada
// en el centroide del país.
const ICON_SIZE = 7;
const ICON_GAP = 1.3;
const ICON_COLS = 5;
const ICON_ROWS = 2;

function construirMarkupPais(country) {
  const x0 = -((ICON_COLS - 1) * (ICON_SIZE + ICON_GAP)) / 2;
  const y0 = -((ICON_ROWS - 1) * (ICON_SIZE + ICON_GAP)) / 2;
  let usos = '';
  for (let i = 0; i < ICON_COLS * ICON_ROWS; i++) {
    const col = i % ICON_COLS;
    const row = Math.floor(i / ICON_COLS);
    const x = x0 + col * (ICON_SIZE + ICON_GAP) - ICON_SIZE / 2;
    const y = y0 + row * (ICON_SIZE + ICON_GAP) - ICON_SIZE / 2;
    usos += `<use class="icono-dispositivo" href="#icono-${i % 3}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${ICON_SIZE}" height="${ICON_SIZE}" style="display:none" />`;
  }
  return `<g class="pais" data-iso3="${country.iso3}" transform="translate(${country.cx.toFixed(2)},${country.cy.toFixed(2)})">` +
    `<circle class="hit-area" r="15" /><circle class="anillo-activo" r="17" />${usos}</g>`;
}

function construirMapa(countries) {
  const capaPaises = document.getElementById('capa-paises');
  capaPaises.innerHTML = countries.map(construirMarkupPais).join('');
  const porIso3 = new Map(countries.map((c) => [c.iso3, c]));
  Array.from(capaPaises.children).forEach((g) => {
    const c = porIso3.get(g.dataset.iso3);
    if (!c) return;
    c.g = g;
    c.usosEls = Array.from(g.querySelectorAll('.icono-dispositivo'));
  });
  return porIso3;
}

async function main() {
  const [usoRows, centroidRows] = await Promise.all([
    fetchCSV('data/procesada_mundial/mundial_uso_internet.csv'),
    fetchCSV('data/procesada_mundial/mundial_centroides.csv'),
  ]);

  const defs = document.querySelector('#mapa-mundo defs');
  const capaGraticula = document.getElementById('capa-graticula');
  await cargarIconos(defs);
  dibujarGraticula(capaGraticula);

  const serieByIso3 = new Map();
  usoRows.forEach((r) => {
    if (!serieByIso3.has(r.iso3)) serieByIso3.set(r.iso3, {});
    serieByIso3.get(r.iso3)[r.anio] = r.pct_usuarios_internet;
  });

  const countries = centroidRows
    .map((r) => {
      const { x, y } = project(r.lon, r.lat);
      return { iso3: r.iso3, pais: r.pais, cx: x, cy: y, serie: serieByIso3.get(r.iso3) || {} };
    })
    .filter((c) => Object.keys(c.serie).length > 0);

  const countryByIso3 = construirMapa(countries);

  const slider = document.getElementById('year-slider');
  const yearBadge = document.getElementById('year-badge');
  const tooltip = document.getElementById('tooltip');
  const mapaCard = document.querySelector('.mapa-card');
  const capaPaises = document.getElementById('capa-paises');

  let currentYear = Number(slider.value);

  function setYear(anio) {
    currentYear = anio;
    slider.value = anio;
    yearBadge.textContent = anio;
    countries.forEach((c) => {
      const pct = c.serie[anio];
      const valor = pct === undefined ? 0 : pct;
      const count = Math.max(0, Math.min(10, Math.round(valor / 10)));
      c.usosEls.forEach((el, i) => { el.style.display = i < count ? '' : 'none'; });
    });
  }

  function getPct(iso3, anio) {
    const c = countryByIso3.get(iso3);
    if (!c) return 0;
    const v = c.serie[anio];
    return v === undefined ? 0 : v;
  }

  // --- Tooltip ---
  function positionTooltip(evt) {
    const rect = mapaCard.getBoundingClientRect();
    tooltip.style.left = `${evt.clientX - rect.left}px`;
    tooltip.style.top = `${evt.clientY - rect.top}px`;
  }
  function showTooltip(iso3, evt) {
    const c = countryByIso3.get(iso3);
    if (!c) return;
    const pct = c.serie[currentYear];
    tooltip.querySelector('.tt-pais').textContent = c.pais;
    tooltip.querySelector('.tt-pct').textContent =
      pct === undefined ? 'sin dato' : `${pct.toFixed(1)}% usa internet`;
    tooltip.style.display = 'block';
    positionTooltip(evt);
  }
  function hideTooltip() { tooltip.style.display = 'none'; }

  capaPaises.addEventListener('mouseover', (e) => {
    const g = e.target.closest('.pais');
    if (g) showTooltip(g.dataset.iso3, e);
  });
  capaPaises.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') positionTooltip(e);
  });
  capaPaises.addEventListener('mouseout', (e) => {
    const g = e.target.closest('.pais');
    if (!g) return;
    const related = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.pais') : null;
    if (related !== g) hideTooltip();
  });

  // --- Sonificación: Tone.Panner por país activo, capas de notificación que
  // se solapan más rápido mientras mayor es el % de uso de ese país. ---
  const NOTIF_URLS = [
    'js/sonido/notificaciones/u_03k5gu83c1-livechat-129007.mp3',
    'js/sonido/notificaciones/universfield-new-notification-036-485897.mp3',
    'js/sonido/notificaciones/universfield-new-notification-057-494255.mp3',
  ];
  let notifBuffers = [];
  let layerCounter = 0;
  const activeCountries = new Map(); // iso3 -> { panner, layers: [], timerId }
  let activeOrder = []; // hasta 2 iso3, el primero va a la izquierda

  function cargarBuffers() {
    return Promise.all(NOTIF_URLS.map((url) => new Promise((resolve) => {
      const buf = new Tone.ToneAudioBuffer(url, () => resolve(buf));
    }))).then((bufs) => { notifBuffers = bufs; });
  }

  function actualizarEstadoVisual() {
    countries.forEach((c) => {
      if (c.g) c.g.classList.remove('pais-activo', 'pan-left', 'pan-right', 'pan-center');
    });
    activeOrder.forEach((iso3, idx) => {
      const c = countryByIso3.get(iso3);
      if (!c || !c.g) return;
      c.g.classList.add('pais-activo');
      c.g.classList.add(activeOrder.length === 1 ? 'pan-center' : (idx === 0 ? 'pan-left' : 'pan-right'));
    });
  }

  function reasignarPans() {
    activeOrder.forEach((iso3, idx) => {
      const rec = activeCountries.get(iso3);
      if (!rec) return;
      rec.panner.pan.value = activeOrder.length === 1 ? 0 : (idx === 0 ? -1 : 1);
    });
  }

  function spawnLayer(iso3) {
    const rec = activeCountries.get(iso3);
    if (!rec || notifBuffers.length === 0) return;
    const buf = notifBuffers[layerCounter % notifBuffers.length];
    layerCounter += 1;
    const player = new Tone.Player(buf).connect(rec.panner);
    player.volume.value = -8;
    player.start(Tone.now() + 0.02);
    rec.layers.push(player);
    setTimeout(() => {
      const idx = rec.layers.indexOf(player);
      if (idx >= 0) rec.layers.splice(idx, 1);
      player.dispose();
    }, buf.duration * 1000 + 80);
  }

  function scheduleNext(iso3) {
    const rec = activeCountries.get(iso3);
    if (!rec) return;
    const pct = getPct(iso3, currentYear);
    // Más % de uso -> intervalo más corto -> las capas se solapan más.
    const intervalMs = Math.max(150, 1800 - pct * 15.8);
    rec.timerId = setTimeout(() => {
      spawnLayer(iso3);
      scheduleNext(iso3);
    }, intervalMs);
  }

  function deactivateCountry(iso3) {
    const rec = activeCountries.get(iso3);
    if (!rec) return;
    clearTimeout(rec.timerId);
    rec.layers.forEach((p) => { try { p.stop(); } catch (e) { /* ya se detuvo sola */ } p.dispose(); });
    rec.panner.dispose();
    activeCountries.delete(iso3);
    activeOrder = activeOrder.filter((x) => x !== iso3);
    actualizarEstadoVisual();
  }

  function deactivateAll() {
    [...activeCountries.keys()].forEach(deactivateCountry);
  }

  async function activateCountry(iso3, { solo } = {}) {
    await Tone.start();
    if (solo) deactivateAll();
    if (activeOrder.length >= 2 && !activeOrder.includes(iso3)) {
      deactivateCountry(activeOrder[0]);
    }
    if (!activeOrder.includes(iso3)) activeOrder.push(iso3);
    if (!activeCountries.has(iso3)) {
      const panner = new Tone.Panner(0).toDestination();
      activeCountries.set(iso3, { panner, layers: [], timerId: null });
      spawnLayer(iso3);
      scheduleNext(iso3);
    }
    reasignarPans();
    actualizarEstadoVisual();
  }

  function toggleSingle(iso3) {
    if (activeOrder.includes(iso3)) deactivateCountry(iso3);
    else activateCountry(iso3, { solo: false });
  }

  // Distingue un clic simple de la mitad de un doble clic antes de actuar.
  let clickTimer = null;
  let pendingIso = null;
  capaPaises.addEventListener('click', (e) => {
    const g = e.target.closest('.pais');
    if (!g) return;
    const iso3 = g.dataset.iso3;
    if (clickTimer && pendingIso === iso3) {
      clearTimeout(clickTimer); clickTimer = null; pendingIso = null;
      return;
    }
    pendingIso = iso3;
    clickTimer = setTimeout(() => {
      clickTimer = null; pendingIso = null;
      toggleSingle(iso3);
    }, 280);
  });
  capaPaises.addEventListener('dblclick', (e) => {
    const g = e.target.closest('.pais');
    if (!g) return;
    clearTimeout(clickTimer); clickTimer = null; pendingIso = null;
    activateCountry(g.dataset.iso3, { solo: true }).catch((err) => console.error(err));
  });

  document.getElementById('stop-audio-btn').addEventListener('click', deactivateAll);

  // --- Slider, scroll y reproducción automática ---
  slider.addEventListener('input', (e) => setYear(Number(e.target.value)));

  let wheelLock = false;
  document.getElementById('mapa-mundo').addEventListener('wheel', (e) => {
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
  function stopPlay() {
    playing = false;
    playBtn.textContent = '▶ Reproducir cronología';
    playBtn.setAttribute('aria-pressed', 'false');
    clearTimeout(playTimer);
  }
  function play() {
    playing = true;
    playBtn.textContent = '■ Detener';
    playBtn.setAttribute('aria-pressed', 'true');
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

  setYear(currentYear);
  cargarBuffers();
}

main().catch((err) => {
  console.error(err);
  document.querySelector('.mapa-card').innerHTML =
    '<p style="color:#ff8080;padding:16px">No se pudieron cargar los datos. Si abriste este archivo directamente (file://), levanta un servidor local — ver README.</p>';
});
