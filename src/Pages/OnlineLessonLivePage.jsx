import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  authHeaders,
  fullMainBleedSx,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  inputSx,
  ghostBtnSx,
  primaryBtnSx,
} from "../components/SchoolProfile/elimuPlusShared";
import {
  TimetableHero,
  HeroActionButton,
  FormSection,
  DataTableShell,
  tableHeadRowSx,
} from "../components/Timetable/timetableUi";
import LiveClassWhiteboard from "../components/VideoConference/LiveClassWhiteboard";
import { useSocket } from "../hooks/useSocket";

function apiHeaders(token) {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function uniqueEmails(rows) {
  const seen = new Set();
  const out = [];
  for (const s of rows || []) {
    const e = s?.user?.email != null ? String(s.user.email).trim().toLowerCase() : "";
    if (e && !seen.has(e)) {
      seen.add(e);
      out.push(s.user.email.trim());
    }
  }
  return out;
}

function classLabelFromRow(cc) {
  if (!cc) return "";
  return `${cc.name || ""}${cc.code ? ` (${cc.code})` : ""}`.trim();
}

function ReadOnlyUrlField({ label, value, onCopy }) {
  const display = value || "—";
  return (
    <TextField
      label={label}
      fullWidth
      value={display}
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: value ? (
            <InputAdornment position="end">
              <Tooltip title="Copy">
                <IconButton size="small" aria-label={`Copy ${label}`} onClick={() => onCopy(value)}>
                  <ContentCopyOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : null,
        },
      }}
      sx={inputSx}
    />
  );
}

function SectionHint({ children }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
      {children}
    </Typography>
  );
}

export default function OnlineLessonLivePage() {
  const { isoDate, lessonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [subtitle, setSubtitle] = useState(location.state?.subtitle || "");
  const [curriculumClassId, setCurriculumClassId] = useState(location.state?.curriculumClassId ?? null);
  const [curriculumClassLabel, setCurriculumClassLabel] = useState(location.state?.curriculumClassLabel || "");
  const [curriculumClassLevelId, setCurriculumClassLevelId] = useState(location.state?.curriculumClassLevelId ?? null);
  const [curriculumClassLevelLabel, setCurriculumClassLevelLabel] = useState(location.state?.curriculumClassLevelLabel || "");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [live, setLive] = useState(null);
  const [reused, setReused] = useState(false);

  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterErr, setRosterErr] = useState(null);
  const [roster, setRoster] = useState([]);

  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyNote, setNotifyNote] = useState("");
  const [notifyFeedback, setNotifyFeedback] = useState(null);

  const [trackLoading, setTrackLoading] = useState(false);
  const [trackErr, setTrackErr] = useState(null);
  const [trackPayload, setTrackPayload] = useState(null);

  const [recUrl, setRecUrl] = useState("");
  const [recDur, setRecDur] = useState("");
  const [recSaving, setRecSaving] = useState(false);
  const [recFeedback, setRecFeedback] = useState(null);

  const mountedRef = useRef(true);
  const adminToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const { socket } = useSocket(adminToken);

  useEffect(() => {
    if (!socket || !live?.id) return undefined;
    const joinRoom = () => socket.emit("join:live-class", live.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave:live-class", live.id);
    };
  }, [socket, live?.id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const goBack = () => {
    if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
      navigate(`/timetable/day/${isoDate}`);
    } else {
      navigate("/timetable");
    }
  };

  const copy = (text) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const loadLessonMeta = useCallback(async () => {
    if (!lessonId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-session`, {
        headers: apiHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) return;
      const lesson = data.data?.lesson;
      const cc = lesson?.timetable?.curriculum_class;
      const term = lesson?.timetable?.curriculum_class_level;
      if (!mountedRef.current) return;
      if (!subtitle) {
        const subj = lesson?.curriculum_subject?.name || "Lesson";
        const date = lesson?.lesson_date || isoDate || "";
        setSubtitle(`${subj} · ${date}`);
      }
      if (!curriculumClassId && cc?.id) {
        setCurriculumClassId(cc.id);
        setCurriculumClassLabel(classLabelFromRow(cc));
      }
      if (!curriculumClassLevelId && term?.id) {
        setCurriculumClassLevelId(term.id);
        setCurriculumClassLevelLabel(term.name || "");
      }
    } catch {
      /* optional enrichment */
    }
  }, [lessonId, isoDate, subtitle, curriculumClassId, curriculumClassLevelId]);

  const loadTracking = useCallback(async () => {
    if (!lessonId) return;
    setTrackLoading(true);
    setTrackErr(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-tracking`, {
        headers: apiHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load live tracking");
      if (mountedRef.current) setTrackPayload(data.data ?? null);
    } catch (e) {
      if (mountedRef.current) {
        setTrackErr(e.message || "Request failed");
        setTrackPayload(null);
      }
    } finally {
      if (mountedRef.current) setTrackLoading(false);
    }
  }, [lessonId]);

  const initiateLinks = useCallback(async () => {
    if (!lessonId) return;
    setLoading(true);
    setErr(null);
    setLive(null);
    setReused(false);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-session/initiate`, {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not prepare meeting links");
      if (!mountedRef.current) return;
      setLive(data.data?.live_class ?? null);
      setReused(!!data.data?.reused);
      await loadTracking();
    } catch (e) {
      if (mountedRef.current) setErr(e.message || "Request failed");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [lessonId, loadTracking]);

  useEffect(() => {
    void loadLessonMeta();
  }, [loadLessonMeta]);

  useEffect(() => {
    if (!lessonId) return undefined;
    void initiateLinks();
  }, [lessonId, initiateLinks]);

  useEffect(() => {
    if (!lessonId || loading) return undefined;
    void loadTracking();
    const interval = setInterval(() => void loadTracking(), 15000);
    return () => clearInterval(interval);
  }, [lessonId, loading, loadTracking]);

  useEffect(() => {
    if (!curriculumClassId) {
      setRoster([]);
      setRosterErr(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setRosterLoading(true);
      setRosterErr(null);
      setRoster([]);
      const token = localStorage.getItem("token");
      try {
        const q = new URLSearchParams({
          curriculum_class_id: curriculumClassId,
          page: "1",
          limit: "500",
        });
        if (curriculumClassLevelId) {
          q.set("curriculum_class_level_id", curriculumClassLevelId);
        }
        const res = await fetch(`/api/students?${q}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load class roster");
        if (!cancelled) setRoster(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setRosterErr(e.message || "Failed to load students");
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [curriculumClassId, curriculumClassLevelId]);

  const join = live?.join_url?.trim?.() ? String(live.join_url).trim() : "";
  const host = live?.host_url?.trim?.() ? String(live.host_url).trim() : join;
  const isTeams = live?.platform === "teams";
  const isInAppVideo = live?.id && (live?.platform === "webrtc" || live?.platform === "livekit");
  const hostRoomPath = isInAppVideo || isTeams ? `/live-class/${live.id}` : host;

  const inviteEmails = useMemo(() => uniqueEmails(roster), [roster]);
  const inviteLines = useMemo(
    () =>
      (roster || []).map((s) => {
        const name = s?.user?.full_name || s?.user?.username || "—";
        const email = s?.user?.email || "";
        const adm = s?.admission_number || "";
        return [name, email, adm].filter(Boolean).join(" · ");
      }),
    [roster]
  );

  const lc = trackPayload?.live_class;
  const attendances = lc?.live_attendances ?? lc?.liveAttendances ?? [];
  const recordings = lc?.recordings ?? [];

  const formatAttendanceMinutes = (row) => {
    if (row?.duration_minutes != null && Number.isFinite(Number(row.duration_minutes))) {
      return String(row.duration_minutes);
    }
    if (!row?.join_time) return "—";
    const joinMs = new Date(row.join_time).getTime();
    if (Number.isNaN(joinMs)) return "—";
    const endMs = row.leave_time ? new Date(row.leave_time).getTime() : Date.now();
    if (Number.isNaN(endMs)) return "—";
    const mins = Math.max(0, Math.round((endMs - joinMs) / 60000));
    return row.leave_time ? String(mins) : `${mins} (in class)`;
  };

  const sendClassNotifications = async () => {
    if (!lessonId) return;
    setNotifyBusy(true);
    setNotifyFeedback(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/notify-class`, {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({
          note: notifyNote.trim() ? notifyNote.trim().slice(0, 2000) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not notify class");
      const d = data.data || {};
      setNotifyFeedback({
        severity: "success",
        text: `Sent ${d.in_app_notifications_created ?? 0} system notification(s) to student portal accounts (${d.students_targeted ?? 0} learner(s) in this term).`,
      });
      await loadTracking();
    } catch (e) {
      setNotifyFeedback({ severity: "error", text: e.message || "Notify failed" });
    } finally {
      setNotifyBusy(false);
    }
  };

  const saveRecording = async () => {
    if (!lessonId || !recUrl.trim()) return;
    setRecSaving(true);
    setRecFeedback(null);
    const token = localStorage.getItem("token");
    try {
      const body = { recording_url: recUrl.trim() };
      const ds = recDur.trim();
      if (ds !== "") {
        const n = parseInt(ds, 10);
        if (Number.isFinite(n) && n >= 0) body.duration_seconds = n;
      }
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-recording`, {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save recording");
      setRecFeedback({ severity: "success", text: "Recording link saved for this lesson session." });
      setRecUrl("");
      setRecDur("");
      await loadTracking();
    } catch (e) {
      setRecFeedback({ severity: "error", text: e.message || "Save failed" });
    } finally {
      setRecSaving(false);
    }
  };

  const platformHint = isInAppVideo
    ? "WebRTC in-app room — no Jitsi. Students join from their portal bell notification or Classes page."
    : isTeams
      ? "Microsoft Teams — students join from the portal (waiting room), then open Teams. Admit them from the class room (lobby)."
      : "External meeting link — share the join URL with your class.";

  return (
    <Box
      sx={(theme) => ({
        ...pageShellSx,
        ...fullMainBleedSx(theme),
        minWidth: 0,
        minHeight: "calc(100dvh - 64px)",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: warmCream,
      })}
    >
      <TimetableHero
        title="Online lesson — meeting links"
        subtitle={subtitle || "Prepare host and student join links for this timetable lesson"}
        icon={<VideocamOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Back to day timetable">
              <IconButton
                onClick={goBack}
                aria-label="Back to day timetable"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            {isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? (
              <HeroActionButton startIcon={<CalendarMonthIcon />} onClick={goBack}>
                Day timetable
              </HeroActionButton>
            ) : null}
            {isInAppVideo && live?.id ? (
              <HeroActionButton
                variant="contained"
                onClick={() => navigate(hostRoomPath)}
                sx={{ bgcolor: "#fff", color: primaryDark, "&:hover": { bgcolor: primaryLight } }}
              >
                Start class
              </HeroActionButton>
            ) : null}
            {isTeams && live?.id ? (
              <HeroActionButton
                variant="contained"
                onClick={() => navigate(hostRoomPath)}
                sx={{ bgcolor: "#fff", color: primaryDark, "&:hover": { bgcolor: primaryLight } }}
              >
                Open class room
              </HeroActionButton>
            ) : null}
          </Stack>
        }
      />

      {reused && !loading ? (
        <Alert severity="info" sx={{ borderRadius: "14px", flexShrink: 0 }}>
          Reusing the latest saved links for this lesson (same calendar slot).
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : err ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {err}
        </Alert>
      ) : (
        <Stack spacing={2.5} sx={{ width: "100%", pb: 3 }}>
          {curriculumClassId ? (
            <FormSection title="Class roster">
              <Stack spacing={2} sx={{ width: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <GroupOutlinedIcon sx={{ color: primaryRed }} fontSize="small" />
                  <Typography sx={{ fontWeight: 700, color: primaryDark }}>
                    Students in this term
                    {curriculumClassLevelLabel ? (
                      <Typography component="span" color="text.secondary" sx={{ fontWeight: 600, ml: 0.75 }}>
                        ({curriculumClassLevelLabel}
                        {curriculumClassLabel ? ` · ${curriculumClassLabel}` : ""})
                      </Typography>
                    ) : curriculumClassLabel ? (
                      <Typography component="span" color="text.secondary" sx={{ fontWeight: 600, ml: 0.75 }}>
                        ({curriculumClassLabel})
                      </Typography>
                    ) : null}
                  </Typography>
                  <Chip label={`${roster.length} students`} size="small" sx={{ fontWeight: 700, bgcolor: `${primaryRed}12` }} />
                </Stack>
                <SectionHint>
                  Same roster used for <strong>Notify class (portal)</strong> below — only students placed in this <strong>term</strong> for the class. You can copy emails or the join link manually if needed.
                </SectionHint>
                {rosterLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size={28} sx={{ color: primaryRed }} />
                  </Box>
                ) : rosterErr ? (
                  <Alert severity="warning" sx={{ borderRadius: "12px" }}>{rosterErr}</Alert>
                ) : roster.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: "12px" }}>
                    No student profiles found for this term
                    {curriculumClassLevelLabel ? ` (${curriculumClassLevelLabel})` : curriculumClassLabel ? ` (${curriculumClassLabel})` : ""}
                    . Check student term placement under Create student profile.
                  </Alert>
                ) : (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyOutlinedIcon />}
                        disabled={inviteEmails.length === 0}
                        onClick={() => copy(inviteEmails.join("; "))}
                        sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                      >
                        Copy emails ({inviteEmails.length})
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ContentCopyOutlinedIcon />}
                        onClick={() => copy(inviteLines.join("\n"))}
                        sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                      >
                        Copy list (name · email · admission)
                      </Button>
                    </Stack>
                    <DataTableShell>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={tableHeadRowSx}>
                            <TableCell>Student</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Admission</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roster.map((s) => (
                            <TableRow key={s.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{s?.user?.full_name || s?.user?.username || "—"}</TableCell>
                              <TableCell>{s?.user?.email || "—"}</TableCell>
                              <TableCell sx={{ fontFamily: "ui-monospace, monospace" }}>{s?.admission_number || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DataTableShell>
                  </>
                )}
              </Stack>
            </FormSection>
          ) : null}

          <FormSection title="Meeting links">
            <Stack spacing={2.5} sx={{ width: "100%" }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LinkOutlinedIcon sx={{ color: primaryRed }} fontSize="small" />
                  <Typography sx={{ fontWeight: 800, color: primaryDark }}>Host / start here (teacher)</Typography>
                </Stack>
                <ReadOnlyUrlField label="Host URL" value={host} onCopy={copy} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                  {isInAppVideo ? (
                    <>
                      <Button variant="contained" disabled={!live?.id} onClick={() => navigate(hostRoomPath)} sx={primaryBtnSx}>
                        Start class (in-app video)
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewRoundedIcon />}
                        disabled={!live?.id}
                        onClick={() => window.open(hostRoomPath, "_blank", "noopener,noreferrer")}
                        sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                      >
                        Open class in new tab
                      </Button>
                    </>
                  ) : isTeams ? (
                    <>
                      <Button variant="contained" disabled={!live?.id} onClick={() => navigate(hostRoomPath)} sx={primaryBtnSx}>
                        Open class room (lobby)
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewRoundedIcon />}
                        href={host || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!host}
                        sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                      >
                        Open Teams meeting
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="contained" href={host || "#"} target="_self" rel="noopener noreferrer" disabled={!host} sx={primaryBtnSx}>
                        Open host link here
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewRoundedIcon />}
                        href={host || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!host}
                        sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                      >
                        Open host link in new tab
                      </Button>
                    </>
                  )}
                </Stack>
                <SectionHint>{platformHint}</SectionHint>
              </Stack>

              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 800, color: primaryDark }}>Student join link</Typography>
                <ReadOnlyUrlField label="Join URL" value={join} onCopy={copy} />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                  <Button variant="contained" color="secondary" href={join || "#"} target="_self" rel="noopener noreferrer" disabled={!join} sx={{ fontWeight: 700, borderRadius: "12px", textTransform: "none" }}>
                    Open join link here
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<OpenInNewRoundedIcon />}
                    href={join || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!join}
                    sx={{ fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                  >
                    Open join link in new tab
                  </Button>
                </Stack>
                {isInAppVideo ? (
                  <SectionHint>
                    Student join link (portal): <strong>{join || "—"}</strong>
                  </SectionHint>
                ) : null}
              </Stack>
            </Stack>
          </FormSection>

          {live?.id ? (
            <FormSection title="Class whiteboard">
              <Stack spacing={2} sx={{ width: "100%" }}>
                <SectionHint>
                  Annotate here for your class — students see the same board in the portal after you admit them.
                  {isTeams ? " Use Microsoft Teams for camera and microphone." : " Open the class room for video and lobby."}
                </SectionHint>
                {isTeams && host ? (
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewRoundedIcon />}
                    href={host}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ alignSelf: "flex-start", borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                  >
                    Open Teams meeting
                  </Button>
                ) : null}
                <Box sx={{ height: { xs: 320, sm: 420 }, minHeight: 280 }}>
                  <LiveClassWhiteboard
                    liveClassId={live.id}
                    token={adminToken}
                    socket={socket}
                    canDraw
                    canClear
                  />
                </Box>
                <Button
                  variant="contained"
                  disabled={!live?.id}
                  onClick={() => navigate(hostRoomPath)}
                  sx={{ alignSelf: "flex-start", ...primaryBtnSx }}
                >
                  {isTeams ? "Open full class room (lobby + board)" : "Open class room"}
                </Button>
              </Stack>
            </FormSection>
          ) : null}

          {curriculumClassId ? (
            <FormSection title="Notify class (student portal bell)">
              <Stack spacing={2} sx={{ width: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <NotificationsActiveOutlinedIcon sx={{ color: primaryRed }} fontSize="small" />
                  <Typography sx={{ fontWeight: 700, color: primaryDark }}>System notifications — no email</Typography>
                </Stack>
                <SectionHint>
                  Sends one school-system notification to each student in this <strong>term</strong> (same roster as above). They see it on the public portal bell with the join link. Meeting links above must be ready first.
                </SectionHint>
                <TextField
                  label="Optional note for students"
                  placeholder="e.g. Please join 5 minutes early with your headset."
                  value={notifyNote}
                  onChange={(e) => setNotifyNote(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  inputProps={{ maxLength: 2000 }}
                  sx={inputSx}
                />
                <Button
                  variant="contained"
                  disabled={notifyBusy || !join}
                  onClick={() => void sendClassNotifications()}
                  sx={{ ...primaryBtnSx, alignSelf: "flex-start", bgcolor: "#D97706", "&:hover": { bgcolor: "#B45309" } }}
                >
                  {notifyBusy ? "Sending…" : "Notify all students in this term"}
                </Button>
                {!join ? (
                  <Typography variant="caption" color="text.secondary">
                    Prepare meeting links first so a join URL exists.
                  </Typography>
                ) : null}
                {notifyFeedback ? (
                  <Alert severity={notifyFeedback.severity} sx={{ borderRadius: "12px" }}>
                    {notifyFeedback.text}
                  </Alert>
                ) : null}
              </Stack>
            </FormSection>
          ) : null}

          <FormSection title="Portal attendance & recordings">
            <Stack spacing={2} sx={{ width: "100%" }}>
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                <VideoLibraryOutlinedIcon sx={{ color: primaryRed }} fontSize="small" />
                <Typography sx={{ fontWeight: 800, color: primaryDark, flex: 1 }}>Live session tracking</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  disabled={trackLoading}
                  onClick={() => void loadTracking()}
                  sx={{ borderColor: primaryLight, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}
                >
                  Refresh
                </Button>
              </Stack>
              <SectionHint>
                Portal attendance only — students who opened the in-app class from their portal (Classes page or notification). Teachers joining from admin are not listed here.
              </SectionHint>

              {trackLoading && !trackPayload ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} sx={{ color: primaryRed }} />
                </Box>
              ) : trackErr ? (
                <Alert severity="warning" sx={{ borderRadius: "12px" }}>{trackErr}</Alert>
              ) : !lc ? (
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  No live session saved for this slot yet — finish preparing links above.
                </Alert>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Session summary · tracked joins: <strong>{attendances.length}</strong>
                    {typeof lc.attendance_count === "number" ? (
                      <> · counter on session: <strong>{lc.attendance_count}</strong></>
                    ) : null}
                  </Typography>

                  <Typography sx={{ fontWeight: 700, color: primaryDark, fontSize: "0.9rem" }}>
                    Students who joined (portal)
                  </Typography>
                  {attendances.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: "12px" }}>
                      No portal joins recorded yet. Ask students to use <strong>Join live class</strong> on their portal Classes page. Auto-refreshes every 15s.
                    </Alert>
                  ) : (
                    <DataTableShell>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={tableHeadRowSx}>
                            <TableCell>Student</TableCell>
                            <TableCell>Joined</TableCell>
                            <TableCell>Left</TableCell>
                            <TableCell>Minutes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attendances.map((row) => (
                            <TableRow key={row.id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {row.student?.user?.full_name || row.student?.user?.username || "—"}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {row.join_time ? new Date(row.join_time).toLocaleString() : "—"}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {row.leave_time ? new Date(row.leave_time).toLocaleString() : row.join_time ? "In class" : "—"}
                              </TableCell>
                              <TableCell>{formatAttendanceMinutes(row)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </DataTableShell>
                  )}

                  <Typography sx={{ fontWeight: 700, color: primaryDark, fontSize: "0.9rem", pt: 1 }}>
                    Saved recordings (links)
                  </Typography>
                  {recordings.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No recording metadata yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {recordings.map((r) => (
                        <Stack key={r.id} direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="text"
                            href={r.recording_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            disabled={!r.recording_url}
                            sx={{ textTransform: "none", justifyContent: "flex-start", maxWidth: "100%", fontWeight: 600, color: primaryDark }}
                          >
                            {r.recording_url || "(no URL)"}
                          </Button>
                          <Typography variant="caption" color="text.secondary">
                            {r.duration_seconds ? `${r.duration_seconds}s` : ""}
                            {r.created_at ? ` · ${new Date(r.created_at).toLocaleString()}` : ""}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}

                  <Typography sx={{ fontWeight: 700, color: primaryDark, fontSize: "0.9rem", pt: 1 }}>
                    Add recording
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }} sx={{ width: "100%" }}>
                    <TextField
                      fullWidth
                      label="Recording URL"
                      placeholder="https://…"
                      value={recUrl}
                      onChange={(e) => setRecUrl(e.target.value)}
                      sx={inputSx}
                    />
                    <TextField
                      label="Duration (sec)"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={recDur}
                      onChange={(e) => setRecDur(e.target.value)}
                      sx={{ ...inputSx, width: { xs: "100%", sm: 160 }, flexShrink: 0 }}
                    />
                    <Button variant="contained" disabled={recSaving || !recUrl.trim()} onClick={() => void saveRecording()} sx={{ ...primaryBtnSx, flexShrink: 0 }}>
                      {recSaving ? "Saving…" : "Save"}
                    </Button>
                  </Stack>
                  {recFeedback ? (
                    <Alert severity={recFeedback.severity} sx={{ borderRadius: "12px" }}>
                      {recFeedback.text}
                    </Alert>
                  ) : null}
                </>
              )}
            </Stack>
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Back to day timetable
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
