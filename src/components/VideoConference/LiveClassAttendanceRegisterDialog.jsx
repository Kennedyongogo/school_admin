import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import { authHeaders } from "../SchoolProfile/elimuPlusShared";

const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  LATE: "late",
};

function statusColor(status) {
  if (status === STATUS.PRESENT) return "success";
  if (status === STATUS.LATE) return "warning";
  if (status === STATUS.ABSENT) return "error";
  return "default";
}

function statusLabel(status) {
  if (status === STATUS.PRESENT) return "Present";
  if (status === STATUS.LATE) return "Late";
  if (status === STATUS.ABSENT) return "Absent";
  return "—";
}

function entriesToRoster(entries) {
  return (entries || [])
    .map((e) => ({
      id: e.student_id,
      admission_number: e.student?.admission_number,
      user: e.student?.user,
      portal_joined: !!e.portal_joined,
    }))
    .filter((s) => s.id);
}

export default function LiveClassAttendanceRegisterDialog({
  open,
  onClose,
  token,
  liveClassId,
  lessonId,
  curriculumClassId,
  curriculumClassLabel,
  subjectName,
  lessonDate,
  hostName,
}) {
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [roster, setRoster] = useState([]);
  const [portalJoinedIds, setPortalJoinedIds] = useState(() => new Set());
  const [marks, setMarks] = useState({});
  const [registerStatus, setRegisterStatus] = useState("draft");
  const [displayHost, setDisplayHost] = useState(hostName || "");
  const [autoSaveState, setAutoSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const readOnly = registerStatus === "finalized";

  const registerUrl = lessonId
    ? `/api/curricula/timetable-lessons/${encodeURIComponent(lessonId)}/attendance-register`
    : null;

  const loadRegister = useCallback(async () => {
    if (!registerUrl || !token) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const q = liveClassId ? `?live_class_id=${encodeURIComponent(liveClassId)}` : "";
      const res = await fetch(`${registerUrl}${q}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load attendance register");
      const payload = data.data || {};
      setMarks(payload.marks && typeof payload.marks === "object" ? payload.marks : {});
      setRoster(entriesToRoster(payload.entries));
      setPortalJoinedIds(
        new Set((payload.entries || []).filter((e) => e.portal_joined).map((e) => e.student_id))
      );
      setRegisterStatus(payload.status || "draft");
      setDisplayHost(payload.host_name || hostName || "");
      setLastSavedAt(payload.updated_at || null);
      if (payload.updated_at) setAutoSaveState("saved");
    } catch (e) {
      setLoadErr(e.message || "Failed to load register");
      setRoster([]);
      setMarks({});
    } finally {
      setLoading(false);
    }
  }, [registerUrl, token, liveClassId, hostName]);

  const persistMarks = useCallback(
    async (marksToSave) => {
      if (!registerUrl || !token || readOnly) return;
      setAutoSaveState("saving");
      try {
        const res = await fetch(registerUrl, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({
            marks: marksToSave,
            live_class_id: liveClassId || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not save attendance");
        const payload = data.data || {};
        setLastSavedAt(payload.updated_at || new Date().toISOString());
        setAutoSaveState("saved");
        setDisplayHost(payload.host_name || displayHost);
      } catch (e) {
        setAutoSaveState("error");
        setLoadErr(e.message || "Save failed");
      }
    },
    [registerUrl, token, liveClassId, readOnly, displayHost]
  );

  useEffect(() => {
    if (!open) {
      setAutoSaveState("idle");
      return;
    }
    if (lessonId) void loadRegister();
  }, [open, lessonId, loadRegister]);

  useEffect(() => {
    if (!open || loading || readOnly || !lessonId) return undefined;
    if (!Object.keys(marks).length) return undefined;
    setAutoSaveState("saving");
    const timer = window.setTimeout(() => {
      void persistMarks(marks);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [marks, open, loading, readOnly, lessonId, persistMarks]);

  useEffect(() => {
    if (!open) return undefined;
    return () => {
      const current = marksRef.current;
      if (!readOnly && lessonId && Object.keys(current).length > 0) {
        void fetch(registerUrl, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({ marks: current, live_class_id: liveClassId || undefined }),
        }).catch(() => {});
      }
    };
  }, [open, lessonId, registerUrl, token, liveClassId, readOnly]);

  const handleClose = () => {
    if (!readOnly && Object.keys(marks).length > 0) {
      void persistMarks(marks).finally(onClose);
    } else {
      onClose();
    }
  };

  const handleFinalize = async () => {
    if (!lessonId || !token) return;
    setFinalizeBusy(true);
    try {
      await persistMarks(marks);
      const res = await fetch(`${registerUrl}/finalize`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not finalize register");
      setRegisterStatus("finalized");
      setLastSavedAt(data.data?.finalized_at || data.data?.updated_at || new Date().toISOString());
      setAutoSaveState("saved");
    } catch (e) {
      setLoadErr(e.message || "Finalize failed");
    } finally {
      setFinalizeBusy(false);
    }
  };

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let unmarked = 0;
    for (const s of roster) {
      const m = marks[s.id];
      if (m === STATUS.PRESENT) present += 1;
      else if (m === STATUS.ABSENT) absent += 1;
      else if (m === STATUS.LATE) late += 1;
      else unmarked += 1;
    }
    return { present, absent, late, unmarked, total: roster.length };
  }, [roster, marks]);

  const setMark = (studentId, value) => {
    if (readOnly) return;
    setMarks((prev) => {
      const next = { ...prev };
      if (!value) delete next[studentId];
      else next[studentId] = value;
      return next;
    });
  };

  const markAllPresent = () => {
    if (readOnly) return;
    const next = {};
    roster.forEach((s) => {
      next[s.id] = STATUS.PRESENT;
    });
    setMarks(next);
  };

  const handleDownloadPdf = async () => {
    if (!lessonId || !token || !registerUrl) return;
    setPdfBusy(true);
    setLoadErr(null);
    try {
      if (!readOnly && Object.keys(marks).length > 0) {
        await persistMarks(marks);
      }
      const q = liveClassId ? `?live_class_id=${encodeURIComponent(liveClassId)}` : "";
      const res = await fetch(`${registerUrl}/pdf${q}`, {
        headers: { ...authHeaders(token), Accept: "application/pdf" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not generate PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const safeSubject = (subjectName || "lesson").replace(/[^\w\-]+/g, "-").replace(/-+/g, "-");
      const safeDate = (lessonDate || "").replace(/[^\d-]/g, "");
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-register-${safeSubject}${safeDate ? `-${safeDate}` : ""}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setLoadErr(e.message || "PDF download failed");
    } finally {
      setPdfBusy(false);
    }
  };

  const autoSaveLabel = useMemo(() => {
    if (readOnly) return "Finalized — locked";
    if (autoSaveState === "saving") return "Saving to server…";
    if (autoSaveState === "error") return "Save failed";
    if (autoSaveState === "saved" && lastSavedAt) {
      try {
        return `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      } catch {
        return "Saved on server";
      }
    }
    return "Auto-saves to server";
  }, [autoSaveState, lastSavedAt, readOnly]);

  const subtitle = [subjectName, lessonDate].filter(Boolean).join(" · ");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        Class attendance register
        <IconButton aria-label="Close" onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseRoundedIcon />
        </IconButton>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {subtitle}
            </Typography>
          ) : null}
          <Chip
            size="small"
            icon={readOnly ? <LockOutlinedIcon /> : <CloudDoneOutlinedIcon />}
            label={autoSaveLabel}
            color={readOnly ? "default" : autoSaveState === "saved" ? "success" : autoSaveState === "error" ? "error" : "default"}
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#FFFBF7" }}>
        <Stack spacing={2}>
          {!lessonId ? (
            <Alert severity="warning">This live session is not linked to a timetable lesson — server register unavailable.</Alert>
          ) : null}

          <Box
            sx={{
              p: 2,
              borderRadius: "16px",
              border: "1px solid rgba(220,38,38,0.12)",
              bgcolor: "#fff",
              boxShadow: "0 8px 24px -12px rgba(28,25,23,0.12)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: "0.1em", color: "text.secondary" }}>
                  Session
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#1C1917", lineHeight: 1.25 }}>
                  {curriculumClassLabel || "Class roster"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Host: <strong>{displayHost || "—"}</strong>
                </Typography>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
                <Chip label={`${summary.present} present`} color="success" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`${summary.late} late`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`${summary.absent} absent`} color="error" size="small" sx={{ fontWeight: 700 }} />
                <Chip label={`${summary.unmarked} unmarked`} size="small" sx={{ fontWeight: 700 }} />
              </Stack>
            </Stack>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            Marks are <strong>saved automatically to the school server</strong> as you go and when you close this panel.
            One official register exists per lesson, tied to this class. <strong>Portal joined</strong> is a hint only.
            Use <strong>Finalize register</strong> when class ends to lock the record (admins can still edit finalized registers).
          </Typography>

          {loadErr ? (
            <Alert severity="error" sx={{ borderRadius: "12px" }}>
              {loadErr}
            </Alert>
          ) : null}

          {!lessonId ? null : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} sx={{ color: "#DC2626" }} />
            </Box>
          ) : roster.length === 0 && !loadErr ? (
            <Alert severity="info">No students found for this class in Elimu Plus.</Alert>
          ) : roster.length > 0 ? (
            <>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={markAllPresent}
                  disabled={readOnly}
                  sx={{ fontWeight: 700, textTransform: "none", borderRadius: "10px" }}
                >
                  Mark all present
                </Button>
              </Stack>

              <Box
                sx={{
                  borderRadius: "16px",
                  border: "1px solid rgba(220,38,38,0.1)",
                  overflow: "hidden",
                  bgcolor: "#fff",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ "& .MuiTableCell-head": { fontWeight: 800, bgcolor: "#FEE2E2", color: "#7F1D1D" } }}>
                      <TableCell>#</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Admission</TableCell>
                      <TableCell>Portal</TableCell>
                      <TableCell align="right">Mark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roster.map((s, idx) => {
                      const mark = marks[s.id];
                      const joinedPortal = portalJoinedIds.has(s.id);
                      return (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ color: "text.secondary", width: 40 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {s?.user?.full_name || s?.user?.username || "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {s?.user?.email || ""}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8rem" }}>
                            {s?.admission_number || "—"}
                          </TableCell>
                          <TableCell>
                            {joinedPortal ? (
                              <Chip label="Joined" size="small" color="info" variant="outlined" sx={{ height: 22, fontWeight: 700 }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={mark || ""}
                              disabled={readOnly}
                              onChange={(_, v) => setMark(s.id, v || null)}
                              sx={{ flexWrap: "wrap", justifyContent: "flex-end" }}
                            >
                              <ToggleButton value={STATUS.PRESENT} sx={{ fontWeight: 700, textTransform: "none", px: 1.25 }}>
                                Present
                              </ToggleButton>
                              <ToggleButton value={STATUS.LATE} sx={{ fontWeight: 700, textTransform: "none", px: 1.25 }}>
                                Late
                              </ToggleButton>
                              <ToggleButton value={STATUS.ABSENT} sx={{ fontWeight: 700, textTransform: "none", px: 1.25 }}>
                                Absent
                              </ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
        <Button
          startIcon={pdfBusy ? <CircularProgress size={16} /> : <PictureAsPdfOutlinedIcon />}
          disabled={pdfBusy || !lessonId || loading}
          onClick={() => void handleDownloadPdf()}
          sx={{ fontWeight: 700, textTransform: "none" }}
        >
          Download PDF
        </Button>
        {!readOnly && lessonId ? (
          <Button
            variant="outlined"
            startIcon={finalizeBusy ? <CircularProgress size={16} /> : <LockOutlinedIcon />}
            disabled={finalizeBusy || !roster.length}
            onClick={() => void handleFinalize()}
            sx={{ fontWeight: 700, textTransform: "none", borderRadius: "10px" }}
          >
            Finalize register
          </Button>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} variant="contained" sx={{ fontWeight: 800, textTransform: "none", bgcolor: "#DC2626", "&:hover": { bgcolor: "#B91C1C" } }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
