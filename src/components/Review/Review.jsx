import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
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
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  Construction as ProjectIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Update as UpdateIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";

const Review = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTestimony, setSelectedTestimony] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalTestimonies, setTotalTestimonies] = useState(0);

  useEffect(() => {
    fetchTestimonies();
  }, [page, rowsPerPage]);

  const fetchTestimonies = async () => {
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

      const response = await fetch(`/api/reviews?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setTestimonies(data.data || []);
        setTotalTestimonies(data.pagination?.total || 0);
      } else {
        setError(
          "Failed to fetch testimonies: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching testimonies: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getRatingStars = (rating) => {
    return "⭐".repeat(rating);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewTestimony = (testimony) => {
    setSelectedTestimony(testimony);
    setOpenViewDialog(true);
  };

  const handleEditTestimony = (testimony) => {
    setSelectedTestimony(testimony);
    setEditForm({
      status: testimony.status,
    });
    setOpenEditDialog(true);
  };

  const handleUpdateTestimony = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch(
        `/api/reviews/${selectedTestimony.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: editForm.status }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update testimony");
      }

      // Close dialog and refresh testimonies
      setOpenEditDialog(false);
      setSelectedTestimony(null);
      fetchTestimonies();

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Testimony has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } catch (err) {
      console.error("Error updating testimony:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update testimony. Please try again.",
        customClass: {
          container: "swal-z-index-fix",
        },
        didOpen: () => {
          const swalContainer = document.querySelector(".swal-z-index-fix");
          if (swalContainer) {
            swalContainer.style.zIndex = "9999";
          }
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestimony = async (testimony) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete this testimony?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal-z-index-fix",
      },
      didOpen: () => {
        const swalContainer = document.querySelector(".swal-z-index-fix");
        if (swalContainer) {
          swalContainer.style.zIndex = "9999";
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const response = await fetch(`/api/reviews/${testimony.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete testimony");
        }

        // Refresh testimonies list
        fetchTestimonies();

        // Show success message with SweetAlert
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Testimony has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            container: "swal-z-index-fix",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal-z-index-fix");
            if (swalContainer) {
              swalContainer.style.zIndex = "9999";
            }
          },
        });
      } catch (err) {
        console.error("Error deleting testimony:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete testimony. Please try again.",
          customClass: {
            container: "swal-z-index-fix",
          },
          didOpen: () => {
            const swalContainer = document.querySelector(".swal-z-index-fix");
            if (swalContainer) {
              swalContainer.style.zIndex = "9999";
            }
          },
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (error && testimonies.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          border: "none",
          boxShadow: "none",
          minHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
            position="relative"
            zIndex={1}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                }}
              >
                Reviews Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage and moderate user reviews
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* Testimonies Table */}
          <TableContainer
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(102, 126, 234, 0.1)",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(102, 126, 234, 0.3)",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "rgba(102, 126, 234, 0.5)",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "0.95rem" },
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      border: "none",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    },
                  }}
                >
                  <TableCell align="center">No</TableCell>
                  <TableCell align="center">Name</TableCell>
                  <TableCell align="center">Rating</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#B85C38" }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={fetchTestimonies}
                        sx={{
                          background:
                            "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #8B4225 0%, #3D2817 100%)",
                          },
                        }}
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : testimonies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No reviews found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonies.map((testimony, idx) => (
                    <TableRow
                      key={testimony.id}
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(102, 126, 234, 0.02)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(102, 126, 234, 0.08)",
                          transform: { xs: "none", sm: "scale(1.01)" },
                        },
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        "& .MuiTableCell-root": {
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          padding: { xs: "8px 4px", sm: "16px" },
                        },
                      }}
                    >
                      <TableCell
                        sx={{ fontWeight: 600, color: "#667eea" }}
                        align="center"
                      >
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#2c3e50" }}
                        >
                          {testimony.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#2c3e50", fontSize: "1.2rem" }}
                        >
                          {getRatingStars(testimony.rating)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={getStatusText(testimony.status)}
                          color={getStatusColor(testimony.status)}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="View Review Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewTestimony(testimony)}
                              sx={{
                                color: "#27ae60",
                                backgroundColor: "rgba(39, 174, 96, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(39, 174, 96, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Review" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditTestimony(testimony)}
                              sx={{
                                color: "#3498db",
                                backgroundColor: "rgba(52, 152, 219, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(52, 152, 219, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Review" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTestimony(testimony)}
                              sx={{
                                color: "#e74c3c",
                                backgroundColor: "rgba(231, 76, 60, 0.1)",
                                "&:hover": {
                                  backgroundColor: "rgba(231, 76, 60, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalTestimonies}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderTop: "1px solid rgba(102, 126, 234, 0.1)",
              "& .MuiTablePagination-toolbar": {
                color: "#667eea",
                fontWeight: 600,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: "#2c3e50",
                  fontWeight: 600,
                },
            }}
          />
        </Box>

        {/* Testimony Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => {
            setOpenViewDialog(false);
            setSelectedTestimony(null);
          }}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "85vh",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(102, 126, 234, 0.2)",
              overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              color: "white",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -15,
                left: -15,
                width: 80,
                height: 80,
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "50%",
                zIndex: 0,
              }}
            />
            <WarningIcon
              sx={{ position: "relative", zIndex: 1, fontSize: 28 }}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Review Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                View review information
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            {selectedTestimony && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedTestimony.name}
                </Typography>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Typography variant="h6" sx={{ fontSize: "1.5rem" }}>
                    {getRatingStars(selectedTestimony.rating)}
                  </Typography>
                  <Typography variant="h6">
                    Rating: {selectedTestimony.rating}/5
                  </Typography>
                </Box>

                <Stack spacing={1.2} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    <strong>Email:</strong> {selectedTestimony.email || "-"}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Location:</strong>{" "}
                    {selectedTestimony.location || "-"}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Recommend:</strong>{" "}
                    {selectedTestimony.recommend ? "Yes" : "No"}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Status:</strong>{" "}
                    {getStatusText(selectedTestimony.status)}
                  </Typography>
                  <Typography variant="subtitle2">
                    <strong>Created:</strong>{" "}
                    {selectedTestimony.createdAt
                      ? formatDate(selectedTestimony.createdAt)
                      : "-"}
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Status:</strong>{" "}
                    {getStatusText(selectedTestimony.status)}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedTestimony.createdAt)}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Comment:</strong>
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      p: 2,
                      backgroundColor: "rgba(102, 126, 234, 0.05)",
                      borderRadius: 2,
                      border: "1px solid rgba(102, 126, 234, 0.1)",
                    }}
                  >
                    {selectedTestimony.comment}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(102, 126, 234, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                setSelectedTestimony(null);
              }}
              variant="outlined"
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "#5a6fd8",
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Testimony Dialog */}
        <Dialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setSelectedTestimony(null);
            setEditForm({
              status: "",
            });
          }}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "85vh",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(102, 126, 234, 0.2)",
              overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              color: "white",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 3,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "50%",
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: -15,
                left: -15,
                width: 80,
                height: 80,
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "50%",
                zIndex: 0,
              }}
            />
            <UpdateIcon
              sx={{ position: "relative", zIndex: 1, fontSize: 28 }}
            />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Manage Review Status
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Approve or reject review for public display
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Display Review Details (Read-only) */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "rgba(102, 126, 234, 0.05)",
                  borderRadius: 2,
                  border: "1px solid rgba(102, 126, 234, 0.1)",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {selectedTestimony?.name}
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Typography variant="h6" sx={{ fontSize: "1.5rem" }}>
                    {selectedTestimony &&
                      getRatingStars(selectedTestimony.rating)}
                  </Typography>
                  <Typography variant="h6">
                    Rating: {selectedTestimony?.rating}/5
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedTestimony?.email || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Location:</strong>{" "}
                    {selectedTestimony?.location || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Recommend:</strong>{" "}
                    {selectedTestimony?.recommend ? "Yes" : "No"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong>{" "}
                    {getStatusText(selectedTestimony?.status)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Created:</strong>{" "}
                    {selectedTestimony?.createdAt
                      ? formatDate(selectedTestimony.createdAt)
                      : "-"}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", fontStyle: "italic" }}
                >
                  "{selectedTestimony?.comment}"
                </Typography>
              </Box>

              {/* Status Field (Only Editable Field) */}
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  label="Status"
                  required
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <Typography
                variant="body2"
                sx={{ color: "#666", fontStyle: "italic", textAlign: "center" }}
              >
                Note: Only the status can be modified. The testimonial content
                is preserved as submitted by the user.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(102, 126, 234, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenEditDialog(false);
                setSelectedTestimony(null);
                setEditForm({
                  rating: "",
                  description: "",
                  status: "",
                });
              }}
              variant="outlined"
              sx={{
                borderColor: "#667eea",
                color: "#667eea",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "#5a6fd8",
                  backgroundColor: "rgba(102, 126, 234, 0.1)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTestimony}
              variant="contained"
              disabled={loading}
              sx={{
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                "&:hover": {
                  background: "linear-gradient(45deg, #5a6fd8, #6a4c93)",
                },
              }}
            >
              {loading ? "Updating..." : "Update Status"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Review;
