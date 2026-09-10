import type { FieldDef, FieldValue, Issue } from "@/lib/types";

const PROJECT_ID = "prj_eng";

const opt = (id: string, label: string, color: string) => ({ id, label, color });

/** Dynamic fields mirroring the reference board (Squad, Environment, …). */
export const fieldDefs: FieldDef[] = [
  {
    id: "fd_squad", projectId: PROJECT_ID, name: "Squad", type: "select", position: 0, showInList: true,
    options: [
      opt("sq_1", "Squad 1", "#6a2f9e"),
      opt("sq_2", "Squad 2", "#2749c4"),
      opt("sq_3", "Squad 3", "#0d774c"),
    ],
  },
  {
    id: "fd_env", projectId: PROJECT_ID, name: "Environment", type: "select", position: 1, showInList: true,
    options: [
      opt("en_canvas", "Canvas", "#1f57a6"),
      opt("en_snack", "Snack", "#6a2f9e"),
      opt("en_preview", "Preview", "#0d774c"),
      opt("en_all", "All", "#c6551a"),
    ],
  },
  {
    id: "fd_feature", projectId: PROJECT_ID, name: "Product Feature", type: "select", position: 2, showInList: true,
    options: [
      opt("ft_core", "Core Product", "#2749c4"),
      opt("ft_dash", "Dashboards", "#1f57a6"),
      opt("ft_filters", "Filters", "#6a2f9e"),
      opt("ft_integrations", "Integrations", "#0f6b5f"),
      opt("ft_login", "Login", "#a37c13"),
      opt("ft_admin", "Administration", "#5b6270"),
      opt("ft_perf", "Performance", "#0d774c"),
      opt("ft_pay", "Payments", "#c02219"),
    ],
  },
  {
    id: "fd_severity", projectId: PROJECT_ID, name: "Severity", type: "select", position: 3, showInList: true,
    options: [
      opt("sv_1", "S1", "#c02219"),
      opt("sv_2", "S2", "#c6551a"),
      opt("sv_3", "S3", "#a37c13"),
    ],
  },
  {
    id: "fd_sprint", projectId: PROJECT_ID, name: "Sprint", type: "select", position: 4, showInList: false,
    options: [
      opt("sp_1", "S1", "#c02219"),
      opt("sp_2", "S2", "#c6551a"),
      opt("sp_3", "S3", "#0d774c"),
    ],
  },
  { id: "fd_points", projectId: PROJECT_ID, name: "Points", type: "number", position: 5, showInList: false, options: [] },
  {
    id: "fd_report_type", projectId: PROJECT_ID, name: "Report Type", type: "select", position: 6, showInList: false,
    options: [
      opt("rt_defect", "Defect", "#c02219"),
      opt("rt_feature", "Feature", "#0d774c"),
      opt("rt_outage", "Outage", "#c6551a"),
    ],
  },
  {
    id: "fd_report_source", projectId: PROJECT_ID, name: "Report Source", type: "select", position: 7, showInList: false,
    options: [
      opt("rs_internal", "Internal", "#0d774c"),
      opt("rs_customer", "Customer", "#1f57a6"),
    ],
  },
  { id: "fd_confirmed", projectId: PROJECT_ID, name: "Confirmed?", type: "checkbox", position: 8, showInList: false, options: [] },
];

/** Deterministic, realistic field values derived from an issue. */
export function assignIssueFields(issue: Issue): Record<string, FieldValue> {
  const n = issue.number;
  const squad = ["sq_1", "sq_2", "sq_3"][n % 3];
  const env = ["en_canvas", "en_snack", "en_preview", "en_all"][n % 4];
  const sprint = ["sp_1", "sp_2", "sp_3"][n % 3];
  const points = (n % 5) + 1;
  const source = n % 2 === 0 ? "rs_internal" : "rs_customer";

  const severity = issue.priority === "urgent" ? "sv_1" : issue.priority === "high" ? "sv_2" : "sv_3";

  const featurePool = ["ft_core", "ft_dash", "ft_filters", "ft_integrations", "ft_login", "ft_admin", "ft_perf", "ft_pay"];
  let feature = featurePool[n % featurePool.length];
  if (issue.labelIds.includes("lb_auth")) feature = "ft_login";
  else if (issue.labelIds.includes("lb_perf")) feature = "ft_perf";

  const reportType = issue.labelIds.includes("lb_feature") ? "rt_feature" : issue.labelIds.includes("lb_bug") ? "rt_defect" : "rt_outage";

  return {
    fd_squad: squad,
    fd_env: env,
    fd_feature: feature,
    fd_severity: severity,
    fd_sprint: sprint,
    fd_points: points,
    fd_report_type: reportType,
    fd_report_source: source,
    fd_confirmed: n % 2 === 0,
  };
}
