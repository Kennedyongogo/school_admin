import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { People as PeopleIcon, Visibility, Delete as DeleteIcon, Verified, VerifiedUser } from "@mui/icons-material";
import Swal from "sweetalert2";
import MarketplaceUserView from "./MarketplaceUserView";

const MarketplaceUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [viewUser, setViewUser] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const response = await fetch("/api/marketplace/users", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total ?? data.data?.length ?? 0);
      } else {
        setError(data.message || "Failed to fetch marketplace users");
      }
    } catch (err) {
      setError(err.message || "Error fetching marketplace users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (user) => {
    setViewUser(user);
    setViewOpen(true);
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setViewUser(null);
  };

  const isUserVerified = (user) => user?.isVerified === true || user?.is_verified === true;

  const handleVerifyToggle = async (user) => {
    const verified = isUserVerified(user);
    const result = await Swal.fire({
      title: verified ? "Remove verification?" : "Verify this user?",
      html: verified
        ? `Remove MK Verified badge from <strong>${user.fullName || user.email}</strong>?`
        : `Mark <strong>${user.fullName || user.email}</strong> as MK Verified? They will show the verified badge on the marketplace.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#6B4E3D",
      cancelButtonColor: "#6c757d",
      confirmButtonText: verified ? "Yes, remove verification" : "Yes, verify",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setVerifyingId(user.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVerified: !verified }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update verification");
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isVerified: !verified, is_verified: !verified } : u))
      );
      await Swal.fire({
        title: "Done",
        text: verified ? "Verification removed." : "User is now verified.",
        icon: "success",
        confirmButtonColor: "#6B4E3D",
      });
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: err.message || "Failed to update verification",
        icon: "error",
        confirmButtonColor: "#6B4E3D",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: "Delete marketplace user?",
      html: `Delete <strong>${user.fullName || user.email}</strong>? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setDeletingId(user.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/marketplace/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to delete user");
      await fetchUsers();
      await Swal.fire({
        title: "Deleted",
        text: "Marketplace user has been deleted.",
        icon: "success",
        confirmButtonColor: "#6B4E3D",
      });
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: err.message || "Error deleting user",
        icon: "error",
        confirmButtonColor: "#6B4E3D",
      });
    } finally {
      setDeletingId(null);
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

  const formatRole = (role) => {
    if (!role) return "—";
    return String(role)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const slicedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ mt: 1 }}>
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
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PeopleIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Marketplace Users
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              All registered marketplace (agribusiness) users
            </Typography>
          </Box>
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
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Verified</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#6B4E3D" }} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No marketplace users found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  slicedUsers.map((user, idx) => (
                    <TableRow key={user.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#2c3e50">
                          {user.fullName || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatRole(user.role)}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status || "—"}
                          size="small"
                          color={user.status === "active" ? "success" : "default"}
                          sx={{ textTransform: "capitalize" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {isUserVerified(user) ? (
                          <Chip
                            size="small"
                            icon={<Verified sx={{ fontSize: 16 }} />}
                            label="MK Verified"
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={isUserVerified(user) ? "Remove verification" : "Verify user"}>
                          <IconButton
                            size="small"
                            onClick={() => handleVerifyToggle(user)}
                            disabled={verifyingId === user.id}
                            color={isUserVerified(user) ? "success" : "default"}
                            sx={{ "&:focus": { outline: "none" }, "&:focus-visible": { outline: "none" } }}
                          >
                            {verifyingId === user.id ? (
                              <CircularProgress size={20} sx={{ color: "success.main" }} />
                            ) : (
                              <VerifiedUser fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={() => handleView(user)}
                          color="primary"
                          title="View details"
                          sx={{ "&:focus": { outline: "none" }, "&:focus-visible": { outline: "none" } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          color="error"
                          title="Delete user"
                          sx={{ "&:focus": { outline: "none" }, "&:focus-visible": { outline: "none" } }}
                        >
                          {deletingId === user.id ? (
                            <CircularProgress size={20} sx={{ color: "error.main" }} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
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

      <MarketplaceUserView
        open={viewOpen}
        onClose={handleCloseView}
        user={viewUser}
      />
    </Box>
  );
};

export default MarketplaceUsers;
