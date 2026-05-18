import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
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
} from "recharts";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const backgroundLight = "#FEF2F2";

/** Distinct hues so pie slices and legend entries are easy to tell apart. */
const PIE_COLORS = [
  "#DC2626",
  "#2563EB",
  "#16A34A",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#DB2777",
  "#65A30D",
  "#EA580C",
  "#4F46E5",
  "#0D9488",
  "#9333EA",
  "#CA8A04",
  "#059669",
];

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
});

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function StatCard({ icon, label, value, loading }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        width: "100%",
        border: "1px solid #fecaca",
        borderRadius: 2,
        background: "linear-gradient(145deg, #ffffff 0%, #fff7f7 100%)",
        boxShadow: "0 4px 16px rgba(220, 38, 38, 0.08)",
      }}
    >
      <CardContent sx={{ py: 2, px: 2.25, height: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ height: "100%" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(220, 38, 38, 0.1)",
              color: accent,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: accentDark, mt: 0.25 }}>
              {loading ? "—" : value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
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
    () =>
      (stats?.bar_chart?.series || []).map((row) => ({
        name: row.x,
        value: row.y,
      })),
    [stats]
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

  /** Pie ring: real counts when any exist; otherwise equal segments so each curriculum keeps its color. */
  const pieDisplayData = useMemo(() => {
    const total = curriculumChartRows.reduce((sum, row) => sum + row.value, 0);
    if (total === 0) {
      return curriculumChartRows.map((row) => ({
        ...row,
        displayValue: 1,
        actualValue: 0,
      }));
    }
    return curriculumChartRows
      .filter((row) => row.value > 0)
      .map((row) => ({ ...row, displayValue: row.value, actualValue: row.value }));
  }, [curriculumChartRows]);

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 2.5, width: "100%", boxSizing: "border-box" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {loading && !stats ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                width: "100%",
              }}
            >
              <StatCard icon={<PeopleIcon />} label="Users" value={counts.users ?? 0} loading={loading} />
              <StatCard
                icon={<AdminPanelSettingsIcon />}
                label="School admin"
                value={counts.school_admin_profiles ?? 0}
                loading={loading}
              />
              <StatCard
                icon={<FamilyRestroomIcon />}
                label="Parents"
                value={counts.parent_profiles ?? 0}
                loading={loading}
              />
              <StatCard
                icon={<SchoolIcon />}
                label="Students"
                value={counts.student_profiles ?? 0}
                loading={loading}
              />
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: { xs: 1.5, sm: 2.5 },
                border: "1px solid #fecaca",
                borderRadius: 2,
                bgcolor: "#fff",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: accentDark, mb: 0.5 }}>
                Students by class
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Number of students in each curriculum class
              </Typography>
              {barData.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No class data yet.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: { xs: 320, md: 380 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 8, right: 12, left: 0, bottom: 72 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                      <XAxis
                        dataKey="name"
                        angle={-32}
                        textAnchor="end"
                        height={88}
                        interval={0}
                        tick={{ fill: accentDark, fontSize: 11 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fill: accentDark, fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [value, "Students"]}
                        contentStyle={{ borderRadius: 8, borderColor: "#fecaca" }}
                      />
                      <Bar dataKey="value" name="Students" fill={accent} radius={[6, 6, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                p: { xs: 1.5, sm: 2.5 },
                border: "1px solid #fecaca",
                borderRadius: 2,
                bgcolor: "#fff",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, color: accentDark, mb: 0.5 }}>
                Students by curriculum
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share of students across curricula
              </Typography>
              {curriculumChartRows.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No curricula defined yet.
                </Typography>
              ) : (
                <Box sx={{ width: "100%", height: { xs: 380, md: 440 } }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {pieDisplayData.length > 0 ? (
                        <Pie
                          data={pieDisplayData}
                          dataKey="displayValue"
                          nameKey="name"
                          cx="50%"
                          cy="42%"
                          outerRadius="70%"
                          innerRadius="38%"
                          paddingAngle={3}
                          stroke="#fff"
                          strokeWidth={2}
                          label={({ name, percent, payload }) => {
                            const actual = payload?.actualValue ?? 0;
                            if (actual === 0) return "";
                            return percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : "";
                          }}
                          labelLine={{ stroke: accentDark, strokeWidth: 1 }}
                        >
                          {pieDisplayData.map((entry) => (
                            <Cell key={`slice-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                      ) : null}
                      <Tooltip
                        formatter={(_, name, props) => [
                          props?.payload?.actualValue ?? props?.payload?.displayValue ?? 0,
                          name,
                        ]}
                        contentStyle={{ borderRadius: 8, borderColor: "#fecaca" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={72}
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
            </Paper>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
