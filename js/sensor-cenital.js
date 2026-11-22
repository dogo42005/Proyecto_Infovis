const statusElement = document.getElementById('estado');
const readingElement = document.getElementById('lectura');
const startButton = document.getElementById('iniciar-sensor');
const INDEX_FINGER_TIP = 8;
let sensorStarted = false;

Protobject.HandSensor.onData((data) => {
  const hand = data && Array.isArray(data.landmarks) ? data.landmarks[0] : null;
  const point = hand && hand.length > INDEX_FINGER_TIP ? hand[INDEX_FINGER_TIP] : null;
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    statusElement.textContent = 'Cámara activa; no se detecta una mano.';
    readingElement.textContent = 'Sin dedo detectado';
    Protobject.Core.send({ tipo: 'cenital', visible: false }).to('index.html');
    return;
  }

  const x = Number(point.x);
  const y = Number(point.y);
  statusElement.textContent = 'Mano detectada; sensor enviando datos.';
  readingElement.textContent = `x: ${x.toFixed(2)} · y: ${y.toFixed(2)}`;
  Protobject.Core.send({ tipo: 'cenital', visible: true, x, y }).to('index.html');
});

startButton.addEventListener('click', () => {
  if (!window.isSecureContext) {
    statusElement.textContent = 'La cámara requiere HTTPS. Abre esta página con una dirección https:// válida, no con la IP local por HTTP.';
    return;
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    statusElement.textContent = 'Este navegador no ofrece acceso a cámara en esta página.';
    return;
  }
  if (sensorStarted) return;

  startButton.disabled = true;
  statusElement.textContent = 'Solicitando acceso a la cámara trasera…';
  startRearCameraPreview().then(() => {
    sensorStarted = true;
    statusElement.textContent = 'Cámara trasera activa; encuadra la rueda y la punta del dedo.';
  }).catch((error) => {
    startButton.disabled = false;
    statusElement.textContent = `No se pudo iniciar la cámara: ${error instanceof Error ? error.message : 'error desconocido'}`;
  });
});
