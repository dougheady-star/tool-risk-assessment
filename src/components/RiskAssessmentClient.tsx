"use client";

import React, { useMemo, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";

import { toolRiskSurvey } from "@/lib/toolRiskSurvey";
import {
  scoreToolRiskAligned,
  ToolRiskScore,
  ThreatRow,
  Rating,
} from "@/lib/toolRiskScoring";

type Mode = "survey" | "results";

function Badge({ level }: { level: Rating }) {
  const styles: Record<Rating, string> = {
    Low: "bg-green-100 text-green-800 border-green-300",
    Medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    High: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${styles[level]}`}
    >
      {level}
    </span>
  );
}

export default function RiskAssessmentClient() {
  const [mode, setMode] = useState<Mode>("survey");
  const [answers, setAnswers] = useState<any>(null);
  const [result, setResult] = useState<ToolRiskScore | null>(null);
  const [assessedAt, setAssessedAt] = useState<string | null>(null);
  const [surveyKey, setSurveyKey] = useState(0);

  const [legendOpen, setLegendOpen] = useState(false);
  const [openWhy, setOpenWhy] = useState<Record<number, boolean>>({});

  function handlePrint() {
    window.print();
  }

  function resetAll() {
    setMode("survey");
    setAnswers(null);
    setResult(null);
    setSurveyKey((k) => k + 1);
    setOpenWhy({});
    setLegendOpen(false);
    setAssessedAt(null);
  }

  const model = useMemo(() => {
    const m = new Model(toolRiskSurvey as any);

    if (answers) {
      m.data = answers;
    }

    m.onComplete.add((sender) => {
      const scored = scoreToolRiskAligned(sender.data);

      scored.ToolName =
        sender.data.ToolName ||
        sender.data.ApplicationName ||
        "Unnamed Tool";

      setAnswers(sender.data);
      setResult(scored);
      setAssessedAt(new Date().toLocaleDateString());
      setMode("results");
    });

    return m;
  }, [surveyKey, answers]);

  const toolName =
    result?.ToolName || answers?.ToolName || answers?.ApplicationName || "";

  const assessedBy = answers?.AssessedBy || "—";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-sm opacity-90">
            Tool / Application Risk Assessment
          </div>

          {mode === "results" && result ? (
            <div className="mt-1 flex flex-col gap-1">
              <div className="text-3xl font-semibold tracking-tight">{toolName}</div>
              <div className="text-sm opacity-95">
                Assessment Date: {assessedAt || "—"} · Assessed By: {assessedBy}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-2xl font-bold leading-tight">
              Tool / Application Risk Assessment
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Survey mode */}
        {mode === "survey" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <Survey model={model} />
          </div>
        )}

        {/* Results mode */}
        {mode === "results" && result && (
          <div id="print-area" className="space-y-5">
            {/* Collapsible Legend (RESTORED) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left print-hide"
                onClick={() => setLegendOpen((v) => !v)}
              >
                <div className="font-semibold text-gray-900">
                  How risk scores are calculated
                </div>
                <div className="text-sm text-blue-700 font-semibold">
                  {legendOpen ? "Hide" : "Show"}
                </div>
              </button>

              {/* In print, always show the legend text (no button needed). */}
              <div
                className={`mt-3 text-sm text-gray-700 space-y-2 ${
                  legendOpen ? "" : "hidden print:block"
                }`}
              >
                <div>
                  <span className="font-semibold">Probability & Impact</span> –
                  Likelihood and severity. Scale: Low (1) · Medium (2) · High (3)
                </div>
                <div>
                  <span className="font-semibold">Inherent & Residual Risk</span>{" "}
                  – Risk before and after controls. Scale: 1 (lowest) to 9
                  (highest)
                </div>
                <div>
                  <span className="font-semibold">Overall Risk Rating</span> –
                  Low: &lt; 3.1 · Medium: 3.1–6.0 · High: ≥ 6.1
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wider font-bold text-gray-500">
                  Overall Inherent Risk
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-4xl font-bold text-gray-900">
                    {result.OverallInherentRiskCalc}
                  </div>
                  <Badge level={result.OverallInherentRisk} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-xs uppercase tracking-wider font-bold text-gray-500">
                  Overall Residual Risk
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-4xl font-bold text-gray-900">
                    {result.OverallResidualRiskCalc}
                  </div>
                  <Badge level={result.OverallResidualRisk} />
                </div>
              </div>
            </div>

            {/* Threat Table */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="font-semibold text-gray-900 mb-3">
                Threat Summary
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm table-fixed">
                  {/* HARD COLUMN MODEL (helps screen + print consistency) */}
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Threat
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                        Prob
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                        Impact
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                        Inherent
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                        Control
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 whitespace-nowrap">
                        Residual
                      </th>
                      <th className="border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Mitigation
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.Rows.map((r: ThreatRow, idx: number) => (
                      <React.Fragment key={`${r.Threat}-${idx}`}>
                        <tr>
                          <td className="border px-3 py-2 font-medium text-gray-900">
                            {r.Threat}
                          </td>

                          <td className="border px-3 py-2 whitespace-nowrap">
                            {r.Probability}
                          </td>

                          <td className="border px-3 py-2 whitespace-nowrap">
                            {r.Impact}
                          </td>

                          <td className="border px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span>{r.InherentRiskCalc}</span>
                              <Badge level={r.InherentRisk} />
                            </div>
                          </td>

                          <td className="border px-3 py-2">
                            {r.ControlRating}
                          </td>

                          <td className="border px-3 py-2">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span>{r.ResidualRiskCalc}</span>
                                <Badge level={r.ResidualRisk} />
                              </div>

                              {r._why && (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-blue-700 print-hide"
                                  onClick={() =>
                                    setOpenWhy((prev) => ({
                                      ...prev,
                                      [idx]: !prev[idx],
                                    }))
                                  }
                                >
                                  Why?
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="border px-3 py-2">{r.Mitigation}</td>
                        </tr>

                        {/* Expandable Why Row (RESTORED) */}
                        {openWhy[idx] && r._why && (
                          <tr>
                            <td
                              className="border px-3 py-3 bg-blue-50"
                              colSpan={7}
                            >
                              <div className="font-semibold text-gray-900">
                                Why this residual risk exists
                              </div>

                              <div className="mt-1 text-sm text-gray-800">
                                {r._why.summary}
                              </div>

                              {r._why.helpingFactors?.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    What is helping reduce risk
                                  </div>
                                  <ul className="mt-1 list-disc pl-6 text-sm text-gray-800">
                                    {r._why.helpingFactors.map((h, i) => (
                                      <li key={`h-${idx}-${i}`}>{h}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {r._why.remainingDrivers?.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-sm font-semibold text-gray-900">
                                    What still drives risk
                                  </div>
                                  <ul className="mt-1 list-disc pl-6 text-sm text-gray-800">
                                    {r._why.remainingDrivers.map((d, i) => (
                                      <li key={`d-${idx}-${i}`}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2 print-hide">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 font-medium bg-white hover:bg-gray-50 transition"
                onClick={() => setMode("survey")}
              >
                Edit Answers
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition"
                onClick={resetAll}
              >
                New Assessment
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                onClick={handlePrint}
              >
                Print Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
