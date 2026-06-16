import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolDef } from "./tools/types.js";
import { barChart } from "./tools/barChart.js";
import { lineChart } from "./tools/lineChart.js";
import { scatterPlot } from "./tools/scatterPlot.js";
import { distribution } from "./tools/distribution.js";
import { partToWhole } from "./tools/partToWhole.js";
import { slopeChart } from "./tools/slopeChart.js";
import { dumbbellPlot } from "./tools/dumbbellPlot.js";
import { waterfall } from "./tools/waterfall.js";
import { renderVegaSpec } from "./tools/renderVegaSpec.js";
import { SUGGEST_TOOL, recommend } from "./tools/suggestChart.js";

export const TOOLS: ToolDef[] = [
  barChart,
  lineChart,
  scatterPlot,
  distribution,
  partToWhole,
  slopeChart,
  dumbbellPlot,
  waterfall,
  renderVegaSpec,
];

// Every tool is a pure, offline, deterministic renderer.
const ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export function createServer(): McpServer {
  const server = new McpServer({ name: "limn", version: "0.3.0" });

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

  // The advisor returns text guidance (not a chart), so it is registered apart
  // from the chart-tool loop.
  server.registerTool(
    SUGGEST_TOOL.name,
    {
      title: SUGGEST_TOOL.title,
      description: SUGGEST_TOOL.description,
      inputSchema: SUGGEST_TOOL.inputShape,
      annotations: { title: SUGGEST_TOOL.title, ...ANNOTATIONS },
    },
    async (args: Record<string, unknown>) => {
      try {
        const rec = recommend(args);
        const lines = rec.suggestions.map(
          (s, i) => `${i + 1}. ${s.tool} (${s.confidence}) — ${s.rationale}\n   call: ${s.tool} ${JSON.stringify(s.args)}`
        );
        const profileStr = rec.profile
          .map((f) => `${f.name}: ${f.type}${f.type === "nominal" ? ` (${f.distinct} distinct)` : ""}`)
          .join(", ");
        const text =
          `${rec.summary}\n\n` +
          (lines.length ? `Ranked suggestions:\n${lines.join("\n")}\n\n` : "") +
          `Data profile: ${profileStr}`;
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { isError: true, content: [{ type: "text" as const, text: `Limn suggest_chart error: ${msg}` }] };
      }
    }
  );

  return server;
}
