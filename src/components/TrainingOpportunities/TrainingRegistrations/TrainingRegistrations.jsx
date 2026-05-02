import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { Visibility as ViewIcon } from "@mui/icons-material";

const TrainingRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewRegistration, setViewRegistration] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [page, rowsPerPage, statusFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }
      const pageParam = page + 1;
      const statusParam = statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`;
      const response = await fetch(
        `/api/training-registrations?page=${pageParam}&limit=${rowsPerPage}${statusParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch registrations");
      }
      if (data.success && Array.isArray(data.data)) {
        setRegistrations(data.data);
        setTotal(data.pagination?.total ?? data.data.length);
      } else {
        setRegistrations([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.message || "Error fetching registrations");
      setRegistrations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            p: 2,
            color: "white",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Training Registrations
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            View and manage user registrations for training events
          </Typography>
        </Box>

        <Box sx={{ p: 2 }}>
          <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="attended">Attended</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(0,0,0,0.1)",
              backgroundColor: "white",
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      border: "none",
                    },
                  }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Training Event</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#8b5cf6" }} />
                    </TableCell>
                  </TableRow>
                ) : registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No registrations found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg, idx) => (
                    <TableRow key={reg.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{reg.user?.fullName || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{reg.trainingEvent?.title || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(reg.registrationDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={reg.status || "pending"} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setViewRegistration(reg)}
                          title="View details"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog
            open={!!viewRegistration}
            onClose={() => setViewRegistration(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 700 }}>Registration details</DialogTitle>
            <DialogContent>
              {viewRegistration && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">User</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewRegistration.user?.fullName || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">{viewRegistration.user?.email || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">{viewRegistration.user?.phone || "—"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Training event</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewRegistration.trainingEvent?.title || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {viewRegistration.trainingEvent?.date ? formatDate(viewRegistration.trainingEvent.date) : "—"}
                      {viewRegistration.trainingEvent?.location ? ` • ${viewRegistration.trainingEvent.location}` : ""}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Registration date</Typography>
                    <Typography variant="body1">{formatDate(viewRegistration.registrationDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={viewRegistration.status || "pending"} size="small" />
                    </Box>
                  </Box>
                  {viewRegistration.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Notes</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{viewRegistration.notes}</Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
          </Dialog>

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
    </Box>
  );
};

export default TrainingRegistrations;
