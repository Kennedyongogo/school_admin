import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import DescriptionIcon from "@mui/icons-material/Description";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import PieChartIcon from "@mui/icons-material/PieChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import ClassIcon from "@mui/icons-material/Class";
import {
  authJsonHeaders,
  formatKes,
  fontBody,
  fontDisplay,
  inputSx,
  primaryDark,
  primaryRed,
  textPrimary,
  textSecondary,
  warmCream,
} from "../Accounting/accountingShared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

const accentBlue = "#2563EB";

const ALL_INVOICE_STATUSES = ["draft", "sent", "partial", "paid", "cancelled"];

const STATUS_LABELS = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially paid",
  paid: "Paid",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  draft: "#78716C",
  sent: "#2563EB",
  partial: "#D97706",
  paid: "#16A34A",
  cancelled: "#DC2626",
};

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,0.12)",
  boxShadow: "0 8px 24px rgba(28,25,23,0.1)",
  fontFamily: fontBody,
  fontSize: 13,
};

function formatKesShort(value) {
  const v = Number(value) || 0;
  if (v >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `KES ${(v / 1_000).toFixed(1)}K`;
  return formatKes(v);
}

function StatCard({ icon, label, value, displayValue, loading, gradient, delay = 0 }) {
  const shown = loading ? "—" : displayValue ?? Number(value || 0).toLocaleString();

  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
      sx={{
        height: "100%",
        borderRadius: "20px",
        p: "1px",
        background: gradient,
        boxShadow: "0 12px 40px -12px rgba(28,25,23,0.12)",
      }}
    >
      <Box
        sx={{
          height: "100%",
          borderRadius: "19px",
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          p: 2.25,
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          transition: "transform 0.22s ease, box-shadow 0.22s ease",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 16px 32px -12px rgba(28,25,23,0.14)",
          },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: gradient,
            color: "#fff",
            boxShadow: "0 8px 20px -6px rgba(220,38,38,0.35)",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", fontWeight: 600, color: textSecondary }}>
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: fontDisplay,
              fontSize: { xs: "1.35rem", sm: "1.75rem" },
              fontWeight: 700,
              color: textPrimary,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              mt: 0.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {shown}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ChartCard({ icon, title, subtitle, children, delay = 0, accentColor = primaryRed, total, totalLabel, action }) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
      sx={{
        borderRadius: "22px",
        bgcolor: "#fff",
        border: "1px solid rgba(220,38,38,0.08)",
        boxShadow: "0 16px 48px -16px rgba(28,25,23,0.1)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          borderBottom: "1px solid rgba(220,38,38,0.06)",
          background: `linear-gradient(135deg, ${warmCream} 0%, #fff 100%)`,
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.25}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "flex-start" }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: `${accentColor}14`,
                color: accentColor,
                boxShadow: `inset 0 0 0 1px ${accentColor}22`,
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.15rem", color: textPrimary, letterSpacing: "-0.02em" }}>
                {title}
              </Typography>
              <Typography sx={{ fontFamily: fontBody, fontSize: "0.82rem", color: textSecondary, mt: 0.2 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} flexShrink={0}>
            {action || null}
            {total != null ? (
            <Chip
              label={totalLabel ? `${totalLabel}: ${total}` : `${total} total`}
              size="small"
              sx={{
                fontFamily: fontBody,
                fontWeight: 700,
                fontSize: "0.72rem",
                bgcolor: `${accentColor}12`,
                color: accentColor,
                border: `1px solid ${accentColor}28`,
                height: 26,
                alignSelf: { xs: "flex-start", sm: "center" },
              }}
            />
          ) : null}
          </Stack>
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
    </Box>
  );
}

function EmptyChart({ message, hint }) {
  return (
    <Box
      sx={{
        py: 6,
        px: 2,
        textAlign: "center",
        borderRadius: "16px",
        bgcolor: warmCream,
        border: "1px dashed rgba(220,38,38,0.2)",
      }}
    >
      <Typography sx={{ fontFamily: fontBody, color: textSecondary, fontWeight: 600 }}>{message}</Typography>
      {hint ? (
        <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", color: textSecondary, mt: 0.75, opacity: 0.85 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function MoneyBarChart({ data, barColor, barColorEnd, valueLabel, xAxisLabel, yAxisLabel }) {
  const height = 320;
  const gradientId = `acct-bar-${valueLabel.replace(/\s/g, "")}`;
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const yMax = maxValue === 0 ? 1000 : Math.ceil(maxValue * 1.15);

  return (
    <Box sx={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 20, left: yAxisLabel ? 8 : 4, bottom: 8 }} barCategoryGap="24%">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.95} />
              <stop offset="100%" stopColor={barColorEnd || barColor} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            angle={-32}
            textAnchor="end"
            height={88}
            interval={0}
            tick={{ fill: textPrimary, fontSize: 11, fontWeight: 600, fontFamily: fontBody }}
            axisLine={{ stroke: "rgba(28,25,23,0.12)" }}
            tickLine={{ stroke: "rgba(28,25,23,0.12)" }}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -4,
                    style: { fill: textSecondary, fontFamily: fontBody, fontSize: 12, fontWeight: 600 },
                  }
                : undefined
            }
          />
          <YAxis
            allowDecimals={false}
            domain={[0, yMax]}
            tickFormatter={(v) => formatKesShort(v)}
            tick={{ fill: textSecondary, fontSize: 10, fontFamily: fontBody }}
            axisLine={{ stroke: "rgba(28,25,23,0.12)" }}
            tickLine={{ stroke: "rgba(28,25,23,0.12)" }}
            width={64}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 4,
                    style: { fill: textSecondary, fontFamily: fontBody, fontSize: 12, fontWeight: 600, textAnchor: "middle" },
                  }
                : undefined
            }
          />
          <Tooltip
            formatter={(v) => [formatKes(v), valueLabel]}
            labelFormatter={(label) => label}
            contentStyle={chartTooltipStyle}
            cursor={{ fill: "rgba(220,38,38,0.04)" }}
          />
          <Bar dataKey="value" name={valueLabel} fill={`url(#${gradientId})`} radius={[8, 8, 0, 0]} maxBarSize={56}>
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => formatKesShort(v)}
              style={{ fill: textSecondary, fontFamily: fontBody, fontSize: 11, fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <Box sx={{ pt: 0.5, pb: 0.25 }}>
      <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.25rem", color: textPrimary, letterSpacing: "-0.02em" }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ fontFamily: fontBody, fontSize: "0.85rem", color: textSecondary, mt: 0.35 }}>{subtitle}</Typography>
      ) : null}
    </Box>
  );
}

function FilterSelect({ label, value, onChange, options, selectId, minWidth = 160 }) {
  const labelId = `${selectId}-label`;
  return (
    <FormControl
      size="small"
      sx={{
        ...inputSx,
        minWidth: { xs: "100%", sm: minWidth },
        bgcolor: "#fff",
        borderRadius: "12px",
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
          fontFamily: fontBody,
          fontWeight: 600,
          fontSize: "0.85rem",
        },
      }}
    >
      <InputLabel id={labelId} sx={{ fontFamily: fontBody, fontSize: "0.85rem" }}>
        {label}
      </InputLabel>
      <Select
        labelId={labelId}
        id={selectId}
        value={value}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        sx={{ fontFamily: fontBody }}
      >
        {options.map((option) => (
          <MenuItem key={String(option.value)} value={option.value} sx={{ fontFamily: fontBody, fontSize: "0.88rem" }}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function StatusColorLegend({ rows }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
        gap: 1.25,
        mt: 2,
      }}
    >
      {rows.map((row) => (
        <Stack
          key={row.status}
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            px: 1.25,
            py: 1,
            borderRadius: "12px",
            bgcolor: warmCream,
            border: "1px solid rgba(220,38,38,0.08)",
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "4px",
              bgcolor: row.color,
              flexShrink: 0,
              boxShadow: `inset 0 0 0 1px ${row.color}55`,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.78rem", fontWeight: 700, color: textPrimary, lineHeight: 1.2 }}>
              {row.name}
            </Typography>
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.72rem", color: textSecondary }}>
              {row.actualValue} invoice{row.actualValue === 1 ? "" : "s"}
            </Typography>
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

export default function AccountingOverviewTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [curriculumFilter, setCurriculumFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [outstandingCurriculumFilter, setOutstandingCurriculumFilter] = useState("");
  const [outstandingClassFilter, setOutstandingClassFilter] = useState("");
  const [outstandingYearFilter, setOutstandingYearFilter] = useState("");
  const [outstandingMonthFilter, setOutstandingMonthFilter] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/accounting/stats", { headers: authJsonHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not load accounting stats.");
      }
      setStats(json.data);
    } catch (e) {
      setError(e.message || "Could not load accounting stats.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = stats?.counts || {};

  const curriculumOptions = useMemo(
    () => [{ value: "", label: "All curricula" }, ...(stats?.curricula || []).map((row) => ({ value: String(row.id), label: row.label }))],
    [stats]
  );

  const classOptions = useMemo(() => {
    const rows = stats?.classes || [];
    const filtered = curriculumFilter
      ? rows.filter((row) => String(row.curriculum_id) === String(curriculumFilter))
      : rows;
    return [{ value: "", label: "All classes" }, ...filtered.map((row) => ({ value: String(row.id), label: row.label }))];
  }, [stats, curriculumFilter]);

  const yearOptions = useMemo(() => {
    const years = stats?.collection_years?.length
      ? stats.collection_years
      : [...new Set((stats?.collections_breakdown || []).map((row) => row.year).filter(Boolean))].sort((a, b) => a - b);
    return [{ value: "", label: "All years" }, ...years.map((year) => ({ value: String(year), label: String(year) }))];
  }, [stats]);

  const monthOptions = useMemo(
    () => [{ value: "", label: "All months" }, ...MONTH_OPTIONS.map((row) => ({ value: String(row.value), label: row.label }))],
    []
  );

  useEffect(() => {
    if (classFilter && !classOptions.some((option) => option.value === classFilter)) {
      setClassFilter("");
    }
  }, [classFilter, classOptions]);

  const outstandingClassOptions = useMemo(() => {
    const rows = stats?.classes || [];
    const filtered = outstandingCurriculumFilter
      ? rows.filter((row) => String(row.curriculum_id) === String(outstandingCurriculumFilter))
      : rows;
    return [{ value: "", label: "All classes" }, ...filtered.map((row) => ({ value: String(row.id), label: row.label }))];
  }, [stats, outstandingCurriculumFilter]);

  const outstandingYearOptions = useMemo(() => {
    const years = stats?.outstanding_years?.length
      ? stats.outstanding_years
      : [...new Set((stats?.outstanding_breakdown || []).map((row) => row.year).filter(Boolean))].sort((a, b) => a - b);
    return [{ value: "", label: "All years" }, ...years.map((year) => ({ value: String(year), label: String(year) }))];
  }, [stats]);

  useEffect(() => {
    if (outstandingClassFilter && !outstandingClassOptions.some((option) => option.value === outstandingClassFilter)) {
      setOutstandingClassFilter("");
    }
  }, [outstandingClassFilter, outstandingClassOptions]);

  const filteredCollectionRows = useMemo(() => {
    let rows = stats?.collections_breakdown || [];
    if (curriculumFilter) {
      rows = rows.filter((row) => String(row.curriculum_id) === String(curriculumFilter));
    }
    if (classFilter) {
      rows = rows.filter((row) => String(row.curriculum_class_id) === String(classFilter));
    }
    if (yearFilter) {
      rows = rows.filter((row) => String(row.year) === String(yearFilter));
    }
    if (monthFilter) {
      rows = rows.filter((row) => String(row.month) === String(monthFilter));
    }
    return rows;
  }, [stats, curriculumFilter, classFilter, yearFilter, monthFilter]);

  const collectionsBarData = useMemo(() => {
    const byMonth = new Map();
    for (const row of filteredCollectionRows) {
      const key = String(row.month_start);
      const existing = byMonth.get(key) || {
        month_start: row.month_start,
        label: row.label,
        value: 0,
      };
      existing.value += Number(row.collected) || 0;
      byMonth.set(key, existing);
    }
    return [...byMonth.values()]
      .sort((a, b) => new Date(a.month_start) - new Date(b.month_start))
      .map((row) => ({ name: row.label, value: row.value }));
  }, [filteredCollectionRows]);

  const filteredOutstandingRows = useMemo(() => {
    let rows = stats?.outstanding_breakdown || [];
    if (outstandingCurriculumFilter) {
      rows = rows.filter((row) => String(row.curriculum_id) === String(outstandingCurriculumFilter));
    }
    if (outstandingClassFilter) {
      rows = rows.filter((row) => String(row.curriculum_class_id) === String(outstandingClassFilter));
    }
    if (outstandingYearFilter) {
      rows = rows.filter((row) => String(row.year) === String(outstandingYearFilter));
    }
    if (outstandingMonthFilter) {
      rows = rows.filter((row) => String(row.month) === String(outstandingMonthFilter));
    }
    return rows;
  }, [stats, outstandingCurriculumFilter, outstandingClassFilter, outstandingYearFilter, outstandingMonthFilter]);

  const outstandingBarData = useMemo(() => {
    const byClass = new Map();
    for (const row of filteredOutstandingRows) {
      const key = row.class_id != null ? String(row.class_id) : "__unassigned__";
      const existing = byClass.get(key) || {
        name: row.label || row.class_name || "Class",
        value: 0,
      };
      existing.value += Number(row.outstanding) || 0;
      byClass.set(key, existing);
    }
    return [...byClass.values()].sort((a, b) => b.value - a.value);
  }, [filteredOutstandingRows]);

  const statusChartRows = useMemo(() => {
    const countByStatus = new Map(
      (stats?.invoices_by_status || []).map((row) => [row.status, Number(row.invoice_count ?? row.value) || 0])
    );
    return ALL_INVOICE_STATUSES.map((status) => ({
      status,
      name: STATUS_LABELS[status],
      value: countByStatus.get(status) || 0,
      color: STATUS_COLORS[status],
    }));
  }, [stats]);

  const pieDisplayData = useMemo(() => {
    const total = statusChartRows.reduce((sum, row) => sum + row.value, 0);
    return statusChartRows.map((row) => ({
      ...row,
      actualValue: row.value,
      displayValue: row.value > 0 ? row.value : total === 0 ? 1 : 0,
    }));
  }, [statusChartRows]);

  const pieSlices = useMemo(() => {
    const total = pieDisplayData.reduce((sum, row) => sum + row.displayValue, 0);
    if (total === 0) return [];
    return pieDisplayData.filter((row) => row.displayValue > 0);
  }, [pieDisplayData]);

  const collectionsTotal = useMemo(() => collectionsBarData.reduce((sum, row) => sum + row.value, 0), [collectionsBarData]);
  const outstandingTotal = useMemo(() => outstandingBarData.reduce((sum, row) => sum + row.value, 0), [outstandingBarData]);
  const invoicesTotal = useMemo(() => statusChartRows.reduce((sum, row) => sum + row.value, 0), [statusChartRows]);

  const latestPaymentLabel = counts.latest_payment_at
    ? new Date(counts.latest_payment_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "No payments yet";

  const statCardsTop = [
    {
      icon: <DescriptionIcon />,
      label: "Fee structures",
      value: counts.fee_structures ?? 0,
      gradient: `linear-gradient(145deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
    },
    {
      icon: <ReceiptLongIcon />,
      label: "Active invoices",
      value: counts.active_invoices ?? 0,
      gradient: "linear-gradient(145deg, #7C3AED 0%, #5B21B6 100%)",
    },
    {
      icon: <AccountBalanceWalletIcon />,
      label: "Total collected",
      value: counts.total_collected ?? 0,
      displayValue: formatKes(counts.total_collected ?? 0),
      gradient: "linear-gradient(145deg, #16A34A 0%, #15803D 100%)",
    },
  ];

  const statCardsBottom = [
    {
      icon: <TrendingUpIcon />,
      label: "Outstanding",
      value: counts.outstanding_balance ?? 0,
      displayValue: formatKes(counts.outstanding_balance ?? 0),
      gradient: "linear-gradient(145deg, #D97706 0%, #B45309 100%)",
    },
    {
      icon: <PaymentsIcon />,
      label: "Receipts issued",
      value: counts.receipts ?? 0,
      gradient: `linear-gradient(145deg, ${accentBlue} 0%, #1D4ED8 100%)`,
    },
  ];

  const collectionFilters = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        gap: 1,
        width: { xs: "100%", lg: 680 },
      }}
    >
      <FilterSelect
        selectId="acct-collections-curriculum-filter"
        label="Curriculum"
        value={curriculumFilter}
        onChange={(value) => {
          setCurriculumFilter(value);
          setClassFilter("");
        }}
        options={curriculumOptions}
      />
      <FilterSelect
        selectId="acct-collections-class-filter"
        label="Class"
        value={classFilter}
        onChange={setClassFilter}
        options={classOptions}
      />
      <FilterSelect
        selectId="acct-collections-year-filter"
        label="Year"
        value={yearFilter}
        onChange={setYearFilter}
        options={yearOptions}
      />
      <FilterSelect
        selectId="acct-collections-month-filter"
        label="Month"
        value={monthFilter}
        onChange={setMonthFilter}
        options={monthOptions}
      />
    </Box>
  );

  const outstandingFilters = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        gap: 1,
        width: { xs: "100%", lg: 680 },
      }}
    >
      <FilterSelect
        selectId="acct-outstanding-curriculum-filter"
        label="Curriculum"
        value={outstandingCurriculumFilter}
        onChange={(value) => {
          setOutstandingCurriculumFilter(value);
          setOutstandingClassFilter("");
        }}
        options={curriculumOptions}
      />
      <FilterSelect
        selectId="acct-outstanding-class-filter"
        label="Class"
        value={outstandingClassFilter}
        onChange={setOutstandingClassFilter}
        options={outstandingClassOptions}
      />
      <FilterSelect
        selectId="acct-outstanding-year-filter"
        label="Year"
        value={outstandingYearFilter}
        onChange={setOutstandingYearFilter}
        options={outstandingYearOptions}
      />
      <FilterSelect
        selectId="acct-outstanding-month-filter"
        label="Month"
        value={outstandingMonthFilter}
        onChange={setOutstandingMonthFilter}
        options={monthOptions}
      />
    </Box>
  );

  return (
    <Box
      sx={{
        borderRadius: "22px",
        background: `linear-gradient(180deg, ${warmCream} 0%, #FFFFFF 55%, rgba(254,226,226,0.2) 100%)`,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {loading && !stats ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
          <CircularProgress sx={{ color: primaryRed }} />
          <Typography sx={{ fontFamily: fontBody, color: textSecondary }}>Loading accounting dashboard…</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              borderRadius: "24px",
              p: { xs: 2.25, sm: 3 },
              background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 55%, #7F1D1D 100%)`,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px -12px rgba(220,38,38,0.45)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ position: "relative", zIndex: 1 }}>
              <Box>
                <Typography sx={{ fontFamily: fontDisplay, fontSize: { xs: "1.5rem", sm: "1.85rem" }, fontWeight: 700, letterSpacing: "-0.03em" }}>
                  Accounting overview
                </Typography>
                <Typography sx={{ fontFamily: fontBody, fontSize: "0.92rem", opacity: 0.9, mt: 0.75, maxWidth: 520 }}>
                  Fee billing, collections, and outstanding balances at a glance.
                </Typography>
                {!loading && stats ? (
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    {[
                      { label: `${counts.payments ?? 0} payments` },
                      { label: formatKes(counts.term_fee_billed ?? 0) + " billed" },
                      { label: `Latest: ${latestPaymentLabel}` },
                    ].map((pill) => (
                      <Chip
                        key={pill.label}
                        label={pill.label}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.14)",
                          color: "#fff",
                          fontFamily: fontBody,
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                  </Stack>
                ) : null}
              </Box>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                onClick={() => void load()}
                disabled={loading}
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  fontFamily: fontBody,
                  fontWeight: 700,
                  borderRadius: "12px",
                  textTransform: "none",
                  border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  flexShrink: 0,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Box>

          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {statCardsTop.map((card, i) => (
                <StatCard key={card.label} {...card} loading={loading} delay={i + 1} />
              ))}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                width: "100%",
              }}
            >
              {statCardsBottom.map((card, i) => (
                <StatCard key={card.label} {...card} loading={loading} delay={i + 4} />
              ))}
            </Box>
          </Stack>

          <SectionHeading title="Collections & balances" subtitle="Monthly intake and class-level outstanding amounts" />

          <Stack spacing={2.5}>
            <ChartCard
              icon={<BarChartIcon fontSize="small" />}
              title="Collections by month"
              subtitle="All payment months — filter by curriculum, class, year, or month"
              delay={6}
              total={formatKesShort(collectionsTotal)}
              totalLabel="Filtered total"
              action={collectionFilters}
            >
              {collectionsBarData.length === 0 ? (
                <EmptyChart message="No collections for this filter" hint="Try clearing filters or record payments to see monthly totals." />
              ) : (
                <MoneyBarChart
                  data={collectionsBarData}
                  barColor={primaryRed}
                  barColorEnd={primaryDark}
                  valueLabel="Collected"
                  xAxisLabel="Month"
                  yAxisLabel="KES"
                />
              )}
            </ChartCard>

            <ChartCard
              icon={<ClassIcon fontSize="small" />}
              title="Outstanding by class"
              subtitle="Unpaid invoice balances grouped by class — filter by curriculum, class, year, or month"
              delay={7}
              accentColor={accentBlue}
              total={formatKesShort(outstandingTotal)}
              totalLabel="Filtered outstanding"
              action={outstandingFilters}
            >
              {outstandingBarData.length === 0 ? (
                <EmptyChart message="No outstanding balances for this filter" hint="Try clearing filters or generate invoices with unpaid balances." />
              ) : (
                <MoneyBarChart
                  data={outstandingBarData}
                  barColor={accentBlue}
                  barColorEnd="#1D4ED8"
                  valueLabel="Outstanding"
                  xAxisLabel="Class"
                  yAxisLabel="KES"
                />
              )}
            </ChartCard>
          </Stack>

          <SectionHeading title="Invoice breakdown" subtitle="How invoices are distributed by status" />

          <ChartCard
            icon={<PieChartIcon fontSize="small" />}
            title="Invoices by status"
            subtitle="Every status is shown with a fixed colour, including zero counts"
            delay={8}
            accentColor="#7C3AED"
            total={invoicesTotal}
            totalLabel="Invoices"
          >
            <Box sx={{ width: "100%", height: { xs: 320, md: 360 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {pieSlices.length > 0 ? (
                    <Pie
                      data={pieSlices}
                      dataKey="displayValue"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      outerRadius="68%"
                      innerRadius="42%"
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                      label={({ name, percent, payload }) => {
                        const actual = payload?.actualValue ?? 0;
                        if (!actual) return "";
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }}
                      labelLine={{ stroke: textSecondary, strokeWidth: 1 }}
                    >
                      {pieSlices.map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Pie>
                  ) : null}
                  <Tooltip
                    formatter={(value, name, props) => [props?.payload?.actualValue ?? value, name]}
                    contentStyle={chartTooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <StatusColorLegend rows={pieDisplayData} />
          </ChartCard>

          <Box
            component={motion.div}
            variants={fadeUp}
            custom={9}
            initial="hidden"
            animate="visible"
            sx={{
              borderRadius: "18px",
              p: 2,
              bgcolor: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(220,38,38,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <TrendingUpIcon sx={{ color: primaryRed }} />
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.88rem", color: textSecondary }}>
              <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                {formatKes(counts.total_collected ?? 0)}
              </Box>{" "}
              collected across{" "}
              <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                {counts.payments ?? 0}
              </Box>{" "}
              payments ·{" "}
              <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                {formatKes(counts.outstanding_balance ?? 0)}
              </Box>{" "}
              still outstanding on active invoices.
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
