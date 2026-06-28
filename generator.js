const questionsList = document.getElementById('questions-list');
const seedOutput = document.getElementById('seed-output');
const shareOutput = document.getElementById('share-output');
const qrOutput = document.getElementById('qr-output');
const addQuestionButton = document.getElementById('add-question');
const generateSeedButton = document.getElementById('generate-seed');
const copySeedButton = document.getElementById('copy-seed');
const copyLinkButton = document.getElementById('copy-link');
const generateQrButton = document.getElementById('generate-qr');
const downloadSeedButton = document.getElementById('download-seed');
const loadSeedButton = document.getElementById('load-seed');
const loadFileButton = document.getElementById('load-file');
const seedFileInput = document.getElementById('seed-file');

function normalizeText(text) {
  return String(text || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function createQuestionBlock(index) {
  const block = document.createElement('div');
  block.className = 'question-block';
  block.innerHTML = `
    <div class="actions">
      <strong>Pregunta ${index + 1}</strong>
      <button type="button" class="danger remove-question">Eliminar</button>
    </div>
    <label for="question-${index}">Pregunta o pista</label>
    <input id="question-${index}" data-role="prompt" placeholder="Escribe la pregunta o pista" />
    <label for="answer-${index}">Respuesta correcta</label>
    <input id="answer-${index}" data-role="answer" placeholder="Escribe la respuesta correcta" />
    <label for="reward-${index}">Premio</label>
    <textarea id="reward-${index}" data-role="reward" placeholder="Texto que verás al acertar"></textarea>
  `;

  block.querySelector('.remove-question').addEventListener('click', () => {
    block.remove();
    refreshQuestionNumbers();
  });

  return block;
}

function refreshQuestionNumbers() {
  const blocks = questionsList.querySelectorAll('.question-block');
  blocks.forEach((block, index) => {
    const title = block.querySelector('strong');
    if (title) {
      title.textContent = `Pregunta ${index + 1}`;
    }

    const prompt = block.querySelector('[data-role="prompt"]');
    const answer = block.querySelector('[data-role="answer"]');
    const reward = block.querySelector('[data-role="reward"]');
    if (prompt) prompt.id = `question-${index}`;
    if (answer) answer.id = `answer-${index}`;
    if (reward) reward.id = `reward-${index}`;
    if (prompt) prompt.setAttribute('id', `question-${index}`);
    if (answer) answer.setAttribute('id', `answer-${index}`);
    if (reward) reward.setAttribute('id', `reward-${index}`);
    if (prompt) prompt.setAttribute('for', `question-${index}`);
    if (answer) answer.setAttribute('for', `answer-${index}`);
    if (reward) reward.setAttribute('for', `reward-${index}`);
  });
}

function addQuestion() {
  questionsList.appendChild(createQuestionBlock(questionsList.children.length));
}

function collectQuestions() {
  return Array.from(questionsList.querySelectorAll('.question-block')).map((block) => ({
    prompt: block.querySelector('[data-role="prompt"]').value,
    answer: block.querySelector('[data-role="answer"]').value,
    reward: block.querySelector('[data-role="reward"]').value
  }));
}

function buildSeed(questions) {
  const payload = {
    version: 1,
    questions: questions.filter((item) => item.prompt || item.answer || item.reward)
  };
  const json = JSON.stringify(payload);
  const encoded = LZString.compressToEncodedURIComponent(json);
  return `YINCANAS1:${encoded}`;
}

function buildPlayerLink(seed) {
  const baseUrl = new URL('player.html', window.location.href);
  baseUrl.searchParams.set('seed', seed);
  return baseUrl.toString();
}

function renderQr(link) {
  if (!window.QRCode) {
    alert('No se pudo cargar el generador de QR.');
    return;
  }

  qrOutput.innerHTML = '<p class="muted">Generando QR...</p>';
  window.QRCode.toDataURL(link, {
    width: 220,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' }
  })
    .then((dataUrl) => {
      qrOutput.innerHTML = `<img src="${dataUrl}" alt="QR del enlace de la partida" />`;
    })
    .catch(() => {
      qrOutput.innerHTML = '<p class="muted">No se pudo generar el QR.</p>';
    });
}

function applySeed(seed) {
  const value = seed.trim();
  if (!value) return;
  const prefix = 'YINCANAS1:';
  const normalizedSeed = value.startsWith(prefix) ? value : `${prefix}${value}`;
  const encoded = normalizedSeed.replace(prefix, '');
  const decoded = LZString.decompressFromEncodedURIComponent(encoded);
  if (!decoded) {
    alert('La SEED no es válida.');
    return;
  }

  const payload = JSON.parse(decoded);
  const questions = Array.isArray(payload.questions) ? payload.questions : [];
  questionsList.innerHTML = '';
  if (questions.length === 0) {
    addQuestion();
  } else {
    questions.forEach((item, index) => {
      const block = createQuestionBlock(index);
      block.querySelector('[data-role="prompt"]').value = item.prompt || '';
      block.querySelector('[data-role="answer"]').value = item.answer || '';
      block.querySelector('[data-role="reward"]').value = item.reward || '';
      questionsList.appendChild(block);
    });
  }
  seedOutput.value = normalizedSeed;
}

function copySeed() {
  if (!seedOutput.value) return;
  navigator.clipboard.writeText(seedOutput.value).then(() => {
    copySeedButton.textContent = '¡Copiada!';
    setTimeout(() => {
      copySeedButton.textContent = 'Copiar SEED';
    }, 1200);
  });
}

function copyLink() {
  if (!shareOutput.value) return;
  navigator.clipboard.writeText(shareOutput.value).then(() => {
    copyLinkButton.textContent = '¡Copiado!';
    setTimeout(() => {
      copyLinkButton.textContent = 'Copiar enlace';
    }, 1200);
  });
}

function downloadSeed() {
  if (!seedOutput.value) return;
  const blob = new Blob([seedOutput.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'seed-yincanas.txt';
  link.click();
  URL.revokeObjectURL(url);
}

addQuestionButton.addEventListener('click', addQuestion);
generateSeedButton.addEventListener('click', () => {
  const questions = collectQuestions();
  const seed = buildSeed(questions);
  seedOutput.value = seed;
  shareOutput.value = buildPlayerLink(seed);
  qrOutput.innerHTML = '';
});
copySeedButton.addEventListener('click', copySeed);
copyLinkButton.addEventListener('click', copyLink);
generateQrButton.addEventListener('click', () => {
  renderQr(shareOutput.value || seedOutput.value);
});
downloadSeedButton.addEventListener('click', downloadSeed);
loadSeedButton.addEventListener('click', () => {
  const pasted = prompt('Pega aquí la SEED para seguir editando');
  if (pasted) {
    applySeed(pasted);
  }
});
loadFileButton.addEventListener('click', () => seedFileInput.click());
seedFileInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  applySeed(text);
});

window.addEventListener('DOMContentLoaded', () => {
  addQuestion();
});
