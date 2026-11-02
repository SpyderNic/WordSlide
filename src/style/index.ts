import type { Style } from './Style';
import { recoloured, test } from './testStyles';
import { woodAndBrass } from './woodAndBrass';

/** Adding a style means adding it here. Players may choose between them later. */
export const styles: Record<string, Style> = {
  woodAndBrass,
  recoloured,
  test,
};

/** Development builds can ask for another style, so tests can show that a style never changes the rules. */
const requested = import.meta.env?.DEV ? (globalThis as { wordSlideStyle?: string }).wordSlideStyle : undefined;

export const currentStyle: Style = (requested && styles[requested]) || styles.woodAndBrass;
