import { normalizeForSearch } from "~/features/video-browser/utils/normalize-search";

describe("normalizeForSearch", () => {
  it("lowercases the value", () => {
    expect(normalizeForSearch("John Mayer")).toBe("john mayer");
  });

  it.each([
    ["Beyoncé", "beyonce"],
    ["Chlöe Howl", "chloe howl"],
    ["Etienne de Crécy", "etienne de crecy"],
    ["Cantar Faz Feliz o Coração", "cantar faz feliz o coracao"],
    ["Jorge Celedón & Gustavo Garcia", "jorge celedon & gustavo garcia"],
  ])("strips diacritics so %s is searchable as %s", (input, expected) => {
    expect(normalizeForSearch(input)).toBe(expected);
  });

  it("collapses inner whitespace and trims the edges", () => {
    expect(normalizeForSearch("  Olly   Murs  ")).toBe("olly murs");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeForSearch("   ")).toBe("");
  });

  it("is idempotent", () => {
    const once = normalizeForSearch("Étienne  de Crécy");

    expect(normalizeForSearch(once)).toBe(once);
  });

  it("leaves an already-normalised value untouched", () => {
    expect(normalizeForSearch("tom petty and the heartbreakers")).toBe(
      "tom petty and the heartbreakers"
    );
  });
});
