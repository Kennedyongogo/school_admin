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

const GrantApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewApplication, setViewApplication] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [page, rowsPerPage, statusFilter]);

  const fetchApplications = async () => {
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
        `/api/grant-applications?page=${pageParam}&limit=${rowsPerPage}${statusParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch applications");
      }
      if (data.success && Array.isArray(data.data)) {
        setApplications(data.data);
        setTotal(data.pagination?.total ?? data.data.length);
      } else {
        setApplications([]);
        setTotal(0);
      }
    } catch (err) {
      setError(err.message || "Error fetching applications");
      setApplications([]);
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
            background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
            p: 2,
            color: "white",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Grant Applications
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            View and manage grant applications
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
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
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
                    background: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      border: "none",
                    },
                  }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Grant</TableCell>
                  <TableCell>Application Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#ec4899" }} />
                    </TableCell>
                  </TableRow>
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No applications found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app, idx) => (
                    <TableRow key={app.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.user?.fullName || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{app.grant?.title || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(app.applicationDate)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={app.status || "draft"} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setViewApplication(app)}
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
            open={!!viewApplication}
            onClose={() => setViewApplication(null)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 700 }}>Application details</DialogTitle>
            <DialogContent>
              {viewApplication && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Applicant</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewApplication.user?.fullName || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">{viewApplication.user?.email || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">{viewApplication.user?.phone || "—"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Grant</Typography>
                    <Typography variant="body1" fontWeight={600}>{viewApplication.grant?.title || "—"}</Typography>
                    {viewApplication.grant?.amount && (
                      <Typography variant="body2" color="text.secondary">{viewApplication.grant.amount}</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Application date</Typography>
                    <Typography variant="body1">{formatDate(viewApplication.applicationDate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={viewApplication.status || "draft"} size="small" />
                    </Box>
                  </Box>
                  {viewApplication.applicationData && Object.keys(viewApplication.applicationData).length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Application data</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: "grey.50" }}>
                        <Typography component="pre" variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {JSON.stringify(viewApplication.applicationData, null, 2)}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  {viewApplication.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Notes</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>{viewApplication.notes}</Typography>
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

export default GrantApplications;
