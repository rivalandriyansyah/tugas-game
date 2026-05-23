const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const speedEl = document.getElementById('speed');
const levelEl = document.getElementById('level');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

const width = canvas.width;
const height = canvas.height;

const player = {
  x: width / 2 - 26,
  y: height - 140,
  width: 52,
  height: 100,
  lane: 1,
  speed: 6,
  color: '#ff4f4f',
};

const lanes = [width * 0.19, width * 0.485, width * 0.78];

let score = 0;
let highScore = Number(localStorage.getItem('balapHighScore') || 0);
let speedMultiplier = 1;
let level = 1;
let gameState = 'idle';
let animationId;
let obstacles = [];
let powerups = [];
let frames = 0;
let nitroActive = false;
let nitroTimer = 0;

highScoreEl.textContent = highScore;

function drawRoad() {
  ctx.fillStyle = '#2d2f36';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#1a1d24';
  ctx.fillRect(80, 0, width - 160, height);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 6;
  ctx.strokeRect(80, 0, width - 160, height);
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCar() {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.width, player.height, 16);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.fillRect(player.x + 10, player.y + 18, 32, 24);
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x + 14, player.y + 24, 24, 12);
}

function drawObstacle(obstacle) {
  ctx.fillStyle = '#6f2d2d';
  ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  ctx.fillStyle = '#d66';
  ctx.fillRect(obstacle.x + 8, obstacle.y + 8, obstacle.width - 16, obstacle.height - 16);
}

function drawPowerup(powerup) {
  ctx.fillStyle = '#2cff9d';
  ctx.beginPath();
  ctx.arc(powerup.x + powerup.size / 2, powerup.y + powerup.size / 2, powerup.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a2b12';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', powerup.x + powerup.size / 2, powerup.y + powerup.size / 2);
}

function createObstacle() {
  const laneIndex = Math.floor(Math.random() * 3);
  obstacles.push({
    x: lanes[laneIndex] - 50,
    y: -120,
    width: 100,
    height: 120,
    speed: 4 + speedMultiplier,
  });
}

function createPowerup() {
  const laneIndex = Math.floor(Math.random() * 3);
  powerups.push({
    x: lanes[laneIndex] - 18,
    y: -80,
    size: 36,
    speed: 4 + speedMultiplier,
  });
}

function updateObjects() {
  obstacles.forEach((obstacle) => {
    obstacle.y += obstacle.speed * speedMultiplier;
  });
  powerups.forEach((powerup) => {
    powerup.y += powerup.speed * speedMultiplier;
  });
  obstacles = obstacles.filter((obstacle) => obstacle.y < height + 160);
  powerups = powerups.filter((powerup) => powerup.y < height + 80);
}

function applyNitro() {
  if (nitroActive) {
    nitroTimer -= 1;
    if (nitroTimer <= 0) {
      nitroActive = false;
      speedMultiplier = Math.max(1, level * 0.25 + 1);
    }
  }
}

function increaseDifficulty() {
  if (frames % 600 === 0) {
    level += 1;
    speedMultiplier = Math.min(3.5, level * 0.25 + 1);
    score += 100;
    updateLabels();
  }
}

function updateLabels() {
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  speedEl.textContent = nitroActive ? `${(speedMultiplier).toFixed(1)}x (NITRO)` : speedMultiplier.toFixed(1);
  levelEl.textContent = level;
}

function checkCollisions() {
  const carRect = { x: player.x, y: player.y, w: player.width, h: player.height };

  obstacles.forEach((obstacle) => {
    const obsRect = { x: obstacle.x, y: obstacle.y, w: obstacle.width, h: obstacle.height };
    if (
      carRect.x < obsRect.x + obsRect.w &&
      carRect.x + carRect.w > obsRect.x &&
      carRect.y < obsRect.y + obsRect.h &&
      carRect.y + carRect.h > obsRect.y
    ) {
      endGame('Kecelakaan! Game over.');
    }
  });

  powerups = powerups.filter((powerup) => {
    const powerRect = { x: powerup.x, y: powerup.y, w: powerup.size, h: powerup.size };
    const hit =
      carRect.x < powerRect.x + powerRect.w &&
      carRect.x + carRect.w > powerRect.x &&
      carRect.y < powerRect.y + powerRect.h &&
      carRect.y + carRect.h > powerRect.y;
    if (hit) {
      nitroActive = true;
      nitroTimer = 120;
      speedMultiplier = 2.8;
      score += 250;
      return false;
    }
    return true;
  });
}

function drawTextBanner() {
  if (gameState !== 'playing') return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(20, 20, 240, 64);
  ctx.fillStyle = '#fff';
  ctx.font = '20px Inter, sans-serif';
  ctx.fillText('Nitro: ' + (nitroActive ? 'Aktif' : 'Siap'), 32, 48);
  ctx.fillText('Score bonus saat nitro!', 32, 72);
}

function draw() {
  drawRoad();
  drawCar();
  obstacles.forEach(drawObstacle);
  powerups.forEach(drawPowerup);
  drawTextBanner();
}

function gameLoop() {
  frames += 1;
  updateObjects();
  applyNitro();
  increaseDifficulty();
  checkCollisions();
  score += Math.floor(0.25 + speedMultiplier * 0.25);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('balapHighScore', highScore);
  }
  updateLabels();

  if (frames % Math.max(80, 180 - level * 10) === 0) {
    createObstacle();
  }
  if (frames % 260 === 0) {
    createPowerup();
  }

  ctx.clearRect(0, 0, width, height);
  draw();
  if (gameState === 'playing') {
    animationId = requestAnimationFrame(gameLoop);
  }
}

function moveLane(direction) {
  const targetLane = Math.max(0, Math.min(2, player.lane + direction));
  player.lane = targetLane;
  player.x = lanes[targetLane] - player.width / 2;
}

function startGame() {
  if (gameState === 'playing') return;
  gameState = 'playing';
  if (animationId) cancelAnimationFrame(animationId);
  messageEl.textContent = 'Berhasil! Hindari rintangan dan kumpulkan nitro.';
  pauseBtn.disabled = false;
  startBtn.disabled = true;
  resetBtn.disabled = false;
  frames = 0;
  obstacles = [];
  powerups = [];
  score = 0;
  level = 1;
  speedMultiplier = 1;
  nitroActive = false;
  nitroTimer = 0;
  player.lane = 1;
  player.x = lanes[player.lane] - player.width / 2;
  updateLabels();
  gameLoop();
}

function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  cancelAnimationFrame(animationId);
  messageEl.textContent = 'Permainan dijeda. Tekan Mulai untuk kembali.';
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetGame() {
  gameState = 'idle';
  cancelAnimationFrame(animationId);
  score = 0;
  level = 1;
  speedMultiplier = 1;
  obstacles = [];
  powerups = [];
  frames = 0;
  nitroActive = false;
  nitroTimer = 0;
  player.lane = 1;
  player.x = lanes[player.lane] - player.width / 2;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  messageEl.textContent = 'Tekan Mulai untuk bermain';
  updateLabels();
  ctx.clearRect(0, 0, width, height);
  drawRoad();
}

function endGame(message) {
  gameState = 'over';
  cancelAnimationFrame(animationId);
  messageEl.textContent = `${message} Skor akhir: ${score}`;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  updateLabels();
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    moveLane(-1);
  }
  if (event.key === 'ArrowRight') {
    moveLane(1);
  }
  if (event.key === 'Enter' && gameState !== 'playing') {
    startGame();
  }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', resetGame);

resetGame();
