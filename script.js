// Care Plus — Jogo Interativo de Saúde (Refatorado)
// Responsável: GitHub Copilot — melhorias para jogabilidade e UX

// DOM selectors
const canvas = document.getElementById('playfield');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay') || document.querySelector('.overlay');
const quizModal = document.getElementById('quizModal');
const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');
const skipQuizBtn = document.getElementById('skipQuiz');
const startBtn = document.getElementById('startBtn');
const howBtn = document.getElementById('howBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const toggleSoundBtn = document.getElementById('toggleSound');
const stageEl = document.getElementById('stage');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');
const healthBarEl = document.getElementById('healthBar');
const rScore = document.getElementById('rScore');
const rGood = document.getElementById('rGood');
const rBad = document.getElementById('rBad');
const rLevel = document.getElementById('rLevel');
const rQuizTotal = document.getElementById('rQuizTotal');
const rQuizCorrect = document.getElementById('rQuizCorrect');
const levelEl = document.getElementById('level');

// Responsive canvas sizing on load/resize
function resizeCanvas() {
  const rect = stageEl ? stageEl.getBoundingClientRect() : document.querySelector('.card.stage').getBoundingClientRect();
  const padding = 20;
  canvas.width = Math.max(320, Math.min(900, rect.width - padding));
  canvas.height = Math.max(300, Math.min(600, rect.height - padding));
}
window.addEventListener('resize', resizeCanvas);
// defensive: if overlay or canvas are missing, bail out
if (!overlay) console.warn('Overlay element missing — defaulting to mount a simple overlay');
if (!canvas) throw new Error('Missing canvas element; check #playfield exists in index.html');
resizeCanvas();

// Game constants & state
const STATE = {
  running: false,
  paused: false,
  score: 0,
  lives: 3,
  health: 100,
  timeLeft: 60,
  level: 1,
  goodCollected: 0,
  badAvoided: 0,
  quizCorrect: 0,
  quizTotal: 0,
};

const player = { x: 0, y: 0, w: 90, h: 28, speed: 8 };
let goodItems = [];
let badItems = [];
let lastSpawnAt = 0;
let lastFrame = performance.now();

// visual settings
const settings = {
  spawnBaseInterval: 900, // ms
  maxLevel: 10,
};

// Utilities
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rand(min, max) { return Math.random() * (max - min) + min; }

// Player position init
function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height - 48;
}

// Spawn logic creates emoji items for simplicity (no external assets required)
function spawnItem(isGood = true) {
  const size = rand(18, 30);
  const obj = {
    x: rand(size, canvas.width - size),
    y: -size,
    size,
    speed: rand(1.4, 3.6) + STATE.level * 0.15,
    good: isGood,
    emoji: isGood ? (Math.random() > 0.6 ? '🍎' : '🥦') : (Math.random() > 0.5 ? '🍔' : '🍫'),
  };
  if (isGood) goodItems.push(obj); else badItems.push(obj);
}

// Basic quiz bank (pt-BR) — lightweight educational health questions
const questionBank = [
  { q: 'Qual alimento é mais saudável?', options: ['Hambúrguer', 'Salada', 'Batata frita', 'Refrigerante'], answer: 1 },
  { q: 'Qual a importância de beber água?', options: ['Hidratação', 'Engordar', 'Substituir refeições', 'Evitar exercício'], answer: 0 },
  { q: 'Quantos minutos diários de atividade são recomendados?', options: ['5 minutos', '30 minutos', '5 horas', 'Não é necessário'], answer: 1 },
  { q: 'Qual alimento é fonte de proteína?', options: ['Arroz', 'Feijão', 'Frango', 'Açúcar'], answer: 2 },
  { q: 'Qual é um bom hábito antes de dormir?', options: ['Consumir cafeína', 'Exercício intenso', 'Rotina relaxante', 'Assistir telas até dormir'], answer: 2 },
];

// Open quiz (pause game)
function openQuiz() {
  if (!quizModal) return;
  STATE.paused = true; // pause animation & timer
  quizModal.classList.remove('hidden');
  // pick a random question
  const q = questionBank[Math.floor(Math.random() * questionBank.length)];
  STATE.currentQuiz = q;
  quizQuestionEl.textContent = q.q;
  quizOptionsEl.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn small ghost';
    btn.textContent = opt;
    btn.addEventListener('click', () => answerQuiz(idx));
    quizOptionsEl.appendChild(btn);
  });
}

function closeQuiz() {
  if (!quizModal) return;
  quizModal.classList.add('hidden');
  STATE.paused = false;
  STATE.currentQuiz = null;
}

function answerQuiz(selectedIndex) {
  if (!STATE.currentQuiz) return;
  const correctIndex = STATE.currentQuiz.answer;
  STATE.quizTotal += 1;
  if (selectedIndex === correctIndex) {
    STATE.quizCorrect += 1;
    const bonus = 5 * STATE.level; // reward
    STATE.score += bonus;
    playBeep('good');
    // animate button as success
    for (const b of quizOptionsEl.children) b.classList.add('disabled');
    quizOptionsEl.children[selectedIndex].classList.add('correct');
  } else {
    // penalty: slight health or points penalty
    STATE.health = clamp(STATE.health - 8, 0, 100);
    playBeep('bad');
    quizOptionsEl.children[selectedIndex].classList.add('wrong');
    quizOptionsEl.children[correctIndex].classList.add('correct');
  }
  // Update UI immediately
  scoreEl.textContent = STATE.score;
  healthBarEl.style.width = STATE.health + '%';
  // small delay to show result then close
  setTimeout(() => closeQuiz(), 900);
}

// Simple feedback sounds via Web Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;
function playBeep(type = 'good') {
  if (!soundEnabled) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  if (type === 'good') o.frequency.value = 880;
  else o.frequency.value = 240;
  g.gain.value = 0.08;
  o.start();
  setTimeout(() => { o.stop(); }, 110);
}

// Input handling: keyboard & mouse/touch
let input = { left: false, right: false };
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') input.left = true;
  if (e.key === 'ArrowRight') input.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') input.left = false;
  if (e.key === 'ArrowRight') input.right = false;
});

// Simple touch-friendly controls: track touches on left/right halves
window.addEventListener('touchstart', (e) => {
  for (const t of e.touches) {
    if (t.clientX < window.innerWidth / 2) input.left = true;
    else input.right = true;
  }
});
window.addEventListener('touchend', () => { input.left = false; input.right = false; });

// Game lifecycle: start, pause, reset
function startGame() {
  resetState(true);
  STATE.running = true;
  STATE.paused = false;
  overlay.style.display = 'none';
  lastSpawnAt = performance.now();
  lastFrame = performance.now();
  requestAnimationFrame(loop);
}

function pauseGame() {
  if (!STATE.running) return;
  STATE.paused = !STATE.paused;
  pauseBtn.textContent = STATE.paused ? 'Continuar' : 'Pausar';
  if (!STATE.paused) {
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }
}

function resetState(keepOverlay = false) {
  STATE.score = 0;
  STATE.lives = 3;
  STATE.health = 100;
  STATE.timeLeft = 60;
  STATE.level = 1;
  STATE.goodCollected = 0;
  STATE.badAvoided = 0;
  goodItems = [];
  badItems = [];
  scoreEl.textContent = STATE.score;
  livesEl.textContent = STATE.lives;
  timeEl.textContent = STATE.timeLeft;
  healthBarEl.style.width = STATE.health + '%';
  levelEl.textContent = STATE.level;
  if (!keepOverlay) overlay.style.display = 'flex';
  resetPlayer();
  // Reset overlay content for welcoming message
  overlay.querySelector('h2').textContent = 'Bem‑vindo!';
  overlay.querySelector('.box p').textContent = 'Movimente a cesta com as setas ou tocando na tela.';
}

function endGame() {
  STATE.running = false;
  overlay.style.display = 'flex';
  overlay.querySelector('h2').textContent = 'Fim de Jogo';
  overlay.querySelector('.box p').textContent = 'Veja seu mini-relatório abaixo.';
  rScore.textContent = STATE.score;
  rGood.textContent = STATE.goodCollected;
  rBad.textContent = (STATE.timeLeft <= 0 ? STATE.badAvoided : STATE.badAvoided);
  rLevel.textContent = STATE.level;
  rQuizTotal.textContent = STATE.quizTotal;
  rQuizCorrect.textContent = STATE.quizCorrect;
}

// Collision detection
function collides(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = Math.hypot(dx, dy);
  return dist < (b.size + Math.max(a.w, a.h) / 2 - 4);
}

// Main loop
function loop(now) {
  if (!STATE.running || STATE.paused) return;
  const dt = Math.min(40, now - lastFrame);
  lastFrame = now;

  // Clear & background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f8fbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // controls & player movement
  if (input.left) player.x -= player.speed;
  if (input.right) player.x += player.speed;
  player.x = clamp(player.x, player.w / 2, canvas.width - player.w / 2);

  // draw basket (player)
  ctx.save();
  ctx.fillStyle = '#005bab';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y, player.w / 2, player.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧺', player.x, player.y + 6);
  ctx.restore();

  // Spawning logic changes with level
  const spawnInterval = Math.max(220, settings.spawnBaseInterval - (STATE.level - 1) * 70);
  if (now - lastSpawnAt > spawnInterval) {
    lastSpawnAt = now;
    spawnItem(Math.random() > 0.35); // more likely to be good
  }

  // Update items arrays
  const updateList = (list, onGood) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i];
      it.y += it.speed * (dt / 16);
      // render emoji
      ctx.font = `${it.size}px serif`;
      ctx.fillText(it.emoji, it.x, it.y);
      // collision with player
      if (collides(player, it)) {
        if (it.good) {
          STATE.score += 1 * STATE.level;
          STATE.goodCollected++;
          STATE.health = clamp(STATE.health + 3, 0, 100);
          playBeep('good');
          // small chance of triggering a quiz on collecting a good item
          if (Math.random() < 0.28 && !STATE.paused && STATE.running) openQuiz();
        } else {
          STATE.health -= 18;
          STATE.badAvoided++;
          if (STATE.health <= 0) {
            STATE.lives -= 1;
            STATE.health = 60; // small recovery to continue
          }
          playBeep('bad');
        }
        list.splice(i, 1);
      } else if (it.y > canvas.height + it.size) {
        // missed good items reduces score slightly
        if (it.good) STATE.score = Math.max(0, STATE.score - 0);
        // remove
        list.splice(i, 1);
      }
    }
  };

  updateList(goodItems, true);
  updateList(badItems, false);

  // Level-up logic (simple threshold)
  if (STATE.score >= STATE.level * 10 && STATE.level < settings.maxLevel) {
    STATE.level += 1;
  }

  // UI update
  scoreEl.textContent = STATE.score;
  livesEl.textContent = STATE.lives;
  healthBarEl.style.width = `${STATE.health}%`;
  timeEl.textContent = STATE.timeLeft;
  levelEl.textContent = STATE.level;

  // End conditions
  if (STATE.lives <= 0) endGame();

  requestAnimationFrame(loop);
}

// Timers (separate from animation frames)
let gameTimerId = null;
function startTimer() {
  if (gameTimerId) clearInterval(gameTimerId);
  gameTimerId = setInterval(() => {
    if (!STATE.running || STATE.paused) return;
    STATE.timeLeft -= 1;
    timeEl.textContent = STATE.timeLeft;
    if (STATE.timeLeft <= 0) {
      clearInterval(gameTimerId);
      endGame();
    }
  }, 1000);
}

// Hook up UI
startBtn.addEventListener('click', () => { startGame(); startTimer(); });
pauseBtn.addEventListener('click', pauseGame);
resetBtn.addEventListener('click', () => { resetState(false); });
toggleSoundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; toggleSoundBtn.classList.toggle('active', soundEnabled); toggleSoundBtn.textContent = soundEnabled ? 'Som: ligado' : 'Som: desligado'; });
if (skipQuizBtn) skipQuizBtn.addEventListener('click', () => { STATE.quizTotal += 1; closeQuiz(); });
howBtn.addEventListener('click', () => {
  // Show a quick how-to in overlay
  overlay.style.display = 'flex';
  overlay.querySelector('h2').textContent = 'Como Jogar';
  overlay.querySelector('.box p').textContent = 'Use as setas (ou toque nas laterais da tela) para mover a cesta e pegar itens saudáveis. Evite itens prejudiciais!';
});

// Initial state setup
resetState(false);

// Make sure the overlay has a default message when not in-game
overlay.querySelector('h2').textContent = 'Bem‑vindo!';
overlay.querySelector('.box p').textContent = 'Movimente a cesta com as setas ou tocando na tela.';

// Expose for debugging
window.CPGame = { STATE, startGame, pauseGame, resetState };
