// ======================================================
// ELEMENTOS
// ======================================================
const game = document.getElementById("game");
const player = document.getElementById("player");
const zombiesContainer = document.getElementById("zombies");
const bulletsContainer = document.getElementById("bullets");
const healthText = document.getElementById("health");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const waveText = document.getElementById("wave");
const gameOverScreen = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const finalWave = document.getElementById("finalWave");
const restartButton = document.getElementById("restart");
const pausaButton = document.getElementById("pausa");

// ======================================================
// JUGADOR
// ======================================================
let playerX = window.innerWidth / 2;
let playerY = window.innerHeight / 2;
const playerSpeed = 5;
let health = 100;
let score = 0;
let wave = 1;
let zombiesMuertos = 0; // <- Contador de kills para el fondo

// ======================================================
// RÉCORD
// ======================================================
let bestScore = localStorage.getItem("zombieBest") || 0;
bestText.textContent = bestScore;

// ======================================================
// CONTROLES
// ======================================================
const keys = { w: false, a: false, s: false, d: false };

// ======================================================
// MOUSE
// ======================================================
let mouseX = playerX;
let mouseY = playerY;
let shooting = false;

// ======================================================
// BALAS
// ======================================================
let bullets = [];
let bulletSpeed = 12;
let lastShot = 0;
const fireRate = 180;

// ======================================================
// ZOMBIES
// ======================================================
let zombies = [];
let zombieSpeed = 1.2;
let zombieSpawnTimer = 0;

// ======================================================
// ESTADO
// ======================================================
let playing = true;
let pausado = false;

// ======================================================
// TECLADO
// ======================================================
document.addEventListener("keydown", function(event) {
    const key = event.key.toLowerCase();
    if (key === "w") keys.w = true;
    if (key === "a") keys.a = true;
    if (key === "s") keys.s = true;
    if (key === "d") keys.d = true;
    if (key === "p") {
        pausado =!pausado;
        if(pausaButton) pausaButton.textContent = pausado? "▶️ Reanudar" : "⏸️ Pausar";
    }
});

document.addEventListener("keyup", function(event) {
    const key = event.key.toLowerCase();
    if (key === "w") keys.w = false;
    if (key === "a") keys.a = false;
    if (key === "s") keys.s = false;
    if (key === "d") keys.d = false;
});

// ======================================================
// MOUSE
// ======================================================
game.addEventListener("mousemove", function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
});
game.addEventListener("mousedown", function(event) {
    if (event.button === 0) shooting = true;
});
game.addEventListener("mouseup", function(event) {
    if (event.button === 0) shooting = false;
});

if(pausaButton){
    pausaButton.addEventListener("click", function() {
        pausado =!pausado;
        this.textContent = pausado? "▶️ Reanudar" : "⏸️ Pausar";
    });
}

// ======================================================
// CAMBIAR FONDO
// ======================================================
function cambiarFondo() {
    // Cada 10 kills cambia de fondo. Cambia los numeros si quieres
    if (zombiesMuertos >= 20) {
        game.className = "fondo3"; // Fondo 3
    } else if (zombiesMuertos >= 10) {
        game.className = "fondo2"; // Fondo 2
    } else {
        game.className = ""; // Fondo 1 normal
    }
}

// ======================================================
// MOVER JUGADOR
// ======================================================
function movePlayer() {
    if (keys.w) playerY -= playerSpeed;
    if (keys.s) playerY += playerSpeed;
    if (keys.a) playerX -= playerSpeed;
    if (keys.d) playerX += playerSpeed;

    const width = game.clientWidth;
    const height = game.clientHeight;

    if (playerX < 0) playerX = 0;
    if (playerY < 0) playerY = 0;
    if (playerX > width - player.offsetWidth) playerX = width - player.offsetWidth;
    if (playerY > height - player.offsetHeight) playerY = height - player.offsetHeight;

    player.style.left = playerX + "px";
    player.style.top = playerY + "px";
}

// ======================================================
// APUNTAR AL MOUSE
// ======================================================
function aimPlayer() {
    const playerCenterX = playerX + player.offsetWidth / 2;
    const playerCenterY = playerY + player.offsetHeight / 2;
    const angle = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);
    player.style.transform = `rotate(${angle}rad)`;
}

// ======================================================
// DISPARAR
// ======================================================
function shoot() {
    const now = performance.now();
    if (now - lastShot < fireRate) return;
    lastShot = now;

    const centerX = playerX + player.offsetWidth / 2;
    const centerY = playerY + player.offsetHeight / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const directionX = dx / distance;
    const directionY = dy / distance;

    const bullet = document.createElement("div");
    bullet.classList.add("bullet");
    bullet.style.left = centerX + "px";
    bullet.style.top = centerY + "px";
    bulletsContainer.appendChild(bullet);

    bullets.push({ element: bullet, x: centerX, y: centerY, dx: directionX, dy: directionY });
}

// ======================================================
// MOVER BALAS
// ======================================================
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bullet.dx * bulletSpeed;
        bullet.y += bullet.dy * bulletSpeed;
        bullet.element.style.left = bullet.x + "px";
        bullet.element.style.top = bullet.y + "px";

        if (bullet.x < -20 || bullet.x > game.clientWidth + 20 || bullet.y < -20 || bullet.y > game.clientHeight + 20) {
            bullet.element.remove();
            bullets.splice(i, 1);
            continue;
        }

        for (let j = zombies.length - 1; j >= 0; j--) {
            const zombie = zombies[j];
            if (collision(bullet.element, zombie.element)) {
                zombie.element.remove();
                zombies.splice(j, 1);
                bullet.element.remove();
                bullets.splice(i, 1);
                score += 10;
                zombiesMuertos++; // <- Sumamos kill
                scoreText.textContent = score;
                cambiarFondo(); // <- Cambiamos fondo
                break;
            }
        }
    }
}

// ======================================================
// CREAR ZOMBIE
// ======================================================
function spawnZombie() {
    const zombie = document.createElement("div");
    zombie.classList.add("zombie");

    // Crear imagen del zombie
    const img = document.createElement("img");
    img.src = "assents/lugia-Photoroom.png";
    img.alt = "Zombie";

    zombie.appendChild(img);

    let x, y;
    const side = Math.floor(Math.random() * 4);

    if (side === 0) {
        x = Math.random() * game.clientWidth;
        y = -60;
    }
    else if (side === 1) {
        x = game.clientWidth + 60;
        y = Math.random() * game.clientHeight;
    }
    else if (side === 2) {
        x = Math.random() * game.clientWidth;
        y = game.clientHeight + 60;
    }
    else {
        x = -60;
        y = Math.random() * game.clientHeight;
    }

    zombie.style.left = x + "px";
    zombie.style.top = y + "px";

    zombiesContainer.appendChild(zombie);

    zombies.push({
        element: zombie,
        x: x,
        y: y
    });
}


// ======================================================
// MOVER ZOMBIES
// ======================================================
function updateZombies() {
    for (let i = zombies.length - 1; i >= 0; i--) {
        const zombie = zombies[i];
        const dx = playerX - zombie.x;
        const dy = playerY - zombie.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
            zombie.x += (dx / distance) * zombieSpeed;
            zombie.y += (dy / distance) * zombieSpeed;
        }

        zombie.element.style.left = zombie.x + "px";
        zombie.element.style.top = zombie.y + "px";

        if (collision(player, zombie.element)) {
            health -= 0.5;
            healthText.textContent = Math.max(0, Math.floor(health));
            zombie.x -= (dx / distance) * 10;
            zombie.y -= (dy / distance) * 10;
            if (health <= 0) {
                endGame();
                return;
            }
        }
    }
}

// ======================================================
// COLISIÓN
// ======================================================
function collision(element1, element2) {
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    return!(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
}

// ======================================================
// SISTEMA DE OLEADAS
// ======================================================
function updateWaves() {
    const newWave = Math.floor(score / 100) + 1;
    if (newWave > wave) {
        wave = newWave;
        waveText.textContent = wave;
        zombieSpeed = 1 + wave * 0.15;
    }
}

// ======================================================
// CREAR ZOMBIES AUTOMÁTICAMENTE
// ======================================================
function spawnSystem() {
    zombieSpawnTimer++;
    const spawnTime = Math.max(20, 70 - wave * 5);
    if (zombieSpawnTimer >= spawnTime) {
        zombieSpawnTimer = 0;
        spawnZombie();
        if (wave >= 3) spawnZombie();
    }
}

// ======================================================
// GAME OVER
// ======================================================
function endGame() {
    playing = false;
    shooting = false;
    finalScore.textContent = score;
    finalWave.textContent = wave;
    gameOverScreen.style.display = "flex";
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("zombieBest", bestScore);
        bestText.textContent = bestScore;
    }
}

// ======================================================
// REINICIAR
// ======================================================
restartButton.addEventListener("click", restartGame);
function restartGame() {
    playerX = game.clientWidth / 2;
    playerY = game.clientHeight / 2;
    health = 100;
    score = 0;
    wave = 1;
    zombiesMuertos = 0; // <- Reiniciar contador
    zombieSpeed = 1.2;
    zombieSpawnTimer = 0;
    pausado = false;
    game.className = ""; // <- Volver al fondo 1
    if(pausaButton) pausaButton.textContent = "⏸️ Pausar";

    zombies.forEach(zombie => zombie.element.remove());
    zombies = [];
    bullets.forEach(bullet => bullet.element.remove());
    bullets = [];

    healthText.textContent = "100";
    scoreText.textContent = "0";
    waveText.textContent = "1";

    player.style.left = playerX + "px";
    player.style.top = playerY + "px";
    gameOverScreen.style.display = "none";
    playing = true;
    requestAnimationFrame(gameLoop);
}

// ======================================================
// GAME LOOP
// ======================================================
function gameLoop() {
    if (!playing) return;
    if (!pausado) {
        movePlayer();
        aimPlayer();
        if (shooting) shoot();
        updateBullets();
        spawnSystem();
        updateZombies();
        updateWaves();
    }
    requestAnimationFrame(gameLoop);
}

// ======================================================
// POSICIÓN INICIAL
// ======================================================
player.style.left = playerX + "px";
player.style.top = playerY + "px";

// ======================================================
// INICIAR
// ======================================================
gameLoop();