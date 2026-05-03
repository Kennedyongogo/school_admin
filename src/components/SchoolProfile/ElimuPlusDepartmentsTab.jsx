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
} from "@mui/material";
import { Delete as DeleteIcon, Close as CloseIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const emptyDeptForm = () => ({
  name: "",
  code: "",
  description: "",
  email: "",
  phone: "",
  room_location: "",
});

const ElimuPlusDepartmentsTab = forwardRef(function ElimuPlusDepartmentsTab({ active }, ref) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyDeptForm());
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/departments", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load departments (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message || "Failed to load departments.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) fetchDepartments();
  }, [active, fetchDepartments]);

  const openCreateDialog = useCallback(() => {
    setForm(emptyDeptForm());
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  useImperativeHandle(ref, () => ({ openCreateDialog }), [openCreateDialog]);

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
          is_active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create department.");
      }
      setDialogOpen(false);
      await fetchDepartments();
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
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Room</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Contact</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right" width={56} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No departments yet. Use Add department in the header.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                    <TableCell>{r.code}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{r.room_location || "—"}</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                      {[r.email, r.phone].filter(Boolean).join(" · ") || "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Chip size="small" label={r.is_active ? "Active" : "Inactive"} color={r.is_active ? "success" : "default"} sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right">
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
    </Box>
  );
});

export default ElimuPlusDepartmentsTab;
