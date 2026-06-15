import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Savings as SavingsIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authJsonHeaders,
  formatKes,
  formatMoney,
  halfAmountFromTerm,
  sumFeeItems,
  inputSx,
  primaryRed,
  primaryDark,
  actionIconSx,
} from "../Accounting/accountingShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  PremiumDialog,
  DetailField,
  FormSection,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  AccountingFilterBar,
  FilterSelect,
  FeeBreakdownEditor,
  FeeBreakdownView,
} from "../Accounting/accountingUi";

export default function CurriculumFeeStructuresTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [filters, setFilters] = useState({
    curriculum_id: "",
    curriculum_class_id: "",
    curriculum_class_level_id: "",
  });

  const classOptions = useMemo(
    () =>
      classes.filter((c) => !filters.curriculum_id || String(c.curriculum_id) === String(filters.curriculum_id)),
    [classes, filters.curriculum_id]
  );

  const levelOptions = useMemo(
    () =>
      levels.filter((l) => !filters.curriculum_class_id || String(l.curriculum_class_id) === String(filters.curriculum_class_id)),
    [levels, filters.curriculum_class_id]
  );

  const curriculumName = useMemo(() => {
    const m = new Map(curricula.map((c) => [String(c.id), c.name]));
    return (id) => m.get(String(id)) || "—";
  }, [curricula]);
  const className = useMemo(() => {
    const m = new Map(classes.map((c) => [String(c.id), c.name]));
    return (id) => m.get(String(id)) || "—";
  }, [classes]);
  const levelName = useMemo(() => {
    const m = new Map(levels.map((l) => [String(l.id), l.name]));
    return (id) => m.get(String(id)) || "—";
  }, [levels]);

  const [viewId, setViewId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const selectedView = useMemo(() => rows.find((r) => String(r.id) === String(viewId)) || null, [rows, viewId]);
  const [editForm, setEditForm] = useState({
    curriculum_id: "",
    curriculum_class_id: "",
    curriculum_class_level_id: "",
    term_fee_amount: "",
    first_half_items: [{ name: "", amount: "" }],
    second_half_items: [{ name: "", amount: "" }],
  });

  const editClassOptions = useMemo(
    () => classes.filter((c) => String(c.curriculum_id) === String(editForm.curriculum_id)),
    [classes, editForm.curriculum_id]
  );
  const editLevelOptions = useMemo(
    () => levels.filter((l) => String(l.curriculum_class_id) === String(editForm.curriculum_class_id)),
    [levels, editForm.curriculum_class_id]
  );

  const halfTarget = halfAmountFromTerm(editForm.term_fee_amount);
  const tableColSpan = 6;
  const actionsWidth = 132;

  const loadLookups = useCallback(async (token) => {
    const [curRes, clsRes, lvlRes] = await Promise.all([
      fetch("/api/curricula?limit=500&page=1", { headers: authJsonHeaders(token) }),
      fetch("/api/curricula/all-classes?limit=1000&page=1", { headers: authJsonHeaders(token) }),
      fetch("/api/curricula/all-class-levels?limit=1000&page=1", { headers: authJsonHeaders(token) }),
    ]);
    const [curJson, clsJson, lvlJson] = await Promise.all([
      curRes.json().catch(() => ({})),
      clsRes.json().catch(() => ({})),
      lvlRes.json().catch(() => ({})),
    ]);
    if (!curRes.ok || !curJson.success) throw new Error(curJson.message || "Could not load curricula");
    if (!clsRes.ok || !clsJson.success) throw new Error(clsJson.message || "Could not load classes");
    if (!lvlRes.ok || !lvlJson.success) throw new Error(lvlJson.message || "Could not load terms");
    setCurricula(Array.isArray(curJson.data) ? curJson.data : []);
    setClasses(Array.isArray(clsJson.data) ? clsJson.data : []);
    setLevels(Array.isArray(lvlJson.data) ? lvlJson.data : []);
  }, []);

  const loadRows = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loadLookups(token);
      const q = new URLSearchParams();
      q.set("page", String(page + 1));
      q.set("limit", String(rowsPerPage));
      if (filters.curriculum_id) q.set("curriculum_id", filters.curriculum_id);
      if (filters.curriculum_class_id) q.set("curriculum_class_id", filters.curriculum_class_id);
      if (filters.curriculum_class_level_id) q.set("curriculum_class_level_id", filters.curriculum_class_level_id);
      const res = await fetch(`/api/fee-structures${q.toString() ? `?${q}` : ""}`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load fee structures");
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalRows(data.pagination?.total ?? 0);
    } catch (e) {
      setRows([]);
      setTotalRows(0);
      setError(e.message || "Failed to load fee structures.");
    } finally {
      setLoading(false);
    }
  }, [filters, loadLookups, page, rowsPerPage]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const handleRefresh = () => {
    setPage(0);
    void loadRows();
  };

  const openEdit = (row) => {
    const getItems = (phase) =>
      Array.isArray(row.payment_breakdown)
        ? row.payment_breakdown.find((p) => p.phase === phase)?.items || []
        : [];
    const mapItems = (items) =>
      items.length ? items.map((it) => ({ name: String(it.name || ""), amount: String(it.amount ?? "") })) : [{ name: "", amount: "" }];
    setEditId(row.id);
    setEditForm({
      curriculum_id: row.curriculum_id || "",
      curriculum_class_id: row.curriculum_class_id || "",
      curriculum_class_level_id: row.curriculum_class_level_id || "",
      term_fee_amount: String(row.term_fee_amount ?? ""),
      first_half_items: mapItems(getItems("first_half")),
      second_half_items: mapItems(getItems("second_half")),
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editId) return;
    const term = Number.parseFloat(editForm.term_fee_amount);
    if (!Number.isFinite(term) || term < 0) {
      setError("Enter valid term fee amount.");
      return;
    }
    const half = halfAmountFromTerm(term);
    const firstItems = editForm.first_half_items.map((x) => ({ name: String(x.name || "").trim(), amount: Number.parseFloat(x.amount) }));
    const secondItems = editForm.second_half_items.map((x) => ({ name: String(x.name || "").trim(), amount: Number.parseFloat(x.amount) }));
    if ([...firstItems, ...secondItems].some((x) => !x.name || !Number.isFinite(x.amount) || x.amount < 0)) {
      setError("Each item needs valid name and amount.");
      return;
    }
    if (Math.abs(firstItems.reduce((a, b) => a + b.amount, 0) - half) > 0.01) {
      setError(`First half items must total ${half.toFixed(2)}.`);
      return;
    }
    if (Math.abs(secondItems.reduce((a, b) => a + b.amount, 0) - half) > 0.01) {
      setError(`Second half items must total ${half.toFixed(2)}.`);
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/fee-structures/${editId}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          curriculum_id: editForm.curriculum_id,
          curriculum_class_id: editForm.curriculum_class_id,
          curriculum_class_level_id: editForm.curriculum_class_level_id,
          term_fee_amount: term,
          payment_breakdown: [
            { phase: "first_half", amount: half, items: firstItems },
            { phase: "second_half", amount: half, items: secondItems },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update fee structure");
      setEditOpen(false);
      await Swal.fire({
        icon: "success",
        title: "Fee structure updated",
        timer: 1400,
        showConfirmButton: false,
      });
      await loadRows();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteRow = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete fee structure?",
      text: `This will remove fee setup for ${curriculumName(row.curriculum_id)} / ${className(row.curriculum_class_id)} / ${levelName(
        row.curriculum_class_level_id
      )}.`,
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/fee-structures/${row.id}`, { method: "DELETE", headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      await loadRows();
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  };

  const updateHalfItem = (half, index, field, value) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setEditForm((f) => {
      const next = [...f[key]];
      next[index] = { ...next[index], [field]: value };
      return { ...f, [key]: next };
    });
  };

  const addHalfItem = (half) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setEditForm((f) => ({ ...f, [key]: [...f[key], { name: "", amount: "" }] }));
  };

  const removeHalfItem = (half, index) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setEditForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== index) }));
  };

  return (
    <Stack spacing={2}>
      <AccountingFilterBar onRefresh={handleRefresh}>
        <FilterSelect
          label="Curriculum"
          value={filters.curriculum_id}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              curriculum_id: e.target.value,
              curriculum_class_id: "",
              curriculum_class_level_id: "",
            }))
          }
        >
          <MenuItem value="">All</MenuItem>
          {curricula.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Class"
          value={filters.curriculum_class_id}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              curriculum_class_id: e.target.value,
              curriculum_class_level_id: "",
            }))
          }
        >
          <MenuItem value="">All</MenuItem>
          {classOptions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Term"
          value={filters.curriculum_class_level_id}
          onChange={(e) => setFilters((f) => ({ ...f, curriculum_class_level_id: e.target.value }))}
        >
          <MenuItem value="">All</MenuItem>
          {levelOptions.map((l) => (
            <MenuItem key={l.id} value={l.id}>
              {l.name}
            </MenuItem>
          ))}
        </FilterSelect>
      </AccountingFilterBar>

      <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
        {!loading && (
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
            <Table size="medium" sx={{ minWidth: 900, tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell width={56}>No.</TableCell>
                  <TableCell>Curriculum</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Term</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell align="right" sx={{ width: actionsWidth, minWidth: actionsWidth, whiteSpace: "nowrap" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColSpan}>
                      <EmptyTableRow message="No fee structures yet. Use Create fee structure." />
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{curriculumName(r.curriculum_id)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{className(r.curriculum_class_id)}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{levelName(r.curriculum_class_level_id)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatKes(r.term_fee_amount)}</TableCell>
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
                          <IconButton size="small" aria-label="View fee structure" onClick={() => setViewId(r.id)} sx={actionIconSx}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit fee structure" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            aria-label="Delete fee structure"
                            onClick={() => void deleteRow(r)}
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
        open={!!selectedView}
        onClose={() => setViewId(null)}
        title="Fee structure details"
        subtitle={`${selectedView ? curriculumName(selectedView.curriculum_id) : ""} · ${selectedView ? className(selectedView.curriculum_class_id) : ""}`}
        icon={<SavingsIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => setViewId(null)}>Close</DialogGhostButton>
            {selectedView ? (
              <DialogPrimaryButton
                startIcon={<EditIcon />}
                onClick={() => {
                  const row = selectedView;
                  setViewId(null);
                  openEdit(row);
                }}
              >
                Edit
              </DialogPrimaryButton>
            ) : null}
          </>
        }
      >
        {selectedView ? (
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
              <DetailField label="Curriculum" value={curriculumName(selectedView.curriculum_id)} />
              <DetailField label="Class" value={className(selectedView.curriculum_class_id)} />
              <DetailField label="Term" value={levelName(selectedView.curriculum_class_level_id)} />
              <DetailField label="Term fee" value={formatKes(selectedView.term_fee_amount)} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 700 }}>
                Payment breakdown
              </Typography>
              <FeeBreakdownView breakdown={selectedView.payment_breakdown} />
            </Box>
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit fee structure"
        subtitle="Update placement, term fee, and installment breakdown"
        icon={<SavingsIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editSaving} onClick={() => void saveEdit()}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={2}>
          <FormSection title="Placement">
            <Stack spacing={2}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel>Curriculum</InputLabel>
                <Select
                  label="Curriculum"
                  value={editForm.curriculum_id}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, curriculum_id: e.target.value, curriculum_class_id: "", curriculum_class_level_id: "" }))
                  }
                >
                  {curricula.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={!editForm.curriculum_id} sx={inputSx}>
                <InputLabel>Class</InputLabel>
                <Select
                  label="Class"
                  value={editForm.curriculum_class_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, curriculum_class_id: e.target.value, curriculum_class_level_id: "" }))}
                >
                  {editClassOptions.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={!editForm.curriculum_class_id} sx={inputSx}>
                <InputLabel>Term</InputLabel>
                <Select
                  label="Term"
                  value={editForm.curriculum_class_level_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, curriculum_class_level_id: e.target.value }))}
                >
                  {editLevelOptions.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </FormSection>

          <FormSection title="Term fee">
            <Stack spacing={1.5}>
              <TextField
                label="Term fee amount"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                value={editForm.term_fee_amount}
                onChange={(e) => setEditForm((f) => ({ ...f, term_fee_amount: e.target.value }))}
                sx={inputSx}
              />
              <Typography variant="body2" color="text.secondary">
                Half target: <strong>{formatMoney(halfTarget)}</strong> each
              </Typography>
            </Stack>
          </FormSection>

          <FormSection title="Payment breakdown">
            <Stack spacing={2}>
              <FeeBreakdownEditor
                title="First half items"
                halfTarget={halfTarget}
                items={editForm.first_half_items}
                onChange={(i, field, value) => updateHalfItem("first", i, field, value)}
                onAdd={() => addHalfItem("first")}
                onRemove={(i) => removeHalfItem("first", i)}
              />
              <FeeBreakdownEditor
                title="Second half items"
                halfTarget={halfTarget}
                items={editForm.second_half_items}
                onChange={(i, field, value) => updateHalfItem("second", i, field, value)}
                onAdd={() => addHalfItem("second")}
                onRemove={(i) => removeHalfItem("second", i)}
              />
              <Typography variant="caption" color="text.secondary">
                First half total: {sumFeeItems(editForm.first_half_items).toFixed(2)} · Second half total:{" "}
                {sumFeeItems(editForm.second_half_items).toFixed(2)}
              </Typography>
            </Stack>
          </FormSection>
        </Stack>
      </PremiumDialog>
    </Stack>
  );
}
