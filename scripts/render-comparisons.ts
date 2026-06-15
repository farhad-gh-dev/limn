// Renders "raw Vega-Lite default" vs "Limn" for the same data — the before/after
// that is the core pitch. Raw = a bare spec compiled with Vega-Lite's defaults
// (what a generic chart server emits); Limn = the same data through our tools.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderVegaLite } from "../src/render/pipeline.js";
import { barChart } from "../src/tools/barChart.js";
import { lineChart } from "../src/tools/lineChart.js";

const outDir = fileURLToPath(new URL("../examples/", import.meta.url));
const VL = "https://vega.github.io/schema/vega-lite/v6.json";

async function raw(name: string, spec: Record<string, unknown>): Promise<void> {
  const { png } = await renderVegaLite({ $schema: VL, background: "#ffffff", ...spec });
  writeFileSync(`${outDir}${name}.png`, png);
  console.log(`${name.padEnd(26)} png ${String(png.length).padStart(7)}`);
}

async function limn(name: string, png: Buffer): Promise<void> {
  writeFileSync(`${outDir}${name}.png`, png);
  console.log(`${name.padEnd(26)} png ${String(png.length).padStart(7)}`);
}

const regions = [
  { region: "North America", revenue: 4_200_000 },
  { region: "EMEA", revenue: 3_100_000 },
  { region: "APAC", revenue: 2_750_000 },
  { region: "LATAM", revenue: 980_000 },
  { region: "MEA", revenue: 540_000 },
];

const services = ["API", "Web", "Worker"];
const lineData: Array<Record<string, string | number>> = [];
for (let m = 0; m < 12; m++) {
  const date = `2024-${String(m + 1).padStart(2, "0")}-01`;
  services.forEach((s, si) => {
    const base = 80 + si * 40;
    lineData.push({ date, service: s, latency_ms: Math.round(base + 20 * Math.sin((m + si) / 2) + m * (si === 0 ? -1.5 : 2)) });
  });
}

// --- Bar: raw (alphabetical, default blue, full grid, plain title) vs Limn ---
await raw("compare_bar_raw", {
  title: "Revenue by region",
  data: { values: regions },
  mark: "bar",
  encoding: {
    x: { field: "region", type: "nominal" },
    y: { field: "revenue", type: "quantitative" },
  },
  width: 600,
  height: 360,
});
await limn(
  "compare_bar_limn",
  (await barChart.run({ data: regions, x: "region", y: "revenue", valueLabels: true, title: "Revenue by region", source: "Source: internal billing (illustrative)" })).png
);

// --- Line: raw (legend, full grid) vs Limn (end-of-line labels) ---
await raw("compare_line_raw", {
  title: "Service latency over 2024",
  data: { values: lineData },
  mark: "line",
  encoding: {
    x: { field: "date", type: "temporal" },
    y: { field: "latency_ms", type: "quantitative" },
    color: { field: "service", type: "nominal" },
  },
  width: 600,
  height: 360,
});
await limn(
  "compare_line_limn",
  (await lineChart.run({ data: lineData, x: "date", y: "latency_ms", series: "service", title: "Service latency over 2024", subtitle: "Monthly p50, milliseconds" })).png
);

console.log("done");
