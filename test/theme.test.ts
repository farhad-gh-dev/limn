import { test } from "node:test";
import assert from "node:assert/strict";
import { barChart } from "../src/tools/barChart.js";
import { clampAccentToContrast, isHexColor } from "../src/theme/color.js";

function ok(r: { png: Buffer; svg: string }): void {
  assert.ok(r.png.length > 1000);
  assert.match(r.svg, /<svg/);
}

const data = [
  { r: "A", v: 3 },
  { r: "B", v: 7 },
];

test("renders the dark and print themes", async () => {
  ok(await barChart.run({ data, x: "r", y: "v", style: { theme: "dark" } }));
  ok(await barChart.run({ data, x: "r", y: "v", style: { theme: "print" } }));
});

test("renders with a custom accentColor", async () => {
  ok(await barChart.run({ data, x: "r", y: "v", highlight: "A", style: { accentColor: "#d81b60" } }));
});

test("isHexColor validates hex strings", () => {
  assert.ok(isHexColor("#0a7cff"));
  assert.ok(isHexColor("#abc"));
  assert.ok(!isHexColor("blue"));
  assert.ok(!isHexColor("#xyz"));
  assert.ok(!isHexColor(123));
});

test("clampAccentToContrast adjusts low-contrast accents but keeps good ones", () => {
  // Pale yellow on white has poor contrast → should be darkened.
  assert.notEqual(clampAccentToContrast("#fff8a0", "#ffffff").toLowerCase(), "#fff8a0");
  // A near-black accent on a dark background → should be lightened.
  assert.notEqual(clampAccentToContrast("#222222", "#1a1d21").toLowerCase(), "#222222");
  // A strong accent that already passes is returned unchanged.
  assert.equal(clampAccentToContrast("#0072B2", "#ffffff").toLowerCase(), "#0072b2");
});
