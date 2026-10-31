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
  /** The size on this screen for a level with no long row. */
  usualTileSize: number;
  poolRows: number;
  topTileSize: number;
  top: Rect;
  topItems: TopItem[];
  rows: RowView[];
  poolArea: Rect;
  poolTiles: PoolTileView[];
}

const GAP = 0.08;
const CELLS_ACROSS = 9;
/** The width the top of the screen needs, in tiles: six items on one line, or five on a portrait screen. */
const TOP_TILES_ACROSS = 16;
const TOP_TILES_ACROSS_PORTRAIT = 9.4;
/** The top of the screen, 5 rows and a two-row pool, with room between them. */
const TILES_DOWN = 9.6;
/** The most tiles a pool has to hold: more than this and it could outgrow its area. */
const LARGEST_POOL = 26;

function widthFor(cells: number, tile: number): number {
  return cells * tile * (1 + GAP) - tile * GAP;
}

/** The same for every level on a given screen, unless a long row won't fit (story 2, R12). */
function tileSizeFor(width: number, height: number, longestRow: number): number {
  const usual = Math.min(width / (CELLS_ACROSS * (1 + GAP)), height / TILES_DOWN);
  const fits = width / (longestRow * (1 + GAP));
  return Math.floor(Math.min(usual, fits));
}

function poolTilesAcross(width: number, tile: number): number {
  return Math.floor((width - tile) / (tile * (1 + GAP)));
}

function poolRowsFor(tiles: number, across: number): number {
  return Math.max(2, Math.ceil(tiles / across));
}

function layoutTopItems(width: number, tile: number, portrait: boolean, levelNumber: number, points: number, theme: string) {
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
  const themeItem = portrait
    ? { ...item('theme', theme, margin, width - margin * 2, false), y: y + height }
    : item('theme', theme, width / 2 - themeHalfWidth, themeHalfWidth * 2, false);
  return [
    item('home', 'Home', margin, button, true),
    item('level', `Level ${levelNumber}`, margin * 2 + button, label, false),
    themeItem,
    item('points', `Points ${points}`, pointsX, label, false),
    item('shop', 'Shop', width - margin * 2 - button * 2, button, true),
    item('settings', 'Settings', width - margin - button, button, true),
  ];
}

function layoutRow(word: string, cells: Cell[], top: number, width: number, tile: number): RowView {
  const pitch = tile * (1 + GAP);
  const left = width / 2 - widthFor(cells.length, tile) / 2;
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

function layoutPool(level: Level, area: Rect, tile: number, across: number): PoolTileView[] {
  const pitch = tile * (1 + GAP);
  const pool = startingPool(level.answers);
  const usedRows = poolRowsFor(pool.length, across);
  const perRow = Math.ceil(pool.length / usedRows);
  const rows = Array.from({ length: usedRows }, (_, row) => pool.slice(row * perRow, (row + 1) * perRow));
  const top = area.y + area.height - (usedRows * pitch - tile * GAP);
  return rows.flatMap((tiles, rowIndex) => {
    const left = area.x + area.width / 2 - widthFor(tiles.length, tile) / 2;
    return tiles.map((poolTile, index) => ({
      ...poolTile,
      x: left + index * pitch,
      y: top + rowIndex * pitch,
      width: tile,
      height: tile,
    }));
  });
}

/** Everything's position comes from the screen size (D28). */
export function layoutLevel(level: Level, levelNumber: number, points: number, width: number, height: number): LevelLayout {
  const answers = rowOrder(level.answers);
  const longestRow = Math.max(...answers.map((answer) => cellCount(answer.word)));
  const tile = tileSizeFor(width, height, longestRow);
  const usualTile = tileSizeFor(width, height, 0);
  const portrait = height > width;
  const topTile = Math.min(usualTile, Math.floor(width / (portrait ? TOP_TILES_ACROSS_PORTRAIT : TOP_TILES_ACROSS * (1 + GAP))));
  const pitch = tile * (1 + GAP);
  const margin = tile * 0.2;

  const top: Rect = { x: 0, y: 0, width, height: topTile * (portrait ? 2.2 : 1.2) };
  const across = poolTilesAcross(width, tile);
  const poolRows = poolRowsFor(LARGEST_POOL, across);
  const poolHeight = pitch * poolRows - tile * GAP;
  const poolArea: Rect = {
    x: margin,
    y: height - poolHeight - margin,
    width: width - margin * 2,
    height: poolHeight,
  };

  const rowsSpace = poolArea.y - (top.y + top.height);
  const rowsHeight = answers.length * pitch - tile * GAP;
  const rowsTop = top.height + (rowsSpace - rowsHeight) / 2;

  return {
    width,
    height,
    tileSize: tile,
    usualTileSize: usualTile,
    poolRows,
    topTileSize: topTile,
    top,
    topItems: layoutTopItems(width, topTile, portrait, levelNumber, points, level.theme),
    rows: answers.map((answer, index) =>
      layoutRow(answer.word, startingCells(answer), rowsTop + index * pitch, width, tile),
    ),
    poolArea,
    poolTiles: layoutPool(level, poolArea, tile, across),
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
