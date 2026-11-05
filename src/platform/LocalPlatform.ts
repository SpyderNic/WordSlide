import type { AdKind, AdResult, Platform } from './Platform';

/** What development builds and tests can ask of the pretend ads (story 20, R10). */
interface PretendAdControls {
  /** False pretends no ad can play, as with an ad blocker or during CrazyGames' Basic Launch. */
  available?: boolean;
  /** The next ad fails to load. */
  failNext?: boolean;
  /** The platform plays no midgame ad, as when CrazyGames' SDK says it's too soon. */
  noMidgame?: boolean;
}

/**
 * Saves in the browser. If saving is blocked, the game still plays (story 11, R8).
 * Development builds pretend to play ads, so the flows can be tested before a platform's SDK is added. Release builds
 * on this platform have no ads.
 */
export class LocalPlatform implements Platform {
  constructor(
    private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage(),
    private readonly pretendAds = import.meta.env?.DEV === true,
  ) {}

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

  adsAvailable(): boolean {
    return this.pretendAds && controls().available !== false;
  }

  showAd(kind: AdKind): Promise<AdResult> {
    const log = window as unknown as { wordSlideAdLog?: AdKind[] };
    (log.wordSlideAdLog ??= []).push(kind);
    const asked = controls();
    if (!this.adsAvailable() || (kind === 'midgame' && asked.noMidgame)) return Promise.resolve('unavailable');
    if (asked.failNext) {
      asked.failNext = false;
      return Promise.resolve('unavailable');
    }
    return pretendAd(kind);
  }
}

function controls(): PretendAdControls {
  const target = window as unknown as { wordSlideAds?: PretendAdControls };
  return (target.wordSlideAds ??= {});
}

/** A plain page over the game that says it's a pretend ad, with buttons to finish or close it. */
function pretendAd(kind: AdKind): Promise<AdResult> {
  return new Promise((resolve) => {
    const screen = document.createElement('div');
    screen.id = 'pretend-ad';
    screen.setAttribute('role', 'dialog');
    Object.assign(screen.style, {
      position: 'fixed', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '16px', background: 'rgba(0, 0, 0, 0.85)', color: '#fff', font: '24px sans-serif', zIndex: '1000',
    });
    const title = document.createElement('div');
    title.textContent = `Pretend ${kind} ad`;
    screen.append(title);
    const end = (result: AdResult) => {
      screen.remove();
      resolve(result);
    };
    for (const [label, result] of [['Finish', 'watched'], ['Close', 'closed']] as const) {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.font = '20px sans-serif';
      button.addEventListener('click', () => end(result));
      screen.append(button);
    }
    document.body.append(screen);
  });
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
