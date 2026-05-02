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
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const Newsletter = ({ embedded = false }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchSubscribers();
  }, [page, rowsPerPage]);

  const fetchSubscribers = async () => {
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
        sortBy: "createdAt",
        sortOrder: "DESC",
      });

      const response = await fetch(`/api/newsletter?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubscribers(data.data || []);
        setTotal(data.pagination?.total || 0);
      } else {
        setError(data.message || "Failed to fetch newsletter subscribers");
      }
    } catch (err) {
      setError(err.message || "Error fetching newsletter subscribers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subscriber) => {
    const result = await Swal.fire({
      title: "Remove subscriber?",
      text: `${subscriber.email} will be removed from the newsletter list.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove",
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

      const response = await fetch(`/api/newsletter/${subscriber.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to remove subscriber");
      }

      await Swal.fire({
        icon: "success",
        title: "Removed",
        text: "Subscriber removed successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      fetchSubscribers();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to remove subscriber",
      });
    } finally {
      setLoading(false);
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

  const statusColor = (status) => {
    return status === "subscribed" ? "success" : "default";
  };

  const content = (
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
                  <TableCell>Email</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subscribed</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#667eea" }} />
                    </TableCell>
                  </TableRow>
                ) : subscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No newsletter subscribers found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribers.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#2c3e50">
                          {row.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.source || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          color={statusColor(row.status)}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(row.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(row)}
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
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ mt: 1 }}
          />
    </Box>
  );

  if (embedded) return content;

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
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            Newsletter Subscribers
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Email list from blog and other newsletter signups
          </Typography>
        </Box>
        {content}
      </Paper>
    </Box>
  );
};

export default Newsletter;
