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
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const JOB_TYPE_OPTIONS = ["Job", "Internship", "Attachment"];

const JobOpportunities = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState("all");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchOpportunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, typeFilter]);

  const fetchOpportunities = async () => {
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

      if (typeFilter !== "all") queryParams.set("type", typeFilter);

      const response = await fetch(`/api/job-opportunities?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch job opportunities");

      if (data.success) {
        setOpportunities(Array.isArray(data.data) ? data.data : []);
        setTotal(data.pagination?.total ?? data.data?.length ?? 0);
      } else {
        setOpportunities([]);
        setTotal(0);
        setError(data.message || "Failed to fetch job opportunities");
      }
    } catch (err) {
      setError(err.message || "Error fetching job opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (opp) => {
    const result = await Swal.fire({
      title: "Delete opportunity?",
      text: `"${opp.title}" will be removed.`,
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
      const response = await fetch(`/api/job-opportunities/${opp.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete job opportunity");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: `"${opp.title}" removed successfully.`,
        timer: 1400,
        showConfirmButton: false,
      });
      fetchOpportunities();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete job opportunity",
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

  const chipColor = (type) => {
    if (type === "Job") return "primary";
    if (type === "Internship") return "secondary";
    return "default";
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
              Job Opportunities
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Jobs, internships, and attachments
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/marketplace/job-opportunities/create")}
            sx={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: 2,
              px: 2,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { background: "rgba(255, 255, 255, 0.3)" },
              whiteSpace: "nowrap",
            }}
          >
            New Opportunity
          </Button>
        </Box>

        <Box sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
              Filter by type
            </Typography>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} displayEmpty>
              <MenuItem value="all">All types</MenuItem>
              {JOB_TYPE_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ p: 2, pt: 0 }}>
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
              overflowX: "auto",
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
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Location</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#17cf54" }} />
                    </TableCell>
                  </TableRow>
                ) : opportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No job opportunities found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  opportunities.map((opp, idx) => (
                    <TableRow key={opp.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" fontWeight={700} color="#2c3e50" noWrap>
                          {opp.title}
                        </Typography>
                        {opp.description && (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {opp.description.slice(0, 60)}…
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={opp.type || "—"} size="small" color={chipColor(opp.type)} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        <Typography variant="body2">{opp.location || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={opp.isActive ? "Yes" : "No"}
                          size="small"
                          color={opp.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {opp.featured ? (
                          <Chip label="Yes" size="small" color="primary" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/job-opportunities/${opp.id}`)}
                            sx={{ color: "#27ae60" }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/marketplace/job-opportunities/${opp.id}/edit`)}
                            sx={{ color: "#3498db" }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(opp)}
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

export default JobOpportunities;

