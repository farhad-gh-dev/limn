// Vega writes warnings/info to the console by default. Under MCP stdio that
// would corrupt the JSON-RPC stream, so route everything to stderr instead.
import * as vega from "vega";

const WARN = (vega as { Warn?: number }).Warn ?? 2;

export function stderrLogger(): unknown {
  let level = WARN;
  const write = (kind: string, args: unknown[]): void => {
    process.stderr.write(`[limn:vega:${kind}] ${args.map((a) => String(a)).join(" ")}\n`);
  };
  const logger = {
    level(l?: number) {
      if (l !== undefined) {
        level = l;
        return logger;
      }
      return level;
    },
    error(...args: unknown[]) {
      write("error", args);
      return logger;
    },
    warn(...args: unknown[]) {
      if (level >= WARN) write("warn", args);
      return logger;
    },
    info() {
      return logger;
    },
    debug() {
      return logger;
    },
  };
  return logger;
}
