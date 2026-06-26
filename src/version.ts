import { readFileSync } from "node:fs";

// Single source of truth for the version: read from package.json at startup so
// the startup banner and the MCP server identity can never drift from what npm
// actually ships. package.json sits one level up from both src/ (dev via tsx)
// and dist/ (built), so the relative URL resolves correctly in either case.
const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as { version: string };

export const VERSION: string = pkg.version;
