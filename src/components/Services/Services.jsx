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

const Services = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalServices, setTotalServices] = useState(0);

  useEffect(() => {
    fetchServices();
  }, [page, rowsPerPage]);

  const fetchServices = async () => {
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
        sortBy: "displayOrder",
        sortOrder: "ASC",
      });

      const response = await fetch(`/api/services?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
        setTotalServices(data.pagination?.total || data.data?.length || 0);
      } else {
        setError(data.message || "Failed to fetch services");
      }
    } catch (err) {
      setError(err.message || "Error fetching services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (service) => {
    const result = await Swal.fire({
      title: "Delete service?",
      text: `"${service.title}" will be removed.`,
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

      const response = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete service");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `"${service.title}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchServices();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete service",
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
            Services
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage service entries
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/services/create")}
            sx={{
              position: "absolute",
              right: 24,
              top: 24,
              background: "linear-gradient(45deg, #6B4E3D, #B85C38)",
              borderRadius: 2,
              px: 3,
              fontWeight: 700,
              textTransform: "none",
              boxShadow: "0 10px 25px rgba(78, 205, 196, 0.35)",
              "&:hover": {
                background: "linear-gradient(45deg, #8B4225, #6B4E3D)",
              },
            }}
          >
            New Service
          </Button>
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
                  <TableCell>Title</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Key / Featured</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#6B4E3D" }} />
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No services found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service, idx) => (
                    <TableRow key={service.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" fontWeight={700} color="#2c3e50">
                          {service.title}
                        </Typography>
                        {service.shortDescription && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 200 }}>
                            {service.shortDescription}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {service.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={service.status || "draft"}
                          size="small"
                          color={service.status === "published" ? "success" : service.status === "archived" ? "default" : "warning"}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        {service.isKeyService && <Chip label="Key" size="small" sx={{ mr: 0.5 }} />}
                        {service.featured && <Chip label="Featured" size="small" color="primary" />}
                        {!service.isKeyService && !service.featured && "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/services/${service.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/services/${service.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(service)}
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
            count={totalServices}
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

export default Services;
