// V1 — dos barras únicas (distracción, celulares en uso) sincronizadas con
// el slider/reproducción, y una sonificación que apila capas del mismo
// choque cada 5 segundos reales para sonar cada vez más caótico.

async function fetchCSV(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No se pudo cargar ${path}: ${res.status}`);
  const text = await res.text();
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = Number(cells[i]); });
    return row;
  });
}

async function main() {
  const [principal, distraccion] = await Promise.all([
    fetchCSV('data/procesada/dataset_principal.csv'),
    fetchCSV('data/procesada/conaset_distraccion.csv'),
  ]);
  const distraccionByYear = Object.fromEntries(distraccion.map((r) => [r.anio, r]));

  // recortado a 2010+: la subcausa "distracción" del conductor es un
  // artefacto de clasificación antes de esa fecha (ver procesar_datos.py) —
  // toda la línea de tiempo parte ahí para no tener años sin dato.
  const data = principal
    .filter((r) => r.anio >= 2010)
    .map((r) => {
      const d = distraccionByYear[r.anio];
      const distraccion_fallecidos = d.distraccion_peaton_fallecidos + d.distraccion_conductor_fallecidos;
      return { anio: r.anio, abonados_moviles: r.abonados_moviles, distraccion_fallecidos };
    })
    .sort((a, b) => a.anio - b.anio);

  const first = data[0];
  const byYear = Object.fromEntries(data.map((d) => [d.anio, d]));
  const maxDistraccion = Math.max(...data.map((d) => d.distraccion_fallecidos));
  const maxCelular = Math.max(...data.map((d) => d.abonados_moviles));

  const slider = document.getElementById('year-slider');
  const yearBadge = document.getElementById('year-badge');
  const barDistraccion = document.getElementById('bar-distraccion');
  const valDistraccion = document.getElementById('val-distraccion');
  const deltaDistraccion = document.getElementById('delta-distraccion');
  const barCelular = document.getElementById('bar-celular');
  const valCelular = document.getElementById('val-celular');
  const deltaCelular = document.getElementById('delta-celular');

  function pctChange(valorActual, valorBase) {
    const pct = Math.round((valorActual / valorBase - 1) * 100);
    const arrow = pct >= 0 ? '↑' : '↓';
    return { pct, text: `${arrow} ${Math.abs(pct)}% desde 2010` };
  }

  function focusYear(year) {
    const row = byYear[year];
    if (!row) return;
    slider.value = year;
    yearBadge.textContent = year;

    barDistraccion.style.width = `${(row.distraccion_fallecidos / maxDistraccion) * 100}%`;
    valDistraccion.textContent = row.distraccion_fallecidos.toLocaleString('es-CL');
    const dDistraccion = pctChange(row.distraccion_fallecidos, first.distraccion_fallecidos);
    deltaDistraccion.textContent = dDistraccion.text;
    deltaDistraccion.style.color = dDistraccion.pct >= 0 ? 'var(--c-hero)' : 'var(--text-muted)';

    barCelular.style.width = `${(row.abonados_moviles / maxCelular) * 100}%`;
    valCelular.textContent = row.abonados_moviles.toLocaleString('es-CL');
    const dCelular = pctChange(row.abonados_moviles, first.abonados_moviles);
    deltaCelular.textContent = dCelular.text;
    deltaCelular.style.color = dCelular.pct >= 0 ? 'var(--c-hypothesis)' : 'var(--text-muted)';
  }
  window.__focusYear = focusYear;

  slider.addEventListener('input', (e) => focusYear(Number(e.target.value)));
  focusYear(first.anio);

  setupSonification(data);
}

const CRASH_URL = 'js/sonido/choque-auto.mp3';
const LAYER_INTERVAL_MS = 5000; // cada cuánto se suma una copia nueva del choque
const LAYER_GAIN_DB = -8; // volumen fijo por capa (varias capas se suman solas)

function setupSonification(data) {
  const btn = document.getElementById('play-btn');
  let playing = false;
  let buffer; // se decodifica una sola vez; cada capa reutiliza el mismo buffer
  const activeLayers = [];

  function ensureAudio() {
    if (buffer) return Promise.resolve();
    return new Promise((resolve) => {
      buffer = new Tone.ToneAudioBuffer(CRASH_URL, resolve);
    });
  }

  function spawnLayer() {
    const player = new Tone.Player(buffer).toDestination();
    player.volume.value = LAYER_GAIN_DB;
    player.start(Tone.now() + 0.05);
    activeLayers.push(player);
  }

  async function playTimeline() {
    await ensureAudio();
    await Tone.start();
    // el primer arranque "en frío" del AudioContext del navegador tarda un
    // instante en estabilizar su reloj interno; sin este respiro, el primer
    // start() puede chocar con él ("Start time must be strictly greater...").
    await new Promise((resolve) => setTimeout(resolve, 200));
    playing = true;
    btn.textContent = '■ Detener';
    btn.setAttribute('aria-pressed', 'true');

    spawnLayer(); // primera capa, al toque
    let lastLayerAt = performance.now();

    let i = 0;
    const stepMs = 1200; // 16 años (2010-2025) a este ritmo: ~19s, tiempo para que se apilen varias capas

    const tick = () => {
      if (!playing || i >= data.length) {
        stop();
        return;
      }
      window.__focusYear(data[i].anio);

      if (performance.now() - lastLayerAt >= LAYER_INTERVAL_MS) {
        spawnLayer();
        lastLayerAt = performance.now();
      }

      i += 1;
      setTimeout(tick, stepMs);
    };
    tick();
  }

  function stop() {
    playing = false;
    btn.textContent = '▶ Reproducir cronología';
    btn.setAttribute('aria-pressed', 'false');
    activeLayers.forEach((p) => {
      if (p.state === 'started') p.stop();
      p.dispose();
    });
    activeLayers.length = 0;
  }

  btn.addEventListener('click', () => {
    if (playing) {
      stop();
    } else {
      playTimeline().catch((err) => {
        console.error('Fallo la reproducción de la cronología:', err);
        stop();
      });
    }
  });
}

main().catch((err) => {
  console.error(err);
  document.querySelector('.bars').innerHTML =
    '<p style="color:#c0392b">No se pudieron cargar los datos. Si abriste este archivo directamente (file://), levanta un servidor local — ver README.</p>';
});
