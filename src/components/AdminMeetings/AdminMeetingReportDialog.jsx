import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export default function AdminMeetingReportDialog({ meeting, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!open) {
      setReport(null);
      setError("");
      return undefined;
    }
    if (!meeting?.id) return undefined;
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/admin-meetings/${meeting.id}/report`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load report");
        if (!cancelled) setReport(data.data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, meeting?.id]);

  const downloadPdf = async () => {
    const token = localStorage.getItem("token");
    if (!token || !meeting?.id) return;
    const res = await fetch(`/api/admin-meetings/${meeting.id}/report/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message || "PDF export failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-meeting-report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sum = report?.summary;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Meeting report — {meeting?.title}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : report ? (
          <Stack spacing={2}>
            {meeting?.session_status === "live" || meeting?.status === "live" ? (
              <Alert severity="info">
                This meeting is still live. Figures update as staff join, chat, and react. End the meeting for final
                attendance minutes.
              </Alert>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              Unique participants: {sum?.unique_participants ?? 0} · Total minutes: {sum?.total_minutes_in_event ?? 0} ·
              Questions: {sum?.total_questions ?? 0} · Reactions: {sum?.total_reactions ?? 0}
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Attendance summary
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Visits</TableCell>
                  <TableCell>Minutes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(report.attendees || []).map((a) => (
                  <TableRow key={a.user?.id || a.id}>
                    <TableCell>{a.user?.full_name || a.user?.username || "—"}</TableCell>
                    <TableCell>{a.user?.role || "—"}</TableCell>
                    <TableCell>{a.visit_count ?? 1}</TableCell>
                    <TableCell>{a.minutes_in_event ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(report.attendance_log || []).length > 0 ? (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Attendance log
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Min</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.attendance_log.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.visit_number}</TableCell>
                        <TableCell>{v.user?.full_name || v.user?.username}</TableCell>
                        <TableCell>{v.status}</TableCell>
                        <TableCell>{v.minutes_in_event ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={downloadPdf} disabled={!report}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
