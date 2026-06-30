import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { alpha } from "@mui/material/styles";
import { authHeaders, primaryRed, primaryDark } from "./elimuPlusShared";
import { REASON_LABELS, formatPlacementDate } from "./StudentPlacementTimeline";

export default function ClassTransferRegisterPanel({
  classId,
  levels,
  curriculumId,
  searchQuery = "",
  refreshKey = 0,
  registerVisible = true,
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [backfillBusy, setBackfillBusy] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState("");
  const abortRef = useRef(null);
  const prevRefreshKeyRef = useRef(refreshKey);
  const hadVisibleLoadRef = useRef(false);

  const loadRegister = useCallback(
    async ({ silent = false } = {}) => {
      if (!classId || !registerVisible) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const token = localStorage.getItem("token");
      if (!token) return;

      if (!silent) setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ limit: "100" });
        if (levelFilter) params.set("level_id", levelFilter);
        if (curriculumId) params.set("curriculum_id", curriculumId);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(
          `/api/class-transfer/classes/${encodeURIComponent(classId)}/placement-register?${params}`,
          { headers: authHeaders(token), signal: controller.signal }
        );
        const data = await res.json().catch(() => ({}));
        if (controller.signal.aborted) return;
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load term register.");
        setEntries(Array.isArray(data.data?.entries) ? data.data.entries : []);
      } catch (e) {
        if (controller.signal.aborted || e.name === "AbortError") return;
        setError(e.message || "Could not load term register.");
        if (!silent) setEntries([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [classId, curriculumId, levelFilter, registerVisible, searchQuery]
  );

  useEffect(() => {
    if (!registerVisible || !classId) return;
    hadVisibleLoadRef.current = true;
    void loadRegister();
    return () => abortRef.current?.abort();
  }, [classId, curriculumId, levelFilter, registerVisible, searchQuery, loadRegister]);

  useEffect(() => {
    if (!registerVisible || !hadVisibleLoadRef.current) {
      prevRefreshKeyRef.current = refreshKey;
      return;
    }
    if (prevRefreshKeyRef.current === refreshKey) return;
    prevRefreshKeyRef.current = refreshKey;
    void loadRegister({ silent: true });
  }, [refreshKey, registerVisible, loadRegister]);

  const runBackfill = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBackfillBusy(true);
    setBackfillMessage("");
    try {
      const res = await fetch("/api/class-transfer/placement-register/backfill", {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Backfill failed.");
      setBackfillMessage(data.message || "Backfill complete.");
      void loadRegister({ silent: entries.length > 0 });
    } catch (e) {
      setBackfillMessage(e.message || "Backfill failed.");
    } finally {
      setBackfillBusy(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 800, color: primaryDark, flex: 1 }}>
          Term movement register
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={backfillBusy ? <CircularProgress size={16} /> : <HistoryIcon />}
          disabled={backfillBusy}
          onClick={() => void runBackfill()}
          sx={{ fontWeight: 700, borderColor: alpha(primaryRed, 0.35), color: primaryDark }}
        >
          Backfill admissions
        </Button>
        <TextField
          select
          size="small"
          label="Filter by term"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All terms</MenuItem>
          {(levels || []).map((level) => (
            <MenuItem key={level.id} value={level.id}>
              {level.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {backfillMessage ? (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setBackfillMessage("")}>
          {backfillMessage}
        </Alert>
      ) : null}

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5, lineHeight: 1.5 }}>
        New transfers now record the <strong>From</strong> term automatically. Use backfill once for students enrolled
        before the register existed (skips students who already have rows).
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} sx={{ color: primaryRed }} />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : !entries.length ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", py: 2 }}>
          {searchQuery
            ? `No register rows match "${searchQuery}".`
            : "No movements recorded for this class yet. Transfers and admissions will appear here."}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(primaryRed, 0.06) }}>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Placement</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>By</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{formatPlacementDate(row.started_on)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {row.student?.full_name || row.student?.username || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.student?.admission_number || ""}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.placement_label}</TableCell>
                  <TableCell>{row.previous_registration?.placement_label || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={REASON_LABELS[row.reason] || row.reason}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {row.moved_by_user?.full_name || row.moved_by_user?.username || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.is_active ? "Active" : "Completed"}
                      color={row.is_active ? "success" : "default"}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
