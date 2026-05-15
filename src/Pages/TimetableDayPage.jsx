import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
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
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { format, isValid, parseISO } from "date-fns";
import Swal from "sweetalert2";
import { showTeacherOverlapSweetAlert } from "../utils/timetableOverlapAlert";
import OnlineLessonLiveDialog from "../components/OnlineHub/OnlineLessonLiveDialog";
import OnlineExamLiveDialog from "../components/OnlineHub/OnlineExamLiveDialog";

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

function formatLessonMediaMode(raw) {
  const s = raw == null ? "optional" : String(raw).trim().toLowerCase();
  if (s === "video") return "Video class — camera and microphone on when joining";
  if (s === "audio") return "Audio class — microphone on when joining";
  return "Optional — camera and microphone off until turned on";
}

function lessonMediaModeChipLabel(raw) {
  const s = raw == null ? "optional" : String(raw).trim().toLowerCase();
  if (s === "video") return "Video";
  if (s === "audio") return "Audio";
  return "Optional";
}

function lessonMediaModeIcon(raw) {
  const s = raw == null ? "optional" : String(raw).trim().toLowerCase();
  if (s === "audio") return <MicRoundedIcon fontSize="small" />;
  return <VideocamOutlinedIcon fontSize="small" />;
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
  const [examSchedules, setExamSchedules] = useState([]);
  const [examSchedulesLoading, setExamSchedulesLoading] = useState(true);
  const [examSchedulesError, setExamSchedulesError] = useState(null);
  const [examDeleteRow, setExamDeleteRow] = useState(null);
  const [examDeleteDoing, setExamDeleteDoing] = useState(false);
  const [examViewRow, setExamViewRow] = useState(null);
  const [examEditRow, setExamEditRow] = useState(null);
  const [examLinksOpen, setExamLinksOpen] = useState(false);
  const [examLinksRow, setExamLinksRow] = useState(null);

  const [examCreateOpen, setExamCreateOpen] = useState(false);
  const [examCreateSaving, setExamCreateSaving] = useState(false);
  const [examCreateError, setExamCreateError] = useState(null);
  const [examCreateLookupsLoading, setExamCreateLookupsLoading] = useState(false);
  const [examLookupCurricula, setExamLookupCurricula] = useState([]);
  const [examLookupClasses, setExamLookupClasses] = useState([]);
  const [examLookupLevels, setExamLookupLevels] = useState([]);
  const [examLookupExams, setExamLookupExams] = useState([]);
  const [examLookupTeachers, setExamLookupTeachers] = useState([]);
  const [examForm, setExamForm] = useState({
    exam_id: "",
    curriculum_id: "",
    curriculum_class_id: "",
    curriculum_class_level_id: "",
    teacher_id: "",
    startTime: null,
    endTime: null,
    timezone: "Africa/Nairobi",
    status: "scheduled",
    is_active: true,
    allow_late_join_minutes: 10,
    max_attempts: "",
    requires_webcam: null,
    prevent_tab_switch: null,
    proctoring_mode: "live_monitor",
    meeting_provider: "",
    meeting_join_url: "",
    meeting_host_url: "",
    exam_access_policy: "paper_only",
  });

  const [viewLesson, setViewLesson] = useState(null);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [editSubjects, setEditSubjects] = useState([]);
  const [editTeachers, setEditTeachers] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editDialogError, setEditDialogError] = useState(null);
  const [deleteDoing, setDeleteDoing] = useState(false);
  const [onlineLiveDlg, setOnlineLiveDlg] = useState({
    open: false,
    lessonId: null,
    subtitle: "",
    curriculumClassId: null,
    curriculumClassLabel: "",
  });

  const [editForm, setEditForm] = useState({
    lesson_date: "",
    curriculum_subject_id: "",
    teacher_id: "",
    startTime: null,
    endTime: null,
    room: "",
    delivery_mode: "physical",
    media_mode: "optional",
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

  const loadExamSchedules = useCallback(async () => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setExamSchedulesError("Please sign in again.");
      setExamSchedules([]);
      setExamSchedulesLoading(false);
      return;
    }
    setExamSchedulesLoading(true);
    setExamSchedulesError(null);
    try {
      const q = `date=${encodeURIComponent(isoDate)}&limit=300`;
      const res = await fetch(`/api/exam-schedules?${q}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load exam schedules");
      setExamSchedules(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setExamSchedulesError(e.message || "Failed to load exam schedules.");
      setExamSchedules([]);
    } finally {
      setExamSchedulesLoading(false);
    }
  }, [isoDate]);

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
        media_mode: row.media_mode === "video" || row.media_mode === "audio" ? row.media_mode : "optional",
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
    if (parsed && tab === 1) loadExamSchedules();
  }, [parsed, tab, loadExamSchedules]);

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
        ...(editForm.delivery_mode === "online" ? { media_mode: editForm.media_mode || "optional" } : {}),
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

  const openCreateExamSchedule = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setExamEditRow(null);
    setExamCreateOpen(true);
    setExamCreateError(null);
    setExamCreateLookupsLoading(true);
    try {
      const [currRes, examsRes] = await Promise.all([
        fetch("/api/curricula", { headers: authHeaders(token) }),
        fetch("/api/exams?page=1&limit=300", { headers: authHeaders(token) }),
      ]);
      const [currJson, examsJson] = await Promise.all([currRes.json().catch(() => ({})), examsRes.json().catch(() => ({}))]);
      if (!currRes.ok || !currJson.success) throw new Error(currJson.message || "Could not load curricula");
      if (!examsRes.ok || !examsJson.success) throw new Error(examsJson.message || "Could not load exams");
      setExamLookupCurricula(Array.isArray(currJson.data) ? currJson.data : []);
      setExamLookupExams(Array.isArray(examsJson.data) ? examsJson.data : []);
      setExamLookupClasses([]);
      setExamLookupLevels([]);
      setExamLookupTeachers([]);
      setExamForm((f) => ({
        ...f,
        exam_id: "",
        curriculum_id: "",
        curriculum_class_id: "",
        curriculum_class_level_id: "",
        teacher_id: "",
        startTime: dayjs(`${isoDate}T08:00:00`),
        endTime: dayjs(`${isoDate}T10:00:00`),
      }));
    } catch (e) {
      setExamCreateError(e.message || "Failed to load form.");
    } finally {
      setExamCreateLookupsLoading(false);
    }
  };

  const openEditExamSchedule = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setExamEditRow(row);
    setExamCreateOpen(true);
    setExamCreateError(null);
    setExamCreateLookupsLoading(true);
    try {
      const [currRes, examsRes] = await Promise.all([
        fetch("/api/curricula", { headers: authHeaders(token) }),
        fetch("/api/exams?page=1&limit=300", { headers: authHeaders(token) }),
      ]);
      const [currJson, examsJson] = await Promise.all([currRes.json().catch(() => ({})), examsRes.json().catch(() => ({}))]);
      if (!currRes.ok || !currJson.success) throw new Error(currJson.message || "Could not load curricula");
      if (!examsRes.ok || !examsJson.success) throw new Error(examsJson.message || "Could not load exams");
      setExamLookupCurricula(Array.isArray(currJson.data) ? currJson.data : []);
      setExamLookupExams(Array.isArray(examsJson.data) ? examsJson.data : []);
    } catch (e) {
      setExamCreateError(e.message || "Failed to load form.");
    } finally {
      setExamCreateLookupsLoading(false);
    }
    setExamForm((f) => ({
      ...f,
      exam_id: row?.exam_id || "",
      curriculum_id: row?.curriculum_id || "",
      curriculum_class_id: row?.curriculum_class_id || "",
      curriculum_class_level_id: row?.curriculum_class_level_id || "",
      teacher_id: row?.teacher_id || "",
      startTime: row?.start_time ? dayjs(row.start_time) : dayjs(`${isoDate}T08:00:00`),
      endTime: row?.end_time ? dayjs(row.end_time) : dayjs(`${isoDate}T10:00:00`),
      timezone: row?.timezone || "Africa/Nairobi",
      status: row?.status || "scheduled",
      is_active: row?.is_active !== false,
      allow_late_join_minutes: row?.allow_late_join_minutes ?? 10,
      max_attempts: row?.max_attempts ?? "",
        requires_webcam: row?.requires_webcam == null ? null : !!row?.requires_webcam,
        prevent_tab_switch: row?.prevent_tab_switch == null ? null : !!row?.prevent_tab_switch,
      proctoring_mode: row?.proctoring_mode || "live_monitor",
      meeting_provider: row?.meeting_provider || "",
      meeting_join_url: row?.meeting_join_url || "",
      meeting_host_url: row?.meeting_host_url || "",
      exam_access_policy:
        row?.proctoring_rules_json?.exam_access_policy === "paper_plus_room_required"
          ? "paper_plus_room_required"
          : "paper_only",
    }));
  };

  const openExamLinks = (row) => {
    setExamLinksRow(row);
    setExamLinksOpen(true);
  };

  useEffect(() => {
    if (!examCreateOpen || !examForm.curriculum_id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/curricula/${examForm.curriculum_id}/classes`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load classes");
        if (!cancelled) setExamLookupClasses(Array.isArray(data.data) ? data.data : []);
      } catch {
        if (!cancelled) setExamLookupClasses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examCreateOpen, examForm.curriculum_id]);

  useEffect(() => {
    if (!examCreateOpen || !examForm.curriculum_id || !examForm.curriculum_class_id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [lvRes, tRes] = await Promise.all([
          fetch(
            `/api/curricula/${examForm.curriculum_id}/classes/${examForm.curriculum_class_id}/levels`,
            { headers: authHeaders(token) }
          ),
          fetch(`/api/teachers?page=1&limit=500`, { headers: authHeaders(token) }),
        ]);
        const [lvJson, tJson] = await Promise.all([lvRes.json().catch(() => ({})), tRes.json().catch(() => ({}))]);
        if (!cancelled) {
          const allTeachers = tRes.ok && tJson.success && Array.isArray(tJson.data) ? tJson.data : [];
          const filteredTeachers = allTeachers.filter((t) => {
            const curriculumOk =
              Array.isArray(t?.teaching_curricula) &&
              t.teaching_curricula.some((c) => c?.id === examForm.curriculum_id);
            const classOk =
              Array.isArray(t?.teaching_curriculum_classes) &&
              t.teaching_curriculum_classes.some((c) => c?.id === examForm.curriculum_class_id);
            return curriculumOk || classOk;
          });
          setExamLookupLevels(lvRes.ok && lvJson.success && Array.isArray(lvJson.data) ? lvJson.data : []);
          setExamLookupTeachers(filteredTeachers.length ? filteredTeachers : allTeachers);
          if (examForm.teacher_id) {
            const exists = (filteredTeachers.length ? filteredTeachers : allTeachers).some((t) => t.id === examForm.teacher_id);
            if (!exists) setExamForm((f) => ({ ...f, teacher_id: "" }));
          }
        }
      } catch {
        if (!cancelled) {
          setExamLookupLevels([]);
          setExamLookupTeachers([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examCreateOpen, examForm.curriculum_id, examForm.curriculum_class_id, examForm.teacher_id]);

  const submitCreateExamSchedule = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!examForm.exam_id || !examForm.curriculum_id || !examForm.curriculum_class_id || !examForm.teacher_id) {
      setExamCreateError("Exam, curriculum, class and teacher are required.");
      return;
    }
    const startStr = formatTimeForApi(examForm.startTime);
    const endStr = formatTimeForApi(examForm.endTime);
    if (!startStr || !endStr) {
      setExamCreateError("Start and end time are required.");
      return;
    }
    setExamCreateSaving(true);
    setExamCreateError(null);
    try {
      const body = {
        exam_id: examForm.exam_id,
        curriculum_id: examForm.curriculum_id,
        curriculum_class_id: examForm.curriculum_class_id,
        curriculum_class_level_id: examForm.curriculum_class_level_id || null,
        teacher_id: examForm.teacher_id,
        start_time: `${isoDate}T${startStr}`,
        end_time: `${isoDate}T${endStr}`,
        timezone: examForm.timezone || "Africa/Nairobi",
        status: examForm.status || "scheduled",
        is_active: !!examForm.is_active,
        allow_late_join_minutes: Number(examForm.allow_late_join_minutes || 10),
        max_attempts: examForm.max_attempts === "" ? null : Number(examForm.max_attempts),
        requires_webcam: examForm.requires_webcam,
        prevent_tab_switch: examForm.prevent_tab_switch,
        proctoring_mode: examForm.proctoring_mode || "none",
        meeting_provider: examForm.meeting_provider || null,
        meeting_join_url: examForm.meeting_join_url || null,
        meeting_host_url: examForm.meeting_host_url || null,
        proctoring_rules_json: {
          exam_access_policy:
            examForm.exam_access_policy === "paper_plus_room_required"
              ? "paper_plus_room_required"
              : "paper_only",
        },
      };
      const res = await fetch(examEditRow ? `/api/exam-schedules/${examEditRow.id}` : "/api/exam-schedules", {
        method: examEditRow ? "PUT" : "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || (examEditRow ? "Could not update exam schedule" : "Could not create exam schedule"));
      }
      setExamCreateOpen(false);
      setExamEditRow(null);
      await loadExamSchedules();
      await Swal.fire({
        icon: "success",
        title: examEditRow ? "Exam schedule updated" : "Exam schedule created",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e) {
      setExamCreateError(e.message || "Create failed.");
    } finally {
      setExamCreateSaving(false);
    }
  };

  const confirmDeleteExamSchedule = async () => {
    if (!examDeleteRow) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setExamDeleteDoing(true);
    try {
      const res = await fetch(`/api/exam-schedules/${examDeleteRow.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      setExamDeleteRow(null);
      await loadExamSchedules();
      await Swal.fire({ icon: "success", title: "Exam schedule removed", timer: 1800, showConfirmButton: false });
    } catch (e) {
      setExamSchedulesError(e.message || "Delete failed.");
      setExamDeleteRow(null);
    } finally {
      setExamDeleteDoing(false);
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
      mediaMode: online ? row.media_mode : null,
      tiles: [
        {
          icon: online ? <VideocamOutlinedIcon fontSize="small" /> : <MeetingRoomOutlinedIcon fontSize="small" />,
          label: "Delivery",
          value: online ? "Online class" : "Physical class",
        },
        ...(online
          ? [
              {
                icon: lessonMediaModeIcon(row.media_mode),
                label: "Online media",
                value: formatLessonMediaMode(row.media_mode),
              },
            ]
          : []),
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
              onClick={() => {
                if (tab === 1) {
                  void openCreateExamSchedule();
                } else {
                  navigate(`/timetable/create?date=${isoDate}`);
                }
              }}
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
              {tab === 1 ? "Create exam schedule" : "Create lesson timetable"}
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
                                    icon={att ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
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
                                    {onlineLesson ? (
                                      <Tooltip title="Meeting links (host / join)">
                                        <span>
                                          <IconButton
                                            size="small"
                                            aria-label="Open online meeting links"
                                            onClick={() => {
                                              const cc = row.timetable?.curriculum_class;
                                              const ccLabel = cc ? `${cc.name || ""}${cc.code ? ` (${cc.code})` : ""}`.trim() : "";
                                              setOnlineLiveDlg({
                                                open: true,
                                                lessonId: row.id,
                                                subtitle: `${row.curriculum_subject?.name || "Lesson"} · ${row.lesson_date || isoDate || ""}`,
                                                curriculumClassId: cc?.id ?? null,
                                                curriculumClassLabel: ccLabel,
                                              });
                                            }}
                                            sx={{ color: primaryDark }}
                                          >
                                            <VideocamOutlinedIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    ) : null}
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
                {examSchedulesError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExamSchedulesError(null)}>
                    {examSchedulesError}
                  </Alert>
                )}
                {examSchedulesLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress sx={{ color: primaryRed }} size={36} />
                  </Box>
                ) : examSchedules.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No exam schedules for this date yet. Use <strong>Create exam schedule</strong> to add one.
                  </Typography>
                ) : (
                  <TableContainer sx={{ borderRadius: 1, border: `1px solid ${primaryLight}`, overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 960 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: `${primaryRed}12` }}>
                          <TableCell width={52}>No.</TableCell>
                          <TableCell>Exam</TableCell>
                          <TableCell>Curriculum</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Term</TableCell>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Proctoring</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {examSchedules.map((row, idx) => (
                          <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{row.exam?.title || "—"}</TableCell>
                            <TableCell>{row.curriculum?.name || "—"}</TableCell>
                            <TableCell>{row.curriculum_class?.name || "—"}</TableCell>
                            <TableCell>{row.curriculum_class_level?.name || "—"}</TableCell>
                            <TableCell>{row.teacher ? teacherLabel(row.teacher) : "—"}</TableCell>
                            <TableCell>
                              {row.start_time && row.end_time
                                ? `${format(new Date(row.start_time), "HH:mm")} – ${format(new Date(row.end_time), "HH:mm")}`
                                : "—"}
                            </TableCell>
                            <TableCell>{row.status || "—"}</TableCell>
                            <TableCell>{row.proctoring_mode || "none"}</TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center">
                                <Tooltip title="View">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="View exam schedule"
                                      onClick={() => setExamViewRow(row)}
                                      sx={{ color: primaryDark }}
                                    >
                                      <VisibilityOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Meeting links / go live">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Manage exam links"
                                      onClick={() => openExamLinks(row)}
                                      sx={{ color: primaryDark }}
                                    >
                                      <VideocamOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Edit">
                                  <span>
                                    <IconButton
                                      size="small"
                                      aria-label="Edit exam schedule"
                                      onClick={() => openEditExamSchedule(row)}
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
                                      aria-label="Delete exam schedule"
                                      onClick={() => setExamDeleteRow(row)}
                                      sx={{ color: primaryRed }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </Box>
          </Paper>
        </Box>

        <Dialog
          open={examCreateOpen}
          onClose={() => {
            if (!examCreateSaving) {
              setExamCreateOpen(false);
              setExamEditRow(null);
            }
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: dialogPaperSx }}
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
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {examEditRow ? "Edit exam schedule" : "Create exam schedule"}
            </Typography>
            <IconButton
              aria-label="Close"
              onClick={() => {
                if (!examCreateSaving) {
                  setExamCreateOpen(false);
                  setExamEditRow(null);
                }
              }}
              sx={{ color: "#fff" }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ bgcolor: "#fafafa", pt: 2.5 }}>
            {examCreateError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setExamCreateError(null)}>
                {examCreateError}
              </Alert>
            )}
            {examCreateLookupsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress sx={{ color: primaryRed }} />
              </Box>
            ) : (
              <Stack spacing={2}>
                <TextField select label="Exam" value={examForm.exam_id} onChange={(e) => setExamForm((f) => ({ ...f, exam_id: e.target.value }))} sx={outlinedFieldSx}>
                  <MenuItem value=""><em>Select exam</em></MenuItem>
                  {examLookupExams.map((e) => (
                    <MenuItem key={e.id} value={e.id}>{e.title || e.name || "Exam"}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Curriculum" value={examForm.curriculum_id} onChange={(e) => setExamForm((f) => ({ ...f, curriculum_id: e.target.value, curriculum_class_id: "", curriculum_class_level_id: "" }))} sx={outlinedFieldSx}>
                  <MenuItem value=""><em>Select curriculum</em></MenuItem>
                  {examLookupCurricula.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Class" value={examForm.curriculum_class_id} onChange={(e) => setExamForm((f) => ({ ...f, curriculum_class_id: e.target.value, curriculum_class_level_id: "" }))} sx={outlinedFieldSx}>
                  <MenuItem value=""><em>Select class</em></MenuItem>
                  {examLookupClasses.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}{c.code ? ` (${c.code})` : ""}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Term (optional)" value={examForm.curriculum_class_level_id} onChange={(e) => setExamForm((f) => ({ ...f, curriculum_class_level_id: e.target.value }))} sx={outlinedFieldSx}>
                  <MenuItem value=""><em>None</em></MenuItem>
                  {examLookupLevels.map((l) => (
                    <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Teacher / proctor owner" value={examForm.teacher_id} onChange={(e) => setExamForm((f) => ({ ...f, teacher_id: e.target.value }))} sx={outlinedFieldSx}>
                  <MenuItem value=""><em>Select teacher</em></MenuItem>
                  {examLookupTeachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{teacherLabel(t)}</MenuItem>
                  ))}
                </TextField>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TimePicker label="Start time" ampm value={examForm.startTime} onChange={(v) => setExamForm((f) => ({ ...f, startTime: v }))} slotProps={{ textField: { fullWidth: true, sx: outlinedFieldSx } }} />
                  <TimePicker label="End time" ampm value={examForm.endTime} onChange={(v) => setExamForm((f) => ({ ...f, endTime: v }))} slotProps={{ textField: { fullWidth: true, sx: outlinedFieldSx } }} />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Schedule status"
                    value={examForm.status}
                    onChange={(e) => setExamForm((f) => ({ ...f, status: e.target.value }))}
                    sx={{ ...outlinedFieldSx, flex: 1 }}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="live">Live</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Active"
                    value={examForm.is_active ? "true" : "false"}
                    onChange={(e) => setExamForm((f) => ({ ...f, is_active: e.target.value === "true" }))}
                    sx={{ ...outlinedFieldSx, flex: 1 }}
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </TextField>
                </Stack>
                <TextField select label="Proctoring mode" value={examForm.proctoring_mode} onChange={(e) => setExamForm((f) => ({ ...f, proctoring_mode: e.target.value }))} sx={outlinedFieldSx}>
                  <MenuItem value="none">No monitoring</MenuItem>
                  <MenuItem value="record_only">Record activity only</MenuItem>
                  <MenuItem value="live_monitor">Live invigilation (teacher monitors)</MenuItem>
                  <MenuItem value="strict_auto">Strict auto-monitoring</MenuItem>
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                  Monitoring level for this exam window. Camera/tab-switch rules apply on top of this mode.
                </Typography>
                {examForm.proctoring_mode === "strict_auto" ? (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Strict auto mode can close exams automatically on rule breach. If tab-switch rule is enabled with zero tolerance, a single tab switch closes the exam.
                  </Alert>
                ) : null}
                <TextField
                  select
                  label="Exam access"
                  value={examForm.exam_access_policy}
                  onChange={(e) => setExamForm((f) => ({ ...f, exam_access_policy: e.target.value }))}
                  helperText="Choose whether students can open only the paper, or must first open invigilation room."
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="paper_only">Paper only</MenuItem>
                  <MenuItem value="paper_plus_room_required">Paper + invigilation room required</MenuItem>
                </TextField>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    select
                    label="Webcam rule"
                    value={examForm.requires_webcam === null ? "inherit" : examForm.requires_webcam ? "yes" : "no"}
                    onChange={(e) =>
                      setExamForm((f) => ({
                        ...f,
                        requires_webcam: e.target.value === "inherit" ? null : e.target.value === "yes",
                      }))
                    }
                    helperText="Inherit uses exam-level setting from exam creation."
                    sx={{ ...outlinedFieldSx, flex: 1 }}
                  >
                    <MenuItem value="inherit">Inherit from exam</MenuItem>
                    <MenuItem value="yes">Force Yes</MenuItem>
                    <MenuItem value="no">Force No</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Tab-switch rule"
                    value={examForm.prevent_tab_switch === null ? "inherit" : examForm.prevent_tab_switch ? "yes" : "no"}
                    onChange={(e) =>
                      setExamForm((f) => ({
                        ...f,
                        prevent_tab_switch: e.target.value === "inherit" ? null : e.target.value === "yes",
                      }))
                    }
                    helperText="Inherit uses exam-level setting from exam creation."
                    sx={{ ...outlinedFieldSx, flex: 1 }}
                  >
                    <MenuItem value="inherit">Inherit from exam</MenuItem>
                    <MenuItem value="yes">Force Yes</MenuItem>
                    <MenuItem value="no">Force No</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#fff", borderTop: `1px solid ${primaryLight}` }}>
            <Button
              onClick={() => {
                setExamCreateOpen(false);
                setExamEditRow(null);
              }}
              disabled={examCreateSaving}
            >
              Cancel
            </Button>
            <Button variant="contained" onClick={submitCreateExamSchedule} disabled={examCreateSaving} sx={{ bgcolor: primaryRed, fontWeight: 800, "&:hover": { bgcolor: primaryDark } }}>
              {examCreateSaving ? <CircularProgress size={18} color="inherit" /> : examEditRow ? "Save changes" : "Save exam schedule"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!examViewRow}
          onClose={() => setExamViewRow(null)}
          maxWidth="sm"
          fullWidth
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
              onClick={() => setExamViewRow(null)}
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
            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 2 }}>
              Exam schedule overview
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              {examViewRow?.exam?.title || "Exam"}
            </Typography>
          </Box>
          <DialogContent sx={{ bgcolor: "#fafafa", pt: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`Status: ${examViewRow?.status || "—"}`} />
                <Chip size="small" label={`Monitoring: ${examViewRow?.proctoring_mode || "none"}`} />
                <Chip size="small" label={examViewRow?.is_active ? "Active" : "Inactive"} color={examViewRow?.is_active ? "success" : "default"} />
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Curriculum:</strong> {examViewRow?.curriculum?.name || "—"}</Typography>
                <Typography variant="body2"><strong>Class:</strong> {examViewRow?.curriculum_class?.name || "—"}</Typography>
                <Typography variant="body2"><strong>Term:</strong> {examViewRow?.curriculum_class_level?.name || "—"}</Typography>
                <Typography variant="body2"><strong>Teacher:</strong> {examViewRow?.teacher ? teacherLabel(examViewRow.teacher) : "—"}</Typography>
                <Typography variant="body2">
                  <strong>Time:</strong>{" "}
                  {examViewRow?.start_time && examViewRow?.end_time
                    ? `${format(new Date(examViewRow.start_time), "yyyy-MM-dd HH:mm")} – ${format(
                        new Date(examViewRow.end_time),
                        "HH:mm"
                      )}`
                    : "—"}
                </Typography>
                <Typography variant="body2"><strong>Timezone:</strong> {examViewRow?.timezone || "—"}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Exam access policy:</strong>{" "}
                  {examViewRow?.proctoring_rules_json?.exam_access_policy === "paper_plus_room_required"
                    ? "Paper + invigilation room required"
                    : "Paper only"}
                </Typography>
                <Typography variant="body2"><strong>Requires webcam:</strong> {examViewRow?.requires_webcam == null ? "Inherit from exam" : examViewRow?.requires_webcam ? "Yes" : "No"}</Typography>
                <Typography variant="body2"><strong>Prevent tab switch:</strong> {examViewRow?.prevent_tab_switch == null ? "Inherit from exam" : examViewRow?.prevent_tab_switch ? "Yes" : "No"}</Typography>
                <Typography variant="body2"><strong>Allow late join (minutes):</strong> {examViewRow?.allow_late_join_minutes ?? "—"}</Typography>
                <Typography variant="body2"><strong>Max attempts override:</strong> {examViewRow?.max_attempts ?? "Exam default"}</Typography>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Meeting provider:</strong> {examViewRow?.meeting_provider || "—"}</Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}><strong>Join URL:</strong> {examViewRow?.meeting_join_url || "—"}</Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}><strong>Host URL:</strong> {examViewRow?.meeting_host_url || "—"}</Typography>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: "#fff", borderTop: `1px solid ${primaryLight}` }}>
            <Button variant="contained" onClick={() => setExamViewRow(null)} sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <OnlineExamLiveDialog
          open={examLinksOpen}
          onClose={() => {
            setExamLinksOpen(false);
            setExamLinksRow(null);
          }}
          examScheduleId={examLinksRow?.id || null}
          subtitle={`${examLinksRow?.exam?.title || "Online exam"} · ${isoDate || ""}`}
          onLinksReady={loadExamSchedules}
        />

        <Dialog
          open={!!examDeleteRow}
          onClose={() => !examDeleteDoing && setExamDeleteRow(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: dialogPaperSx }}
        >
          <Box sx={{ height: 4, background: `linear-gradient(90deg, ${primaryDark}, ${primaryRed})` }} />
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: primaryDark, mb: 1 }}>
              Delete this exam schedule?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This removes the exam schedule for this day. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setExamDeleteRow(null)} disabled={examDeleteDoing}>
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={examDeleteDoing}
              onClick={confirmDeleteExamSchedule}
              startIcon={examDeleteDoing ? <CircularProgress color="inherit" size={18} /> : null}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

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
                {vr?.deliveryOnline ? (
                  <Chip
                    label={lessonMediaModeChipLabel(vr.mediaMode)}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      bgcolor: "rgba(254,226,226,0.95)",
                      color: primaryDark,
                    }}
                  />
                ) : null}
                <Chip
                  label={vr?.attended ? "Teacher attended" : "Attendance pending"}
                  icon={vr?.attended ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
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
              {vr?.deliveryOnline ? (
                <Chip size="small" label={lessonMediaModeChipLabel(vr.mediaMode)} sx={{ fontWeight: 700 }} />
              ) : null}
              <Chip
                size="small"
                label={vr?.attended ? "Teacher attended" : "Attendance pending"}
                icon={vr?.attended ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
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
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      delivery_mode: e.target.value,
                      media_mode: e.target.value === "online" ? f.media_mode || "optional" : "optional",
                    }))
                  }
                  helperText="Online for remote / video sessions; physical for in-room teaching."
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="physical">Physical (in classroom)</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </TextField>
                {editForm.delivery_mode === "online" ? (
                  <TextField
                    select
                    label="Online media"
                    fullWidth
                    value={editForm.media_mode || "optional"}
                    onChange={(e) => setEditForm((f) => ({ ...f, media_mode: e.target.value }))}
                    helperText="Optional: join without camera/mic (recommended). Video class auto-starts camera — may prompt for permission."
                    sx={outlinedFieldSx}
                  >
                    <MenuItem value="optional">Optional — camera/mic off until user turns on</MenuItem>
                    <MenuItem value="audio">Audio class — microphone on when joining</MenuItem>
                    <MenuItem value="video">Video class — camera and microphone on when joining</MenuItem>
                  </TextField>
                ) : null}
                <TextField
                  label="Room"
                  fullWidth
                  value={editForm.room}
                  onChange={(e) => setEditForm((f) => ({ ...f, room: e.target.value }))}
                  helperText={editForm.delivery_mode === "online" ? "Optional — add a meeting link label if useful." : "Classroom or venue"}
                  sx={outlinedFieldSx}
                />
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
      <OnlineLessonLiveDialog
        open={onlineLiveDlg.open}
        onClose={() =>
          setOnlineLiveDlg({
            open: false,
            lessonId: null,
            subtitle: "",
            curriculumClassId: null,
            curriculumClassLabel: "",
          })
        }
        lessonId={onlineLiveDlg.lessonId}
        subtitle={onlineLiveDlg.subtitle}
        curriculumClassId={onlineLiveDlg.curriculumClassId}
        curriculumClassLabel={onlineLiveDlg.curriculumClassLabel}
        lessonDateIso={isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? isoDate : ""}
        onLinksReady={loadLessons}
      />
    </LocalizationProvider>
  );
}
