import type { Page } from '@playwright/test';
import type { Rect } from '../../../src/game/layout';
import type { PhaseTwoTestView } from '../../../src/scenes/PhaseTwoView';

/**
 * Reads what Phaser is actually drawing, and the tweens it was actually given.
 * A step that reads these can't pass on a value the game code merely recorded.
 */

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Triangle = [number, number, number, number, number, number];

export interface Drawn {
  /** A tile's bevel edges are 'bevel', so tests that look for tiles don't mistake them for tiles (M05-02, R8). */
  kind: 'rect' | 'text' | 'graphics' | 'bevel' | 'image';
  /** The object's centre on screen. Graphics draw from their own origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  alpha: number;
  /** The depth of the outermost object, so a popup's parts can be told from the board's. */
  depth: number;
  fill: number | null;
  stroke: number | null;
  text: string | null;
  /** A text's font family, and its size on screen in pixels. */
  font: string | null;
  fontSize: number | null;
  lines: Line[];
  triangles: Triangle[];
}

export interface Frame {
  t: number;
  screen: Drawn[];
  two: PhaseTwoTestView | null;
}

export interface TweenCall {
  t: number;
  ease: string | undefined;
  duration: number | undefined;
  props: string[];
}

interface Probe {
  screen: () => Drawn[];
  start: () => void;
  stop: () => Frame[];
  tweens: TweenCall[];
}

declare const window: Window & {
  probe?: Probe;
  wordSlide: {
    scene: { children: { list: unknown[] }; tweens: { add: (config: Record<string, unknown>) => unknown } };
    view: () => { phaseTwo: PhaseTwoTestView | null };
  };
};

/** Phaser's graphics command numbers, and how many values follow each (Phaser's Commands.js). */
const GRAPHICS_COMMANDS = { BEGIN_PATH: 1, CLOSE_PATH: 2, FILL_RECT: 3, LINE_TO: 4, MOVE_TO: 5, LINE_STYLE: 6, FILL_STYLE: 7, FILL_PATH: 8, STROKE_PATH: 9, FILL_TRIANGLE: 10 };

/** Run once after each page load, before the game is used. */
export async function installProbe(page: Page) {
  await page.evaluate((commands) => {
    if (window.probe) return;
    type Parent = { x: number; y: number; scale: number; alpha: number; depth: number | null };
    interface GameObject {
      type: string;
      visible: boolean;
      x: number;
      y: number;
      scaleX: number;
      alpha: number;
      depth: number;
      width: number;
      height: number;
      list: GameObject[];
      name: string;
      style: { fontFamily: string; fontSize: string };
      isFilled: boolean;
      fillColor: number;
      isStroked: boolean;
      strokeColor: number;
      text: string;
      commandBuffer: number[];
    }

    const parseGraphics = (buffer: number[], at: Parent) => {
      const lines: Line[] = [];
      const triangles: Triangle[] = [];
      const point = (x: number, y: number) => ({ x: at.x + x * at.scale, y: at.y + y * at.scale });
      let pen = { x: 0, y: 0 };
      for (let i = 0; i < buffer.length; ) {
        const command = buffer[i++];
        if (command === commands.LINE_STYLE) i += 3;
        else if (command === commands.FILL_STYLE) i += 2;
        else if (command === commands.FILL_RECT) i += 4;
        else if (command === commands.MOVE_TO) {
          pen = point(buffer[i], buffer[i + 1]);
          i += 2;
        } else if (command === commands.LINE_TO) {
          const end = point(buffer[i], buffer[i + 1]);
          lines.push({ x1: pen.x, y1: pen.y, x2: end.x, y2: end.y });
          pen = end;
          i += 2;
        } else if (command === commands.FILL_TRIANGLE) {
          const [a, b, c] = [point(buffer[i], buffer[i + 1]), point(buffer[i + 2], buffer[i + 3]), point(buffer[i + 4], buffer[i + 5])];
          triangles.push([a.x, a.y, b.x, b.y, c.x, c.y]);
          i += 6;
        } else if (command !== commands.BEGIN_PATH && command !== commands.CLOSE_PATH && command !== commands.FILL_PATH && command !== commands.STROKE_PATH) {
          throw new Error(`The probe doesn't know graphics command ${command}`);
        }
      }
      return { lines, triangles };
    };

    const screen = (): Drawn[] => {
      const found: Drawn[] = [];
      const visit = (object: GameObject, parent: Parent) => {
        if (!object.visible) return;
        const at: Parent = {
          x: parent.x + object.x * parent.scale,
          y: parent.y + object.y * parent.scale,
          scale: parent.scale * object.scaleX,
          alpha: parent.alpha * object.alpha,
          depth: parent.depth ?? object.depth,
        };
        if (object.type === 'Container') {
          object.list.forEach((child) => visit(child, at));
          return;
        }
        const base = { x: at.x, y: at.y, scale: at.scale, alpha: at.alpha, depth: at.depth!, fill: null, stroke: null, text: null, font: null, fontSize: null, lines: [], triangles: [] };
        if (object.type === 'Rectangle') {
          found.push({
            ...base,
            kind: object.name === 'bevel' ? 'bevel' : 'rect',
            width: object.width * at.scale,
            height: object.height * at.scale,
            fill: object.isFilled ? object.fillColor : null,
            stroke: object.isStroked ? object.strokeColor : null,
          });
        } else if (object.type === 'Text') {
          found.push({ ...base, kind: 'text', width: object.width, height: object.height, text: object.text, font: object.style.fontFamily, fontSize: parseFloat(object.style.fontSize) * at.scale });
        } else if (object.type === 'Graphics') {
          found.push({ ...base, kind: 'graphics', width: 0, height: 0, ...parseGraphics(object.commandBuffer, at) });
        } else if (object.type === 'Image') {
          found.push({ ...base, kind: 'image', width: object.width * at.scale, height: object.height * at.scale });
        }
      };
      for (const object of window.wordSlide.scene.children.list as GameObject[]) {
        visit(object, { x: 0, y: 0, scale: 1, alpha: 1, depth: null });
      }
      return found;
    };

    let frames: Frame[] | null = null;
    const record = () => {
      if (!frames) return;
      frames.push({ t: performance.now(), screen: screen(), two: window.wordSlide.view().phaseTwo });
      requestAnimationFrame(record);
    };

    const tweens: TweenCall[] = [];
    const manager = window.wordSlide.scene.tweens;
    const add = manager.add.bind(manager);
    manager.add = (config) => {
      tweens.push({
        t: performance.now(),
        ease: config.ease as string | undefined,
        duration: config.duration as number | undefined,
        props: ['x', 'y', 'alpha', 'scale'].filter((prop) => prop in config),
      });
      return add(config);
    };

    window.probe = {
      screen,
      tweens,
      start: () => {
        frames = [];
        record();
      },
      stop: () => {
        const finished = frames ?? [];
        frames = null;
        return finished;
      },
    };
  }, GRAPHICS_COMMANDS);
}

export function screen(page: Page): Promise<Drawn[]> {
  return page.evaluate(() => window.probe!.screen());
}

export function startRecording(page: Page) {
  return page.evaluate(() => window.probe!.start());
}

export function stopRecording(page: Page): Promise<Frame[]> {
  return page.evaluate(() => window.probe!.stop());
}

export function tweens(page: Page): Promise<TweenCall[]> {
  return page.evaluate(() => window.probe!.tweens);
}

/** The most recent tween that moved something. */
export async function lastMove(page: Page): Promise<TweenCall> {
  const moves = (await tweens(page)).filter((tween) => tween.props.includes('x') || tween.props.includes('y'));
  return moves[moves.length - 1];
}

const near = (a: number, b: number, tolerance = 2) => Math.abs(a - b) <= tolerance;

/** The filled tile drawn at a point, if there is one. */
export function tileAt(objects: Drawn[], x: number, y: number): Drawn | undefined {
  return objects.find((object) => object.kind === 'rect' && object.fill !== null && near(object.x, x) && near(object.y, y));
}

export function textAt(objects: Drawn[], x: number, y: number, tolerance = 2): Drawn | undefined {
  return objects.find((object) => object.kind === 'text' && near(object.x, x, tolerance) && near(object.y, y, tolerance));
}

/** Anything drawn with its centre inside a rectangle. */
export function drawnIn(objects: Drawn[], rect: Rect): Drawn[] {
  return objects.filter(
    (object) => object.kind !== 'graphics' && object.x >= rect.x && object.x <= rect.x + rect.width && object.y >= rect.y && object.y <= rect.y + rect.height,
  );
}

/** The outline drawn around a rectangle, if there is one. */
export function outlineOf(objects: Drawn[], rect: Rect, colour: number): Drawn | undefined {
  return objects.find(
    (object) =>
      object.kind === 'rect' &&
      object.stroke === colour &&
      near(object.x, rect.x + rect.width / 2) &&
      near(object.y, rect.y + rect.height / 2) &&
      near(object.width, rect.width, rect.height * 0.3),
  );
}

/** A triangle's point faces the side its odd one out is on. */
export function pointing([, y1, , y2, , y3]: Triangle): 'up' | 'down' {
  const ys = [y1, y2, y3].sort((a, b) => a - b);
  return near(ys[0], ys[1], 0.01) ? 'down' : 'up';
}
