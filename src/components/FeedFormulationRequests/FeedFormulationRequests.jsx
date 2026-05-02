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
import { Restaurant as RestaurantIcon, Visibility } from "@mui/icons-material";

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_review", label: "In review" },
  { value: "responded", label: "Responded" },
  { value: "closed", label: "Closed" },
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

const FeedFormulationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token. Please login again.");
        return;
      }
      const response = await fetch("/api/marketplace/feed-formulation-requests", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
        setTotal(data.total ?? data.data?.length ?? 0);
      } else {
        setError(data.message || "Failed to fetch feed formulation requests");
      }
    } catch (err) {
      setError(err.message || "Error fetching requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetail = (row) => {
    setSelectedRequest(row);
    setEditStatus(row.status || "new");
    setEditAdminNotes(row.adminNotes ?? "");
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
  };

  const handleSave = async () => {
    if (!selectedRequest) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/feed-formulation-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: editStatus, adminNotes: editAdminNotes || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update");
      setRequests((prev) =>
        prev.map((r) => (r.id === selectedRequest.id ? { ...r, ...data.data, status: editStatus, adminNotes: editAdminNotes || null } : r))
      );
      setSelectedRequest((prev) => (prev ? { ...prev, status: editStatus, adminNotes: editAdminNotes || null } : null));
      handleCloseDetail();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sliced = requests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <RestaurantIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Feed Formulation Requests
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Custom feed requests from Inputs &amp; Feeds; update status and add notes
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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
                  <TableCell>Animal type</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Budget</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted by</TableCell>
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
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No feed formulation requests yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sliced.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>{formatLabel(row.animalType)}</TableCell>
                      <TableCell>{formatLabel(row.productionStage)}</TableCell>
                      <TableCell>{row.budget || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatLabel(row.status)}
                          size="small"
                          color={row.status === "new" ? "default" : row.status === "closed" ? "default" : "primary"}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.user ? (
                          <Typography variant="body2">
                            {row.user.fullName || row.user.email || "—"}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Guest</Typography>
                        )}
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
        <DialogTitle>Feed formulation request</DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Submitted {formatDate(selectedRequest.createdAt)}
              </Typography>
              {selectedRequest.user ? (
                <Box>
                  <Typography variant="caption" color="text.secondary">Submitted by</Typography>
                  <Typography variant="body1">{selectedRequest.user.fullName || "—"}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                    {selectedRequest.user.email || "—"}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Guest (not logged in)</Typography>
              )}
              <Box>
                <Typography variant="caption" color="text.secondary">Animal type</Typography>
                <Typography variant="body1">{formatLabel(selectedRequest.animalType)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Production stage</Typography>
                <Typography variant="body1">{formatLabel(selectedRequest.productionStage)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Budget</Typography>
                <Typography variant="body1">{selectedRequest.budget || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Preferred ingredients</Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selectedRequest.preferredIngredients || "—"}
                </Typography>
              </Box>
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Admin notes"
                multiline
                rows={3}
                value={editAdminNotes}
                onChange={(e) => setEditAdminNotes(e.target.value)}
                placeholder="Internal notes (e.g. formulation sent, follow-up needed)"
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDetail} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: "#6B4E3D", "&:hover": { bgcolor: "#5a4232" } }}>
            {saving ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeedFormulationRequests;
