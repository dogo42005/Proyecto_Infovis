const YEAR_MIN = 2000;
const YEAR_MAX = 2024;
const YEAR_COUNT = YEAR_MAX - YEAR_MIN + 1;
const ANGLE_BAND = 360 / YEAR_COUNT;
const BAND_HYSTERESIS = 1.5;

const countrySelect = document.getElementById('pais');
const connectionStatus = document.getElementById('estado');
const orientationReadout = document.getElementById('lectura');
const orientationSupported = 'AbsoluteOrientationSensor' in window;

let connected = false;
let currentBand = null;
let lastAngle = null;
let requestTimer = null;

function sendToVisualization(message) {
  Protobject.Core.send(message).to('index.html');
}

function normalizedAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function bandForAngle(angle) {
  return Math.min(YEAR_COUNT - 1, Math.floor(normalizedAngle(angle) / ANGLE_BAND));
}

function circularDelta(angle, center) {
  return ((angle - center + 540) % 360) - 180;
}

function handleOrientation(data) {
  if (!data || typeof data !== 'object') return;
  const angle = Number(data.horizontal);
  if (!Number.isFinite(angle)) return;

  const normalized = normalizedAngle(angle);
  lastAngle = normalized;
  const candidateBand = bandForAngle(normalized);
  let bandChanged = false;
  if (currentBand === null) {
    currentBand = candidateBand;
    bandChanged = true;
  } else if (candidateBand !== currentBand) {
    const center = (currentBand + 0.5) * ANGLE_BAND;
    const delta = circularDelta(normalized, center);
    if (Math.abs(delta) >= ANGLE_BAND / 2 + BAND_HYSTERESIS) {
      currentBand = candidateBand;
      bandChanged = true;
    }
  }

  const year = YEAR_MIN + currentBand;
  orientationReadout.textContent = `Orientación: ${Math.round(normalized)}° · Año: ${year}`;
  if (bandChanged) sendToVisualization({ type: 'orientation-year', year });
}

function stopCountryRequests() {
  if (requestTimer !== null) {
    clearInterval(requestTimer);
    requestTimer = null;
  }
}

countrySelect.addEventListener('change', () => {
  sendToVisualization({ type: 'select-country', iso3: countrySelect.value });
});

Protobject.Core.onReceived((message) => {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'countries' && Array.isArray(message.countries)) {
    const selected = countrySelect.value;
    countrySelect.replaceChildren(new Option('Todos los países', ''));
    message.countries.forEach(({ iso3, name }) => {
      if (typeof iso3 === 'string' && typeof name === 'string') {
        countrySelect.add(new Option(name, iso3));
      }
    });
    countrySelect.disabled = false;
    countrySelect.value = message.selectedIso3 || selected || '';
    connected = true;
    connectionStatus.textContent = orientationSupported
      ? 'Teléfono conectado a la visualización.'
      : 'Teléfono conectado; este navegador no expone el sensor de orientación que usa Protobject.';
    stopCountryRequests();
  } else if (message.type === 'visualization-state') {
    if (Number.isInteger(message.year)) {
      const angle = lastAngle === null ? '' : ` · Orientación: ${Math.round(lastAngle)}°`;
      orientationReadout.textContent = `Año actual: ${message.year}${angle}`;
    }
    if (typeof message.selectedIso3 === 'string') {
      countrySelect.value = message.selectedIso3;
    }
  } else if (message.type === 'audio-warning') {
    connectionStatus.textContent = orientationSupported
      ? 'País seleccionado. Activa el audio una vez desde la visualización en el computador.'
      : 'País seleccionado. Activa el audio en el computador; este navegador móvil no expone el sensor de orientación de Protobject.';
  }
});

requestTimer = setInterval(() => {
  if (!connected) sendToVisualization({ type: 'request-countries' });
}, 1000);
sendToVisualization({ type: 'request-countries' });

if (orientationSupported) {
  Protobject.Orientation.onData(handleOrientation);
  Protobject.Orientation.start(300);
} else {
  connectionStatus.textContent = 'Este navegador no expone el sensor de orientación que usa Protobject.';
}
