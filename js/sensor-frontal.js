const statusElement = document.getElementById('estado');
const readingElement = document.getElementById('lectura');
const startButton = document.getElementById('iniciar-sensor');
let sensorStarted = false;

Protobject.HandSensor.onData((data) => {
  const hand = data && Array.isArray(data.landmarks) ? data.landmarks[0] : null;
  const point = hand && hand.length > 8 ? hand[8] : null;
  if (!point || !Number.isFinite(point.y)) {
    statusElement.textContent = 'Cámara activa; no se detecta una mano.';
    readingElement.textContent = 'Sin dedo detectado';
    Protobject.Core.send({ tipo: 'frontal', visible: false }).to('index.html');
    return;
  }

  const z = Number(point.y);
  statusElement.textContent = 'Mano detectada; sensor enviando datos.';
  readingElement.textContent = `Altura relativa (y): ${z.toFixed(2)}`;
  Protobject.Core.send({ tipo: 'frontal', visible: true, z }).to('index.html');
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

  try {
    statusElement.textContent = 'Iniciando cámara; acepta el permiso si el navegador lo solicita…';
    Protobject.HandSensor.start(100, 0);
    Protobject.HandSensor.showPreview({ top: 60, left: 20, width: 320, height: 240 });
    sensorStarted = true;
    startButton.disabled = true;
  } catch (error) {
    statusElement.textContent = `No se pudo iniciar la cámara: ${error instanceof Error ? error.message : 'error desconocido'}`;
  }
});
