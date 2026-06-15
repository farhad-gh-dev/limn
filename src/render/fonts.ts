// Bundled Inter font access. Static weights are shipped in /fonts so output is
// deterministic and never falls back to host fonts. resvg performs no synthesis,
// so each weight we use at render time must have its own file here.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type WeightKey = 400 | 500 | 600 | 700;

const FILES: Record<WeightKey, string> = {
  400: "Inter-Regular.ttf",
  500: "Inter-Medium.ttf",
  600: "Inter-SemiBold.ttf",
  700: "Inter-Bold.ttf",
};

// This file lives at <root>/dist/render/fonts.js (built) and <root>/src/render/fonts.ts
// (tsx) — both two levels under the package root, so ../../fonts resolves either way.
const fontPath = (file: string): string => fileURLToPath(new URL(`../../fonts/${file}`, import.meta.url));

/** Absolute paths to every bundled weight, for resvg's fontFiles. */
export const FONT_FILES: string[] = (Object.values(FILES) as string[]).map(fontPath);

const bufCache = new Map<WeightKey, Buffer>();

/** Lazily read + cache a weight's TTF buffer (for fontkit measurement). */
export function fontBuffer(weight: WeightKey): Buffer {
  let b = bufCache.get(weight);
  if (!b) {
    b = readFileSync(fontPath(FILES[weight]));
    bufCache.set(weight, b);
  }
  return b;
}

/** Snap any CSS font-weight (numeric or keyword) to a bundled weight. */
export function normalizeWeight(w: number | string | undefined | null): WeightKey {
  if (w == null) return 400;
  let n: number;
  if (typeof w === "string") {
    if (w === "bold") return 700;
    if (w === "normal" || w === "lighter") return 400;
    const parsed = parseInt(w, 10);
    if (Number.isNaN(parsed)) return 400;
    n = parsed;
  } else {
    n = w;
  }
  if (n >= 700) return 700;
  if (n >= 600) return 600;
  if (n >= 500) return 500;
  return 400;
}
