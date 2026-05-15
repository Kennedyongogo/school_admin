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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  TablePagination,
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
  MenuBook as MenuBookIcon,
  SportsSoccer as SportsSoccerIcon,
  Science as ScienceIcon,
  Psychology as PsychologyIcon,
  DirectionsBus as DirectionsBusIcon,
  Computer as ComputerIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const ICON_OPTIONS = [
  { key: "MenuBook", label: "Academic", Icon: MenuBookIcon },
  { key: "SportsSoccer", label: "Sports", Icon: SportsSoccerIcon },
  { key: "Science", label: "Science", Icon: ScienceIcon },
  { key: "Psychology", label: "Support", Icon: PsychologyIcon },
  { key: "DirectionsBus", label: "Transport", Icon: DirectionsBusIcon },
  { key: "Computer", label: "Digital", Icon: ComputerIcon },
  { key: "School", label: "School", Icon: SchoolIcon },
];

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function resolveIcon(iconKey) {
  const found = ICON_OPTIONS.find((o) => o.key === iconKey);
  return found?.Icon || SchoolIcon;
}

const emptyServiceForm = () => ({
  name: "",
  description: "",
  icon_key: "MenuBook",
  sort_order: 0,
});

const rowToEditForm = (row) => ({
  name: row?.name ?? "",
  description: row?.description ?? "",
  icon_key: row?.icon_key ?? "MenuBook",
  sort_order: row?.sort_order ?? 0,
});

function ServiceFormFields({ values, onChange, idPrefix }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Name"
        required
        fullWidth
        value={values.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <TextField
        label="Description"
        required
        fullWidth
        multiline
        minRows={3}
        value={values.description}
        onChange={(e) => onChange({ description: e.target.value })}
        helperText="Shown in the home page Programmes & services carousel"
      />
      <FormControl fullWidth>
        <InputLabel id={`${idPrefix}-icon`}>Icon</InputLabel>
        <Select
          labelId={`${idPrefix}-icon`}
          label="Icon"
          value={values.icon_key}
          onChange={(e) => onChange({ icon_key: e.target.value })}
          renderValue={(selected) => {
            const opt = ICON_OPTIONS.find((o) => o.key === selected);
            const Ico = opt?.Icon || SchoolIcon;
            return (
              <Stack direction="row" spacing={1} alignItems="center">
                <Ico fontSize="small" />
                <span>{opt?.label || selected}</span>
              </Stack>
            );
          }}
        >
          {ICON_OPTIONS.map((opt) => (
            <MenuItem key={opt.key} value={opt.key}>
              <Stack direction="row" spacing={1} alignItems="center">
                <opt.Icon fontSize="small" />
                <span>{opt.label}</span>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Order"
        type="number"
        fullWidth
        value={values.sort_order}
        onChange={(e) => onChange({ sort_order: e.target.value })}
        helperText="Lower numbers appear first in the carousel"
      />
    </Stack>
  );
}

const ElimuPlusServicesTab = forwardRef(function ElimuPlusServicesTab({ active }, ref) {
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyServiceForm());
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(rowToEditForm({}));
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const fetchServices = useCallback(
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
        const res = await fetch(`/api/school-services?page=${pageIdx + 1}&limit=${limitVal}`, {
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load services (${res.status})`);
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
        setError(e.message || "Failed to load services.");
        setRows([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage]
  );

  useEffect(() => {
    if (active) fetchServices();
  }, [active, fetchServices]);

  const openCreateDialog = useCallback(() => {
    setForm(emptyServiceForm());
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

  const buildPayload = (f) => ({
    name: f.name.trim(),
    description: f.description.trim(),
    icon_key: f.icon_key,
    sort_order: Number(f.sort_order) || 0,
  });

  const validate = (f, setErr) => {
    if (!f.name?.trim()) {
      setErr("Name is required.");
      return false;
    }
    if (!f.description?.trim()) {
      setErr("Description is required.");
      return false;
    }
    return true;
  };

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDialogError("Please sign in again.");
      return;
    }
    if (!validate(form, setDialogError)) return;

    setSaving(true);
    setDialogError(null);
    try {
      const res = await fetch("/api/school-services", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(buildPayload(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create service.");
      }
      setDialogOpen(false);
      setPage(0);
      await fetchServices({ page: 0, limit: rowsPerPage });
      await Swal.fire({
        icon: "success",
        title: "Service added",
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
    if (!validate(editForm, setEditError)) return;

    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/school-services/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(buildPayload(editForm)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update service.");
      }
      setEditOpen(false);
      setEditRow(null);
      await fetchServices();
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
      title: "Delete service?",
      text: row?.name ? `"${row.name}" will be removed from the public site.` : undefined,
      showCancelButton: true,
      confirmButtonColor: accent,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!ok.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/school-services/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed.");
      }
      await fetchServices();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Delete failed" });
    }
  };

  if (!active) return null;

  const ViewIcon = viewRow ? resolveIcon(viewRow.icon_key) : SchoolIcon;

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
                <TableCell width={56}>#</TableCell>
                <TableCell width={56}>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Description</TableCell>
                <TableCell width={90}>Order</TableCell>
                <TableCell align="right" width={160}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No services yet. Use Add service in the header.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const RowIcon = resolveIcon(r.icon_key);
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: `${accent}14`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: accentDark,
                          }}
                        >
                          <RowIcon fontSize="small" />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell
                        sx={{
                          display: { xs: "none", sm: "table-cell" },
                          color: "text.secondary",
                          maxWidth: 280,
                        }}
                      >
                        <Typography variant="body2" noWrap title={r.description}>
                          {r.description}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.sort_order}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" aria-label="View service" onClick={() => openView(r)} sx={{ color: accentDark }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit service" onClick={() => openEdit(r)} sx={{ color: accentDark }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" aria-label="Delete service" onClick={() => handleDelete(r)} sx={{ color: accent }}>
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

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          New service
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
          <ServiceFormFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} idPrefix="create" />
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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: `${accent}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accentDark,
              }}
            >
              <ViewIcon />
            </Box>
            <span>{viewRow?.name || "Service"}</span>
          </Stack>
          <IconButton aria-label="Close" onClick={() => setViewOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Description
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{viewRow.description || "—"}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  Order
                </Typography>
                <Typography fontWeight={600}>{viewRow.sort_order}</Typography>
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
          Edit service
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
          <ServiceFormFields values={editForm} onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))} idPrefix="edit" />
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

export default ElimuPlusServicesTab;
