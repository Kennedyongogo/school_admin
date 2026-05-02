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

const Grants = () => {
  const navigate = useNavigate();
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchGrants();
  }, [page, rowsPerPage]);

  const fetchGrants = async () => {
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
        sortBy: "deadline",
        sortOrder: "ASC",
      });

      const response = await fetch(`/api/grants?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setGrants(data.data || []);
        setTotal(data.pagination?.total ?? data.data?.length ?? 0);
      } else {
        setError(data.message || "Failed to fetch grants");
      }
    } catch (err) {
      setError(err.message || "Error fetching grants");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (grant) => {
    const result = await Swal.fire({
      title: "Delete grant?",
      text: `"${grant.title}" will be removed.`,
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
      const response = await fetch(`/api/grants/${grant.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete grant");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `"${grant.title}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchGrants();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete grant",
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
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
              Grants & Funding
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Manage funding opportunities
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/marketplace/grants/create")}
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
            New Grant
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
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      border: "none",
                    },
                  }}
                >
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Badge</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#f59e0b" }} />
                    </TableCell>
                  </TableRow>
                ) : grants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No grants found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  grants.map((grant, idx) => (
                    <TableRow key={grant.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250 }}>
                        <Typography variant="body2" fontWeight={600} color="#2c3e50">
                          {grant.title}
                        </Typography>
                        {grant.description && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {grant.description.slice(0, 50)}…
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={grant.badge || "—"} size="small" color="warning" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{grant.amount || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {grant.deadlineText || formatDate(grant.deadline) || "Rolling"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={grant.isActive ? "Yes" : "No"}
                          size="small"
                          color={grant.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {grant.featured ? (
                          <Chip label="Yes" size="small" color="primary" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/grants/${grant.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/grants/${grant.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(grant)}
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

export default Grants;
