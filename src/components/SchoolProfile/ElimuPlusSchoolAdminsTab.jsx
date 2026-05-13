import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const authMultipartHeaders = (token) => ({
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function profilePhotoUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

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
      confirmButtonColor: accent,
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
    <Box sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${accentLight}`,
            boxShadow: `0 8px 28px -12px ${accent}33`,
            bgcolor: "rgba(255,255,255,0.98)",
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow
                sx={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                  "& .MuiTableCell-head": { color: "#fff", fontWeight: 700, borderBottom: "none" },
                }}
              >
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
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No school admins yet. Use Create school admin in the header.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const displayName = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = profilePhotoUrl(r.profile_picture);
                  const adminTypeLabel = adminTypes.find((t) => t.value === r.admin_type)?.label || r.admin_type || "—";
                  return (
                    <TableRow key={r.id} hover>
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
                          sx={{ width: 40, height: 40, mx: "auto", bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}
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
                            sx={{ color: accentDark }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit admin" onClick={() => openEdit(r)} sx={{ color: accentDark }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete admin">
                          <IconButton size="small" aria-label="Delete admin" onClick={() => handleDelete(r)} sx={{ color: accent }}>
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
            sx={{
              borderTop: `1px solid ${accentLight}`,
              "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
            }}
          />
        </TableContainer>
      )}

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          Edit school admin
          <IconButton aria-label="Close" onClick={() => !editSaving && setEditOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={editPhotoPreview || profilePhotoUrl(editForm.profile_picture_url) || undefined}
                sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}
              >
                {!editPhotoPreview && !editForm.profile_picture_url ? "?" : null}
              </Avatar>
              <Button variant="outlined" component="label" sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                Choose photo
                <input type="file" accept="image/*" hidden onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)} />
              </Button>
              {(editPhotoFile || editForm.profile_picture_url) && (
                <Button size="small" onClick={() => { setEditPhotoFile(null); setEditForm({ ...editForm, profile_picture_url: "" }); }}>
                  Clear photo
                </Button>
              )}
            </Stack>
            <FormControl fullWidth required variant="outlined">
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
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" disabled={editSaving} onClick={saveEdit} sx={{ bgcolor: accent, fontWeight: 700 }}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}