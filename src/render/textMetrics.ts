// Accurate text measurement without a DOM/canvas.
//
// With no node-canvas present, Vega falls back to a crude character-count
// estimator (estimateWidth) that produces visible layout artifacts — bad for a
// design-first tool. Vega exposes `textMetrics.width` as a sanctioned override
// point (the Vega org's own vl-convert overrides it in Rust); here we override
// it with real advance-width measurement from the bundled Inter weights.
import * as vega from "vega";
import { create as createFont } from "fontkit";
import { fontBuffer, normalizeWeight, type WeightKey } from "./fonts.js";

interface MeasurableFont {
  unitsPerEm: number;
  layout(text: string): { advanceWidth: number };
}

const fkCache = new Map<WeightKey, MeasurableFont>();

function font(weight: WeightKey): MeasurableFont {
  let f = fkCache.get(weight);
  if (!f) {
    f = createFont(fontBuffer(weight)) as unknown as MeasurableFont;
    fkCache.set(weight, f);
  }
  return f;
}

/** Advance width (px) of `text` at a given size/weight in bundled Inter. */
export function measureWidth(text: string, fontSize: number, weight: WeightKey): number {
  if (!text) return 0;
  const f = font(weight);
  const run = f.layout(text);
  return (run.advanceWidth / f.unitsPerEm) * fontSize;
}

let installed = false;

/** Install the override onto Vega's shared textMetrics (idempotent). */
export function installTextMetrics(): void {
  if (installed) return;
  const tm = (vega as { textMetrics?: { width: (item: unknown, text: string) => number } }).textMetrics;
  if (!tm) return;
  tm.width = (item: unknown, text: string): number => {
    const it = (item ?? {}) as { fontSize?: number; fontWeight?: number | string };
    const size = typeof it.fontSize === "number" ? it.fontSize : 11;
    return measureWidth(text == null ? "" : String(text), size, normalizeWeight(it.fontWeight));
  };
  installed = true;
}
