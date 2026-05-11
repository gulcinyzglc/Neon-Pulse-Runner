const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = "start";
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let speed = 3.5;
let frame = 0;

const groundY = 440;

let dashCooldown = 0;
const dashCooldownMax = 120;

let shieldActive = false;
let cameraShake = 0;

let theme = {
  player: "#00ffff",
  ground: "#ff00ff",
  obstacle: "#ff0055",
  orb: "#ffff00",
  shield: "#00ff88",
  background: "#050014"
};

const player = {
  x: 120,
  y: groundY - 50,
  width: 45,
  height: 50,
  dy: 0,
  gravity: 0.8,
  jumpPower: -16,
  onGround: true,
  dashTime: 0,
  jumpCount: 0,
  maxJumps: 2
};

let obstacles = [];
let orbs = [];
let particles = [];
let stars = [];

for (let i = 0; i < 70; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * 300,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.8 + 0.3
  });
}

function updateTheme() {
  if (score < 1000) {
    theme.player = "#00ffff";
    theme.ground = "#ff00ff";
    theme.obstacle = "#ff0055";
  } else if (score < 2000) {
    theme.player = "#ff9900";
    theme.ground = "#ff0055";
    theme.obstacle = "#00ffff";
  } else if (score < 3000) {
    theme.player = "#00ff88";
    theme.ground = "#00ffff";
    theme.obstacle = "#ff00ff";
  } else {
    theme.player = "#ffff00";
    theme.ground = "#ffaa00";
    theme.obstacle = "#ff0055";
  }
}

function drawBackground() {
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.globalAlpha = 0.6;
    ctx.fillRect(star.x, star.y, star.size, star.size);
    star.x -= star.speed;

    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * 300;
    }
  });
  ctx.globalAlpha = 1;

  ctx.strokeStyle = theme.ground;
  ctx.lineWidth = 3;
  ctx.shadowColor = theme.ground;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  let glowColor = player.dashTime > 0 ? "#ffff00" : theme.player;

  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 25;

  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#050014";
  ctx.fillRect(player.x + 10, player.y + 12, 25, 8);

  if (shieldActive) {
    ctx.strokeStyle = theme.shield;
    ctx.shadowColor = theme.shield;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(
      player.x + player.width / 2,
      player.y + player.height / 2,
      40,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

function updatePlayer() {
  player.y += player.dy;

  if (!player.onGround) {
    player.dy += player.gravity;
  }

  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.dy = 0;
    player.onGround = true;
    player.jumpCount = 0;
  }

  if (player.dashTime > 0) {
    player.dashTime--;
  }

  if (dashCooldown > 0) {
    dashCooldown--;
  }

  createPlayerParticles();
}

function jump() {
  if (player.jumpCount < player.maxJumps) {
    player.dy = player.jumpPower;
    player.onGround = false;
    player.jumpCount++;
  }
}

function dash() {
  if (player.dashTime === 0 && dashCooldown === 0) {
    player.dashTime = 18;
    dashCooldown = dashCooldownMax;
  }
}

function createObstacle() {
  const type = Math.random();

  let obstacle;

  if (type < 0.5) {
    obstacle = {
      x: canvas.width,
      y: groundY - 45,
      width: 35,
      height: 45,
      color: theme.obstacle
    };
  } else {
    obstacle = {
      x: canvas.width,
      y: groundY - 120,
      width: 70,
      height: 18,
      color: theme.obstacle
    };
  }

  obstacles.push(obstacle);
}

function drawObstacles() {
  obstacles.forEach(obstacle => {
    ctx.fillStyle = obstacle.color;
    ctx.shadowColor = obstacle.color;
    ctx.shadowBlur = 25;
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.shadowBlur = 0;
  });
}

function updateObstacles() {
  obstacles.forEach(obstacle => {
    let dashBonus = player.dashTime > 0 ? 2 : 0;
    obstacle.x -= speed + dashBonus;
  });

  obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
}

function createOrb() {
  const isShield = Math.random() < 0.2;

  orbs.push({
    x: canvas.width,
    y: Math.random() * 180 + 180,
    radius: isShield ? 12 : 10,
    collected: false,
    type: isShield ? "shield" : "score"
  });
}

function drawOrbs() {
  orbs.forEach(orb => {
    const color = orb.type === "shield" ? theme.shield : theme.orb;

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function updateOrbs() {
  orbs.forEach(orb => {
    orb.x -= speed;
  });

  orbs = orbs.filter(orb => orb.x + orb.radius > 0 && !orb.collected);
}

function checkOrbCollision() {
  orbs.forEach(orb => {
    if (
      player.x < orb.x + orb.radius &&
      player.x + player.width > orb.x - orb.radius &&
      player.y < orb.y + orb.radius &&
      player.y + player.height > orb.y - orb.radius
    ) {
      orb.collected = true;

      if (orb.type === "shield") {
        shieldActive = true;
        createBurst(orb.x, orb.y, theme.shield);
      } else {
        score += 200;
        createBurst(orb.x, orb.y, theme.orb);
      }
    }
  });
}

function checkCollision() {
  obstacles.forEach(obstacle => {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      if (player.dashTime > 0) {
        obstacle.x = -100;
        score += 100;
        cameraShake = 8;
        createBurst(player.x + player.width, player.y, "#ffff00");
      } else if (shieldActive) {
        shieldActive = false;
        obstacle.x = -100;
        cameraShake = 10;
        createBurst(player.x, player.y, theme.shield);
      } else {
        gameState = "gameover";

        if (score > highScore) {
          highScore = score;
          localStorage.setItem("highScore", highScore);
        }
      }
    }
  });
}

function createPlayerParticles() {
  particles.push({
    x: player.x,
    y: player.y + player.height / 2,
    size: Math.random() * 4 + 2,
    dx: -Math.random() * 3,
    dy: Math.random() * 2 - 1,
    life: 25,
    color: player.dashTime > 0 ? "#ffff00" : theme.player
  });
}

function createBurst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x,
      y: y,
      size: Math.random() * 6 + 3,
      dx: Math.random() * 8 - 4,
      dy: Math.random() * 8 - 4,
      life: 25,
      color: color
    });
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
  });

  particles = particles.filter(p => p.life > 0);
}

function drawDashBar() {
  const barX = 760;
  const barY = 30;
  const barWidth = 180;
  const barHeight = 18;

  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  let readyAmount = 1 - dashCooldown / dashCooldownMax;

  ctx.fillStyle = dashCooldown === 0 ? "#00ff88" : "#ffff00";
  ctx.fillRect(barX, barY, barWidth * readyAmount, barHeight);

  ctx.strokeStyle = "white";
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("DASH", barX, barY - 8);
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 30, 40);
  ctx.fillText("High Score: " + highScore, 30, 75);

  ctx.font = "18px Arial";
  ctx.fillText("Jump: " + player.jumpCount + " / " + player.maxJumps, 30, 110);

  if (shieldActive) {
    ctx.fillStyle = theme.shield;
    ctx.fillText("SHIELD ACTIVE", 30, 140);
  }

  if (score >= 1000) {
    ctx.fillStyle = theme.player;
    ctx.fillText("Theme Level: " + Math.floor(score / 1000), 30, 170);
  }

  drawDashBar();

  if (player.dashTime > 0) {
    ctx.fillStyle = "#ffff00";
    ctx.font = "24px Arial";
    ctx.fillText("DASH!", 450, 40);
  }
}

function drawStartScreen() {
  drawBackground();

  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 25;
  ctx.font = "55px Arial";
  ctx.fillText("NEON PULSE RUNNER", 210, 230);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Press ENTER to Start", 380, 300);
  ctx.fillText("SPACE: Jump / Double Jump", 350, 340);
  ctx.fillText("SHIFT: Dash | P: Pause", 370, 375);
  ctx.fillText("Green Orb: Shield Power-Up", 355, 410);
}

function drawPauseScreen() {
  drawBackground();
  drawPlayer();
  drawObstacles();
  drawOrbs();
  drawParticles();

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 25;
  ctx.font = "60px Arial";
  ctx.fillText("PAUSED", 390, 250);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Press P to Continue", 380, 310);
}

function drawGameOverScreen() {
  drawBackground();
  drawPlayer();
  drawObstacles();
  drawOrbs();
  drawParticles();

  ctx.fillStyle = "#ff0055";
  ctx.shadowColor = "#ff0055";
  ctx.shadowBlur = 25;
  ctx.font = "60px Arial";
  ctx.fillText("GAME OVER", 330, 240);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "white";
  ctx.font = "26px Arial";
  ctx.fillText("Final Score: " + score, 410, 300);
  ctx.fillText("High Score: " + highScore, 410, 335);
  ctx.fillText("Press R to Restart", 390, 375);
}

function resetGame() {
  gameState = "playing";
  score = 0;
  speed = 3.5;
  frame = 0;
  dashCooldown = 0;
  shieldActive = false;
  cameraShake = 0;

  player.y = groundY - player.height;
  player.dy = 0;
  player.onGround = true;
  player.dashTime = 0;
  player.jumpCount = 0;

  obstacles = [];
  orbs = [];
  particles = [];
}

function updateGame() {
  updateTheme();

  updatePlayer();
  updateObstacles();
  updateOrbs();
  updateParticles();

  checkCollision();
  checkOrbCollision();

  score++;

  if (frame % 600 === 0) {
    speed += 0.6;
  }

  if (frame % 95 === 0) {
    createObstacle();
  }

  if (frame % 170 === 0) {
    createOrb();
  }
}

function drawGame() {
  if (cameraShake > 0) {
    ctx.save();
    ctx.translate(
      Math.random() * 8 - 4,
      Math.random() * 8 - 4
    );
    cameraShake--;
  }

  drawBackground();
  drawPlayer();
  drawObstacles();
  drawOrbs();
  drawParticles();

  if (cameraShake >= 0) {
    ctx.restore();
  }

  drawUI();
}

function gameLoop() {
  frame++;

  if (gameState === "start") {
    drawStartScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "pause") {
    drawPauseScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "gameover") {
    drawGameOverScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  updateGame();
  drawGame();

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function(event) {
  if (event.code === "Enter" && gameState === "start") {
    resetGame();
  }

  if (event.code === "Space" && gameState === "playing") {
    jump();
  }

  if (event.code === "ShiftLeft" && gameState === "playing") {
    dash();
  }

  if (event.code === "KeyP") {
    if (gameState === "playing") {
      gameState = "pause";
    } else if (gameState === "pause") {
      gameState = "playing";
    }
  }

  if (event.code === "KeyR" && gameState === "gameover") {
    resetGame();
  }
});

gameLoop();