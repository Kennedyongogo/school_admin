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
  elimuViewportSx,
  tableContainerSx,
  tableHeadRowSx,
  tablePaginationSx,
  actionIconSx,
  fetchAllPages,
} from "../SchoolProfile/elimuPlusShared";

export const CURRICULUM_TABS = [
  { label: "Curricula", value: 0 },
  { label: "Classes", value: 1 },
  { label: "Terms", value: 2 },
  { label: "Subjects", value: 3 },
  { label: "Grading system", value: 4 },
];

export async function fetchAllCurricula(token) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula?${params}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Could not load curricula (${res.status})`);
    }
    const chunk = Array.isArray(data.data) ? data.data : [];
    out.push(...chunk);
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

export function truncateText(text, max = 120) {
  if (!text || typeof text !== "string") return "—";
  const t = text.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}
