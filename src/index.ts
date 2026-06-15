#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for the JSON-RPC stream; status goes to stderr.
  process.stderr.write("limn-mcp v0.1.0 — running on stdio (local, offline)\n");
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
  process.stderr.write(`limn-mcp fatal: ${msg}\n`);
  process.exit(1);
});
