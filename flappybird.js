//board
let board;
let boardWidth = 420;
let boardHeight = 580;
let context;

//bird
let birdWidth = 51; //width/height ratio = 408/228 = 17/12
let birdHeight = 36;
let birdX = boardWidth / 8;
let birdY = boardHeight / 2;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

//pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; //pipes moving left speed
let velocityY = 0;  //bird jump speed
let gravity = 0.4;

let gameOver = false;
let score = 0;
let wingSound = new Audio("./sfx_wing.wav");
wingSound.volume = 0.2;
let hitSound = new Audio("./sfx_hit.wav");
hitSound.volume = 0.3;
let bgm = new Audio("./Transformers.mp3");
bgm.volume = 0.7;
bgm.loop = true;

// Cargar el puntaje más alto guardado o iniciar en 0
let highScore = localStorage.getItem("flappyHighScore") ? parseFloat(localStorage.getItem("flappyHighScore")) : 0;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    //load images
    birdImg = new Image();
    birdImg.src = "./flappybird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); //every 1.5 seconds
    document.addEventListener("keydown", moveBird);
    document.addEventListener("click", moveBird); // <--- Única línea agregada para el clic / celular
};

function update() {
    requestAnimationFrame(update);

    // Si ya terminó el juego, redibujamos la pantalla de game over y no actualizamos posiciones
    if (gameOver) {
        drawGameOverScreen();
        return;
    }

    context.clearRect(0, 0, board.width, board.height);

    //bird
    velocityY += gravity;
    bird.y = Math.max(bird.y + velocityY, 0); //apply gravity, limit to top of canvas
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    if (bird.y > board.height) {
        triggerGameOver();
    }

    //pipes
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes!
            pipe.passed = true;
        }

        if (detectCollision(bird, pipe)) {
            triggerGameOver();
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    //score en pantalla durante el juego
    context.fillStyle = "rgb(155, 143, 221)";
    context.font = "45px sans-serif";
    context.fillText(score, 200, 80);

    // Si la colisión ocurrió en este fotograma, dibujamos la pantalla de Game Over al final
    if (gameOver) {
        bgm.pause();
        bgm.currentTime = 0; // Reiniciar la música para que comience desde el principio en el próximo juego
        drawGameOverScreen();
    }
}

function triggerGameOver() {
    gameOver = true;
    hitSound.play();

    // Actualizar High Score si el puntaje actual es mayor
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("flappyHighScore", highScore);
    }
}

function drawGameOverScreen() {
    // Fondo semitransparente para oscurecer el juego
    context.fillStyle = "rgba(0, 0, 0, 0.35)";
    context.fillRect(0, 0, board.width, board.height);

    // Título "GAME OVER"
    context.fillStyle = "#6d4cff";
    context.font = "bold 42px sans-serif";
    context.textAlign = "center";
    context.fillText("GAME OVER", board.width / 2, 160);

    // Puntaje Actual
    context.fillStyle = "#ffffff";
    context.font = "24px sans-serif";
    context.fillText("Puntaje: " + score, board.width / 2, 230);

    // Puntaje Más Alto
    context.fillStyle = "#6a4fd9";
    context.fillText("Puntaje Máximo: " + highScore, board.width / 2, 270);

    // Mensaje si el puntaje es mayor a 10
    if (score >= 10) {
        context.fillStyle = "#c30846";
        context.font = "bold 20px sans-serif";
        context.fillText("¡Eres un seeker increíble!", board.width / 2, 330);
        context.fillText("Tu recompensa es... 84-101", board.width / 2, 350);
    }

    // Instrucción para reiniciar
    context.fillStyle = "#8884ae";
    context.font = "16px sans-serif";
    context.fillText("¿Qué tan lejos puedes llegar? ¡Sigue explorando!", board.width / 2, 420);

    // Resetear la alineación del texto
    context.textAlign = "left";
}

function placePipes() {
    if (gameOver) {
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false
    };
    pipeArray.push(bottomPipe);
}

function moveBird(e) {
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX" || e.type == "click") {
        if (bgm.paused) {
        bgm.play();
        }
        wingSound.play();
        //jump
        velocityY = -6;

        //reset game
        if (gameOver) {
            bird.y = birdY;
            pipeArray = [];
            score = 0;
            gameOver = false;
        }
    }
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}
