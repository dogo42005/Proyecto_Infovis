// V1 — carga los CSV procesados, dibuja los tres gráficos (small multiples,
// nunca eje dual) y sincroniza slider + hover + sonificación entre ellos.

const COLOR = {
  context: '#2a78d6',
  hero: '#1baf7a',
  conductor: '#008300',
  hypothesis: '#4a3aa7',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  muted: '#898781',
  secondary: '#52514e',
  surface: '#fcfcfb',
};

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

function baseLayout(yTitle, tickFormat, tickvals) {
  return {
    margin: { l: 56, r: 40, t: 6, b: 30 },
    paper_bgcolor: COLOR.surface,
    plot_bgcolor: COLOR.surface,
    font: { family: 'Arial, Helvetica, sans-serif', color: COLOR.secondary, size: 12 },
    xaxis: {
      // tickvals explícitos (no dtick + range): esa combinación con
      // yaxis.rangemode:'tozero' rompe la detección de hover en Plotly
      // 2.35.2 (confirmado con una reducción mínima) — dejamos que el eje
      // autorranguee y solo fijamos dónde caen los ticks.
      tickvals, tickformat: 'd', gridcolor: COLOR.grid, linecolor: COLOR.baseline,
      zeroline: false, fixedrange: true,
    },
    yaxis: {
      title: { text: yTitle, font: { size: 11, color: COLOR.muted } },
      rangemode: 'tozero', tickformat: tickFormat, gridcolor: COLOR.grid,
      linecolor: COLOR.baseline, zeroline: false, fixedrange: true,
    },
    shapes: [],
    showlegend: false,
  };
}

function crosshairShape(year) {
  return {
    type: 'line', x0: year, x1: year, yref: 'paper', y0: 0, y1: 1,
    line: { color: COLOR.muted, width: 1 },
  };
}

function makeTrace(data, yKey, color) {
  const x = data.map((d) => d.anio);
  const y = data.map((d) => d[yKey]);
  return {
    x, y, type: 'scatter', mode: 'lines', line: { color, width: 2 },
    hovertemplate: '%{y}<extra></extra>',
  };
}

function endLabelAnnotation(data, yKey, color, suffix = '') {
  const last = data[data.length - 1];
  const val = yKey === 'imprudencia_share' ? last[yKey].toFixed(0) : Math.round(last[yKey]).toLocaleString('es-CL');
  return {
    // xref 'paper' (borde derecho del área de trazado) en vez de atado al
    // año: así la etiqueta no se corta aunque el eje X termine justo en 2025.
    xref: 'paper', x: 1, y: last[yKey], xanchor: 'left', yanchor: 'middle',
    text: ` ${val}${suffix}`, showarrow: false, font: { color, size: 13, family: 'Arial, Helvetica, sans-serif' },
  };
}

// Silueta minimalista (sin ejes, sin hover) del detalle que hay detrás del
// número grande — decorativa: el gráfico interactivo completo vive dentro
// de <details>, esta solo insinúa la forma para quien no lo abra.
function renderSparkline(div, data, yKey, color) {
  const x = data.map((d) => d.anio);
  const y = data.map((d) => d[yKey]);
  const last = data[data.length - 1];
  Plotly.newPlot(div, [
    { x, y, type: 'scatter', mode: 'lines', line: { color: COLOR.baseline, width: 1.5 }, hoverinfo: 'skip' },
    { x: [last.anio], y: [last[yKey]], type: 'scatter', mode: 'markers', marker: { color, size: 6 }, hoverinfo: 'skip' },
  ], {
    margin: { l: 0, r: 0, t: 2, b: 0 },
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    xaxis: { visible: false },
    yaxis: { visible: false, rangemode: 'tozero' },
    showlegend: false,
  }, { staticPlot: true, responsive: true });
}

// El titular: % de fallecidos en TODO tipo de siniestro (no solo atropellos)
// atribuible a que el peatón o el conductor no prestaban atención, 2010 vs
// 2025. Se recorta a 2010+ porque antes la subcausa del conductor es un
// artefacto de clasificación (ver procesar_datos.py), no un cambio real.
function renderHeadline(distraccion, evolucion) {
  const evoByYear = Object.fromEntries(evolucion.map((r) => [r.anio, r]));
  const rows = [2010, 2025].map((anio) => {
    const d = distraccion.find((r) => r.anio === anio);
    const total = evoByYear[anio].fallecidos;
    const distraccionFallecidos = d.distraccion_peaton_fallecidos + d.distraccion_conductor_fallecidos;
    const pctDistraccion = (distraccionFallecidos / total) * 100;
    return { anio, pctDistraccion, pctOtras: 100 - pctDistraccion };
  });

  document.getElementById('headline-pct').textContent = `${Math.round(rows[1].pctDistraccion)}%`;

  const y = rows.map((r) => String(r.anio));
  const traceDistraccion = {
    x: rows.map((r) => r.pctDistraccion), y, type: 'bar', orientation: 'h', name: 'Distracción',
    marker: { color: COLOR.hero },
    text: rows.map((r) => `${r.pctDistraccion.toFixed(1)}%`),
    textposition: 'inside', insidetextanchor: 'middle',
    textfont: { color: '#ffffff', size: 14, family: 'Arial, Helvetica, sans-serif' },
    hovertemplate: 'Distracción: %{x:.1f}%<extra></extra>',
  };
  const traceOtras = {
    x: rows.map((r) => r.pctOtras), y, type: 'bar', orientation: 'h', name: 'Otras causas',
    marker: { color: COLOR.baseline },
    hovertemplate: 'Otras causas: %{x:.0f}%<extra></extra>',
  };

  Plotly.newPlot('chart-distraccion', [traceDistraccion, traceOtras], {
    barmode: 'stack',
    margin: { l: 44, r: 16, t: 6, b: 26 },
    paper_bgcolor: COLOR.surface,
    plot_bgcolor: COLOR.surface,
    font: { family: 'Arial, Helvetica, sans-serif', color: COLOR.secondary, size: 13 },
    xaxis: { range: [0, 100], ticksuffix: '%', gridcolor: COLOR.grid, linecolor: COLOR.baseline, zeroline: false, fixedrange: true },
    yaxis: {
      type: 'category', gridcolor: COLOR.grid, linecolor: COLOR.baseline,
      zeroline: false, fixedrange: true, autorange: 'reversed',
    },
    showlegend: false,
  }, { displayModeBar: false, responsive: true });
}

async function main() {
  const [principal, causasPeaton, causasConductor, distraccion, evolucion] = await Promise.all([
    fetchCSV('data/procesada/dataset_principal.csv'),
    fetchCSV('data/procesada/conaset_causas_peaton.csv'),
    fetchCSV('data/procesada/conaset_causas_conductor.csv'),
    fetchCSV('data/procesada/conaset_distraccion.csv'),
    fetchCSV('data/procesada/conaset_evolucion_general.csv'),
  ]);
  renderHeadline(distraccion, evolucion);

  const peatonByYear = Object.fromEntries(causasPeaton.map((r) => [r.anio, r]));
  const conductorByYear = Object.fromEntries(causasConductor.map((r) => [r.anio, r]));
  const data = principal
    .map((r) => {
      const p = peatonByYear[r.anio];
      const c = conductorByYear[r.anio];
      const imprudencia_share = p ? (p.imprudencia_peaton_fallecidos / r.atropello_fallecidos) * 100 : null;
      const conductor_fallecidos = c ? c.fallecidos : null;
      return { ...r, imprudencia_share, conductor_fallecidos };
    })
    .sort((a, b) => a.anio - b.anio);

  const first = data[0];
  const last = data[data.length - 1];
  const byYear = Object.fromEntries(data.map((d) => [d.anio, d]));

  // --- deltas en cada card (texto largo, dentro del detalle expandible) ---
  const pctDelta = (a, b) => Math.round((b / a - 1) * 100);
  document.getElementById('delta-fallecidos').textContent =
    `${first.atropello_fallecidos} → ${last.atropello_fallecidos} fallecidos (${pctDelta(first.atropello_fallecidos, last.atropello_fallecidos)}% desde ${first.anio})`;
  document.getElementById('delta-share').textContent =
    `${first.imprudencia_share.toFixed(0)}% → ${last.imprudencia_share.toFixed(0)}% (${first.anio}–${last.anio})`;
  document.getElementById('delta-conductor').textContent =
    `${first.conductor_fallecidos} → ${last.conductor_fallecidos} fallecidos (${pctDelta(first.conductor_fallecidos, last.conductor_fallecidos)}% desde ${first.anio})`;
  document.getElementById('delta-celular').textContent =
    `${first.penetracion_cada_100_hab.toFixed(0)} → ${last.penetracion_cada_100_hab.toFixed(0)} cada 100 personas (+${pctDelta(first.penetracion_cada_100_hab, last.penetracion_cada_100_hab)}% desde ${first.anio})`;

  // --- charts ---
  const charts = [
    { stat: 'fallecidos', div: 'chart-fallecidos', key: 'atropello_fallecidos', color: COLOR.context, yTitle: 'Fallecidos', tickFormat: ',', suffix: '', fmt: (v) => Math.round(v).toLocaleString('es-CL') },
    { stat: 'share', div: 'chart-share', key: 'imprudencia_share', color: COLOR.hero, yTitle: '% del total', tickFormat: '.0f', suffix: '%', fmt: (v) => `${v.toFixed(0)}%` },
    { stat: 'conductor', div: 'chart-conductor', key: 'conductor_fallecidos', color: COLOR.conductor, yTitle: 'Fallecidos', tickFormat: ',', suffix: '', fmt: (v) => Math.round(v).toLocaleString('es-CL') },
    { stat: 'celular', div: 'chart-celular', key: 'penetracion_cada_100_hab', color: COLOR.hypothesis, yTitle: 'Cada 100 personas', tickFormat: ',.0f', suffix: '', fmt: (v) => Math.round(v).toLocaleString('es-CL') },
  ];

  let currentYear = first.anio;
  const tickvals = [];
  for (let y = first.anio; y <= last.anio; y += 2) tickvals.push(y);

  charts.forEach((c) => {
    // El gráfico completo vive detrás de un <details> cerrado por defecto.
    // Renderizarlo de entrada mientras está oculto (display:none) lo deja
    // medido en 0×0 para siempre — ni un resize() posterior lo arregla del
    // todo (el hover queda desalineado). Se renderiza recién al abrirlo.
    c.rendered = false;
    c.renderFull = () => {
      if (c.rendered) return;
      c.rendered = true;
      const layout = baseLayout(c.yTitle, c.tickFormat, tickvals);
      layout.shapes = [crosshairShape(currentYear)];
      layout.annotations = [endLabelAnnotation(data, c.key, c.color, c.suffix)];
      const gd = document.getElementById(c.div);
      Plotly.newPlot(gd, [makeTrace(data, c.key, c.color)], layout, {
        displayModeBar: false, responsive: true,
      });
      // 'plotly_hover' no dispara de forma confiable para estos charts
      // (reproducido: llega el mousemove nativo, el estado interno de
      // Plotly es idéntico al de un chart que sí funciona, pero el evento
      // no sale — no se pudo aislar la causa exacta). Se calcula el año
      // directamente desde la posición del mouse, con los mismos datos
      // (margen, rango de ejes) que Plotly ya tiene calculados — no depende
      // de que su sistema de eventos de hover decida disparar o no.
      gd.addEventListener('mousemove', (evt) => {
        const xaxis = gd._fullLayout.xaxis;
        const m = gd._fullLayout.margin;
        const rect = gd.getBoundingClientRect();
        const plotWidthPx = gd._fullLayout.width - m.l - m.r;
        const xPx = evt.clientX - rect.left - m.l;
        const frac = Math.min(1, Math.max(0, xPx / plotWidthPx));
        const xVal = xaxis.range[0] + frac * (xaxis.range[1] - xaxis.range[0]);
        focusYear(Math.round(xVal), c.div);
      });
    };

    // vista rápida: número grande + flecha de cambio + silueta de la serie,
    // para leer el mensaje en segundos sin tener que trazar la línea completa
    const pct = pctDelta(first[c.key], last[c.key]);
    const arrow = last[c.key] >= first[c.key] ? '↑' : '↓';
    document.getElementById(`stat-${c.stat}`).textContent = c.fmt(last[c.key]);
    const deltaEl = document.getElementById(`stat-delta-${c.stat}`);
    deltaEl.textContent = `${arrow} ${Math.abs(pct)}% desde ${first.anio}`;
    deltaEl.style.color = c.color;
    renderSparkline(`spark-${c.stat}`, data, c.key, c.color);
  });

  document.querySelectorAll('details.chart-detail').forEach((el) => {
    const plotId = el.querySelector('.plot').id;
    const c = charts.find((ch) => ch.div === plotId);
    el.addEventListener('toggle', () => {
      if (el.open) c.renderFull();
    });
  });

  // --- detalle sincronizado (slider + hover en cualquier gráfico) ---
  const slider = document.getElementById('year-slider');
  const yearBadge = document.getElementById('year-badge');
  const dCelular = document.getElementById('d-celular');
  const dFallecidos = document.getElementById('d-fallecidos');
  const dShare = document.getElementById('d-share');
  const dConductor = document.getElementById('d-conductor');

  function focusYear(year, sourceDiv) {
    const row = byYear[year];
    if (!row) return;
    currentYear = year;
    slider.value = year;
    yearBadge.textContent = year;
    dCelular.textContent = `${row.penetracion_cada_100_hab.toFixed(0)} /100 personas`;
    dFallecidos.textContent = row.atropello_fallecidos.toLocaleString('es-CL');
    dShare.textContent = `${row.imprudencia_share.toFixed(0)}%`;
    dConductor.textContent = row.conductor_fallecidos.toLocaleString('es-CL');
    charts.forEach((c) => {
      if (!c.rendered || c.div === sourceDiv) return; // sin renderizar, o el que originó el hover ya se redibujó solo
      Plotly.relayout(c.div, { shapes: [crosshairShape(year)] });
    });
    if (sourceDiv) Plotly.relayout(sourceDiv, { shapes: [crosshairShape(year)] });
  }
  window.__focusYear = focusYear;

  slider.addEventListener('input', (e) => focusYear(Number(e.target.value)));
  focusYear(first.anio);

  // --- sonificación: choque continuo — volumen según cantidad de accidentes, timbre según % del peatón ---
  setupSonification(data);
}

const CRASH_URL = 'js/sonido/choque-auto.mp3';
const CRASH_GAIN_MIN = 0.05; // el año con menos celulares en uso: apenas se escucha
const CRASH_GAIN_MAX = 1.0; // el año con más celulares en uso: al frente de la mezcla

function setupSonification(data) {
  const btn = document.getElementById('play-btn');
  let playing = false;
  let filter, crashPlayer;

  const shares = data.map((d) => d.imprudencia_share);
  const [shareMin, shareMax] = [Math.min(...shares), Math.max(...shares)];
  const penetracion = data.map((d) => d.penetracion_cada_100_hab);
  const [pMin, pMax] = [Math.min(...penetracion), Math.max(...penetracion)];

  const lerp = (v, inMin, inMax, outMin, outMax) =>
    outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

  function ensureAudio() {
    if (filter) return Promise.resolve();
    filter = new Tone.Filter(500, 'lowpass').toDestination();
    return new Promise((resolve) => {
      crashPlayer = new Tone.Player({ url: CRASH_URL, onload: resolve }).connect(filter);
    });
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

    let i = 0;
    const stepMs = 320;

    // el choque es un sample largo (~30s): se dispara UNA sola vez y suena
    // continuo de fondo — retriggerlo cada año apilaría copias enteras unas
    // sobre otras. Lo que cambia cada 320ms, en sincronía con el año, es su
    // volumen — según el uso del celular ESE año, no según el tiempo transcurrido:
    // el mensaje es "a más celular, más presente el choque", no "más tarde, más fuerte".
    crashPlayer.volume.value = Tone.gainToDb(lerp(data[0].penetracion_cada_100_hab, pMin, pMax, CRASH_GAIN_MIN, CRASH_GAIN_MAX));
    crashPlayer.start(Tone.now() + 0.1);

    const tick = () => {
      if (!playing || i >= data.length) {
        stop();
        return;
      }
      const row = data[i];
      const cutoff = lerp(row.imprudencia_share, shareMin, shareMax, 500, 2600); // timbre: más brillante cuando % sube
      filter.frequency.rampTo(cutoff, (stepMs / 1000) * 0.85);

      const crashGain = lerp(row.penetracion_cada_100_hab, pMin, pMax, CRASH_GAIN_MIN, CRASH_GAIN_MAX);
      crashPlayer.volume.rampTo(Tone.gainToDb(crashGain), (stepMs / 1000) * 0.85);

      window.__focusYear(row.anio);
      i += 1;
      setTimeout(tick, stepMs);
    };
    tick();
  }

  function stop() {
    playing = false;
    btn.textContent = '▶ Reproducir cronología';
    btn.setAttribute('aria-pressed', 'false');
    if (crashPlayer && crashPlayer.state === 'started') crashPlayer.stop();
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
  document.querySelector('.charts').innerHTML =
    '<p style="color:#c0392b">No se pudieron cargar los datos. Si abriste este archivo directamente (file://), levanta un servidor local — ver README.</p>';
});
