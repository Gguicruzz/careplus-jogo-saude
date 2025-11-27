// Quiz-only script (quiz.js)
const quizModal = document.getElementById('quizModal');
const quizQuestionEl = document.getElementById('quizQuestion');
const quizOptionsEl = document.getElementById('quizOptions');
const skipQuizBtn = document.getElementById('skipQuiz');
const startBtn = document.getElementById('startBtn');
const howBtn = document.getElementById('howBtn');
const toggleSoundBtn = document.getElementById('toggleSound');
const closeOverlayBtn = document.getElementById('closeOverlayBtn');
const overlay = document.getElementById('overlay');
// Previous variable rScore (old minireport) removed — using rReportScore instead
const rQuizTotal = document.getElementById('rQuizTotal');
const rQuizCorrect = document.getElementById('rQuizCorrect');
const rWrong = document.getElementById('rWrong');
const rStreak = document.getElementById('rStreak');
const toggleViewBtn = document.getElementById('toggleView');
// Mini-report elements (unique IDs)
const rReportScore = document.getElementById('rReportScore');
const rReportTotal = document.getElementById('rReportTotal');
const rReportCorrect = document.getElementById('rReportCorrect');
const rReportWrong = document.getElementById('rReportWrong');
const scoreEl = document.getElementById('score');
const resetBtn = document.getElementById('resetBtn');

const questionBank = [
  { q: 'Qual alimento é mais saudável?', options: ['Hambúrguer', 'Salada', 'Batata frita', 'Refrigerante'], answer: 1 },
  { q: 'Qual a importância de beber água?', options: ['Hidratação', 'Engordar', 'Substituir refeições', 'Evitar exercício'], answer: 0 },
  { q: 'Quantos minutos diários de atividade são recomendados?', options: ['5 minutos', '30 minutos', '5 horas', 'Não é necessário'], answer: 1 },
  { q: 'Qual é uma boa fonte de proteína?', options: ['Frango', 'Refrigerante', 'Biscoito doce', 'Açúcar'], answer: 0 },
  { q: 'Qual é um bom hábito antes de dormir?', options: ['Ler um livro', 'Beber café', 'Ver telas', 'Comer doce'], answer: 0 },
  { q: 'Qual é um benefício do sono adequado?', options: ['Recuperação do corpo', 'Ficar acordado', 'Tomar mais café', 'Perder mais peso'], answer: 0 },
  { q: 'Qual prática ajuda a reduzir o estresse?', options: ['Meditação', 'Procrastinar', 'Isolamento', 'Fumar'], answer: 0 },
  { q: 'Como evitar excesso de açúcar na dieta?', options: ['Evitar refrigerantes', 'Comer mais doces', 'Adicionar açúcar ao café', 'Pular refeições'], answer: 0 },
  { q: 'Por que é importante lavar as mãos regularmente?', options: ['Prevenir infecções', 'Melhorar o cheiro', 'Aliviar cansaço', 'Prolongar o banho'], answer: 0 },
  { q: 'Qual é um sinal de desidratação?', options: ['Boca seca', 'Mais fome', 'Sono profundo', 'Mais apetite'], answer: 0 },
  { q: 'Por que fazer check-ups regulares?', options: ['Detectar problemas cedo', 'Ficar doente de propósito', 'Trocar de médico', 'Não precisa de médico'], answer: 0 },
  { q: 'Qual atividade é considerada exercício aeróbico?', options: ['Caminhada rápida', 'Ler sentado', 'Assistir TV', 'Joguinhos no celular'], answer: 0 },
  { q: 'Qual é uma forma simples de controlar porções?', options: ['Usar pratos menores', 'Comer muito rápido', 'Pular refeições', 'Comer sem pensar'], answer: 0 },
  { q: 'Por que manter o peso saudável é importante?', options: ['Reduz risco de doenças', 'Aumentar fome', 'Fazer dieta o tempo todo', 'Apenas por estética'], answer: 0 },
  { q: 'O que ajuda a fortalecer a saúde mental?', options: ['Conversar com amigos', 'Isolar-se', 'Evitar descanso', 'Buscar só redes sociais'], answer: 0 },
];

const STATE = { pool: [], current: null, total: 0, correct: 0, wrong: 0, points: 0, streak: 0, running: false };
let TOTAL_QUESTIONS = questionBank.length;

let soundEnabled = true;

function resetQuiz(keepOverlay = false) {
  STATE.pool = [...questionBank];
  STATE.current = null; STATE.total = 0; STATE.correct = 0; STATE.wrong = 0; STATE.points = 0; STATE.running = false;
  if (scoreEl) scoreEl.textContent = STATE.points;
  if (rQuizTotal) rQuizTotal.textContent = STATE.total;
  if (rQuizCorrect) rQuizCorrect.textContent = STATE.correct;
  if (rWrong) rWrong.textContent = STATE.wrong;
  if (rStreak) rStreak.textContent = STATE.streak;
  if (rReportTotal) rReportTotal.textContent = '—';
  if (rReportCorrect) rReportCorrect.textContent = '—';
  if (rReportWrong) rReportWrong.textContent = '—';
  if (rReportScore) rReportScore.textContent = '—';
  TOTAL_QUESTIONS = questionBank.length;
  updateProgressUI();
  if (!keepOverlay && overlay) {
    overlay.classList.remove('hidden');
    const h = overlay.querySelector('h2');
    const p = overlay.querySelector('.box p');
    if (h) h.textContent = 'Bem‑vindo ao Quiz!';
    if (p) p.textContent = 'Aprenda sobre hábitos saudáveis respondendo perguntas simples. Toque em Iniciar para começar.';
  }
}

function pickQuestion() {
  if (!STATE.pool.length) return null;
  const i = Math.floor(Math.random() * STATE.pool.length);
  const q = STATE.pool.splice(i, 1)[0];
  STATE.current = q;
  return q;
}

function updateProgressUI(){
  const progressEl = document.getElementById('quizProgress');
  const answered = STATE.total; // answered so far
  const remaining = STATE.pool.length; // remaining
  const currentIndex = TOTAL_QUESTIONS - remaining; // 1-based
  if (progressEl) progressEl.textContent = `Pergunta ${Math.max(0,currentIndex)} / ${TOTAL_QUESTIONS}`;
  const meter = document.querySelector('.meter b');
  if (meter) {
    const percent = Math.round((STATE.total / TOTAL_QUESTIONS) * 100);
    meter.style.width = `${percent}%`;
  }
}

function handleKeyNavigation(e){
  const options = quizOptionsEl ? Array.from(quizOptionsEl.querySelectorAll('button')) : [];
  if (!options.length) return;
  const active = document.activeElement;
  let idx = options.indexOf(active);
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight'){
    e.preventDefault(); idx = idx < options.length-1 ? idx+1 : 0; options[idx].focus();
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft'){
    e.preventDefault(); idx = idx > 0 ? idx-1 : options.length-1; options[idx].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    // trigger answer
    if (idx >= 0) { e.preventDefault(); options[idx].click(); }
  }
}

function presentQuestion() {
  const q = STATE.current || pickQuestion();
  if (!q) return finishQuiz();
  if (quizQuestionEl) quizQuestionEl.textContent = q.q;
  if (quizOptionsEl) {
    quizOptionsEl.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const b = document.createElement('button');
      b.className = 'btn small ghost';
      b.setAttribute('type', 'button');
      b.setAttribute('role', 'option');
      b.dataset.index = idx;
      b.textContent = opt;
      b.addEventListener('click', () => answerQuestion(idx));
      quizOptionsEl.appendChild(b);
    });
    // Focus first option for keyboard users
    const first = quizOptionsEl.querySelector('button');
    if (first) first.focus();
  }
  updateProgressUI();
}

function answerQuestion(idx) {
  if (!STATE.current) return;
  const correct = STATE.current.answer;
  STATE.total += 1;
  const btns = quizOptionsEl ? Array.from(quizOptionsEl.querySelectorAll('button')) : [];
  btns.forEach(b => { b.classList.add('disabled'); b.setAttribute('aria-disabled','true'); });
  if (idx === correct) {
    STATE.correct += 1; STATE.points += 1; STATE.streak += 1;
    if (btns[idx]) btns[idx].classList.add('correct');
  } else {
    STATE.wrong += 1; STATE.streak = 0;
    if (btns[idx]) btns[idx].classList.add('wrong');
    if (btns[correct]) btns[correct].classList.add('correct');
  }
  if (scoreEl) scoreEl.textContent = STATE.points;
  if (rQuizTotal) rQuizTotal.textContent = STATE.total;
  if (rQuizCorrect) rQuizCorrect.textContent = STATE.correct;
  if (rWrong) rWrong.textContent = STATE.wrong;
  if (rStreak) rStreak.textContent = STATE.streak;
  if (rReportTotal) rReportTotal.textContent = STATE.total;
  if (rReportCorrect) rReportCorrect.textContent = STATE.correct;
  if (rReportWrong) rReportWrong.textContent = STATE.wrong;
  updateProgressUI();
  setTimeout(() => { STATE.current = null; if (STATE.pool.length) presentQuestion(); else finishQuiz(); }, 800);
}

function skipQuestion() { if (!STATE.current) return; STATE.total += 1; STATE.current = null; if (rQuizTotal) rQuizTotal.textContent = STATE.total; if (rQuizCorrect) rQuizCorrect.textContent = STATE.correct; if (rReportTotal) rReportTotal.textContent = STATE.total; if (rReportCorrect) rReportCorrect.textContent = STATE.correct; updateProgressUI(); if (STATE.pool.length) presentQuestion(); else finishQuiz(); }

function startQuiz() { resetQuiz(true); STATE.running = true; if (overlay) overlay.classList.add('hidden'); if (quizModal) quizModal.classList.remove('hidden'); presentQuestion(); if (startBtn) { startBtn.disabled = true; startBtn.textContent = 'Quiz em progresso...'; } attachKeyNav(); }
// Add keyboard navigation while quiz modal is open
function attachKeyNav(){ document.addEventListener('keydown', handleKeyNavigation); }
function detachKeyNav(){ document.removeEventListener('keydown', handleKeyNavigation); }

function finishQuiz() {
  if (quizModal) quizModal.classList.add('hidden');
  STATE.running = false;
  if (overlay) {
    overlay.classList.remove('hidden');
    const h = overlay.querySelector('h2');
    const p = overlay.querySelector('.box p');
    if (h) h.textContent = 'Resumo da Sessão';
    if (p) p.innerHTML = 'Parabéns por participar do quiz!<br><br>Manter bons hábitos de saúde — como beber água regularmente, fazer atividade física, dormir bem, ter uma alimentação equilibrada e cuidar da saúde mental — é fundamental para prevenir doenças, melhorar a qualidade de vida e aumentar o bem-estar. Pequenas mudanças diárias fazem grande diferença. Continue se cuidando!';
  }
  // Set the mini-report sidebar and report values
  if (rQuizTotal) rQuizTotal.textContent = STATE.total || 0;
  if (rQuizCorrect) rQuizCorrect.textContent = STATE.correct || 0;
  if (rWrong) rWrong.textContent = STATE.wrong || 0;
  if (rReportScore) rReportScore.textContent = STATE.points || 0;
  if (rReportTotal) rReportTotal.textContent = STATE.total || 0;
  if (rReportCorrect) rReportCorrect.textContent = STATE.correct || 0;
  if (rReportWrong) rReportWrong.textContent = STATE.wrong || 0;
  if (rStreak) rStreak.textContent = STATE.streak || 0;
  if (startBtn) { startBtn.disabled = false; startBtn.textContent = 'Iniciar'; }
  // remove keyboard handler
  detachKeyNav();
}

if (startBtn) startBtn.addEventListener('click', startQuiz);
if (skipQuizBtn) skipQuizBtn.addEventListener('click', skipQuestion);
if (closeOverlayBtn) closeOverlayBtn.addEventListener('click', () => { if (overlay) overlay.classList.add('hidden'); });
if (howBtn) howBtn.addEventListener('click', () => { if (overlay) overlay.classList.remove('hidden'); if (overlay) { const h = overlay.querySelector('h2'); const p = overlay.querySelector('.box p'); if (h) h.textContent = 'Como Jogar'; if (p) p.textContent = 'Responda às perguntas para aprender bons hábitos.'; }});
if (toggleSoundBtn) toggleSoundBtn.addEventListener('click', () => { soundEnabled = !soundEnabled; toggleSoundBtn.classList.toggle('active', soundEnabled); toggleSoundBtn.textContent = soundEnabled ? 'Som: ligado' : 'Som: desligado'; });
if (toggleViewBtn) toggleViewBtn.addEventListener('click', () => {
  const pressed = toggleViewBtn.getAttribute('aria-pressed') === 'true';
  document.body.classList.toggle('game-view', !pressed);
  toggleViewBtn.setAttribute('aria-pressed', (!pressed).toString());
  toggleViewBtn.textContent = !pressed ? 'Modo Clássico' : 'Modo Jogo';
});
if (resetBtn) resetBtn.addEventListener('click', () => { resetQuiz(false); });

resetQuiz(false);

window.CPQuiz = { STATE, startQuiz, finishQuiz, resetQuiz }