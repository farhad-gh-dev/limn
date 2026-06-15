import { test } from "node:test";
import assert from "node:assert/strict";
import { barChart } from "../src/tools/barChart.js";

const args = {
  data: [
    { r: "A", v: 3 },
    { r: "B", v: 7 },
    { r: "C", v: 5 },
  ],
  x: "r",
  y: "v",
  title: "Determinism",
  source: "Source: test",
};

test("identical inputs produce byte-identical SVG and PNG", async () => {
  const a = await barChart.run({ ...args });
  const b = await barChart.run({ ...args });
  assert.equal(a.svg, b.svg);
  assert.equal(Buffer.compare(a.png, b.png), 0);
});
