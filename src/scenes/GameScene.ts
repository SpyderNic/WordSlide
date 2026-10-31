import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    if (import.meta.env.DEV) {
      (window as unknown as { wordSlideReady: boolean }).wordSlideReady = true;
    }
  }
}
