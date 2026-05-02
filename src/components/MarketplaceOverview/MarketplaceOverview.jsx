import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  Legend,
} from "recharts";
import { BarChart } from "@mui/x-charts";
import {
  People as PeopleIcon,
  Inventory as ListingsIcon,
  VerifiedUser as VerifiedIcon,
  Restaurant as FeedIcon,
  Event as TrainingIcon,
  AttachMoney as GrantsIcon,
  Description as ApplicationsIcon,
  School as RegistrationsIcon,
} from "@mui/icons-material";

const COLORS = [
  "#17cf54",
  "#12a842",
  "#82ca9d",
  "#ffc658",
  "#4ecdc4",
  "#45b7d1",
  "#8884d8",
  "#ff6b6b",
];

// Pie chart with recharts (same pattern as Home dashboard)
const CustomPieChart = ({ data, height = 250 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => setActiveIndex(index);

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * (props.midAngle || 0));
    const cos = Math.cos(-RADIAN * (props.midAngle || 0));
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + 2) * cos;
    const my = cy + (outerRadius + 2) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 2}
          outerRadius={outerRadius + 6}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill="#333" fontSize="small">
          {`${value}`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
          fontSize="small"
        >
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  return (
    <Box height={height} width="100%">
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="85%"
              innerRadius="50%"
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      ) : (
        <Box height="100%" display="flex" alignItems="center" justifyContent="center">
          <Typography variant="body2" color="text.secondary">No data</Typography>
        </Box>
      )}
    </Box>
  );
};

const CustomBarChart = ({ data, height = 300 }) => (
  <Box height={height} width="100%">
    {data && data.length > 0 ? (
      <BarChart
        xAxis={[{ data: data.map((d) => d.name), scaleType: "band" }]}
        yAxis={[{ valueFormatter: (v) => (v != null ? String(v) : "0") }]}
        series={[{ data: data.map((d) => d.value), color: "#17cf54", label: "Count" }]}
        margin={{ top: 20, bottom: 60, right: 20 }}
        height={height}
      />
    ) : (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <Typography variant="body2" color="text.secondary">No data</Typography>
      </Box>
    )}
  </Box>
);

const StatCard = ({ title, value, icon, bgColor, borderColor, textColor }) => (
  <Card
    sx={{
      borderRadius: 2,
      boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
      background: bgColor,
      border: `2px solid ${borderColor}`,
      transition: "all 0.3s ease",
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 12px 36px rgba(0,0,0,0.12)" },
      height: "100%",
      minWidth: 0,
    }}
  >
    <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <Box sx={{ mb: 1 }}>{icon}</Box>
      <Typography variant="h4" fontWeight="bold" sx={{ color: textColor }}>
        {value != null ? Number(value).toLocaleString() : "0"}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: textColor }}>
        {title}
      </Typography>
    </CardContent>
  </Card>
);

const defaultStats = {
  users: { total: 0, byRole: {}, verified: 0 },
  listings: { total: 0, byStatus: {} },
  feedFormulationRequests: { total: 0, byStatus: {} },
  trainingOpportunities: {
    trainingEvents: 0,
    grants: 0,
    partners: 0,
    trainingRegistrations: { total: 0, byStatus: {} },
    grantApplications: { total: 0, byStatus: {} },
  },
};

export default function MarketplaceOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Not authenticated.");
          return;
        }
        const res = await fetch("/api/marketplace/admin/stats", {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (res.ok && result.success && result.data) {
          setStats(result.data);
        } else {
          setError(result.message || "Failed to load marketplace stats.");
        }
      } catch (err) {
        setError(err.message || "Failed to load stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={280} p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const { users, listings, feedFormulationRequests, trainingOpportunities } = stats;
  const tr = trainingOpportunities?.trainingRegistrations || {};
  const ga = trainingOpportunities?.grantApplications || {};

  const usersByRoleData = users?.byRole
    ? Object.entries(users.byRole)
        .filter(([, v]) => Number(v) > 0)
        .map(([name, value]) => ({
          name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          value: Number(value),
        }))
    : [];

  const listingsByStatusData = listings?.byStatus
    ? Object.entries(listings.byStatus).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: Number(value),
      }))
    : [];

  const feedByStatusData = feedFormulationRequests?.byStatus
    ? Object.entries(feedFormulationRequests.byStatus).map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value: Number(value),
      }))
    : [];

  const grantAppsByStatusData = ga?.byStatus
    ? Object.entries(ga.byStatus).map(([name, value]) => ({ name: name.replace(/_/g, " "), value: Number(value) }))
    : [];

  const trainingRegsByStatusData = tr?.byStatus
    ? Object.entries(tr.byStatus).map(([name, value]) => ({ name: name, value: Number(value) }))
    : [];

  return (
    <Box sx={{ pt: 1, width: "100%", boxSizing: "border-box" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
          width: "100%",
          mb: 2,
        }}
      >
        <StatCard
          title="Marketplace Users"
          value={users?.total}
          icon={<PeopleIcon sx={{ fontSize: 40, color: "#17cf54" }} />}
          bgColor="linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)"
          borderColor="#17cf54"
          textColor="#0d1b0d"
        />
        <StatCard
          title="Listings"
          value={listings?.total}
          icon={<ListingsIcon sx={{ fontSize: 40, color: "#1976d2" }} />}
          bgColor="linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)"
          borderColor="#1976d2"
          textColor="#1976d2"
        />
        <StatCard
          title="Verified Users"
          value={users?.verified}
          icon={<VerifiedIcon sx={{ fontSize: 40, color: "#7b1fa2" }} />}
          bgColor="linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)"
          borderColor="#7b1fa2"
          textColor="#7b1fa2"
        />
        <StatCard
          title="Feed Formulation Requests"
          value={feedFormulationRequests?.total}
          icon={<FeedIcon sx={{ fontSize: 40, color: "#f57c00" }} />}
          bgColor="linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)"
          borderColor="#f57c00"
          textColor="#e65100"
        />
        <StatCard
          title="Training Events"
          value={trainingOpportunities?.trainingEvents}
          icon={<TrainingIcon sx={{ fontSize: 40, color: "#0288d1" }} />}
          bgColor="linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%)"
          borderColor="#0288d1"
          textColor="#0288d1"
        />
        <StatCard
          title="Grants"
          value={trainingOpportunities?.grants}
          icon={<GrantsIcon sx={{ fontSize: 40, color: "#388e3c" }} />}
          bgColor="linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)"
          borderColor="#388e3c"
          textColor="#388e3c"
        />
        <StatCard
          title="Grant Applications"
          value={ga?.total}
          icon={<ApplicationsIcon sx={{ fontSize: 40, color: "#5e35b1" }} />}
          bgColor="linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)"
          borderColor="#5e35b1"
          textColor="#5e35b1"
        />
        <StatCard
          title="Training Registrations"
          value={tr?.total}
          icon={<RegistrationsIcon sx={{ fontSize: 40, color: "#00838f" }} />}
          bgColor="linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)"
          borderColor="#00838f"
          textColor="#00838f"
        />
      </Box>

      {/* Row: two pie charts side by side */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          width: "100%",
          mt: 2,
        }}
      >
        <Card sx={{ borderRadius: 2, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)", p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Users by role
            </Typography>
            <CustomPieChart data={usersByRoleData} height={280} />
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 2, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)", p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Listings by status
            </Typography>
            <CustomPieChart data={listingsByStatusData} height={280} />
          </CardContent>
        </Card>
      </Box>

      {/* Row 1: Feed formulation requests bar chart – full width */}
      <Box sx={{ width: "100%", mt: 2 }}>
        <Card sx={{ borderRadius: 2, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)", p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Feed formulation requests by status
            </Typography>
            <CustomBarChart data={feedByStatusData} height={280} />
          </CardContent>
        </Card>
      </Box>

      {/* Row 2: Grant applications bar chart – full width */}
      <Box sx={{ width: "100%", mt: 2 }}>
        <Card sx={{ borderRadius: 2, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)", p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Grant applications by status
            </Typography>
            <CustomBarChart data={grantAppsByStatusData} height={280} />
          </CardContent>
        </Card>
      </Box>

      {/* Row 3: Training registrations bar chart – full width */}
      <Box sx={{ width: "100%", mt: 2 }}>
        <Card sx={{ borderRadius: 2, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)", p: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Training registrations by status
            </Typography>
            <CustomBarChart data={trainingRegsByStatusData} height={280} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
