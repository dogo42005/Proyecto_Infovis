const HAND_SAMPLE_INTERVAL_MS = 100;

async function startRearCameraPreview() {
  let probeStream;
  let cameraIndex;

  try {
    probeStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: 'environment' } },
    });
    const deviceId = probeStream.getVideoTracks()[0]?.getSettings().deviceId;
    if (!deviceId) throw new Error('El navegador no informó qué cámara trasera abrió.');

    const cameras = (await navigator.mediaDevices.enumerateDevices())
      .filter((device) => device.kind === 'videoinput');
    cameraIndex = cameras.findIndex((device) => device.deviceId === deviceId);
    if (cameraIndex < 0) throw new Error('No se pudo identificar la cámara trasera.');
  } catch (error) {
    if (error instanceof DOMException && error.name === 'OverconstrainedError') {
      throw new Error('No se encontró una cámara trasera disponible en este teléfono.');
    }
    throw error;
  } finally {
    probeStream?.getTracks().forEach((track) => track.stop());
  }

  Protobject.HandSensor.start(HAND_SAMPLE_INTERVAL_MS, cameraIndex);
  Protobject.HandSensor.showPreview({ top: 0, left: 0, width: 640, height: 480 });

  const { video, canvas } = Protobject.HandSensor;
  const fitPreview = () => {
    if (!video.videoWidth || !video.videoHeight) return;

    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
  };
  video.addEventListener('loadedmetadata', fitPreview, { once: true });
  fitPreview();

  Object.assign(canvas.style, {
    position: 'relative',
    top: 'auto',
    left: 'auto',
    display: 'block',
    width: '100%',
    height: 'auto',
    maxWidth: '960px',
    margin: '16px auto',
  });
}
