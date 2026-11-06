/** How an ad ended (M07-02, R5). Only "watched" earns a rewarded ad's reward. */
export type AdResult = 'watched' | 'closed' | 'unavailable';

export type AdKind = 'rewarded' | 'midgame';

/**
 * What the game needs from the platform it runs on (D32).
 * Game code only uses this, never a platform's SDK directly.
 * Purchases and player identity go here when a story needs them.
 */
export interface Platform {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
  /** Whether an ad could play now. When not, no ad offer shows (M07-02, R7). */
  adsAvailable(): boolean;
  /** Plays an ad. The game pauses and ignores input until it resolves (M07-02, R9). */
  showAd(kind: AdKind): Promise<AdResult>;
}
