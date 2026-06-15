import { test } from "node:test";
import assert from "node:assert/strict";
import { assertOfflineSpec, lockedLoader } from "../src/render/loader.js";
import { renderVegaSpec } from "../src/tools/renderVegaSpec.js";

test("assertOfflineSpec rejects data.url", () => {
  assert.throws(
    () => assertOfflineSpec({ data: { url: "https://example.com/d.csv" }, mark: "bar" }),
    /offline|url/i
  );
});

test("assertOfflineSpec rejects nested file:// url", () => {
  assert.throws(() => assertOfflineSpec({ layer: [{ data: { url: "file:///etc/passwd" } }] }), /url/i);
});

test("assertOfflineSpec allows inline data", () => {
  assert.doesNotThrow(() => assertOfflineSpec({ data: { values: [{ a: 1 }] }, mark: "bar" }));
});

test("lockedLoader rejects every method", async () => {
  const l = lockedLoader() as Record<string, (u: string) => Promise<unknown>>;
  await assert.rejects(() => l.load!("http://x"));
  await assert.rejects(() => l.http!("http://x"));
  await assert.rejects(() => l.file!("/etc/passwd"));
  await assert.rejects(() => l.sanitize!("http://x"));
});

test("render_vega_spec rejects remote data end-to-end", async () => {
  await assert.rejects(
    () => renderVegaSpec.run({ spec: { data: { url: "https://x/d.json" }, mark: "bar", encoding: {} } }),
    /offline|url/i
  );
});

test("render_vega_spec renders inline data", async () => {
  const r = await renderVegaSpec.run({
    spec: {
      data: { values: [{ c: "A", v: 1 }, { c: "B", v: 2 }] },
      mark: "bar",
      encoding: { x: { field: "c", type: "nominal" }, y: { field: "v", type: "quantitative" } },
    },
  });
  assert.ok(r.png.length > 1000);
  assert.match(r.svg, /<svg/);
});
