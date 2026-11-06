import type { Level } from '../game/level';
import type { Series } from '../game/series';
import data from './levels.json';
import seriesData from './series.json';

/** The game's levels (story 15). Approved suggestions from the level generator are added to levels.json (story 14). */
export const levels: Level[] = data as Level[];

/** The levels' series, in order, next to the levels (M07-04, R1 and R9). */
export const series: Series[] = seriesData as Series[];
