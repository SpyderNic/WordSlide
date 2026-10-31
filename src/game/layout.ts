import { cellsOf } from './characters';
import { rowOrder, startingCells, startingPool, type Cell, type Level } from './level';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TopItemName = 'home' | 'level' | 'theme' | 'points' | 'shop' | 'settings';

export interface TopItem extends Rect {
  name: TopItemName;
  text: string;
  isButton: boolean;
}

export interface CellView extends Rect {
  cell: Cell;
}

export interface RowView {
  word: string;
  cells: CellView[];
}

export interface PoolTileView extends Rect {
  character: string;
  count: number;
}

export interface LevelLayout {
  width: number;
  height: number;
  tileSize: number;
  top: Rect;
  topItems: TopItem[];
  rows: RowView[];
  poolArea: Rect;
  poolTiles: PoolTileView[];
}

const GAP = 0.08;
const CELLS_ACROSS = 16;
/** The top of the screen, 5 rows and a two-row pool, with room between them. */
const TILES_DOWN = 9.6;

/** The same for every level on a given screen (story 2, R12). */
function tileSizeFor(width: number, height: number): number {
  return Math.floor(Math.min(width / (CELLS_ACROSS * (1 + GAP)), height / TILES_DOWN));
}

function layoutTopItems(width: number, tile: number, levelNumber: number, points: number, theme: string) {
  const height = tile;
  const y = tile * 0.1;
  const margin = tile * 0.2;
  const item = (name: TopItemName, text: string, x: number, itemWidth: number, isButton: boolean): TopItem => ({
    name, text, x, y, width: itemWidth, height, isButton,
  });
  const button = tile * 1.6;
  const label = tile * 1.6;
  const pointsX = width - margin * 3 - button * 2 - label;
  const themeHalfWidth = width / 2 - (width - pointsX) - margin;
  return [
    item('home', 'Home', margin, button, true),
    item('level', `Level ${levelNumber}`, margin * 2 + button, label, false),
    item('theme', theme, width / 2 - themeHalfWidth, themeHalfWidth * 2, false),
    item('points', `Points ${points}`, pointsX, label, false),
    item('shop', 'Shop', width - margin * 2 - button * 2, button, true),
    item('settings', 'Settings', width - margin - button, button, true),
  ];
}

function layoutRow(word: string, cells: Cell[], top: number, width: number, tile: number): RowView {
  const pitch = tile * (1 + GAP);
  const rowWidth = cells.length * pitch - tile * GAP;
  const left = width / 2 - rowWidth / 2;
  return {
    word,
    cells: cells.map((cell, index) => ({
      cell,
      x: left + index * pitch,
      y: top,
      width: tile,
      height: tile,
    })),
  };
}

function layoutPool(level: Level, area: Rect, tile: number): PoolTileView[] {
  const pitch = tile * (1 + GAP);
  const pool = startingPool(level.answers);
  const perRow = Math.ceil(pool.length / 2);
  const rows = [pool.slice(0, perRow), pool.slice(perRow)];
  return rows.flatMap((tiles, rowIndex) => {
    const left = area.x + area.width / 2 - (tiles.length * pitch - tile * GAP) / 2;
    return tiles.map((poolTile, index) => ({
      ...poolTile,
      x: left + index * pitch,
      y: area.y + rowIndex * pitch,
      width: tile,
      height: tile,
    }));
  });
}

/** Everything's position comes from the screen size (D28). */
export function layoutLevel(level: Level, levelNumber: number, points: number, width: number, height: number): LevelLayout {
  const tile = tileSizeFor(width, height);
  const pitch = tile * (1 + GAP);
  const margin = tile * 0.2;

  const top: Rect = { x: 0, y: 0, width, height: tile * 1.2 };
  const poolHeight = pitch * 2 - tile * GAP;
  const poolArea: Rect = {
    x: margin,
    y: height - poolHeight - margin,
    width: width - margin * 2,
    height: poolHeight,
  };

  const rowsSpace = poolArea.y - (top.y + top.height);
  const answers = rowOrder(level.answers);
  const rowsHeight = answers.length * pitch - tile * GAP;
  const rowsTop = top.height + (rowsSpace - rowsHeight) / 2;

  return {
    width,
    height,
    tileSize: tile,
    top,
    topItems: layoutTopItems(width, tile, levelNumber, points, level.theme),
    rows: answers.map((answer, index) =>
      layoutRow(answer.word, startingCells(answer), rowsTop + index * pitch, width, tile),
    ),
    poolArea,
    poolTiles: layoutPool(level, poolArea, tile),
  };
}

/** How a row reads, for tests: _ for an empty cell. */
export function rowText(row: RowView): string {
  return row.cells
    .map(({ cell }) => {
      if (cell.kind === 'empty') return '_';
      return cell.character === ' ' ? '␣' : cell.character;
    })
    .join(' ');
}

export function cellCount(word: string): number {
  return cellsOf(word).length;
}
