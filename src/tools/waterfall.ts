import { z } from "zod";
import type { ToolDef } from "./types.js";
import {
  dataField,
  editorialShape,
  styleShape,
  resolveStyle,
  assertFields,
  prettify,
  type DataRow,
} from "../schemas/common.js";
import { applyTheme } from "../theme/theme.js";
import { WATERFALL, type ThemeColors } from "../theme/palette.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  ...dataField,
  label: z.string().describe('Step label field (the x categories). Example: "item".'),
  value: z
    .string()
    .describe('Signed numeric delta for each step (positive = increase, negative = decrease). Example: "amount".'),
  showTotal: z.boolean().optional().describe("Append a final total bar (sum of all steps). Default true."),
  totalLabel: z.string().optional().describe('Label for the appended total bar. Default "Total".'),
  ...editorialShape,
  ...styleShape,
};

function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.round(n * 100) / 100);
}

interface Bar {
  label: string;
  start: number;
  end: number;
  top: number;
  kindLabel: string;
  disp: string;
  __i: number;
}

function buildSpec(args: Record<string, unknown>, colors: ThemeColors): Record<string, unknown> {
  const data = args.data as DataRow[];
  const label = args.label as string;
  const value = args.value as string;
  const showTotal = (args.showTotal as boolean) ?? true;
  const totalLabel = (args.totalLabel as string) ?? "Total";

  assertFields(data, [
    { role: "label", field: label },
    { role: "value", field: value },
  ]);

  let run = 0;
  const bars: Bar[] = [];
  data.forEach((r, i) => {
    const v = Number(r[value]);
    if (Number.isNaN(v)) {
      throw new Error(`Waterfall value "${value}" is not numeric at row ${i} (got ${JSON.stringify(r[value])}).`);
    }
    const start = run;
    const end = run + v;
    run = end;
    bars.push({
      label: String(r[label]),
      start,
      end,
      top: Math.max(start, end),
      kindLabel: v >= 0 ? "Increase" : "Decrease",
      disp: (v > 0 ? "+" : "") + compact(v),
      __i: i,
    });
  });
  if (showTotal) {
    bars.push({
      label: totalLabel,
      start: 0,
      end: run,
      top: Math.max(0, run),
      kindLabel: "Total",
      disp: compact(run),
      __i: bars.length,
    });
  }

  const xEnc = {
    field: "label",
    type: "nominal",
    sort: { field: "__i" },
    title: null,
    axis: { grid: false, labelAngle: 0, labelLimit: 140 },
  };
  const colorEnc = {
    field: "kindLabel",
    type: "nominal",
    scale: {
      domain: ["Increase", "Decrease", "Total"],
      range: [WATERFALL.increase, WATERFALL.decrease, colors.neutral],
    },
    legend: { title: null, orient: "top" },
  };

  return {
    data: { values: bars },
    encoding: { x: xEnc },
    layer: [
      {
        mark: { type: "bar", cornerRadius: 1 },
        encoding: {
          y: {
            field: "start",
            type: "quantitative",
            title: prettify(value),
            axis: { grid: true, format: "~s", domain: false, ticks: false },
          },
          y2: { field: "end" },
          color: colorEnc,
        },
      },
      {
        mark: { type: "text", baseline: "bottom", dy: -4, fontWeight: 500 },
        encoding: {
          y: { field: "top", type: "quantitative" },
          text: { field: "disp" },
        },
      },
    ],
  };
}

export const waterfall: ToolDef = {
  name: "waterfall",
  title: "Waterfall (bridge) chart",
  description:
    "Show how a starting value bridges to an ending value through signed steps — a P&L bridge, variance analysis, " +
    "or build-up. Each row is a signed delta (the first step rises from zero); increases are green, decreases red, " +
    "and an absolute Total bar is appended by default. Steps are labeled with their signed value. " +
    "Returns PNG + SVG + the resolved spec.",
  inputShape,
  async run(args) {
    const style = resolveStyle(args);
    const themed = applyTheme(buildSpec(args, style.colors), style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: {
        tool: "waterfall",
        label: args.label,
        value: args.value,
        showTotal: (args.showTotal as boolean) ?? true,
        totalLabel: (args.totalLabel as string) ?? "Total",
        title: style.title ?? null,
        subtitle: style.subtitle ?? null,
        source: style.source ?? null,
        style: { theme: style.theme, width: style.width, height: style.height },
      },
    };
  },
};
