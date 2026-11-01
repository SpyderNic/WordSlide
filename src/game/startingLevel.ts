/** The level picker in the address, which only development builds have (D42). */
export function startingLevelNumber(search: string, levelCount: number, developmentBuild: boolean): number {
  if (!developmentBuild) return 1;
  const requested = Number(new URLSearchParams(search).get('level'));
  return requested >= 1 && requested <= levelCount ? requested : 1;
}
