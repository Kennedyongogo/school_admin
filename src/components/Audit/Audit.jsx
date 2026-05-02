import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  Tabs,
  Tab,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

const Audit = () => {
  const theme = useTheme();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  const resourceTypes = [
    { value: "", label: "All" },
    { value: "admin_user", label: "Admin User" },
    { value: "project", label: "Project" },
    { value: "document", label: "Document" },
    { value: "contact", label: "Contact" },
    { value: "system", label: "System" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [page, rowsPerPage, selectedTab]);

  const fetchAuditLogs = async () => {
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

      const selectedResourceType = resourceTypes[selectedTab].value;
      if (selectedResourceType) queryParams.append("resource_type", selectedResourceType);

      const response = await fetch(`/api/audit-trail?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.data || []);
        setTotalLogs(data.pagination?.total || 0);
      } else {
        setError(
          "Failed to fetch audit logs: " + (data.message || "Unknown error")
        );
      }
    } catch (err) {
      setError("Error fetching audit logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "failed":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getActionColor = (action) => {
    if (action.includes("delete")) return "error";
    if (action.includes("create")) return "success";
    if (action.includes("update") || action.includes("login")) return "info";
    return "default";
  };

  const formatActionText = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatResourceType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setOpenViewDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(0);
  };

  if (error && auditLogs.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
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
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                Audit Trail Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                View and track all system activities and changes
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* Resource Type Tabs */}
          <Paper
            elevation={0}
            sx={{
              mb: 2,
              borderRadius: 3,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(102, 126, 234, 0.1)",
              overflow: "hidden",
            }}
          >
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 48,
                  color: "#667eea",
                  "&.Mui-selected": {
                    color: "#667eea",
                    backgroundColor: "rgba(102, 126, 234, 0.1)",
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#667eea",
                  height: 3,
                },
              }}
            >
              {resourceTypes.map((type, index) => (
                <Tab
                  key={type.value}
                  label={type.label}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
                  }}
                />
              ))}
            </Tabs>
          </Paper>

          {/* Audit Logs Table */}
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
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#667eea" }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                      <Button
                        variant="contained"
                        onClick={fetchAuditLogs}
                        sx={{
                          background:
                            "linear-gradient(45deg, #667eea, #764ba2)",
                        }}
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No audit logs found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log, idx) => (
                    <TableRow
                      key={log.id}
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
                      <TableCell sx={{ fontWeight: 600, color: "#667eea" }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#2c3e50" }}
                        >
                          {log.user?.full_name || "System"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          {log.user?.email || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatActionText(log.action)}
                          color={getActionColor(log.action)}
                          size="small"
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
                          sx={{ color: "#7f8c8d", fontWeight: 600 }}
                        >
                          {formatResourceType(log.resource_type)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={getStatusColor(log.status)}
                          size="small"
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
                          sx={{ color: "#7f8c8d", fontWeight: 600 }}
                        >
                          {formatDate(log.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Audit Log Details" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleViewLog(log)}
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalLogs}
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

        {/* Audit Log Details Dialog */}
        <Dialog
          open={openViewDialog}
          onClose={() => {
            setOpenViewDialog(false);
            setSelectedLog(null);
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
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            <HistoryIcon
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
                Audit Log Details
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                View complete audit trail information
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            {selectedLog && (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    User
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {selectedLog.user?.full_name || "System"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLog.user?.email || "N/A"}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  gap={2}
                >
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action
                    </Typography>
                    <Chip
                      label={formatActionText(selectedLog.action)}
                      color={getActionColor(selectedLog.action)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedLog.status}
                      color={getStatusColor(selectedLog.status)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource Type
                  </Typography>
                  <Typography variant="body1">
                    {formatResourceType(selectedLog.resource_type)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Resource ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      backgroundColor: "rgba(102, 126, 234, 0.05)",
                      p: 1,
                      borderRadius: 1,
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedLog.resource_id || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
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
                    {selectedLog.description}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedLog.ip_address || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedLog.createdAt)}
                  </Typography>
                </Box>

                {selectedLog.old_values && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Old Values
                    </Typography>
                    <Paper
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: "rgba(231, 76, 60, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(231, 76, 60, 0.2)",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {selectedLog.new_values && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      New Values
                    </Typography>
                    <Paper
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: "rgba(39, 174, 96, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(39, 174, 96, 0.2)",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {selectedLog.metadata && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Metadata
                    </Typography>
                    <Paper
                      sx={{
                        mt: 1,
                        p: 2,
                        backgroundColor: "rgba(102, 126, 234, 0.05)",
                        borderRadius: 2,
                        border: "1px solid rgba(102, 126, 234, 0.1)",
                      }}
                    >
                      <pre
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {selectedLog.error_message && (
                  <Box>
                    <Typography variant="subtitle2" color="error">
                      Error Message
                    </Typography>
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {selectedLog.error_message}
                    </Alert>
                  </Box>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions
            sx={{ p: 3, gap: 2, backgroundColor: "rgba(102, 126, 234, 0.05)" }}
          >
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                setSelectedLog(null);
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
      </Paper>
    </Box>
  );
};

export default Audit;
