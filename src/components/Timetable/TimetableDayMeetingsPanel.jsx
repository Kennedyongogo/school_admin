import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { format } from "date-fns";
import Swal from "sweetalert2";
import AdminMeetingReportDialog from "../AdminMeetings/AdminMeetingReportDialog";
import {
  canEndStaleAdminMeetingLive,
  canNotifyAdminMeetingStaff,
  getAdminMeetingJoinWindow,
  getAdminMeetingStatusLabel,
} from "../../utils/adminMeetingJoinWindow";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const meetingAccent = "#0F766E";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const dialogPaperSx = {
  borderRadius: 3,
  overflow: "hidden",
  boxShadow: "0 24px 56px rgba(15, 118, 110, 0.14)",
};

function formatTimeForApi(value) {
  if (!value || !value.isValid?.()) return null;
  return value.format("HH:mm:ss");
}

function hostLabel(row) {
  return row?.creator?.full_name || row?.creator?.username || "—";
}

export default function TimetableDayMeetingsPanel({ isoDate, openCreateSignal = 0 }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleteDoing, setDeleteDoing] = useState(false);
  const [reportRow, setReportRow] = useState(null);
  const [notifyBusyId, setNotifyBusyId] = useState(null);
  const [endLiveBusyId, setEndLiveBusyId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: null,
    endTime: null,
    notifyStaff: true,
    notifyNote: "",
  });

  const load = useCallback(async () => {
    if (!isoDate) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin-meetings/by-date?date=${encodeURIComponent(isoDate)}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load meetings");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message || "Failed to load meetings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isoDate]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditRow(null);
    setFormError(null);
    setForm({
      title: "",
      description: "",
      startTime: dayjs(`${isoDate}T09:00:00`),
      endTime: dayjs(`${isoDate}T10:00:00`),
      notifyStaff: true,
      notifyNote: "",
    });
    setDialogOpen(true);
  }, [isoDate]);

  useEffect(() => {
    if (openCreateSignal > 0) openCreate();
  }, [openCreateSignal, openCreate]);

  const openEdit = (row) => {
    setEditRow(row);
    setFormError(null);
    setForm({
      title: row.title || "",
      description: row.description || "",
      startTime: row.start_time ? dayjs(row.start_time) : dayjs(`${isoDate}T09:00:00`),
      endTime: row.end_time ? dayjs(row.end_time) : dayjs(`${isoDate}T10:00:00`),
      notifyStaff: false,
      notifyNote: "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    const startStr = formatTimeForApi(form.startTime);
    const endStr = formatTimeForApi(form.endTime);
    if (!startStr || !endStr) {
      setFormError("Start and end time are required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_time: `${isoDate}T${startStr}`,
        end_time: `${isoDate}T${endStr}`,
        ...(!editRow && form.notifyStaff
          ? {
              notify_staff: true,
              notify_note: form.notifyNote.trim() || undefined,
            }
          : {}),
      };
      const res = await fetch(editRow ? `/api/admin-meetings/${editRow.id}` : "/api/admin-meetings", {
        method: editRow ? "PUT" : "POST",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || (editRow ? "Update failed" : "Create failed"));
      }
      setDialogOpen(false);
      await load();
      const notified = data.notify?.in_app_notifications_created;
      const updated = data.data;
      const joinAfterEdit = updated ? getAdminMeetingJoinWindow(updated) : null;
      let editHint = "";
      if (editRow && joinAfterEdit?.can_join) {
        editHint = joinAfterEdit.resume_after_end
          ? "You can open the live room and click Start live again."
          : "You can host or notify staff again during the updated time.";
      } else if (editRow && joinAfterEdit?.past_scheduled_end) {
        editHint = "The new end time is still in the past. Set a later end time to reopen hosting.";
      }
      void Swal.fire({
        icon: "success",
        title: editRow ? "Meeting updated" : "Meeting scheduled",
        text:
          editHint ||
          (!editRow && form.notifyStaff && notified != null
            ? `${notified} staff notification(s) sent.`
            : undefined),
        timer: editHint || notified != null ? 3200 : 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      setFormError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const notifyStaff = async (row, note = "") => {
    const token = localStorage.getItem("token");
    if (!token || !row?.id) return;
    setNotifyBusyId(row.id);
    try {
      const res = await fetch(`/api/admin-meetings/${row.id}/notify-staff`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not notify staff");
      void Swal.fire({
        icon: "success",
        title: "Staff notified",
        text: `${data.data?.in_app_notifications_created ?? 0} notification(s) sent.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      void Swal.fire({ icon: "error", title: "Notify failed", text: e.message || "Could not notify staff" });
    } finally {
      setNotifyBusyId(null);
    }
  };

  const endLiveMeeting = async (row) => {
    const token = localStorage.getItem("token");
    if (!token || !row?.id) return;
    setEndLiveBusyId(row.id);
    try {
      const res = await fetch(`/api/admin-meetings/${row.id}/live/end`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not end live session");
      void Swal.fire({
        icon: "success",
        title: "Meeting ended",
        text: data.message || "Live session ended.",
        timer: 2200,
        showConfirmButton: false,
      });
      await load();
    } catch (e) {
      void Swal.fire({ icon: "error", title: "End live failed", text: e.message || "Could not end meeting" });
    } finally {
      setEndLiveBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token || !deleteRow) return;
    setDeleteDoing(true);
    try {
      const res = await fetch(`/api/admin-meetings/${deleteRow.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      setDeleteRow(null);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed");
      setDeleteRow(null);
    } finally {
      setDeleteDoing(false);
    }
  };

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress sx={{ color: meetingAccent }} size={36} />
        </Box>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No staff meetings for this date yet. Use <strong>Schedule staff meeting</strong> to add one. You will admit
          participants when they join from Elimu Plus Online.
        </Typography>
      ) : (
        <TableContainer sx={{ borderRadius: 1, border: `1px solid ${primaryLight}`, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: `${meetingAccent}14` }}>
                <TableCell width={52}>No.</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, idx) => {
                const joinWin = getAdminMeetingJoinWindow(row);
                const canNotify = canNotifyAdminMeetingStaff(row);
                const showEndLive = canEndStaleAdminMeetingLive(row);
                const statusLabel = getAdminMeetingStatusLabel(row);
                const joinTitle = joinWin.can_join
                  ? row.is_creator
                    ? "Host live room"
                    : "Join meeting"
                  : joinWin.reason || "Join closed";

                return (
                <TableRow key={row.id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>
                    {hostLabel(row)}
                    {row.is_creator ? " (you)" : ""}
                  </TableCell>
                  <TableCell>
                    {row.start_time && row.end_time
                      ? `${format(new Date(row.start_time), "HH:mm")} – ${format(new Date(row.end_time), "HH:mm")}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: joinWin.past_scheduled_end ? "warning.dark" : "text.primary",
                        fontWeight: joinWin.past_scheduled_end ? 600 : 400,
                      }}
                    >
                      {statusLabel}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.25} justifyContent="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => setViewRow(row)} sx={{ color: primaryDark }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {joinWin.can_join ? (
                        <Tooltip title={joinTitle}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/live/meeting/${row.id}`)}
                            sx={{ color: meetingAccent }}
                          >
                            <VideocamOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      {showEndLive ? (
                        <Tooltip title="End live session (scheduled time has passed)">
                          <span style={{ display: "inline-flex", alignItems: "center" }}>
                            <IconButton
                              size="small"
                              disabled={endLiveBusyId === row.id}
                              onClick={() => void endLiveMeeting(row)}
                              sx={{ color: primaryRed }}
                            >
                              {endLiveBusyId === row.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <StopCircleOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                      {row.is_creator && canNotify ? (
                        <Tooltip title="Notify staff">
                          <span>
                            <IconButton
                              size="small"
                              disabled={notifyBusyId === row.id}
                              onClick={() => void notifyStaff(row)}
                              sx={{ color: "#D97706" }}
                            >
                              <NotificationsActiveOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                      {row.is_creator ? (
                        <Tooltip
                          title={
                            joinWin.past_scheduled_end
                              ? "Edit times (extend end time to continue the meeting)"
                              : "Edit"
                          }
                        >
                          <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: primaryDark }}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip title={row.session_status === "live" ? "Live report (updates as meeting runs)" : "Report"}>
                        <IconButton size="small" onClick={() => setReportRow(row)} sx={{ color: primaryDark }}>
                          <AssessmentOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {row.is_creator ? (
                        <Tooltip title="Cancel meeting">
                          <IconButton size="small" onClick={() => setDeleteRow(row)} sx={{ color: primaryRed }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, #115E59 0%, ${meetingAccent} 85%)`,
            color: "#fff",
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {editRow ? "Edit staff meeting" : "Schedule staff meeting"}
          </Typography>
          <IconButton onClick={() => !saving && setDialogOpen(false)} sx={{ color: "#fff" }} aria-label="Close">
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ pt: 2.5 }}>
          {formError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          ) : null}
          <Stack spacing={2}>
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
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TimePicker
                  label="Start time"
                  value={form.startTime}
                  onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                  sx={{ flex: 1 }}
                />
                <TimePicker
                  label="End time"
                  value={form.endTime}
                  onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                  sx={{ flex: 1 }}
                />
              </Stack>
            </LocalizationProvider>
            {!editRow ? (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.notifyStaff}
                      onChange={(e) => setForm((f) => ({ ...f, notifyStaff: e.target.checked }))}
                    />
                  }
                  label="Notify all staff when scheduled"
                />
                {form.notifyStaff ? (
                  <TextField
                    label="Note for staff (optional)"
                    value={form.notifyNote}
                    onChange={(e) => setForm((f) => ({ ...f, notifyNote: e.target.value }))}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="e.g. Please join 5 minutes early to test audio."
                  />
                ) : null}
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submit} disabled={saving} sx={{ bgcolor: meetingAccent }}>
            {saving ? "Saving…" : editRow ? "Update" : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {viewRow?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Host: {hostLabel(viewRow)}
          </Typography>
          {viewRow?.description ? (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {viewRow.description}
            </Typography>
          ) : null}
          <Typography variant="body2">
            Status: {viewRow?.session_status || viewRow?.status}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteRow} onClose={() => !deleteDoing && setDeleteRow(null)}>
        <DialogContent>
          <Typography>Cancel meeting &quot;{deleteRow?.title}&quot;?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)} disabled={deleteDoing}>
            No
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleteDoing}>
            Yes, cancel
          </Button>
        </DialogActions>
      </Dialog>

      <AdminMeetingReportDialog meeting={reportRow} open={!!reportRow} onClose={() => setReportRow(null)} />
    </>
  );
}
