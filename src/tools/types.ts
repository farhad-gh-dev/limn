import type { ZodRawShape } from "zod";

/** What every tool produces: the three-artifact output contract. */
export interface ChartArtifacts {
  svg: string;
  png: Buffer;
  /** Resolved tool inputs (defaults applied, data omitted) — pass back to refine. */
  resolvedSpec: Record<string, unknown>;
}

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputShape: ZodRawShape;
  run(args: Record<string, unknown>): Promise<ChartArtifacts>;
}
