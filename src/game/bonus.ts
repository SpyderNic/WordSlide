/**
 * A level's bonus words (M07-05): themed words other than its answers that a full row or the column can spell. Each is
 * found once per level, wherever it's spelled (R6), and the words found are saved with the level (R11).
 */
export class BonusWords {
  private readonly found: Set<string>;

  constructor(
    private readonly words: readonly string[],
    found: readonly string[] = [],
  ) {
    this.found = new Set(found.filter((word) => words.includes(word)));
  }

  /** True the first time a bonus word is spelled in this level, and never again. */
  find(word: string): boolean {
    if (!this.words.includes(word) || this.found.has(word)) return false;
    this.found.add(word);
    return true;
  }

  snapshot(): string[] {
    return [...this.found];
  }
}
