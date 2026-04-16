// Save/load character data to localStorage
const SAVE_KEY = 'warriorCats_character';

export function saveCharacter(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadCharacter() {
  const saved = localStorage.getItem(SAVE_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}
