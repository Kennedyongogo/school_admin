import React, { useState, useEffect } from "react";
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
  Avatar,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  Visibility as Visibility,
  VisibilityOff as VisibilityOff,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  CheckCircle as ActiveIcon,
  CheckCircle,
  Schedule,
  Cancel as InactiveIcon,
  Check as ApproveIcon,
  Block as SuspendIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";

const UsersTable = () => {
  const theme = useTheme();
  const palette = {
    primary: "#B85C38",
    primaryDark: "#8B4225",
    accent: "#6B4E3D",
    lightBg: "#F5F1E8",
    border: "rgba(107, 78, 61, 0.2)",
    text: "#3D2817",
  };

  // Helper to build URL for uploaded assets using Vite proxy
  const buildImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;

    // Use relative URLs - Vite proxy will handle routing to backend
    if (imageUrl.startsWith("uploads/")) return `/${imageUrl}`;
    if (imageUrl.startsWith("/uploads/")) return imageUrl;
    return imageUrl;
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    description: "",
    role: "admin",
    password: "",
    profile_picture: null,
    profile_picture_preview: "",
    profile_picture_path: "", // For storing the relative path
    isActive: true,
    whatsapp_link: "",
    google_link: "",
    twitter_link: "",
    facebook_link: "",
  });

  // Role tabs configuration
  const roleTabs = [
    { label: "All Users", value: null },
    { label: "Super Admins", value: "super-admin" },
    { label: "Admins", value: "admin" },
    { label: "Regular Users", value: "regular user" },
  ];

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, activeTab]);

  const fetchUsers = async () => {
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

      // Add role filter if a specific role is selected
      const selectedRole = roleTabs[activeTab]?.value;
      if (selectedRole) {
        queryParams.append("role", selectedRole);
      }

      const response = await fetch(`/api/admin-users?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
        setTotalUsers(data.pagination?.total || 0);
      } else {
        setError("Failed to fetch users: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      setError("Error fetching users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super-admin":
        return "error";
      case "admin":
        return "primary";
      case "regular user":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatRole = (role) => {
    if (!role) return "N/A";
    return role.replace("-", " ").replace(/_/g, " ").split(" ").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  const getStatusColor = (isActive) => {
    return isActive ? "success" : "error";
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0); // Reset to first page when switching tabs
  };

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUserForm({
        ...userForm,
        profile_picture: file,
        profile_picture_preview: URL.createObjectURL(file),
      });
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);

    // Convert file path to URL for display
    let profilePictureUrl = "";
    let profilePicturePath = "";
    if (user.profile_image) {
      profilePictureUrl = buildImageUrl(user.profile_image);
      profilePicturePath = user.profile_image; // Store the relative path
    }

    setUserForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      position: user.position || "",
      description: user.description || "",
      role: user.role || "admin",
      password: "",
      profile_picture: null,
      profile_picture_preview: profilePictureUrl,
      profile_picture_path: profilePicturePath, // Store the existing path
      isActive: user.isActive !== undefined ? user.isActive : true,
      whatsapp_link: user.whatsapp_link || "",
      google_link: user.google_link || "",
      twitter_link: user.twitter_link || "",
      facebook_link: user.facebook_link || "",
    });
    setOpenEditDialog(true);
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${user.full_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setIsDeleting(true);
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authentication token found. Please login again.");
          return;
        }

        const response = await fetch(`/api/admin-users/${user.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        fetchUsers();

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "User has been deleted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("Error deleting user:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete user. Please try again.",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUpdateUser = async () => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("full_name", userForm.full_name);
      formData.append("email", userForm.email);
      formData.append("phone", userForm.phone);
      formData.append("position", userForm.position);
      formData.append("description", userForm.description);
      formData.append("role", userForm.role);
      formData.append("isActive", userForm.isActive);
      formData.append("whatsapp_link", userForm.whatsapp_link);
      formData.append("google_link", userForm.google_link);
      formData.append("twitter_link", userForm.twitter_link);
      formData.append("facebook_link", userForm.facebook_link);

      // If a new file is selected, send the file
      // If no new file but there's an existing path, send the path
      if (userForm.profile_picture) {
        formData.append("profile_image", userForm.profile_picture);
      } else if (userForm.profile_picture_path) {
        formData.append("profile_image_path", userForm.profile_picture_path);
      }

      const response = await fetch(`/api/admin-users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update user");
      }

      setUserForm({
        full_name: "",
        email: "",
        phone: "",
        position: "",
        description: "",
        role: "admin",
        password: "",
        profile_picture: null,
        profile_picture_preview: "",
        profile_picture_path: "",
        isActive: true,
        whatsapp_link: "",
        google_link: "",
        twitter_link: "",
        facebook_link: "",
      });
      setOpenEditDialog(false);
      setSelectedUser(null);

      fetchUsers();

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "User has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error updating user:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update user. Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsCreating(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("full_name", userForm.full_name);
      formData.append("email", userForm.email);
      formData.append("phone", userForm.phone);
      formData.append("position", userForm.position);
      formData.append("description", userForm.description);
      formData.append("role", userForm.role);
      formData.append("password", userForm.password);
      formData.append("isActive", userForm.isActive);
      formData.append("whatsapp_link", userForm.whatsapp_link);
      formData.append("google_link", userForm.google_link);
      formData.append("twitter_link", userForm.twitter_link);
      formData.append("facebook_link", userForm.facebook_link);

      if (userForm.profile_picture) {
        formData.append("profile_image", userForm.profile_picture);
      }

      const response = await fetch("/api/admin-users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create user");
      }

      setUserForm({
        full_name: "",
        email: "",
        phone: "",
        position: "",
        description: "",
        role: "admin",
        password: "",
        profile_picture: null,
        profile_picture_preview: "",
        profile_picture_path: "",
        isActive: true,
        whatsapp_link: "",
        google_link: "",
        twitter_link: "",
        facebook_link: "",
      });
      setOpenCreateDialog(false);
      setSelectedUser(null);

      fetchUsers();

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "User created successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error creating user:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message || "Failed to create user. Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${palette.lightBg} 0%, #FFFFFF 60%, rgba(232, 224, 209, 0.9) 100%)`,
        minHeight: "100vh",
        m: 1.5,
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
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
            p: 3,
            color: "#FFFFFF",
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
              background: "rgba(255, 255, 255, 0.08)",
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
              background: "rgba(255, 255, 255, 0.06)",
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
                Admin Users Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage admin users and their roles
              </Typography>
            </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedUser(null);
                  setShowPassword(false);
                  setUserForm({
                    full_name: "",
                    email: "",
                    phone: "",
                    position: "",
                    description: "",
                    role: "admin",
                    password: "",
                    profile_picture: null,
                    profile_picture_preview: "",
                    profile_picture_path: "",
                    isActive: true,
                    whatsapp_link: "",
                    google_link: "",
                    twitter_link: "",
                    facebook_link: "",
                  });
                  setOpenCreateDialog(true);
                }}
                sx={{
                  background: `linear-gradient(45deg, ${palette.primary} 30%, ${palette.primaryDark} 90%)`,
                  borderRadius: 3,
                  px: { xs: 2, sm: 4 },
                  py: 1.5,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 8px 25px rgba(184, 92, 56, 0.3)",
                  width: { xs: "100%", sm: "auto" },
                  "&:hover": {
                    background: `linear-gradient(45deg, ${palette.primaryDark} 30%, ${palette.primary} 90%)`,
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 35px rgba(184, 92, 56, 0.35)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Create New Admin
              </Button>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          {/* Tabs */}
          <Box mb={3}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  minHeight: 48,
                  color: palette.accent,
                  "&.Mui-selected": {
                    color: palette.primary,
                    fontWeight: 700,
                  },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: palette.primary,
                  height: 3,
                  borderRadius: "2px 2px 0 0",
                },
              }}
            >
              {roleTabs.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>

          {/* Users Table */}
          <TableContainer
            sx={{
              borderRadius: 3,
              overflowX: "auto",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: `1px solid ${palette.border}`,
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(184, 92, 56, 0.08)",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(184, 92, 56, 0.35)",
                borderRadius: 4,
                "&:hover": {
                  backgroundColor: "rgba(184, 92, 56, 0.45)",
                },
              },
            }}
          >
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
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
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CircularProgress sx={{ color: palette.primary }} />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="error" variant="h6">
                        {error}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, idx) => (
                    <TableRow
                      key={user.id}
                      sx={{
                        "&:nth-of-type(even)": {
                          backgroundColor: "rgba(184, 92, 56, 0.04)",
                        },
                        "&:hover": {
                          backgroundColor: "rgba(184, 92, 56, 0.12)",
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
                      <TableCell sx={{ fontWeight: 600, color: palette.primary }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          sx={{ color: "#2c3e50" }}
                        >
                          {user.full_name || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                          {user.position || "N/A"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatRole(user.role)}
                          color={getRoleColor(user.role)}
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
                        <Chip
                          label={user.isActive ? "Active" : "Inactive"}
                          color={getStatusColor(user.isActive)}
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
                        <Box display="flex" gap={0.5}>
                          <Tooltip title="View User Details" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleViewUser(user)}
                              sx={{
                                color: palette.accent,
                                backgroundColor: "rgba(107, 78, 61, 0.12)",
                                "&:hover": {
                                  backgroundColor: "rgba(107, 78, 61, 0.2)",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                                borderRadius: 2,
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                              <Tooltip title="Edit User" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditUser(user)}
                                  sx={{
                                  color: palette.primary,
                                  backgroundColor: "rgba(184, 92, 56, 0.12)",
                                    "&:hover": {
                                    backgroundColor: "rgba(184, 92, 56, 0.2)",
                                      transform: "scale(1.1)",
                                    },
                                    transition: "all 0.2s ease",
                                    borderRadius: 2,
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete User" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteUser(user)}
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
            count={totalUsers}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderTop: `1px solid ${palette.border}`,
              "& .MuiTablePagination-toolbar": {
                color: palette.accent,
                fontWeight: 600,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: palette.text,
                  fontWeight: 600,
                },
            }}
          />
        </Box>

        {/* User Dialog */}
        <Dialog
          open={openViewDialog || openEditDialog || openCreateDialog}
          onClose={() => {
            setOpenViewDialog(false);
            setOpenEditDialog(false);
            setOpenCreateDialog(false);
            setSelectedUser(null);
            setShowPassword(false);
            setUserForm({
              full_name: "",
              email: "",
              phone: "",
              position: "",
              description: "",
              role: "admin",
              password: "",
              profile_picture: null,
              profile_picture_preview: "",
              profile_picture_path: "",
              isActive: true,
              whatsapp_link: "",
              google_link: "",
              twitter_link: "",
              facebook_link: "",
            });
          }}
          maxWidth="sm"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 4,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              maxHeight: "85vh",
              background: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${palette.border}`,
              overflow: "hidden",
            },
            "& .MuiBackdrop-root": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
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
            <AdminIcon sx={{ position: "relative", zIndex: 1, fontSize: 28 }} />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {openViewDialog
                  ? "User Details"
                  : openEditDialog
                  ? "Edit User"
                  : "Create New Admin"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {openViewDialog
                  ? "View user information"
                  : openEditDialog
                  ? "Update user details"
                  : "Add a new admin to the system"}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent
            sx={{ p: 3, pt: 3, maxHeight: "70vh", overflowY: "auto" }}
          >
            {openViewDialog ? (
              // View User Details
              <Box>
                <Box
                  sx={{
                  background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
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
                      {selectedUser?.full_name || "N/A"}
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
                      {selectedUser?.email}
                    </Typography>
                  </Box>
                </Box>

                {/* Profile Picture Display */}
                {selectedUser?.profile_image && (
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, color: "#2c3e50", fontWeight: 600 }}
                    >
                      Profile Picture
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                            backgroundColor: "rgba(184, 92, 56, 0.1)",
                        borderRadius: 2,
                            border: `2px solid ${palette.border}`,
                        cursor: "pointer",
                        transition: "transform 0.2s ease-in-out",
                        display: "inline-block",
                        "&:hover": {
                          transform: "scale(1.02)",
                        },
                      }}
                      onClick={() => {
                        const fullImageUrl = buildImageUrl(
                          selectedUser.profile_image
                        );
                        window.open(fullImageUrl, "_blank");
                      }}
                    >
                      <Box
                        component="img"
                        src={buildImageUrl(selectedUser.profile_image)}
                        alt="Profile Picture"
                        sx={{
                          width: 150,
                          height: 150,
                          objectFit: "cover",
                          borderRadius: "50%",
                          border: `4px solid ${palette.primary}`,
                          boxShadow: "0 8px 25px rgba(184, 92, 56, 0.28)",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                      <Box
                        textAlign="center"
                        sx={{
                          display: "none",
                          width: 150,
                          height: 150,
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(184, 92, 56, 0.12)",
                          borderRadius: "50%",
                          border: `4px solid ${palette.primary}`,
                        }}
                      >
                        <PersonIcon
                          sx={{
                            fontSize: 48,
                            color: palette.primary,
                            mb: 1,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: palette.primary,
                            display: "block",
                            wordBreak: "break-word",
                            textAlign: "center",
                          }}
                        >
                          Profile Picture
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

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
                      <PersonIcon sx={{ fontSize: 24, color: palette.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          ROLE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {formatRole(selectedUser?.role)}
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
                      <PhoneIcon sx={{ fontSize: 24, color: palette.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          PHONE
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {selectedUser?.phone || "N/A"}
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
                      <CheckCircle sx={{ fontSize: 24, color: palette.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          STATUS
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {selectedUser?.isActive ? "Active" : "Inactive"}
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
                      <Schedule sx={{ fontSize: 24, color: palette.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "#7f8c8d" }}>
                          LAST LOGIN
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                          {selectedUser?.lastLogin
                            ? new Date(
                                selectedUser.lastLogin
                              ).toLocaleDateString()
                            : "Never"}
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Stack>

                {/* Additional Info Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2, color: "#2c3e50" }}
                  >
                    Additional Information
                  </Typography>
                  <Stack spacing={2}>
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
                      <Typography
                        variant="body2"
                        sx={{ color: "#7f8c8d", mb: 0.5 }}
                      >
                        <strong>Position:</strong>{" "}
                        {selectedUser?.position || "N/A"}
                      </Typography>
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
                      <Typography
                        variant="body2"
                        sx={{ color: "#7f8c8d", mb: 0.5 }}
                      >
                        <strong>Description:</strong>{" "}
                        {selectedUser?.description || "N/A"}
                      </Typography>
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
                      <Typography
                        variant="body2"
                        sx={{ color: "#7f8c8d", mb: 0.5 }}
                      >
                        <strong>Created:</strong>{" "}
                        {selectedUser?.createdAt
                          ? new Date(
                              selectedUser.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
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
                      <Typography
                        variant="body2"
                        sx={{ color: "#7f8c8d", mb: 0.5 }}
                      >
                        <strong>Last Updated:</strong>{" "}
                        {selectedUser?.updatedAt
                          ? new Date(
                              selectedUser.updatedAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </Typography>
                    </Card>
                  </Stack>
                </Box>

                {/* Social Media Links Section */}
                {(selectedUser?.whatsapp_link || selectedUser?.google_link || selectedUser?.twitter_link || selectedUser?.facebook_link) && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 2, color: "#2c3e50" }}
                    >
                      Social Media Links
                    </Typography>
                    <Stack spacing={2}>
                      {selectedUser?.whatsapp_link && (
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
                          <Typography
                            variant="body2"
                            sx={{ color: "#7f8c8d", mb: 0.5 }}
                          >
                            <strong>WhatsApp:</strong>{" "}
                            <a href={selectedUser.whatsapp_link} target="_blank" rel="noopener noreferrer" style={{ color: "#25D366" }}>
                              {selectedUser.whatsapp_link}
                            </a>
                          </Typography>
                        </Card>
                      )}
                      {selectedUser?.google_link && (
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
                          <Typography
                            variant="body2"
                            sx={{ color: "#7f8c8d", mb: 0.5 }}
                          >
                            <strong>Google:</strong>{" "}
                            <a href={selectedUser.google_link} target="_blank" rel="noopener noreferrer" style={{ color: "#4285F4" }}>
                              {selectedUser.google_link}
                            </a>
                          </Typography>
                        </Card>
                      )}
                      {selectedUser?.twitter_link && (
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
                          <Typography
                            variant="body2"
                            sx={{ color: "#7f8c8d", mb: 0.5 }}
                          >
                            <strong>Twitter:</strong>{" "}
                            <a href={selectedUser.twitter_link} target="_blank" rel="noopener noreferrer" style={{ color: "#1DA1F2" }}>
                              {selectedUser.twitter_link}
                            </a>
                          </Typography>
                        </Card>
                      )}
                      {selectedUser?.facebook_link && (
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
                          <Typography
                            variant="body2"
                            sx={{ color: "#7f8c8d", mb: 0.5 }}
                          >
                            <strong>Facebook:</strong>{" "}
                            <a href={selectedUser.facebook_link} target="_blank" rel="noopener noreferrer" style={{ color: "#1877F2" }}>
                              {selectedUser.facebook_link}
                            </a>
                          </Typography>
                        </Card>
                      )}
                    </Stack>
                  </Box>
                )}
              </Box>
            ) : (
              // Create/Edit User Form
              <Box
                component="form"
                noValidate
                sx={{ maxHeight: "45vh", overflowY: "auto", pb: 2 }}
              >
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        label="Full Name"
                    value={userForm.full_name}
                        onChange={(e) =>
                      setUserForm({ ...userForm, full_name: e.target.value })
                        }
                        required
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) =>
                          setUserForm({ ...userForm, email: e.target.value })
                        }
                        required
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Phone"
                        value={userForm.phone}
                        onChange={(e) =>
                          setUserForm({ ...userForm, phone: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                    label="Position"
                    value={userForm.position}
                        onChange={(e) =>
                      setUserForm({ ...userForm, position: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Description"
                        value={userForm.description}
                        onChange={(e) =>
                          setUserForm({ ...userForm, description: e.target.value })
                        }
                        variant="outlined"
                        size="small"
                        multiline
                        rows={3}
                      />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      Profile Picture
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id="profile-picture-upload"
                      type="file"
                      onChange={handleProfilePictureChange}
                    />
                    <label htmlFor="profile-picture-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PersonIcon />}
                        sx={{
                          mb: 2,
                          borderColor: palette.primary,
                          color: palette.primary,
                          "&:hover": {
                          borderColor: palette.primaryDark,
                            backgroundColor: "rgba(184, 92, 56, 0.1)",
                          },
                        }}
                      >
                        {userForm.profile_picture_preview
                          ? "Change Profile Picture"
                          : "Choose Profile Picture"}
                      </Button>
                    </label>
                    {userForm.profile_picture_preview && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Preview:
                        </Typography>
                        <Box
                          component="img"
                          src={userForm.profile_picture_preview}
                          alt="Profile preview"
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "2px solid #e0e0e0",
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={userForm.role}
                        onChange={(e) =>
                          setUserForm({ ...userForm, role: e.target.value })
                        }
                        label="Role"
                      >
                      <MenuItem value="super-admin">Super Admin</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="regular user">Regular User</MenuItem>
                      </Select>
                    </FormControl>
                  {openCreateDialog && (
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm({ ...userForm, password: e.target.value })
                      }
                      required
                      variant="outlined"
                      size="small"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userForm.isActive}
                        onChange={(e) =>
                          setUserForm({
                            ...userForm,
                            isActive: e.target.checked,
                          })
                        }
                        size="small"
                      />
                    }
                    label="Active User"
                  />
                  <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: "#2c3e50" }}>
                    Social Media Links (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    label="WhatsApp Link"
                    value={userForm.whatsapp_link}
                    onChange={(e) =>
                      setUserForm({ ...userForm, whatsapp_link: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="https://wa.me/..."
                  />
                  <TextField
                    fullWidth
                    label="Google Link"
                    value={userForm.google_link}
                    onChange={(e) =>
                      setUserForm({ ...userForm, google_link: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="https://google.com/..."
                  />
                  <TextField
                    fullWidth
                    label="Twitter Link"
                    value={userForm.twitter_link}
                    onChange={(e) =>
                      setUserForm({ ...userForm, twitter_link: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="https://twitter.com/..."
                  />
                  <TextField
                    fullWidth
                    label="Facebook Link"
                    value={userForm.facebook_link}
                    onChange={(e) =>
                      setUserForm({ ...userForm, facebook_link: e.target.value })
                    }
                    variant="outlined"
                    size="small"
                    placeholder="https://facebook.com/..."
                    sx={{ mb: 1.5 }}
                  />
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
                setOpenEditDialog(false);
                setOpenCreateDialog(false);
                setSelectedUser(null);
                setShowPassword(false);
                setUserForm({
                  full_name: "",
                  email: "",
                  phone: "",
                  position: "",
                  description: "",
                  role: "admin",
                  password: "",
                  profile_picture: null,
                  profile_picture_preview: "",
                  profile_picture_path: "",
                  isActive: true,
                  whatsapp_link: "",
                  google_link: "",
                  twitter_link: "",
                  facebook_link: "",
                });
              }}
              variant="outlined"
              sx={{
                borderColor: palette.primary,
                color: palette.primary,
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: palette.primaryDark,
                  backgroundColor: "rgba(184, 92, 56, 0.08)",
                },
              }}
            >
              {openViewDialog ? "Close" : "Cancel"}
            </Button>
            {(openEditDialog || openCreateDialog) && (
              <Button
                onClick={openEditDialog ? handleUpdateUser : handleCreateUser}
                variant="contained"
                startIcon={
                  isCreating || isUpdating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{
                  background:
                    `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 4px 15px rgba(184, 92, 56, 0.3)",
                  "&:hover": {
                    background:
                      `linear-gradient(135deg, ${palette.primaryDark} 0%, ${palette.primary} 100%)`,
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(184, 92, 56, 0.35)",
                  },
                  "&:disabled": {
                    background: "rgba(184, 92, 56, 0.25)",
                    color: "rgba(255, 255, 255, 0.6)",
                  },
                  transition: "all 0.3s ease",
                }}
                disabled={
                  !userForm.full_name ||
                      !userForm.email ||
                      (openCreateDialog && !userForm.password) ||
                      isCreating ||
                      isUpdating
                }
              >
                {isCreating
                  ? "Creating..."
                  : isUpdating
                  ? "Updating..."
                  : openEditDialog
                  ? "Update User"
                  : "Create Admin"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default UsersTable;
