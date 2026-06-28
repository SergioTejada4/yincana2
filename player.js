const seedInput = document.getElementById('seed-input');
const seedStatus = document.getElementById('seed-status');
const manualLoader = document.getElementById('manual-loader');
const showManualLoaderButton = document.getElementById('show-manual-loader');
const loadSeedButton = document.getElementById('load-seed');
const gamePanel = document.getElementById('game-panel');
const progress = document.getElementById('progress');
const questionBox = document.getElementById('question-box');
const seedCardContent = document.getElementById('seed-card-content');
const toggleSeedPanelButton = document.getElementById('toggle-seed-panel');
const themeToggleButton = document.getElementById('theme-toggle');
const timerDisplay = document.getElementById('timer-display');
const timerSection = document.getElementById('timer-section');

let questions = [];
let currentIndex = 0;
let completed = false;
let timerStartTime = null;
let timerIntervalId = null;

function normalizeText(text) {
  return String(text || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function decodeSeed(seed) {
  const prefix = 'YINCANAS1:';
  const value = seed.trim();
  const normalizedSeed = value.startsWith(prefix) ? value : `${prefix}${value}`;
  const encoded = normalizedSeed.replace(prefix, '');
  const decoded = LZString.decompressFromEncodedURIComponent(encoded);
  if (!decoded) {
    throw new Error('Código de preguntas no válido');
  }
  const payload = JSON.parse(decoded);
  if (!Array.isArray(payload.questions)) {
    throw new Error('El código de preguntas no contiene preguntas');
  }
  return payload.questions;
}

function getSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const querySeed = params.get('seed');
  if (querySeed) {
    return querySeed;
  }

  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  if (lastSegment && lastSegment !== 'player.html') {
    return decodeURIComponent(lastSegment);
  }

  return '';
}

function buildShareUrl(seedValue) {
  const currentUrl = new URL(window.location.href);
  const baseUrl = new URL('player.html', currentUrl.href);
  baseUrl.searchParams.set('seed', seedValue);
  return baseUrl.toString();
}

function formatElapsed(elapsedMs) {
  const totalHundredths = Math.floor(elapsedMs / 10);
  const minutes = Math.floor(totalHundredths / 6000);
  const seconds = Math.floor((totalHundredths % 6000) / 100);
  const hundredths = totalHundredths % 100;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

function stopTimer() {
  if (timerIntervalId) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function updateTimer() {
  if (!timerStartTime || !timerDisplay) {
    return;
  }
  timerDisplay.textContent = `Tiempo: ${formatElapsed(Date.now() - timerStartTime)}`;
}

function startTimer() {
  stopTimer();
  timerStartTime = Date.now();
  if (timerDisplay && timerSection) {
    timerSection.hidden = false;
    updateTimer();
    timerIntervalId = window.setInterval(updateTimer, 10);
  }
}

function resetTimer() {
  stopTimer();
  timerStartTime = null;
  if (timerDisplay && timerSection) {
    timerSection.hidden = true;
    timerDisplay.textContent = 'Tiempo: 00:00.00';
  }
}

function setSeedPanelCollapsed(isCollapsed) {
  if (seedCardContent && toggleSeedPanelButton) {
    seedCardContent.hidden = isCollapsed;
    toggleSeedPanelButton.textContent = isCollapsed ? 'Mostrar' : 'Ocultar';
    toggleSeedPanelButton.setAttribute('aria-expanded', String(!isCollapsed));
  }
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  if (themeToggleButton) {
    themeToggleButton.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
    themeToggleButton.setAttribute('aria-pressed', String(theme === 'dark'));
  }
  localStorage.setItem('yincanas-theme', theme);
}

function loadSeed(seedValue) {
  try {
    questions = decodeSeed(seedValue);
    currentIndex = 0;
    completed = false;
    seedInput.value = seedValue;
    localStorage.setItem('yincanas-seed', seedValue);
    window.history.replaceState({}, '', buildShareUrl(seedValue));
    manualLoader.hidden = true;
    resetTimer();
    startTimer();
    setSeedPanelCollapsed(true);
    if (seedStatus) {
      seedStatus.textContent = 'Código de preguntas cargado correctamente.';
    }
    renderQuestion();
  } catch (error) {
    alert(error.message);
  }
}

function renderQuestion() {
  if (!questions.length) {
    gamePanel.hidden = true;
    return;
  }

  gamePanel.hidden = false;
  const question = questions[currentIndex];
  const questionNumber = currentIndex + 1;
  progress.textContent = `Pregunta ${questionNumber} de ${questions.length}`;

  questionBox.innerHTML = `
    <div class="question-title">${question.prompt || 'Pregunta sin texto'}</div>
    <input id="answer-input" placeholder="Escribe tu respuesta" />
    <div class="actions">
      <button id="check-answer" type="button">Comprobar</button>
      <button id="back-question" type="button" class="secondary">Volver atrás</button>
    </div>
    <div id="feedback" class="muted"></div>
  `;

  document.getElementById('check-answer').addEventListener('click', handleAnswer);
  document.getElementById('back-question').addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });
}

function handleAnswer() {
  const answerInput = document.getElementById('answer-input');
  const feedback = document.getElementById('feedback');
  const currentQuestion = questions[currentIndex];
  const normalizedInput = normalizeText(answerInput.value);
  const normalizedAnswer = normalizeText(currentQuestion.answer || '');
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCorrect = normalizedInput === normalizedAnswer;

  if (isCorrect && isLastQuestion) {
    stopTimer();
  }

  if (isCorrect) {
    feedback.innerHTML = `
      <div class="reward">${currentQuestion.reward || '¡Correcto!'}</div>
      <div class="actions">
        <button id="next-question" type="button">Siguiente</button>
      </div>
    `;
    document.getElementById('next-question').addEventListener('click', () => {
      if (currentIndex < questions.length - 1) {
        currentIndex += 1;
        renderQuestion();
      } else {
        completed = true;
        questionBox.innerHTML = '<div class="question-title">Has terminado.</div><p class="muted">Ya has completado todas las preguntas.</p>';
      }
    });
  } else {
    feedback.textContent = 'Respuesta incorrecta. Inténtalo de nuevo.';
  }
}

loadSeedButton.addEventListener('click', () => {
  loadSeed(seedInput.value);
});

showManualLoaderButton.addEventListener('click', () => {
  setSeedPanelCollapsed(false);
  manualLoader.hidden = false;
  if (seedStatus) {
    seedStatus.textContent = 'Puedes pegar un código de preguntas manualmente si necesitas probar otra partida.';
  }
});

toggleSeedPanelButton.addEventListener('click', () => {
  const isCollapsed = seedCardContent ? seedCardContent.hidden : false;
  setSeedPanelCollapsed(!isCollapsed);
});

themeToggleButton.addEventListener('click', () => {
  const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
});

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('yincanas-theme');
  const preferredTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(preferredTheme);

  const seedFromUrl = getSeedFromUrl();
  const savedSeed = localStorage.getItem('yincanas-seed');

  if (seedFromUrl) {
    loadSeed(seedFromUrl);
  } else if (savedSeed) {
    loadSeed(savedSeed);
  } else {
    gamePanel.hidden = true;
    resetTimer();
    setSeedPanelCollapsed(false);
    if (seedStatus) {
      seedStatus.textContent = 'No se ha recibido un código de preguntas en la URL. Puedes abrir este juego desde un enlace compartido o cargar uno manualmente.';
    }
  }
});

seedInput.addEventListener('input', () => {
  localStorage.setItem('yincanas-seed', seedInput.value);
});
