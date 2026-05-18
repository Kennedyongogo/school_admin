import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import BadgeIcon from "@mui/icons-material/Badge";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import DownloadIcon from "@mui/icons-material/Download";
import HRAdmissionsTab from "../components/HR/HRAdmissionsTab";
import HRNewsEventsTab from "../components/HR/HRNewsEventsTab";
import HRParentsTab from "../components/HR/HRParentsTab";

const accent = "#DC2626";
const accentDark = "#B91C1C";

const HR_TAB_BANNER = [
  {
    title: "Admissions",
    description: "Review and manage student admission applications and their status.",
  },
  {
    title: "Attendance",
    description: "Track teacher and student attendance from timetable lessons and exams.",
  },
  {
    title: "News & Events",
    description: "Publish news and school events for parents, students, and staff.",
  },
  {
    title: "Parents",
    description: "Create parent profiles linked to students. The parent user account is kept when a profile is removed.",
  },
  {
    title: "Leave & Payroll",
    description: "Leave requests, payroll, and HR policies — coming soon.",
  },
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

/** Lessons attendance only — keeps wide tables inside the card without stretching the page. */
const lessonsAttendanceContainSx = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  width: "100%",
  minWidth: 0,
  overflow: "hidden",
};

const lessonsTableContainerSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

const lessonsTableSx = {
  width: "100%",
  tableLayout: "fixed",
};

function todayIso() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function fmtTime(v) {
  const s = String(v || "").trim();
  return s.length >= 5 ? s.slice(0, 5) : s || "—";
}

function formatLessonSlot(lessonDate, startsAt, endsAt) {
  const d = lessonDate ? String(lessonDate).slice(0, 10) : "";
  const start = fmtTime(startsAt);
  const end = fmtTime(endsAt);
  if (d && start !== "—" && end !== "—") return `${d} · ${start}–${end}`;
  if (d && start !== "—") return `${d} · ${start}`;
  if (start !== "—" && end !== "—") return `${start}–${end}`;
  return "—";
}

function fmtDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function escapeCsv(value) {
  const raw = value == null ? "" : String(value);
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

const PARENTS_TAB_INDEX = 3;

export default function HRPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => (typeof location.state?.tab === "number" ? location.state.tab : 0));
  const [scope, setScope] = useState("lessons");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (typeof location.state?.tab === "number") {
      setTab(location.state.tab);
    }
  }, [location.state?.tab]);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      params.set("scope", scope);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/reports/hr-attendance-overview${query}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load HR attendance.");
      const data = json.data || {};
      setTeachers(Array.isArray(data.teacher_attendance) ? data.teacher_attendance : []);
      setStudents(Array.isArray(data.student_attendance) ? data.student_attendance : []);
    } catch (e) {
      setError(e.message || "Could not load HR attendance.");
      setTeachers([]);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [date, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const teacherAttended = teachers.filter((x) => x.teacher_attended).length;
    const studentAttended = students.filter((x) => x.status === "Attended").length;
    return {
      teacherTotal: teachers.length,
      teacherAttended,
      studentTotal: students.length,
      studentAttended,
    };
  }, [teachers, students]);

  const exportAttendanceCsv = () => {
    const combinedHeader = [
      "Record Type",
      "Date",
      "Curriculum",
      "Class",
      scope === "exams" ? "Exam" : "Subject",
      "Teacher",
      "Student",
      "Admission",
      "Start",
      "End",
      "Join Time",
      "Leave Time",
      "Duration Minutes",
      "Attendance",
    ];

    const teacherRows = teachers.map((r) => [
      "Teacher",
      r.lesson_date || date || "",
      r.curriculum?.name || "",
      r.curriculum_class?.name || "",
      scope === "exams" ? r.exam?.title || "" : r.subject?.name || "",
      r.teacher?.user?.full_name || r.teacher?.user?.username || "Unassigned",
      "",
      "",
      fmtTime(r.starts_at),
      fmtTime(r.ends_at),
      "",
      "",
      "",
      r.teacher_attended ? "Attended" : "Pending",
    ]);

    const studentRows = students.map((r) => [
      "Student",
      r.lesson?.lesson_date || date || "",
      r.lesson?.timetable?.curriculum_class?.curriculum?.name || "",
      r.lesson?.timetable?.curriculum_class?.name || "",
      scope === "exams" ? r.exam_schedule?.exam?.title || "" : r.lesson?.curriculum_subject?.name || "",
      "",
      r.student?.user?.full_name || r.student?.user?.username || "",
      r.student?.admission_number || "",
      fmtTime(r.lesson?.starts_at),
      fmtTime(r.lesson?.ends_at),
      r.join_time ? new Date(r.join_time).toLocaleString() : "",
      r.leave_time ? new Date(r.leave_time).toLocaleString() : "",
      r.duration_minutes != null ? r.duration_minutes : "",
      r.status || "Pending",
    ]);

    const combinedRows = [...teacherRows, ...studentRows];
    const lines = [
      combinedHeader.map(escapeCsv).join(","),
      ...combinedRows.map((row) => row.map(escapeCsv).join(",")),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hr-attendance-${date || "all-dates"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        /** Match Users page top offset under fixed navbar. */
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: "linear-gradient(180deg, #FEF2F2 0%, #fff 45%)",
        overflow: "hidden",
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 60%, #EF4444 100%)`,
          color: "#fff",
          px: { xs: 2, sm: 3 },
          py: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: 1 }}>
          Human Resources
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mt: 0.25 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {HR_TAB_BANNER[tab]?.title ?? "HR Dashboard"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: { xs: "100%", sm: 720 }, mt: 0.25 }}>
              {HR_TAB_BANNER[tab]?.description ?? "Human resources management."}
            </Typography>
          </Box>
          {tab === PARENTS_TAB_INDEX ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/hr/parents/create")}
              sx={{
                flexShrink: 0,
                alignSelf: { xs: "stretch", sm: "center" },
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#fff",
                color: accentDark,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                "&:hover": { bgcolor: "#fef2f2", color: accentDark },
              }}
            >
              Create parent profile
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4, pt: { xs: 1.25, sm: 1.5 } }}>
        <Paper elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 2, mb: 2 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: 1,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
                "& .MuiTabs-indicator": { bgcolor: accent },
              }}
            >
              <Tab label="Admissions" />
              <Tab label="Attendance" />
              <Tab label="News & Events" />
              <Tab label="Parents" />
              <Tab label="Leave & Payroll (coming soon)" />
            </Tabs>
        </Paper>

        {tab === 0 ? (
          <HRAdmissionsTab />
        ) : tab === 1 ? (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <Stack direction="row" spacing={1} sx={{ mr: { sm: "auto" } }}>
                <Chip
                  clickable
                  label="Lessons"
                  color={scope === "lessons" ? "error" : "default"}
                  variant={scope === "lessons" ? "filled" : "outlined"}
                  onClick={() => setScope("lessons")}
                />
                <Chip
                  clickable
                  label="Exams"
                  color={scope === "exams" ? "error" : "default"}
                  variant={scope === "exams" ? "filled" : "outlined"}
                  onClick={() => setScope("exams")}
                />
              </Stack>
              <TextField
                label="Date"
                type="date"
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  width: { xs: "100%", sm: 180 },
                  "& .MuiInputBase-root": { height: 36 },
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDate(todayIso())}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: "#fecaca", color: accentDark, height: 36 }}
              >
                Today
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDate("")}
                sx={{ textTransform: "none", fontWeight: 700, borderColor: "#fecaca", color: accentDark, height: 36 }}
              >
                All dates
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={exportAttendanceCsv}
                sx={{ textTransform: "none", fontWeight: 700, bgcolor: accent, height: 36, "&:hover": { bgcolor: accentDark } }}
              >
                Export CSV
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Card sx={{ flex: 1, border: "1px solid #fecaca" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BadgeIcon sx={{ color: accent }} />
                    <Typography sx={{ fontWeight: 700 }}>
                      Teacher Attendance ({scope === "exams" ? "Exams" : "Lessons"})
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
                    {stats.teacherAttended}/{stats.teacherTotal}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, border: "1px solid #fecaca" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SchoolIcon sx={{ color: accent }} />
                    <Typography sx={{ fontWeight: 700 }}>
                      Student Attendance ({scope === "exams" ? "Exams" : "Lessons"})
                    </Typography>
                  </Stack>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
                    {stats.studentAttended}/{stats.studentTotal}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress sx={{ color: accent }} />
              </Box>
            ) : (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #fecaca",
                    borderRadius: 2,
                    overflow: "hidden",
                    ...(scope === "lessons" ? lessonsAttendanceContainSx : {}),
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #fecaca", bgcolor: "#fff7f7" }}>
                    <Typography sx={{ fontWeight: 800 }}>Teachers</Typography>
                  </Box>
                  {scope === "lessons" ? (
                    <TableContainer sx={lessonsTableContainerSx}>
                      <Table size="small" sx={lessonsTableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Curriculum</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Teacher</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell align="center">Attendance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {teachers.map((r, idx) => (
                            <TableRow key={r.lesson_id || idx} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.curriculum?.name || "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.curriculum_class?.name || "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.subject?.name || "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.teacher?.user?.full_name || r.teacher?.user?.username || "Unassigned"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {formatLessonSlot(r.lesson_date, r.starts_at, r.ends_at)}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={r.teacher_attended ? "Attended" : "Pending"}
                                  color={r.teacher_attended ? "success" : "default"}
                                  icon={r.teacher_attended ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>No.</TableCell>
                          <TableCell>Curriculum</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Exam</TableCell>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell align="center">Attendance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {teachers.map((r, idx) => (
                          <TableRow key={r.lesson_id || idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{r.curriculum?.name || "—"}</TableCell>
                            <TableCell>{r.curriculum_class?.name || "—"}</TableCell>
                            <TableCell>{r.exam?.title || "—"}</TableCell>
                            <TableCell>{r.teacher?.user?.full_name || r.teacher?.user?.username || "Unassigned"}</TableCell>
                            <TableCell>{formatLessonSlot(r.lesson_date, r.starts_at, r.ends_at)}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={r.teacher_attended ? "Attended" : "Pending"}
                                color={r.teacher_attended ? "success" : "default"}
                                icon={r.teacher_attended ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #fecaca",
                    borderRadius: 2,
                    overflow: "hidden",
                    ...(scope === "lessons" ? lessonsAttendanceContainSx : {}),
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #fecaca", bgcolor: "#fff7f7" }}>
                    <Typography sx={{ fontWeight: 800 }}>Students</Typography>
                  </Box>
                  {scope === "lessons" ? (
                    <TableContainer sx={lessonsTableContainerSx}>
                      <Table size="small" sx={lessonsTableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Student</TableCell>
                            <TableCell>Admission</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Joined</TableCell>
                            <TableCell>Left</TableCell>
                            <TableCell>Minutes</TableCell>
                            <TableCell align="center">Attendance</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {students.map((r, idx) => (
                            <TableRow key={r.attendance_id || idx} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.student?.user?.full_name || r.student?.user?.username || "—"}
                              </TableCell>
                              <TableCell>{r.student?.admission_number || "—"}</TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.lesson?.curriculum_subject?.name || "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.lesson?.timetable?.curriculum_class?.name || "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {fmtDateTime(r.join_time)}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.leave_time ? fmtDateTime(r.leave_time) : r.join_time ? "In class" : "—"}
                              </TableCell>
                              <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.duration_minutes != null
                                  ? r.duration_minutes
                                  : r.join_time && !r.leave_time
                                  ? `${Math.max(0, Math.round((Date.now() - new Date(r.join_time)) / 60000))} (ongoing)`
                                  : "—"}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={r.status || "Pending"}
                                  color={r.status === "Attended" ? "success" : "default"}
                                  icon={r.status === "Attended" ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>No.</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>Admission</TableCell>
                          <TableCell>Exam</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Joined</TableCell>
                          <TableCell align="center">Attendance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map((r, idx) => (
                          <TableRow key={r.attendance_id || idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{r.student?.user?.full_name || r.student?.user?.username || "—"}</TableCell>
                            <TableCell>{r.student?.admission_number || "—"}</TableCell>
                            <TableCell>{r.exam_schedule?.exam?.title || "—"}</TableCell>
                            <TableCell>{r.exam_schedule?.curriculum_class?.name || "—"}</TableCell>
                            <TableCell>{fmtDateTime(r.join_time)}</TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={r.status || "Pending"}
                                color={r.status === "Attended" ? "success" : "default"}
                                icon={r.status === "Attended" ? <CheckCircleRoundedIcon fontSize="small" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" />}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Paper>
              </>
            )}
          </Stack>
        ) : tab === 2 ? (
          <HRNewsEventsTab />
        ) : tab === 3 ? (
          <HRParentsTab />
        ) : (
          <Alert severity="info">Leave, payroll, and HR policies tabs can be added next.</Alert>
        )}
      </Box>
    </Box>
  );
}

