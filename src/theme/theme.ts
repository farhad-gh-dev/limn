// The design system, expressed as a Vega-Lite config plus a small set of
// spec-level transforms (title framing, sizing). This is the "moat": every
// styling decision lives here so the model never touches a style knob.
import { LIGHT, OKABE_ITO, SEQUENTIAL, DIVERGING, type ThemeColors, type ThemeName } from "./palette.js";

export const FONT = "Inter";
export const VL_SCHEMA = "https://vega.github.io/schema/vega-lite/v6.json";

export const DEFAULT_WIDTH = 600;
export const DEFAULT_HEIGHT = 380;
const PADDING = 18;

/** Fixed type scale — sizes and weights are theme-owned, never user-settable. */
export const TYPE = {
  title: { size: 16, weight: 700 },
  subtitle: { size: 13, weight: 400 },
  axisTitle: { size: 12, weight: 600 },
  axisLabel: { size: 11, weight: 400 },
  legend: { size: 12, weight: 400 },
  legendTitle: { size: 12, weight: 600 },
  valueLabel: { size: 11, weight: 500 },
  source: { size: 11, weight: 400 },
} as const;

export interface ResolvedStyle {
  theme: ThemeName;
  width: number;
  height: number;
  title?: string;
  subtitle?: string;
  source?: string;
  colors: ThemeColors;
}

/** Build the Vega-Lite `config` that encodes the whole look. */
export function vegaLiteConfig(c: ThemeColors = LIGHT): Record<string, unknown> {
  return {
    background: c.background,
    padding: PADDING,
    font: FONT,
    title: {
      anchor: "start",
      font: FONT,
      fontSize: TYPE.title.size,
      fontWeight: TYPE.title.weight,
      color: c.ink,
      subtitleFont: FONT,
      subtitleFontSize: TYPE.subtitle.size,
      subtitleFontWeight: TYPE.subtitle.weight,
      subtitleColor: c.muted,
      subtitlePadding: 6,
      offset: 14,
    },
    view: { stroke: null },
    axis: {
      labelFont: FONT,
      labelFontSize: TYPE.axisLabel.size,
      labelColor: c.muted,
      labelPadding: 6,
      titleFont: FONT,
      titleFontSize: TYPE.axisTitle.size,
      titleFontWeight: TYPE.axisTitle.weight,
      titleColor: c.ink,
      titlePadding: 10,
      domainColor: c.axis,
      domainWidth: 1,
      tickColor: c.axis,
      tickSize: 5,
      grid: false,
      gridColor: c.grid,
      gridWidth: 1,
      labelOverlap: true,
    },
    legend: {
      labelFont: FONT,
      labelFontSize: TYPE.legend.size,
      labelColor: c.ink,
      titleFont: FONT,
      titleFontSize: TYPE.legendTitle.size,
      titleFontWeight: TYPE.legendTitle.weight,
      titleColor: c.muted,
      orient: "top",
      direction: "horizontal",
      symbolType: "circle",
      symbolSize: 90,
      offset: 8,
      titlePadding: 8,
    },
    range: {
      category: OKABE_ITO as unknown as string[],
      ordinal: { scheme: "blues" },
      ramp: SEQUENTIAL,
      heatmap: SEQUENTIAL,
      diverging: DIVERGING,
    },
    bar: { color: c.accent, cornerRadiusEnd: 2 },
    point: { filled: true, size: 64 },
    line: { strokeWidth: 2.5, point: false },
    rule: { color: c.axis },
    text: { font: FONT, fontSize: TYPE.valueLabel.size, color: c.ink },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Deep merge where `b` wins on conflicts. */
export function deepMerge(a: unknown, b: unknown): Record<string, unknown> {
  const base = isObj(a) ? { ...a } : {};
  if (!isObj(b)) return base;
  for (const k of Object.keys(b)) {
    const av = base[k];
    const bv = b[k];
    base[k] = isObj(av) && isObj(bv) ? deepMerge(av, bv) : bv;
  }
  return base;
}

function buildTitle(style: ResolvedStyle): Record<string, unknown> | undefined {
  if (!style.title && !style.subtitle) return undefined;
  const t: Record<string, unknown> = { text: style.title ?? "" };
  if (style.subtitle) t.subtitle = style.subtitle;
  return t;
}

/** Apply the theme to a spec built by one of our tools. */
export function applyTheme(baseSpec: Record<string, unknown>, style: ResolvedStyle): Record<string, unknown> {
  const spec: Record<string, unknown> = { $schema: VL_SCHEMA, ...baseSpec };
  spec.width = style.width;
  spec.height = style.height;
  spec.background = style.colors.background;
  spec.config = deepMerge(vegaLiteConfig(style.colors), (baseSpec.config as Record<string, unknown>) ?? {});
  const title = buildTitle(style);
  if (title) spec.title = title;
  return spec;
}

/** Apply the theme to a user-supplied Vega-Lite spec (escape hatch).
 *  Theme config wins on protected tokens; user sizing/title preserved if set. */
export function applyThemeToUserSpec(
  userSpec: Record<string, unknown>,
  style: ResolvedStyle
): Record<string, unknown> {
  const spec: Record<string, unknown> = { ...userSpec };
  spec.config = deepMerge((userSpec.config as Record<string, unknown>) ?? {}, vegaLiteConfig(style.colors));
  spec.background = style.colors.background;
  if (style.width && spec.width == null) spec.width = style.width;
  if (style.height && spec.height == null) spec.height = style.height;
  const title = buildTitle(style);
  if (title && spec.title == null) spec.title = title;
  return spec;
}
