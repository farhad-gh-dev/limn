import { test } from "node:test";
import assert from "node:assert/strict";
import { barChart } from "../src/tools/barChart.js";
import { slopeChart } from "../src/tools/slopeChart.js";
import { waterfall } from "../src/tools/waterfall.js";

test("bar_chart gives an actionable error when a field is missing", async () => {
  await assert.rejects(
    () => barChart.run({ data: [{ r: "A", v: 1 }], x: "region", y: "v" }),
    /not found in data[\s\S]*Available fields/
  );
});

test("bar_chart renders valid input with three artifacts", async () => {
  const r = await barChart.run({ data: [{ r: "A", v: 1 }, { r: "B", v: 2 }], x: "r", y: "v" });
  assert.ok(r.png.length > 1000);
  assert.match(r.svg, /<svg/);
  assert.equal(r.resolvedSpec.tool, "bar_chart");
});

test("slope_chart requires exactly two x values", async () => {
  await assert.rejects(
    () =>
      slopeChart.run({
        data: [
          { yr: "2019", c: "A", v: 1 },
          { yr: "2020", c: "A", v: 2 },
          { yr: "2021", c: "A", v: 3 },
        ],
        x: "yr",
        y: "v",
        series: "c",
      }),
    /exactly two/
  );
});

test("waterfall rejects non-numeric values", async () => {
  await assert.rejects(
    () => waterfall.run({ data: [{ k: "A", amt: "oops" }], label: "k", value: "amt" }),
    /not numeric/
  );
});
