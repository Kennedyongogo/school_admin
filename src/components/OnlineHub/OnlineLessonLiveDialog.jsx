import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";

const headers = (token) => {
  const h = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

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

/**
 * Calls POST …/live-session/initiate and shows host/join URLs for timetable online lessons.
 * Optional `curriculumClassId`: loads student roster placed in that class (same class as this timetable) for manual invites.
 */
export default function OnlineLessonLiveDialog({
  open,
  onClose,
  lessonId,
  subtitle,
  lessonDateIso,
  curriculumClassId,
  curriculumClassLabel,
  onGoToDayTimetable,
  onLinksReady,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
  const onLinksReadyRef = useRef(onLinksReady);
  onLinksReadyRef.current = onLinksReady;

  useEffect(() => {
    if (!open) {
      setNotifyNote("");
      setNotifyFeedback(null);
      setNotifyBusy(false);
      setTrackPayload(null);
      setTrackErr(null);
      setRecUrl("");
      setRecDur("");
      setRecFeedback(null);
    }
  }, [open]);

  const loadTracking = useCallback(async () => {
    if (!lessonId) return;
    setTrackLoading(true);
    setTrackErr(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-tracking`, {
        headers: headers(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load live tracking");
      setTrackPayload(data.data ?? null);
    } catch (e) {
      setTrackErr(e.message || "Request failed");
      setTrackPayload(null);
    } finally {
      setTrackLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    if (!open || !lessonId || loading) return undefined;
    let cancelled = false;
    (async () => {
      await loadTracking();
      if (cancelled) return;
    })();
    const interval = setInterval(() => {
      void loadTracking();
    }, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open, lessonId, loading, loadTracking]);

  useEffect(() => {
    if (!open || !lessonId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setLive(null);
      setReused(false);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/live-session/initiate`, {
          method: "POST",
          headers: headers(token),
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not prepare meeting links");
        if (cancelled) return;
        setLive(data.data?.live_class ?? null);
        setReused(!!data.data?.reused);
        onLinksReadyRef.current?.();
      } catch (e) {
        if (!cancelled) setErr(e.message || "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, lessonId]);

  useEffect(() => {
    if (!open || !curriculumClassId) {
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
        const res = await fetch(`/api/students?${q}`, { headers: headers(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load class roster");
        if (cancelled) return;
        setRoster(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setRosterErr(e.message || "Failed to load students");
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, curriculumClassId]);

  const join = live?.join_url?.trim?.() ? String(live.join_url).trim() : "";
  const host = live?.host_url?.trim?.() ? String(live.host_url).trim() : join;
  const isInAppVideo =
    live?.id && (live?.platform === "webrtc" || live?.platform === "livekit");
  const hostRoomPath = isInAppVideo ? `/live-class/${live.id}` : host;

  const copy = (text) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const sendClassNotifications = async () => {
    if (!lessonId) return;
    setNotifyBusy(true);
    setNotifyFeedback(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/curricula/timetable-lessons/${lessonId}/notify-class`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          note: notifyNote.trim() ? notifyNote.trim().slice(0, 2000) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not notify class");
      const d = data.data || {};
      const created = d.in_app_notifications_created ?? 0;
      const matched = d.students_targeted ?? 0;
      setNotifyFeedback({
        severity: "success",
        text: `Sent ${created} system notification(s) to student portal accounts (${matched} learner(s) in this class). Students see them on the bell within about a minute while signed in.`,
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
        headers: headers(token),
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

  const inviteEmails = useMemo(() => uniqueEmails(roster), [roster]);
  const inviteLines = useMemo(() => {
    return (roster || []).map((s) => {
      const name = s?.user?.full_name || s?.user?.username || "—";
      const email = s?.user?.email || "";
      const adm = s?.admission_number || "";
      return [name, email, adm].filter(Boolean).join(" · ");
    });
  }, [roster]);

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

  const rosterSection =
    curriculumClassId != null && String(curriculumClassId).trim() !== "" ? (
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <GroupOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Students in this timetable class
            {curriculumClassLabel ? (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 600, ml: 0.75 }}>
                ({curriculumClassLabel})
              </Typography>
            ) : null}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
          Same roster used for <strong>Notify class (portal)</strong> below: students placed in this timetable class in Elimu Plus. You can still copy emails or the join link manually if needed.
        </Typography>
        {rosterLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : rosterErr ? (
          <Alert severity="warning">{rosterErr}</Alert>
        ) : roster.length === 0 ? (
          <Alert severity="info">No student profiles found for this class (check placements under Create student profile).</Alert>
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                disabled={inviteEmails.length === 0}
                onClick={() => copy(inviteEmails.join("; "))}
              >
                Copy emails ({inviteEmails.length})
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={() => copy(inviteLines.join("\n"))}
              >
                Copy list (name · email · admission)
              </Button>
            </Stack>
            <TableContainer sx={{ maxHeight: 260, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Admission</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roster.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s?.user?.full_name || s?.user?.username || "—"}</TableCell>
                      <TableCell>{s?.user?.email || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "ui-monospace, monospace" }}>{s?.admission_number || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>
    ) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ pr: 5 }}>
        Online lesson — meeting links
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {subtitle}
          </Typography>
        ) : null}

        {rosterSection}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : err ? (
          <Alert severity="error" sx={{ mt: rosterSection ? 2 : 0 }}>
            {err}
          </Alert>
        ) : (
          <Stack spacing={2} sx={{ mt: rosterSection ? 2 : 0 }}>
            {reused ? (
              <Alert severity="info">Reusing the latest saved links for this lesson (same calendar slot).</Alert>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Host / start here (teacher)
            </Typography>
            <TextField
              size="small"
              fullWidth
              label="Host URL"
              value={host}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="Copy host URL" onClick={() => copy(host)}>
                      <ContentCopyOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" sx={{ alignSelf: "stretch" }}>
              {isInAppVideo ? (
                <>
                  <Button
                    variant="contained"
                    disabled={!live?.id}
                    sx={{ alignSelf: "flex-start" }}
                    onClick={() => {
                      onClose?.();
                      navigate(hostRoomPath);
                    }}
                  >
                    Start class (in-app video)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewRoundedIcon />}
                    disabled={!live?.id}
                    sx={{ alignSelf: "flex-start" }}
                    onClick={() => window.open(hostRoomPath, "_blank", "noopener,noreferrer")}
                  >
                    Open class in new tab
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    href={host || "#"}
                    target="_self"
                    rel="noopener noreferrer"
                    disabled={!host}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Open host link here
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNewRoundedIcon />}
                    href={host || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!host}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Open host link in new tab
                  </Button>
                </>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {isInAppVideo
                ? "WebRTC in-app room — no Jitsi. Students join from their portal bell notification or Classes page."
                : "External meeting link — share the join URL with your class."}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Student join link
            </Typography>
            <TextField
              size="small"
              fullWidth
              label="Join URL"
              value={join}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="Copy join URL" onClick={() => copy(join)}>
                      <ContentCopyOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
              <Button
                variant="contained"
                color="secondary"
                href={join || "#"}
                target="_self"
                rel="noopener noreferrer"
                disabled={!join}
                sx={{ alignSelf: "flex-start" }}
              >
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
                sx={{ alignSelf: "flex-start" }}
              >
                Open join link in new tab
              </Button>
            </Stack>
            {isInAppVideo ? (
              <Typography variant="body2" color="text.secondary">
                Student join link (portal): <strong>{join || "—"}</strong>
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Share the join URL with your class, or set <code>ONLINE_MEETING_PLATFORM=livekit</code> on the API for in-app video (recommended for large classes).
              </Typography>
            )}

            {curriculumClassId ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Notify class (system — student portal bell)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
                  Sends one <strong>school-system notification</strong> to each student account in this class (no email). They see it on the public portal notification icon with the join link. Requires meeting links above so the URL can be attached.
                </Typography>
                <TextField
                  label="Optional note for students"
                  placeholder="e.g. Please join 5 minutes early with your headset."
                  value={notifyNote}
                  onChange={(e) => setNotifyNote(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  inputProps={{ maxLength: 2000 }}
                />
                <Button
                  variant="contained"
                  color="warning"
                  disabled={notifyBusy || !join}
                  onClick={() => void sendClassNotifications()}
                  sx={{ alignSelf: "flex-start", fontWeight: 800 }}
                >
                  {notifyBusy ? "Sending…" : "Notify all students in class"}
                </Button>
                {!join ? (
                  <Typography variant="caption" color="text.secondary">
                    Prepare meeting links first so a join URL exists.
                  </Typography>
                ) : null}
                {notifyFeedback ? (
                  <Alert severity={notifyFeedback.severity}>{notifyFeedback.text}</Alert>
                ) : null}
              </>
            ) : null}

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <VideoLibraryOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Portal attendance & recordings
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                disabled={trackLoading}
                onClick={() => void loadTracking()}
              >
                Refresh
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
              This list is <strong>portal attendance only</strong> — students who opened the in-app class from their portal (Classes page or notification). It is not the video roster above. Teachers joining from admin are not listed here. If a student sees a warning about attendance, their profile class may not match this lesson&apos;s class.
            </Typography>
            {trackLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            ) : trackErr ? (
              <Alert severity="warning">{trackErr}</Alert>
            ) : !lc ? (
              <Alert severity="info">No live session saved for this slot yet — finish preparing links above.</Alert>
            ) : (
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  Session summary · tracked joins: <strong>{attendances.length}</strong>
                  {typeof lc.attendance_count === "number" ? (
                    <>
                      {" "}
                      · counter on session: <strong>{lc.attendance_count}</strong>
                    </>
                  ) : null}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Students who joined (portal)
                </Typography>
                {attendances.length === 0 ? (
                  <Alert severity="info">
                    No portal joins recorded yet. Ask students to use <strong>Join live class</strong> on their portal Classes page (not only the teacher video room). Refreshes every 15s while this dialog is open.
                  </Alert>
                ) : (
                  <TableContainer sx={{ maxHeight: 220, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Joined</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Left</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Minutes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendances.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              {row.student?.user?.full_name || row.student?.user?.username || "—"}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {row.join_time ? new Date(row.join_time).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {row.leave_time
                                ? new Date(row.leave_time).toLocaleString()
                                : row.join_time
                                ? "In class"
                                : "—"}
                            </TableCell>
                            <TableCell>{formatAttendanceMinutes(row)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Saved recordings (links)
                </Typography>
                {recordings.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recording metadata yet.
                  </Typography>
                ) : (
                  <Stack spacing={0.75}>
                    {recordings.map((r) => (
                      <Stack key={r.id} direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Button
                          size="small"
                          variant="text"
                          href={r.recording_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          disabled={!r.recording_url}
                          sx={{ textTransform: "none", justifyContent: "flex-start", maxWidth: "100%" }}
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
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Add recording
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Recording URL"
                    placeholder="https://…"
                    value={recUrl}
                    onChange={(e) => setRecUrl(e.target.value)}
                  />
                  <TextField
                    size="small"
                    sx={{ width: { xs: "100%", sm: 140 } }}
                    label="Duration (sec)"
                    type="number"
                    inputProps={{ min: 0 }}
                    value={recDur}
                    onChange={(e) => setRecDur(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    disabled={recSaving || !recUrl.trim()}
                    onClick={() => void saveRecording()}
                    sx={{ flexShrink: 0 }}
                  >
                    {recSaving ? "Saving…" : "Save"}
                  </Button>
                </Stack>
                {recFeedback ? <Alert severity={recFeedback.severity}>{recFeedback.text}</Alert> : null}
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {typeof onGoToDayTimetable === "function" && lessonDateIso ? (
          <Button
            color="inherit"
            onClick={() => {
              onGoToDayTimetable(lessonDateIso);
              onClose();
            }}
          >
            Day timetable
          </Button>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
