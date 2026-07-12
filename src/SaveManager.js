const INDEX_KEY = 'sunday-worlds-v1';
const WORLD_KEY_PREFIX = 'sunday-world-v1-';
const MODS_KEY = 'sunday-installed-mods-v1';
const CHARACTER_KEY = 'sunday-character-v1';

const DEFAULT_CHARACTER = {
  name: 'Player',
  color: 0x3f5fd6,
  gender: 'male',
  hair: 'short',
  age: 25,
  skinTone: 0xe8b98a,
  hairColor: 0x3a2a1e
};

function readIndex() {
  const raw = localStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeIndex(index) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function listWorlds() {
  return readIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function hasSave() {
  return readIndex().length > 0;
}

export function createWorld(name, options) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const index = readIndex();
  index.push({
    id, name, createdAt: Date.now(), updatedAt: Date.now(),
    peaceful: !!(options && options.peaceful),
    multiplayer: !!(options && options.multiplayer),
    cloneMod: !!(options && options.cloneMod),
    gunMod: !!(options && options.gunMod)
  });
  writeIndex(index);
  return id;
}

export function worldNameTaken(name) {
  return readIndex().some(w => w.name.toLowerCase() === name.toLowerCase());
}

export function loadWorld(id) {
  const raw = localStorage.getItem(WORLD_KEY_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function writeWorld(id, data) {
  localStorage.setItem(WORLD_KEY_PREFIX + id, JSON.stringify(data));
  const index = readIndex();
  const entry = index.find(w => w.id === id);
  if (entry) {
    entry.updatedAt = Date.now();
    writeIndex(index);
  }
}

export function deleteWorld(id) {
  localStorage.removeItem(WORLD_KEY_PREFIX + id);
  writeIndex(readIndex().filter(w => w.id !== id));
}

function readInstalledMods() {
  const raw = localStorage.getItem(MODS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function isModInstalled(modId) {
  return readInstalledMods().includes(modId);
}

export function installMod(modId) {
  const mods = readInstalledMods();
  if (!mods.includes(modId)) {
    mods.push(modId);
    localStorage.setItem(MODS_KEY, JSON.stringify(mods));
  }
}

export function uninstallMod(modId) {
  const mods = readInstalledMods().filter(id => id !== modId);
  localStorage.setItem(MODS_KEY, JSON.stringify(mods));
}

export function loadCharacter() {
  const raw = localStorage.getItem(CHARACTER_KEY);
  if (!raw) return { ...DEFAULT_CHARACTER };
  try {
    return { ...DEFAULT_CHARACTER, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_CHARACTER };
  }
}

export function saveCharacter(character) {
  localStorage.setItem(CHARACTER_KEY, JSON.stringify(character));
}
