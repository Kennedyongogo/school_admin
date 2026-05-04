import React, { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

// Elimu Plus — match Settings / Curriculum / Users red palette
const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";
const textMuted = "#6B7280";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
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

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

function buildYearOptions(centerYear) {
  const years = [];
  for (let y = centerYear - 15; y <= centerYear + 15; y += 1) {
    years.push(y);
  }
  return years;
}

const selectSx = {
  minWidth: 160,
  borderRadius: 2,
  bgcolor: "rgba(255,255,255,0.98)",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#FECACA" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: primaryRed },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: primaryRed,
    boxShadow: `0 0 0 2px ${primaryLight}`,
  },
};

export default function Timetable() {
  const [viewDate, setViewDate] = useState(() => new Date());

  const { daysInGrid, title } = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
    return {
      daysInGrid: days,
      title: format(viewDate, "MMMM yyyy"),
    };
  }, [viewDate]);

  const monthIndex = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const yearOptions = useMemo(() => buildYearOptions(year), [year]);

  const goPrevMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  const setMonth = (event) => {
    const next = Number(event.target.value);
    setViewDate(new Date(year, next, 1));
  };

  const setYear = (event) => {
    const nextYear = Number(event.target.value);
    setViewDate(new Date(nextYear, monthIndex, 1));
  };

  const weekRows = daysInGrid.length / 7;

  return (
    <Box
      sx={(theme) => {
        // `main` uses mt: 9 (below app bar) and p: 3 vertical — fill viewport without page scroll
        const mainTop = theme.spacing(9);
        const mainVerticalPadding = theme.spacing(6);
        const viewportBlock = `calc(100dvh - ${mainTop} - ${mainVerticalPadding})`;
        return {
          ...fullMainBleedSx(theme),
          marginTop: theme.spacing(-2.5),
          height: viewportBlock,
          maxHeight: viewportBlock,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 40%)`,
        };
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.25, sm: 1.5 },
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: "rgba(255,255,255,0.12)",
            borderRadius: "50%",
          }}
        />
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          position="relative"
          zIndex={1}
        >
          <CalendarMonth sx={{ fontSize: { xs: 36, sm: 42 }, opacity: 0.95 }} />
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, fontSize: { xs: "1.35rem", sm: "2rem" } }}
            >
              Timetable
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25 }} noWrap>
              Monthly calendar — pick a month and year to view.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 1, sm: 1.5 },
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ width: "100%", flex: 1, minHeight: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={{ xs: 1, sm: 2 }}
            sx={{
              flexShrink: 0,
              p: { xs: 1.25, sm: 1.5 },
              borderRadius: 2,
              border: `1px solid ${primaryLight}`,
              boxShadow: `0 8px 28px -12px ${primaryRed}33`,
              bgcolor: "rgba(255,255,255,0.98)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                onClick={goPrevMonth}
                aria-label="Previous month"
                size="medium"
                sx={{
                  color: primaryDark,
                  "&:hover": { color: primaryRed, bgcolor: primaryLight },
                }}
              >
                <ChevronLeft />
              </IconButton>
              <Typography
                variant="h6"
                component="span"
                sx={{
                  minWidth: { xs: 160, sm: 220 },
                  textAlign: "center",
                  fontWeight: 700,
                  color: primaryDark,
                }}
              >
                {title}
              </Typography>
              <IconButton
                onClick={goNextMonth}
                aria-label="Next month"
                size="medium"
                sx={{
                  color: primaryDark,
                  "&:hover": { color: primaryRed, bgcolor: primaryLight },
                }}
              >
                <ChevronRight />
              </IconButton>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
              <Select
                size="small"
                value={monthIndex}
                onChange={setMonth}
                sx={{ ...selectSx, minWidth: 160 }}
              >
                {MONTH_NAMES.map((name, i) => (
                  <MenuItem key={name} value={i}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={year}
                onChange={setYear}
                sx={{ ...selectSx, minWidth: 100 }}
              >
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </Stack>
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: "100%",
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gridTemplateRows: `auto repeat(${weekRows}, minmax(0, 1fr))`,
              borderRadius: 2,
              overflow: "hidden",
              border: `1px solid ${primaryLight}`,
              boxShadow: `0 8px 28px -12px ${primaryRed}33`,
              bgcolor: "rgba(255,255,255,0.98)",
            }}
          >
            {WEEKDAY_LABELS.map((label, col) => (
              <Box
                key={label}
                sx={{
                  gridRow: 1,
                  gridColumn: col + 1,
                  py: { xs: 0.5, sm: 0.75 },
                  px: 0.5,
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                  color: "#fff",
                  borderBottom: `2px solid ${primaryDark}`,
                  borderRight: col < 6 ? `1px solid rgba(255,255,255,0.2)` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 0,
                }}
              >
                {label}
              </Box>
            ))}

            {daysInGrid.map((day, i) => {
              const inMonth = isSameMonth(day, viewDate);
              const today = isToday(day);
              const row = Math.floor(i / 7);
              const isLastRow = row === Math.floor((daysInGrid.length - 1) / 7);
              const gridRow = 2 + row;
              return (
                <Box
                  key={day.toISOString()}
                  sx={{
                    gridRow: gridRow,
                    gridColumn: (i % 7) + 1,
                    minHeight: 0,
                    minWidth: 0,
                    p: { xs: 0.25, sm: 0.5 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: i % 7 < 6 ? `1px solid ${primaryLight}` : "none",
                    borderBottom: isLastRow ? "none" : `1px solid ${primaryLight}`,
                    bgcolor: today ? primaryLight : "#fff",
                    color: inMonth ? primaryDark : textMuted,
                    fontWeight: today ? 800 : inMonth ? 600 : 400,
                    boxShadow: today ? `inset 0 0 0 2px ${primaryRed}` : "none",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: { xs: "clamp(0.65rem, 2.2vmin, 0.95rem)", sm: "clamp(0.75rem, 2vmin, 1rem)" },
                      lineHeight: 1.1,
                    }}
                  >
                    {format(day, "d")}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
