import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const Quotations = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchQuotations();
  }, [page, rowsPerPage]);

  const fetchQuotations = async () => {
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

      const response = await fetch(`/api/quote?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setQuotations(data.data || []);
        setTotal(data.pagination?.total || 0);
      } else {
        setError(data.message || "Failed to fetch quotation requests");
      }
    } catch (err) {
      setError(err.message || "Error fetching quotation requests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Delete quotation request?",
      text: `Quote request for "${item.projectType}" at ${item.location} will be removed.`,
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

      const response = await fetch(`/api/quote/${item.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete quotation request");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Quotation request removed successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      fetchQuotations();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete quotation request",
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

  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isNaN(num) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  const statusColor = (status) => {
    switch (status) {
      case "new":
        return "info";
      case "quoted":
        return "default";
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "archived":
        return "default";
      default:
        return "default";
    }
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
                  <TableCell>Project Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Scale</TableCell>
                  <TableCell>Expected Outcomes</TableCell>
                  <TableCell>Quote Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#667eea" }} />
                    </TableCell>
                  </TableRow>
                ) : quotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No quotation requests found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  quotations.map((item, idx) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#2c3e50">
                          {item.projectType}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 140 }}>
                        <Typography variant="body2" noWrap title={item.location}>
                          {item.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.scaleOfOperation}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={item.expectedOutcomes}>
                          {item.expectedOutcomes ? `${item.expectedOutcomes.slice(0, 50)}${item.expectedOutcomes.length > 50 ? "…" : ""}` : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatCurrency(item.quoteAmount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status.replace("_", " ")}
                          color={statusColor(item.status)}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(item.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/quotations/${item.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item)}
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
            Quotation Requests
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Get Quotation form submissions from public users
          </Typography>
        </Box>
        {content}
      </Paper>
    </Box>
  );
};

export default Quotations;
