import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolDef } from "./tools/types.js";
import { barChart } from "./tools/barChart.js";
import { lineChart } from "./tools/lineChart.js";
import { waterfall } from "./tools/waterfall.js";
import { slopeChart } from "./tools/slopeChart.js";
import { renderVegaSpec } from "./tools/renderVegaSpec.js";

export const TOOLS: ToolDef[] = [barChart, lineChart, waterfall, slopeChart, renderVegaSpec];

// Every tool is a pure, offline, deterministic renderer.
const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createServer(): McpServer {
  const server = new McpServer({ name: "limn", version: "0.1.0" });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputShape,
        annotations: { title: tool.title, ...ANNOTATIONS },
      },
      async (args: Record<string, unknown>) => {
        try {
          const { png, svg, resolvedSpec } = await tool.run(args);
          return {
            content: [
              { type: "image" as const, data: png.toString("base64"), mimeType: "image/png" },
              {
                type: "text" as const,
                text:
                  `${tool.title} rendered (PNG above). Resolved spec — pass back to \`${tool.name}\` ` +
                  `with one change to refine:\n${JSON.stringify(resolvedSpec)}`,
              },
              { type: "text" as const, text: `Editable SVG:\n${svg}` },
            ],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            isError: true,
            content: [{ type: "text" as const, text: `Limn ${tool.name} error: ${msg}` }],
          };
        }
      }
    );
  }

  return server;
}
