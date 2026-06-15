import { z } from "zod";
import type { ToolDef } from "./types.js";
import { editorialShape, styleShape, resolveStyle } from "../schemas/common.js";
import { applyThemeToUserSpec } from "../theme/theme.js";
import { assertOfflineSpec } from "../render/loader.js";
import { renderVegaLite } from "../render/pipeline.js";

const inputShape = {
  spec: z
    .record(z.any())
    .describe(
      "A Vega-Lite (v5/v6) JSON spec for a chart outside the hero set. Data MUST be inline via data.values — " +
        "data.url / remote / file references are rejected. Limn's theme is injected and overrides styling config."
    ),
  ...editorialShape,
  ...styleShape,
};

export const renderVegaSpec: ToolDef = {
  name: "render_vega_spec",
  title: "Render a themed Vega-Lite spec (escape hatch)",
  description:
    "Render an arbitrary Vega-Lite JSON spec through Limn's theme — for chart types outside the hero set. " +
    "Pure Vega-Lite JSON only (no arbitrary Vega/JS expressions). Data must be inline; any url/file reference is " +
    "rejected to preserve the offline guarantee. Returns PNG + SVG + the resolved (themed) spec.",
  inputShape,
  async run(args) {
    const userSpec = args.spec as Record<string, unknown>;
    if (userSpec == null || typeof userSpec !== "object" || Array.isArray(userSpec)) {
      throw new Error("`spec` must be a Vega-Lite spec object with inline data (data.values).");
    }
    assertOfflineSpec(userSpec);
    const style = resolveStyle(args);
    const themed = applyThemeToUserSpec(userSpec, style);
    const { svg, png } = await renderVegaLite(themed, { source: style.source, sourceColor: style.colors.faint });
    return {
      svg,
      png,
      resolvedSpec: { tool: "render_vega_spec", spec: themed },
    };
  },
};
