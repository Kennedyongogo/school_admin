import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

/** Matches lesson chip / cream row — neutral stone, not brand red. */
const lessonStone = "#5c4a38";
const lessonStoneHover = "#4a3d32";

export function formatLessonTimeRange(start, end) {
  const fmt = (v) => {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return `${a} – ${b}`;
  return a || b || "—";
}

export function teacherLabel(t) {
  const u = t?.user;
  return u?.full_name || u?.username || "—";
}

export function LessonOnlineCard({ row, onInitiate }) {
  const cc = row.timetable?.curriculum_class;
  const cur = cc?.curriculum;
  const term = row.timetable?.curriculum_class_level;
  const sub = row.curriculum_subject?.name || "Lesson";
  const lines = [
    cur?.name && `Curriculum: ${cur.name}`,
    cc && `Class: ${cc.name}${cc.code ? ` (${cc.code})` : ""}`,
    term?.name && `Term: ${term.name}`,
    row.lesson_date && `Date: ${row.lesson_date}`,
    `Time: ${formatLessonTimeRange(row.starts_at, row.ends_at)}`,
    row.teacher && `Teacher: ${teacherLabel(row.teacher)}`,
  ].filter(Boolean);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        flex: 1,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        border: `1px solid ${accentLight}`,
        boxShadow: "0 10px 28px rgba(185,28,28,0.08)",
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25, pb: 1, width: "100%", boxSizing: "border-box" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ width: "100%", minWidth: 0 }}>
          <Chip
            size="small"
            icon={<VideocamOutlined sx={{ fontSize: "16px !important", color: lessonStone }} />}
            label="Online class"
            sx={{
              fontWeight: 800,
              bgcolor: "rgba(237,226,209,0.85)",
              color: "#5c4a38",
              border: "1px solid rgba(139,115,85,0.35)",
            }}
          />
          <AccessTimeRounded sx={{ fontSize: 20, color: lessonStone }} />
        </Stack>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#111827", lineHeight: 1.25 }}>
          {sub}
        </Typography>
        <Stack spacing={0.35}>
          {lines.map((line) => (
            <Typography key={line} variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
              {line}
            </Typography>
          ))}
        </Stack>
      </CardContent>
      <Box sx={{ p: 2, pt: 0, mt: "auto", width: "100%", boxSizing: "border-box" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onInitiate(row)}
          sx={{
            bgcolor: lessonStone,
            color: "#faf8f5",
            fontWeight: 800,
            py: 1.1,
            "&:hover": { bgcolor: lessonStoneHover },
          }}
        >
          Initiate
        </Button>
      </Box>
    </Card>
  );
}

export function ExamOnlineCard({ exam, onInitiate }) {
  const title = exam.title || "Online exam";
  const lines = [exam.subtitle, exam.slotLabel].filter(Boolean);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        flex: 1,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        border: `1px solid ${accentLight}`,
        boxShadow: "0 10px 28px rgba(185,28,28,0.08)",
        overflow: "hidden",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          width: "100%",
          boxSizing: "border-box",
          px: { xs: 2, sm: 2.5 },
          py: 2,
          pb: 1,
          "&:last-child": { pb: 1 },
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={1}
          sx={{ width: "100%", minWidth: 0 }}
        >
          <Chip
            size="small"
            icon={<QuizOutlined sx={{ fontSize: "16px !important", flexShrink: 0 }} />}
            label="Online exam"
            sx={{
              fontWeight: 800,
              bgcolor: `${accent}14`,
              color: accentDark,
              border: `1px solid ${accentLight}`,
              maxWidth: "100%",
              height: "auto",
              minHeight: 28,
              alignSelf: "flex-start",
              "& .MuiChip-label": {
                whiteSpace: "normal",
                display: "block",
                textAlign: "left",
                py: 0.6,
                px: 1,
                lineHeight: 1.35,
              },
            }}
          />
          <SchoolOutlined sx={{ fontSize: 22, color: accent, flexShrink: 0, mt: 0.25 }} />
        </Stack>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: "#111827",
            lineHeight: 1.35,
            width: "100%",
            wordBreak: "break-word",
          }}
        >
          {title}
        </Typography>
        {lines.length > 0 ? (
          <Stack spacing={0.75} sx={{ width: "100%", minWidth: 0 }}>
            {lines.map((line) => (
              <Typography
                key={line}
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.55, width: "100%", wordBreak: "break-word" }}
              >
                {line}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ width: "100%", wordBreak: "break-word" }}>
            Supervised assessment slot — details when the exam module is linked.
          </Typography>
        )}
      </CardContent>
      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2, pt: 0, mt: "auto", width: "100%", boxSizing: "border-box" }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onInitiate(exam)}
          sx={{
            bgcolor: accent,
            color: "#fff",
            fontWeight: 800,
            py: 1.1,
            "&:hover": { bgcolor: accentDark },
          }}
        >
          Initiate
        </Button>
      </Box>
    </Card>
  );
}

export function EmptyListNotice({ children }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.95)",
        border: `1px dashed ${accentLight}`,
      }}
    >
      {children}
    </Box>
  );
}

/** Same layout as ElimuPlusTeacherDetail: three equal columns on md+, one column below md. */
export function sessionsThreeColumnGridSx(theme, extra = {}) {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: theme.spacing(2.5),
    rowGap: theme.spacing(2.5),
    alignItems: "stretch",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    px: { xs: 0.5, sm: 1 },
    ...extra,
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "minmax(0, 1fr)",
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(2),
    },
  };
}

export const sessionCardCellSx = {
  minHeight: 0,
  minWidth: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

export function SessionsGrid({ children, sx }) {
  return (
    <Box
      sx={(theme) => ({
        ...sessionsThreeColumnGridSx(theme),
        ...(typeof sx === "function" ? sx(theme) : sx || {}),
      })}
    >
      {children}
    </Box>
  );
}

export function SessionGridItem({ children, sx }) {
  return <Box sx={{ ...sessionCardCellSx, ...sx }}>{children}</Box>;
}
