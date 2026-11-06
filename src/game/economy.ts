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
  /** What the first use of each hint costs in a level (M07-03). */
  letterPrice: number;
  revealPrice: number;
  orderingPrice: number;
  /** How much more each further Letter or Reveal costs than the last, as a share of it (M07-03, R3). */
  priceStep: number;
  /** The most a hint can cost, as a multiple of its first price. */
  priceCap: number;
  /** The coins a finished series gives for each of its levels (M07-04, R5). */
  seriesRewardPerLevel: number;
}

/** The values the game ships with (D51). */
export const SHIPPED_ECONOMY: Economy = {
  startingCoins: 100,
  adReward: 50,
  bonusWordReward: 10,
  firstMidgameLevel: 5,
  rewardedAdWait: 3 * 60_000,
  letterPrice: 30,
  revealPrice: 40,
  orderingPrice: 40,
  priceStep: 0.5,
  priceCap: 5,
  seriesRewardPerLevel: 4,
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

/** The hints that cost coins (M07-03). Only the Letter and Reveal hints count their uses. */
export type PricedHint = 'letter' | 'reveal' | 'ordering';

/** How many Letter and Reveal hints the player has bought in this level (M07-03, R3 and R6). */
export interface HintUses {
  letter: number;
  reveal: number;
}

export const NO_HINT_USES: HintUses = { letter: 0, reveal: 0 };

/**
 * What a hint costs after it's been bought `uses` times in the level: each price is the step more than the last,
 * rounded to the nearest 10 (5 rounds up), and never more than the cap times the first price (M07-03, R3).
 */
export function hintPrice(first: number, uses: number, step: number, cap: number): number {
  let price = first;
  for (let use = 0; use < uses; use++) price = Math.min(first * cap, Math.floor((price * (1 + step)) / 10 + 0.5) * 10);
  return price;
}

/** The Ordering hint has one price (R4). */
export function priceOf(hint: PricedHint, uses: HintUses, economy: Economy): number {
  if (hint === 'ordering') return economy.orderingPrice;
  const first = hint === 'letter' ? economy.letterPrice : economy.revealPrice;
  return hintPrice(first, uses[hint], economy.priceStep, economy.priceCap);
}
