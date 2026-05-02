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
  CalendarToday as CalendarIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const Blogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBlogs, setTotalBlogs] = useState(0);

  useEffect(() => {
    fetchBlogs();
  }, [page, rowsPerPage]);

  const fetchBlogs = async () => {
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

      const response = await fetch(`/api/blogs?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBlogs(data.data || []);
        setTotalBlogs(data.pagination?.total || 0);
      } else {
        setError(data.message || "Failed to fetch blogs");
      }
    } catch (err) {
      setError(err.message || "Error fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blog) => {
    const result = await Swal.fire({
      title: "Delete blog?",
      text: `"${blog.title}" will be removed.`,
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

      const response = await fetch(`/api/blogs/${blog.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete blog");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `"${blog.title}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchBlogs();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete blog",
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
            Blogs
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage blog posts for the site
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/blogs/create")}
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
            New Blog
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
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#667eea" }} />
                    </TableCell>
                  </TableRow>
                ) : blogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No blogs found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  blogs.map((blog, idx) => (
                    <TableRow key={blog.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="body2" fontWeight={700} color="#2c3e50">
                          {blog.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={blog.category || "Uncategorized"}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={blog.status}
                          color={
                            blog.status === "published"
                              ? "success"
                              : blog.status === "draft"
                              ? "warning"
                              : "default"
                          }
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View blog">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/blogs/${blog.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/blogs/${blog.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(blog)}
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
            count={totalBlogs}
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

export default Blogs;
