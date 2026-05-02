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
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Visibility as ViewIcon,
  Event as EventIcon,
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Folder,
  Person as PersonIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";

const Documents = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filter, setFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [documentForm, setDocumentForm] = useState({
    title: "",
    description: "",
    file_type: "pdf",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [page, rowsPerPage, filter, documentTypeFilter]);

  const fetchDocuments = async () => {
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

      if (documentTypeFilter !== "all") {
        queryParams.append("file_type", documentTypeFilter);
      }

      const response = await fetch(`/api/documents?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(data.data || []);
        setTotalDocuments(data.count || 0);
      } else {
        setError(
          "Failed to fetch documents: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching documents: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeColor = (type) => {
    switch (type) {
      case "pdf":
        return "error";
      case "word":
        return "primary";
      case "excel":
        return "success";
      case "powerpoint":
        return "warning";
      case "image":
        return "secondary";
      case "text":
        return "default";
      default:
        return "default";
    }
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return "📄";
      case "word":
        return "📝";
      case "excel":
        return "📊";
      case "image":
        return "🖼️";
      case "powerpoint":
        return "📊";
      case "text":
        return "📝";
      default:
        return "📁";
    }
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

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setOpenViewDialog(true);
  };

  const handleDeleteDocument = async (document) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${document.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B85C38",
      cancelButtonColor: "#6B4E3D",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const response = await fetch(`/api/documents/${document.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }

        // Refresh documents list
        fetchDocuments();

        // Show success message with SweetAlert
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Document has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error deleting document:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete document. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "Please login again to download documents.",
        });
        return;
      }

      // Show loading state
      Swal.fire({
        title: "Downloading...",
        text: "Please wait while we prepare your document",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Fetch the document with authentication
      const response = await fetch(`/api/documents/${documentId}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the filename from Content-Disposition header or use document ID
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `document-${documentId}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close loading and show success
      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Download Complete!",
        text: "Document downloaded successfully",
        timer: 2000,
        showConfirmButton: false,
      });

    } catch (error) {
      console.error("Error downloading document:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: error.message || "Failed to download document. Please try again.",
      });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect file type based on extension
      const extension = file.name.split(".").pop().toLowerCase();
      let detectedType = "other";
      if (["pdf"].includes(extension)) detectedType = "pdf";
      else if (["doc", "docx"].includes(extension)) detectedType = "word";
      else if (["xls", "xlsx"].includes(extension)) detectedType = "excel";
      else if (["ppt", "pptx"].includes(extension)) detectedType = "powerpoint";
      else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) detectedType = "image";
      else if (["txt", "csv"].includes(extension)) detectedType = "text";
      
      setDocumentForm({
        ...documentForm,
        title: file.name,
        file_type: detectedType,
      });
    }
  };

  const handleCreateDocument = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      if (!selectedFile) {
        Swal.fire({
          icon: "error",
          title: "No File Selected",
          text: "Please select a file to upload.",
        });
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("title", documentForm.title);
      formData.append("description", documentForm.description);
      formData.append("file_type", documentForm.file_type);

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create document");
      }

      // Reset form and close dialog
      setDocumentForm({
        title: "",
        description: "",
        file_type: "pdf",
      });
      setSelectedFile(null);
      setOpenCreateDialog(false);
      setSelectedDocument(null);

      // Refresh documents list
      fetchDocuments();

      // Show success message with SweetAlert
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Document uploaded successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error creating document:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message || "Failed to create document. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error && documents.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #F5F1E8 0%, #E8D5C4 100%)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
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
                Document Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage company documents and files
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedDocument(null);
                setDocumentForm({
                  title: "",
                  description: "",
                  file_type: "pdf",
                });
                setOpenCreateDialog(true);
              }}
              sx={{
                background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                borderRadius: 3,
                px: { xs: 2, sm: 4 },
                py: 1.5,
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 8px 25px rgba(107, 78, 61, 0.3)",
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  background: "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 35px rgba(184, 92, 56, 0.4)",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Add New Document
            </Button>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* File Type Filter Tabs */}
          <Box mb={3}>
            <Tabs
              value={documentTypeFilter}
              onChange={(e, newValue) => setDocumentTypeFilter(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: 2,
                border: "1px solid rgba(107, 78, 61, 0.1)",
                "& .MuiTabs-indicator": {
                  backgroundColor: "#B85C38",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
                "& .MuiTab-root": {
                  textTransform: "capitalize",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  minHeight: 48,
                  color: "#666",
                  "&.Mui-selected": {
                    color: "#B85C38",
                    fontWeight: 700,
                  },
                  "&:hover": {
                    color: "#B85C38",
                    backgroundColor: "rgba(184, 92, 56, 0.05)",
                  },
                },
              }}
            >
              <Tab label="All Documents" value="all" />
              <Tab label="PDF" value="pdf" />
              <Tab label="Word" value="word" />
              <Tab label="Excel" value="excel" />
              <Tab label="PowerPoint" value="powerpoint" />
              <Tab label="Images" value="image" />
              <Tab label="Text Files" value="text" />
            </Tabs>
          </Box>

          {/* Documents Table */}
          <TableContainer
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(184, 92, 56, 0.1)",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(184, 92, 56, 0.1)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(184, 92, 56, 0.3)",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "rgba(184, 92, 56, 0.5)",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                    "& .MuiTableCell-head": {
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "0.95rem" },
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      border: "none",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <TableCell>No</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>File Type</TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#B85C38" }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={fetchDocuments}
                        sx={{
                          background:
                            "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                        }}
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No documents found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((document, idx) => (
                    <TableRow
                      key={document.id}
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(184, 92, 56, 0.02)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(184, 92, 56, 0.08)",
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
                      <TableCell sx={{ fontWeight: 600, color: "#B85C38" }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography sx={{ fontSize: "1.2rem" }}>
                            {getFileTypeIcon(document.file_type)}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="600"
                            sx={{ color: "#2c3e50" }}
                          >
                            {document.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={document.file_type}
                          color={getFileTypeColor(document.file_type)}
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#2c3e50", fontWeight: 600 }}
                        >
                          {document.uploader?.full_name || "Unknown"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ color: "#7f8c8d", fontWeight: 600 }}
                        >
                          {formatDate(document.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Download Document" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(document.id)}
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
                              <UploadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Document Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDocument(document)}
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
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Document" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteDocument(document)}
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
            count={totalDocuments}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderTop: "1px solid rgba(107, 78, 61, 0.1)",
              "& .MuiTablePagination-toolbar": {
                color: "#B85C38",
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

        {/* Document Dialog */}
        <Dialog
          open={openViewDialog || openCreateDialog}
          onClose={() => {
            setOpenViewDialog(false);
            setOpenCreateDialog(false);
            setSelectedDocument(null);
            setDocumentForm({
              title: "",
              description: "",
              file_type: "pdf",
            });
          }}
          maxWidth="xs"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "85vh",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(107, 78, 61, 0.2)",
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
            <Folder sx={{ position: "relative", zIndex: 1, fontSize: 28 }} />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {openViewDialog ? "Document Details" : "Add New Document"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {openViewDialog
                  ? "View document information"
                  : "Add a new document to the system"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            {openViewDialog ? (
              // View Document Details - Card Layout
              <Box>
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                    borderRadius: 3,
                    p: 3,
                    mb: 4,
                    mt: 2,
                    position: "relative",
                    overflow: "hidden",
                    color: "white",
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
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 1,
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        background: "linear-gradient(45deg, #fff, #f0f8ff)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {selectedDocument?.title || "N/A"}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography sx={{ fontSize: "1.5rem" }}>
                        {getFileTypeIcon(selectedDocument.file_type)}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          opacity: 0.9,
                          lineHeight: 1.6,
                          fontSize: "1rem",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                      >
                        {selectedDocument.file_type.toUpperCase()} Document
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Card
                    sx={{
                      background: "white",
                      borderRadius: 2,
                      p: 2,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <Folder sx={{ fontSize: 24, color: "#B85C38" }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          FILE TYPE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          <Chip
                            label={selectedDocument.file_type}
                            color={getFileTypeColor(selectedDocument.file_type)}
                            size="small"
                            sx={{ textTransform: "capitalize", fontWeight: 600 }}
                          />
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card
                    sx={{
                      background: "white",
                      borderRadius: 2,
                      p: 2,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <PersonIcon sx={{ fontSize: 24, color: "#B85C38" }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          UPLOADED BY
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {selectedDocument.uploader?.full_name || "Unknown"}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  <Card
                    sx={{
                      background: "white",
                      borderRadius: 2,
                      p: 2,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <CalendarIcon sx={{ fontSize: 24, color: "#B85C38" }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          UPLOAD DATE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {formatDate(selectedDocument.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>

                  {selectedDocument.description && (
                    <Card
                      sx={{
                        background: "white",
                        borderRadius: 2,
                        p: 2,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box display="flex" alignItems="flex-start" gap={2}>
                        <DescriptionIcon sx={{ fontSize: 24, color: "#B85C38", mt: 0.5 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                            DESCRIPTION
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50", mt: 0.5 }}>
                            {selectedDocument.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  )}
                </Stack>

                {/* Download Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2, color: "#2c3e50" }}
                  >
                    Actions
                  </Typography>
                  <Card
                    sx={{
                      background: "white",
                      borderRadius: 2,
                      p: 3,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => handleDownloadDocument(selectedDocument.id)}
                      sx={{
                        background:
                          "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: "0 4px 15px rgba(184, 92, 56, 0.3)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                          transform: "translateY(-1px)",
                          boxShadow: "0 6px 20px rgba(184, 92, 56, 0.4)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Download Document
                    </Button>
                  </Card>
                </Box>
              </Box>
            ) : (
              // Create/Edit Worker Form
              <Box
                component="form"
                noValidate
                sx={{ maxHeight: "45vh", overflowY: "auto" }}
              >
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {/* Title */}
                  <TextField
                    fullWidth
                    label="Title"
                    value={documentForm.title}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        title: e.target.value,
                      })
                    }
                    variant="outlined"
                    size="small"
                    required
                    placeholder="Document title"
                  />

                  {/* File Type Selection */}
                  <FormControl
                    fullWidth
                    variant="outlined"
                    size="small"
                    required
                  >
                    <InputLabel>File Type</InputLabel>
                    <Select
                      value={documentForm.file_type}
                      onChange={(e) =>
                        setDocumentForm({
                          ...documentForm,
                          file_type: e.target.value,
                        })
                      }
                      label="File Type"
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="word">Word Document</MenuItem>
                      <MenuItem value="excel">Excel Spreadsheet</MenuItem>
                      <MenuItem value="powerpoint">PowerPoint</MenuItem>
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="text">Text File</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Description */}
                  <TextField
                    fullWidth
                    label="Description"
                    value={documentForm.description}
                    onChange={(e) =>
                      setDocumentForm({
                        ...documentForm,
                        description: e.target.value,
                      })
                    }
                    variant="outlined"
                    size="small"
                    multiline
                    rows={3}
                    placeholder="Document description or notes"
                  />

                  {/* File Upload Section */}
                  <Box
                    sx={{
                      border: "2px dashed #B85C38",
                      borderRadius: 2,
                      p: 2,
                      textAlign: "center",
                      backgroundColor: "rgba(184, 92, 56, 0.05)",
                    }}
                  >
                    <UploadIcon
                      sx={{ fontSize: 48, color: "#B85C38", mb: 1 }}
                    />
                    <Typography variant="h6" sx={{ mb: 1, color: "#B85C38" }}>
                      Upload Document
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Drag and drop files here, or click to select files
                    </Typography>
                    {selectedFile && (
                      <Box
                        sx={{
                          mb: 2,
                          p: 1,
                          backgroundColor: "rgba(184, 92, 56, 0.1)",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: "#B85C38" }}
                        >
                          Selected: {selectedFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </Typography>
                      </Box>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      id="file-upload"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="contained"
                        component="span"
                        sx={{
                          background:
                            "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                        }}
                      >
                        {selectedFile ? "Change File" : "Choose File"}
                      </Button>
                    </label>
                  </Box>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(184, 92, 56, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                setOpenCreateDialog(false);
                setSelectedDocument(null);
                setDocumentForm({
                  title: "",
                  description: "",
                  file_type: "pdf",
                });
              }}
              variant="outlined"
              sx={{
                borderColor: "#B85C38",
                color: "#B85C38",
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: "#5a6fd8",
                  backgroundColor: "rgba(184, 92, 56, 0.1)",
                },
              }}
            >
              {openViewDialog ? "Close" : "Cancel"}
            </Button>
            {openCreateDialog && (
              <Button
                onClick={handleCreateDocument}
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  background:
                    "linear-gradient(135deg, #B85C38 0%, #6B4E3D 100%)",
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 4px 15px rgba(184, 92, 56, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(184, 92, 56, 0.4)",
                  },
                  "&:disabled": {
                    background: "rgba(184, 92, 56, 0.3)",
                    color: "rgba(255, 255, 255, 0.6)",
                  },
                  transition: "all 0.3s ease",
                }}
                disabled={
                  !documentForm.title ||
                  !documentForm.file_type ||
                  !selectedFile
                }
              >
                Add Document
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Documents;
