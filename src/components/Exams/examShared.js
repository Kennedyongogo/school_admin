export {
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textPrimary,
  textSecondary,
  textMuted,
  fontBody,
  fontDisplay,
  inputSx,
  primaryBtnSx,
  ghostBtnSx,
  pageShellSx,
  authJsonHeaders,
  authHeaders,
  elimuViewportSx,
  tableContainerSx,
  tableHeadRowSx,
  tablePaginationSx,
  actionIconSx,
} from "../SchoolProfile/elimuPlusShared";

export const EXAM_TABS = [
  { label: "Exam templates", value: 0 },
  { label: "Exam", value: 1 },
  { label: "Proctor monitor", value: 2 },
  { label: "Report cards", value: 3 },
];

export const PROCTORING_MODE_LABELS = {
  record_only: "Monitored online",
  strict_auto: "Strict online",
  live_monitor: "Live invigilation",
};

export const EXAM_STATUS = {
  draft: { label: "Draft", color: "#6B7280", bg: "#F3F4F6" },
  published: { label: "Published", color: "#16a34a", bg: "#DCFCE7" },
  archived: { label: "Archived", color: "#D97706", bg: "#FEF3C7" },
};

export const SESSION_STATUS = {
  scheduled: { label: "Scheduled", color: "#2563EB", bg: "#DBEAFE" },
  live: { label: "Live", color: "#DC2626", bg: "#FEE2E2" },
  completed: { label: "Completed", color: "#16a34a", bg: "#DCFCE7" },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function formatDurationMinutes(mins) {
  const n = Number(mins);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${n} min`;
}

export const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
});

export const examPanelCardSx = {
  borderRadius: "22px",
  bgcolor: "#fff",
  border: "1px solid rgba(220,38,38,0.1)",
  boxShadow: "0 12px 40px -18px rgba(220,38,38,0.18)",
  overflow: "hidden",
};

export const examDesignerCanvasSx = {
  width: 595,
  height: 842,
  position: "relative",
  mx: "auto",
  bgcolor: "#fff",
  border: "1px solid rgba(220,38,38,0.15)",
  borderRadius: "12px",
  boxShadow: "0 16px 48px -12px rgba(28,25,23,0.18)",
  userSelect: "none",
  overflow: "hidden",
  backgroundImage:
    "linear-gradient(to right, rgba(220,38,38,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(220,38,38,0.06) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};
