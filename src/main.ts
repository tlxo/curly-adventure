import { rooms } from './data/rooms';
import { items } from './data/items';
import { createGameState, processCommand, GameState } from './engine/GameState';
import { parse } from './engine/Parser';

let state: GameState = createGameState(rooms, items, 'room_start');

/** Escape HTML special characters to prevent XSS when using innerHTML. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendOutput(text: string, className?: string): void {
  const output = document.getElementById('output');
  if (!output) return;
  const p = document.createElement('p');
  if (className) p.className = className;
  // Escape HTML first, then render **bold** markers safely.
  p.innerHTML = escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  output.appendChild(p);
  output.scrollTop = output.scrollHeight;
}

function handleInput(input: string): void {
  if (!input.trim()) return;
  appendOutput(`> ${input}`, 'command');
  const command = parse(input);
  state = processCommand(state, command);
  for (const msg of state.messages) {
    appendOutput(msg);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('input-form') as HTMLFormElement | null;
  const inputEl = document.getElementById('command-input') as HTMLInputElement | null;

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!inputEl) return;
    const value = inputEl.value;
    inputEl.value = '';
    handleInput(value);
  });

  // Describe the starting room on load
  state = processCommand(state, parse('look'));
  for (const msg of state.messages) {
    appendOutput(msg);
  }
  appendOutput('Type <strong>help</strong> for a list of commands.');
});
