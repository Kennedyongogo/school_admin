import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const TrainingEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage]);

  const fetchEvents = async () => {
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
        sortBy: "date",
        sortOrder: "DESC",
      });

      const response = await fetch(`/api/training-events?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEvents(data.data || []);
        setTotal(data.pagination?.total ?? data.data?.length ?? 0);
      } else {
        setError(data.message || "Failed to fetch training events");
      }
    } catch (err) {
      setError(err.message || "Error fetching training events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (event) => {
    const result = await Swal.fire({
      title: "Delete training event?",
      text: `"${event.title}" will be removed.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(`/api/training-events/${event.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete training event");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `"${event.title}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchEvents();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete training event",
      });
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
            background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)",
            p: 2,
            color: "white",
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Training Events
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Manage workshops and training sessions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/marketplace/training-events/create")}
            sx={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: 2,
              px: 2,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": {
                background: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            New Event
          </Button>
        </Box>

        <Box sx={{ p: 2 }}>
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
                    background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      border: "none",
                    },
                  }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#17cf54" }} />
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No training events found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event, idx) => (
                    <TableRow key={event.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography variant="body2" fontWeight={600} color="#2c3e50">
                          {event.title}
                        </Typography>
                        {event.description && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {event.description.slice(0, 50)}…
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.type || "—"}
                          size="small"
                          color={event.type === "Workshop" ? "primary" : "secondary"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(event.date)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.location || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.isActive ? "Yes" : "No"}
                          size="small"
                          color={event.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {event.featured ? (
                          <Chip label="Yes" size="small" color="primary" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/training-events/${event.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/training-events/${event.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(event)}
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

export default TrainingEvents;
