// Shared schema fragments and helpers. Schemas follow "data in, not config in":
// records + semantic field names, minimal required fields, a small closed style.
import { z } from "zod";
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, type ResolvedStyle } from "../theme/theme.js";

export type DataRow = Record<string, string | number | boolean | null>;

export const dataField = {
  data: z
    .array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .min(1)
    .describe(
      'Array of data rows; each row is an object keyed by field name. Example: [{"region":"EMEA","revenue":120},{"region":"APAC","revenue":98}]'
    ),
};

export const editorialShape = {
  title: z
    .string()
    .optional()
    .describe("Chart title — short and declarative. Editorial framing is a big part of looking designed."),
  subtitle: z.string().optional().describe("One-line subtitle (context or the takeaway)."),
  source: z
    .string()
    .optional()
    .describe('Source / footnote shown bottom-left, e.g. "Source: internal billing, FY24".'),
};

export const StyleSchema = z
  .object({
    theme: z.enum(["light"]).default("light").describe("Visual theme. v0.1 ships 'light'."),
    width: z.number().int().min(160).max(2000).optional().describe("Plot width in px. Default 600."),
    height: z.number().int().min(120).max(2000).optional().describe("Plot height in px. Default 380."),
  })
  .strict();

export const styleShape = {
  style: StyleSchema.optional().describe(
    "Constrained style. By design there are no font, gridline, tick, or per-element color knobs."
  ),
};

export function resolveStyle(args: Record<string, unknown>): ResolvedStyle {
  const s = (args.style ?? {}) as { theme?: "light"; width?: number; height?: number };
  return {
    theme: s.theme ?? "light",
    width: s.width ?? DEFAULT_WIDTH,
    height: s.height ?? DEFAULT_HEIGHT,
    title: args.title as string | undefined,
    subtitle: args.subtitle as string | undefined,
    source: args.source as string | undefined,
  };
}

export function fieldsOf(data: DataRow[]): string[] {
  const set = new Set<string>();
  for (const row of data.slice(0, 50)) {
    for (const k of Object.keys(row)) set.add(k);
  }
  return [...set];
}

/** Validate that referenced fields exist; throw an actionable message if not. */
export function assertFields(
  data: DataRow[],
  fields: Array<{ role: string; field: string | undefined }>
): void {
  const available = fieldsOf(data);
  for (const f of fields) {
    if (f.field != null && !available.includes(f.field)) {
      throw new Error(
        `Field "${f.field}" (${f.role}) not found in data. Available fields: ${available.join(", ") || "(none)"}.`
      );
    }
  }
}

export function prettify(field: string): string {
  const s = field.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toStringArray(v: unknown): string[] {
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]).map((x) => String(x));
}
