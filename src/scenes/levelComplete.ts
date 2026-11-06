import Phaser from 'phaser';
import type { Rect } from '../game/layout';
import { currentStyle } from '../style';
import { makeTile } from './tiles';
import { drawCoin } from './topIcons';

const colours = currentStyle.colours;
const timings = currentStyle.timings;
/** The Level complete screen covers the level; the coin counter and flying coins are drawn above it (M07-04, R3). */
export const COMPLETE_DEPTH = 30;

function hex(colour: number): string {
  return `#${colour.toString(16).padStart(6, '0')}`;
}

export interface CompleteSeries {
  name: string;
  /** Levels won before this one, and now. */
  from: number;
  to: number;
  length: number;
}

export interface CompleteContent {
  /** The level just won. */
  level: number;
  /** The golden word's characters. */
  word: string[];
  points: { from: number; to: number };
  /** Null when the level is past the last series. */
  series: CompleteSeries | null;
  /** The coins a finished series gives, or null when there are none to give (a peek, R8). */
  reward: number | null;
  /** "Play Level X", or null after the last level, where "All levels complete!" shows instead (R12). */
  button: string | null;
}

export interface CompleteCallbacks {
  /** The reward's coins fly from this point; call `landed` once they've all landed. */
  onReward: (from: { x: number; y: number }, amount: number, landed: () => void) => void;
}

/** What tests read: where the button is once it shows, whether everything has played, and the bar's track. */
export interface CompleteInfo {
  buttonRect: Rect | null;
  done: boolean;
  bar: Rect | null;
}

/**
 * The full Level complete screen (M07-04, R3): "Level X Complete", the golden word, the points, the series' name, its
 * bar and count, then the button. It plays in order (R4): the points change, the bar fills, a finished series flashes
 * and gives its reward (R5), and only then does the button show. `playing` false draws it as it ends, at once.
 */
export class LevelComplete {
  readonly container: Phaser.GameObjects.Container;
  readonly info: CompleteInfo = { buttonRect: null, done: false, bar: null };
  private readonly size: number;
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private pointsText!: Phaser.GameObjects.Text;
  private fill: Phaser.GameObjects.Rectangle | null = null;
  private countText: Phaser.GameObjects.Text | null = null;
  private barWidth = 0;
  private barHeight = 0;
  private barLeft = 0;
  private rewardShown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    tile: number,
    private readonly content: CompleteContent,
    private readonly callbacks: CompleteCallbacks,
    playing: boolean,
  ) {
    const { width, height } = scene.scale;
    this.size = Math.min(tile, 46, height / 9);
    this.container = scene.add.container(0, 0).setDepth(COMPLETE_DEPTH);
    this.container.add(scene.add.rectangle(width / 2, height / 2, width, height, colours.background));
    this.draw(playing);
    if (playing) {
      this.container.setAlpha(0);
      scene.tweens.add({ targets: this.container, alpha: 1, duration: timings.completeFade });
      this.later(timings.pointsPause, () => this.changePoints());
    } else {
      this.finish();
    }
  }

  private get rows() {
    const { height } = this.scene.scale;
    return { title: height * 0.22, word: height * 0.36, points: height * 0.49, name: height * 0.58, bar: height * 0.65, reward: height * 0.74, button: height * 0.86 };
  }

  private text(text: string, y: number, fontSize: number, colour: number, x = this.scene.scale.width / 2) {
    const object = this.scene.add
      .text(x, y, text, { fontFamily: currentStyle.font, fontSize: `${Math.round(Math.max(fontSize, currentStyle.minText))}px`, color: hex(colour) })
      .setOrigin(0.5);
    this.container.add(object);
    return object;
  }

  private draw(playing: boolean) {
    const { width } = this.scene.scale;
    const { size, content } = this;
    const rows = this.rows;
    this.text(`Level ${content.level} Complete`, rows.title, size * 0.75, colours.highlight);
    content.word.forEach((letter, index) => {
      const x = width / 2 + (index - (content.word.length - 1) / 2) * size * 1.1;
      this.container.add(makeTile(this.scene, x, rows.word, size, colours.tileGold));
      this.text(letter, rows.word, size * 0.6, colours.text, x);
    });
    this.pointsText = this.text(`Points: ${playing ? content.points.from : content.points.to}`, rows.points, size * 0.45, colours.highlight);

    const series = content.series;
    if (!series) return;
    this.text(series.name, rows.name, size * 0.42, colours.highlight);
    this.barWidth = Math.min(width * 0.6, size * 8);
    this.barHeight = Math.max(size * 0.45, currentStyle.minText * 1.4);
    this.barLeft = width / 2 - this.barWidth / 2;
    this.container.add(this.scene.add.rectangle(width / 2, rows.bar, this.barWidth, this.barHeight, colours.tile));
    this.fill = this.scene.add.rectangle(this.barLeft, rows.bar, 0, this.barHeight, colours.tileGold).setOrigin(0, 0.5);
    this.container.add(this.fill);
    this.countText = this.text('', rows.bar, this.barHeight * 0.7, colours.text);
    this.info.bar = { x: this.barLeft, y: rows.bar - this.barHeight / 2, width: this.barWidth, height: this.barHeight };
    this.showProgress(playing ? series.from : series.to);
  }

  /** The bar and its count at a number of levels won; the count only reaches a level once the bar has. */
  private showProgress(won: number) {
    const series = this.content.series!;
    this.fill!.setSize((this.barWidth * won) / series.length, this.barHeight);
    this.countText!.setText(`${Math.floor(won + 1e-6)} / ${series.length}`);
  }

  private later(delay: number, then: () => void) {
    this.timers.push(this.scene.time.delayedCall(delay, then));
  }

  private changePoints() {
    this.pointsText.setText(`Points: ${this.content.points.to}`);
    this.scene.tweens.add({ targets: this.pointsText, scale: currentStyle.pulseScale, duration: timings.lockPulseGrow, yoyo: true });
    if (this.content.series) this.later(timings.seriesBarPause, () => this.fillBar());
    else this.finish();
  }

  private fillBar() {
    const series = this.content.series!;
    const progress = { won: series.from };
    this.scene.tweens.add({
      targets: progress,
      won: series.to,
      duration: timings.seriesBarFill,
      onUpdate: () => this.showProgress(progress.won),
      onComplete: () => {
        this.showProgress(series.to);
        if (series.to === series.length) this.flash();
        else this.finish();
      },
    });
  }

  /** A finished series' bar lights up twice, then its reward shows and its coins fly (R5). */
  private flash() {
    const fill = this.fill!;
    const steps = [colours.highlight, colours.tileGold, colours.highlight, colours.tileGold];
    steps.forEach((colour, index) => this.later(index * timings.seriesFlash, () => fill.setFillStyle(colour)));
    this.later(steps.length * timings.seriesFlash, () => {
      const reward = this.content.reward;
      if (reward === null) {
        this.finish();
        return;
      }
      const line = this.rewardLine(reward);
      this.callbacks.onReward({ x: line.x, y: line.y }, reward, () => this.finish());
    });
  }

  /** "Complete! +X" with a coin, under the bar. */
  private rewardLine(reward: number) {
    this.rewardShown = true;
    const size = this.size;
    const line = this.text(`Complete! +${reward}`, this.rows.reward, size * 0.45, colours.highlight);
    const coinSize = size * 0.45;
    this.container.add(drawCoin(this.scene, line.x + line.width / 2 + coinSize * 0.8, line.y, coinSize, colours.tileGold));
    return line;
  }

  /** The button shows last, or "All levels complete!" after the last level (R4, R12). */
  private finish() {
    const { width } = this.scene.scale;
    const size = this.size;
    if (this.content.reward !== null && !this.rewardShown && this.content.series?.to === this.content.series?.length) {
      // Drawn as it ends, at once: the reward line is there, and its coins have already been given.
      this.rewardLine(this.content.reward);
    }
    if (this.content.button) {
      const buttonWidth = size * 5.2;
      const buttonHeight = size * 1.2;
      const y = this.rows.button;
      this.container.add(this.scene.add.rectangle(width / 2, y, buttonWidth, buttonHeight, colours.tile));
      this.text(this.content.button, y, size * 0.55, colours.highlight);
      this.info.buttonRect = { x: width / 2 - buttonWidth / 2, y: y - buttonHeight / 2, width: buttonWidth, height: buttonHeight };
    } else {
      this.text('All levels complete!', this.rows.button, size * 0.55, colours.highlight);
    }
    this.info.done = true;
  }

  destroy() {
    this.timers.forEach((timer) => timer.remove());
    this.container.destroy(true);
  }
}
