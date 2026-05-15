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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const DEFAULT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "documents_verified", label: "Documents verified" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
];

const swalAboveDialog = {
  didOpen: () => {
    const container = Swal.getContainer();
    if (container) container.style.zIndex = "2000";
  },
};

const STATUS_CHIP_COLOR = {
  pending: "default",
  under_review: "info",
  documents_verified: "primary",
  interview_scheduled: "warning",
  accepted: "success",
  rejected: "error",
  waitlisted: "secondary",
};

function documentHref(path) {
  if (!path || typeof path !== "string") return null;
  const t = path.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function fileNameFromPath(path) {
  if (!path || typeof path !== "string") return "document";
  const name = path.trim().split("/").pop();
  return name || "document";
}

async function triggerDownload(path) {
  const href = documentHref(path);
  if (!href) return;
  const res = await fetch(href);
  if (!res.ok) throw new Error("Could not download file.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileNameFromPath(path);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export default function HRAdmissionsTab() {
  const [rows, setRows] = useState([]);
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (statusFilter) params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admission-applications?${params.toString()}`, {
        headers: authHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not load admission applications.");
      }
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalCount(json.pagination?.total ?? 0);
      if (Array.isArray(json.statuses) && json.statuses.length > 0) {
        setStatusOptions(json.statuses);
      }
    } catch (e) {
      setError(e.message || "Could not load admission applications.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (value) =>
    statusOptions.find((s) => s.value === value)?.label ||
    String(value || "pending")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const openEditStatus = (row) => {
    setEditRow(row);
    setEditStatus(row.status || "pending");
  };

  const closeEditStatus = () => {
    if (updatingId) return;
    setEditRow(null);
  };

  const handleSaveStatus = async () => {
    if (!editRow?.id) return;
    const nextStatus = String(editStatus || "").trim();
    const currentStatus = String(editRow.status || "pending").trim();

    if (currentStatus === nextStatus) {
      await Swal.fire({
        icon: "info",
        title: "No change",
        text: `Status is already "${statusLabel(nextStatus)}".`,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({
        icon: "warning",
        title: "Session expired",
        text: "Please sign in again.",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      return;
    }

    const savedRef = editRow.application_number || "";
    const rowId = editRow.id;

    setUpdatingId(rowId);
    try {
      const res = await fetch(`/api/admission-applications/${rowId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not update status.");
      }

      const updatedStatus = json.data?.status || nextStatus;
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status: updatedStatus } : r)));
      if (viewRow?.id === rowId) {
        setViewRow((prev) => (prev ? { ...prev, status: updatedStatus } : prev));
      }

      await Swal.fire({
        icon: "success",
        title: "Status updated",
        text: savedRef
          ? `Application ${savedRef} is now ${statusLabel(updatedStatus)}.`
          : `Status is now ${statusLabel(updatedStatus)}.`,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      setEditRow(null);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e.message || "Could not update status.",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="flex-end"
        flexWrap="wrap"
        sx={{ width: "100%" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Name, email, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 220 } }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setPage(0);
                setStatusFilter(e.target.value);
              }}
            >
              <MenuItem value="">All statuses</MenuItem>
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#fff7f7" }}>
                  <TableCell>No.</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Curriculum</TableCell>
                  <TableCell>Class / Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No admission applications found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.application_number || "—"}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.student_name || "—"}</TableCell>
                      <TableCell>{row.curriculum || "—"}</TableCell>
                      <TableCell>
                        {[row.curriculum_class, row.curriculum_level].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusLabel(row.status)}
                          color={STATUS_CHIP_COLOR[row.status] || "default"}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="View application"
                          onClick={() => setViewRow(row)}
                          sx={{ color: accentDark }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Edit status"
                          disabled={updatingId === row.id}
                          onClick={() => openEditStatus(row)}
                          sx={{ color: accent }}
                        >
                          {updatingId === row.id ? (
                            <CircularProgress size={18} sx={{ color: accent }} />
                          ) : (
                            <EditIcon fontSize="small" />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Rows per page"
              sx={{
                borderTop: `1px solid ${accentLight}`,
                "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
              }}
            />
          </TableContainer>
        )}
      </Paper>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6, bgcolor: "#fff7f7", borderBottom: `1px solid ${accentLight}` }}>
          Admission application
          <IconButton
            aria-label="Close"
            onClick={() => setViewRow(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  label={statusLabel(viewRow.status)}
                  color={STATUS_CHIP_COLOR[viewRow.status] || "default"}
                  sx={{ fontWeight: 700 }}
                />
                {viewRow.application_number ? (
                  <Typography variant="body2" color="text.secondary">
                    {viewRow.application_number}
                  </Typography>
                ) : null}
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentDark }}>
                Programme
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DetailField label="Curriculum" value={viewRow.curriculum} />
                <DetailField label="Class" value={viewRow.curriculum_class} />
                <DetailField label="Term / level" value={viewRow.curriculum_level} />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentDark }}>
                Applicant
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DetailField label="Name" value={viewRow.applicant_name} />
                <DetailField label="Phone" value={viewRow.applicant_phone} />
                <DetailField label="Email" value={viewRow.applicant_email} />
              </Stack>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentDark }}>
                Student
              </Typography>
              <DetailField label="Full name" value={viewRow.student_name} />

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentDark }}>
                Documents
              </Typography>
              <Stack spacing={1}>
                {[
                  ["Student picture", viewRow.student_picture],
                  ["Report card", viewRow.student_reportcard],
                  ["Birth certificate", viewRow.student_birthcertificate],
                ].map(([label, path]) => {
                  const href = documentHref(path);
                  const fileName = fileNameFromPath(path);
                  return (
                    <Box
                      key={label}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      {href ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={async () => {
                            try {
                              await triggerDownload(path);
                            } catch (e) {
                              Swal.fire({
                                icon: "error",
                                title: "Download failed",
                                text: e.message || "Could not download file.",
                                confirmButtonColor: accentDark,
                                ...swalAboveDialog,
                              });
                            }
                          }}
                          sx={{
                            textTransform: "none",
                            fontWeight: 700,
                            borderColor: "#fecaca",
                            color: accentDark,
                          }}
                        >
                          Download{fileName ? ` (${fileName})` : ""}
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onClose={closeEditStatus} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6, bgcolor: "#fff7f7", borderBottom: `1px solid ${accentLight}` }}>
          Update status
          <IconButton
            aria-label="Close"
            onClick={closeEditStatus}
            disabled={!!updatingId}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editRow ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{editRow.student_name || "Applicant"}</strong>
                {editRow.application_number ? ` · ${editRow.application_number}` : ""}
              </Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={editStatus}
                  disabled={!!updatingId}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, borderTop: `1px solid ${accentLight}` }}>
          <Button onClick={closeEditStatus} disabled={!!updatingId} sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveStatus()}
            disabled={!!updatingId || !editRow}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: accent,
              "&:hover": { bgcolor: accentDark },
            }}
          >
            {updatingId ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
