import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
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
import { authHeaders, inputSx, primaryRed, primaryDark, actionIconSx } from "./elimuPlusShared";
import {
  PremiumDialog,
  DetailField,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./elimuPlusUi";

const ICON_OPTIONS = [
  { key: "MenuBook", label: "Academic", Icon: MenuBookIcon },
  { key: "SportsSoccer", label: "Sports", Icon: SportsSoccerIcon },
  { key: "Science", label: "Science", Icon: ScienceIcon },
  { key: "Psychology", label: "Support", Icon: PsychologyIcon },
  { key: "DirectionsBus", label: "Transport", Icon: DirectionsBusIcon },
  { key: "Computer", label: "Digital", Icon: ComputerIcon },
  { key: "School", label: "School", Icon: SchoolIcon },
];

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
        sx={inputSx}
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
        sx={inputSx}
      />
      <FormControl fullWidth sx={inputSx}>
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
        sx={inputSx}
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
      confirmButtonColor: primaryRed,
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
                    <EmptyTableRow message="No services yet. Use Add service in the header." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const RowIcon = resolveIcon(r.icon_key);
                  return (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {page * rowsPerPage + idx + 1}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            bgcolor: `${primaryRed}14`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: primaryDark,
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
                          <IconButton size="small" aria-label="View service" onClick={() => openView(r)} sx={actionIconSx}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit service" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            aria-label="Delete service"
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
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="New service"
        subtitle="Add a programme or service for the public site"
        icon={<SchoolIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => !saving && setDialogOpen(false)} disabled={saving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={saving} onClick={handleCreateSubmit}>
              Create
            </DialogPrimaryButton>
          </>
        }
      >
        {dialogError ? <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{dialogError}</Alert> : null}
        <ServiceFormFields values={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} idPrefix="create" />
      </PremiumDialog>

      <PremiumDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={viewRow?.name || "Service"}
        subtitle="Service overview"
        icon={<ViewIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => setViewOpen(false)}>Close</DialogGhostButton>
            {viewRow ? (
              <DialogPrimaryButton
                startIcon={<EditIcon />}
                onClick={() => {
                  setViewOpen(false);
                  openEdit(viewRow);
                }}
              >
                Edit
              </DialogPrimaryButton>
            ) : null}
          </>
        }
      >
        {viewRow ? (
          <Stack spacing={1.5}>
            <DetailField label="Description" value={viewRow.description} />
            <DetailField label="Order" value={viewRow.sort_order} />
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit service"
        subtitle="Update service details"
        icon={<SchoolIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editSaving} onClick={handleEditSubmit}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        {editError ? <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{editError}</Alert> : null}
        <ServiceFormFields values={editForm} onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))} idPrefix="edit" />
      </PremiumDialog>
    </TabPanelShell>
  );
});

export default ElimuPlusServicesTab;
