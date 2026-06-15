// Renders one realistic example per tool into /examples (PNG + SVG).
// Used for eyeballing output and as the README gallery source.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { barChart } from "../src/tools/barChart.js";
import { lineChart } from "../src/tools/lineChart.js";
import { waterfall } from "../src/tools/waterfall.js";
import { slopeChart } from "../src/tools/slopeChart.js";
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

console.log("done");
