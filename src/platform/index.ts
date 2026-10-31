import type { Platform } from './Platform';
import { LocalPlatform } from './LocalPlatform';

/** Each platform build will return its own implementation here. */
export function createPlatform(): Platform {
  return new LocalPlatform();
}
