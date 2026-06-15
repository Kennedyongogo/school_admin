import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, MenuItem, Stack } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  fullMainBleedSx,
  elimuViewportSx,
  warmCream,
  buildYearOptions,
  MONTH_NAMES,
  timetableViewportSx,
} from "../components/Timetable/timetableShared";
import {
  TimetableHero,
  TimetableMonthNav,
  TimetableCalendarGrid,
  TimetableFilterSelect,
} from "../components/Timetable/timetableUi";

export default function Timetable() {
  const navigate = useNavigate();
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
  const weekRows = daysInGrid.length / 7;

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        ...elimuViewportSx,
        ...timetableViewportSx(theme),
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
      })}
    >
      <TimetableHero
        title="Timetable"
        subtitle="Monthly calendar — pick a day to manage class lessons and staff online meetings."
        icon={<CalendarMonthOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
      />

      <Stack spacing={1.5} sx={{ flex: 1, minHeight: 0 }}>
        <TimetableMonthNav
          title={title}
          onPrev={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNext={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        >
          <TimetableFilterSelect
            label="Month"
            value={monthIndex}
            onChange={(e) => setViewDate(new Date(year, Number(e.target.value), 1))}
            sx={{ minWidth: 160 }}
          >
            {MONTH_NAMES.map((name, i) => (
              <MenuItem key={name} value={i}>
                {name}
              </MenuItem>
            ))}
          </TimetableFilterSelect>
          <TimetableFilterSelect
            label="Year"
            value={year}
            onChange={(e) => setViewDate(new Date(Number(e.target.value), monthIndex, 1))}
            sx={{ minWidth: 110 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TimetableFilterSelect>
        </TimetableMonthNav>

        <TimetableCalendarGrid
          weekRows={weekRows}
          daysInGrid={daysInGrid}
          viewDate={viewDate}
          onDayClick={(iso) => navigate(`/timetable/day/${iso}`)}
        />
      </Stack>
    </Box>
  );
}
