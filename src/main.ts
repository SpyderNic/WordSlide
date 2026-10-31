import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { currentStyle } from './style';

new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: currentStyle.colours.background,
  // Positions and sizes come from the screen size (D28).
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [GameScene],
});
