import type { Platform } from './Platform';

/** Saves in the browser. If saving is blocked, the game still plays (story 11, R8). */
export class LocalPlatform implements Platform {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()) {}

  async load(key: string): Promise<string | null> {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  async save(key: string, value: string): Promise<void> {
    try {
      this.storage?.setItem(key, value);
    } catch {
      // Progress is lost on closing, and play carries on.
    }
  }
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
