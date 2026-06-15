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
  authHeaders,
  fullMainBleedSx,
  elimuViewportSx,
  fmtTime,
  fmtDateTime,
  ATTENDANCE_STATUS,
} from "../HR/hrShared";

export const meetingAccent = "#0F766E";
export const meetingAccentDark = "#115E59";

export const TIMETABLE_DAY_TABS = [
  { label: "Lessons", value: 0 },
  { label: "Staff meetings", value: 1 },
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function buildYearOptions(centerYear) {
  const years = [];
  for (let y = centerYear - 15; y <= centerYear + 15; y += 1) {
    years.push(y);
  }
  return years;
}

export function formatTimeRange(start, end) {
  const fmt = (v) => {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} – ${b}`;
  return a || b || "—";
}

export const timetablePanelCardSx = {
  borderRadius: "22px",
  bgcolor: "#fff",
  border: "1px solid rgba(220,38,38,0.1)",
  boxShadow: "0 12px 40px -18px rgba(220,38,38,0.18)",
  overflow: "hidden",
};

export const timetableViewportSx = (theme) => {
  const mainTop = theme.spacing(9);
  const mainVerticalPadding = theme.spacing(6);
  const viewportBlock = `calc(100dvh - ${mainTop} - ${mainVerticalPadding})`;
  return {
    height: viewportBlock,
    maxHeight: viewportBlock,
    minHeight: 0,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };
};
