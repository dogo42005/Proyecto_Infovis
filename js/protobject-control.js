const YEAR_MIN = 2000;
const YEAR_MAX = 2024;
const YEAR_COUNT = YEAR_MAX - YEAR_MIN + 1;
const ANGLE_BAND = 360 / YEAR_COUNT;
const BAND_HYSTERESIS = 1.5;

const countrySelect = document.getElementById('pais');
const connectionStatus = document.getElementById('estado');
const headingReadout = document.getElementById('rumbo');
const verticalReadout = document.getElementById('vertical');
const yearReadout = document.getElementById('anio-orientacion');
const sensorReadout = document.getElementById('sensor-usado');
const compassNeedle = document.getElementById('aguja');
const activateButton = document.getElementById('activar-brujula');
const protobjectSensorSupported = 'AbsoluteOrientationSensor' in window;

let connected = false;
let currentBand = null;
let lastYear = null;
let requestTimer = null;
let sensorStarted = false;
let browserSensorStarted = false;
let sensorTimeout = null;
let lastProtobjectReadingAt = 0;

sensorReadout.textContent = protobjectSensorSupported || window.DeviceOrientationEvent
  ? 'listo para activar'
  : 'no compatible';

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

function updateCompass(angle, vertical, source) {
  if (!Number.isFinite(angle)) return;
  const normalized = normalizedAngle(angle);
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
  headingReadout.textContent = `${normalized.toFixed(1)}°`;
  verticalReadout.textContent = Number.isFinite(vertical) ? `${vertical.toFixed(1)}°` : 'no disponible';
  yearReadout.textContent = String(year);
  sensorReadout.textContent = source;
  compassNeedle.style.transform = `translate(-50%, -100%) rotate(${-normalized}deg)`;
  lastYear = year;
  if (bandChanged) sendToVisualization({ type: 'orientation-year', year });
}

function handleProtobjectOrientation(data) {
  if (!data || typeof data !== 'object') return;
  const horizontal = Number(data.horizontal);
  if (!Number.isFinite(horizontal)) return;
  lastProtobjectReadingAt = Date.now();
  if (sensorTimeout !== null) {
    clearTimeout(sensorTimeout);
    sensorTimeout = null;
  }
  activateButton.textContent = 'Brújula activa';
  updateCompass(horizontal, Number(data.vertical), 'Protobject');
}

function handleBrowserOrientation(event) {
  if (protobjectSensorSupported && Date.now() - lastProtobjectReadingAt < 2000) return;

  const compassHeading = event.webkitCompassHeading == null ? NaN : Number(event.webkitCompassHeading);
  const alpha = event.alpha == null ? NaN : Number(event.alpha);
  const hasCompassHeading = Number.isFinite(compassHeading);
  const hasAbsoluteHeading = event.absolute === true && Number.isFinite(alpha);
  const heading = hasCompassHeading ? compassHeading : alpha;
  if (!Number.isFinite(heading)) return;

  if (sensorTimeout !== null) {
    clearTimeout(sensorTimeout);
    sensorTimeout = null;
  }
  activateButton.textContent = 'Brújula activa';
  const source = hasCompassHeading || hasAbsoluteHeading
    ? 'Brújula del navegador'
    : 'Orientación relativa del navegador';
  updateCompass(heading, event.beta == null ? NaN : Number(event.beta), source);
}

async function startBrowserSensor() {
  const OrientationEvent = window.DeviceOrientationEvent;
  if (!OrientationEvent) {
    sensorReadout.textContent = 'no compatible';
    connectionStatus.textContent = 'Este navegador no ofrece un sensor de orientación compatible.';
    activateButton.disabled = false;
    return;
  }

  try {
    if (typeof OrientationEvent.requestPermission === 'function') {
      const permission = await OrientationEvent.requestPermission();
      if (permission !== 'granted') throw new Error('El permiso del sensor fue rechazado.');
    }
    window.addEventListener('deviceorientation', handleBrowserOrientation, true);
    browserSensorStarted = true;
    sensorStarted = true;
    sensorReadout.textContent = 'navegador · esperando sensor';
    connectionStatus.textContent = 'Sensor del navegador activado. El rumbo indica si está referido al norte o es relativo.';
  } catch (error) {
    sensorReadout.textContent = 'permiso denegado';
    connectionStatus.textContent = error instanceof Error ? error.message : 'No se pudo acceder al sensor de orientación.';
    activateButton.disabled = false;
  }
}

async function activateCompass() {
  if (browserSensorStarted) return;
  if (sensorStarted && protobjectSensorSupported && lastProtobjectReadingAt === 0) {
    activateButton.disabled = true;
    activateButton.textContent = 'Iniciando sensor del navegador…';
    await startBrowserSensor();
    return;
  }
  if (sensorStarted) return;
  activateButton.disabled = true;
  sensorReadout.textContent = 'solicitando acceso…';

  if (protobjectSensorSupported) {
    Protobject.Orientation.onData(handleProtobjectOrientation);
    Protobject.Orientation.start(300);
    sensorStarted = true;
    sensorReadout.textContent = 'Protobject · esperando sensor';
    activateButton.textContent = 'Esperando brújula…';
    connectionStatus.textContent = 'Activando el sensor de orientación de Protobject…';
    sensorTimeout = setTimeout(() => {
      if (lastProtobjectReadingAt > 0) return;
      sensorReadout.textContent = 'sin lecturas de Protobject';
      if (window.DeviceOrientationEvent) {
        connectionStatus.textContent = 'Protobject no entrega lecturas. Pulsa “Probar sensor del navegador” para intentar el sensor nativo.';
        activateButton.textContent = 'Probar sensor del navegador';
        activateButton.disabled = false;
      } else {
        connectionStatus.textContent = 'Protobject no entrega lecturas y este navegador no ofrece un sensor alternativo.';
      }
    }, 4000);
    return;
  }

  await startBrowserSensor();
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

activateButton.addEventListener('click', () => {
  activateCompass().catch((error) => {
    console.error('No se pudo activar la brújula:', error);
    sensorReadout.textContent = 'error';
    connectionStatus.textContent = 'No se pudo iniciar el sensor de orientación.';
    activateButton.disabled = false;
  });
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
    connectionStatus.textContent = protobjectSensorSupported
      ? 'Teléfono conectado a la visualización.'
      : 'Teléfono conectado; este navegador no expone el sensor de orientación que usa Protobject.';
    stopCountryRequests();
  } else if (message.type === 'visualization-state') {
    if (Number.isInteger(message.year)) {
      if (lastYear === null) yearReadout.textContent = `${message.year} · local`;
    }
    if (typeof message.selectedIso3 === 'string') {
      countrySelect.value = message.selectedIso3;
    }
  } else if (message.type === 'audio-warning') {
    connectionStatus.textContent = 'País seleccionado. Activa el audio una vez desde la visualización en el computador.';
  }
});

requestTimer = setInterval(() => {
  if (!connected) sendToVisualization({ type: 'request-countries' });
}, 1000);
sendToVisualization({ type: 'request-countries' });

if (!protobjectSensorSupported && !window.DeviceOrientationEvent) {
  sensorReadout.textContent = 'no compatible';
  connectionStatus.textContent = 'Este navegador no ofrece un sensor de orientación compatible.';
}
