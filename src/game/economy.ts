/**
 * The economy's settings (D51, D52). Rules name these, never their values, so changing a value here changes no rule
 * or test. Development builds let tests set their own through window.wordSlideEconomy.
 */
export interface Economy {
  /** What a new player starts with. */
  startingCoins: number;
  /** What a rewarded ad watched to the end gives. */
  adReward: number;
  /** What a bonus word gives (M07-05). */
  bonusWordReward: number;
  /** The first completed level after which a midgame ad is asked for. */
  firstMidgameLevel: number;
  /** Milliseconds after a rewarded ad before the ad button can be used again. */
  rewardedAdWait: number;
}

/** The values the game ships with (D51). */
export const SHIPPED_ECONOMY: Economy = {
  startingCoins: 100,
  adReward: 50,
  bonusWordReward: 10,
  firstMidgameLevel: 5,
  rewardedAdWait: 3 * 60_000,
};

export function economyWith(overrides: Partial<Economy> | undefined): Economy {
  return { ...SHIPPED_ECONOMY, ...overrides };
}

/** A midgame ad is asked for once the first midgame level is completed (M07-02, R8). */
export function asksForMidgameAd(completedLevel: number, economy: Economy): boolean {
  return completedLevel >= economy.firstMidgameLevel;
}

/** What the ad button shows: its reward, or how long is left of the wait as m:ss (M07-02, R13). */
export function adButtonState(now: number, lastAdEnd: number | null, economy: Economy): { ready: boolean; text: string } {
  const left = lastAdEnd === null ? 0 : lastAdEnd + economy.rewardedAdWait - now;
  if (left <= 0) return { ready: true, text: `+${economy.adReward}` };
  const seconds = Math.ceil(left / 1000);
  return { ready: false, text: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` };
}
