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
} from "../Users/usersShared";

export const ELIMU_TABS = [
  { label: "School profile", value: 0 },
  { label: "Departments", value: 1 },
  { label: "Teachers", value: 2 },
  { label: "Students", value: 3 },
  { label: "School admins", value: 4 },
  { label: "Services", value: 5 },
  { label: "Reviews", value: 6 },
];

export const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

export const authMultipartHeaders = (token) => ({
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

export function resolveAssetUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

export function normalizeExternalUrl(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export async function fetchAllPages(path, token) {
  const out = [];
  let pageNum = 1;
  let totalPages = 1;
  do {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${path}${sep}page=${pageNum}&limit=100`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !Array.isArray(data.data)) break;
    out.push(...data.data);
    totalPages = data.pagination?.totalPages ?? 1;
    pageNum += 1;
    if (pageNum > 50) break;
  } while (pageNum <= totalPages);
  return out;
}

/** Full-height Elimu Plus shell inside the admin layout (below app bar). */
export const elimuViewportSx = {
  minHeight: "calc(100dvh - 64px)",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

export const tableContainerSx = {
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(220,38,38,0.08)",
  bgcolor: "#fff",
  boxShadow: "0 16px 48px -16px rgba(28,25,23,0.1)",
};

export const tableHeadRowSx = {
  background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
  "& .MuiTableCell-head": {
    color: "#fff",
    fontWeight: 700,
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontSize: "0.8rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    borderBottom: "none",
    py: 1.5,
  },
};

export const tablePaginationSx = {
  borderTop: "1px solid rgba(220,38,38,0.08)",
  fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
};

export const actionIconSx = {
  color: "#B91C1C",
  borderRadius: "10px",
  "&:hover": { bgcolor: "#FEE2E2", color: "#DC2626" },
};
