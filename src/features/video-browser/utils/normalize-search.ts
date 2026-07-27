/**
 * Folds a value into a comparable search key: diacritics stripped, lowercased,
 * inner whitespace collapsed.
 *
 * Without the diacritic pass, typing "beyonce" would not match "Beyoncé" —
 * 51 of the 500 rows in the dataset carry accented characters.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}
