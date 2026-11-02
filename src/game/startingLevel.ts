/** The level picker in the address, which only development builds have (D42). */
export function pickedLevel(search: string, levelCount: number, developmentBuild: boolean): number | null {
  if (!developmentBuild) return null;
  const requested = Number(new URLSearchParams(search).get('level'));
  return requested >= 1 && requested <= levelCount ? requested : null;
}

/** The progress reset in the address, which only development builds have (D42). */
export function resetAsked(search: string, developmentBuild: boolean): boolean {
  return developmentBuild && new URLSearchParams(search).has('reset');
}
