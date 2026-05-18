import weights from "@/config/weights.json";
import riskconfig from "@/config/riskconfig.json";
import threatLibrary from "@/config/threatLibrary.json";

export type Rating = "Low" | "Medium" | "High";
export type ControlRating = "Needs Attention" | "Fair" | "Satisfactory" | "Strong";
export type ControlSensitivity = "High" | "Medium" | "Low";

export type ExplanationProfile =
  | "Access"
  | "Data"
  | "Availability"
  | "SupplyChain"
  | "Discovery"
  | "Execution"
  | "LateralMovement"
  | "Logging"
  | "Other";

export type WhyInfo = {
  summary: string;
  helpingFactors: string[];
  remainingDrivers: string[];
};

export type ThreatRow = {
  Threat: string;
  Probability: Rating;
  Impact: Rating;

  InherentRiskCalc: number; // 1..9
  InherentRisk: Rating;     // Low/Medium/High on 1..9 thresholds

  ControlRating: ControlRating;

  ResidualRiskCalc: number; // 0..9 decimal
  ResidualRisk: Rating;

  Mitigation: string;
  MitreTactics?: string[];

  _why?: WhyInfo;
};

export type ToolRiskScore = {
  ToolName?: string;

  OverallInherentRisk: Rating;
  OverallInherentRiskCalc: number;

  OverallResidualRisk: Rating;
  OverallResidualRiskCalc: number;

  Rows: ThreatRow[];
};

const W: any = weights;
const RC: any = riskconfig;
const TL: any[] = threatLibrary as any[];

function getNum(path: string, def = 0): number {
  const parts = path.split(".");
  let cur: any = W;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return def;
    cur = cur[p];
  }
  return typeof cur === "number" ? cur : def;
}

function getAny(path: string, def: any = null): any {
  const parts = path.split(".");
  let cur: any = W;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return def;
    cur = cur[p];
  }
  return cur ?? def;
}

function clampNum(v: number, min = 1, max = 3) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function toRating13(v: number): Rating {
  if (v <= 1.49) return "Low";
  if (v <= 2.49) return "Medium";
  return "High";
}

function ratingToCalc(r: Rating): 1 | 2 | 3 {
  if (r === "Low") return 1;
  if (r === "Medium") return 2;
  return 3;
}

function scoreToOverallRating(v: number): Rating {
  const lowMax = Number(RC?.Rules?.Thresholds?.OverallRisk?.LowMaxExclusive ?? 3.1);
  const medMax = Number(RC?.Rules?.Thresholds?.OverallRisk?.MediumMaxExclusive ?? 6.1);
  if (v < lowMax) return "Low";
  if (v < medMax) return "Medium";
  return "High";
}

function maxRating(a: Rating, b: Rating): Rating {
  const order: Record<Rating, number> = { Low: 1, Medium: 2, High: 3 };
  return order[a] >= order[b] ? a : b;
}

function controlUp(r: ControlRating): ControlRating {
  switch (r) {
    case "Needs Attention": return "Fair";
    case "Fair": return "Satisfactory";
    case "Satisfactory": return "Strong";
    default: return "Strong";
  }
}

function controlDown(r: ControlRating): ControlRating {
  switch (r) {
    case "Strong": return "Satisfactory";
    case "Satisfactory": return "Fair";
    case "Fair": return "Needs Attention";
    default: return "Needs Attention";
  }
}

function controlFactorBase(c: ControlRating): number {
  switch (c) {
    case "Needs Attention": return 0.2;
    case "Fair": return 0.5;
    case "Satisfactory": return 0.7;
    case "Strong": return 0.9;
  }
}

function sensitivityMultiplier(s: ControlSensitivity): number {
  switch (s) {
    case "High": return 1.0;
    case "Medium": return 0.6;
    case "Low": return 0.3;
  }
}

function matchesIncludeWhen(ctx: any, rules?: any[]): boolean {
  if (!rules || rules.length === 0) return true;

  return rules.every((r) => {
    const v = ctx?.[r.field];

    switch (r.op) {
      case "Equals":
        return v === r.value;
      case "NotEquals":
        return v !== r.value;
      case "In":
        return Array.isArray(r.value) && r.value.includes(v);
      case "NotIn":
        return Array.isArray(r.value) && !r.value.includes(v);
      default:
        return true;
    }
  });
}

function asRating(x: any, fallback: Rating): Rating {
  return x === "Low" || x === "Medium" || x === "High" ? x : fallback;
}

function asSensitivity(x: any, fallback: ControlSensitivity): ControlSensitivity {
  return x === "High" || x === "Medium" || x === "Low" ? x : fallback;
}

function asExplanationProfile(x: any, fallback: ExplanationProfile): ExplanationProfile {
  return x === "Access" ||
    x === "Data" ||
    x === "Availability" ||
    x === "SupplyChain" ||
    x === "Discovery" ||
    x === "Execution" ||
    x === "LateralMovement" ||
    x === "Logging" ||
    x === "Other"
    ? x
    : fallback;
}

function deriveProfile(t: any): ExplanationProfile {
  const explicit = asExplanationProfile(t.explanationProfile, "Other");
  if (t.explanationProfile) return explicit;

  const id = String(t.id ?? "").toLowerCase();
  const name = String(t.Threat ?? "").toLowerCase();
  const tactics = Array.isArray(t.MitreTactics) ? t.MitreTactics.map((x: any) => String(x)) : [];

  const hasTactic = (needle: string) => tactics.some((x: string) => x.toLowerCase().includes(needle));

  if (id.includes("unauthorized") || id.includes("credential") || name.includes("unauthorized access") || hasTactic("credential") || hasTactic("initial access")) {
    return "Access";
  }
  if (id.includes("exfil") || id.includes("collection") || id.includes("data") || name.includes("exfil") || name.includes("sensitive data")) {
    return "Data";
  }
  if (id.includes("availability") || id.includes("outage") || id.includes("disruption") || name.includes("availability") || name.includes("disruption")) {
    return "Availability";
  }
  if (id.includes("supply") || name.includes("supply chain") || name.includes("vendor")) {
    return "SupplyChain";
  }
  if (id.includes("discovery") || name.includes("discovery") || hasTactic("discovery")) {
    return "Discovery";
  }
  if (id.includes("execution") || name.includes("execution") || name.includes("malware") || hasTactic("execution")) {
    return "Execution";
  }
  if (id.includes("lateral") || name.includes("lateral") || hasTactic("lateral")) {
    return "LateralMovement";
  }
  if (id.includes("logging") || name.includes("logging") || name.includes("non-repudiation")) {
    return "Logging";
  }

  return "Other";
}

function buildWhy(
  profile: ExplanationProfile,
  ctx: any,
  control: ControlRating,
  sens: ControlSensitivity,
  toolCategory: string
): WhyInfo {
  const helping: string[] = [];
  const drivers: string[] = [];

  // Drivers
  if (ctx.DataSensitivity === "GLBA") drivers.push("Sensitive GLBA-regulated data");
  if (ctx.InternetFacing === "Yes") drivers.push("Internet-facing exposure");
  if (ctx.Integrations === "Extensive") drivers.push("Extensive third-party integrations");
  if (ctx.UpdateCadence === "Unknown") drivers.push("Unknown patch/update cadence");

  // Helping controls
  if (ctx.AuthMethod === "SSO") helping.push("Single sign-on authentication");
  if (ctx.MfaUsed === "Yes") helping.push("Multi-factor authentication");
  if (ctx.RbacImplemented === "Yes") helping.push("Role-based access control");
  if (ctx.AdminAccountsSeparated === "Yes") helping.push("Separated administrative accounts");
  if (ctx.EncryptionInTransit === "Yes") helping.push("Encryption in transit");
  if (ctx.EncryptionAtRest === "Yes") helping.push("Encryption at rest");
  if (ctx.BackupsEnabled === "Yes") helping.push("Backups and recovery controls");
  if (ctx.AuditLoggingEnabled === "Yes") helping.push("Audit logging enabled");
  if (ctx.MonitoringAlerting === "Yes") helping.push("Monitoring and alerting");
  if (ctx.CentralLogForwarding === "Yes") helping.push("Central log forwarding");
  if (ctx.VulnerabilityScanning === "Yes") helping.push("Vulnerability scanning");

  let summary = "Controls reduce risk, but some exposure remains.";

  switch (profile) {
    case "Access":
      summary =
        control === "Strong" || control === "Satisfactory"
          ? "Identity and access controls directly reduce the likelihood of unauthorized access."
          : "Weak access controls increase the likelihood of unauthorized access.";
      if (ctx.PrivilegeLevel === "Admin" || ctx.PrivilegeLevel === "Service Account") {
        drivers.push("Privileged access increases potential impact");
      }
      break;

    case "Data":
      summary =
        "Controls can reduce likelihood, but sensitive data exposure remains the primary driver of risk.";
      if (ctx.DataSensitivity !== "GLBA") {
        drivers.push("Business data exposure risk");
      }
      break;

    case "SupplyChain":
      summary =
        "Internal controls have limited ability to prevent or detect vendor or supply chain compromise.";
      drivers.push("Reliance on vendor security and update processes");
      break;

    case "Discovery":
      summary =
        "Discovery risks are driven by environment exposure and visibility, not authentication alone.";
      if (sens === "Low") drivers.push("Controls have limited effectiveness for this threat type");
      break;

    case "Execution":
      summary =
        "Execution risks depend on endpoint/application controls and patching discipline.";
      if (ctx.UpdateCadence === "Manual" || ctx.UpdateCadence === "Unknown") {
        drivers.push("Manual/unknown updates increase exploitation window");
      }
      break;

    case "LateralMovement":
      summary =
        "Lateral movement risk depends on segmentation, credential hygiene, and monitoring.";
      drivers.push("Internal movement potential increases blast radius");
      break;

    case "Logging":
      summary =
        "Logging gaps reduce detection and investigation capability, increasing residual risk.";
      if (ctx.Logging === "None") drivers.push("Insufficient logging and audit visibility");
      break;

    case "Availability":
      summary =
        "Availability risk depends on redundancy, monitoring, and recovery capability.";
      if (ctx.BackupsEnabled !== "Yes") drivers.push("Limited recovery capability");
      break;

    default:
      summary = "Controls reduce risk, but some exposure remains.";
  }

  if (sens === "Low") {
    drivers.push("Controls have limited effectiveness for this threat type");
  }

  const helpingFactors = [...new Set(helping)].slice(0, 6);
  const remainingDrivers = [...new Set(drivers)].slice(0, 6);

  return { summary, helpingFactors, remainingDrivers };
}

export function scoreToolRiskAligned(ctx: any): ToolRiskScore {

  let p = getNum("Probability.Base", 2.0);

  if (ctx.InternetFacing === "Yes") {
    p += getNum("Probability.InternetFacingYes", 0.8);
  }

  p += getNum(`Probability.Integrations.${ctx.Integrations}`, 0.0);
  p += getNum(`Probability.AuthMethod.${ctx.AuthMethod}`, 0.0);
  p += getNum(`Probability.UpdateCadence.${ctx.UpdateCadence}`, 0.0);
  p += getNum(`Probability.ToolCategory.${ctx.ToolCategory}`, 0.0);
  p += getNum(`Probability.PrivilegeLevel.${ctx.PrivilegeLevel}`, 0.0);

  let probDelta = 0.0;
  const probStep3Keys = [
    "VulnerabilityScanning",
    "ChangeControlRequired",
    "MonitoringAlerting",
    "CentralLogForwarding",
    "AuditLoggingEnabled",
    "EncryptionInTransit",
    "RbacImplemented",
    "LeastPrivilegeEnforced",
    "SiemInPlace",
    "Soc24x7Monitoring"
  ];

  for (const k of probStep3Keys) {
    if (ctx?.[k] === "Yes") {
      probDelta += getNum(`Probability.Step3.${k}`, 0.0);
    }
  }

  if (ctx.InternetFacing === "Yes" && ctx.EncryptionInTransit !== "Yes") {
    probDelta += getNum("Probability.Step3.InternetFacing_NoEncTransitPenalty", 0.2);
  }

  const capMin = getNum("Probability.Step3.CapMin", -0.35);
  if (probDelta < capMin) probDelta = capMin;

  p = clampNum(p + probDelta, 1, 3);
  const contextProbRating = toRating13(p);

  let i = 2.0;
  switch (ctx.DataSensitivity) {
    case "None": i = 1.0; break;
    case "Internal": i = 2.0; break;
    default: i = 3.0; break; // GLBA
  }

  if (ctx.BusinessCriticality === "Medium") i += 0.2;
  if (ctx.BusinessCriticality === "High") i += 0.5;
  if (ctx.PrivilegeLevel === "Admin" || ctx.PrivilegeLevel === "Service Account") i += 0.3;

  i = clampNum(i, 1, 3);
  const contextImpactRating = toRating13(i);

  let control = String(getAny("Control.Baseline.Default", "Fair")) as ControlRating;

  const authBase = getAny(`Control.Baseline.AuthMethod.${ctx.AuthMethod}`, null);
  if (authBase != null) control = String(authBase) as ControlRating;

  const logAdj = getAny(`Control.Logging.${ctx.Logging}`, null);
  if (logAdj === "UP") control = controlUp(control);
  else if (logAdj === "DOWN") control = controlDown(control);
  else if (logAdj != null) control = String(logAdj) as ControlRating;

  const updAdj = getAny(`Control.UpdateCadence.${ctx.UpdateCadence}`, null);
  if (updAdj === "UP") control = controlUp(control);
  else if (updAdj === "DOWN") control = controlDown(control);

  const mfaEnabled = Boolean(getAny("Control.MfaBoost.Enabled", true));
  const mfaAuthList = (getAny("Control.MfaBoost.WhenAuthIs", ["SSO","AD","Local"]) as any[]) ?? ["SSO","AD","Local"];
  if (mfaEnabled && ctx.MfaUsed === "Yes" && mfaAuthList.includes(ctx.AuthMethod)) {
    const boost = String(getAny("Control.MfaBoost.Boost", "UP"));
    if (boost === "UP") control = controlUp(control);
    else if (boost === "DOWN") control = controlDown(control);
  }

  const boostEnabled = Boolean(getAny("Control.Step3Boost.Enabled", true));
  if (boostEnabled) {
    const keys = (getAny("Control.Step3Boost.Keys", []) as any[]) ?? [];
    let count = 0;
    for (const k of keys) {
      if (ctx?.[k] === "Yes") count++;
    }
    if (count >= 5) control = "Strong";
    else if (control === "Strong") control = "Satisfactory";

    const noStep3Cap = Boolean(getAny("Control.SanityCaps.NoStep3Controls_DefaultToNeedsAttention", false));
    if (noStep3Cap && count === 0) control = "Needs Attention";
  }

  const capStrong = Boolean(getAny("Control.SanityCaps.InternetFacing_NoEncTransit_CapStrongToSatisfactory", true));
  if (capStrong && ctx.InternetFacing === "Yes" && ctx.EncryptionInTransit !== "Yes") {
    if (control === "Strong") control = "Satisfactory";
  }

  const toolCategory = String(ctx.ToolCategory ?? "Other");

  const applicableThreats = TL
    .filter((t) => Array.isArray(t.Applies) && t.Applies.includes(toolCategory))
    .filter((t) => matchesIncludeWhen(ctx, t.includeWhen));

  const safeThreats = applicableThreats.length > 0
    ? applicableThreats
    : [{
        id: "unauthorized-access",
        Threat: "Unauthorized access",
        Mitigation: "Enforce strong authentication and least privilege; enable logging.",
        defaultProbability: "Medium",
        defaultImpact: "High",
        controlSensitivity: "High",
        MitreTactics: ["Initial Access"],
        explanationProfile: "Access"
      }];

  const rows: ThreatRow[] = safeThreats.map((t: any) => {
    const defP = asRating(t.defaultProbability, contextProbRating);
    const defI = asRating(t.defaultImpact, contextImpactRating);

    const rowProb = maxRating(contextProbRating, defP);
    const rowImp = maxRating(contextImpactRating, defI);

    const inherent = ratingToCalc(rowProb) * ratingToCalc(rowImp);

    const sens = asSensitivity(t.controlSensitivity, "Medium");
    const effFactor = controlFactorBase(control) * sensitivityMultiplier(sens);

    const residual = Number((inherent - inherent * effFactor).toFixed(1));

    const profile = deriveProfile(t);
    const why = buildWhy(profile, ctx, control, sens, toolCategory);

    return {
      Threat: String(t.Threat),
      Probability: rowProb,
      Impact: rowImp,
      InherentRiskCalc: inherent,
      InherentRisk: scoreToOverallRating(inherent),
      ControlRating: control,
      ResidualRiskCalc: residual,
      ResidualRisk: scoreToOverallRating(residual),
      Mitigation: String(t.Mitigation),
      MitreTactics: Array.isArray(t.MitreTactics) ? t.MitreTactics : undefined,
      _why: why
    };
  });

  const avgInherent = rows.reduce((s, r) => s + r.InherentRiskCalc, 0) / rows.length;
  const avgResidual = rows.reduce((s, r) => s + r.ResidualRiskCalc, 0) / rows.length;

  return {
    OverallInherentRiskCalc: Number(avgInherent.toFixed(1)),
    OverallInherentRisk: scoreToOverallRating(avgInherent),
    OverallResidualRiskCalc: Number(avgResidual.toFixed(1)),
    OverallResidualRisk: scoreToOverallRating(avgResidual),
    Rows: rows
  };
}
