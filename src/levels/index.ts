import type { Level } from '../game/level';
import data from './levels.json';

/** The game's levels (story 15). Approved suggestions from the level generator are added to levels.json (story 14). */
export const levels: Level[] = data as Level[];
