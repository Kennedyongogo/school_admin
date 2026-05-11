import React, { useCallback, useEffect, useState } from "react";
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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VideoLibraryOutlinedIcon from "@mui/icons-material/VideoLibraryOutlined";

const headers = (token) => {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const uniqueEmails = (rows) => {
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
};

export default function OnlineExamLiveDialog({ open, onClose, examScheduleId, subtitle, onLinksReady }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [row, setRow] = useState(null);
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
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterErr, setRosterErr] = useState(null);
  const [roster, setRoster] = useState([]);

  const copy = (text) => {
    if (!text) return;
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  const loadTracking = useCallback(async () => {
    if (!examScheduleId) return;
    setTrackLoading(true);
    setTrackErr(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/exam-schedules/${examScheduleId}/live-tracking`, {
        headers: headers(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load tracking");
      setTrackPayload(data.data || null);
    } catch (e) {
      setTrackErr(e.message || "Request failed");
      setTrackPayload(null);
    } finally {
      setTrackLoading(false);
    }
  }, [examScheduleId]);

  useEffect(() => {
    if (!open || !examScheduleId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      setRow(null);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/exam-schedules/${examScheduleId}/live-session/initiate`, {
          method: "POST",
          headers: headers(token),
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not prepare meeting links");
        if (cancelled) return;
        setRow(data.data || null);
        onLinksReady?.();
      } catch (e) {
        if (!cancelled) setErr(e.message || "Request failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, examScheduleId, onLinksReady]);

  useEffect(() => {
    if (!open || !examScheduleId || loading) return undefined;
    let cancelled = false;
    (async () => {
      await loadTracking();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [open, examScheduleId, loading, loadTracking]);

  useEffect(() => {
    if (!open || !row?.curriculum_class_id) {
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
          curriculum_class_id: row.curriculum_class_id,
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
  }, [open, row?.curriculum_class_id]);

  const sendClassNotifications = async () => {
    if (!examScheduleId) return;
    setNotifyBusy(true);
    setNotifyFeedback(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/exam-schedules/${examScheduleId}/notify-class`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({ note: notifyNote.trim() ? notifyNote.trim().slice(0, 2000) : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not notify class");
      const d = data.data || {};
      setNotifyFeedback({
        severity: "success",
        text: `Sent ${d.in_app_notifications_created ?? 0} system notification(s) to ${d.students_targeted ?? 0} learner(s).`,
      });
      await loadTracking();
    } catch (e) {
      setNotifyFeedback({ severity: "error", text: e.message || "Notify failed" });
    } finally {
      setNotifyBusy(false);
    }
  };

  const saveRecording = async () => {
    if (!examScheduleId || !recUrl.trim()) return;
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
      const res = await fetch(`/api/exam-schedules/${examScheduleId}/live-recording`, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save recording");
      setRecFeedback({ severity: "success", text: "Recording link saved for this exam session." });
      setRecUrl("");
      setRecDur("");
      await loadTracking();
    } catch (e) {
      setRecFeedback({ severity: "error", text: e.message || "Save failed" });
    } finally {
      setRecSaving(false);
    }
  };

  const join = row?.meeting_join_url?.trim?.() ? String(row.meeting_join_url).trim() : "";
  const host = row?.meeting_host_url?.trim?.() ? String(row.meeting_host_url).trim() : join;
  const attendance = trackPayload?.attendance_rows ?? [];
  const recordings = trackPayload?.recordings ?? [];
  const inviteEmails = uniqueEmails(roster);
  const inviteLines = (roster || []).map((s) => {
    const name = s?.user?.full_name || s?.user?.username || "—";
    const email = s?.user?.email || "";
    const adm = s?.admission_number || "";
    return [name, email, adm].filter(Boolean).join(" · ");
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ pr: 5 }}>
        Online exam — meeting links
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
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : err ? (
          <Alert severity="error">{err}</Alert>
        ) : (
          <Stack spacing={2}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Students in this timetable class
                {row?.curriculum_class?.name ? (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 600, ml: 0.75 }}>
                    ({row.curriculum_class.name}
                    {row.curriculum_class.code ? ` (${row.curriculum_class.code})` : ""})
                  </Typography>
                ) : null}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
                Same roster used for <strong>Notify class (portal)</strong> below.
              </Typography>
              {rosterLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : rosterErr ? (
                <Alert severity="warning">{rosterErr}</Alert>
              ) : roster.length === 0 ? (
                <Alert severity="info">No student profiles found for this class yet.</Alert>
              ) : (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
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
                  <TableContainer sx={{ maxHeight: 220, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
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
            <Divider />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Host / start here (invigilator)
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="contained" href={host || "#"} target="_self" disabled={!host}>
                Open host link here
              </Button>
              <Button variant="outlined" startIcon={<OpenInNewRoundedIcon />} href={host || "#"} target="_blank" disabled={!host}>
                Open host link in new tab
              </Button>
            </Stack>
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
            <Typography variant="body2" color="text.secondary">
              Rooms use free <strong>Jitsi Meet</strong> by default (no API keys). To disable Jitsi and use only manual URLs, set <code>JITSI_DISABLED=1</code> and <code>ONLINE_MEETING_DEFAULT_JOIN_URL</code> on API.
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Notify class (system — student portal bell)
            </Typography>
            <TextField
              label="Optional note for students"
              placeholder="e.g. Join 5 minutes early with your webcam."
              value={notifyNote}
              onChange={(e) => setNotifyNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              size="small"
              inputProps={{ maxLength: 2000 }}
            />
            <Button variant="contained" color="warning" disabled={notifyBusy || !join} onClick={() => void sendClassNotifications()} sx={{ alignSelf: "flex-start", fontWeight: 800 }}>
              {notifyBusy ? "Sending…" : "Notify all students in class"}
            </Button>
            {notifyFeedback ? <Alert severity={notifyFeedback.severity}>{notifyFeedback.text}</Alert> : null}

            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" spacing={1}>
              <VideoLibraryOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Portal attendance & recordings
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<RefreshRoundedIcon />} disabled={trackLoading} onClick={() => void loadTracking()}>
                Refresh
              </Button>
            </Stack>
            {trackLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={28} />
              </Box>
            ) : trackErr ? (
              <Alert severity="warning">{trackErr}</Alert>
            ) : (
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  Session summary · tracked joins: <strong>{attendance.length}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Students who joined (portal)
                </Typography>
                {attendance.length === 0 ? (
                  <Alert severity="info">No portal joins recorded yet.</Alert>
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
                        {attendance.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.student?.user?.full_name || r.student?.user?.username || "—"}</TableCell>
                            <TableCell>{r.join_time ? new Date(r.join_time).toLocaleString() : "—"}</TableCell>
                            <TableCell>{r.leave_time ? new Date(r.leave_time).toLocaleString() : "—"}</TableCell>
                            <TableCell>{r.duration_minutes != null ? r.duration_minutes : "—"}</TableCell>
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
                        <Button size="small" variant="text" href={r.recording_url || "#"} target="_blank" disabled={!r.recording_url} sx={{ textTransform: "none" }}>
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
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <TextField size="small" fullWidth label="Recording URL" placeholder="https://…" value={recUrl} onChange={(e) => setRecUrl(e.target.value)} />
                  <TextField size="small" sx={{ width: { xs: "100%", sm: 140 } }} label="Duration (sec)" type="number" inputProps={{ min: 0 }} value={recDur} onChange={(e) => setRecDur(e.target.value)} />
                  <Button variant="contained" disabled={recSaving || !recUrl.trim()} onClick={() => void saveRecording()} sx={{ flexShrink: 0 }}>
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
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

