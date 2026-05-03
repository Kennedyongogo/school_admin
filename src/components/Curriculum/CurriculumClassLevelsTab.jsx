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

async function fetchClassesForCurriculum(token, curriculumId) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula/${curriculumId}/classes?${params}`, {
      headers: authJsonHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `Could not load classes (${res.status})`);
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

const CurriculumClassLevelsTab = forwardRef(function CurriculumClassLevelsTab(
  { curriculumId, classId, onContextChange },
  ref
) {
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

  const [filterCurriculumId, setFilterCurriculumId] = useState(curriculumId || "");
  const [filterClassId, setFilterClassId] = useState(classId || "");
  const [classOptions, setClassOptions] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    setFilterCurriculumId(curriculumId || "");
  }, [curriculumId]);
  useEffect(() => {
    setFilterClassId(classId || "");
  }, [classId]);

  const [dialogCurriculumId, setDialogCurriculumId] = useState("");
  const [dialogClassId, setDialogClassId] = useState("");
  const [dialogClassOptions, setDialogClassOptions] = useState([]);
  const [dialogClassesLoading, setDialogClassesLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [levelsError, setLevelsError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    level_order: "0",
    description: "",
  });

  const [viewRow, setViewRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    level_order: "0",
    description: "",
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!filterCurriculumId) {
        setClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, filterCurriculumId);
        if (!cancelled) {
          setClassOptions(list);
          if (filterClassId && !list.some((c) => String(c.id) === String(filterClassId))) {
            setFilterClassId("");
            onContextChange?.(filterCurriculumId, "");
          }
        }
      } catch {
        if (!cancelled) setClassOptions([]);
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterCurriculumId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dialogCurriculumId) {
        setDialogClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setDialogClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, dialogCurriculumId);
        if (!cancelled) setDialogClassOptions(list);
      } catch {
        if (!cancelled) setDialogClassOptions([]);
      } finally {
        if (!cancelled) setDialogClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogCurriculumId]);

  const fetchLevels = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLevelsError("Please sign in again.");
      setRows([]);
      setTotalRows(0);
      setLoadingLevels(false);
      return;
    }
    setLoadingLevels(true);
    setLevelsError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (filterCurriculumId) params.set("curriculum_id", filterCurriculumId);
      if (filterClassId) params.set("curriculum_class_id", filterClassId);
      const res = await fetch(`/api/curricula/all-class-levels?${params}`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load terms (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalRows(data.pagination?.total ?? 0);
    } catch (e) {
      setLevelsError(e.message || "Failed to load terms.");
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoadingLevels(false);
    }
  }, [page, rowsPerPage, filterCurriculumId, filterClassId]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const openCreate = useCallback(() => {
    setDialogCurriculumId(curriculumId || "");
    setDialogClassId(classId || "");
    setForm({
      name: "",
      level_order: "0",
      description: "",
    });
    setDialogOpen(true);
  }, [curriculumId, classId]);

  useImperativeHandle(
    ref,
    () => ({
      openCreateDialog() {
        if (curriculaLoadingRef.current) {
          Swal.fire({ icon: "info", title: "Please wait", text: "Loading curricula…", timer: 1600, showConfirmButton: false });
          return;
        }
        if (curriculaErrorRef.current) {
          Swal.fire({ icon: "error", title: "Unavailable", text: "Fix curriculum loading errors before creating a term." });
          return;
        }
        openCreate();
      },
    }),
    [openCreate]
  );

  const curriculumMeta = (row) => row?.curriculum_class?.curriculum;
  const classMeta = (row) => row?.curriculum_class;

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !dialogCurriculumId || !dialogClassId) {
      if (!dialogCurriculumId) {
        Swal.fire({ icon: "warning", title: "Required", text: "Select which curriculum this term belongs to." });
      } else if (!dialogClassId) {
        Swal.fire({ icon: "warning", title: "Required", text: "Select which class this term belongs to." });
      }
      return;
    }
    const name = form.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Term name is required." });
      return;
    }
    const lo = parseInt(form.level_order, 10);
    const level_order = Number.isNaN(lo) ? 0 : lo;
    setSaving(true);
    try {
      const res = await fetch(`/api/curricula/${dialogCurriculumId}/classes/${dialogClassId}/levels`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          level_order,
          description: form.description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Create failed");
      }
      setDialogOpen(false);
      await Swal.fire({ icon: "success", title: "Term created", timer: 1400, showConfirmButton: false });
      fetchLevels();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    const cc = classMeta(row);
    const cid = cc?.curriculum_id;
    if (!cid || !cc?.id) return;
    setEditRow(row);
    setEditForm({
      name: row.name || "",
      level_order: String(row.level_order ?? 0),
      description: row.description || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    const cc = editRow ? classMeta(editRow) : null;
    const curriculum_id = cc?.curriculum_id;
    const class_id = cc?.id;
    if (!token || !editRow?.id || !curriculum_id || !class_id) return;
    const name = editForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Term name is required." });
      return;
    }
    const lo = parseInt(editForm.level_order, 10);
    const level_order = Number.isNaN(lo) ? 0 : lo;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/curricula/${curriculum_id}/classes/${class_id}/levels/${editRow.id}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          level_order,
          description: editForm.description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }
      setEditOpen(false);
      await Swal.fire({ icon: "success", title: "Saved", timer: 1400, showConfirmButton: false });
      fetchLevels();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const token = localStorage.getItem("token");
    const cc = classMeta(row);
    const curriculum_id = cc?.curriculum_id;
    const class_id = cc?.id;
    if (!token || !curriculum_id || !class_id) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete term?",
      text: `${row.name}`,
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/curricula/${curriculum_id}/classes/${class_id}/levels/${row.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
      fetchLevels();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  };

  const tableColSpan = 4;
  const actionsWidth = 132;

  const handleFilterCurriculumChange = (id) => {
    setFilterCurriculumId(id);
    setFilterClassId("");
    setPage(0);
    onContextChange?.(id, "");
  };

  const handleFilterClassChange = (clsId) => {
    setFilterClassId(clsId);
    setPage(0);
    onContextChange?.(filterCurriculumId, clsId);
  };

  return (
    <>
      {curriculaError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setCurriculaError(null)}>
          {curriculaError} Creating terms may be unavailable until this is resolved.
        </Alert>
      )}

      <Stack spacing={2}>
        <Box sx={{ width: "100%", textAlign: "right" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              display: "inline-flex",
              alignItems: { xs: "flex-end", sm: "center" },
              textAlign: "left",
              verticalAlign: "top",
              maxWidth: "100%",
            }}
          >
            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 280 } }} disabled={curriculaLoading}>
              <InputLabel id="terms-filter-curriculum-label">Filter by curriculum</InputLabel>
              <Select
                labelId="terms-filter-curriculum-label"
                label="Filter by curriculum"
                value={filterCurriculumId}
                onChange={(e) => handleFilterCurriculumChange(e.target.value)}
              >
              <MenuItem value="">
                <em>All curricula</em>
              </MenuItem>
              {curriculaOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.type ? ` — ${c.type}` : ""}
                </MenuItem>
              ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 280 } }} disabled={!filterCurriculumId || classesLoading}>
              <InputLabel id="terms-filter-class-label">Filter by class</InputLabel>
              <Select
                labelId="terms-filter-class-label"
                label="Filter by class"
                value={filterClassId}
                onChange={(e) => handleFilterClassChange(e.target.value)}
              >
              <MenuItem value="">
                <em>All classes</em>
              </MenuItem>
              {classOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </MenuItem>
              ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {levelsError && (
          <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setLevelsError(null)}>
            {levelsError}
          </Alert>
        )}

        <TableContainer
          sx={{
            borderRadius: 2,
            overflow: "auto",
            border: `1px solid ${primaryLight}`,
            boxShadow: `0 8px 28px -12px ${primaryRed}33`,
            bgcolor: "rgba(255,255,255,0.98)",
          }}
        >
          <Table size="medium" sx={{ minWidth: 420, tableLayout: "fixed" }}>
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
                <TableCell>Curriculum</TableCell>
                <TableCell>Term</TableCell>
                <TableCell align="right" sx={{ width: actionsWidth, minWidth: actionsWidth, whiteSpace: "nowrap" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingLevels ? (
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
                      No terms yet. Use Add term in the header after choosing curriculum and class.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{curriculumMeta(r)?.name || "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
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
                          <IconButton size="small" aria-label="View term" onClick={() => setViewRow(r)} sx={{ color: primaryDark, flexShrink: 0 }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit term" onClick={() => openEdit(r)} sx={{ color: primaryRed, flexShrink: 0 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" aria-label="Delete term" onClick={() => handleDelete(r)} sx={{ color: primaryRed, flexShrink: 0 }}>
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
            count={totalRows}
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
          New term
          <IconButton onClick={() => setDialogOpen(false)} disabled={saving} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, overflow: "visible" }}>
          <Stack spacing={2}>
            <FormControl fullWidth required sx={{ mt: 0.5 }} disabled={curriculaLoading}>
              <InputLabel id="dlg-term-curriculum-label">Curriculum</InputLabel>
              <Select
                labelId="dlg-term-curriculum-label"
                label="Curriculum"
                value={dialogCurriculumId}
                onChange={(e) => {
                  setDialogCurriculumId(e.target.value);
                  setDialogClassId("");
                }}
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
            <FormControl fullWidth required disabled={!dialogCurriculumId || dialogClassesLoading}>
              <InputLabel id="dlg-term-class-label">Class</InputLabel>
              <Select labelId="dlg-term-class-label" label="Class" value={dialogClassId} onChange={(e) => setDialogClassId(e.target.value)}>
                <MenuItem value="">
                  <em>Select class</em>
                </MenuItem>
                {dialogClassOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                    {c.code ? ` (${c.code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Term name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} helperText='e.g. "Term 1", "Phase A"' />
            <TextField label="Display order" fullWidth value={form.level_order} onChange={(e) => setForm((f) => ({ ...f, level_order: e.target.value }))} helperText="Lower numbers appear first in lists." />
            <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
          Term details
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
              <Typography sx={{ fontWeight: 700 }}>{curriculumMeta(viewRow)?.name || "—"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                Class
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>
                {classMeta(viewRow)?.name || "—"}
                {classMeta(viewRow)?.code ? ` (${classMeta(viewRow)?.code})` : ""}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Term name
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{viewRow.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Display order
              </Typography>
              <Typography>{viewRow.level_order ?? "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{truncate(viewRow.description, 600)}</Typography>
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
          Edit term
          <IconButton onClick={() => setEditOpen(false)} disabled={editSaving} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, overflow: "visible" }}>
          <Stack spacing={2}>
            <TextField label="Curriculum" fullWidth value={curriculumMeta(editRow)?.name || ""} disabled />
            <TextField
              label="Class"
              fullWidth
              value={
                editRow
                  ? `${classMeta(editRow)?.name || ""}${classMeta(editRow)?.code ? ` (${classMeta(editRow)?.code})` : ""}`
                  : ""
              }
              disabled
            />
            <TextField label="Term name" fullWidth required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Display order" fullWidth value={editForm.level_order} onChange={(e) => setEditForm((f) => ({ ...f, level_order: e.target.value }))} />
            <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
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

export default CurriculumClassLevelsTab;
