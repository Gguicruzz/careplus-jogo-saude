// =============================
//  Care Plus - Jogo da Saúde
// =============================

// Seletores
const canvas = document.getElementById("playfield");
const ctx = canvas.getContext("2d");
const timerEl = document.getElementById("timer");
const pointsEl = document.getElementById("points");
const healthBar = document.getElementById("healthBar");
const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const endMessage = document.getElementById("endMessage");
const finalScore = document.getElementById("finalScore");
const reportSteps = document.getElementById("reportSteps");
const playAgain = document.getElementById("playAgain");

// Variáveis do jogo
let player = { x: 150, y: 350, size: 30, speed: 5 };
let goodItems = [];
let badItems = [];
let points = 0;
let health = 100;
let timeLeft = 30;
let gameRunning = false;

// Criar itens
function spawnItem(list, color) {
  list.push({
    x: Math.random() * (canvas.width - 20),
    y: -20,
    size: 20,
    color: color,
    speed: 2 + Math.random() * 3,
  });
}

// Loop principal
function update() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenhar jogador
  ctx.fillStyle = "#005bab";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // Atualizar itens
  moveItems(goodItems, true);
  moveItems(badItems, false);

  requestAnimationFrame(update);
}

function moveItems(list, isGood) {
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    item.y += item.speed;

    // Desenhar
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
    ctx.fill();

    // Colisão
    if (distance(player, item) < player.size + item.size) {
      if (isGood) {
        points++;
        pointsEl.textContent = points;
      } else {
        health -= 15;
        if (health < 0) health = 0;
        healthBar.style.width = health + "%";
      }
      list.splice(i, 1);
      i--;
      continue;
    }

    // Remover se sair da tela
    if (item.y > canvas.height) {
      list.splice(i, 1);
      i--;
    }
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Temporizador
function startTimer() {
  let timer = setInterval(() => {
    if (!gameRunning) return clearInterval(timer);

    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft % 2 === 0) spawnItem(goodItems, "#2ecc71");
    if (timeLeft % 3 === 0) spawnItem(badItems, "#e74c3c");

    if (timeLeft <= 0 || health <= 0) {
      endGame();
      clearInterval(timer);
    }
  }, 1000);
}

// Iniciar jogo
function startGame() {
  startScreen.style.display = "none";
  endScreen.style.display = "none";
  gameRunning = true;

  // Reset
  points = 0;
  health = 100;
  timeLeft = 30;
  goodItems = [];
  badItems = [];

  pointsEl.textContent = points;
  timerEl.textContent = timeLeft;
  healthBar.style.width = "100%";

  update();
  startTimer();
}

// Fim de jogo
function endGame() {
  gameRunning = false;
  endScreen.style.display = "flex";

  finalScore.textContent = points;

  let message = points >= 15
    ? "Parabéns! Seus hábitos saudáveis estão em dia!"
    : "Você precisa cuidar melhor da sua saúde no dia a dia!";

  endMessage.textContent = message;

  // Relatório
  reportSteps.innerHTML =
    `<li>Você coletou <span>${points}</span> itens saudáveis.</li>
     <li>Sua energia final foi de <span>${health}%</span>.</li>
     <li>O tempo total de jogo foi de <span>30 segundos</span>.</li>`;
}

playAgain.onclick = startGame;

// Movimento
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  if (e.key === "ArrowLeft" && player.x - player.size > 0) player.x -= player.speed;
  if (e.key === "ArrowRight" && player.x + player.size < canvas.width)
    player.x += player.speed;
});

// Botão iniciar
window.startGame = startGame;
