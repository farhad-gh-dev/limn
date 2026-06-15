// Okabe-Ito colorblind-safe categorical palette + supporting ramps.
// Reference: Okabe & Ito, "Color Universal Design" (2008) — the recognized
// standard for categorical distinguishability across deuter/protan/tritan vision.

/**
 * Categorical palette, ordered so the first few series stay maximally distinct
 * on a white background (low-contrast yellow and harsh black are placed last).
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

/** Single accent used by the "highlight one thing" pattern. */
export const DEFAULT_ACCENT = "#0072B2"; // Okabe-Ito blue

export interface ThemeColors {
  background: string;
  ink: string; // primary text (titles, value labels)
  muted: string; // secondary text (axis labels, legend)
  faint: string; // tertiary text (source line)
  grid: string; // gridlines
  axis: string; // axis domain + ticks
  mute: string; // de-emphasized marks in the highlight pattern
  accent: string; // emphasis
}

export const LIGHT: ThemeColors = {
  background: "#ffffff",
  ink: "#1c1e21",
  muted: "#5f6b7a",
  faint: "#8a94a3",
  grid: "#ececf0",
  axis: "#c9ced6",
  mute: "#cdd3db",
  accent: DEFAULT_ACCENT,
};

/** Semantic colors for waterfall steps. */
export const WATERFALL = {
  increase: "#009E73", // bluish green
  decrease: "#D55E00", // vermillion
  total: "#3a3f47", // neutral dark
} as const;

/** Perceptually-uniform sequential ramp for continuous data. */
export const SEQUENTIAL = { scheme: "viridis" } as const;

/** Colorblind-safe diverging ramp for signed/centered data. */
export const DIVERGING = { scheme: "blueorange" } as const;
