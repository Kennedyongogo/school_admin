import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { format, isValid, parseISO } from "date-fns";
import {
  authHeaders,
  fullMainBleedSx,
  elimuViewportSx,
  warmCream,
} from "../components/Timetable/timetableShared";
import {
  TimetableHero,
  HeroActionButton,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  EmptyTableRow,
  TimetableActionButton,
  TimetableInfoBanner,
} from "../components/Timetable/timetableUi";

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

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
    return WEEKDAYS.find((w) => w.value === row.day_of_week)?.label || "—";
  };

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        ...elimuViewportSx,
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
        display: "flex",
        flexDirection: "column",
      })}
    >
      <TimetableHero
        title={`${timetable?.curriculum_class?.name || "Class"} · ${timetable?.name || "Timetable"}`}
        subtitle={
          [
            termLabel ? `Term: ${termLabel}` : null,
            anchorLabel ? `Calendar date: ${anchorLabel}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Review and remove lessons on this timetable."
        }
        icon={<ScheduleOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <HeroActionButton startIcon={<ArrowBackIcon />} onClick={back}>
            Back
          </HeroActionButton>
        }
      />

      <TimetableInfoBanner>
        Lessons are added when you create a timetable from the calendar. Remove a row here if you need to delete a lesson.
      </TimetableInfoBanner>

      <TabPanelShell
        loading={loading}
        error={error || actionError}
        onDismissError={() => {
          setError(null);
          setActionError(null);
        }}
      >
        <DataTableShell>
          <Table size="small">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>Date</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Day</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Period</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ border: 0, p: 0 }}>
                    <EmptyTableRow colSpan={5} message="No lessons on this timetable yet." />
                  </TableCell>
                </TableRow>
              ) : (
                lessons.map((row) => {
                  const wd = WEEKDAYS.find((w) => w.value === row.day_of_week)?.label || "—";
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{rowDateLabel(row)}</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{wd}</TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        {row.period_index ?? "—"}
                      </TableCell>
                      <TableCell>{row.curriculum_subject?.name || "—"}</TableCell>
                      <TableCell align="right">
                        <TimetableActionButton
                          title="Remove lesson"
                          color="error"
                          onClick={() => removeLesson(row.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </TimetableActionButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      </TabPanelShell>
    </Box>
  );
}
