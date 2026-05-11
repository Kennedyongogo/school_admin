import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const accent = "#DC2626";
const accentDark = "#B91C1C";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const toDateIso = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

const formatMaybeIso = (iso) => {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
};

export default function ExamProctorMonitorTab() {
  const [date, setDate] = useState(toDateIso(new Date()));
  const [statusMode, setStatusMode] = useState("active"); // active | all
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [schedules, setSchedules] = useState([]);

  const displaySchedules = useMemo(() => {
    const rows = Array.isArray(schedules) ? schedules : [];
    if (statusMode === "all") return rows.filter((r) => r.status !== "cancelled");
    return rows.filter((r) => r.status === "scheduled" || r.status === "live");
  }, [schedules, statusMode]);

  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const selectedSchedule = useMemo(
    () => displaySchedules.find((s) => String(s.id) === String(selectedScheduleId)) || null,
    [displaySchedules, selectedScheduleId]
  );

  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorRefreshing, setMonitorRefreshing] = useState(false);
  const [monitorError, setMonitorError] = useState("");
  const [monitor, setMonitor] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDialogStudent, setLogDialogStudent] = useState("");
  const [logDialogAttemptId, setLogDialogAttemptId] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState("");
  const [logRows, setLogRows] = useState([]);
  const [logFilter, setLogFilter] = useState("all");

  const loadSchedules = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSchedulesLoading(true);
    setSchedulesError("");
    try {
      const res = await fetch(
        `/api/exam-schedules?date=${encodeURIComponent(date)}&is_active=true`,
        { headers: authHeaders(token) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load exam schedules.");
      setSchedules(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setSchedulesError(e.message || "Could not load exam schedules.");
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!displaySchedules.length) {
      setSelectedScheduleId("");
      setMonitor(null);
      return;
    }
    const stillValid = displaySchedules.some((s) => String(s.id) === String(selectedScheduleId));
    if (!stillValid) setSelectedScheduleId(String(displaySchedules[0].id));
  }, [displaySchedules, selectedScheduleId]);

  const loadMonitor = useCallback(async (scheduleId, options = {}) => {
    const { silent = false } = options;
    const token = localStorage.getItem("token");
    if (!token || !scheduleId) return;
    if (silent) setMonitorRefreshing(true);
    else {
      setMonitorLoading(true);
      setMonitorError("");
    }
    try {
      const res = await fetch(`/api/exam-schedules/${encodeURIComponent(scheduleId)}/proctor-monitor`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load proctor monitor.");
      setMonitor(data.data || null);
      setLastUpdatedAt(new Date().toISOString());
      if (!silent) setMonitorError("");
    } catch (e) {
      if (!silent) {
        setMonitorError(e.message || "Could not load proctor monitor.");
        setMonitor(null);
      }
    } finally {
      if (silent) setMonitorRefreshing(false);
      else setMonitorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedScheduleId) return;
    void loadMonitor(selectedScheduleId, { silent: false });
  }, [selectedScheduleId, loadMonitor]);

  useEffect(() => {
    if (!autoRefresh || !selectedScheduleId) return undefined;
    const id = window.setInterval(() => {
      void loadMonitor(selectedScheduleId, { silent: true });
    }, 8000);
    return () => window.clearInterval(id);
  }, [autoRefresh, selectedScheduleId, loadMonitor]);

  const rosterRows = monitor?.roster_rows || [];
  const summary = monitor?.summary || { total: 0, not_started: 0, in_progress: 0, submitted: 0 };
  const filteredLogRows =
    logFilter === "all" ? logRows : logRows.filter((r) => String(r?.event_type || "") === logFilter);

  const openSessionLog = async (row) => {
    const token = localStorage.getItem("token");
    const attemptId = row?.attempt?.id;
    if (!token || !attemptId) return;
    setLogDialogStudent(row?.student?.user?.full_name || row?.student?.user?.username || "Student");
    setLogDialogAttemptId(attemptId);
    setLogDialogOpen(true);
    setLogLoading(true);
    setLogError("");
    setLogRows([]);
    setLogFilter("all");
    try {
      const res = await fetch(`/api/exam-session-logs?exam_attempt_id=${encodeURIComponent(attemptId)}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load session logs.");
      setLogRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setLogError(e.message || "Could not load session logs.");
    } finally {
      setLogLoading(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 0.5, sm: 0 }, py: 1 }}>
      <Card elevation={0} sx={{ border: "1px solid #FEE2E2", mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2}>
            <TextField
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 260 } }}>
              <Select value={statusMode} onChange={(e) => setStatusMode(e.target.value)} displayEmpty>
                <MenuItem value="active">Active only (scheduled + live)</MenuItem>
                <MenuItem value="all">All (except cancelled)</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
              <Select
                value={autoRefresh ? "on" : "off"}
                onChange={(e) => setAutoRefresh(e.target.value === "on")}
                displayEmpty
              >
                <MenuItem value="on">Auto refresh: On</MenuItem>
                <MenuItem value="off">Auto refresh: Off</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 360 }, flex: 1 }}>
              <Select
                value={selectedScheduleId}
                onChange={(e) => setSelectedScheduleId(e.target.value)}
                displayEmpty
              >
                {displaySchedules.length ? null : <MenuItem value="">No schedules</MenuItem>}
                {displaySchedules.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.exam?.title || "Exam"} · {s.curriculum_class?.name || s.curriculum_class_level?.name || "Class"}{" "}
                    · {s.status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

          </Stack>
        </CardContent>
      </Card>

      {schedulesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      ) : schedulesError ? (
        <Alert severity="error">{schedulesError}</Alert>
      ) : null}

      {monitorLoading && !monitor ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      ) : monitorError && !monitor ? (
        <Alert severity="error">{monitorError}</Alert>
      ) : null}

      {!monitorLoading && monitor ? (
        <Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip label={`Total: ${summary.total}`} size="small" />
            <Chip label={`Not started: ${summary.not_started}`} size="small" color="default" />
            <Chip label={`In progress: ${summary.in_progress}`} size="small" color="warning" />
            <Chip label={`Submitted: ${summary.submitted}`} size="small" color="success" />
            {monitorRefreshing ? <Chip label="Updating..." size="small" variant="outlined" /> : null}
            {lastUpdatedAt ? <Chip label={`Updated: ${formatMaybeIso(lastUpdatedAt)}`} size="small" variant="outlined" /> : null}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {rosterRows.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 1.25,
              }}
            >
              {rosterRows.map((r, idx) => {
                const fullName = r.student?.user?.full_name || r.student?.user?.username || r.student?.user?.email || "Student";
                const status = r.status || "not_started";
                const chipColor =
                  status === "submitted" || status === "completed"
                    ? "success"
                    : status === "closed"
                      ? "error"
                    : status === "in_progress"
                      ? "warning"
                      : "default";
                return (
                  <Card key={r.student?.id || `${fullName}-${idx}`} variant="outlined" sx={{ borderColor: "#FEE2E2" }}>
                    <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                      <Stack spacing={0.75}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {fullName}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={String(status).split("_").join(" ")} color={chipColor} />
                          <Chip size="small" label={`Tab: ${r.tab_switch_count ?? 0}`} variant="outlined" />
                          <Chip size="small" label={`Warnings: ${r.warning_count ?? 0}`} variant="outlined" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Webcam: {r.webcam_enabled ? "On" : "Off"}
                        </Typography>
                        {r.cancellation_reason ? (
                          <Typography variant="caption" color="error.main">
                            Closed reason: {String(r.cancellation_reason)}
                          </Typography>
                        ) : null}
                        <Typography variant="caption" color="text.secondary">
                          Last activity: {formatMaybeIso(r.last_activity_at)}
                        </Typography>
                        <Button
                          size="small"
                          variant="text"
                          sx={{ alignSelf: "flex-start", px: 0 }}
                          disabled={!r?.attempt?.id}
                          onClick={() => void openSessionLog(r)}
                        >
                          View session log
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Alert severity="info">No roster rows found for this schedule.</Alert>
          )}
        </Box>
      ) : null}

      {!monitorLoading && !monitor && !schedulesLoading ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Pick an exam schedule to open proctor monitor.
        </Alert>
      ) : null}

      <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Session log - {logDialogStudent}</DialogTitle>
        <DialogContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1.25 }}>
            <TextField size="small" label="Attempt ID" value={logDialogAttemptId} InputProps={{ readOnly: true }} fullWidth />
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
              <Select value={logFilter} onChange={(e) => setLogFilter(e.target.value)}>
                <MenuItem value="all">All events</MenuItem>
                {[...new Set((logRows || []).map((r) => String(r?.event_type || "")).filter(Boolean))].map((ev) => (
                  <MenuItem key={ev} value={ev}>
                    {ev}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {logLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} sx={{ color: accent }} />
            </Box>
          ) : logError ? (
            <Alert severity="error">{logError}</Alert>
          ) : filteredLogRows.length ? (
            <Stack spacing={1}>
              {filteredLogRows.map((r) => (
                <Card key={r.id} variant="outlined" sx={{ borderColor: "#FEE2E2" }}>
                  <CardContent sx={{ p: 1.1, "&:last-child": { pb: 1.1 } }}>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip size="small" label={r.event_type || "event"} />
                        <Typography variant="caption" color="text.secondary">
                          {formatMaybeIso(r.event_timestamp)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Time: {r.cumulative_time_seconds ?? 0}s elapsed / {r.remaining_time_seconds ?? 0}s remaining
                      </Typography>
                      {r.event_data != null ? (
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {JSON.stringify(r.event_data)}
                        </Typography>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">No session logs found for this attempt.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

