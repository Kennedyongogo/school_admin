import React, { useCallback, useEffect, useState } from "react";
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
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { format } from "date-fns";
import {
  EmptyListNotice,
  SessionGridItem,
  SessionsGrid,
} from "../components/OnlineHub/OnlineSessionCards";
import AdminMeetingReportDialog from "../components/AdminMeetings/AdminMeetingReportDialog";
import {
  canEndStaleAdminMeetingLive,
  getAdminMeetingJoinWindow,
} from "../utils/adminMeetingJoinWindow";

const accent = "#0F766E";
const accentDark = "#115E59";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

function toDatetimeLocalValue(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminMeetingsPage() {
  const navigate = useNavigate();
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [reportMeeting, setReportMeeting] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [endLiveBusyId, setEndLiveBusyId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMeetings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = `from=${encodeURIComponent(todayIso)}&days=42&limit=60`;
      const res = await fetch(`/api/admin-meetings?${q}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load meetings");
      setMeetings(Array.isArray(data.data) ? data.data : []);
    } catch {
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    load();
  }, [load]);

  const endLiveMeeting = async (m) => {
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
  };

  const openCreate = () => {
    const start = new Date();
    start.setMinutes(start.getMinutes() + 15 - (start.getMinutes() % 15));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      title: "",
      description: "",
      start_time: toDatetimeLocalValue(start),
      end_time: toDatetimeLocalValue(end),
    });
    setFormError("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin-meetings", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not create meeting");
      setCreateOpen(false);
      await load();
    } catch (e) {
      setFormError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
        ml: (theme) => theme.spacing(-3),
        mr: (theme) => theme.spacing(-3),
        mt: (theme) => theme.spacing(-2),
        minHeight: "calc(100vh - 112px)",
        background: "linear-gradient(180deg, #ecfdf5 0%, #fff 45%)",
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #14B8A6 115%)`,
          color: "#fff",
          px: { xs: 2.5, sm: 3 },
          py: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton size="small" onClick={() => navigate("/elimu-plus-online")} sx={{ color: "#fff" }}>
            <ArrowBackIcon />
          </IconButton>
          <GroupsRoundedIcon />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Staff meetings
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Schedule internal LiveKit meetings for all admin portal users. Only you admit participants if you created the meeting.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate} sx={{ bgcolor: "#fff", color: accentDark }}>
            Schedule
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : meetings.length === 0 ? (
          <EmptyListNotice
            icon={<GroupsRoundedIcon sx={{ fontSize: 48, color: accent }} />}
            title="No upcoming staff meetings"
            subtitle="Schedule a meeting so teachers, librarians, accountants, and admins can join after you admit them."
          />
        ) : (
          <SessionsGrid>
            {meetings.map((m) => {
              const start = m.start_time ? new Date(m.start_time) : null;
              const end = m.end_time ? new Date(m.end_time) : null;
              const timeLabel =
                start && end
                  ? `${format(start, "yyyy-MM-dd HH:mm")} – ${format(end, "HH:mm")}`
                  : "";
              const host = m.creator?.full_name || m.creator?.username || "Staff";
              const joinWin = getAdminMeetingJoinWindow(m);
              const showEndLive = canEndStaleAdminMeetingLive(m);
              return (
                <SessionGridItem key={m.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {m.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Host: {host}
                      {m.is_creator ? " (you)" : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[timeLabel, `Status: ${m.session_status || m.status}`].filter(Boolean).join(" · ")}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: "auto", pt: 1 }} flexWrap="wrap" useFlexGap>
                      {joinWin.can_join ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<VideocamRoundedIcon />}
                          onClick={() => navigate(`/live/meeting/${m.id}`)}
                          sx={{ bgcolor: accent }}
                        >
                          {m.is_creator ? "Host" : "Join"}
                        </Button>
                      ) : null}
                      {showEndLive ? (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          disabled={endLiveBusyId === m.id}
                          onClick={() => void endLiveMeeting(m)}
                        >
                          {endLiveBusyId === m.id ? "Ending…" : "End live"}
                        </Button>
                      ) : null}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AssessmentOutlinedIcon />}
                        onClick={() => setReportMeeting(m)}
                      >
                        Report
                      </Button>
                    </Stack>
                  </Box>
                </SessionGridItem>
              );
            })}
          </SessionsGrid>
        )}
      </Box>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule staff meeting</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Start"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving} sx={{ bgcolor: accent }}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <AdminMeetingReportDialog meeting={reportMeeting} open={!!reportMeeting} onClose={() => setReportMeeting(null)} />
    </Box>
  );
}
