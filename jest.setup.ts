import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

/*
 * jsdom implements no layout and no pointer capture, but Radix's primitives call
 * into both to position and drive their popups. Without these the components throw
 * rather than open, so their behaviour could not be tested at all.
 *
 * These are stubs for missing browser plumbing, not stand-ins for app behaviour:
 * anything genuinely visual — where a popup lands, whether it overflows — still
 * needs a real browser.
 */
// Guarded: this file also runs for the node-environment suites, which have no DOM.
if (typeof Element !== "undefined") {
  if (typeof Element.prototype.hasPointerCapture !== "function") {
    Element.prototype.hasPointerCapture = (): boolean => false;
    Element.prototype.setPointerCapture = (): void => undefined;
    Element.prototype.releasePointerCapture = (): void => undefined;
  }

  if (typeof Element.prototype.scrollIntoView !== "function") {
    Element.prototype.scrollIntoView = (): void => undefined;
  }
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {
      return undefined;
    }

    unobserve(): void {
      return undefined;
    }

    disconnect(): void {
      return undefined;
    }
  };
}
