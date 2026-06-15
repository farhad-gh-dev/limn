// Renders one realistic example per tool into /examples (PNG + SVG).
// Used for eyeballing output and as the README gallery source.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { barChart } from "../src/tools/barChart.js";
import { lineChart } from "../src/tools/lineChart.js";
import { scatterPlot } from "../src/tools/scatterPlot.js";
import { distribution } from "../src/tools/distribution.js";
import { partToWhole } from "../src/tools/partToWhole.js";
import { waterfall } from "../src/tools/waterfall.js";
import { slopeChart } from "../src/tools/slopeChart.js";
import { dumbbellPlot } from "../src/tools/dumbbellPlot.js";
import { renderVegaSpec } from "../src/tools/renderVegaSpec.js";
import type { ToolDef } from "../src/tools/types.js";

const outDir = fileURLToPath(new URL("../examples/", import.meta.url));

async function emit(name: string, tool: ToolDef, args: Record<string, unknown>): Promise<void> {
  const t0 = performance.now();
  const { png, svg } = await tool.run(args);
  writeFileSync(`${outDir}${name}.png`, png);
  writeFileSync(`${outDir}${name}.svg`, svg);
  console.log(`${name.padEnd(26)} png ${String(png.length).padStart(7)}  svg ${String(svg.length).padStart(6)}  ${(performance.now() - t0).toFixed(0)}ms`);
}

// Multi-series line data (deterministic).
const services = ["API", "Web", "Worker"];
const lineData: Array<Record<string, string | number>> = [];
for (let m = 0; m < 12; m++) {
  const date = `2024-${String(m + 1).padStart(2, "0")}-01`;
  services.forEach((s, si) => {
    const base = 80 + si * 40;
    const v = Math.round(base + 20 * Math.sin((m + si) / 2) + m * (si === 0 ? -1.5 : 2));
    lineData.push({ date, service: s, latency_ms: v });
  });
}

await emit("bar_revenue", barChart, {
  data: [
    { region: "North America", revenue: 4_200_000 },
    { region: "EMEA", revenue: 3_100_000 },
    { region: "APAC", revenue: 2_750_000 },
    { region: "LATAM", revenue: 980_000 },
    { region: "MEA", revenue: 540_000 },
  ],
  x: "region",
  y: "revenue",
  highlight: "APAC",
  valueLabels: true,
  title: "Revenue by region",
  subtitle: "FY2024 · highlighting APAC",
  source: "Source: internal billing (illustrative)",
});

await emit("bar_grouped", barChart, {
  data: [
    { quarter: "Q1", product: "Core", revenue: 120 },
    { quarter: "Q1", product: "Add-ons", revenue: 48 },
    { quarter: "Q2", product: "Core", revenue: 138 },
    { quarter: "Q2", product: "Add-ons", revenue: 61 },
    { quarter: "Q3", product: "Core", revenue: 145 },
    { quarter: "Q3", product: "Add-ons", revenue: 73 },
    { quarter: "Q4", product: "Core", revenue: 162 },
    { quarter: "Q4", product: "Add-ons", revenue: 89 },
  ],
  x: "quarter",
  y: "revenue",
  series: "product",
  layout: "grouped",
  sort: "none",
  title: "Revenue by quarter",
  subtitle: "Core vs add-ons ($M)",
});

await emit("line_latency", lineChart, {
  data: lineData,
  x: "date",
  y: "latency_ms",
  series: "service",
  title: "Service latency over 2024",
  subtitle: "Monthly p50, milliseconds",
  source: "Source: synthetic",
});

await emit("waterfall_mrr", waterfall, {
  data: [
    { item: "Opening", amount: 120 },
    { item: "New sales", amount: 48 },
    { item: "Upsell", amount: 18 },
    { item: "Churn", amount: -22 },
    { item: "Discounts", amount: -9 },
  ],
  label: "item",
  value: "amount",
  totalLabel: "Net MRR",
  title: "MRR bridge — Q2",
  subtitle: "Movement in monthly recurring revenue ($K)",
});

await emit("slope_share", slopeChart, {
  data: [
    { year: "2019", category: "Mobile", share: 38 },
    { year: "2024", category: "Mobile", share: 57 },
    { year: "2019", category: "Desktop", share: 44 },
    { year: "2024", category: "Desktop", share: 26 },
    { year: "2019", category: "Tablet", share: 12 },
    { year: "2024", category: "Tablet", share: 9 },
    { year: "2019", category: "Other", share: 6 },
    { year: "2024", category: "Other", share: 4 },
  ],
  x: "year",
  y: "share",
  series: "category",
  highlight: "Mobile",
  title: "Traffic share by device, 2019 → 2024",
  subtitle: "Percent of sessions",
});

await emit("escape_donut", renderVegaSpec, {
  spec: {
    mark: { type: "arc", innerRadius: 70, cornerRadius: 1 },
    encoding: {
      theta: { field: "v", type: "quantitative", stack: true },
      color: { field: "c", type: "nominal", legend: { title: null, orient: "right" } },
    },
    data: {
      values: [
        { c: "Direct", v: 42 },
        { c: "Search", v: 31 },
        { c: "Social", v: 18 },
        { c: "Referral", v: 9 },
      ],
    },
  },
  title: "Sessions by channel",
  subtitle: "Escape hatch: themed Vega-Lite donut",
});

// --- scatter ---
const segments = ["Enterprise", "SMB", "Startup"];
const scatterData: Array<Record<string, string | number>> = [];
for (let i = 0; i < 18; i++) {
  const spend = 20 + i * 7 + (i % 3) * 15;
  const revenue = Math.round(spend * 3.2 + 40 * Math.sin(i) + 30);
  scatterData.push({ spend: spend * 1000, revenue: revenue * 1000, segment: segments[i % 3]!, headcount: 5 + (i % 6) * 8 });
}
await emit("scatter_spend", scatterPlot, {
  data: scatterData,
  x: "spend",
  y: "revenue",
  size: "headcount",
  color: "segment",
  trendLine: true,
  title: "Revenue vs. marketing spend",
  subtitle: "Bubble size = headcount",
  source: "Source: synthetic",
});

// --- distribution (histogram) ---
const distData: Array<Record<string, number>> = [];
for (let i = 0; i < 160; i++) {
  distData.push({ response_ms: Math.round(180 + 90 * Math.abs(Math.sin(i * 1.3)) + (i % 7) * 6 + (i % 13) * 4) });
}
await emit("distribution_latency", distribution, {
  data: distData,
  value: "response_ms",
  kind: "histogram",
  maxBins: 24,
  title: "Response time distribution",
  subtitle: "Requests by latency bucket (ms)",
});

// --- part_to_whole (donut, 7 categories → "Other") ---
await emit("part_to_whole_channels", partToWhole, {
  data: [
    { channel: "Direct", sessions: 4200 },
    { channel: "Organic search", sessions: 3800 },
    { channel: "Paid search", sessions: 2100 },
    { channel: "Social", sessions: 1500 },
    { channel: "Email", sessions: 900 },
    { channel: "Referral", sessions: 600 },
    { channel: "Affiliate", sessions: 300 },
  ],
  category: "channel",
  value: "sessions",
  title: "Sessions by channel",
  subtitle: "Top channels; remainder grouped into Other",
});

// --- dumbbell ---
await emit("dumbbell_score", dumbbellPlot, {
  data: [
    { country: "Germany", year: "2019", score: 62 },
    { country: "Germany", year: "2024", score: 71 },
    { country: "Japan", year: "2019", score: 55 },
    { country: "Japan", year: "2024", score: 58 },
    { country: "Brazil", year: "2019", score: 40 },
    { country: "Brazil", year: "2024", score: 61 },
    { country: "India", year: "2019", score: 33 },
    { country: "India", year: "2024", score: 52 },
    { country: "Kenya", year: "2019", score: 28 },
    { country: "Kenya", year: "2024", score: 35 },
    { country: "Canada", year: "2019", score: 70 },
    { country: "Canada", year: "2024", score: 68 },
  ],
  category: "country",
  group: "year",
  value: "score",
  title: "Index score, 2019 → 2024",
  subtitle: "Sorted by size of change",
});

// --- theme: dark ---
await emit("theme_dark_line", lineChart, {
  data: lineData,
  x: "date",
  y: "latency_ms",
  series: "service",
  title: "Service latency over 2024",
  subtitle: "Dark theme",
  source: "Source: synthetic",
  style: { theme: "dark" },
});

// --- accentColor (clamped) ---
await emit("theme_accent_bar", barChart, {
  data: [
    { region: "North America", revenue: 4_200_000 },
    { region: "EMEA", revenue: 3_100_000 },
    { region: "APAC", revenue: 2_750_000 },
    { region: "LATAM", revenue: 980_000 },
  ],
  x: "region",
  y: "revenue",
  highlight: "APAC",
  valueLabels: true,
  title: "Custom accent color",
  subtitle: "accentColor #d81b60, auto-clamped for contrast",
  style: { accentColor: "#d81b60" },
});

console.log("done");
