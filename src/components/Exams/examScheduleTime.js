import dayjs from "dayjs";

export const EXAM_SCHEDULE_TIMEZONE = "Africa/Nairobi";
export const LESSON_SCHEDULE_TIMEZONE = EXAM_SCHEDULE_TIMEZONE;

export function localScheduleDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Show stored UTC instant as wall-clock date/time in the exam timezone. */
export function wallClockFromInstant(iso, timeZone = EXAM_SCHEDULE_TIMEZONE) {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(dt).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  const time = dayjs().hour(hour).minute(minute).second(second).millisecond(0);
  return { date, time };
}

export function formatScheduleTimeForApi(value) {
  if (!value || !dayjs.isDayjs(value) || !value.isValid()) return "";
  return value.format("HH:mm:ss");
}

export function buildScheduleDateTime(date, timeDayjs) {
  const t = formatScheduleTimeForApi(timeDayjs);
  if (!date || !t) return "";
  return `${date}T${t}`;
}

/** Display a stored instant as local wall-clock in the school timezone (admin + portal lists). */
export function formatWallClockDateTime(iso, timeZone = EXAM_SCHEDULE_TIMEZONE) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString(undefined, { timeZone, dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d.toLocaleString();
  }
}

/** Keep TimePicker state time-only so date changes do not shift picked hours. */
export function normalizeTimePickerValue(value) {
  if (!value || !dayjs.isDayjs(value) || !value.isValid()) return null;
  return dayjs().hour(value.hour()).minute(value.minute()).second(0).millisecond(0);
}
