import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

async function fetchAllCurricula(token) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula?${params}`, { headers: authJsonHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `Could not load curricula (${res.status})`);
    const chunk = Array.isArray(data.data) ? data.data : [];
    out.push(...chunk);
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

function truncate(text, max = 160) {
  if (!text || typeof text !== "string") return "—";
  const t = text.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

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

  const tableShell = (
    <TableContainer
      sx={{
        borderRadius: 2,
        overflow: "auto",
        border: `1px solid ${primaryLight}`,
        boxShadow: `0 8px 28px -12px ${primaryRed}33`,
        bgcolor: "rgba(255,255,255,0.98)",
      }}
    >
      <Table size="medium" sx={{ minWidth: 620, tableLayout: "fixed" }}>
        <TableHead>
          <TableRow
            sx={{
              background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
              "& .MuiTableCell-head": {
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                borderBottom: "none",
              },
            }}
          >
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
          {loadingClasses ? (
            <TableRow>
              <TableCell colSpan={tableColSpan} sx={{ borderBottom: "none" }}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress sx={{ color: primaryRed }} />
                </Box>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={tableColSpan}>
                <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  No classes yet. Use Create class in the header to add one.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r, idx) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ color: "text.secondary" }}>{page * rowsPerPage + idx + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{r.code}</TableCell>
                <TableCell sx={{ color: "text.secondary", maxWidth: 180 }}>{truncate(r.period, 48)}</TableCell>
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
                  <Box
                    sx={{
                      display: "inline-flex",
                      flexDirection: "row",
                      flexWrap: "nowrap",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 0,
                    }}
                  >
                    <Tooltip title="View">
                      <IconButton size="small" aria-label="View class" onClick={() => setViewRow(r)} sx={{ color: primaryDark, flexShrink: 0 }}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" aria-label="Edit class" onClick={() => openEdit(r)} sx={{ color: primaryRed, flexShrink: 0 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label="Delete class" onClick={() => handleDelete(r)} sx={{ color: primaryRed, flexShrink: 0 }}>
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
        sx={{
          borderTop: `1px solid ${primaryLight}`,
          "& .MuiTablePagination-toolbar": { fontWeight: 600 },
        }}
      />
    </TableContainer>
  );

  return (
    <>
      {curriculaError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setCurriculaError(null)}>
          {curriculaError} Create class may be unavailable until this is resolved.
        </Alert>
      )}

      <Stack spacing={2}>
        {classesError && (
          <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setClassesError(null)}>
            {classesError}
          </Alert>
        )}
        {tableShell}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          New class
          <IconButton onClick={() => setDialogOpen(false)} disabled={saving} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, overflow: "visible" }}>
          <Stack spacing={2}>
            <FormControl fullWidth required sx={{ mt: 0.5 }} disabled={curriculaLoading}>
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
            <TextField label="Name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Code" fullWidth required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} helperText="Unique within this curriculum" />
            <TextField
              label="Period"
              fullWidth
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
              helperText='Optional — e.g. "1 academic year", "2 terms"'
              inputProps={{ maxLength: 120 }}
            />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateSubmit} disabled={saving} sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          Class details
          <IconButton onClick={() => setViewRow(null)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          {viewRow && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Curriculum
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{viewRow.curriculum?.name || "—"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                Name
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{viewRow.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Code
              </Typography>
              <Typography>{viewRow.code}</Typography>
              <Typography variant="body2" color="text.secondary">
                Period
              </Typography>
              <Typography>{viewRow.period?.trim() ? viewRow.period.trim() : "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography>{truncate(viewRow.description, 400)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active
              </Typography>
              <Chip label={viewRow.is_active ? "Yes" : "No"} size="small" color={viewRow.is_active ? "success" : "default"} sx={{ width: "fit-content", fontWeight: 600 }} />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          Edit class
          <IconButton onClick={() => setEditOpen(false)} disabled={editSaving} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, overflow: "visible" }}>
          <Stack spacing={2}>
            <TextField label="Curriculum" fullWidth value={editRow?.curriculum?.name || ""} disabled />
            <TextField label="Name" fullWidth required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Code" fullWidth required value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} helperText="Unique within this curriculum" />
            <TextField
              label="Period"
              fullWidth
              value={editForm.period}
              onChange={(e) => setEditForm((f) => ({ ...f, period: e.target.value }))}
              helperText='Optional — e.g. "1 academic year"'
              inputProps={{ maxLength: 120 }}
            />
            <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
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
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={editSaving} sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

export default CurriculumClassesTab;
