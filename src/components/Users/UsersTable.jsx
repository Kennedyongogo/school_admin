import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as ViewIcon,
  ToggleOn as ToggleOnIcon,
  Home as HomeIcon,
  Badge as BadgeIcon,
  Groups as GroupsIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  ALL_ROLES,
  ROLE_TABS,
  authJsonHeaders,
  formatRole,
  getActorFromStorage,
  assignableRoles,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textPrimary,
  textSecondary,
  textMuted,
  inputSx,
  primaryBtnSx,
  ghostBtnSx,
  pageShellSx,
} from "./usersShared";
import {
  UsersHero,
  RoleTabs,
  PremiumDialog,
  DetailField,
  UserAvatar,
  HeroActionButton,
  RoleBadge,
} from "./usersUi";

const emptyForm = () => ({
  username: "",
  email: "",
  password: "",
  full_name: "",
  phone: "",
  address: "",
  role: "admin",
});

async function downloadUsersImportTemplate(token) {
  const res = await fetch("/api/users/import-template", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users-import-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsersTable() {
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const actor = getActorFromStorage();
  const editableRoles = assignableRoles(actor?.role);
  const canEditRole = editableRoles.length > 0;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }

    const role = ROLE_TABS[activeTab]?.value;
    const params = new URLSearchParams({
      page: String(page + 1),
      limit: String(rowsPerPage),
    });
    if (role) params.set("role", role);

    try {
      const response = await fetch(`/api/users?${params.toString()}`, {
        method: "GET",
        headers: authJsonHeaders(token),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError(response.status === 404 ? "API endpoint not found. Is the server running?" : "Invalid response from server.");
        setUsers([]);
        setTotalUsers(0);
        return;
      }

      if (!response.ok) {
        setError(data.message || `Request failed (${response.status})`);
        setUsers([]);
        setTotalUsers(0);
        return;
      }

      if (data.success) {
        setUsers(Array.isArray(data.data) ? data.data : []);
        setTotalUsers(data.pagination?.total ?? 0);
      } else {
        setError(data.message || "Failed to load users.");
        setUsers([]);
        setTotalUsers(0);
      }
    } catch (e) {
      setError(e.message || "Network error.");
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, activeTab]);

  const handleDownloadTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    try {
      await downloadUsersImportTemplate(token);
    } catch (e) {
      setError(e.message || "Could not download template");
    }
  };

  const handleImportExcelChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/users/import-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Import failed (${res.status})`);
      }
      const { createdCount = 0, errorCount = 0, errors = [] } = data.data || {};
      const errLines =
        errors.length > 0
          ? `<ul style="text-align:left;margin:8px 0 0;padding-left:1.25rem">${errors
              .slice(0, 30)
              .map((errRow) => `<li>Row ${errRow.row}: ${errRow.message}</li>`)
              .join("")}${errors.length > 30 ? `<li>…and ${errors.length - 30} more</li>` : ""}</ul>`
          : "";
      await Swal.fire({
        icon: errorCount > 0 ? "warning" : "success",
        title: "Import finished",
        html: `<p><strong>${createdCount}</strong> user(s) created.<br/><strong>${errorCount}</strong> row(s) skipped.</p>${errLines}`,
        width: 560,
        confirmButtonColor: primaryRed,
      });
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const mapUserToForm = (u) => ({
    username: u.username ?? "",
    email: u.email ?? "",
    password: "",
    full_name: u.full_name ?? "",
    phone: u.phone ?? "",
    address: u.address ?? "",
    role: u.role ?? "admin",
  });

  const handleEditOpen = (user) => {
    setSelectedUser(user);
    setForm(mapUserToForm(user));
    setOpenEdit(true);
  };

  const handleViewOpen = (user) => {
    setSelectedUser(user);
    setOpenView(true);
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: "Delete user?",
      text: `Remove "${user.full_name}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      cancelButtonColor: "#78716C",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      await fetchUsers();
      Swal.fire({ icon: "success", title: "Deleted", text: "User removed successfully.", confirmButtonColor: primaryRed, timer: 1600, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: primaryRed });
    }
  };

  const handleToggleActive = async (user) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/users/${user.id}/toggle-status`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update status");
      }
      await fetchUsers();
      Swal.fire({
        icon: "success",
        title: user.is_active !== false ? "User deactivated" : "User activated",
        timer: 1400,
        showConfirmButton: false,
        confirmButtonColor: primaryRed,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: primaryRed });
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }
      if (form.role !== data.data?.role) {
        throw new Error(
          data.message ||
            "Role was not updated. Only a super admin can assign the super admin role."
        );
      }
      setOpenEdit(false);
      setSelectedUser(null);
      await fetchUsers();
      Swal.fire({ icon: "success", title: "User updated", text: "Changes saved successfully.", confirmButtonColor: primaryRed });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message, confirmButtonColor: primaryRed });
    } finally {
      setSaving(false);
    }
  };

  const closeDialogs = () => {
    setOpenView(false);
    setOpenEdit(false);
    setSelectedUser(null);
    setForm(emptyForm());
  };

  return (
    <Box sx={pageShellSx}>
      <UsersHero
        title="User management"
        subtitle="Create, import, and manage accounts across all roles"
        icon={<GroupsIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              hidden
              onChange={handleImportExcelChange}
            />
            <HeroActionButton
              startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              Import Excel
            </HeroActionButton>
            <HeroActionButton startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>
              Template
            </HeroActionButton>
            <HeroActionButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/users/create")}>
              Create user
            </HeroActionButton>
          </>
        }
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Chip
          icon={<AdminIcon sx={{ fontSize: "16px !important" }} />}
          label={`${totalUsers} user${totalUsers === 1 ? "" : "s"} in this view`}
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 700,
            bgcolor: "rgba(220,38,38,0.08)",
            color: primaryDark,
            border: `1px solid ${primaryLight}`,
          }}
        />
      </Box>

      <RoleTabs activeTab={activeTab} onChange={handleTabChange} tabs={ROLE_TABS} />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "14px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          borderRadius: "22px",
          overflow: "hidden",
          border: "1px solid rgba(220,38,38,0.08)",
          bgcolor: "#fff",
          boxShadow: "0 16px 48px -16px rgba(28,25,23,0.1)",
        }}
      >
        <TableContainer>
          <Table size="medium" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: warmCream,
                  "& .MuiTableCell-head": {
                    color: textSecondary,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    borderBottom: `1px solid ${primaryLight}`,
                    py: 1.75,
                  },
                }}
              >
                <TableCell width={56}>#</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: primaryRed }} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography sx={{ color: textSecondary, fontWeight: 600 }}>No users in this tab.</Typography>
                    <Button
                      variant="text"
                      startIcon={<AddIcon />}
                      onClick={() => navigate("/users/create")}
                      sx={{ mt: 1, color: primaryRed, fontWeight: 700, textTransform: "none" }}
                    >
                      Create first user
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((row, idx) => {
                  const active = row.is_active !== false;
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        transition: "background 0.15s ease",
                        "&:hover": { bgcolor: "rgba(254,226,226,0.35)" },
                        "& td": { borderColor: "rgba(220,38,38,0.06)" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: textMuted, fontSize: "0.85rem" }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <UserAvatar name={row.full_name} size={42} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: textPrimary, lineHeight: 1.25 }}>
                              {row.full_name || "—"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.78rem", color: textSecondary }}>{row.email}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={row.role} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={active ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: active ? "rgba(22,163,74,0.12)" : "rgba(28,25,23,0.06)",
                            color: active ? "#15803D" : textSecondary,
                            border: `1px solid ${active ? "rgba(22,163,74,0.25)" : "rgba(28,25,23,0.1)"}`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          {[
                            { title: "View", icon: <ViewIcon fontSize="small" />, onClick: () => handleViewOpen(row), color: textSecondary },
                            { title: "Edit", icon: <EditIcon fontSize="small" />, onClick: () => handleEditOpen(row), color: primaryRed },
                            { title: active ? "Deactivate" : "Activate", icon: <ToggleOnIcon fontSize="small" />, onClick: () => handleToggleActive(row), color: "#EA580C" },
                            { title: "Delete", icon: <DeleteIcon fontSize="small" />, onClick: () => handleDelete(row), color: primaryDark },
                          ].map((action) => (
                            <Tooltip key={action.title} title={action.title}>
                              <IconButton
                                size="small"
                                onClick={action.onClick}
                                sx={{
                                  color: action.color,
                                  bgcolor: "transparent",
                                  "&:hover": { bgcolor: warmCream },
                                }}
                              >
                                {action.icon}
                              </IconButton>
                            </Tooltip>
                          ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: `1px solid ${primaryLight}`,
            "& .MuiTablePagination-toolbar": { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
          }}
        />
      </Box>

      {/* View dialog */}
      <PremiumDialog
        open={openView}
        onClose={closeDialogs}
        title={selectedUser?.full_name || "User details"}
        subtitle="Account overview"
        icon={<PersonIcon />}
        footer={
          <Button onClick={closeDialogs} sx={ghostBtnSx}>
            Close
          </Button>
        }
      >
        {selectedUser && (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <UserAvatar name={selectedUser.full_name} size={56} />
              <Box>
                <RoleBadge role={selectedUser.role} />
                <Typography sx={{ fontSize: "0.8rem", color: textSecondary, mt: 0.75 }}>
                  {selectedUser.is_active !== false ? "Active account" : "Inactive account"}
                </Typography>
              </Box>
            </Stack>
            <DetailField icon={<PersonIcon fontSize="small" />} label="Full name" value={selectedUser.full_name} />
            <DetailField icon={<BadgeIcon fontSize="small" />} label="Username" value={selectedUser.username} />
            <DetailField icon={<EmailIcon fontSize="small" />} label="Email" value={selectedUser.email} />
            <DetailField icon={<PhoneIcon fontSize="small" />} label="Phone" value={selectedUser.phone} />
            <DetailField icon={<HomeIcon fontSize="small" />} label="Address" value={selectedUser.address} />
            <Box sx={{ p: 1.75, borderRadius: "14px", bgcolor: warmCream, border: `1px solid ${primaryLight}` }}>
              <Typography sx={{ fontSize: "0.75rem", color: textSecondary }}>
                Last login:{" "}
                <Box component="span" sx={{ fontWeight: 700, color: textPrimary }}>
                  {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Never"}
                </Box>
              </Typography>
            </Box>
          </Stack>
        )}
      </PremiumDialog>

      {/* Edit dialog */}
      <PremiumDialog
        open={openEdit}
        onClose={closeDialogs}
        title="Edit user"
        subtitle="Update account details and role"
        icon={<EditIcon />}
        footer={
          <>
            <Button onClick={closeDialogs} sx={ghostBtnSx}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleUpdate} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={primaryBtnSx}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField
            label="Username"
            fullWidth
            required
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon sx={{ color: primaryRed, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <TextField
            label="Email address"
            type="email"
            fullWidth
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: primaryRed, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <TextField
            label="Full name"
            fullWidth
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: primaryRed, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <TextField
            label="Phone"
            fullWidth
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon sx={{ color: primaryRed, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <TextField
            label="Address"
            fullWidth
            multiline
            minRows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                  <HomeIcon sx={{ color: primaryRed, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputSx}
          />
          <FormControl fullWidth sx={inputSx} disabled={!canEditRole}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {(canEditRole ? editableRoles : ALL_ROLES).map((r) => (
                <MenuItem key={r} value={r}>
                  {formatRole(r)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {!canEditRole ? (
            <Typography sx={{ fontSize: "0.78rem", color: textSecondary }}>
              Your account cannot change user roles.
            </Typography>
          ) : actor?.role !== "super_admin" ? (
            <Typography sx={{ fontSize: "0.78rem", color: textSecondary }}>
              Only a super admin can assign the super admin role.
            </Typography>
          ) : null}
          <Typography sx={{ fontSize: "0.78rem", color: textSecondary }}>
            Password changes are managed in Settings or via admin reset flows.
          </Typography>
        </Stack>
      </PremiumDialog>
    </Box>
  );
}
