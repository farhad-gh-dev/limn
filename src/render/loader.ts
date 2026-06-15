// Privacy by construction. Two layers:
//   1. A Vega loader whose every method rejects — no socket, no file read.
//   2. A pre-render spec scan, because Vega swallows loader errors (it logs a
//      warning and renders an empty chart), so a silent failure is not enough —
//      we must reject offending specs before they reach the renderer.
// The default Vega loader will happily read file:// paths (verified: it parsed
// C:/Windows/win.ini), so the scan covers files as well as URLs.

const OFFLINE_MSG =
  "Limn renders fully offline. Provide data inline via `data.values` — fetching from a URL or file path is disabled.";

export function lockedLoader(): unknown {
  const reject = (what: string) => Promise.reject(new Error(`${OFFLINE_MSG} (blocked ${what})`));
  return {
    load: (uri: string) => reject(`load(${uri})`),
    sanitize: (uri: string) => reject(`sanitize(${uri})`),
    http: (uri: string) => reject(`http(${uri})`),
    file: (uri: string) => reject(`file(${uri})`),
  };
}

/** Throw if a user-supplied spec references any remote/file data source. */
export function assertOfflineSpec(spec: unknown): void {
  const offenders: string[] = [];
  const walk = (node: unknown, path: string): void => {
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const here = path ? `${path}.${k}` : k;
      if (k === "url" || k === "loader") {
        offenders.push(here);
      }
      walk(v, here);
    }
  };
  walk(spec, "");
  if (offenders.length > 0) {
    throw new Error(
      `${OFFLINE_MSG} The spec references: ${offenders.join(", ")}. Remove these and inline the data via data.values.`
    );
  }
}
