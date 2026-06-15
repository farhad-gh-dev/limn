// Visual-regression: hash each tool's SVG for fixed inputs and compare to an
// approved snapshot manifest. Catches unintended design drift.
// Regenerate after intentional design changes: LIMN_UPDATE_SNAPSHOTS=1 npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { barChart } from "../src/tools/barChart.js";
import { lineChart } from "../src/tools/lineChart.js";
import { scatterPlot } from "../src/tools/scatterPlot.js";
import { distribution } from "../src/tools/distribution.js";
import { partToWhole } from "../src/tools/partToWhole.js";
import { slopeChart } from "../src/tools/slopeChart.js";
import { dumbbellPlot } from "../src/tools/dumbbellPlot.js";
import { waterfall } from "../src/tools/waterfall.js";
import { renderVegaSpec } from "../src/tools/renderVegaSpec.js";
import type { ToolDef } from "../src/tools/types.js";

const fixtures: Array<{ name: string; tool: ToolDef; args: Record<string, unknown> }> = [
  { name: "bar", tool: barChart, args: { data: [{ r: "A", v: 3 }, { r: "B", v: 7 }, { r: "C", v: 5 }], x: "r", y: "v", highlight: "B", valueLabels: true, title: "Bar" } },
  { name: "bar-dark", tool: barChart, args: { data: [{ r: "A", v: 3 }, { r: "B", v: 7 }], x: "r", y: "v", title: "Bar", style: { theme: "dark" } } },
  { name: "bar-print", tool: barChart, args: { data: [{ r: "A", v: 3 }, { r: "B", v: 7 }], x: "r", y: "v", title: "Bar", style: { theme: "print" } } },
  { name: "bar-accent", tool: barChart, args: { data: [{ r: "A", v: 3 }, { r: "B", v: 7 }], x: "r", y: "v", highlight: "A", style: { accentColor: "#d81b60" } } },
  { name: "line", tool: lineChart, args: { data: [{ d: "2024-01-01", s: "X", v: 1 }, { d: "2024-02-01", s: "X", v: 3 }, { d: "2024-01-01", s: "Y", v: 2 }, { d: "2024-02-01", s: "Y", v: 2 }], x: "d", y: "v", series: "s", title: "Line" } },
  { name: "scatter", tool: scatterPlot, args: { data: [{ x: 1, y: 2, c: "A" }, { x: 2, y: 4, c: "B" }, { x: 3, y: 5, c: "A" }], x: "x", y: "y", color: "c", trendLine: true } },
  { name: "distribution", tool: distribution, args: { data: Array.from({ length: 20 }, (_, i) => ({ v: i % 6 })), value: "v", kind: "histogram" } },
  { name: "part-to-whole", tool: partToWhole, args: { data: [{ c: "A", v: 50 }, { c: "B", v: 30 }, { c: "C", v: 20 }], category: "c", value: "v" } },
  { name: "slope", tool: slopeChart, args: { data: [{ yr: "2019", c: "A", v: 1 }, { yr: "2024", c: "A", v: 5 }, { yr: "2019", c: "B", v: 4 }, { yr: "2024", c: "B", v: 2 }], x: "yr", y: "v", series: "c" } },
  { name: "dumbbell", tool: dumbbellPlot, args: { data: [{ cat: "A", g: "2019", v: 1 }, { cat: "A", g: "2024", v: 5 }, { cat: "B", g: "2019", v: 3 }, { cat: "B", g: "2024", v: 2 }], category: "cat", group: "g", value: "v" } },
  { name: "waterfall", tool: waterfall, args: { data: [{ k: "Open", a: 100 }, { k: "Up", a: 30 }, { k: "Down", a: -20 }], label: "k", value: "a" } },
  { name: "vega-spec", tool: renderVegaSpec, args: { spec: { data: { values: [{ c: "A", v: 1 }, { c: "B", v: 2 }] }, mark: "bar", encoding: { x: { field: "c", type: "nominal" }, y: { field: "v", type: "quantitative" } } } } },
];

const snapPath = fileURLToPath(new URL("./snapshots.json", import.meta.url));
const update = process.env.LIMN_UPDATE_SNAPSHOTS === "1";

test("visual regression: SVG output matches approved snapshots", async () => {
  const approved: Record<string, string> =
    !update && existsSync(snapPath) ? JSON.parse(readFileSync(snapPath, "utf8")) : {};
  const next: Record<string, string> = {};

  for (const f of fixtures) {
    const { svg } = await f.tool.run(f.args);
    next[f.name] = createHash("sha256").update(svg).digest("hex");
    if (!update) {
      assert.equal(
        next[f.name],
        approved[f.name],
        `SVG drift for "${f.name}" — if intentional, run: LIMN_UPDATE_SNAPSHOTS=1 npm test`
      );
    }
  }

  if (update) {
    writeFileSync(snapPath, JSON.stringify(next, null, 2) + "\n");
    console.log(`wrote ${Object.keys(next).length} snapshots`);
  }
});
