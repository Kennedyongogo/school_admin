import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import SummarizeIcon from "@mui/icons-material/Summarize";

const accent = "#DC2626";
const accentDark = "#B91C1C";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function StatCard({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, textAlign: "center", height: "100%" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: color || "text.primary", lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function EventReportDialog({ open, event, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!event?.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/report`, { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load report.");
      setReport(json.data);
    } catch (e) {
      setError(e.message || "Could not load report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [event?.id]);

  useEffect(() => {
    if (open && event?.id) void load();
    if (!open) {
      setReport(null);
      setError("");
    }
  }, [open, event?.id, load]);

  const handleExportPdf = async () => {
    if (!event?.id) return;
    const token = localStorage.getItem("token");
    setExporting(true);
    try {
      const res = await fetch(`/api/events/${event.id}/report/export`, { headers: authHeaders(token) });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event-report-${event.slug || event.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const sum = report?.summary;
  const ev = report?.event;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SummarizeIcon color="primary" />
          <span>Online event report — {event?.title}</span>
        </Stack>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : report ? (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={ev?.event_type} size="small" />
              <Chip label={ev?.delivery_mode} size="small" />
              <Chip label={ev?.session_status || "scheduled"} size="small" color="primary" />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                {fmtDate(ev?.start_date)} — {fmtDate(ev?.end_date)}
              </Typography>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Lobby requests" value={sum.total_lobby_requests} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Unique participants" value={sum.unique_participants} color="success.main" />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Denied (visits)" value={sum.denied} color="error.main" />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Total minutes" value={sum.total_minutes_in_event} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Avg minutes" value={sum.avg_minutes_in_event} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Chat messages" value={sum.total_chat_messages} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Questions" value={sum.total_questions} />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Answered" value={sum.questions_answered} color="success.main" />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                <StatCard label="Reactions" value={sum.total_reactions} />
              </Grid>
            </Grid>

            {Object.keys(sum.reaction_counts || {}).length > 0 ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                  Reactions
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {Object.entries(sum.reaction_counts).map(([emoji, count]) => (
                    <Chip key={emoji} label={`${emoji} ${count}`} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            ) : null}

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Attendance — unique participants ({report.attendees?.length ?? 0})
              </Typography>
              <Paper variant="outlined" sx={{ overflow: "auto", maxHeight: 220 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Minutes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(report.attendees || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ color: "text.secondary" }}>
                          No lobby activity recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      report.attendees.map((a) => (
                        <TableRow key={a.user?.id || a.id}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {a.user?.full_name || a.user?.username || "—"}
                          </TableCell>
                          <TableCell>{a.user?.role || "—"}</TableCell>
                          <TableCell>{a.status}</TableCell>
                          <TableCell>{a.minutes_in_event ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Chat & questions ({report.chat?.length ?? 0})
              </Typography>
              <Paper variant="outlined" sx={{ overflow: "auto", maxHeight: 240, p: 1.5 }}>
                {(report.chat || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No messages recorded.
                  </Typography>
                ) : (
                  <Stack spacing={1.25}>
                    {report.chat.map((m) => (
                      <Box key={m.id} sx={{ p: 1, borderRadius: 1, bgcolor: "action.hover" }}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {m.author?.full_name || m.author?.username} · {m.author?.role}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(m.sent_at)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.5} sx={{ mb: 0.25 }}>
                          {m.is_question ? (
                            <Chip
                              size="small"
                              label={m.is_answered ? "Answered" : "Question"}
                              color={m.is_answered ? "success" : "warning"}
                              sx={{ height: 18, fontSize: "0.65rem" }}
                            />
                          ) : (
                            <Chip size="small" label="Chat" sx={{ height: 18, fontSize: "0.65rem" }} />
                          )}
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                          {m.message}
                        </Typography>
                        {(m.replies || []).map((r) => (
                          <Box key={r.id} sx={{ mt: 0.75, pl: 1.5, borderLeft: 2, borderColor: accent }}>
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {r.author?.full_name || r.author?.username} (reply)
                            </Typography>
                            <Typography variant="body2">{r.message}</Typography>
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Report generated {fmtDate(report.generated_at)}
            </Typography>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
          disabled={!report || exporting}
          onClick={() => void handleExportPdf()}
        >
          Download PDF
        </Button>
        <Button variant="contained" onClick={() => void load()} disabled={loading} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}>
          Refresh
        </Button>
      </DialogActions>
    </Dialog>
  );
}
