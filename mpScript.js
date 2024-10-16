const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Initialize MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1, // 0, 1, or 2 for model complexity (2 being the highest accuracy)
  smoothLandmarks: true, // Enable smoothing for landmarks
  enableSegmentation: false, // Disable segmentation for basic tracking
  minDetectionConfidence: 0.5, // Minimum confidence threshold for detection
  minTrackingConfidence: 0.5  // Minimum confidence threshold for tracking
});

// Callback to draw pose landmarks and connections
pose.onResults((results) => {
  // Clear the canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw the input video onto the canvas
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Draw pose landmarks
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                   {color: 'white', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                  {color: 'red', lineWidth: 2});
  }

  canvasCtx.restore();
});

// Initialize the webcam and start processing frames
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();