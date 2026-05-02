import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ContactMail as ContactMailIcon,
  Done as DoneIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const FormSubmission = () => {
  const navigate = useNavigate();
  const { form_id } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    submission: null,
  });
  const [statusData, setStatusData] = useState({
    status: "",
    admin_notes: "",
  });

  useEffect(() => {
    if (form_id) {
      fetchSubmissions();
      fetchFormDetails();
    }
  }, [page, rowsPerPage, statusFilter, form_id]);

  const fetchFormDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/forms/${form_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFormTitle(data.data.title);
      }
    } catch (err) {
      console.error("Error fetching form details:", err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const queryParams = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (statusFilter) {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(`/api/forms/${form_id}/submissions?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubmissions(data.data || []);
        setTotalSubmissions(data.pagination?.total || data.data?.length || 0);
      } else {
        setError(data.message || "Failed to fetch submissions");
      }
    } catch (err) {
      setError(err.message || "Error fetching submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (submission) => {
    setStatusDialog({
      open: true,
      submission,
    });
    setStatusData({
      status: submission.status,
      admin_notes: submission.admin_notes || "",
    });
  };

  const handleStatusSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`/api/forms/submissions/${statusDialog.submission.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(statusData),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update submission status");
      }

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Submission status updated successfully.",
        timer: 1400,
        showConfirmButton: false,
      });

      setStatusDialog({ open: false, submission: null });
      fetchSubmissions();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to update submission status",
      });
    }
  };

  const handleDeleteSubmission = async (submission) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this submission!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const response = await fetch(`/api/forms/submissions/${submission.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to delete submission");
        }

        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Submission deleted successfully.",
          timer: 1400,
          showConfirmButton: false,
        });

        fetchSubmissions();
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.message || "Failed to delete submission",
        });
      }
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      reviewed: "Reviewed",
      contacted: "Contacted",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      reviewed: "info",
      contacted: "primary",
      completed: "success",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <ScheduleIcon />,
      reviewed: <CheckCircleIcon />,
      contacted: <ContactMailIcon />,
      completed: <DoneIcon />,
    };
    return icons[status];
  };

  const handleViewSubmission = (submission) => {
    // For now, just show an alert with the data
    // In a real app, you'd open a detailed view modal
    const data = JSON.stringify(submission.submission_data, null, 2);
    Swal.fire({
      title: "Submission Details",
      html: `<pre style="text-align: left; font-size: 12px; max-height: 400px; overflow-y: auto;">${data}</pre>`,
      width: 800,
      confirmButtonText: "Close",
    });
  };

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
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
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Back Button */}
          <IconButton
            onClick={() => navigate('/forms')}
            sx={{
              position: "absolute",
              left: 24,
              top: 24,
              color: "white",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              ml: 8  // Add left margin to account for back button
            }}
          >
            Form Submissions
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {formTitle ? `Manage submissions for "${formTitle}"` : "Loading form details..."}
          </Typography>

          {/* Status Filter */}
          <Box sx={{ position: "absolute", right: 24, top: 24, display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: "white" }}>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                sx={{
                  color: "white",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewed">Reviewed</MenuItem>
                <MenuItem value="contacted">Contacted</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
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
                  <TableCell>NO</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Newsletter</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#6B4E3D" }} />
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No submissions found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((submission, idx) => (
                    <TableRow key={submission.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#2c3e50">
                          {formatDate(submission.created_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {submission.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(submission.status)}
                          size="small"
                          color={getStatusColor(submission.status)}
                          icon={getStatusIcon(submission.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.submission_data?.newsletter_optin ? "Yes" : "No"}
                          size="small"
                          color={submission.submission_data?.newsletter_optin ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewSubmission(submission)}
                            sx={{ color: "#3498db" }}
                          >
                            <ExpandMoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Update Status">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusUpdate(submission)}
                            sx={{ color: "#27ae60" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Submission">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSubmission(submission)}
                            sx={{ color: "#e74c3c" }}
                          >
                            <DeleteIcon fontSize="small" />
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
            count={totalSubmissions}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1 }}
          />

          {/* Status Update Dialog */}
          <Dialog
            open={statusDialog.open}
            onClose={() => setStatusDialog({ open: false, submission: null })}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Update Submission Status</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusData.status}
                    onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="reviewed">Reviewed</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Admin Notes (optional)"
                  value={statusData.admin_notes}
                  onChange={(e) => setStatusData({ ...statusData, admin_notes: e.target.value })}
                  placeholder="Add any notes about this submission..."
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setStatusDialog({ open: false, submission: null })}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusSubmit}
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
                }}
              >
                Update Status
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Paper>
    </Box>
  );
};

export default FormSubmission;
