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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
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
import { showTeacherOverlapSweetAlert } from "../utils/timetableOverlapAlert";
import OnlineLessonLiveDialog from "../components/OnlineHub/OnlineLessonLiveDialog";
import { LESSON_SCHEDULE_TIMEZONE } from "../components/Exams/examScheduleTime";
import TimetableDayMeetingsPanel from "../components/Timetable/TimetableDayMeetingsPanel";
import {
  authHeaders,
  fullMainBleedSx,
  elimuViewportSx,
  warmCream,
  primaryRed,
  primaryDark,
  primaryLight,
  formatTimeRange,
  TIMETABLE_DAY_TABS,
} from "../components/Timetable/timetableShared";
import {
  TimetableHero,
  HeroActionButton,
  TimetableSubTabs,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  TimetableAttendanceChip,
  TimetableActionButton,
  TimetableDetailTile,
  timetableSwal,
  EmptyTableRow,
} from "../components/Timetable/timetableUi";

const backgroundLight = warmCream;

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

function teacherLabel(t) {
  const u = t?.user;
  return u?.full_name || u?.username || "—";
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

function DetailTile(props) {
  return <TimetableDetailTile {...props} />;
}

export default function TimetableDayPage() {
  const { isoDate } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromSearch = searchParams.get("tab");
  const [tab, setTab] = useState(() => (tabFromSearch === "meetings" ? 1 : 0));
  const [meetingCreateSignal, setMeetingCreateSignal] = useState(0);
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
    const tParam = searchParams.get("tab");
    const t = tParam === "meetings" ? 1 : 0;
    setTab(t);
  }, [isoDate, searchParams]);

  const handleTabChange = (v) => {
    setTab(v);
    const next = new URLSearchParams(searchParams);
    if (v === 1) next.set("tab", "meetings");
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
        timezone: LESSON_SCHEDULE_TIMEZONE,
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
      await timetableSwal({
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
      await timetableSwal({
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
          title={longLabel}
          subtitle={
            tab === 1
              ? "Staff meetings for this date. Admit participants when they join from Elimu Plus Online."
              : "Lessons for this date — mark teacher attendance when editing a lesson."
          }
          icon={<CalendarMonthIcon sx={{ fontSize: 28, color: "#fff" }} />}
          actions={
            <Stack direction="row" spacing={1}>
              <HeroActionButton startIcon={<ArrowBackIcon />} onClick={() => navigate("/timetable")}>
                Calendar
              </HeroActionButton>
              <HeroActionButton
                onClick={() => {
                  if (tab === 1) {
                    setMeetingCreateSignal((n) => n + 1);
                  } else {
                    navigate(`/timetable/create?date=${isoDate}`);
                  }
                }}
              >
                {tab === 1 ? "Schedule staff meeting" : "Create lesson"}
              </HeroActionButton>
            </Stack>
          }
        />

        <TimetableSubTabs activeTab={tab} onChange={handleTabChange} tabs={TIMETABLE_DAY_TABS} />

        {tab === 0 ? (
          <TabPanelShell
            loading={lessonsLoading}
            error={lessonsError}
            onDismissError={() => setLessonsError(null)}
          >
            {totalLessons === 0 && !lessonsLoading ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No lesson timetables for this date yet. Use <strong>Create lesson</strong> to add curriculum, class,
                term, subject, teacher, and times.
              </Typography>
            ) : (
              <DataTableShell
                pagination={
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
                    sx={tablePaginationSx}
                  />
                }
              >
                <Table size="small" sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow sx={tableHeadRowSx}>
                      <TableCell width={52}>No.</TableCell>
                      <TableCell>Curriculum</TableCell>
                      <TableCell>Class</TableCell>
                      <TableCell>Term</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Attendance</TableCell>
                      <TableCell align="center">Actions</TableCell>
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
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{rowNo}</TableCell>
                          <TableCell>{cur?.name || "—"}</TableCell>
                          <TableCell>{cc ? `${cc.name}${cc.code ? ` (${cc.code})` : ""}` : "—"}</TableCell>
                          <TableCell>{term?.name || "—"}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.curriculum_subject?.name || "—"}</TableCell>
                          <TableCell align="center">
                            <TimetableAttendanceChip attended={att} />
                          </TableCell>
                          <TableCell align="center">
                            <TimetableActionButton title="View" onClick={() => setViewLesson(row)}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </TimetableActionButton>
                            {onlineLesson ? (
                              <TimetableActionButton
                                title="Meeting links"
                                onClick={() => {
                                  const ccRow = row.timetable?.curriculum_class;
                                  const ccLabel = ccRow
                                    ? `${ccRow.name || ""}${ccRow.code ? ` (${ccRow.code})` : ""}`.trim()
                                    : "";
                                  setOnlineLiveDlg({
                                    open: true,
                                    lessonId: row.id,
                                    subtitle: `${row.curriculum_subject?.name || "Lesson"} · ${row.lesson_date || isoDate || ""}`,
                                    curriculumClassId: ccRow?.id ?? null,
                                    curriculumClassLabel: ccLabel,
                                  });
                                }}
                              >
                                <VideocamOutlinedIcon fontSize="small" />
                              </TimetableActionButton>
                            ) : null}
                            <TimetableActionButton
                              title="Edit"
                              disabled={!canAct}
                              onClick={() => openEdit(row)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </TimetableActionButton>
                            <TimetableActionButton
                              title="Delete"
                              color="error"
                              disabled={!canAct}
                              onClick={() => setDeleteLesson(row)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </TimetableActionButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </DataTableShell>
            )}
          </TabPanelShell>
        ) : (
          <TimetableDayMeetingsPanel isoDate={isoDate} openCreateSignal={meetingCreateSignal} />
        )}

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
