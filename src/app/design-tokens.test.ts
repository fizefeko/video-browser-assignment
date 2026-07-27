/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contrast cannot be checked by jest-axe: jsdom has no layout, so axe skips its
 * colour-contrast rule entirely. These assertions read the real token values out
 * of globals.css, so changing a colour cannot quietly drop the app below WCAG.
 */
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css);

  if (!match?.[1]) {
    throw new Error(`No --color-${name} token found in globals.css`);
  }

  return match[1];
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );

  return (
    0.2126 * (channels[0] ?? 0) +
    0.7152 * (channels[1] ?? 0) +
    0.0722 * (channels[2] ?? 0)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);

  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

/** WCAG 1.4.3 Contrast (Minimum) for body-size text. */
const TEXT_MINIMUM = 4.5;

/** WCAG 1.4.11 Non-text Contrast for component boundaries and focus rings. */
const NON_TEXT_MINIMUM = 3;

describe("design token contrast", () => {
  it.each([
    ["heading and error text on the page", "ink", "surface"],
    ["typed input text on the field fill", "ink", "field"],
    ["card title, artist and year on the caption", "ink", "caption"],
    ["placeholder text on the field fill", "ink-muted", "field"],
    ["empty-state message on the page", "ink-muted", "surface"],
  ])("%s meets 4.5:1", (_label, foreground, background) => {
    expect(
      contrastRatio(token(foreground), token(background))
    ).toBeGreaterThanOrEqual(TEXT_MINIMUM);
  });

  it.each([
    ["control borders against the page", "control", "surface"],
    ["control borders against their own fill", "control", "field"],
    ["focus rings against the page", "ink", "surface"],
    ["focus rings against the field fill", "ink", "field"],
    ["dropdown carets against the field fill", "ink-muted", "field"],
  ])("%s meets 3:1", (_label, foreground, background) => {
    expect(
      contrastRatio(token(foreground), token(background))
    ).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
  });

  it("keeps a separate darker border for controls than the decorative rule", () => {
    // The hairline under the header is ornamental and exempt from 1.4.11; the
    // control border is not, which is why they are different tokens.
    expect(contrastRatio(token("hairline"), token("surface"))).toBeLessThan(
      NON_TEXT_MINIMUM
    );
    expect(
      contrastRatio(token("control"), token("surface"))
    ).toBeGreaterThanOrEqual(NON_TEXT_MINIMUM);
  });

  it("still disables motion for users who ask for it", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });

  it("animates only compositor-friendly properties, so nothing shifts layout", () => {
    const keyframes = css.match(/@keyframes[^}]+\}[^}]*\}/gu) ?? [];

    expect(keyframes.length).toBeGreaterThan(0);
    keyframes.forEach((block) => {
      expect(block).not.toMatch(/\b(width|height|top|left|margin|padding):/u);
    });
  });
});
