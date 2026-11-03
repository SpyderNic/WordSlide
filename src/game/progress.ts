import type { BoardSnapshot } from './board';
import type { PhaseTwoSnapshot } from './phaseTwo';

/** What a level looks like after the last change that settled (story 11, R10). */
export interface LevelSnapshot {
  board: BoardSnapshot;
  phaseTwo: PhaseTwoSnapshot | null;
}

/** The player's progress through the levels (story 11). */
export interface Progress {
  /** The level the player is on. Past the last level, every level is complete. */
  level: number;
  points: number;
  inLevel: LevelSnapshot | null;
  /** Set once the player makes the reordering tutorial's move: from then on, every level has handles (story 21, Q12). */
  reorderingTaught?: boolean;
}

export const NEW_PLAYER: Progress = { level: 1, points: 0, inLevel: null };

export const SAVE_KEY = 'wordSlide.progress';

function taught(progress: Partial<Progress>): Pick<Progress, 'reorderingTaught'> {
  return progress.reorderingTaught === true ? { reorderingTaught: true } : {};
}

/** Winning unlocks the next level and gives 1 point (D23). The next level starts fresh. */
export function winLevel(progress: Progress): Progress {
  return { ...taught(progress), level: progress.level + 1, points: progress.points + 1, inLevel: null };
}

export function writeProgress(progress: Progress): string {
  return JSON.stringify(progress);
}

/** Anything the game can't read counts as a new player, rather than stopping the game. */
export function readProgress(text: string | null): Progress {
  try {
    const saved = JSON.parse(text ?? 'null') as Partial<Progress> | null;
    const level = saved?.level;
    const points = saved?.points;
    if (!Number.isInteger(level) || level! < 1 || !Number.isInteger(points) || points! < 0) return NEW_PLAYER;
    return { ...taught(saved!), level: level!, points: points!, inLevel: saved?.inLevel ?? null };
  } catch {
    return NEW_PLAYER;
  }
}
