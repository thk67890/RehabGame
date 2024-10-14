window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    
    let obstacles = []
    let score = 0;
    let gameOver = false;

    class InputHandler {
        constructor(){
            this.keys = [];
            window.addEventListener('keydown', e => {
                if((e.key == 'ArrowDown' || 
                    e.key == 'ArrowUp' || 
                    e.key == 'ArrowLeft' || 
                    e.key == 'ArrowRight') &&
                    this.keys.indexOf(e.key) === -1) {
                    this.keys.push(e.key);
                }

            });

            window.addEventListener('keyup', e => {
                if(e.key == 'ArrowDown' || 
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
            this.width = 200;
            this.height = 200;
            this.x = 0;
            this.y = this.gameheight - this.height;
            this.image = document.getElementById('playerImage');
            this.frameX = 0;
            this.maxFrame = 0;
            this.frameY = 0;
            this.speed = 0;
            this.vy = 0;
            this.weight = 0;
        }

        draw(context){
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(input, deltaTime, obstacles) {
            // sprite animation
            obstacles.forEach(obstacle => {
                const dx = (obstacle.x + obstacle.width/2) - (this.x + this.width/2);
                const dy = (obstacle.y + obstacle.height/2) - (this.y + this.height/2);
                const distance = Math.sqrt(dx * dx+dy * dy);
                if(distance < obstacle.width/2 + this.width/2) {
                    gameOver = true;
                }
            });

            if (this.frameTimer > this.frameInterval) {
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTime;
            }
            
            // controls

            if (input.keys.indexOf('ArrowRight') > -1) {
                this.speed = 5;
            } else if(input.keys.indexOf('ArrowLeft') > -1) {
                this.speed = -5;
            } else if(input.keys.indexOf('ArrowUp') > -1 && this.onGround()) {
                this.vy -=32;
            } else {
                this.speed = 0;
            }

            //horizontal movement
            this. x+= this.speed;
            if (this.x < 0) this.x = 0;
            else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

            //vertical movement
            this.y += this.vy;
            if (!this.onGround()){
                this.vy += this.weight;
                this.maxFrame = 5;
                this.frameY = 1;
            } else {
                this.vy = 0;
                this.maxFrame = 8;
                this.frameY = 0;
            }
            if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height
        }

        onGround(){
            return this.y >= this.gameHeight - this.height;
        }

    }

    class Background {
        constructor(gameWidth, gameHeight) {
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.image = document .getElementById('backgroundImage');
            this.x=0;
            this.y=0;
            this.width = 16384;
            this.height = 4267;
            this.speed = 20;
        }

        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height); 
        }

        update() {
            this.x -= this.speed;
            if(this.x < 0 - this.width) {
                this.x = 0;
            }
        }
    }

    class Obstacle {
        constructor(gameWidth, gameHeight){
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight
            this.width = 160;
            this.height = 119;
            this.image = document.getElementById('obstacleImage');
            this.x = this.gameWidth - this.width;
            this.y = this.gameHeight - this.height;
            this.maxFrame = 5;
            this.fps = 20;
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.speed = 8;
            this.markedForDeletion = false;
            this.frameX = 0;

        }
        
        draw(context) {
            context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
        }

        update(deltaTime) {
            if(this.frameTimer > this.frameInterval) {
                if(this.frameX >= this.maxFrame) this.frameX = 0;
                else this.frameX++;
                this.frameTimer = 0;
            } else {
                this.frameTimer += deltaTimer;
            }

            this.x -= this.speed;
            if(this.x < 0 - this.width) {
                this.markedForDeletion = true;
                score++;
            }
        }
    }

    //obstacles.push(new Obstacle(canvas.width , canvas.height));
    function handleObstacle(deltaTime) {
        if (obstacleTimer > obstacleIntercal + randomObstacleInterval) {
            obstacle.push(new Obstacle(canvas.width, canvas.height));
            console.log(enemies);
            randomObstacleInterval = Math.random() * 1000 + 500;
            obstacleTimer = 0;
        } else {
            obstacleTimer += deltaTime;
        }
        
        obstacles.forEach(obstacle => {
            obstcale.draw(ctx);
            obstacle.update(daltaTime);

        });

        obstacles = obstacles.filter(obstacle => !osbtacle.markedForDeletion);
    }

    function displayStatusText(context) {
        context.font = '40px Helvetica';
        context.fillStyle = 'black';
        context.fillText('Score: ' + score, 20, 50);
        if (gameOver) {
            context.fillText('Game Over!', canvas.width / 2 - 100, canvas.height / 2);
        }
    }
    
    const input = new InputHandler();
    const player = new Player(canvas.width, cnavas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let obstacleTimer = 0;
    let obstacleInterval = 1000;
    let randomObstacleInterval = Math.random() * 1000 + 500;


    function animate(timeStamp){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        
        background.draw(ctx);
        background.update();
        player.draw(ctx);
        player.update(input, deltaTime, obstacles);
        handleObstacles(deltaTime);
        displayStatusText(ctx);

        if (!gameOver) {
            requestAnimationFrame(animate);
        }  
    }

    animate(0);
});