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
} from "../SchoolProfile/elimuPlusShared";

export const ACCOUNTING_TABS = [
  { label: "Fee structures", value: 0 },
  { label: "Invoices", value: 1 },
  { label: "Fee payments", value: 2 },
];

export function formatKes(n) {
  return `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatMoney(n) {
  const v = Number.parseFloat(n);
  if (!Number.isFinite(v)) return "0.00";
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function halfPhaseLabel(phase) {
  if (phase === "first_half") return "First half";
  if (phase === "second_half") return "Second half";
  return phase || "—";
}

export function halfAmountFromTerm(term) {
  const t = Number.parseFloat(term);
  return Number.isFinite(t) ? Number.parseFloat((t / 2).toFixed(2)) : 0;
}

export function sumFeeItems(items) {
  return (items || []).reduce(
    (acc, it) => acc + (Number.isFinite(Number.parseFloat(it.amount)) ? Number.parseFloat(it.amount) : 0),
    0
  );
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
