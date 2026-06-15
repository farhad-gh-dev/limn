import { test } from "node:test";
import assert from "node:assert/strict";
import { scatterPlot } from "../src/tools/scatterPlot.js";
import { distribution } from "../src/tools/distribution.js";
import { partToWhole } from "../src/tools/partToWhole.js";
import { dumbbellPlot } from "../src/tools/dumbbellPlot.js";

function ok(r: { png: Buffer; svg: string }): void {
  assert.ok(r.png.length > 1000);
  assert.match(r.svg, /<svg/);
}

test("scatter_plot renders with size, color, and trend line", async () => {
  ok(
    await scatterPlot.run({
      data: [
        { x: 1, y: 2, s: 3, c: "A" },
        { x: 2, y: 4, s: 5, c: "B" },
        { x: 3, y: 5, s: 2, c: "A" },
      ],
      x: "x",
      y: "y",
      size: "s",
      color: "c",
      trendLine: true,
    })
  );
});

test("distribution renders histogram, box, and density", async () => {
  const data = Array.from({ length: 30 }, (_, i) => ({ v: i % 7, g: i % 2 ? "A" : "B" }));
  ok(await distribution.run({ data, value: "v", kind: "histogram" }));
  ok(await distribution.run({ data, value: "v", kind: "box", series: "g" }));
  ok(await distribution.run({ data, value: "v", kind: "density", series: "g" }));
});

test("part_to_whole renders and echoes maxSlices", async () => {
  const data = [
    { c: "A", v: 50 },
    { c: "B", v: 30 },
    { c: "C", v: 10 },
    { c: "D", v: 5 },
    { c: "E", v: 3 },
    { c: "F", v: 2 },
  ];
  const r = await partToWhole.run({ data, category: "c", value: "v", maxSlices: 3 });
  ok(r);
  assert.equal(r.resolvedSpec.maxSlices, 3);
});

test("dumbbell_plot requires exactly two groups", async () => {
  await assert.rejects(
    () =>
      dumbbellPlot.run({
        data: [
          { cat: "X", g: "1", v: 1 },
          { cat: "X", g: "2", v: 2 },
          { cat: "X", g: "3", v: 3 },
        ],
        category: "cat",
        group: "g",
        value: "v",
      }),
    /exactly two/
  );
});

test("dumbbell_plot renders with two groups", async () => {
  ok(
    await dumbbellPlot.run({
      data: [
        { cat: "X", g: "2019", v: 1 },
        { cat: "X", g: "2024", v: 5 },
        { cat: "Y", g: "2019", v: 3 },
        { cat: "Y", g: "2024", v: 2 },
      ],
      category: "cat",
      group: "g",
      value: "v",
    })
  );
});
