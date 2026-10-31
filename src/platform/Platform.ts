/**
 * What the game needs from the platform it runs on (D32).
 * Game code only uses this, never a platform's SDK directly.
 * Ads, purchases and player identity go here when a story needs them.
 */
export interface Platform {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
}
