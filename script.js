window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let obstacles = [];
    let score = 0;
    let gameOver = false;

    class InputHandler {
        constructor() {
            this.keys = [];
            window.addEventListener('keydown', e => {
                if ((e.key == 'ArrowDown' ||
                     e.key == 'ArrowUp' ||
                     e.key == 'ArrowLeft' ||
                     e.key == 'ArrowRight') &&
                     this.keys.indexOf(e.key) === -1) {
                    this.keys.push(e.key);
                }
            });

            window.addEventListener('keyup', e => {
                if (e.key == 'ArrowDown' || 
                    e.key == 'ArrowUp' || 
                    e.key == 'ArrowLeft' || 
                    e.key == 'ArrowRight') {
                    this.keys.splice(this.keys.indexOf(e.key), 1);
                }
            });
        }
    }

    class Player {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 121; // Reduced width
            this.height = 137; // Reduced height
            this.x = 0;
            this.y = this.gameHeight - this.height; // Align to the bottom of the canvas
            this.image = document.getElementById('playerImage');
            //this.frameX = 0;
            //this.maxFrame = 0;
            //this.frameY = 0;
            this.speed = 0;
            this.vy = 0;
            this.weight = 1; // Added weight to allow falling
            //this.frameTimer = 0; // Added frameTimer
            //this.frameInterval = 1000 / 20; // Added frame interval
        }

        draw(context) {
            context.drawImage(this.image, 0, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(input, deltaTime, obstacles) {
            // Obstacle collision detection
            obstacles.forEach(obstacle => {
                const dx = (obstacle.x + obstacle.width / 2) - (this.x + this.width / 2);
                const dy = (obstacle.y + obstacle.height / 2) - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < obstacle.width / 2 + this.width / 2) {
                    gameOver = true;
                }
            });

            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            // Controls
            if (input.keys.indexOf('ArrowRight') > -1) {
                this.speed = 5;
            } else if (input.keys.indexOf('ArrowLeft') > -1) {
                this.speed = -5;
            } else if (input.keys.indexOf('ArrowUp') > -1 && this.onGround()) {
                this.vy -= 32; // Jumping effect
            } else {
                this.speed = 0;
            }

            // Horizontal movement
            this.x += this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            // Vertical movement
            this.y += this.vy;
            if (!this.onGround()) {
                this.vy += this.weight; // Apply gravity
                this.maxFrame = 5; // Animation for jumping
                this.frameY = 1; // Jumping frame
            } else {
                this.vy = 0; // Reset velocity
                this.maxFrame = 8; // Animation for running
                this.frameY = 0; // Running frame
            }

            if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;
        }

        onGround() {
            return this.y >= this.gameHeight - this.height;
        }
    }

    class Background {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document.getElementById('backgroundImage');
            this.x = 0;
            this.y = 0;

            // Get the original dimensions of the image
            this.width = this.image.width;
            this.height = this.image.height;

            // Calculate aspect ratio
            this.aspectRatio = this.width / this.height;

            // Set scaled width and height based on canvas size
            if (this.gameWidth / this.gameHeight < this.aspectRatio) {
                this.scaledWidth = this.gameWidth;
                this.scaledHeight = this.gameWidth / this.aspectRatio;
            } else {
                this.scaledHeight = this.gameHeight;
                this.scaledWidth = this.gameHeight * this.aspectRatio;
            }

            // Calculate the position to ensure the background fills the canvas
            this.y = this.gameHeight - this.scaledHeight; // Align the bottom of the background
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y, this.scaledWidth, this.scaledHeight);
            context.drawImage(this.image, this.x + this.scaledWidth - 20, this.y, this.scaledWidth, this.scaledHeight); // Adjust this to create a looping effect
        }

        update() {
            this.x -= 1; // Background scroll speed
            if (this.x < 0 - this.scaledWidth) {
                this.x = 0;
            }
        }
    }

    class Obstacle {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.width = 90;
            this.height = 67;
            this.image = document.getElementById('obstacleImage');
            this.x = this.gameWidth - this.width;
            // Align the obstacle to the bottom of the background
            this.y = this.gameHeight - this.height; 
            this.maxFrame = 5;
            //this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 3;
            this.markedForDeletion = false;
            this.frameX = 0; // Added frameX for animation
        }

        draw(context) {
            context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime) {
            if (this.frameTimer > this.frameInterval) {
                if (this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }

            this.x -= this.speed;
            if (this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
        }
    }

    function handleObstacle(deltaTime) {
        if (obstacleTimer > obstacleInterval + randomObstacleInterval) {
            obstacles.push(new Obstacle(canvas.width, canvas.height));
            randomObstacleInterval = Math.random() * 1000 + 500;
            obstacleTimer = 0;
        } else {
            obstacleTimer += deltaTime;
        }

        obstacles.forEach(obstacle => {
            obstacle.draw(ctx);
            obstacle.update(deltaTime);
        });
        obstacles = obstacles.filter(obstacle => !obstacle.markedForDeletion);
    }

    function displayStatusText(context) {
        context.font = '40px Helvetica';
        context.fillStyle = 'black';
        context.fillText('Score: ' + score, 20, 50);
        context.fillStyle = 'white';
        context.fillText('Score: ' + score, 22, 52);
        if (gameOver) {
            context.textAlign = 'center';
            context.fillStyle = 'black';
            context.fillText('Game Over, Try again!', canvas.width / 2, 200);
            context.fillStyle = 'white';
            context.fillText('Game Over, Try again!', canvas.width / 2 + 2, 200);
        }
    }

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let obstacleTimer = 0;
    let obstacleInterval = 1000;
    let randomObstacleInterval = Math.random() * 1000 + 500;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, obstacles);
        handleObstacle(deltaTime);
        displayStatusText(ctx);
        if (!gameOver) requestAnimationFrame(animate);
    }

    animate(0);
});
