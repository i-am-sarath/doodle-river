import { SAVE_KEY } from '../config';

export interface SaveData {
  unlocked: number;   // highest unlocked level count (1 = only level 1)
  stars: number[];    // best stars per level index
  sfx: boolean;
}

const fresh = (): SaveData => ({ unlocked: 1, stars: [], sfx: true });

// localStorage can throw (private mode, blocked storage inside portal iframes). Never crash on it.
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as Partial<SaveData>;
    return { ...fresh(), ...s, stars: Array.isArray(s.stars) ? s.stars : [] };
  } catch {
    return fresh();
  }
}

export function writeSave(s: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
