const seedInput = document.getElementById('seed-input');
const seedStatus = document.getElementById('seed-status');
const manualLoader = document.getElementById('manual-loader');
const showManualLoaderButton = document.getElementById('show-manual-loader');
const loadSeedButton = document.getElementById('load-seed');
const gamePanel = document.getElementById('game-panel');
const progress = document.getElementById('progress');
const questionBox = document.getElementById('question-box');

let questions = [];
let currentIndex = 0;
let completed = false;

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
    throw new Error('SEED no válida');
  }
  const payload = JSON.parse(decoded);
  if (!Array.isArray(payload.questions)) {
    throw new Error('La SEED no contiene preguntas');
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

function loadSeed(seedValue) {
  try {
    questions = decodeSeed(seedValue);
    currentIndex = 0;
    completed = false;
    seedInput.value = seedValue;
    localStorage.setItem('yincanas-seed', seedValue);
    window.history.replaceState({}, '', buildShareUrl(seedValue));
    manualLoader.hidden = true;
    if (seedStatus) {
      seedStatus.textContent = 'SEED cargada correctamente.';
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

  if (normalizedInput === normalizedAnswer) {
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
  manualLoader.hidden = false;
  if (seedStatus) {
    seedStatus.textContent = 'Puedes pegar una SEED manualmente si necesitas probar otra partida.';
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const seedFromUrl = getSeedFromUrl();
  const savedSeed = localStorage.getItem('yincanas-seed');

  if (seedFromUrl) {
    loadSeed(seedFromUrl);
  } else if (savedSeed) {
    loadSeed(savedSeed);
  } else {
    gamePanel.hidden = true;
    if (seedStatus) {
      seedStatus.textContent = 'No se ha recibido una SEED en la URL. Puedes abrir este juego desde un enlace compartido o cargar una manualmente.';
    }
  }
});

seedInput.addEventListener('input', () => {
  localStorage.setItem('yincanas-seed', seedInput.value);
});
