const statusElement = document.getElementById('estado');
const readingElement = document.getElementById('lectura');

Protobject.HandSensor.onData((data) => {
  const hand = data && Array.isArray(data.landmarks) ? data.landmarks[0] : null;
  const point = hand && hand.length > 8 ? hand[8] : null;
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
