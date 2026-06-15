// Okabe-Ito colorblind-safe categorical palette + per-theme color tokens.
// Reference: Okabe & Ito, "Color Universal Design" (2008) — the recognized
// standard for categorical distinguishability across deuter/protan/tritan vision.

/**
 * Categorical palette, ordered so the first few series stay maximally distinct
 * (low-contrast yellow and harsh black are placed last). Works on light and dark.
 */
export const OKABE_ITO: readonly string[] = [
  "#0072B2", // blue
  "#E69F00", // orange
  "#009E73", // bluish green
  "#D55E00", // vermillion
  "#56B4E9", // sky blue
  "#CC79A7", // reddish purple
  "#F0E442", // yellow
  "#000000", // black
];

export interface ThemeColors {
  background: string;
  ink: string; // primary text (titles, value labels)
  muted: string; // secondary text (axis labels, legend)
  faint: string; // tertiary text (source line)
  grid: string; // gridlines
  axis: string; // axis domain + ticks
  mute: string; // de-emphasized marks in the highlight pattern
  accent: string; // emphasis
  neutral: string; // strong neutral fill (e.g. waterfall total)
}

export const LIGHT: ThemeColors = {
  background: "#ffffff",
  ink: "#1c1e21",
  muted: "#5f6b7a",
  faint: "#8a94a3",
  grid: "#ececf0",
  axis: "#c9ced6",
  mute: "#cdd3db",
  accent: "#0072B2",
  neutral: "#3a3f47",
};

export const DARK: ThemeColors = {
  background: "#1a1d21",
  ink: "#e8eaed",
  muted: "#9aa3ad",
  faint: "#6b7480",
  grid: "#2b2f36",
  axis: "#3a4048",
  mute: "#454c55",
  accent: "#4ea8e6",
  neutral: "#c8ced6",
};

export const PRINT: ThemeColors = {
  background: "#ffffff",
  ink: "#14171a",
  muted: "#454f5b",
  faint: "#727b86",
  grid: "#e6e6e9",
  axis: "#aab0b8",
  mute: "#c6ccd3",
  accent: "#0a5f9e",
  neutral: "#23272e",
};

export type ThemeName = "light" | "dark" | "print";

export const THEMES: Record<ThemeName, ThemeColors> = {
  light: LIGHT,
  dark: DARK,
  print: PRINT,
};

export const DEFAULT_ACCENT = LIGHT.accent;

/** Waterfall step colors; the total bar uses the theme's `neutral`. */
export const WATERFALL = {
  increase: "#009E73", // bluish green
  decrease: "#D55E00", // vermillion
} as const;

/** Perceptually-uniform sequential ramp for continuous data. */
export const SEQUENTIAL = { scheme: "viridis" } as const;

/** Colorblind-safe diverging ramp for signed/centered data. */
export const DIVERGING = { scheme: "blueorange" } as const;
