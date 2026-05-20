import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import { format } from "date-fns";
import {
  LessonOnlineCard,
  ExamOnlineCard,
  MeetingOnlineCard,
  EmptyListNotice,
  SessionsGrid,
  SessionGridItem,
} from "../components/OnlineHub/OnlineSessionCards";
import OnlineLessonLiveDialog from "../components/OnlineHub/OnlineLessonLiveDialog";
import OnlineExamLiveDialog from "../components/OnlineHub/OnlineExamLiveDialog";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const backgroundLight = "#FEF2F2";
const meetingAccent = "#0F766E";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2),
  marginBottom: "1px",
  boxSizing: "border-box",
  minHeight: "100%",
  background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
});

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function OnlineScheduledSessionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState(() =>
    tabParam === "exams" ? 1 : tabParam === "meetings" ? 2 : 0
  );

  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveDlg, setLiveDlg] = useState({
    open: false,
    lessonId: null,
    subtitle: "",
    curriculumClassId: null,
    curriculumClassLabel: "",
  });
  const [examDlg, setExamDlg] = useState({ open: false, scheduleId: null, subtitle: "" });
  const [endLiveBusyId, setEndLiveBusyId] = useState(null);

  useEffect(() => {
    let t = tabParam === "exams" ? 1 : tabParam === "meetings" ? 2 : 0;
    if (!tabParam) {
      if (location.pathname.endsWith("/exams")) t = 1;
      else if (location.pathname.endsWith("/meetings")) t = 2;
      else if (location.pathname.endsWith("/lessons")) t = 0;
    }
    setTab(t);
  }, [tabParam, location.pathname]);

  const handleTabChange = (_, v) => {
    setTab(v);
    const next = new URLSearchParams(searchParams);
    if (v === 1) next.set("tab", "exams");
    else if (v === 2) next.set("tab", "meetings");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLessons([]);
      setExams([]);
      setMeetings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = `from=${encodeURIComponent(todayIso)}&days=42&limit=60`;
      const [lessonsRes, examsRes, meetingsRes] = await Promise.all([
        fetch(`/api/curricula/timetable-lessons/online-upcoming?${q}`, { headers: authHeaders(token) }),
        fetch(`/api/exams/online-upcoming?${q}`, { headers: authHeaders(token) }),
        fetch(`/api/admin-meetings?${q}`, { headers: authHeaders(token) }),
      ]);
      const [lessonsJson, examsJson, meetingsJson] = await Promise.all([
        lessonsRes.json().catch(() => ({})),
        examsRes.json().catch(() => ({})),
        meetingsRes.json().catch(() => ({})),
      ]);
      setLessons(lessonsRes.ok && lessonsJson.success && Array.isArray(lessonsJson.data) ? lessonsJson.data : []);
      setExams(examsRes.ok && examsJson.success && Array.isArray(examsJson.data) ? examsJson.data : []);
      setMeetings(
        meetingsRes.ok && meetingsJson.success && Array.isArray(meetingsJson.data) ? meetingsJson.data : []
      );
    } catch {
      setLessons([]);
      setExams([]);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    load();
  }, [load]);

  const endLiveMeeting = useCallback(
    async (m) => {
      const token = localStorage.getItem("token");
      if (!token || !m?.id) return;
      setEndLiveBusyId(m.id);
      try {
        const res = await fetch(`/api/admin-meetings/${m.id}/live/end`, {
          method: "POST",
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not end live session");
        await load();
      } catch (e) {
        alert(e.message || "Could not end meeting");
      } finally {
        setEndLiveBusyId(null);
      }
    },
    [load]
  );

  const toCardExam = (row) => {
    const examTitle = row?.exam?.title || "Online exam";
    const cur = row?.curriculum;
    const cc = row?.curriculum_class;
    const level = row?.curriculum_class_level;
    const teacher = row?.teacher?.user?.full_name || row?.teacher?.user?.username || "";
    const start = row?.start_time ? new Date(row.start_time) : null;
    const end = row?.end_time ? new Date(row.end_time) : null;
    const timeLabel =
      start && end
        ? `${format(start, "yyyy-MM-dd HH:mm")} - ${format(end, "HH:mm")} (${row?.timezone || "UTC"})`
        : "";
    return {
      id: row.id,
      title: examTitle,
      subtitle: [cur?.name && `Curriculum: ${cur.name}`, cc?.name && `Class: ${cc.name}`, level?.name && `Term: ${level.name}`]
        .filter(Boolean)
        .join(" · "),
      slotLabel: [timeLabel, teacher ? `Teacher: ${teacher}` : "", row?.status ? `Status: ${row.status}` : ""]
        .filter(Boolean)
        .join(" · "),
      _raw: row,
    };
  };

  const handleInitiateExam = (exam) => {
    const scheduleId = exam?._raw?.id;
    if (!scheduleId) return;
    setExamDlg({
      open: true,
      scheduleId,
      subtitle: exam.title || "Online exam",
    });
  };

  const timetableLink =
    tab === 1 ? `?tab=exams` : tab === 2 ? `?tab=meetings` : "";

  return (
    <Box sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #f97316 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            onClick={() => navigate("/elimu-plus-online")}
            sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <VideocamOutlined sx={{ fontSize: 34 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Elimu Plus · Online
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Scheduled online sessions
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
              Upcoming online classes, exams, and staff meetings. Schedule new items from the timetable calendar.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid #FECACA`, overflow: "hidden" }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              borderBottom: "1px solid #FECACA",
              "& .MuiTab-root": { fontWeight: 700, textTransform: "none" },
              "& .Mui-selected": { color: `${accentDark} !important` },
              "& .MuiTabs-indicator": { bgcolor: accent },
            }}
          >
            <Tab icon={<CalendarMonthOutlined />} iconPosition="start" label="Online classes" />
            <Tab icon={<QuizOutlined />} iconPosition="start" label="Online exams" />
            <Tab icon={<GroupsRounded />} iconPosition="start" label="Staff meetings" />
          </Tabs>

          <Box sx={{ px: 2, pb: 3 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: tab === 2 ? meetingAccent : accent }} />
              </Box>
            ) : (
              <>
                <TabPanel value={tab} index={0}>
                  {lessons.length === 0 ? (
                    <EmptyListNotice>
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          No online lessons scheduled. Add online lessons on the timetable for a specific date.
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/timetable/day/${todayIso}${timetableLink}`)}
                          sx={{ alignSelf: "flex-start", borderColor: accent, color: accentDark, fontWeight: 700 }}
                        >
                          Open timetable (today)
                        </Button>
                      </Stack>
                    </EmptyListNotice>
                  ) : (
                    <SessionsGrid>
                      {lessons.map((row) => (
                        <SessionGridItem key={row.id}>
                          <LessonOnlineCard
                            row={row}
                            onInitiate={(r) => {
                              const cc = r.timetable?.curriculum_class;
                              setLiveDlg({
                                open: true,
                                lessonId: r.id,
                                subtitle: `${r.curriculum_subject?.name || "Lesson"} · ${r.lesson_date || ""}`,
                                curriculumClassId: cc?.id ?? null,
                                curriculumClassLabel: cc
                                  ? `${cc.name || ""}${cc.code ? ` (${cc.code})` : ""}`.trim()
                                  : "",
                              });
                            }}
                          />
                        </SessionGridItem>
                      ))}
                    </SessionsGrid>
                  )}
                </TabPanel>

                <TabPanel value={tab} index={1}>
                  {exams.length === 0 ? (
                    <EmptyListNotice>
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          No online exams scheduled. Create exam schedules on the timetable Exams tab.
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/timetable/day/${todayIso}?tab=exams`)}
                          sx={{ alignSelf: "flex-start", borderColor: accent, color: accentDark, fontWeight: 700 }}
                        >
                          Open exam calendar (today)
                        </Button>
                      </Stack>
                    </EmptyListNotice>
                  ) : (
                    <SessionsGrid>
                      {exams.map((row) => (
                        <SessionGridItem key={row.id}>
                          <ExamOnlineCard exam={toCardExam(row)} onInitiate={handleInitiateExam} />
                        </SessionGridItem>
                      ))}
                    </SessionsGrid>
                  )}
                </TabPanel>

                <TabPanel value={tab} index={2}>
                  {meetings.length === 0 ? (
                    <EmptyListNotice>
                      <Stack spacing={2}>
                        <Typography variant="body2" color="text.secondary">
                          No staff meetings scheduled. Use the timetable Staff meetings tab to schedule one for a date.
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => navigate(`/timetable/day/${todayIso}?tab=meetings`)}
                          sx={{
                            alignSelf: "flex-start",
                            borderColor: meetingAccent,
                            color: meetingAccent,
                            fontWeight: 700,
                          }}
                        >
                          Open timetable — staff meetings (today)
                        </Button>
                      </Stack>
                    </EmptyListNotice>
                  ) : (
                    <SessionsGrid>
                      {meetings.map((row) => (
                        <SessionGridItem key={row.id}>
                          <MeetingOnlineCard
                            meeting={row}
                            onJoin={(m) => navigate(`/live/meeting/${m.id}`)}
                            onEndLive={(m) => void endLiveMeeting(m)}
                            endLiveBusy={endLiveBusyId === row.id}
                          />
                        </SessionGridItem>
                      ))}
                    </SessionsGrid>
                  )}
                </TabPanel>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <OnlineLessonLiveDialog
        open={liveDlg.open}
        onClose={() => setLiveDlg((d) => ({ ...d, open: false }))}
        lessonId={liveDlg.lessonId}
        subtitle={liveDlg.subtitle}
        curriculumClassId={liveDlg.curriculumClassId}
        curriculumClassLabel={liveDlg.curriculumClassLabel}
      />

      <OnlineExamLiveDialog
        open={examDlg.open}
        onClose={() => {
          setExamDlg((d) => ({ ...d, open: false }));
          void load();
        }}
        examScheduleId={examDlg.scheduleId}
        subtitle={examDlg.subtitle}
      />
    </Box>
  );
}
