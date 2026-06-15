import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

test("server lists the 5 tools and renders a bar chart via MCP", async () => {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "limn-test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  const listed = await client.listTools();
  const names = listed.tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "bar_chart",
    "distribution",
    "dumbbell_plot",
    "line_chart",
    "part_to_whole",
    "render_vega_spec",
    "scatter_plot",
    "slope_chart",
    "waterfall",
  ]);

  // Annotations should mark tools read-only / offline.
  const bar = listed.tools.find((t) => t.name === "bar_chart");
  assert.equal(bar?.annotations?.readOnlyHint, true);
  assert.equal(bar?.annotations?.openWorldHint, false);

  const res = (await client.callTool({
    name: "bar_chart",
    arguments: { data: [{ r: "A", v: 1 }, { r: "B", v: 2 }], x: "r", y: "v", title: "Hi" },
  })) as { content: Array<{ type: string; mimeType?: string; data?: string }> };

  const image = res.content.find((c) => c.type === "image");
  assert.ok(image, "expected an image content block");
  assert.equal(image?.mimeType, "image/png");
  assert.ok((image?.data?.length ?? 0) > 1000);
  assert.ok(res.content.some((c) => c.type === "text" && /resolved spec/i.test(JSON.stringify(c))));

  await client.close();
  await server.close();
});
