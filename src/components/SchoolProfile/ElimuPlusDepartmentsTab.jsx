import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  TablePagination,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
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

async function fetchAllPages(path, token) {
  const out = [];
  let pageNum = 1;
  let totalPages = 1;
  do {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${path}${sep}page=${pageNum}&limit=100`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !Array.isArray(data.data)) break;
    out.push(...data.data);
    totalPages = data.pagination?.totalPages ?? 1;
    pageNum += 1;
    if (pageNum > 50) break;
  } while (pageNum <= totalPages);
  return out;
}

function teacherOptionLabel(t) {
  const u = t?.user || {};
  const name = u.full_name || u.username || "Teacher";
  return `${name} (${t?.employee_number || "—"})`;
}

function rowHodLabel(row) {
  return row?.HOD?.user?.full_name || row?.HOD?.user?.username || "—";
}

const emptyDeptForm = () => ({
  name: "",
  code: "",
  description: "",
  email: "",
  phone: "",
  room_location: "",
  head_of_department: "",
});

const rowToEditForm = (row) => ({
  name: row?.name ?? "",
  code: row?.code ?? "",
  description: row?.description ?? "",
  email: row?.email ?? "",
  phone: row?.phone ?? "",
  room_location: row?.room_location ?? "",
  head_of_department: row?.head_of_department ?? "",
  is_active: !!row?.is_active,
});

const ElimuPlusDepartmentsTab = forwardRef(function ElimuPlusDepartmentsTab({ active }, ref) {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyDeptForm());
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(rowToEditForm({}));
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const [teachers, setTeachers] = useState([]);

  const fetchDepartments = useCallback(
    async (opts = {}) => {
      const pageIdx = opts.page !== undefined ? opts.page : page;
      const limitVal = opts.limit !== undefined ? opts.limit : rowsPerPage;
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/departments?page=${pageIdx + 1}&limit=${limitVal}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load departments (${res.status})`);
        }
        const list = Array.isArray(data.data) ? data.data : [];
        const pagination = data.pagination || {};
        const total = pagination.total ?? list.length;
        const tp = Math.max(1, pagination.totalPages ?? 1);
        setRows(list);
        setTotalCount(total);
        const lastIdx = tp - 1;
        if (list.length === 0 && total > 0 && pageIdx > lastIdx) {
          setPage(lastIdx);
        }
      } catch (e) {
        setError(e.message || "Failed to load departments.");
        setRows([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage]
  );

  useEffect(() => {
    if (active) fetchDepartments();
  }, [active, fetchDepartments]);

  useEffect(() => {
    if (!active) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAllPages("/api/teachers", token);
        const arr = Array.isArray(list) ? list : [];
        arr.sort((a, b) => teacherOptionLabel(a).localeCompare(teacherOptionLabel(b), undefined, { sensitivity: "base" }));
        if (!cancelled) setTeachers(arr);
      } catch {
        if (!cancelled) setTeachers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  const openCreateDialog = useCallback(() => {
    setForm(emptyDeptForm());
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openCreateDialog }), [openCreateDialog]);

  const openView = (row) => {
    setViewRow(row);
    setViewOpen(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm(rowToEditForm(row));
    setEditError(null);
    setEditOpen(true);
  };

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDialogError("Please sign in again.");
      return;
    }
    if (!form.name?.trim() || !form.code?.trim()) {
      setDialogError("Name and code are required.");
      return;
    }
    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description?.trim() || null,
          email: form.email?.trim() || null,
          phone: form.phone?.trim() || null,
          room_location: form.room_location?.trim() || null,
          head_of_department: form.head_of_department?.trim() || null,
          is_active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create department.");
      }
      setDialogOpen(false);
      setPage(0);
      await fetchDepartments({ page: 0, limit: rowsPerPage });
      await Swal.fire({
        icon: "success",
        title: "Department added",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      setDialogError(e.message || "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editRow?.id) {
      setEditError("Please sign in again.");
      return;
    }
    if (!editForm.name?.trim() || !editForm.code?.trim()) {
      setEditError("Name and code are required.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/departments/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({
          name: editForm.name.trim(),
          code: editForm.code.trim().toUpperCase(),
          description: editForm.description?.trim() || null,
          email: editForm.email?.trim() || null,
          phone: editForm.phone?.trim() || null,
          room_location: editForm.room_location?.trim() || null,
          head_of_department: editForm.head_of_department?.trim() || null,
          is_active: !!editForm.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update department.");
      }
      setEditOpen(false);
      setEditRow(null);
      await fetchDepartments();
      await Swal.fire({ icon: "success", title: "Saved", timer: 1400, showConfirmButton: false });
    } catch (e) {
      setEditError(e.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete department?",
      text: row?.name ? `"${row.name}" will be removed.` : undefined,
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!ok.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/departments/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed.");
      }
      await fetchDepartments();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Delete failed" });
    }
  };

  if (!active) return null;

  const hodName = viewRow?.HOD?.user?.full_name || viewRow?.HOD?.user?.username || "—";

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
                <TableCell width={72}>No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Head</TableCell>
                <TableCell align="right" width={160}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No departments yet. Use Add department in the header.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", maxWidth: 220 }} noWrap title={rowHodLabel(r)}>
                      {rowHodLabel(r)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" aria-label="View department" onClick={() => openView(r)} sx={{ color: accentDark }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label="Edit department" onClick={() => openEdit(r)} sx={{ color: accentDark }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" aria-label="Delete department" onClick={() => handleDelete(r)} sx={{ color: accent }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          New department
          <IconButton aria-label="Close" onClick={() => !saving && setDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField label="Name" required fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField
              label="Code"
              required
              fullWidth
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              helperText="Short unique code (e.g. SCI)"
            />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField label="Email" fullWidth type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Room / location" fullWidth value={form.room_location} onChange={(e) => setForm({ ...form, room_location: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel id="dept-create-hod-label">Head of department</InputLabel>
              <Select
                labelId="dept-create-hod-label"
                label="Head of department"
                value={form.head_of_department || ""}
                onChange={(e) => setForm({ ...form, head_of_department: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {teacherOptionLabel(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => !saving && setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleCreateSubmit} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          {viewRow?.name || "Department"}
          <IconButton aria-label="Close" onClick={() => setViewOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Code
                </Typography>
                <Typography fontWeight={600}>{viewRow.code || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Description
                </Typography>
                <Typography>{viewRow.description?.trim() ? viewRow.description : "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Email / Phone
                </Typography>
                <Typography>{[viewRow.email, viewRow.phone].filter(Boolean).join(" · ") || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Room / location
                </Typography>
                <Typography>{viewRow.room_location || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: "block", mb: 0.5 }}>
                  Status
                </Typography>
                <Chip size="small" label={viewRow.is_active ? "Active" : "Inactive"} color={viewRow.is_active ? "success" : "default"} sx={{ fontWeight: 600 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Head of department
                </Typography>
                <Typography>{hodName}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setViewOpen(false)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
          {viewRow && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                setViewOpen(false);
                openEdit(viewRow);
              }}
              sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          Edit department
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
            <TextField label="Name" required fullWidth value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <TextField label="Code" required fullWidth value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
            <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            <TextField label="Email" fullWidth type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField label="Phone" fullWidth value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField label="Room / location" fullWidth value={editForm.room_location} onChange={(e) => setEditForm({ ...editForm, room_location: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel id="dept-edit-hod-label">Head of department</InputLabel>
              <Select
                labelId="dept-edit-hod-label"
                label="Head of department"
                value={editForm.head_of_department || ""}
                onChange={(e) => setEditForm({ ...editForm, head_of_department: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {teacherOptionLabel(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel control={<Checkbox checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />} label="Active" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" disabled={editSaving} onClick={handleEditSubmit} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}>
            {editSaving ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default ElimuPlusDepartmentsTab;
