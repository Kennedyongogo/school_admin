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
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarMonthIcon,
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

function formatTermDate(value) {
  if (!value) return "—";
  const s = String(value).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
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
  const [termSearch, setTermSearch] = useState("");
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
    start_date: "",
    end_date: "",
  });

  const [viewRow, setViewRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editCurriculumId, setEditCurriculumId] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editClassOptions, setEditClassOptions] = useState([]);
  const [editClassesLoading, setEditClassesLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    level_order: "0",
    description: "",
    start_date: "",
    end_date: "",
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editCurriculumId) {
        setEditClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setEditClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, editCurriculumId);
        if (!cancelled) {
          setEditClassOptions(list);
          if (editClassId && list.length > 0 && !list.some((c) => String(c.id) === String(editClassId))) {
            setEditClassId("");
          }
        }
      } catch {
        if (!cancelled) setEditClassOptions([]);
      } finally {
        if (!cancelled) setEditClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editCurriculumId]);

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
      if (termSearch.trim()) params.set("q", termSearch.trim());
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
  }, [page, rowsPerPage, filterCurriculumId, filterClassId, termSearch]);

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
      start_date: "",
      end_date: "",
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
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      Swal.fire({ icon: "warning", title: "Invalid dates", text: "Start date cannot be after end date." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/curricula/${dialogCurriculumId}/classes/${dialogClassId}/levels`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          level_order,
          description: form.description.trim() || undefined,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
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
    const cur = curriculumMeta(row);
    const cid = cur?.id;
    if (!cid || !cc?.id) return;
    setEditRow(row);
    setEditCurriculumId(String(cid));
    setEditClassId(String(cc.id));
    setEditForm({
      name: row.name || "",
      level_order: String(row.level_order ?? 0),
      description: row.description || "",
      start_date: toDateInputValue(row.start_date),
      end_date: toDateInputValue(row.end_date),
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    const cc = editRow ? classMeta(editRow) : null;
    const curriculum_id = cc?.curriculum_id;
    const class_id = cc?.id;
    if (!token || !editRow?.id || !curriculum_id || !class_id) return;
    if (!editCurriculumId || !editClassId) {
      Swal.fire({ icon: "warning", title: "Required", text: "Curriculum and class are required." });
      return;
    }
    const name = editForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Term name is required." });
      return;
    }
    const lo = parseInt(editForm.level_order, 10);
    const level_order = Number.isNaN(lo) ? 0 : lo;
    if (editForm.start_date && editForm.end_date && editForm.start_date > editForm.end_date) {
      Swal.fire({ icon: "warning", title: "Invalid dates", text: "Start date cannot be after end date." });
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/curricula/${curriculum_id}/classes/${class_id}/levels/${editRow.id}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          level_order,
          description: editForm.description.trim() || null,
          start_date: editForm.start_date || null,
          end_date: editForm.end_date || null,
          curriculum_class_id: editClassId,
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

  const tableColSpan = 7;
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
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", lg: "center" }}
          flexWrap="wrap"
          useFlexGap
        >
          <TextField
            size="small"
            label="Search terms"
            placeholder="Term name…"
            value={termSearch}
            onChange={(e) => {
              setTermSearch(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 240 }, ...inputSx }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ flexShrink: 0 }}
          >
            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 280 }, ...inputSx }} disabled={curriculaLoading}>
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

            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 280 }, ...inputSx }} disabled={!filterCurriculumId || classesLoading}>
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
        </Stack>

        <TabPanelShell loading={loadingLevels} error={levelsError} onDismissError={() => setLevelsError(null)}>
          {!loadingLevels && (
            <DataTableShell
              pagination={
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
                  labelRowsPerPage="Rows per page"
                  sx={tablePaginationSx}
                />
              }
            >
              <Table size="medium" sx={{ minWidth: 420, tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell width={56}>No.</TableCell>
                    <TableCell>Curriculum</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell>Start date</TableCell>
                    <TableCell>End date</TableCell>
                    <TableCell align="right" sx={{ width: actionsWidth, minWidth: actionsWidth, whiteSpace: "nowrap" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableColSpan}>
                        <EmptyTableRow message="No terms yet. Use Add term in the header after choosing curriculum and class." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, idx) => (
                      <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{curriculumMeta(r)?.name || "—"}</TableCell>
                        <TableCell>
                          {classMeta(r)?.name
                            ? `${classMeta(r).name}${classMeta(r)?.code ? ` (${classMeta(r).code})` : ""}`
                            : "—"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                        <TableCell>{formatTermDate(r.start_date)}</TableCell>
                        <TableCell>{formatTermDate(r.end_date)}</TableCell>
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
                            <IconButton size="small" aria-label="View term" onClick={() => setViewRow(r)} sx={actionIconSx}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" aria-label="Edit term" onClick={() => openEdit(r)} sx={actionIconSx}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              aria-label="Delete term"
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
      </Stack>

      <PremiumDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="New term"
        subtitle="Add a term to a curriculum class"
        icon={<CalendarMonthIcon />}
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
          <FormControl fullWidth required sx={inputSx} disabled={!dialogCurriculumId || dialogClassesLoading}>
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
          <TextField label="Term name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} helperText='e.g. "Term 1", "Phase A"' sx={inputSx} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              fullWidth
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
            <TextField
              label="End date"
              type="date"
              fullWidth
              value={form.end_date}
              onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Stack>
          <TextField label="Display order" fullWidth value={form.level_order} onChange={(e) => setForm((f) => ({ ...f, level_order: e.target.value }))} helperText="Lower numbers appear first in lists." sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.name || "Term details"}
        subtitle="Term overview"
        icon={<CalendarMonthIcon />}
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
            <DetailField label="Curriculum" value={curriculumMeta(viewRow)?.name} />
            <DetailField
              label="Class"
              value={
                classMeta(viewRow)?.name
                  ? `${classMeta(viewRow)?.name}${classMeta(viewRow)?.code ? ` (${classMeta(viewRow)?.code})` : ""}`
                  : "—"
              }
            />
            <DetailField label="Term name" value={viewRow.name} />
            <DetailField label="Start date" value={formatTermDate(viewRow.start_date)} />
            <DetailField label="End date" value={formatTermDate(viewRow.end_date)} />
            <DetailField label="Display order" value={viewRow.level_order ?? "—"} />
            <DetailField label="Description" value={truncateText(viewRow.description, 600)} />
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit term"
        subtitle="Update term details"
        icon={<CalendarMonthIcon />}
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
          <FormControl fullWidth required sx={inputSx} disabled={curriculaLoading}>
            <InputLabel id="edit-term-curriculum-label">Curriculum</InputLabel>
            <Select
              labelId="edit-term-curriculum-label"
              label="Curriculum"
              value={editCurriculumId}
              onChange={(e) => {
                setEditCurriculumId(e.target.value);
                setEditClassId("");
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
          <FormControl fullWidth required sx={inputSx} disabled={!editCurriculumId || editClassesLoading}>
            <InputLabel id="edit-term-class-label">Class</InputLabel>
            <Select
              labelId="edit-term-class-label"
              label="Class"
              value={editClassId}
              onChange={(e) => setEditClassId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select class</em>
              </MenuItem>
              {editClassOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Term name" fullWidth required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Start date"
              type="date"
              fullWidth
              value={editForm.start_date}
              onChange={(e) => setEditForm((f) => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
            <TextField
              label="End date"
              type="date"
              fullWidth
              value={editForm.end_date}
              onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Stack>
          <TextField label="Display order" fullWidth value={editForm.level_order} onChange={(e) => setEditForm((f) => ({ ...f, level_order: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
        </Stack>
      </PremiumDialog>
    </>
  );
});

export default CurriculumClassLevelsTab;
