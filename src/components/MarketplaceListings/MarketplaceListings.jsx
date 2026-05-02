import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { Inventory as InventoryIcon, Visibility, Delete as DeleteIcon } from "@mui/icons-material";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (str) => {
  if (!str) return "—";
  return String(str).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatPrice = (price, unit) => {
  if (price == null || price === "") return "—";
  const p = Number(price);
  if (isNaN(p)) return "—";
  const u = unit && String(unit).trim() ? ` ${String(unit).trim()}` : "";
  return `${p.toLocaleString()}${u}`;
};

const MarketplaceListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token. Please login again.");
        return;
      }
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const url = `/api/marketplace/admin/listings${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setListings(data.data || []);
        setTotal(data.total ?? data.data?.length ?? 0);
      } else {
        setError(data.message || "Failed to fetch listings");
      }
    } catch (err) {
      setError(err.message || "Error fetching listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetail = (row) => {
    setSelectedListing(row);
    setRejectReason(row.rejectedReason ?? "");
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedListing(null);
    setRejectReason("");
  };

  const handleApprove = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/admin/listings/${selectedListing.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to approve");
      setListings((prev) =>
        prev.map((l) => (l.id === selectedListing.id ? { ...l, ...data.data } : l))
      );
      setSelectedListing((prev) => (prev ? { ...prev, ...data.data } : null));
    } catch (err) {
      setError(err.message || "Failed to approve listing");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedListing) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/admin/listings/${selectedListing.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rejectedReason: rejectReason?.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to reject");
      setListings((prev) =>
        prev.map((l) => (l.id === selectedListing.id ? { ...l, ...data.data } : l))
      );
      setSelectedListing((prev) => (prev ? { ...prev, ...data.data } : null));
    } catch (err) {
      setError(err.message || "Failed to reject listing");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedListing) return;
    if (!window.confirm(`Permanently delete listing "${selectedListing.title || "Untitled"}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/admin/listings/${selectedListing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete");
      setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
      handleCloseDetail();
    } catch (err) {
      setError(err.message || "Failed to delete listing");
    } finally {
      setActionLoading(false);
    }
  };

  const sliced = listings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const canApprove = selectedListing && selectedListing.status === "pending_approval";
  const canReject = selectedListing && (selectedListing.status === "pending_approval" || selectedListing.status === "approved");

  return (
    <Box sx={{ mt: 1 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <InventoryIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Marketplace Listings
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Approve or reject seller listings before they appear on the marketplace
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TableContainer
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(102,126,234,0.1)",
              backgroundColor: "white",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      border: "none",
                    },
                  }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Seller</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#6B4E3D" }} />
                    </TableCell>
                  </TableRow>
                ) : listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No listings found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sliced.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                          {row.title || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.category || "—"}</TableCell>
                      <TableCell>{formatPrice(row.price, row.priceUnit)}</TableCell>
                      <TableCell>
                        {row.user ? (
                          <Typography variant="body2">
                            {row.user.fullName || row.user.email || "—"}
                          </Typography>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatLabel(row.status)}
                          size="small"
                          color={
                            row.status === "pending_approval"
                              ? "warning"
                              : row.status === "approved"
                                ? "success"
                                : "default"
                          }
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View and act">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetail(row)}
                            color="primary"
                            sx={{ "&:focus": { outline: "none" }, "&:focus-visible": { outline: "none" } }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1 }}
          />
        </Box>
      </Paper>

      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Listing details</DialogTitle>
        <DialogContent dividers>
          {selectedListing && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Created {formatDate(selectedListing.createdAt)}
                {selectedListing.approvedAt && (
                  <> · Approved {formatDate(selectedListing.approvedAt)}</>
                )}
              </Typography>
              {selectedListing.user && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Seller</Typography>
                  <Typography variant="body1">{selectedListing.user.fullName || "—"}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    {selectedListing.user.email || "—"}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Title</Typography>
                <Typography variant="body1">{selectedListing.title || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selectedListing.description || "—"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Category</Typography>
                  <Typography variant="body1">{selectedListing.category || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Price</Typography>
                  <Typography variant="body1">{formatPrice(selectedListing.price, selectedListing.priceUnit)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1">
                    {selectedListing.quantity != null && selectedListing.quantity !== ""
                      ? `${Number(selectedListing.quantity)} ${selectedListing.quantityUnit || ""}`.trim()
                      : "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{selectedListing.location || "—"}</Typography>
                </Box>
              </Box>
              {selectedListing.imageUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Image</Typography>
                  <Box
                    component="img"
                    src={selectedListing.imageUrl.startsWith("http") ? selectedListing.imageUrl : `/${selectedListing.imageUrl}`}
                    alt=""
                    sx={{ maxWidth: "100%", maxHeight: 200, borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
              )}
              {selectedListing.status === "rejected" && selectedListing.rejectedReason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Rejection reason</Typography>
                  <Typography variant="body2" sx={{ color: "error.main" }}>
                    {selectedListing.rejectedReason}
                  </Typography>
                </Box>
              )}
              {canReject && (
                <TextField
                  fullWidth
                  label="Rejection reason (optional)"
                  multiline
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason shown to seller when rejecting"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetail} color="inherit">
            Close
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            onClick={handleDeleteAdmin}
            disabled={actionLoading}
          >
            Delete
          </Button>
          {canReject && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={24} /> : "Reject"}
            </Button>
          )}
          {canApprove && (
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={actionLoading}
              sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
            >
              {actionLoading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Approve"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MarketplaceListings;
