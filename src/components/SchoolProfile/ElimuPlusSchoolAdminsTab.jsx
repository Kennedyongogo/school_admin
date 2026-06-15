import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Avatar,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authHeaders,
  authMultipartHeaders,
  resolveAssetUrl,
  inputSx,
  primaryRed,
  primaryDark,
  actionIconSx,
} from "./elimuPlusShared";
import {
  PremiumDialog,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./elimuPlusUi";

function rowToEditForm(row) {
  return {
    adminId: row.id,
    admin_type: row.admin_type ?? "",
    profile_picture_url: row.profile_picture ?? "",
  };
}

const adminTypes = [
  { value: "super_admin", label: "Super Admin" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin_staff", label: "Admin Staff" },
];

export default function ElimuPlusSchoolAdminsTab({ active }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(() => rowToEditForm({}));
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchSchoolAdmins = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/school-admins?page=${page + 1}&limit=${rowsPerPage}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load school admins (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
    } catch (e) {
      setError(e.message || "Failed to load school admins.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (active) fetchSchoolAdmins();
  }, [active, fetchSchoolAdmins]);

  useEffect(() => {
    if (!editPhotoFile) {
      setEditPhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(editPhotoFile);
    setEditPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editPhotoFile]);

  const openEdit = (row) => {
    setEditForm(rowToEditForm(row));
    setEditPhotoFile(null);
    setEditError(null);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setEditError("Please sign in again.");
      return;
    }
    if (!editForm.adminId || !editForm.admin_type) {
      setEditError("Admin type is required.");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append("admin_type", editForm.admin_type);
      if (editPhotoFile) fd.append("profile_picture", editPhotoFile);
      else fd.append("profile_picture", editForm.profile_picture_url ?? "");

      const res = await fetch(`/api/school-admins/${editForm.adminId}`, {
        method: "PUT",
        headers: authMultipartHeaders(token),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed.");
      }
      setEditOpen(false);
      await fetchSchoolAdmins();
      await Swal.fire({ icon: "success", title: "School admin updated", timer: 1400, showConfirmButton: false });
    } catch (e) {
      setEditError(e.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const name = row?.user?.full_name || row?.user?.username || "this admin";
    const ok = await Swal.fire({
      icon: "warning",
      title: "Remove school admin profile?",
      text: `The school admin profile for ${name} will be removed. Their login account stays — you can create a new profile for this user later.`,
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Remove profile",
    });
    if (!ok.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/school-admins/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed (school admin role may be required).");
      }
      await fetchSchoolAdmins();
      Swal.fire({ icon: "success", title: "Profile removed", timer: 1600, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Delete failed" });
    }
  };

  if (!active) return null;

  return (
    <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
      {!loading && (
        <DataTableShell
          pagination={
            <TablePagination
              component="div"
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Rows per page"
              sx={tablePaginationSx}
            />
          }
        >
          <Table size="medium">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell width={56}>No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Admin Type</TableCell>
                <TableCell align="center" width={72}>
                  Picture
                </TableCell>
                <TableCell align="right" width={132}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyTableRow message="No school admins yet. Use Create school admin in the header." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const displayName = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = resolveAssetUrl(r.profile_picture);
                  const adminTypeLabel = adminTypes.find((t) => t.value === r.admin_type)?.label || r.admin_type || "—";
                  return (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {displayName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {adminTypeLabel}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Avatar
                          src={photoSrc || undefined}
                          sx={{ width: 40, height: 40, mx: "auto", bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
                        >
                          {!photoSrc ? displayName.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View full profile">
                          <IconButton
                            size="small"
                            aria-label="View admin profile"
                            onClick={() => navigate(`/elimu-plus/school-admins/${r.id}`)}
                            sx={actionIconSx}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit admin" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete admin">
                          <IconButton
                            size="small"
                            aria-label="Delete admin"
                            onClick={() => handleDelete(r)}
                            sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      )}

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit school admin"
        subtitle="Update admin type and profile photo"
        icon={<AdminIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editSaving} onClick={saveEdit}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        {editError ? <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{editError}</Alert> : null}
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={editPhotoPreview || resolveAssetUrl(editForm.profile_picture_url) || undefined}
              sx={{ width: 72, height: 72, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
            >
              {!editPhotoPreview && !editForm.profile_picture_url ? "?" : null}
            </Avatar>
            <Button variant="outlined" component="label" sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
              Choose photo
              <input type="file" accept="image/*" hidden onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)} />
            </Button>
            {(editPhotoFile || editForm.profile_picture_url) && (
              <Button size="small" onClick={() => { setEditPhotoFile(null); setEditForm({ ...editForm, profile_picture_url: "" }); }}>
                Clear photo
              </Button>
            )}
          </Stack>
          <FormControl fullWidth required variant="outlined" sx={inputSx}>
            <InputLabel id="edit-admin-type-label">Admin type</InputLabel>
            <Select
              labelId="edit-admin-type-label"
              label="Admin type"
              value={editForm.admin_type}
              onChange={(e) => setEditForm({ ...editForm, admin_type: e.target.value })}
            >
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {adminTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </PremiumDialog>
    </TabPanelShell>
  );
}
