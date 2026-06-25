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

export const HR_TABS = [
  { label: "Admissions", value: 0 },
  { label: "Attendance", value: 1 },
  { label: "News & Events", value: 2 },
  { label: "Parents", value: 3 },
  { label: "Leave & Payroll", value: 4, disabled: true, badge: "Soon" },
];

export const HR_TAB_COPY = {
  0: {
    title: "Admissions",
    description: "Review and manage student admission applications and their status.",
  },
  1: {
    title: "Attendance",
    description: "Track teacher and student attendance from timetable lessons and online exams.",
  },
  2: {
    title: "News & Events",
    description: "Publish news and school events for parents, students, and staff.",
  },
  3: {
    title: "Parents",
    description: "Create parent profiles linked to students. The parent user account is kept when a profile is removed.",
  },
  4: {
    title: "Leave & Payroll",
    description: "Leave requests, payroll, and HR policies — coming soon.",
  },
};

export const PARENTS_TAB_INDEX = 3;

export const ADMISSION_STATUS = {
  pending: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
  interview_scheduled: { label: "Interview scheduled", color: "#D97706", bg: "#FEF3C7" },
  accepted: { label: "Accepted", color: "#16a34a", bg: "#DCFCE7" },
  rejected: { label: "Rejected", color: "#DC2626", bg: "#FEE2E2" },
  under_review: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
  documents_verified: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
  waitlisted: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
};

export const ATTENDANCE_STATUS = {
  attended: { label: "Attended", color: "#16a34a", bg: "#DCFCE7" },
  pending: { label: "Pending", color: "#6B7280", bg: "#F3F4F6" },
};

export const PUBLISH_STATUS = {
  published: { label: "Published", color: "#16a34a", bg: "#DCFCE7" },
  draft: { label: "Draft", color: "#6B7280", bg: "#F3F4F6" },
};

export const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
});

export const hrPanelCardSx = {
  borderRadius: "22px",
  bgcolor: "#fff",
  border: "1px solid rgba(220,38,38,0.1)",
  boxShadow: "0 12px 40px -18px rgba(220,38,38,0.18)",
  overflow: "hidden",
};

export const lessonsAttendanceContainSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
};

export const lessonsTableContainerSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

export const lessonsTableSx = {
  width: "100%",
  tableLayout: "fixed",
};

/** HR attendance tables — fixed layout with explicit column widths. */
export const hrAttendanceTableSx = {
  width: "100%",
  tableLayout: "fixed",
};

export const hrAttendanceTableContainerSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

export const hrAttendanceHeadCellSx = {
  overflow: "visible",
  textOverflow: "clip",
  verticalAlign: "middle",
  lineHeight: 1.2,
  px: { xs: 1, sm: 1.25 },
  py: 1.35,
  fontSize: "0.72rem",
  letterSpacing: "0.06em",
};

export const hrAttendanceHeadCellWrapSx = {
  ...hrAttendanceHeadCellSx,
  whiteSpace: "normal",
  wordBreak: "break-word",
  hyphens: "auto",
  lineHeight: 1.15,
  py: 1.15,
};

export const hrAttendanceHeadCellCompactSx = {
  ...hrAttendanceHeadCellSx,
  whiteSpace: "nowrap",
  px: 0.75,
};

export const hrAttendanceBodyCellSx = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  verticalAlign: "middle",
  lineHeight: 1.45,
  fontSize: "0.875rem",
  px: { xs: 1, sm: 1.25 },
  py: 1.25,
};

export function hrAttendanceTableMinWidth(columns) {
  return columns.reduce((sum, col) => sum + (col.widthPx || 100), 0);
}

export function hrAttendanceCellSx(col, extra = {}) {
  const align = col.align || "left";
  return {
    ...hrAttendanceBodyCellSx,
    width: col.widthPx,
    minWidth: col.widthPx,
    maxWidth: col.widthPx,
    textAlign: align,
    ...(col.nowrap ? { whiteSpace: "nowrap" } : {}),
    ...(col.id === "attendance"
      ? { px: 0.75, overflow: "visible", textOverflow: "clip" }
      : {}),
    ...(col.id === "no" ? { px: 0.75, whiteSpace: "nowrap" } : {}),
    ...extra,
  };
}

export function hrAttendanceHeadCellSxFor(col) {
  if (col.id === "no" || col.id === "minutes") return hrAttendanceHeadCellCompactSx;
  if (col.headWrap) return hrAttendanceHeadCellWrapSx;
  return { ...hrAttendanceHeadCellSx, whiteSpace: "nowrap" };
}

/** Header row for attendance tables — no uppercase (avoids clipped labels). */
export function hrAttendanceHeadRowSx(baseHeadRowSx) {
  return {
    ...baseHeadRowSx,
    "& .MuiTableCell-head": {
      ...(baseHeadRowSx?.["& .MuiTableCell-head"] || {}),
      textTransform: "none",
      letterSpacing: "0.02em",
      fontSize: "0.75rem",
    },
  };
}

import Swal from "sweetalert2";

export const swalAboveDialog = {
  didOpen: () => {
    const container = Swal.getContainer();
    if (container) container.style.zIndex = "2000";
  },
};

export function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function fmtTime(v) {
  const s = String(v || "").trim();
  return s.length >= 5 ? s.slice(0, 5) : s || "—";
}

export function formatLessonSlot(lessonDate, startsAt, endsAt) {
  const d = lessonDate ? String(lessonDate).slice(0, 10) : "";
  const start = fmtTime(startsAt);
  const end = fmtTime(endsAt);
  if (d && start !== "—" && end !== "—") return `${d} · ${start}–${end}`;
  if (d && start !== "—") return `${d} · ${start}`;
  if (start !== "—" && end !== "—") return `${start}–${end}`;
  return "—";
}

export function fmtDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function escapeCsv(value) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}
