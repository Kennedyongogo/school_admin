import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import NewspaperOutlinedIcon from "@mui/icons-material/NewspaperOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import HRAdmissionsTab from "../components/HR/HRAdmissionsTab";
import HRNewsEventsTab from "../components/HR/HRNewsEventsTab";
import HRParentsTab from "../components/HR/HRParentsTab";
import {
  HR_TABS,
  HR_TAB_COPY,
  PARENTS_TAB_INDEX,
  fullMainBleedSx,
  elimuViewportSx,
  warmCream,
  todayIso,
  fmtTime,
  formatLessonSlot,
  fmtDateTime,
  escapeCsv,
  lessonsAttendanceContainSx,
  lessonsTableContainerSx,
  lessonsTableSx,
} from "../components/HR/hrShared";
import {
  HRHero,
  HRTabs,
  HeroActionButton,
  TabPanelShell,
  HRPanelCard,
  HRStatCard,
  HRFilterBar,
  HRFilterTextField,
  HRGhostButton,
  HRPrimaryButton,
  HRScopeToggle,
  HRSectionHeader,
  HRAttendanceChip,
  HRInfoBanner,
  tableHeadRowSx,
  EmptyTableRow,
} from "../components/HR/hrUi";

const TAB_ICONS = [
  <HowToRegOutlinedIcon sx={{ fontSize: 18 }} />,
  <EventAvailableOutlinedIcon sx={{ fontSize: 18 }} />,
  <NewspaperOutlinedIcon sx={{ fontSize: 18 }} />,
  <GroupsOutlinedIcon sx={{ fontSize: 18 }} />,
  <PaymentsOutlinedIcon sx={{ fontSize: 18 }} />,
];

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
    if (tab === 1) void load();
  }, [load, tab]);

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

  const tabCopy = HR_TAB_COPY[tab] || HR_TAB_COPY[0];
  const heroActions =
    tab === PARENTS_TAB_INDEX ? (
      <HeroActionButton startIcon={<AddIcon />} onClick={() => navigate("/hr/parents/create")}>
        Create parent profile
      </HeroActionButton>
    ) : null;

  const renderAttendanceTable = (kind) => {
    const isTeachers = kind === "teachers";
    const rows = isTeachers ? teachers : students;
    const isLessons = scope === "lessons";
    const isExams = scope === "exams";

    const teacherLessonCols = ["No.", "Curriculum", "Class", "Subject", "Teacher", "Time", "Attendance"];
    const teacherExamCols = ["No.", "Curriculum", "Class", "Exam", "Teacher", "Time", "Attendance"];
    const studentLessonCols = ["No.", "Student", "Admission", "Subject", "Class", "Joined", "Left", "Minutes", "Attendance"];
    const studentExamCols = ["No.", "Student", "Admission", "Exam", "Class", "Joined", "Attendance"];

    const cols = isTeachers
      ? isLessons
        ? teacherLessonCols
        : teacherExamCols
      : isLessons
        ? studentLessonCols
        : studentExamCols;

    const tableContent = (
      <Table size="small" sx={isLessons ? lessonsTableSx : undefined}>
        <TableHead>
          <TableRow sx={tableHeadRowSx}>
            {cols.map((label) => (
              <TableCell key={label} align={label === "Attendance" ? "center" : "left"}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols.length} sx={{ border: 0, p: 0 }}>
                <EmptyTableRow colSpan={cols.length} message={`No ${isTeachers ? "teacher" : "student"} records for this filter.`} />
              </TableCell>
            </TableRow>
          ) : isTeachers ? (
            rows.map((r, idx) => (
              <TableRow key={r.lesson_id || r.exam_id || idx} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.curriculum?.name || "—"}</TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.curriculum_class?.name || "—"}</TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isExams ? r.exam?.title || "—" : r.subject?.name || "—"}
                </TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                  {r.teacher?.user?.full_name || r.teacher?.user?.username || "Unassigned"}
                </TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatLessonSlot(r.lesson_date || r.starts_at, r.starts_at, r.ends_at)}
                </TableCell>
                <TableCell align="center">
                  <HRAttendanceChip attended={r.teacher_attended} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            rows.map((r, idx) => (
              <TableRow key={r.attendance_id || idx} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                  {r.student?.user?.full_name || r.student?.user?.username || "—"}
                </TableCell>
                <TableCell>{r.student?.admission_number || "—"}</TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isExams ? r.exam_schedule?.exam?.title || "—" : r.lesson?.curriculum_subject?.name || "—"}
                </TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isExams ? r.exam_schedule?.curriculum_class?.name || "—" : r.lesson?.timetable?.curriculum_class?.name || "—"}
                </TableCell>
                <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fmtDateTime(r.join_time)}
                </TableCell>
                {isLessons ? (
                  <>
                    <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.leave_time ? fmtDateTime(r.leave_time) : r.join_time ? "In class" : "—"}
                    </TableCell>
                    <TableCell>
                      {r.duration_minutes != null
                        ? r.duration_minutes
                        : r.join_time && !r.leave_time
                          ? `${Math.max(0, Math.round((Date.now() - new Date(r.join_time)) / 60000))} (ongoing)`
                          : "—"}
                    </TableCell>
                  </>
                ) : null}
                <TableCell align="center">
                  <HRAttendanceChip attended={r.status === "Attended"} label={r.status || "Pending"} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );

    return (
      <HRPanelCard noPadding sx={isLessons ? lessonsAttendanceContainSx : undefined}>
        <HRSectionHeader
          title={isTeachers ? "Teachers" : "Students"}
          subtitle={
            isTeachers
              ? `${stats.teacherAttended} of ${stats.teacherTotal} marked attended`
              : `${stats.studentAttended} of ${stats.studentTotal} marked attended`
          }
        />
        {isLessons ? (
          <TableContainer sx={lessonsTableContainerSx}>{tableContent}</TableContainer>
        ) : (
          tableContent
        )}
      </HRPanelCard>
    );
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
      <HRHero
        title={tabCopy.title}
        subtitle={tabCopy.description}
        icon={<GroupsOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={heroActions}
      />

      <HRTabs
        activeTab={tab}
        onChange={(v) => {
          if (v === 4) return;
          setTab(v);
        }}
        tabs={HR_TABS.map((t, i) => ({
          label: t.badge ? `${t.label} (${t.badge})` : t.label,
          value: t.value,
          icon: TAB_ICONS[i],
        }))}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 ? <HRAdmissionsTab /> : null}

        {tab === 1 ? (
          <Stack spacing={2}>
            <HRFilterBar
              actions={
                <>
                  <HRGhostButton onClick={() => setDate(todayIso())}>Today</HRGhostButton>
                  <HRGhostButton onClick={() => setDate("")}>All dates</HRGhostButton>
                  <HRPrimaryButton startIcon={<DownloadOutlinedIcon />} onClick={exportAttendanceCsv}>
                    Export CSV
                  </HRPrimaryButton>
                </>
              }
            >
              <Box sx={{ gridColumn: { lg: "span 2" } }}>
                <HRScopeToggle
                  value={scope}
                  onChange={setScope}
                  options={[
                    { value: "lessons", label: "Lessons" },
                    { value: "exams", label: "Exams" },
                  ]}
                />
              </Box>
              <HRFilterTextField
                label="Filter by date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </HRFilterBar>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <HRStatCard
                icon={<BadgeOutlinedIcon />}
                label={`Teacher attendance · ${scope === "exams" ? "Exams" : "Lessons"}`}
                value={`${stats.teacherAttended}/${stats.teacherTotal}`}
                sublabel={stats.teacherTotal ? `${Math.round((stats.teacherAttended / stats.teacherTotal) * 100)}% present` : "No records"}
              />
              <HRStatCard
                icon={<SchoolOutlinedIcon />}
                label={`Student attendance · ${scope === "exams" ? "Exams" : "Lessons"}`}
                value={`${stats.studentAttended}/${stats.studentTotal}`}
                sublabel={stats.studentTotal ? `${Math.round((stats.studentAttended / stats.studentTotal) * 100)}% present` : "No records"}
                accent="#2563EB"
              />
            </Stack>

            {scope === "exams" ? (
              <HRInfoBanner>
                For monitored online exams, teachers are marked attended when they open <strong>Proctor Monitor</strong> or{" "}
                <strong>Submissions</strong> during the exam window.
              </HRInfoBanner>
            ) : null}

            <TabPanelShell loading={loading} error={error} onDismissError={() => setError("")}>
              <Stack spacing={2}>
                {renderAttendanceTable("teachers")}
                {renderAttendanceTable("students")}
              </Stack>
            </TabPanelShell>
          </Stack>
        ) : null}

        {tab === 2 ? <HRNewsEventsTab /> : null}
        {tab === 3 ? <HRParentsTab /> : null}

        {tab === 4 ? (
          <HRPanelCard>
            <Typography sx={{ fontWeight: 700, color: "text.secondary", textAlign: "center", py: 4 }}>
              Leave, payroll, and HR policies — coming soon.
            </Typography>
          </HRPanelCard>
        ) : null}
      </Box>
    </Box>
  );
}
