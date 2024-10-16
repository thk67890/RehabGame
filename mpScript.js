const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const canvasCtx = canvasElement.getContext('2d');

// Initialize MediaPipe Pose
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Helper function to calculate angle between three points
function calculateAngle(A, B, C) {

  const tangentCB = Math.atan2(C.y-B.y,C.x-B.x);
  const tangentAB = Math.atan2(A.y-B.y,A.x-B.x);
  const calinit = tangentCB-tangentAB
  const calvar = (calinit*180)/Math.PI;
  const calfinal = Math.abs(calvar);

  
  return calfinal;
}

// Callback to draw pose landmarks and connections
pose.onResults((results) => {
  // Clear the canvas
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw the input video onto the canvas
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  // Draw pose landmarks
  if (results.poseLandmarks) {
    // Draw the pose landmarks and connections
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'white', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: 'red', lineWidth: 2 });

    // Extract hip, knee, and ankle landmarks (right leg in this example)
    const rightHip = results.poseLandmarks[24];   // Right hip
    const rightKnee = results.poseLandmarks[26];  // Right knee
    const rightAnkle = results.poseLandmarks[28]; // Right ankle

    // Ensure landmarks are detected
    if (rightHip && rightKnee && rightAnkle) {
      const angle = calculateAngle(rightHip, rightKnee, rightAnkle);

      // Display the calculated angle on the canvas
      canvasCtx.font = "30px Arial";
      canvasCtx.fillStyle = "white";
      canvasCtx.fillText(`Angle: ${Math.round(angle)}°`, rightKnee.x * canvasElement.width, rightKnee.y * canvasElement.height - 20);

      console.log("Hip-Knee-Ankle Angle:", angle);
    }
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
