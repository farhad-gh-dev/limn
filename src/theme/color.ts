// Minimal color math for the accentColor "accept, then clamp to accessible"
// behaviour: we never reject a user's hex — we nudge it until it has enough
// contrast against the theme background (WCAG-style relative luminance).

type RGB = [number, number, number];

export function isHexColor(s: unknown): s is string {
  return typeof s === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  const to = (c: number) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function relativeLuminance([r, g, b]: RGB): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Return `hex` adjusted (if needed) to meet a minimum contrast ratio against
 * `bgHex`. On a light background we darken toward black; on a dark one we
 * lighten toward white. Returns the original if it already passes.
 */
export function clampAccentToContrast(hex: string, bgHex: string, min = 3): string {
  const bgLum = relativeLuminance(hexToRgb(bgHex));
  let rgb = hexToRgb(hex);
  if (contrastRatio(relativeLuminance(rgb), bgLum) >= min) return rgbToHex(rgb);

  const bgIsLight = bgLum > 0.5;
  for (let i = 0; i < 30 && contrastRatio(relativeLuminance(rgb), bgLum) < min; i++) {
    rgb = bgIsLight
      ? (rgb.map((c) => c * 0.9) as RGB)
      : (rgb.map((c) => c + (255 - c) * 0.12) as RGB);
  }
  return rgbToHex(rgb);
}
