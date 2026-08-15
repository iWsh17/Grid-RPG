import { createInitialState, executeCommand, getVisibleState } from './core.js';
import { renderBoard, renderLog, renderStatus } from './systems.js';
import { clearSave, readSave, saveGame, applyLoadedState } from './persistence.js';

const state = createInitialState();

const elements = {
  board: document.querySelector('#board'),
  status: document.querySelector('#status'),
  log: document.querySelector('#log'),
  commandInput: document.querySelector('#command-input'),
  commandForm: document.querySelector('#command-form'),
  saveButton: document.querySelector('#save-button'),
  loadButton: document.querySelector('#load-button'),
  resetButton: document.querySelector('#reset-button'),
};

function render() {
  const visible = getVisibleState(state);
  renderBoard(elements.board, visible);
  renderStatus(elements.status, visible);
  renderLog(elements.log, visible);
}

function write(message, tone = 'normal') {
  const line = document.createElement('div');
  line.className = `log-line ${tone}`;
  line.textContent = message;
  elements.log?.appendChild(line);
  elements.log?.scrollTo({ top: elements.log.scrollHeight, behavior: 'smooth' });
}

function handleCommand(raw) {
  const command = raw.trim().toLowerCase();

  if (!command) return;

  if (command === 'save') {
    const payload = saveGame(state);
    write(`SAVED: Game saved at ${payload.savedAt}.`);
  } else if (command === 'load') {
    const result = readSave();
    if (result.success) {
      applyLoadedState(state, result.state);
      write(`LOADED: Save from ${result.savedAt}.`);
      render();
    } else {
      write(`${result.code}: ${result.message}`, 'error');
    }
  } else if (command === 'clearsave') {
    clearSave();
    write('SAVECLEARED: Local save deleted.');
  } else if (command === 'clear') {
    elements.log?.replaceChildren();
  } else if (command === 'reset') {
    location.reload();
  } else {
    const result = executeCommand(state, command);
    write(result.message, result.success ? 'success' : 'error');
    render();
  }
}

elements.commandForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = elements.commandInput;
  handleCommand(input?.value ?? '');
  if (input) input.value = '';
});

elements.saveButton?.addEventListener('click', () => {
  const payload = saveGame(state);
  write(`SAVED: Game saved at ${payload.savedAt}.`);
});

elements.loadButton?.addEventListener('click', () => {
  const result = readSave();
  if (result.success) {
    applyLoadedState(state, result.state);
    write(`LOADED: Save from ${result.savedAt}.`);
    render();
  } else {
    write(`${result.code}: ${result.message}`, 'error');
  }
});

elements.resetButton?.addEventListener('click', () => {
  location.reload();
});

render();
