import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { authJsonHeaders, fetchAllCurricula, truncateText, primaryRed, primaryDark, inputSx, actionIconSx } from "./curriculumShared";
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
} from "./curriculumUi";

const CurriculumClassesTab = forwardRef(function CurriculumClassesTab({ curriculumId, onCurriculumChange }, ref) {
  const [curriculaOptions, setCurriculaOptions] = useState([]);
  const [curriculaLoading, setCurriculaLoading] = useState(true);
  const [curriculaError, setCurriculaError] = useState(null);
  const curriculaLoadingRef = useRef(true);
  const curriculaErrorRef = useRef(null);

  useEffect(() => {
    curriculaLoadingRef.current = curriculaLoading;
  }, [curriculaLoading]);
  useEffect(() => {
    curriculaErrorRef.current = curriculaError;
  }, [curriculaError]);

  const [dialogCurriculumId, setDialogCurriculumId] = useState("");

  const [rows, setRows] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClasses, setTotalClasses] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    period: "",
    description: "",
    is_active: true,
  });

  const [viewRow, setViewRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    period: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCurriculaError("Please sign in again.");
        setCurriculaLoading(false);
        return;
      }
      setCurriculaLoading(true);
      setCurriculaError(null);
      try {
        const list = await fetchAllCurricula(token);
        if (!cancelled) setCurriculaOptions(list);
      } catch (e) {
        if (!cancelled) {
          setCurriculaError(e.message || "Failed to load curricula.");
          setCurriculaOptions([]);
        }
      } finally {
        if (!cancelled) setCurriculaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchClasses = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setClassesError("Please sign in again.");
      setRows([]);
      setTotalClasses(0);
      setLoadingClasses(false);
      return;
    }
    setLoadingClasses(true);
    setClassesError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      const res = await fetch(`/api/curricula/all-classes?${params}`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load classes (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalClasses(data.pagination?.total ?? 0);
    } catch (e) {
      setClassesError(e.message || "Failed to load classes.");
      setRows([]);
      setTotalClasses(0);
    } finally {
      setLoadingClasses(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const openCreate = useCallback(() => {
    setDialogCurriculumId(curriculumId || "");
    setForm({
      name: "",
      code: "",
      period: "",
      description: "",
      is_active: true,
    });
    setDialogOpen(true);
  }, [curriculumId]);

  useImperativeHandle(
    ref,
    () => ({
      openCreateDialog() {
        if (curriculaLoadingRef.current) {
          Swal.fire({ icon: "info", title: "Please wait", text: "Loading curricula…", timer: 1600, showConfirmButton: false });
          return;
        }
        if (curriculaErrorRef.current) {
          Swal.fire({ icon: "error", title: "Unavailable", text: "Fix curriculum loading errors before creating a class." });
          return;
        }
        openCreate();
      },
    }),
    [openCreate]
  );

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !dialogCurriculumId) {
      if (!dialogCurriculumId) {
        Swal.fire({ icon: "warning", title: "Required", text: "Select which curriculum this class belongs to." });
      }
      return;
    }
    const name = form.name.trim();
    const code = form.code.trim();
    if (!name || !code) {
      Swal.fire({ icon: "warning", title: "Required", text: "Name and code are required." });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name,
        code,
        description: form.description.trim() || undefined,
        is_active: form.is_active,
      };
      const periodTrim = form.period.trim();
      if (periodTrim) body.period = periodTrim.slice(0, 120);
      const res = await fetch(`/api/curricula/${dialogCurriculumId}/classes`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Create failed");
      }
      setDialogOpen(false);
      await Swal.fire({ icon: "success", title: "Class created", timer: 1400, showConfirmButton: false });
      if (dialogCurriculumId && dialogCurriculumId !== curriculumId) {
        onCurriculumChange(dialogCurriculumId);
      }
      fetchClasses();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({
      name: row.name || "",
      code: row.code || "",
      period: row.period?.trim() ? row.period.trim() : "",
      description: row.description || "",
      is_active: !!row.is_active,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editRow?.id || !editRow?.curriculum_id) return;
    const name = editForm.name.trim();
    const code = editForm.code.trim();
    if (!name || !code) {
      Swal.fire({ icon: "warning", title: "Required", text: "Name and code are required." });
      return;
    }
    setEditSaving(true);
    try {
      const body = {
        name,
        code,
        description: editForm.description.trim() || null,
        is_active: editForm.is_active,
      };
      const periodTrim = editForm.period.trim();
      body.period = periodTrim === "" ? null : periodTrim.slice(0, 120);
      const res = await fetch(`/api/curricula/${editRow.curriculum_id}/classes/${editRow.id}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }
      setEditOpen(false);
      await Swal.fire({ icon: "success", title: "Saved", timer: 1400, showConfirmButton: false });
      fetchClasses();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const token = localStorage.getItem("token");
    const cid = row.curriculum_id;
    if (!token || !cid) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete class?",
      text: `${row.name} (${row.code})`,
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/curricula/${cid}/classes/${row.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
      fetchClasses();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  };

  const tableColSpan = 6;
  const actionsWidth = 132;

  return (
    <>
      {curriculaError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setCurriculaError(null)}>
          {curriculaError} Create class may be unavailable until this is resolved.
        </Alert>
      )}

      <TabPanelShell loading={loadingClasses} error={classesError} onDismissError={() => setClassesError(null)}>
        {!loadingClasses && (
          <DataTableShell
            pagination={
              <TablePagination
                component="div"
                count={totalClasses}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Rows per page"
                sx={tablePaginationSx}
              />
            }
          >
            <Table size="medium" sx={{ minWidth: 620, tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell width={56}>No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right" sx={{ width: actionsWidth, minWidth: actionsWidth, whiteSpace: "nowrap" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <EmptyTableRow message="No classes yet. Use Create class in the header to add one." />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.code}</TableCell>
                      <TableCell sx={{ color: "text.secondary", maxWidth: 180 }}>{truncateText(r.period, 48)}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.is_active ? "Yes" : "No"}
                          size="small"
                          color={r.is_active ? "success" : "default"}
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          width: actionsWidth,
                          minWidth: actionsWidth,
                          whiteSpace: "nowrap",
                          verticalAlign: "middle",
                          py: 0.5,
                        }}
                      >
                        <Tooltip title="View">
                          <IconButton size="small" aria-label="View class" onClick={() => setViewRow(r)} sx={actionIconSx}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit class" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            aria-label="Delete class"
                            onClick={() => handleDelete(r)}
                            sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </TabPanelShell>

      <PremiumDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="New class"
        subtitle="Add a class to a curriculum"
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
        <Stack spacing={2}>
          <FormControl fullWidth required sx={inputSx} disabled={curriculaLoading}>
            <InputLabel id="dlg-class-curriculum-label">Curriculum</InputLabel>
            <Select
              labelId="dlg-class-curriculum-label"
              label="Curriculum"
              value={dialogCurriculumId}
              onChange={(e) => setDialogCurriculumId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select curriculum</em>
              </MenuItem>
              {curriculaOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.type ? ` — ${c.type}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Code" fullWidth required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} helperText="Unique within this curriculum" sx={inputSx} />
          <TextField
            label="Period"
            fullWidth
            value={form.period}
            onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            helperText='Optional — e.g. "1 academic year", "2 terms"'
            inputProps={{ maxLength: 120 }}
            sx={inputSx}
          />
          <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={form.is_active ? "Active" : "Inactive"}
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              color={form.is_active ? "success" : "default"}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Typography variant="body2" color="text.secondary">
              Click to toggle
            </Typography>
          </Stack>
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.name || "Class details"}
        subtitle="Class overview"
        icon={<SchoolIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>
            {viewRow ? (
              <DialogPrimaryButton startIcon={<EditIcon />} onClick={() => { setViewRow(null); openEdit(viewRow); }}>
                Edit
              </DialogPrimaryButton>
            ) : null}
          </>
        }
      >
        {viewRow ? (
          <Stack spacing={1.5}>
            <DetailField label="Curriculum" value={viewRow.curriculum?.name} />
            <DetailField label="Name" value={viewRow.name} />
            <DetailField label="Code" value={viewRow.code} />
            <DetailField label="Period" value={viewRow.period?.trim() ? viewRow.period.trim() : "—"} />
            <DetailField label="Description" value={truncateText(viewRow.description, 400)} />
            <Box>
              <Chip label={viewRow.is_active ? "Yes" : "No"} size="small" color={viewRow.is_active ? "success" : "default"} sx={{ width: "fit-content", fontWeight: 600 }} />
            </Box>
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit class"
        subtitle="Update class details"
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
        <Stack spacing={2}>
          <TextField label="Curriculum" fullWidth value={editRow?.curriculum?.name || ""} disabled sx={inputSx} />
          <TextField label="Name" fullWidth required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Code" fullWidth required value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} helperText="Unique within this curriculum" sx={inputSx} />
          <TextField
            label="Period"
            fullWidth
            value={editForm.period}
            onChange={(e) => setEditForm((f) => ({ ...f, period: e.target.value }))}
            helperText='Optional — e.g. "1 academic year"'
            inputProps={{ maxLength: 120 }}
            sx={inputSx}
          />
          <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={editForm.is_active ? "Active" : "Inactive"}
              onClick={() => !editSaving && setEditForm((f) => ({ ...f, is_active: !f.is_active }))}
              color={editForm.is_active ? "success" : "default"}
              sx={{ fontWeight: 600, cursor: editSaving ? "default" : "pointer" }}
            />
            <Typography variant="body2" color="text.secondary">
              Click to toggle
            </Typography>
          </Stack>
        </Stack>
      </PremiumDialog>
    </>
  );
});

export default CurriculumClassesTab;
