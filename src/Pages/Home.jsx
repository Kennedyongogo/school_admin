import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  Legend,
} from "recharts";
import { BarChart, PieChart } from "@mui/x-charts";
import {
  People as VotersIcon,
  LocationOn as PollingStationsIcon,
  Group as SupportersIcon,
} from "@mui/icons-material";
import "../App.css";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#ffeaa7",
  "#dda0dd",
];

const generateDistinctColors = (count) => {
  return COLORS.slice(0, count);
};

// Custom Pie Chart Component (similar to MyPieChart)
const CustomPieChart = ({ data, title, height = 250 }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 2) * cos;
    const sy = cy + (outerRadius + 2) * sin;
    const mx = cx + (outerRadius + 2) * cos;
    const my = cy + (outerRadius + 2) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
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
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke={fill}
          fill="none"
        />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 4}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          fontSize="small"
        >{`${value}`}</text>
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
              outerRadius="90%"
              innerRadius="50%"
              fill="#8884d8"
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      ) : (
        <Box
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Typography variant="body2">No data available</Typography>
        </Box>
      )}
    </Box>
  );
};

// Custom Bar Chart Component for Supporters per Polling Station
const CustomBarChart = ({ data, title, height = 350 }) => {
  return (
    <Box height={height} width="100%">
      {data && data.length > 0 ? (
        <BarChart
          xAxis={[
            {
              data: data.map((item) => item.name),
              scaleType: "band",
            },
          ]}
          yAxis={[
            {
              valueFormatter: (value) => {
                return value ? value.toString() : "0";
              },
            },
          ]}
          series={[
            {
              data: data.map((item) => item.value),
              color: "#2196f3",
              label: "Supporters",
            },
          ]}
          slotProps={{
            legend: {
              itemMarkWidth: 20,
              itemMarkHeight: 2,
              labelStyle: {
                fontSize: 12,
                fill: "primary.main",
              },
            },
          }}
          margin={{ top: 20, bottom: 20, right: 20 }}
          height={height}
        />
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={height}
          flexDirection="column"
        >
          <Typography variant="body2" color="text.secondary">
            No supporter data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    Voters: 0,
    PollingStations: 0,
    Supporters: 0,
  });
  const [supporterStats, setSupporterStats] = useState({
    totalSupporters: 0,
    totalPollingStations: 0,
    supportersByType: [],
    supportersByStation: [],
    typeBreakdown: {},
  });

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/campaign/stats/overview", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSupporterStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/campaign/supporters/statistics", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSupporterStats(result.data);
          // Update the Supporters count in the main data
          setData((prev) => ({
            ...prev,
            Supporters: result.data.totalSupporters,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching supporter statistics:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSupporterStats();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, pt: 1 }}>
        <Typography fontWeight="bold" color="primary" variant="h4" gutterBottom>
          Campaign Dashboard
        </Typography>
        <Box flexGrow={1}></Box>
      </Box>
      <Grid container spacing={3}>
        <CardItem title="Voters" value={data.Voters} />
        <CardItem title="Polling Stations" value={data.PollingStations} />
        <CardItem title="Supporters" value={data.Supporters} />
        <Grid size={{ xs: 12, sm: 12, md: 12 }}>
          <Card
            sx={{ borderRadius: "12px", boxShadow: "0px 10px 30px #60606040" }}
          >
            <CardContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Supporters per Polling Station
              </Typography>
              <CustomBarChart
                data={
                  supporterStats.supportersByStation?.map((item) => ({
                    name: item.pollingStation.name,
                    value: item.count,
                  })) || []
                }
                height={350}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Modern Card Component (from Customer Support dashboard)
const ModernCard = ({ title, subtitle, icon, children }) => (
  <Card
    sx={{
      borderRadius: 3,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      "&:hover": {
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        transform: "translateY(-2px)",
      },
      height: "100%",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <CardContent
      sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            {icon && (
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  mr: 2,
                  width: 40,
                  height: 40,
                }}
              >
                {icon}
              </Avatar>
            )}
            <Typography variant="h6" fontWeight="600" color="text.primary">
              {title}
            </Typography>
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </Box>
    </CardContent>
  </Card>
);

const CardItem = (props) => {
  const getCardStyle = (title) => {
    switch (title) {
      case "Voters":
        return {
          icon: <VotersIcon sx={{ fontSize: 45, color: "#1976d2" }} />,
          bgColor: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
          borderColor: "#1976d2",
          textColor: "#1976d2",
        };
      case "Polling Stations":
        return {
          icon: <PollingStationsIcon sx={{ fontSize: 45, color: "#388e3c" }} />,
          bgColor: "linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)",
          borderColor: "#388e3c",
          textColor: "#388e3c",
        };
      case "Supporters":
        return {
          icon: <SupportersIcon sx={{ fontSize: 45, color: "#7b1fa2" }} />,
          bgColor: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
          borderColor: "#7b1fa2",
          textColor: "#7b1fa2",
        };
      default:
        return {
          icon: <VotersIcon sx={{ fontSize: 45, color: "#666" }} />,
          bgColor: "linear-gradient(135deg, #F5F5F5 0%, #EEEEEE 100%)",
          borderColor: "#666",
          textColor: "#666",
        };
    }
  };

  const { title, value } = props;
  const style = getCardStyle(title);

  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Card
        sx={{
          borderRadius: "12px",
          boxShadow: "0px 10px 30px #60606040",
          background: style.bgColor,
          border: `2px solid ${style.borderColor}`,
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0px 15px 40px #60606060",
          },
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            flex: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            {style.icon}
          </Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: style.textColor, mb: 1 }}
          >
            {value?.toLocaleString() || 0}
          </Typography>
          <Typography
            variant="h6"
            fontWeight="600"
            sx={{ color: style.textColor }}
          >
            {title}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};
