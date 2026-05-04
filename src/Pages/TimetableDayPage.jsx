import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import MeetingRoomOutlinedIcon from "@mui/icons-material/MeetingRoomOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { format, isValid, parseISO } from "date-fns";
import Swal from "sweetalert2";
import { showTeacherOverlapSweetAlert } from "../utils/timetableOverlapAlert";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

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

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "0 24px 56px rgba(185, 28, 28, 0.14)",
};

const labelSx = {
  color: primaryDark,
  fontWeight: 600,
  "&.Mui-focused": { color: primaryRed },
};

const outlinedFieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.96)",
    "& fieldset": { borderColor: "#FECACA" },
    "&:hover fieldset": { borderColor: primaryRed },
    "&.Mui-focused fieldset": {
      borderColor: primaryRed,
      boxShadow: `0 0 0 2px ${primaryLight}`,
    },
  },
  "& .MuiInputLabel-root": { ...labelSx },
};

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

function teacherLabel(t) {
  const u = t?.user;
  return u?.full_name || u?.username || "—";
}

function formatTimeRange(start, end) {
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

function parseDbTime(val) {
  if (val == null || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return dayjs(val);
  }
  let s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = dayjs(s);
    return d.isValid() ? d : null;
  }
  if (s.length === 5) s = `${s}:00`;
  const d = dayjs(`1970-01-01T${s}`);
  return d.isValid() ? d : null;
}

function formatTimeForApi(value) {
  if (!value || !value.isValid?.()) return "";
  return value.format("HH:mm:ss");
}

function lessonRouteIds(row) {
  const cc = row.timetable?.curriculum_class;
  const cur = cc?.curriculum;
  return {
    curriculumId: cur?.id,
    classId: cc?.id,
    timetableId: row.timetable?.id,
    lessonId: row.id,
  };
}

function DetailTile({ icon, label, value }) {
  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: primaryLight,
        bgcolor: "rgba(255,255,255,0.95)",
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: primaryRed, display: "flex", mt: 0.25 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
            {label}
          </Typography>
          <Typography variant="body1" fontWeight={700} sx={{ wordBreak: "break-word", color: "#111827" }}>
            {value || "—"}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function TimetableDayPage() {
  const { isoDate } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(() => (searchParams.get("tab") === "exams" ? 1 : 0));
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLessons, setTotalLessons] = useState(0);

  const [viewLesson, setViewLesson] = useState(null);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [editSubjects, setEditSubjects] = useState([]);
  const [editTeachers, setEditTeachers] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editDialogError, setEditDialogError] = useState(null);
  const [deleteDoing, setDeleteDoing] = useState(false);

  const [editForm, setEditForm] = useState({
    lesson_date: "",
    curriculum_subject_id: "",
    teacher_id: "",
    startTime: null,
    endTime: null,
    room: "",
    delivery_mode: "physical",
    teacher_attended: false,
  });

  const parsed = useMemo(() => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
    const d = parseISO(isoDate);
    return isValid(d) ? d : null;
  }, [isoDate]);

  useEffect(() => {
    setPage(0);
  }, [isoDate]);

  useEffect(() => {
    const t = searchParams.get("tab") === "exams" ? 1 : 0;
    setTab(t);
  }, [isoDate, searchParams]);

  const handleTabChange = (_, v) => {
    setTab(v);
    const next = new URLSearchParams(searchParams);
    if (v === 1) next.set("tab", "exams");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };

  const loadLessons = useCallback(async () => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setLessonsError("Please sign in again.");
      setLessons([]);
      setTotalLessons(0);
      setLessonsLoading(false);
      return;
    }
    setLessonsLoading(true);
    setLessonsError(null);
    try {
      const apiPage = page + 1;
      const q = `date=${encodeURIComponent(isoDate)}&page=${apiPage}&limit=${rowsPerPage}`;
      const res = await fetch(`/api/curricula/timetable-lessons/by-date?${q}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load lessons");
      setLessons(Array.isArray(data.data) ? data.data : []);
      const p = data.pagination;
      setTotalLessons(typeof p?.total === "number" ? p.total : data.data?.length ?? 0);
    } catch (e) {
      setLessonsError(e.message || "Failed to load lessons.");
      setLessons([]);
      setTotalLessons(0);
    } finally {
      setLessonsLoading(false);
    }
  }, [isoDate, page, rowsPerPage]);

  const loadEditLookups = useCallback(async (curriculumId, classId, subjectId) => {
    const token = localStorage.getItem("token");
    if (!token || !curriculumId || !classId) return;
    try {
      const subRes = await fetch(
        `/api/curricula/${curriculumId}/subjects?curriculum_class_id=${encodeURIComponent(classId)}`,
        { headers: authHeaders(token) }
      );
      const subJson = await subRes.json().catch(() => ({}));
      if (subRes.ok && subJson.success && Array.isArray(subJson.data)) {
        setEditSubjects(subJson.data);
      } else {
        setEditSubjects([]);
      }
      if (subjectId) {
        const q = `curriculum_subject_id=${encodeURIComponent(subjectId)}`;
        const tRes = await fetch(`/api/curricula/${curriculumId}/teachers-for-timetable?${q}`, {
          headers: authHeaders(token),
        });
        const tJson = await tRes.json().catch(() => ({}));
        setEditTeachers(tRes.ok && tJson.success && Array.isArray(tJson.data) ? tJson.data : []);
      } else {
        setEditTeachers([]);
      }
    } catch {
      setEditSubjects([]);
      setEditTeachers([]);
    }
  }, []);

  const openEdit = useCallback(
    (row) => {
      const { curriculumId, classId } = lessonRouteIds(row);
      setEditDialogError(null);
      setEditLesson(row);
      const sid = row.curriculum_subject?.id || "";
      setEditForm({
        lesson_date: row.lesson_date || isoDate || "",
        curriculum_subject_id: sid,
        teacher_id: row.teacher?.id || "",
        startTime: parseDbTime(row.starts_at),
        endTime: parseDbTime(row.ends_at),
        room: row.room || "",
        delivery_mode: row.delivery_mode === "online" ? "online" : "physical",
        teacher_attended: !!row.teacher_attended,
      });
      if (curriculumId && classId) {
        loadEditLookups(curriculumId, classId, sid);
      }
    },
    [isoDate, loadEditLookups]
  );

  const closeEdit = () => {
    setEditLesson(null);
    setEditDialogError(null);
    setEditSubjects([]);
    setEditTeachers([]);
  };

  useEffect(() => {
    if (!parsed) navigate("/timetable", { replace: true });
  }, [parsed, navigate]);

  useEffect(() => {
    if (parsed) loadLessons();
  }, [parsed, loadLessons]);

  useEffect(() => {
    if (!editLesson) return;
    const { curriculumId, classId } = lessonRouteIds(editLesson);
    const sid = editForm.curriculum_subject_id;
    if (curriculumId && classId && sid) {
      const t = setTimeout(() => {
        loadEditLookups(curriculumId, classId, sid);
      }, 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [editLesson, editForm.curriculum_subject_id, loadEditLookups]);

  const submitEdit = async () => {
    if (!editLesson) return;
    const { curriculumId, classId, timetableId, lessonId } = lessonRouteIds(editLesson);
    if (!curriculumId || !classId || !timetableId || !lessonId) return;
    const starts_at = formatTimeForApi(editForm.startTime);
    const ends_at = formatTimeForApi(editForm.endTime);
    if (!editForm.lesson_date || !editForm.curriculum_subject_id || !starts_at || !ends_at) {
      setEditDialogError("Date, subject, start time and end time are required.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setEditDialogError("Please sign in again.");
      return;
    }
    setEditSaving(true);
    setEditDialogError(null);
    try {
      const body = {
        lesson_date: editForm.lesson_date,
        curriculum_subject_id: editForm.curriculum_subject_id,
        teacher_id: editForm.teacher_id || null,
        starts_at,
        ends_at,
        room: editForm.room?.trim() || null,
        delivery_mode: editForm.delivery_mode === "online" ? "online" : "physical",
        teacher_attended: !!editForm.teacher_attended,
      };
      const res = await fetch(
        `/api/curricula/${curriculumId}/classes/${classId}/timetables/${timetableId}/lessons/${lessonId}`,
        {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      closeEdit();
      await loadLessons();
      await Swal.fire({
        icon: "success",
        title: "Lesson updated",
        text: "Changes were saved successfully.",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      const msg = e.message || "Update failed.";
      if (!showTeacherOverlapSweetAlert(msg)) {
        setEditDialogError(msg);
      }
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteLesson) return;
    const { curriculumId, classId, timetableId, lessonId } = lessonRouteIds(deleteLesson);
    if (!curriculumId || !classId || !timetableId || !lessonId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setDeleteDoing(true);
    try {
      const res = await fetch(
        `/api/curricula/${curriculumId}/classes/${classId}/timetables/${timetableId}/lessons/${lessonId}`,
        { method: "DELETE", headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      setDeleteLesson(null);
      await loadLessons();
      await Swal.fire({
        icon: "success",
        title: "Lesson removed",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e) {
      setLessonsError(e.message || "Delete failed.");
      setDeleteLesson(null);
    } finally {
      setDeleteDoing(false);
    }
  };

  if (!parsed) return null;

  const longLabel = format(parsed, "EEEE, MMMM d, yyyy");

  const viewRows = (row) => {
    if (!row) return null;
    const cc = row.timetable?.curriculum_class;
    const cur = cc?.curriculum;
    const term = row.timetable?.curriculum_class_level;
    const dateLabel =
      row.lesson_date && /^\d{4}-\d{2}-\d{2}$/.test(row.lesson_date)
        ? format(parseISO(row.lesson_date), "EEEE, MMM d, yyyy")
        : row.lesson_date || "—";
    const attended = !!row.teacher_attended;
    const online = row.delivery_mode === "online";
    return {
      subject: row.curriculum_subject?.name || "Lesson",
      dateLabel,
      attended,
      deliveryOnline: online,
      tiles: [
        {
          icon: online ? <VideocamOutlinedIcon fontSize="small" /> : <MeetingRoomOutlinedIcon fontSize="small" />,
          label: "Delivery",
          value: online ? "Online class" : "Physical class",
        },
        {
          icon: <SchoolOutlinedIcon fontSize="small" />,
          label: "Curriculum",
          value: cur?.name,
        },
        {
          icon: <ClassOutlinedIcon fontSize="small" />,
          label: "Class",
          value: cc ? `${cc.name}${cc.code ? ` (${cc.code})` : ""}` : null,
        },
        {
          icon: <LayersOutlinedIcon fontSize="small" />,
          label: "Term",
          value: term?.name,
        },
        {
          icon: <MenuBookOutlinedIcon fontSize="small" />,
          label: "Subject",
          value: row.curriculum_subject?.name,
        },
        {
          icon: <PersonOutlineRoundedIcon fontSize="small" />,
          label: "Teacher",
          value: row.teacher ? teacherLabel(row.teacher) : null,
        },
        {
          icon: <AccessTimeRoundedIcon fontSize="small" />,
          label: "Time",
          value: formatTimeRange(row.starts_at, row.ends_at),
        },
        {
          icon: <MeetingRoomOutlinedIcon fontSize="small" />,
          label: "Room",
          value: row.room?.trim() || "—",
        },
        {
          icon: <DrawRoundedIcon fontSize="small" />,
          label: "Timetable",
          value: row.timetable?.name?.trim() || "—",
        },
      ],
    };
  };

  const vr = viewRows(viewLesson);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ width: "100%" }}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
              <IconButton
                aria-label="Back to calendar"
                onClick={() => navigate("/timetable")}
                sx={{
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.15)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <CalendarMonthIcon sx={{ fontSize: 36, opacity: 0.95, mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
                  Timetable
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {longLabel}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                  Lessons for this date are listed below with pagination. Mark teacher attendance when editing a lesson.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              size="medium"
              onClick={() => navigate(`/timetable/create?date=${isoDate}`)}
              sx={{
                flexShrink: 0,
                alignSelf: { xs: "stretch", sm: "auto" },
                bgcolor: "#fff",
                color: primaryDark,
                fontWeight: 800,
                whiteSpace: { sm: "nowrap" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.92)" },
              }}
            >
              Create lesson timetable
            </Button>
          </Stack>
        </Box>

        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4, pt: { xs: 2, sm: 2.5 } }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${primaryLight}`,
              bgcolor: "rgba(255,255,255,0.98)",
              overflow: "hidden",
            }}
          >
            <Tabs
              value={tab}
              onChange={handleTabChange}
              sx={{
                px: 2,
                pt: 1,
                borderBottom: `1px solid ${primaryLight}`,
                "& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
                "& .Mui-selected": { color: `${primaryDark} !important` },
                "& .MuiTabs-indicator": { bgcolor: primaryRed },
              }}
            >
              <Tab label="Lessons" />
              <Tab label="Exams" />
            </Tabs>

            <Box sx={{ px: 2, pb: 3 }}>
              <TabPanel value={tab} index={0}>
                {lessonsError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLessonsError(null)}>
                    {lessonsError}
                  </Alert>
                )}
                {lessonsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress sx={{ color: primaryRed }} size={36} />
                  </Box>
                ) : totalLessons === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No lesson timetables for this date yet. Use <strong>Create lesson timetable</strong> to add curriculum,
                    class, term, subject, teacher, and times—they will show here.
                  </Typography>
                ) : (
                  <>
                    <TableContainer sx={{ borderRadius: 1, border: `1px solid ${primaryLight}`, overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 960 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: `${primaryRed}12` }}>
                            <TableCell width={52}>No.</TableCell>
                            <TableCell>Curriculum</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Term</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell align="center">Delivery</TableCell>
                            <TableCell>Teacher</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell align="center">Attendance</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lessons.map((row, idx) => {
                            const cc = row.timetable?.curriculum_class;
                            const cur = cc?.curriculum;
                            const term = row.timetable?.curriculum_class_level;
                            const ids = lessonRouteIds(row);
                            const canAct = !!(ids.curriculumId && ids.classId && ids.timetableId && ids.lessonId);
                            const rowNo = page * rowsPerPage + idx + 1;
                            const att = !!row.teacher_attended;
                            const onlineLesson = row.delivery_mode === "online";
                            return (
                              <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                                <TableCell>{rowNo}</TableCell>
                                <TableCell>{cur?.name || "—"}</TableCell>
                                <TableCell>{cc ? `${cc.name}${cc.code ? ` (${cc.code})` : ""}` : "—"}</TableCell>
                                <TableCell>{term?.name || "—"}</TableCell>
                                <TableCell>{row.curriculum_subject?.name || "—"}</TableCell>
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
                                <TableCell>{row.teacher ? teacherLabel(row.teacher) : "—"}</TableCell>
                                <TableCell>{formatTimeRange(row.starts_at, row.ends_at)}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    size="small"
                                    label={att ? "Attended" : "Pending"}
                                    color={att ? "success" : "default"}
                                    variant={att ? "filled" : "outlined"}
                                    sx={{
                                      fontWeight: 700,
                                      ...(att
                                        ? {}
                                        : { borderColor: "#d1d5db", color: "text.secondary", bgcolor: "transparent" }),
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center">
                                    <Tooltip title="View">
                                      <span>
                                        <IconButton
                                          size="small"
                                          aria-label="View lesson"
                                          onClick={() => setViewLesson(row)}
                                          sx={{ color: primaryDark }}
                                        >
                                          <VisibilityOutlinedIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Edit">
                                      <span>
                                        <IconButton
                                          size="small"
                                          aria-label="Edit lesson"
                                          disabled={!canAct}
                                          onClick={() => openEdit(row)}
                                          sx={{ color: primaryDark }}
                                        >
                                          <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <span>
                                        <IconButton
                                          size="small"
                                          aria-label="Delete lesson"
                                          disabled={!canAct}
                                          onClick={() => setDeleteLesson(row)}
                                          sx={{ color: primaryRed }}
                                        >
                                          <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      count={totalLessons}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      sx={{
                        borderTop: `1px solid ${primaryLight}`,
                        "& .MuiTablePagination-toolbar": { px: 1 },
                      }}
                    />
                  </>
                )}
              </TabPanel>

              <TabPanel value={tab} index={1}>
                <Typography variant="body2" color="text.secondary">
                  Exam calendar and invigilation views are not wired here yet. Use the main calendar above to track dates;
                  exam sessions can be linked from the exams module when available.
                </Typography>
              </TabPanel>
            </Box>
          </Paper>
        </Box>

        <Dialog
          open={!!viewLesson && !!vr}
          onClose={() => setViewLesson(null)}
          maxWidth="md"
          fullWidth
          aria-labelledby="lesson-view-title"
          PaperProps={{ sx: dialogPaperSx }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 72%, #f97316 160%)`,
              color: "#fff",
              px: 3,
              py: 2.5,
              position: "relative",
            }}
          >
            <IconButton
              aria-label="Close"
              onClick={() => setViewLesson(null)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.12)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ pr: 5 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.35)",
                }}
              >
                <MenuBookOutlinedIcon sx={{ fontSize: 30 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
                  Lesson overview
                </Typography>
                <Typography id="lesson-view-title" variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                  {vr?.subject}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
                  {vr?.dateLabel}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", sm: "flex" } }}>
                <Chip
                  label={vr?.deliveryOnline ? "Online" : "Physical"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: vr?.deliveryOnline ? "rgba(199,210,254,0.95)" : "rgba(255,255,255,0.2)",
                    color: vr?.deliveryOnline ? "#3730a3" : "#fff",
                    border: vr?.deliveryOnline ? "none" : "1px solid rgba(255,255,255,0.35)",
                  }}
                />
                <Chip
                  label={vr?.attended ? "Teacher attended" : "Attendance pending"}
                  sx={{
                    fontWeight: 800,
                    bgcolor: vr?.attended ? "rgba(220,252,231,0.95)" : "rgba(255,255,255,0.2)",
                    color: vr?.attended ? "#166534" : "#fff",
                    border: vr?.attended ? "none" : "1px solid rgba(255,255,255,0.35)",
                  }}
                />
              </Stack>
            </Stack>
          </Box>
          <DialogContent sx={{ p: 3, bgcolor: "#fafafa" }}>
            <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 1, flexWrap: "wrap", mb: 2 }}>
              <Chip size="small" label={vr?.deliveryOnline ? "Online class" : "Physical class"} sx={{ fontWeight: 700 }} />
              <Chip
                size="small"
                label={vr?.attended ? "Teacher attended" : "Attendance pending"}
                color={vr?.attended ? "success" : "default"}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
              {vr?.tiles?.map((t) => (
                <Box key={t.label} sx={{ flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 8px)" }, minWidth: { sm: 240 } }}>
                  <DetailTile icon={t.icon} label={t.label} value={t.value} />
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#fff", borderTop: `1px solid ${primaryLight}` }}>
            <Button
              variant="contained"
              onClick={() => setViewLesson(null)}
              sx={{ bgcolor: primaryRed, fontWeight: 800, "&:hover": { bgcolor: primaryDark }, px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!deleteLesson}
          onClose={() => !deleteDoing && setDeleteLesson(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: dialogPaperSx }}
        >
          <Box sx={{ height: 4, background: `linear-gradient(90deg, ${primaryDark}, ${primaryRed})` }} />
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: primaryDark, mb: 1 }}>
              Delete this lesson?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This removes the slot for{" "}
              {deleteLesson?.curriculum_subject?.name ? (
                <strong>{deleteLesson.curriculum_subject.name}</strong>
              ) : (
                "this subject"
              )}{" "}
              from the timetable. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteLesson(null)} disabled={deleteDoing}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={deleteDoing}
              onClick={confirmDelete}
              startIcon={deleteDoing ? <CircularProgress color="inherit" size={18} /> : null}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!editLesson}
          onClose={() => !editSaving && closeEdit()}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogPaperSx }}
          aria-labelledby="lesson-edit-title"
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 85%)`,
              color: "#fff",
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 44, height: 44 }}>
                <EditOutlinedIcon />
              </Avatar>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.9 }}>
                  Update lesson
                </Typography>
                <Typography id="lesson-edit-title" variant="h6" sx={{ fontWeight: 900 }}>
                  Edit scheduled lesson
                </Typography>
              </Box>
            </Stack>
            <IconButton aria-label="Close" onClick={() => !editSaving && closeEdit()} sx={{ color: "#fff" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ bgcolor: "#fafafa", pt: 2.5 }}>
            {editDialogError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setEditDialogError(null)}>
                {editDialogError}
              </Alert>
            )}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: primaryLight, bgcolor: "#fff" }}>
              <Stack spacing={2.25}>
                <TextField
                  label="Lesson date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editForm.lesson_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, lesson_date: e.target.value }))}
                  sx={outlinedFieldSx}
                />
                <TextField
                  select
                  required
                  label="Subject offering"
                  fullWidth
                  value={editForm.curriculum_subject_id}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, curriculum_subject_id: e.target.value, teacher_id: "" }))
                  }
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select</em>
                  </MenuItem>
                  {editSubjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Teacher"
                  fullWidth
                  disabled={!editForm.curriculum_subject_id}
                  value={editForm.teacher_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, teacher_id: e.target.value }))}
                  helperText={editForm.curriculum_subject_id ? "Teachers assigned to this subject" : "Choose a subject first"}
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {editTeachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {teacherLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TimePicker
                    label="Start"
                    ampm
                    value={editForm.startTime}
                    onChange={(v) => setEditForm((f) => ({ ...f, startTime: v }))}
                    slotProps={{ textField: { fullWidth: true, sx: outlinedFieldSx } }}
                  />
                  <TimePicker
                    label="End"
                    ampm
                    value={editForm.endTime}
                    onChange={(v) => setEditForm((f) => ({ ...f, endTime: v }))}
                    slotProps={{ textField: { fullWidth: true, sx: outlinedFieldSx } }}
                  />
                </Stack>
                <TextField
                  select
                  label="Lesson delivery"
                  fullWidth
                  value={editForm.delivery_mode}
                  onChange={(e) => setEditForm((f) => ({ ...f, delivery_mode: e.target.value }))}
                  helperText="Online for remote / video sessions; physical for in-room teaching."
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="physical">Physical (in classroom)</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </TextField>
                <TextField
                  label="Room"
                  fullWidth
                  value={editForm.room}
                  onChange={(e) => setEditForm((f) => ({ ...f, room: e.target.value }))}
                  helperText={editForm.delivery_mode === "online" ? "Optional — add a meeting link label if useful." : "Classroom or venue"}
                  sx={outlinedFieldSx}
                />
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${primaryRed}08`,
                    border: `1px dashed ${primaryLight}`,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editForm.teacher_attended}
                        onChange={(e) => setEditForm((f) => ({ ...f, teacher_attended: e.target.checked }))}
                        sx={{
                          color: primaryRed,
                          "&.Mui-checked": { color: primaryRed },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={800} color={primaryDark}>
                          Teacher attended
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check when the assigned teacher was present for this lesson slot.
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Stack>
            </Paper>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#fff", borderTop: `1px solid ${primaryLight}`, gap: 1 }}>
            <Button onClick={closeEdit} disabled={editSaving} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={editSaving}
              onClick={submitEdit}
              sx={{ bgcolor: primaryRed, fontWeight: 800, "&:hover": { bgcolor: primaryDark }, px: 3 }}
              startIcon={editSaving ? <CircularProgress size={18} color="inherit" /> : null}
            >
              Save changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
