window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;

    // MediaPipe canvas for the larger webcam feed
    const mediapipeCanvas = document.getElementById('mediapipeCanvas');
    const mediapipeCtx = mediapipeCanvas.getContext('2d');

    let obstacles = [];
    let score = 0;
    let gameOver = false;
    let backgroundX = 0;

    // Variables for Mediapipe pose tracking
    let rightAnkleY = null;
    let prevRightAnkleX = null;
    let rightAnkleX = null;
    let jump = false;
    let forwardMovement = 0;
    let verticalOffset = 0;

    // Background image for scrolling
    const background = new Image();
    background.src = document.getElementById('backgroundImage').src;

    // Player class
    class Player {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 121;
            this.height = 137;
            this.x = this.gameWidth / 2;
            this.y = this.gameHeight - this.height;
            this.image = document.getElementById('playerImage');
            this.speed = 0;
        }

        draw(context) {
            context.drawImage(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime) {

            // Control forward/backward movement based on leg bend (right ankle)
            this.x += forwardMovement;

            this.y = (this.gameHeight - this.height) - verticalOffset;

            // Limit movement within canvas boundaries
            if (this.x > (this.gameWidth / 2 + 100)) this.x = (this.gameWidth / 2 +100);
            else if (this.x < (this.gameWidth / 2 - 100)) this.x = (this.gameWidth / 2 - 100);

            if (this.y > (this.gameHeight - this.height + 10)) this.y = (this.gameHeight - this.height + 10);
            if (this.y < 0) this.y = 0;

        
        }
    }

    const player = new Player(canvas.width, canvas.height);

    // Background scrolling logic
    function handleBackground() {
        ctx.drawImage(background, backgroundX, 0, canvas.width, canvas.height);
        ctx.drawImage(background, backgroundX + canvas.width, 0, canvas.width, canvas.height);
        backgroundX -= 2; // Adjust speed of background scrolling
        if (backgroundX <= -canvas.width) backgroundX = 0;
    }

    // Obstacle class
    class Obstacle {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 100;
            this.height = 100;
            this.x = Math.random() * (gameWidth - this.width);
            this.y = gameHeight - this.height; // Align on the bottom of the screen
            this.image = document.getElementById('obstacleImage');
            this.markedForDeletion = false;
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        }

        update() {
            // Obstacles can move left (or other logic can be added)
            this.x -= 2;
            if (this.x + this.width < 0) this.markedForDeletion = true; // Remove obstacles that go off screen
        }
    }

    function handleObstacles() {
        if (Math.random() < 0.01) {
            obstacles.push(new Obstacle(canvas.width, canvas.height));
        }
        obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw(ctx);
        });
        obstacles = obstacles.filter(obstacle => !obstacle.markedForDeletion);
    }

    // Animation loop
    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        handleBackground();  // Scroll background
        handleObstacles();    // Draw and update obstacles
        player.update(deltaTime);  // Update player position
        player.draw(ctx);     // Draw player

        if (!gameOver) requestAnimationFrame(animate);
    }
    animate(0);

    // MediaPipe Pose Detection
    const videoElement = document.querySelector('.input_video');
    const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    function calculateAngle(A, B, C) {
        const AB = { x: A.x - B.x, y: A.y - B.y };
        const CB = { x: C.x - B.x, y: C.y - B.y };
        const dotProduct = AB.x * CB.x + AB.y * CB.y;
        const magAB = Math.sqrt(AB.x * AB.x + AB.y * AB.y);
        const magCB = Math.sqrt(CB.x * CB.x + CB.y * CB.y);
        const angle = Math.acos(dotProduct / (magAB * magCB));
        return (angle * 180) / Math.PI;
    }

    pose.onResults((results) => {
        mediapipeCtx.clearRect(0, 0, mediapipeCanvas.width, mediapipeCanvas.height);
        mediapipeCtx.drawImage(results.image, 0, 0, mediapipeCanvas.width, mediapipeCanvas.height);

        // Draw landmarks and connections
        if (results.poseLandmarks) {
            
            drawLandmarks(mediapipeCtx, results.selectedLandmarks, { color: 'cyan', lineWidth: 2 });
            drawConnectors(mediapipeCtx, results.selectedLandmarks, POSE_CONNECTIONS, { color: 'magenta', lineWidth: 2 });

            const rightShoulder = results.poseLandmarks[12];
            const rightHip = results.poseLandmarks[24];
            const rightKnee = results.poseLandmarks[26];
            const rightAnkle = results.poseLandmarks[28];

            const LRlegAngle = calculateAngle(rightShoulder, rightHip, rightAnkle) - 10;
            
            // Detect leg raise for jump
            const minAngle = 50;  // Angle corresponding to normal standing
            const maxAngle = 100; // Angle corresponding to maximum leg raise
            const maxOffset = 1000; // Maximum height offset
            
            if (LRlegAngle > minAngle && LRlegAngle <= maxAngle) {
                verticalOffset = (1-((LRlegAngle - minAngle) / (maxAngle - minAngle))) * maxOffset ;
            } else {
                verticalOffset = 0; // Reset offset if leg is not raised
            }
    

            // Control forward/backward based on knee bend
            const HSkneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
            forwardMovement = (HSkneeAngle - 90) / 6; // Adjust sensitivity here

            // Log current ankle position to track movement
            rightAnkleY = rightAnkle.y;
        }
    });

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await pose.send({ image: videoElement });
        },
        width: 1280,
        height: 720
    });
    camera.start();
});
