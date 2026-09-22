// V1 — carga los CSV procesados, dibuja los tres gráficos (small multiples,
// nunca eje dual) y sincroniza slider + hover + sonificación entre ellos.

const COLOR = {
  context: '#2a78d6',
  hero: '#eb6834',
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
  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',');
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = Number(cells[i]); });
    return row;
  });
}

function baseLayout(yTitle, tickFormat) {
  return {
    margin: { l: 56, r: 16, t: 6, b: 30 },
    paper_bgcolor: COLOR.surface,
    plot_bgcolor: COLOR.surface,
    font: { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', color: COLOR.secondary, size: 12 },
    xaxis: {
      dtick: 5, tickformat: 'd', gridcolor: COLOR.grid, linecolor: COLOR.baseline,
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
    x: last.anio, y: last[yKey], xanchor: 'left', yanchor: 'middle',
    text: `  ${val}${suffix}`, showarrow: false, font: { color, size: 13, family: 'system-ui, sans-serif' },
  };
}

async function main() {
  const [principal, causas] = await Promise.all([
    fetchCSV('data/procesada/dataset_principal.csv'),
    fetchCSV('data/procesada/conaset_causas_peaton.csv'),
  ]);
  const causasByYear = Object.fromEntries(causas.map((r) => [r.anio, r]));
  const data = principal
    .map((r) => {
      const c = causasByYear[r.anio];
      const imprudencia_share = c ? (c.imprudencia_peaton_fallecidos / r.atropello_fallecidos) * 100 : null;
      return { ...r, imprudencia_share };
    })
    .sort((a, b) => a.anio - b.anio);

  const first = data[0];
  const last = data[data.length - 1];
  const byYear = Object.fromEntries(data.map((d) => [d.anio, d]));

  // --- deltas en cada card ---
  const pctDelta = (a, b) => Math.round((b / a - 1) * 100);
  document.getElementById('delta-fallecidos').textContent =
    `${first.atropello_fallecidos} → ${last.atropello_fallecidos} fallecidos (${pctDelta(first.atropello_fallecidos, last.atropello_fallecidos)}% desde ${first.anio})`;
  document.getElementById('delta-share').textContent =
    `${first.imprudencia_share.toFixed(0)}% → ${last.imprudencia_share.toFixed(0)}% (${first.anio}–${last.anio})`;
  document.getElementById('delta-penetracion').textContent =
    `${first.penetracion_cada_100_hab.toFixed(0)} → ${last.penetracion_cada_100_hab.toFixed(0)} abonados/100 hab. (+${pctDelta(first.penetracion_cada_100_hab, last.penetracion_cada_100_hab)}% desde ${first.anio})`;

  // --- charts ---
  const charts = [
    { div: 'chart-fallecidos', key: 'atropello_fallecidos', color: COLOR.context, yTitle: 'Fallecidos', tickFormat: ',', suffix: '' },
    { div: 'chart-share', key: 'imprudencia_share', color: COLOR.hero, yTitle: '% del total', tickFormat: '.0f', suffix: '%' },
    { div: 'chart-penetracion', key: 'penetracion_cada_100_hab', color: COLOR.hypothesis, yTitle: 'Abonados /100 hab.', tickFormat: ',.0f', suffix: '' },
  ];

  charts.forEach((c) => {
    const layout = baseLayout(c.yTitle, c.tickFormat);
    layout.shapes = [crosshairShape(first.anio)];
    layout.annotations = [endLabelAnnotation(data, c.key, c.color, c.suffix)];
    Plotly.newPlot(c.div, [makeTrace(data, c.key, c.color)], layout, {
      displayModeBar: false, responsive: true,
    });
    document.getElementById(c.div).on('plotly_hover', (evt) => {
      const year = evt.points[0].x;
      focusYear(year, c.div);
    });
  });

  // --- detalle sincronizado (slider + hover en cualquier gráfico) ---
  const slider = document.getElementById('year-slider');
  const yearBadge = document.getElementById('year-badge');
  const dPenetracion = document.getElementById('d-penetracion');
  const dFallecidos = document.getElementById('d-fallecidos');
  const dShare = document.getElementById('d-share');

  function focusYear(year, sourceDiv) {
    const row = byYear[year];
    if (!row) return;
    slider.value = year;
    yearBadge.textContent = year;
    dPenetracion.textContent = `${row.penetracion_cada_100_hab.toFixed(0)} /100 hab.`;
    dFallecidos.textContent = row.atropello_fallecidos.toLocaleString('es-CL');
    dShare.textContent = `${row.imprudencia_share.toFixed(0)}%`;
    charts.forEach((c) => {
      if (c.div === sourceDiv) return; // el que originó el hover ya se redibujó solo
      Plotly.relayout(c.div, { shapes: [crosshairShape(year)] });
    });
    if (sourceDiv) Plotly.relayout(sourceDiv, { shapes: [crosshairShape(year)] });
  }
  window.__focusYear = focusYear;

  slider.addEventListener('input', (e) => focusYear(Number(e.target.value)));
  focusYear(first.anio);

  // --- tabla accesible ---
  const tbody = document.querySelector('#data-table tbody');
  data.forEach((row) => {
    const tr = document.createElement('tr');
    [row.anio, row.penetracion_cada_100_hab.toFixed(1), row.atropello_fallecidos, `${row.imprudencia_share.toFixed(1)}%`]
      .forEach((val) => {
        const td = document.createElement('td');
        td.textContent = val;
        tr.appendChild(td);
      });
    tbody.appendChild(tr);
  });

  // --- sonificación: tono = % imprudencia, volumen = fallecidos, timbre = filtro que se abre con el tiempo ---
  setupSonification(data);
}

function setupSonification(data) {
  const btn = document.getElementById('play-btn');
  let playing = false;
  let synth, filter;

  const shares = data.map((d) => d.imprudencia_share);
  const fallecidos = data.map((d) => d.atropello_fallecidos);
  const [shareMin, shareMax] = [Math.min(...shares), Math.max(...shares)];
  const [fMin, fMax] = [Math.min(...fallecidos), Math.max(...fallecidos)];

  const freqLow = 220; // A3 — año tranquilo, % bajo
  const freqHigh = 660; // E5 — % alto, más tensión
  const lerp = (v, inMin, inMax, outMin, outMax) =>
    outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

  function ensureAudio() {
    if (synth) return;
    filter = new Tone.Filter(800, 'lowpass').toDestination();
    synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.2, release: 0.25 },
    }).connect(filter);
  }

  async function playTimeline() {
    ensureAudio();
    await Tone.start();
    playing = true;
    btn.textContent = '■ Detener';
    btn.setAttribute('aria-pressed', 'true');

    let i = 0;
    const stepMs = 320;
    const tick = () => {
      if (!playing || i >= data.length) {
        stop();
        return;
      }
      const row = data[i];
      const freq = lerp(row.imprudencia_share, shareMin, shareMax, freqLow, freqHigh);
      const gain = lerp(row.atropello_fallecidos, fMin, fMax, 0.12, 0.35);
      const cutoff = lerp(row.imprudencia_share, shareMin, shareMax, 500, 2200); // timbre: más brillante cuando % sube
      filter.frequency.rampTo(cutoff, 0.15);
      synth.volume.value = Tone.gainToDb(gain);
      synth.triggerAttackRelease(freq, '8n');
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
  }

  btn.addEventListener('click', () => {
    if (playing) stop();
    else playTimeline();
  });
}

main().catch((err) => {
  console.error(err);
  document.querySelector('.charts').innerHTML =
    '<p style="color:#c0392b">No se pudieron cargar los datos. Si abriste este archivo directamente (file://), levanta un servidor local — ver README.</p>';
});
