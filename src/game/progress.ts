import type { BoardSnapshot } from './board';
import type { PhaseTwoSnapshot } from './phaseTwo';
import type { HintUses } from './economy';

/** What a level looks like after the last change that settled (M05-01, R10). */
export interface LevelSnapshot {
  board: BoardSnapshot;
  phaseTwo: PhaseTwoSnapshot | null;
  /** The Letter and Reveal hints bought in this level, so their prices survive reopening (M07-03, R6). */
  hintUses?: HintUses;
  /** This level teaches reordering: its phase two has no hints (M07-03, R8). */
  reorderingLesson?: boolean;
  /** The bonus words found in this level, so none gives its coins twice (M07-05, R11). */
  bonusFound?: string[];
}

/** The player's progress through the levels (M05-01). */
export interface Progress {
  /** The level the player is on. Past the last level, every level is complete. */
  level: number;
  points: number;
  inLevel: LevelSnapshot | null;
  /** Set once the player makes the reordering tutorial's move: from then on, every level has handles (M05-04, Q12). */
  reorderingTaught?: boolean;
  /** The player's coins (M07-02). A save without them, a new player's included, has the starting coins (R2, Q6). */
  coins?: number;
  /** Set once the first bonus word's extra line has shown: it never shows again (M07-05, R5). */
  bonusExplained?: boolean;
}

export const NEW_PLAYER: Progress = { level: 1, points: 0, inLevel: null };

export const SAVE_KEY = 'wordSlide.progress';

function kept(progress: Partial<Progress>): Pick<Progress, 'reorderingTaught' | 'coins' | 'bonusExplained'> {
  return {
    ...(progress.reorderingTaught === true ? { reorderingTaught: true } : {}),
    ...(progress.bonusExplained === true ? { bonusExplained: true } : {}),
    ...(Number.isInteger(progress.coins) && progress.coins! >= 0 ? { coins: progress.coins } : {}),
  };
}

/** The player's balance: the starting coins until they have a balance of their own. */
export function coinsOf(progress: Progress, startingCoins: number): number {
  return progress.coins ?? startingCoins;
}

/**
 * Winning unlocks the next level and gives 1 point (D23). A single level gives no coins (M07-02, R3), but the last level
 * of a series gives its reward, saved with the win (M07-04, R5 and R6). Pass a progress whose coins are set when there
 * is a reward, so it adds to the player's balance. The next level starts fresh.
 */
export function winLevel(progress: Progress, reward = 0): Progress {
  const won: Progress = { ...kept(progress), level: progress.level + 1, points: progress.points + 1, inLevel: null };
  return reward > 0 ? { ...won, coins: (progress.coins ?? 0) + reward } : won;
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
    return { ...kept(saved!), level: level!, points: points!, inLevel: saved?.inLevel ?? null };
  } catch {
    return NEW_PLAYER;
  }
}
