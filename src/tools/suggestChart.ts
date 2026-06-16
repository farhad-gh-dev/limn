// A deterministic, local chart recommender. It profiles the data (field types
// and cardinality) and matches the user's question against intent keywords, then
// scores the hero tools and returns ranked suggestions with field mappings.
// No network, no LLM — on-brand with Limn's local/offline guarantee.
import { z } from "zod";
import { dataField, fieldsOf, inferType, type DataRow } from "../schemas/common.js";

export const SUGGEST_TOOL = {
  name: "suggest_chart",
  title: "Suggest a chart",
  description:
    "Unsure which chart fits? Give the data and the question you want to answer; this recommends which Limn tool " +
    "to call and how to map the fields (deterministic, local — no network). Returns ranked suggestions with " +
    "callable arguments and a data profile; then call the recommended tool.",
  inputShape: {
    ...dataField,
    question: z
      .string()
      .optional()
      .describe('What you want to show, in plain language. Example: "how did revenue change by region over the year?"'),
  },
};

type FieldType = "quantitative" | "temporal" | "nominal";

interface FieldProfile {
  name: string;
  type: FieldType;
  distinct: number;
}

export interface Suggestion {
  tool: string;
  confidence: "high" | "medium" | "low";
  args: Record<string, unknown>;
  rationale: string;
  score: number;
}

export interface Recommendation {
  summary: string;
  suggestions: Suggestion[];
  profile: FieldProfile[];
}

function profileFields(data: DataRow[]): FieldProfile[] {
  return fieldsOf(data).map((name) => {
    const distinct = new Set(data.slice(0, 500).map((r) => String(r[name]))).size;
    return { name, type: inferType(data, name), distinct };
  });
}

function confidenceFor(score: number): Suggestion["confidence"] {
  if (score >= 9) return "high";
  if (score >= 6) return "medium";
  return "low";
}

export function recommend(args: Record<string, unknown>): Recommendation {
  const data = args.data as DataRow[];
  const q = String(args.question ?? "").toLowerCase();
  const profile = profileFields(data);

  const quant = profile.filter((f) => f.type === "quantitative");
  const temporal = profile.filter((f) => f.type === "temporal");
  const nominal = profile.filter((f) => f.type === "nominal");
  const lowCardNominal = nominal.filter((f) => f.distinct >= 2 && f.distinct <= 30);
  const twoValue = profile.filter((f) => f.type !== "quantitative" && f.distinct === 2);

  const has = (...kw: string[]): boolean => kw.some((k) => q.includes(k));
  const candidates: Suggestion[] = [];
  const add = (tool: string, score: number, toolArgs: Record<string, unknown>, rationale: string): void => {
    candidates.push({ tool, score, args: toolArgs, rationale, confidence: confidenceFor(score) });
  };

  const q0 = quant[0]?.name;
  const q1 = quant[1]?.name;
  const q2 = quant[2]?.name;
  const t0 = temporal[0]?.name;
  const cat = lowCardNominal[0]?.name ?? nominal[0]?.name;

  // line — time series
  if (t0 && q0) {
    const score = 6 + (has("over time", "trend", "timeline", "month", "week", "daily", "growth", "change over") ? 4 : 0);
    const series = lowCardNominal[0]?.name;
    add(
      "line_chart",
      score,
      { x: t0, y: q0, ...(series ? { series } : {}) },
      `A time field (${t0}) and a numeric field (${q0})${series ? `, split by ${series},` : ""} suit a line over time.`
    );
  }

  // slope / dumbbell — two-point comparison
  const grp = twoValue[0]?.name;
  if (grp && q0) {
    const other = nominal.find((f) => f.name !== grp && f.distinct > 2);
    if (other) {
      const slope = 5 + (has("before", "after", " vs", "versus", "change", "shift", "improv", "grew", "declin", "then") ? 4 : 0);
      add("slope_chart", slope, { x: grp, y: q0, series: other.name }, `Two ${grp} values with ${q0} per ${other.name} → before/after slope.`);
      const dumb = 5 + (has("gap", "difference", "disparity", "between two", "spread between") ? 4 : 0);
      add("dumbbell_plot", dumb, { category: other.name, group: grp, value: q0 }, `Two ${grp} values per ${other.name} → dumbbell showing each gap.`);
    }
  }

  // scatter — relationship between two numerics
  if (q0 && q1) {
    const score = 4 + (has("correlat", "relationship", "relate", " vs", "versus", "against", "scatter", "driver", "explain") ? 5 : 0);
    const color = lowCardNominal[0]?.name;
    add(
      "scatter_plot",
      score,
      { x: q0, y: q1, ...(q2 ? { size: q2 } : {}), ...(color ? { color } : {}) },
      `Two numeric fields (${q0}, ${q1}) → relationship / scatter.`
    );
  }

  // part_to_whole — composition
  if (cat && q0) {
    const score = 4 + (has("share", "proportion", "percent", "breakdown", "composition", "split", "part of", "make up", "of total", "%") ? 5 : 0);
    add("part_to_whole", score, { category: cat, value: q0 }, `${cat} as parts of total ${q0}.`);
  }

  // waterfall — signed build-up
  if (cat && q0) {
    const score = 2 + (has("waterfall", "bridge", "contribution", "build-up", "buildup", "p&l", "pnl", "variance", "net change", "walk") ? 7 : 0);
    add("waterfall", score, { label: cat, value: q0 }, `Signed steps of ${q0} bridging a start to an end.`);
  }

  // distribution — shape of one numeric
  if (q0) {
    const score = 3 + (has("distribution", "spread", "histogram", "frequency", "how many", "bucket", "range of", "variation", "outlier") ? 6 : 0);
    add("distribution", score, { value: q0, kind: "histogram" }, `The shape / spread of ${q0}.`);
  }

  // bar — compare across categories (sturdy default)
  if (cat && q0) {
    const score = 5 + (has("compare", "by ", "across", "rank", "top", "highest", "lowest", "most", "least", "which", "biggest") ? 3 : 0);
    add("bar_chart", score, { x: cat, y: q0 }, `Compare ${q0} across ${cat}.`);
  }

  // Keep the best candidate per tool, then take the top 3.
  const best = new Map<string, Suggestion>();
  for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
    if (!best.has(c.tool)) best.set(c.tool, c);
  }
  const suggestions = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 3);

  if (suggestions.length === 0) {
    return {
      summary: "Not enough structure to recommend a chart — provide at least one numeric field (and ideally a category or date).",
      suggestions: [],
      profile,
    };
  }

  const top = suggestions[0]!;
  return { summary: `Recommended: ${top.tool}. ${top.rationale}`, suggestions, profile };
}
