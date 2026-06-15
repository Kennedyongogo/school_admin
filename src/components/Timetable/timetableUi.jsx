import React from "react";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { format, isSameMonth, isToday } from "date-fns";
import {
  fontBody,
  fontDisplay,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textMuted,
  inputSx,
  timetablePanelCardSx,
  ATTENDANCE_STATUS,
  meetingAccent,
} from "./timetableShared";

export {
  HRHero as TimetableHero,
  HeroActionButton,
  HRSubTabs as TimetableSubTabs,
  PremiumDialog,
  DetailField,
  FormSection,
  DataTableShell,
  TabPanelShell,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  HRFilterTextField as TimetableFilterTextField,
  HRFilterSelect as TimetableFilterSelect,
  HRPrimaryButton as TimetablePrimaryButton,
  HRGhostButton as TimetableGhostButton,
  HRActionButton as TimetableActionButton,
  HRAttendanceChip as TimetableAttendanceChip,
  HRInfoBanner as TimetableInfoBanner,
  hrSwal as timetableSwal,
  tableHeadRowSx,
  tablePaginationSx,
} from "../HR/hrUi";

export function TimetableMonthNav({ title, monthIndex, year, yearOptions, onPrev, onNext, onMonthChange, onYearChange, children }) {
  return (
    <Box sx={{ ...timetablePanelCardSx, p: { xs: 1.5, sm: 2 }, flexShrink: 0 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
          <IconButton
            onClick={onPrev}
            aria-label="Previous month"
            sx={{ color: primaryDark, "&:hover": { bgcolor: warmCream, color: primaryRed } }}
          >
            <ChevronLeft />
          </IconButton>
          <Typography
            sx={{
              minWidth: { xs: 160, sm: 220 },
              textAlign: "center",
              fontFamily: fontDisplay,
              fontWeight: 800,
              fontSize: "1.15rem",
              color: primaryDark,
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={onNext}
            aria-label="Next month"
            sx={{ color: primaryDark, "&:hover": { bgcolor: warmCream, color: primaryRed } }}
          >
            <ChevronRight />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          {children}
        </Stack>
      </Stack>
    </Box>
  );
}

export function TimetableCalendarGrid({ weekRows, daysInGrid, viewDate, onDayClick }) {
  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        ...timetablePanelCardSx,
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gridTemplateRows: `auto repeat(${weekRows}, minmax(0, 1fr))`,
        p: 0,
      }}
    >
      {WEEKDAY_LABELS.map((label, col) => (
        <Box
          key={label}
          sx={{
            gridRow: 1,
            gridColumn: col + 1,
            py: 1,
            textAlign: "center",
            fontFamily: fontBody,
            fontWeight: 700,
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            bgcolor: warmCream,
            color: primaryDark,
            borderBottom: `1px solid ${primaryLight}`,
            borderRight: col < 6 ? `1px solid ${primaryLight}` : "none",
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
        const iso = format(day, "yyyy-MM-dd");
        return (
          <Box
            key={iso}
            component="button"
            type="button"
            onClick={() => onDayClick(iso)}
            aria-label={`Open timetable for ${iso}`}
            sx={{
              gridRow,
              gridColumn: (i % 7) + 1,
              minHeight: 0,
              minWidth: 0,
              p: 0.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              border: "none",
              cursor: "pointer",
              fontFamily: fontBody,
              borderRight: i % 7 < 6 ? `1px solid ${primaryLight}` : "none",
              borderBottom: isLastRow ? "none" : `1px solid ${primaryLight}`,
              bgcolor: today ? "#FFF7F7" : "#fff",
              color: inMonth ? primaryDark : textMuted,
              fontWeight: today ? 800 : inMonth ? 600 : 400,
              boxShadow: today ? `inset 0 0 0 2px ${primaryRed}` : "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: today ? "#FFF7F7" : warmCream,
                transform: "scale(1.02)",
                zIndex: 1,
              },
              "&:active": { transform: "scale(0.98)" },
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: { xs: "clamp(0.7rem, 2.2vmin, 0.95rem)", sm: "clamp(0.8rem, 2vmin, 1.05rem)" },
                lineHeight: 1.1,
                fontWeight: "inherit",
              }}
            >
              {format(day, "d")}
            </Typography>
            {today ? (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: primaryRed,
                }}
              />
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export function TimetableDetailTile({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "16px",
        bgcolor: warmCream,
        border: `1px solid ${primaryLight}`,
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: primaryRed, display: "flex", mt: 0.15 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.68rem", fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {label}
          </Typography>
          <Typography sx={{ fontFamily: fontBody, fontWeight: 700, color: "#111827", mt: 0.25, wordBreak: "break-word" }}>
            {value || "—"}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function MeetingStatusChip({ label, warning }) {
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.72rem",
        bgcolor: warning ? "#FEF3C7" : "#E0F2F1",
        color: warning ? "#B45309" : meetingAccent,
        border: `1px solid ${warning ? "#F59E0B33" : `${meetingAccent}33`}`,
      }}
    />
  );
}

export { inputSx as timetableInputSx };
