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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const FAQs = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalFaqs, setTotalFaqs] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, [page, rowsPerPage, categoryFilter, statusFilter]);

  const fetchFaqs = async () => {
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
      if (search.trim()) queryParams.set("search", search.trim());
      if (categoryFilter) queryParams.set("category", categoryFilter);
      if (statusFilter) queryParams.set("status", statusFilter);

      const response = await fetch(`/api/faqs?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFaqs(data.data || []);
        setTotalFaqs(data.pagination?.total || 0);
      } else {
        setError(data.message || "Failed to fetch FAQs");
      }
    } catch (err) {
      setError(err.message || "Error fetching FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(0);
    fetchFaqs();
  };

  const handleDelete = async (faq) => {
    const result = await Swal.fire({
      title: "Delete FAQ?",
      text: `"${faq.question?.substring(0, 50)}..." will be removed.`,
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

      const response = await fetch(`/api/faqs/${faq.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete FAQ");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "FAQ removed successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
      fetchFaqs();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete FAQ",
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
            FAQs
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage frequently asked questions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/faqs/create")}
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
            New FAQ
          </Button>
        </Box>

        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}
            >
              <TextField
                size="small"
                placeholder="Search question or answer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ minWidth: 220 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="General">General</MenuItem>
                  <MenuItem value="Pricing">Pricing</MenuItem>
                  <MenuItem value="Services">Services</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="outlined"
                onClick={handleSearchSubmit}
                sx={{
                  borderColor: "#B85C38",
                  color: "#B85C38",
                  "&:hover": { borderColor: "#6B4E3D", backgroundColor: "rgba(184, 92, 56, 0.08)" },
                }}
              >
                Search
              </Button>
            </Box>
          </Box>

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
                  <TableCell>Question</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
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
                ) : faqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No FAQs found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  faqs.map((faq, idx) => (
                    <TableRow key={faq.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" fontWeight={700} color="#2c3e50">
                          {faq.question?.length > 80 ? `${faq.question.substring(0, 80)}...` : faq.question}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={faq.category || "—"}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>{faq.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          label={faq.status}
                          color={faq.status === "active" ? "success" : "default"}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View FAQ">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/faqs/${faq.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/faqs/${faq.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(faq)}
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
            count={totalFaqs}
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

export default FAQs;
