/** Letters (accented ones included) and digits. Everything else is a special character (D18, D21). */
export function isCharacter(cell: string): boolean {
  return /^[\p{L}\p{Nd}]$/u.test(cell);
}

export function isDigit(cell: string): boolean {
  return /^\p{Nd}$/u.test(cell);
}

/** One entry per cell, so an accented letter is always a single cell. */
export function cellsOf(word: string): string[] {
  return Array.from(word.normalize('NFC'));
}

/** Length counts letters and digits, not special characters (D12). */
export function lengthOf(word: string): number {
  return cellsOf(word).filter(isCharacter).length;
}

function baseLetter(cell: string): string {
  return cell.normalize('NFD').replace(/\p{M}/gu, '');
}

function group(cell: string): number {
  if (!isCharacter(cell)) return 0;
  return isDigit(cell) ? 2 : 1;
}

/** Special characters, then letters with accents after their base letter, then digits (D21). */
export function compareCells(a: string, b: string): number {
  if (group(a) !== group(b)) return group(a) - group(b);
  const base = baseLetter(a).localeCompare(baseLetter(b), 'en');
  if (base !== 0) return base;
  return a.codePointAt(0)! - b.codePointAt(0)!;
}

export function compareWords(a: string, b: string): number {
  const cellsA = cellsOf(a);
  const cellsB = cellsOf(b);
  for (let i = 0; i < Math.min(cellsA.length, cellsB.length); i++) {
    const order = compareCells(cellsA[i], cellsB[i]);
    if (order !== 0) return order;
  }
  return cellsA.length - cellsB.length;
}
