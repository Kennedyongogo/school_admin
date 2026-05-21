import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const PAGE_SIZE = 15;

const authHeaders = (token) => ({
  Accept: "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function studentLabel(card) {
  const s = card?.student;
  return s?.user?.full_name?.trim() || s?.user?.username || s?.admission_number || "Student";
}

function formatReportCardDate(card) {
  const raw = card?.created_at ?? card?.createdAt ?? card?.updated_at ?? card?.updatedAt;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

export default function ExamReportCardListTab({ refreshKey = 0 }) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/curricula?limit=100", { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const first = (data.data || [])[0];
        if (!first?.id) return;
        return fetch(`/api/curricula/${first.id}/classes?limit=100`, { headers: authHeaders(token) });
      })
      .then((r) => r?.json?.())
      .then((data) => {
        if (data?.success) setClasses(data.data || []);
      })
      .catch(() => {});
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (classFilter) params.set("curriculum_class_id", classFilter);
      const res = await fetch(`/api/report-cards?${params}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load report cards.");
      setRows(data.data || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setError(e.message || "Could not load report cards.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, classFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const handleDelete = async (card) => {
    const label = studentLabel(card);
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete report card?",
      text: `Remove the report card for ${label}? The PDF will be deleted.`,
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!ok.isConfirmed) return;

    setDeletingId(card.id);
    try {
      const res = await fetch(`/api/report-cards/${card.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not delete report card.");
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else await load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: `1px solid ${accentLight}`, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentDark, flex: 1 }}>
              Generated report cards
            </Typography>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by class</InputLabel>
              <Select
                label="Filter by class"
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All classes</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={() => void load()}>
              Refresh
            </Button>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: accent }} />
            </Box>
          ) : rows.length === 0 ? (
            <Alert severity="info">No report cards generated yet. Use the Create tab to build one.</Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {total} report card{total === 1 ? "" : "s"} total
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={48} align="center">
                      #
                    </TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell align="right">Marks</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center" width={100}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((card, index) => (
                    <TableRow key={card.id} hover>
                      <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{studentLabel(card)}</TableCell>
                      <TableCell>{card.curriculum_class?.name || "—"}</TableCell>
                      <TableCell>{card.curriculum_class_level?.name || "—"}</TableCell>
                      <TableCell>{card.title || "—"}</TableCell>
                      <TableCell align="right">
                        {card.total_marks_obtained}
                        {card.total_marks_possible != null ? ` / ${card.total_marks_possible}` : ""}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={card.overall_grade || "—"} color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>{formatReportCardDate(card)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.25} justifyContent="center">
                          {card.pdf_url ? (
                            <Tooltip title="Open PDF">
                              <IconButton
                                size="small"
                                component="a"
                                href={card.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ color: accentDark }}
                              >
                                <DownloadOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          <Tooltip title="Delete report card">
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Delete report card"
                                disabled={deletingId === card.id}
                                onClick={() => void handleDelete(card)}
                                sx={{ color: accent }}
                              >
                                {deletingId === card.id ? (
                                  <CircularProgress size={18} sx={{ color: accent }} />
                                ) : (
                                  <DeleteOutlineIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 ? (
                <Stack alignItems="center" sx={{ mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    size="small"
                  />
                </Stack>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
