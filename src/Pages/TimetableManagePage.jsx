import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Alert,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { format, isValid, parseISO } from "date-fns";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
  minHeight: "100%",
  background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
});

function teacherLabel(t) {
  const u = t?.user;
  return u?.full_name || u?.username || "Teacher";
}

function lessonSortKey(row) {
  const d = row.lesson_date || "";
  const t = row.starts_at ? String(row.starts_at) : "";
  const p = row.period_index != null ? String(row.period_index).padStart(4, "0") : "9999";
  return `${d}|${t}|${p}`;
}

export default function TimetableManagePage() {
  const { curriculumId, classId, timetableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const anchorDate = searchParams.get("anchorDate");

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const back = useCallback(() => {
    if (anchorDate && /^\d{4}-\d{2}-\d{2}$/.test(anchorDate)) {
      navigate(`/timetable/day/${anchorDate}`);
    } else {
      navigate("/timetable");
    }
  }, [anchorDate, navigate]);

  const loadTimetable = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tRes = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/timetables/${timetableId}`, {
        headers: authHeaders(token),
      });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok || !tJson.success) throw new Error(tJson.message || "Could not load timetable");
      setTimetable(tJson.data);
    } catch (e) {
      setError(e.message || "Failed to load.");
      setTimetable(null);
    } finally {
      setLoading(false);
    }
  }, [curriculumId, classId, timetableId]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const anchorLabel =
    anchorDate && /^\d{4}-\d{2}-\d{2}$/.test(anchorDate) && isValid(parseISO(anchorDate))
      ? format(parseISO(anchorDate), "MMM d, yyyy")
      : null;

  const termLabel = timetable?.curriculum_class_level?.name || null;

  const removeLesson = async (lessonId) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setActionError(null);
    try {
      const res = await fetch(
        `/api/curricula/${curriculumId}/classes/${classId}/timetables/${timetableId}/lessons/${lessonId}`,
        { method: "DELETE", headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      await loadTimetable();
    } catch (err) {
      setActionError(err.message || "Delete failed.");
    }
  };

  const lessons = Array.isArray(timetable?.lessons) ? [...timetable.lessons] : [];
  lessons.sort((a, b) => lessonSortKey(a).localeCompare(lessonSortKey(b)));

  const rowDateLabel = (row) => {
    if (row.lesson_date && /^\d{4}-\d{2}-\d{2}$/.test(row.lesson_date)) {
      try {
        return format(parseISO(row.lesson_date), "MMM d, yyyy");
      } catch {
        return row.lesson_date;
      }
    }
    const wd = WEEKDAYS.find((w) => w.value === row.day_of_week)?.label || "—";
    return wd;
  };

  return (
    <Box sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          color: "#fff",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <IconButton
            aria-label="Back"
            onClick={back}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Timetable
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {timetable?.curriculum_class?.name || "Class"} · {timetable?.name || "Timetable"}
            </Typography>
            {termLabel && (
              <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                Term: {termLabel}
              </Typography>
            )}
            {anchorLabel && (
              <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                Anchor date from calendar: {anchorLabel}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: primaryRed }} />
          </Box>
        ) : (
          <Paper sx={{ borderRadius: 2, border: `1px solid ${primaryLight}`, overflow: "hidden" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, p: 2, pb: 0, color: primaryDark }}>
              Lesson
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
              Lessons are added when you create a timetable from the calendar. Remove a row if you need to delete a
              lesson.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: `${primaryRed}12` }}>
                    <TableCell>Date</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Day</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>P</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell align="center">Delivery</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Teacher</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Time</TableCell>
                    <TableCell align="right" width={56}>
                      {" "}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lessons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography color="text.secondary" sx={{ py: 2 }}>
                          No lesson on this timetable yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lessons.map((row) => {
                      const wd = WEEKDAYS.find((w) => w.value === row.day_of_week)?.label || "—";
                      const subName = row.curriculum_subject?.name || "—";
                      const teach = row.teacher ? teacherLabel(row.teacher) : "—";
                      const timeBits = [row.starts_at, row.ends_at].filter(Boolean).join(" – ");
                      const onlineLesson = row.delivery_mode === "online";
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell>{rowDateLabel(row)}</TableCell>
                          <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{wd}</TableCell>
                          <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                            {row.period_index ?? "—"}
                          </TableCell>
                          <TableCell>{subName}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={onlineLesson ? "Online" : "Physical"}
                              variant="outlined"
                              sx={{
                                fontWeight: 700,
                                borderColor: onlineLesson ? "rgba(139,115,85,0.45)" : "#d1d5db",
                                color: onlineLesson ? "#5c4a38" : "text.secondary",
                                bgcolor: onlineLesson ? "rgba(237,226,209,0.45)" : "transparent",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{teach}</TableCell>
                          <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{timeBits || "—"}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Remove lesson"
                              onClick={() => removeLesson(row.id)}
                              sx={{ color: primaryRed }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
