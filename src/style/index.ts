import type { Style } from './Style';
import { woodAndBrass } from './woodAndBrass';

/** Adding a style means adding it here. Players may choose between them later. */
export const styles: Record<string, Style> = {
  woodAndBrass,
};

export const currentStyle: Style = styles.woodAndBrass;
