import { test } from "node:test";
import assert from "node:assert/strict";
import { recommend } from "../src/tools/suggestChart.js";

const top = (args: Record<string, unknown>): string | undefined => recommend(args).suggestions[0]?.tool;

test("time-series question → line_chart with series", () => {
  const data = [
    { date: "2024-01-01", svc: "A", ms: 100 },
    { date: "2024-02-01", svc: "A", ms: 120 },
    { date: "2024-01-01", svc: "B", ms: 90 },
    { date: "2024-02-01", svc: "B", ms: 95 },
  ];
  const r = recommend({ data, question: "how does latency trend over time per service?" });
  assert.equal(r.suggestions[0]?.tool, "line_chart");
  assert.equal(r.suggestions[0]?.args.x, "date");
  assert.equal(r.suggestions[0]?.args.series, "svc");
});

test("share/composition question → part_to_whole", () => {
  const data = [{ ch: "Direct", n: 40 }, { ch: "Search", n: 30 }, { ch: "Social", n: 20 }];
  assert.equal(top({ data, question: "what's the breakdown of sessions by channel as a percent of total?" }), "part_to_whole");
});

test("before/after two-point question → slope_chart", () => {
  const data = [
    { yr: "2019", cat: "Mobile", v: 38 }, { yr: "2024", cat: "Mobile", v: 57 },
    { yr: "2019", cat: "Desktop", v: 44 }, { yr: "2024", cat: "Desktop", v: 26 },
    { yr: "2019", cat: "Tablet", v: 12 }, { yr: "2024", cat: "Tablet", v: 9 },
  ];
  assert.equal(top({ data, question: "how did share change before and after, 2019 vs 2024?" }), "slope_chart");
});

test("gap question with two points → dumbbell_plot", () => {
  const data = [
    { yr: "2019", cat: "A", v: 10 }, { yr: "2024", cat: "A", v: 30 },
    { yr: "2019", cat: "B", v: 20 }, { yr: "2024", cat: "B", v: 25 },
    { yr: "2019", cat: "C", v: 5 }, { yr: "2024", cat: "C", v: 40 },
  ];
  assert.equal(top({ data, question: "what's the gap / difference between the two years for each category?" }), "dumbbell_plot");
});

test("relationship of two numerics → scatter_plot", () => {
  const data = [{ spend: 1, rev: 2 }, { spend: 2, rev: 4 }, { spend: 3, rev: 5 }];
  assert.equal(top({ data, question: "is there a relationship between spend and revenue?" }), "scatter_plot");
});

test("distribution question → distribution", () => {
  const data = Array.from({ length: 20 }, (_, i) => ({ ms: i * 3 }));
  assert.equal(top({ data, question: "what's the distribution / spread of response times?" }), "distribution");
});

test("bridge question → waterfall", () => {
  const data = [{ step: "Open", amt: 100 }, { step: "Sales", amt: 30 }, { step: "Churn", amt: -20 }];
  assert.equal(top({ data, question: "show the P&L bridge of MRR" }), "waterfall");
});

test("compare-by question → bar_chart", () => {
  const data = [{ region: "NA", rev: 5 }, { region: "EMEA", rev: 3 }, { region: "APAC", rev: 4 }];
  assert.equal(top({ data, question: "compare revenue by region — which is highest?" }), "bar_chart");
});

test("returns 1–3 ranked suggestions and a field profile", () => {
  const data = [{ region: "NA", rev: 5 }, { region: "EMEA", rev: 3 }];
  const r = recommend({ data, question: "compare revenue by region" });
  assert.ok(r.suggestions.length >= 1 && r.suggestions.length <= 3);
  assert.ok(r.profile.some((f) => f.name === "rev" && f.type === "quantitative"));
});
