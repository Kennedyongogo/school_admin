import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  InputLabel,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import StudentSelectCards from "./StudentSelectCards";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

function profileImageUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function rowToEditForm(row) {
  const u = row?.user || {};
  return {
    student_ids: Array.isArray(row?.student_ids) ? [...row.student_ids] : [],
    occupation: row?.occupation ?? "",
    relationship: row?.relationship || "guardian",
    newsletter_subscription: row?.newsletter_subscription !== false,
    user_full_name: u.full_name ?? "",
    user_email: u.email ?? "",
    user_username: u.username ?? "",
    user_phone: u.phone ?? "",
    user_address: u.address ?? "",
  };
}

export default function HRParentsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(() => rowToEditForm({}));
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [studentsPicklist, setStudentsPicklist] = useState([]);
  const [editMetaLoading, setEditMetaLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const swalAboveDialog = {
    didOpen: () => {
      const container = Swal.getContainer();
      if (container) container.style.zIndex = "2000";
    },
  };

  const fetchParents = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/parents?${params.toString()}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load parents (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
    } catch (e) {
      const msg = e.message || "Failed to load parent profiles.";
      setError(msg);
      setRows([]);
      setTotalCount(0);
      void Swal.fire({ icon: "error", title: "Could not load parents", text: msg, confirmButtonColor: accent });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const loadEditStudents = useCallback(async (forRow) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setEditMetaLoading(true);
    try {
      const res = await fetch("/api/parents/students-without-parent", { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      const available = res.ok && json.success && Array.isArray(json.data) ? json.data : [];
      const merged = [...available];
      if (forRow?.students?.length) {
        for (const s of forRow.students) {
          if (s?.id && !merged.some((x) => x.id === s.id)) merged.push(s);
        }
      }
      setStudentsPicklist(merged);
    } catch {
      setStudentsPicklist(forRow?.students || []);
    } finally {
      setEditMetaLoading(false);
    }
  }, []);

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm(rowToEditForm(row));
    setEditError(null);
    loadEditStudents(row);
  };

  const handleSaveEdit = async () => {
    if (!editRow?.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setEditError("Please sign in again.");
      return;
    }
    if (!editForm.student_ids?.length) {
      setEditError("Select at least one linked student.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const body = {
        student_ids: editForm.student_ids,
        occupation: editForm.occupation?.trim() || null,
        relationship: editForm.relationship,
        newsletter_subscription: editForm.newsletter_subscription,
        user: {
          full_name: editForm.user_full_name?.trim() || undefined,
          email: editForm.user_email?.trim() || undefined,
          username: editForm.user_username?.trim() || undefined,
          phone: editForm.user_phone?.trim() || undefined,
          address: editForm.user_address?.trim() || undefined,
        },
      };
      const res = await fetch(`/api/parents/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update parent profile.");
      }
      setEditRow(null);
      await Swal.fire({
        icon: "success",
        title: "Profile updated",
        text: "Parent profile was saved successfully.",
        confirmButtonColor: accent,
        timer: 2200,
        showConfirmButton: false,
        ...swalAboveDialog,
      });
      fetchParents();
    } catch (e) {
      const msg = e.message || "Update failed.";
      setEditError(msg);
      await Swal.fire({
        icon: "error",
        title: "Could not save",
        text: msg,
        confirmButtonColor: accent,
        ...swalAboveDialog,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({ icon: "error", title: "Session expired", text: "Please sign in again.", confirmButtonColor: accent });
      return;
    }
    const name = row.user?.full_name || row.user?.username || "this parent";
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove parent profile?",
      html: `This removes the <strong>parent profile</strong> for <strong>${name}</strong>. The user account with role Parent is kept and can be linked to a new profile later.`,
      showCancelButton: true,
      confirmButtonColor: accent,
      confirmButtonText: "Yes, remove profile",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/parents/${row.id}`, { method: "DELETE", headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not remove profile (${res.status})`);
      }
      await fetchParents();
      await Swal.fire({
        icon: "success",
        title: "Profile removed",
        text: data.message || "Parent profile was removed.",
        timer: 2200,
        showConfirmButton: false,
        confirmButtonColor: accent,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Could not remove profile",
        text: e.message || "Request failed.",
        confirmButtonColor: accent,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="flex-end"
        sx={{ mb: 2, width: "100%" }}
      >
        <TextField
          size="small"
          label="Search parents"
          placeholder="Name, email, student, relationship…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            minWidth: { xs: "100%", sm: 280 },
            maxWidth: { sm: 360 },
            mr: { sm: "auto" },
            "& .MuiInputBase-root": { height: 36, bgcolor: "#fff" },
          }}
        />
      </Stack>

      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

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
            overflowX: "auto",
          }}
        >
          <Table size="medium" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow
                sx={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                  "& .MuiTableCell-head": { color: "#fff", fontWeight: 700, borderBottom: "none" },
                }}
              >
                <TableCell width={48} align="center">
                  No.
                </TableCell>
                <TableCell width={56}>Photo</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell align="right" width={132}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No parents yet. Click Create parent profile to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const name = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = profileImageUrl(r.user?.profile_image);
                  const rowNo = page * rowsPerPage + idx + 1;
                  const relLabel =
                    RELATIONSHIPS.find((x) => x.value === r.relationship)?.label || r.relationship || "—";
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {rowNo}
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={photoSrc || undefined}
                          sx={{ width: 36, height: 36, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}
                        >
                          {!photoSrc ? name.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{name}</TableCell>
                      <TableCell>
                        {Array.isArray(r.students) && r.students.length
                          ? r.students
                              .map((s) => s.user?.full_name || s.admission_number)
                              .filter(Boolean)
                              .join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>{r.user?.email || "—"}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{relLabel}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => setViewRow(r)} sx={{ color: accentDark }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(r)} sx={{ color: accent }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove profile (keeps user account)">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Remove parent profile"
                              disabled={deletingId === r.id}
                              onClick={() => handleDeleteParent(r)}
                              sx={{ color: "error.main" }}
                            >
                              {deletingId === r.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
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

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6, bgcolor: "#fff5f5", borderBottom: `1px solid ${accentLight}` }}>
          Parent profile
          <IconButton aria-label="Close" onClick={() => setViewRow(null)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={2}>
              <Box sx={{ p: 2, borderRadius: 2, background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 100%)`, color: "#fff" }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={profileImageUrl(viewRow.user?.profile_image) || undefined}
                    sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }}
                  >
                    {!profileImageUrl(viewRow.user?.profile_image) ? (viewRow.user?.full_name || "?").charAt(0).toUpperCase() : null}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {viewRow.user?.full_name || viewRow.user?.username || "—"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.92 }}>
                      {viewRow.user?.email || "—"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Divider />
              <Stack spacing={1.2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Students
                  </Typography>
                  <Typography>
                    {Array.isArray(viewRow.students) && viewRow.students.length
                      ? viewRow.students.map((s) => s.user?.full_name || s.admission_number).filter(Boolean).join(", ")
                      : "—"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Relationship
                  </Typography>
                  <Typography sx={{ textTransform: "capitalize" }}>{viewRow.relationship || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    Occupation
                  </Typography>
                  <Typography>{viewRow.occupation || "—"}</Typography>
                </Box>
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewRow(null)}>Close</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}
            onClick={() => {
              if (viewRow) {
                const row = viewRow;
                setViewRow(null);
                openEdit(row);
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => !saving && setEditRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: "#fff5f5", borderBottom: `1px solid ${accentLight}` }}>
          Edit parent profile
        </DialogTitle>
        <DialogContent dividers>
          {editError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          ) : null}
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, mb: 1.5 }}>
                Linked students
              </Typography>
              {editMetaLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={28} sx={{ color: accent }} />
                </Box>
              ) : (
                <StudentSelectCards
                  students={studentsPicklist}
                  selectedIds={editForm.student_ids}
                  onChange={(ids) => setEditForm({ ...editForm, student_ids: ids })}
                  disabled={saving}
                />
              )}
            </Box>
            <TextField label="Full name" size="small" fullWidth value={editForm.user_full_name} onChange={(e) => setEditForm({ ...editForm, user_full_name: e.target.value })} />
            <TextField label="Email" size="small" fullWidth value={editForm.user_email} onChange={(e) => setEditForm({ ...editForm, user_email: e.target.value })} />
            <TextField label="Phone" size="small" fullWidth value={editForm.user_phone} onChange={(e) => setEditForm({ ...editForm, user_phone: e.target.value })} />
            <FormControl fullWidth size="small">
              <InputLabel id="edit-rel">Relationship</InputLabel>
              <Select labelId="edit-rel" label="Relationship" value={editForm.relationship} onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}>
                {RELATIONSHIPS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Occupation" size="small" fullWidth value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.newsletter_subscription}
                  onChange={(e) => setEditForm({ ...editForm, newsletter_subscription: e.target.checked })}
                />
              }
              label="Newsletter subscription"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button disabled={saving} onClick={() => setEditRow(null)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleSaveEdit} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
