"use client";

import dynamic from "next/dynamic";

const RiskAssessmentClient = dynamic(
  () => import("@/components/RiskAssessmentClient"),
  { ssr: false }
);

export default function Page() {
  return <RiskAssessmentClient />;
}