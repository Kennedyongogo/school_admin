import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TablePagination,
  Rating,
  Avatar,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const STATUS_TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "", label: "All" },
];

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/")) return t;
  if (t.startsWith("uploads/")) return `/${t}`;
  return `/${t}`;
}

function reviewerPhotoUrl(row) {
  const path =
    row?.profile_image_url ||
    row?.student?.profile_picture ||
    row?.user?.profile_image ||
    null;
  return resolveMediaUrl(path);
}

function statusChip(status) {
  if (status === "approved") return <Chip size="small" label="Approved" color="success" sx={{ fontWeight: 600 }} />;
  if (status === "rejected") return <Chip size="small" label="Rejected" color="error" sx={{ fontWeight: 600 }} />;
  return <Chip size="small" label="Pending" color="warning" sx={{ fontWeight: 600 }} />;
}

function ReviewerAvatar({ row, size = 40 }) {
  const src = reviewerPhotoUrl(row);
  const name = row?.display_name || "?";
  return (
    <Avatar
      src={src || undefined}
      alt={name}
      sx={{ width: size, height: size, bgcolor: accentDark, fontSize: size < 44 ? "0.9rem" : "1rem", fontWeight: 700 }}
    >
      {name.charAt(0)}
    </Avatar>
  );
}

export default function ElimuPlusReviewsTab({ active }) {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [acting, setActing] = useState(false);

  const fetchReviews = useCallback(
    async (opts = {}) => {
      const pageIdx = opts.page !== undefined ? opts.page : page;
      const limitVal = opts.limit !== undefined ? opts.limit : rowsPerPage;
      const status = opts.status !== undefined ? opts.status : statusFilter;
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({
          page: String(pageIdx + 1),
          limit: String(limitVal),
        });
        if (status) q.set("status", status);
        const res = await fetch(`/api/portal-reviews?${q}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load reviews (${res.status})`);
        }
        const list = Array.isArray(data.data) ? data.data : [];
        const pagination = data.pagination || {};
        const total = pagination.total ?? list.length;
        const tp = Math.max(1, pagination.totalPages ?? 1);
        setRows(list);
        setTotalCount(total);
        if (list.length === 0 && total > 0 && pageIdx >= tp) {
          setPage(tp - 1);
        }
      } catch (e) {
        setError(e.message || "Failed to load reviews.");
        setRows([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, statusFilter]
  );

  useEffect(() => {
    if (active) fetchReviews();
  }, [active, fetchReviews]);

  const handleStatusTab = (_, v) => {
    setStatusFilter(STATUS_TABS[v].value);
    setPage(0);
  };

  const statusTabIndex = Math.max(
    0,
    STATUS_TABS.findIndex((t) => t.value === statusFilter)
  );

  const patchReview = async (id, action) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setActing(true);
    try {
      const res = await fetch(`/api/portal-reviews/${id}/${action}`, {
        method: "PATCH",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not ${action} review`);
      }
      setViewOpen(false);
      setViewRow(null);
      await fetchReviews();
      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Approved" : "Rejected",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Action failed" });
    } finally {
      setActing(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete review?",
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: accent,
    });
    if (!ok.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/portal-reviews/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      await fetchReviews();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Delete failed" });
    }
  };

  if (!active) return null;

  return (
    <Box sx={{ pt: 2 }}>
      <Tabs
        value={statusTabIndex}
        onChange={handleStatusTab}
        sx={{ mb: 2, "& .MuiTab-root": { fontWeight: 700, textTransform: "none" } }}
      >
        {STATUS_TABS.map((t) => (
          <Tab key={t.value || "all"} label={t.label} />
        ))}
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${accentLight}`,
            boxShadow: `0 8px 28px -12px ${accent}33`,
            bgcolor: "rgba(255,255,255,0.98)",
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow
                sx={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                  "& .MuiTableCell-head": { color: "#fff", fontWeight: 700, borderBottom: "none" },
                }}
              >
                <TableCell width={56}>No.</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell width={120}>Rating</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Comment</TableCell>
                <TableCell width={110}>Status</TableCell>
                <TableCell align="right" width={200}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No reviews in this list.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <ReviewerAvatar row={r} />
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{r.display_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.reviewer_role === "student" ? "Student" : "Parent"}
                            {r.user?.email ? ` · ${r.user.email}` : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Rating value={Number(r.rating) || 0} readOnly size="small" sx={{ color: accent }} />
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 280 }} noWrap title={r.comment}>
                      {r.comment}
                    </TableCell>
                    <TableCell>{statusChip(r.status)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setViewRow(r);
                            setViewOpen(true);
                          }}
                          sx={{ color: accentDark }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {r.status === "pending" && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              disabled={acting}
                              onClick={() => patchReview(r.id, "approve")}
                              sx={{ color: "success.main" }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              disabled={acting}
                              onClick={() => patchReview(r.id, "reject")}
                              sx={{ color: "error.main" }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(r)} sx={{ color: accent }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
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

      <Dialog open={viewOpen} onClose={() => !acting && setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          Review
          <IconButton
            aria-label="Close"
            onClick={() => !acting && setViewOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <ReviewerAvatar row={viewRow} size={56} />
                <Box>
                  <Typography fontWeight={700}>{viewRow.display_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {viewRow.reviewer_role} · {viewRow.user?.email || "—"}
                  </Typography>
                </Box>
              </Stack>
              <Rating value={Number(viewRow.rating) || 0} readOnly sx={{ color: accent }} />
              <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{viewRow.comment}</Typography>
              {statusChip(viewRow.status)}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewOpen(false)} disabled={acting}>
            Close
          </Button>
          {viewRow?.status === "pending" && (
            <>
              <Button color="error" disabled={acting} onClick={() => patchReview(viewRow.id, "reject")}>
                Reject
              </Button>
              <Button
                variant="contained"
                disabled={acting}
                onClick={() => patchReview(viewRow.id, "approve")}
                sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
