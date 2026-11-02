import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { currentStyle } from './style';
import '@fontsource/nunito/700.css';

/** Letters are drawn as text, so the font must be ready before the first frame (story 16, R9). */
async function start() {
  await document.fonts.load(`700 32px ${currentStyle.font}`).catch(() => undefined);
  new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: currentStyle.colours.background,
    // Positions and sizes come from the screen size (D28).
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    scene: [GameScene],
  });
}

void start();
