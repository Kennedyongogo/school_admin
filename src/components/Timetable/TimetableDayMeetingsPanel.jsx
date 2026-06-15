import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import { format } from "date-fns";
import AdminMeetingReportDialog from "../AdminMeetings/AdminMeetingReportDialog";
import {
  canEndStaleAdminMeetingLive,
  canNotifyAdminMeetingStaff,
  getAdminMeetingJoinWindow,
  getAdminMeetingStatusLabel,
} from "../../utils/adminMeetingJoinWindow";
import { authHeaders, meetingAccent, primaryRed } from "./timetableShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  PremiumDialog,
  DetailField,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  TimetableActionButton,
  MeetingStatusChip,
  timetableInputSx,
  timetableSwal,
} from "./timetableUi";

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
      void timetableSwal({
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
      void timetableSwal({
        icon: "success",
        title: "Staff notified",
        text: `${data.data?.in_app_notifications_created ?? 0} notification(s) sent.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      void timetableSwal({ icon: "error", title: "Notify failed", text: e.message || "Could not notify staff" });
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
      void timetableSwal({
        icon: "success",
        title: "Meeting ended",
        text: data.message || "Live session ended.",
        timer: 2200,
        showConfirmButton: false,
      });
      await load();
    } catch (e) {
      void timetableSwal({ icon: "error", title: "End live failed", text: e.message || "Could not end meeting" });
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
      <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
        {rows.length === 0 && !loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No staff meetings for this date yet. Use <strong>Schedule staff meeting</strong> to add one.
          </Typography>
        ) : (
          <DataTableShell>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell width={52}>No.</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Host</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
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
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
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
                        <MeetingStatusChip label={statusLabel} warning={joinWin.past_scheduled_end} />
                      </TableCell>
                      <TableCell align="center">
                        <TimetableActionButton title="View" onClick={() => setViewRow(row)}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </TimetableActionButton>
                        {joinWin.can_join ? (
                          <TimetableActionButton title={joinTitle} onClick={() => navigate(`/live/meeting/${row.id}`)}>
                            <VideocamOutlinedIcon fontSize="small" />
                          </TimetableActionButton>
                        ) : null}
                        {showEndLive ? (
                          <TimetableActionButton
                            title="End live session"
                            color="error"
                            disabled={endLiveBusyId === row.id}
                            onClick={() => void endLiveMeeting(row)}
                          >
                            {endLiveBusyId === row.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <StopCircleOutlinedIcon fontSize="small" />
                            )}
                          </TimetableActionButton>
                        ) : null}
                        {row.is_creator && canNotify ? (
                          <TimetableActionButton
                            title="Notify staff"
                            disabled={notifyBusyId === row.id}
                            onClick={() => void notifyStaff(row)}
                          >
                            <NotificationsActiveOutlinedIcon fontSize="small" />
                          </TimetableActionButton>
                        ) : null}
                        {row.is_creator ? (
                          <TimetableActionButton title="Edit" onClick={() => openEdit(row)}>
                            <EditOutlinedIcon fontSize="small" />
                          </TimetableActionButton>
                        ) : null}
                        <TimetableActionButton title="Report" onClick={() => setReportRow(row)}>
                          <AssessmentOutlinedIcon fontSize="small" />
                        </TimetableActionButton>
                        {row.is_creator ? (
                          <TimetableActionButton title="Cancel meeting" color="error" onClick={() => setDeleteRow(row)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </TimetableActionButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </TabPanelShell>

      <PremiumDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title={editRow ? "Edit staff meeting" : "Schedule staff meeting"}
        subtitle={isoDate}
        icon={<GroupsOutlinedIcon sx={{ color: "#fff" }} />}
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={saving} onClick={submit}>
              {editRow ? "Update" : "Schedule"}
            </DialogPrimaryButton>
          </Stack>
        }
      >
        {formError ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }}>
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
            sx={timetableInputSx}
          />
          <TextField
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
            sx={timetableInputSx}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TimePicker
                label="Start time"
                value={form.startTime}
                onChange={(v) => setForm((f) => ({ ...f, startTime: v }))}
                sx={{ flex: 1 }}
                slotProps={{ textField: { fullWidth: true, sx: timetableInputSx } }}
              />
              <TimePicker
                label="End time"
                value={form.endTime}
                onChange={(v) => setForm((f) => ({ ...f, endTime: v }))}
                sx={{ flex: 1 }}
                slotProps={{ textField: { fullWidth: true, sx: timetableInputSx } }}
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
                  sx={timetableInputSx}
                />
              ) : null}
            </>
          ) : null}
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.title || "Meeting"}
        icon={<GroupsOutlinedIcon sx={{ color: "#fff" }} />}
        maxWidth="xs"
        footer={<DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>}
      >
        <Stack spacing={1.5}>
          <DetailField label="Host" value={`${hostLabel(viewRow)}${viewRow?.is_creator ? " (you)" : ""}`} />
          <DetailField label="Description" value={viewRow?.description} />
          <DetailField label="Status" value={viewRow?.session_status || viewRow?.status} />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={!!deleteRow}
        onClose={() => !deleteDoing && setDeleteRow(null)}
        title="Cancel meeting?"
        subtitle={deleteRow?.title}
        maxWidth="xs"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={() => setDeleteRow(null)} disabled={deleteDoing}>
              No
            </DialogGhostButton>
            <DialogPrimaryButton loading={deleteDoing} onClick={confirmDelete} sx={{ bgcolor: primaryRed }}>
              Yes, cancel
            </DialogPrimaryButton>
          </Stack>
        }
      >
        <Typography variant="body2" color="text.secondary">
          This cancels the staff meeting for this date.
        </Typography>
      </PremiumDialog>

      <AdminMeetingReportDialog meeting={reportRow} open={!!reportRow} onClose={() => setReportRow(null)} />
    </>
  );
}
