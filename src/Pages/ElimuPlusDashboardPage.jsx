import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ClassIcon from "@mui/icons-material/Class";
import PieChartIcon from "@mui/icons-material/PieChart";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentBlue = "#2563EB";
const warmCream = "#FFFBF7";
const textPrimary = "#1C1917";
const textSecondary = "#78716C";

const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const fontDisplay = '"Fraunces", "Georgia", serif';

const PIE_COLORS = [
  "#DC2626", "#2563EB", "#16A34A", "#D97706", "#7C3AED",
  "#0891B2", "#DB2777", "#65A30D", "#EA580C", "#4F46E5",
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getUserName() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "Admin";
    const u = JSON.parse(raw);
    return u?.full_name?.split(" ")[0] || u?.full_name || "Admin";
  } catch {
    return "Admin";
  }
}

function StatCard({ icon, label, value, loading, gradient, delay = 0 }) {
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
              fontSize: "1.75rem",
              fontWeight: 700,
              color: textPrimary,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              mt: 0.25,
            }}
          >
            {loading ? "—" : value.toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function ChartCard({ icon, title, subtitle, children, delay = 0, accentColor = accent, total }) {
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
        <Stack direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1.25} alignItems="center">
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
          {total != null ? (
            <Chip
              label={`${total} total`}
              size="small"
              sx={{
                fontFamily: fontBody,
                fontWeight: 700,
                fontSize: "0.72rem",
                bgcolor: `${accentColor}12`,
                color: accentColor,
                border: `1px solid ${accentColor}28`,
                height: 26,
              }}
            />
          ) : null}
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
      <Typography sx={{ fontFamily: fontBody, color: textSecondary, fontWeight: 600 }}>
        {message}
      </Typography>
      {hint ? (
        <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", color: textSecondary, mt: 0.75, opacity: 0.85 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

const chartTooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,0.12)",
  boxShadow: "0 8px 24px rgba(28,25,23,0.1)",
  fontFamily: fontBody,
  fontSize: 13,
};

function chartHeight(rowCount) {
  return Math.max(240, rowCount * 58 + 48);
}

function HorizontalBarChart({ data, barColor, barColorEnd, valueLabel }) {
  const height = chartHeight(data.length);
  const gradientId = `bar-grad-${valueLabel.replace(/\s/g, "")}`;
  const yWidth = Math.min(200, Math.max(130, Math.max(...data.map((d) => d.name.length), 8) * 7.2));

  return (
    <Box sx={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
          barCategoryGap="22%"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={barColor} stopOpacity={0.95} />
              <stop offset="100%" stopColor={barColorEnd || barColor} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: textSecondary, fontSize: 11, fontFamily: fontBody }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yWidth}
            tick={{ fill: textPrimary, fontSize: 12, fontWeight: 600, fontFamily: fontBody }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [v, valueLabel]}
            contentStyle={chartTooltipStyle}
            cursor={{ fill: "rgba(220,38,38,0.04)" }}
          />
          <Bar
            dataKey="value"
            name={valueLabel}
            fill={`url(#${gradientId})`}
            radius={[0, 10, 10, 0]}
            maxBarSize={32}
          >
            <LabelList
              dataKey="value"
              position="right"
              style={{ fill: textSecondary, fontFamily: fontBody, fontSize: 12, fontWeight: 700 }}
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
      <Typography
        sx={{
          fontFamily: fontDisplay,
          fontWeight: 700,
          fontSize: "1.25rem",
          color: textPrimary,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ fontFamily: fontBody, fontSize: "0.85rem", color: textSecondary, mt: 0.35 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function ElimuPlusDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

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
      const res = await fetch("/api/elimu-plus/stats", { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not load dashboard stats.");
      }
      setStats(json.data);
    } catch (e) {
      setError(e.message || "Could not load dashboard stats.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = stats?.counts || {};
  const barData = useMemo(
    () => (stats?.bar_chart?.series || []).map((row) => ({ name: row.x, value: row.y })),
    [stats]
  );
  const subjectsBarData = useMemo(
    () => (stats?.subjects_bar_chart?.series || []).map((row) => ({ name: row.x, value: row.y })),
    [stats]
  );
  const subjectsWithData = useMemo(
    () => subjectsBarData.filter((row) => row.value > 0),
    [subjectsBarData]
  );
  const curriculumChartRows = useMemo(
    () =>
      (stats?.students_by_curriculum || stats?.pie_chart?.series || []).map((row, index) => ({
        name: row.label || row.name,
        value: Number(row.student_count ?? row.value) || 0,
        color: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [stats]
  );

  const pieDisplayData = useMemo(() => {
    const total = curriculumChartRows.reduce((sum, row) => sum + row.value, 0);
    if (total === 0) {
      return curriculumChartRows.map((row) => ({ ...row, displayValue: 1, actualValue: 0 }));
    }
    return curriculumChartRows
      .filter((row) => row.value > 0)
      .map((row) => ({ ...row, displayValue: row.value, actualValue: row.value }));
  }, [curriculumChartRows]);

  const studentsTotal = useMemo(
    () => barData.reduce((sum, row) => sum + row.value, 0),
    [barData]
  );
  const subjectsTotal = useMemo(
    () => subjectsWithData.reduce((sum, row) => sum + row.value, 0),
    [subjectsWithData]
  );

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const statCards = [
    {
      icon: <PeopleIcon />,
      label: "Total users",
      value: counts.users ?? 0,
      gradient: `linear-gradient(145deg, ${accent} 0%, ${accentDark} 100%)`,
    },
    {
      icon: <AdminPanelSettingsIcon />,
      label: "School admins",
      value: counts.school_admin_profiles ?? 0,
      gradient: "linear-gradient(145deg, #7C3AED 0%, #5B21B6 100%)",
    },
    {
      icon: <FamilyRestroomIcon />,
      label: "Parents",
      value: counts.parent_profiles ?? 0,
      gradient: "linear-gradient(145deg, #0891B2 0%, #0E7490 100%)",
    },
    {
      icon: <SchoolIcon />,
      label: "Students",
      value: counts.student_profiles ?? 0,
      gradient: "linear-gradient(145deg, #16A34A 0%, #15803D 100%)",
    },
    {
      icon: <MenuBookIcon />,
      label: "Active subjects",
      value: counts.active_subjects ?? 0,
      gradient: `linear-gradient(145deg, ${accentBlue} 0%, #1D4ED8 100%)`,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100%",
        background: `linear-gradient(180deg, ${warmCream} 0%, #FFFFFF 40%, rgba(254,226,226,0.25) 100%)`,
        mx: { xs: -1.5, sm: -2, md: -3 },
        mt: { xs: -1, sm: -1.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {loading && !stats ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
          <CircularProgress sx={{ color: accent }} />
          <Typography sx={{ fontFamily: fontBody, color: textSecondary }}>Loading dashboard…</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Hero welcome */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              borderRadius: "24px",
              p: { xs: 2.5, sm: 3.5 },
              background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 55%, #7F1D1D 100%)`,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px -12px rgba(220,38,38,0.45)",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -40,
                right: -20,
                width: 200,
                height: 200,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -60,
                left: "30%",
                width: 280,
                height: 280,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.05)",
              }}
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <WbSunnyOutlinedIcon sx={{ fontSize: 20, opacity: 0.9 }} />
                  <Chip
                    label={todayLabel}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontFamily: fontBody,
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  />
                </Stack>
                <Typography
                  sx={{
                    fontFamily: fontDisplay,
                    fontSize: { xs: "1.65rem", sm: "2rem" },
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.15,
                  }}
                >
                  {getGreeting()}, {getUserName()}
                </Typography>
                <Typography sx={{ fontFamily: fontBody, fontSize: "0.95rem", opacity: 0.88, mt: 0.75, maxWidth: 520 }}>
                  Your Elimu Plus command centre — track students, classes, and curriculum at a glance.
                </Typography>
                {!loading && stats ? (
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    {[
                      { label: `${counts.student_profiles ?? 0} students`, icon: <SchoolIcon sx={{ fontSize: 14 }} /> },
                      { label: `${counts.active_subjects ?? 0} subjects`, icon: <MenuBookIcon sx={{ fontSize: 14 }} /> },
                      { label: `${barData.length} classes`, icon: <ClassIcon sx={{ fontSize: 14 }} /> },
                    ].map((pill) => (
                      <Chip
                        key={pill.label}
                        icon={pill.icon}
                        label={pill.label}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.14)",
                          color: "#fff",
                          fontFamily: fontBody,
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          border: "1px solid rgba(255,255,255,0.2)",
                          "& .MuiChip-icon": { color: "rgba(255,255,255,0.9)" },
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

          {/* Stat cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {statCards.map((card, i) => (
              <StatCard key={card.label} {...card} loading={loading} delay={i + 1} />
            ))}
          </Box>

          {/* Class analytics — stacked full width */}
          <SectionHeading
            title="Class analytics"
            subtitle="Enrollment and subject coverage broken down by class"
          />

          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <ChartCard
              icon={<ClassIcon fontSize="small" />}
              title="Students by class"
              subtitle="Enrollment across curriculum classes"
              delay={6}
              total={studentsTotal}
            >
              {barData.length === 0 ? (
                <EmptyChart message="No class data yet" hint="Add students and assign them to classes." />
              ) : (
                <HorizontalBarChart
                  data={barData}
                  barColor={accent}
                  barColorEnd={accentDark}
                  valueLabel="Students"
                />
              )}
            </ChartCard>

            <ChartCard
              icon={<MenuBookIcon fontSize="small" />}
              title="Subjects by class"
              subtitle="Active subjects linked to each class"
              delay={7}
              accentColor={accentBlue}
              total={subjectsTotal || counts.active_subjects}
            >
              {subjectsBarData.length === 0 ? (
                <EmptyChart
                  message="No subject data yet"
                  hint="Add subjects under Curriculum and link them to a class."
                />
              ) : subjectsWithData.length === 0 ? (
                <EmptyChart
                  message="Subjects exist but none are assigned to a class"
                  hint={`You have ${counts.active_subjects ?? 0} active subject(s). Link them to a curriculum class to see the breakdown.`}
                />
              ) : (
                <HorizontalBarChart
                  data={subjectsWithData}
                  barColor={accentBlue}
                  barColorEnd="#1D4ED8"
                  valueLabel="Subjects"
                />
              )}
            </ChartCard>
          </Stack>

          <SectionHeading title="Curriculum overview" subtitle="How students are distributed across programmes" />
          <ChartCard
            icon={<PieChartIcon fontSize="small" />}
            title="Students by curriculum"
            subtitle="Distribution across programmes"
            delay={8}
            accentColor="#7C3AED"
            total={studentsTotal}
          >
            {curriculumChartRows.length === 0 ? (
              <EmptyChart message="No curricula defined yet" hint="Create curricula to organise your school." />
            ) : (
              <Box sx={{ width: "100%", height: { xs: 360, md: 400 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {pieDisplayData.length > 0 ? (
                      <Pie
                        data={pieDisplayData}
                        dataKey="displayValue"
                        nameKey="name"
                        cx="50%"
                        cy="44%"
                        outerRadius="68%"
                        innerRadius="42%"
                        paddingAngle={3}
                        stroke="#fff"
                        strokeWidth={2}
                        label={({ name, percent, payload }) => {
                          const actual = payload?.actualValue ?? 0;
                          if (actual === 0) return "";
                          return percent > 0.06 ? `${name}` : "";
                        }}
                        labelLine={false}
                      >
                        {pieDisplayData.map((entry) => (
                          <Cell key={`slice-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                    ) : null}
                    <Tooltip
                      formatter={(_, name, props) => [
                        props?.payload?.actualValue ?? props?.payload?.displayValue ?? 0,
                        "Students",
                      ]}
                      contentStyle={chartTooltipStyle}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={64}
                      iconType="circle"
                      formatter={(value) => (
                        <span style={{ fontFamily: fontBody, fontSize: 12, color: textSecondary }}>{value}</span>
                      )}
                      payload={curriculumChartRows.map((entry) => ({
                        value: `${entry.name} (${entry.value})`,
                        type: "circle",
                        color: entry.color,
                        id: entry.name,
                      }))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </ChartCard>

          {/* Quick insight footer */}
          {!loading && stats ? (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.25,
                borderRadius: "14px",
                bgcolor: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.1)",
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 18, color: accent }} />
              <Typography sx={{ fontFamily: fontBody, fontSize: "0.82rem", color: textSecondary }}>
                <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                  {counts.student_profiles ?? 0} students
                </Box>
                {" · "}
                <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                  {counts.active_subjects ?? 0} subjects
                </Box>
                {" · "}
                {curriculumChartRows.length} curriculum{curriculumChartRows.length === 1 ? "" : "a"}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
