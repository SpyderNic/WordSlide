import type { Economy } from './economy';

/** A named run of levels, separate from themes (M07-04, R1). Series follow on from each other, in order. */
export interface Series {
  name: string;
  length: number;
}

/** Where a level sits in its series: the series, which one it is, and its first level. */
export interface SeriesPlace extends Series {
  index: number;
  first: number;
}

/** The series a level (counted from 1) is in, or null past the last series. */
export function seriesOf(series: Series[], level: number): SeriesPlace | null {
  let first = 1;
  for (const [index, one] of series.entries()) {
    if (level < first + one.length) return level >= first ? { ...one, index, first } : null;
    first += one.length;
  }
  return null;
}

/** How many of its series' levels have been won while the player is on this level (R2). */
export function wonInSeries(series: Series[], level: number): number {
  const place = seriesOf(series, level);
  return place ? level - place.first : 0;
}

/** Whether the level is the last of its series. */
export function endsSeries(series: Series[], level: number): boolean {
  const place = seriesOf(series, level);
  return place !== null && level === place.first + place.length - 1;
}

/** Whether the level is the first of a series. */
export function startsSeries(series: Series[], level: number): boolean {
  return seriesOf(series, level)?.first === level;
}

/** What winning this level gives: the series reward per level times the series' length, on its last level only (R5). */
export function seriesReward(series: Series[], level: number, economy: Economy): number {
  if (!endsSeries(series, level)) return 0;
  return economy.seriesRewardPerLevel * seriesOf(series, level)!.length;
}
