import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
import { Delete as DeleteIcon, Edit as EditIcon, Visibility as ViewIcon, Add as AddIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function money(n) {
  const v = Number.parseFloat(n);
  if (!Number.isFinite(v)) return "0.00";
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

  const halfAmountFromTerm = (term) => {
    const t = Number.parseFloat(term);
    return Number.isFinite(t) ? Number.parseFloat((t / 2).toFixed(2)) : 0;
  };

  const sumItems = (items) =>
    (items || []).reduce((acc, it) => acc + (Number.isFinite(Number.parseFloat(it.amount)) ? Number.parseFloat(it.amount) : 0), 0);

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

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <FormControl fullWidth size="small">
          <InputLabel>Curriculum</InputLabel>
          <Select
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
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Class</InputLabel>
          <Select
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
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Term</InputLabel>
          <Select
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
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => {
            setPage(0);
            void loadRows();
          }}
          sx={{ borderColor: primaryRed, color: primaryDark }}
        >
          Refresh
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            overflow: "auto",
            border: `1px solid ${primaryLight}`,
            boxShadow: `0 8px 28px -12px ${primaryRed}33`,
            bgcolor: "rgba(255,255,255,0.98)",
          }}
        >
          <Table size="medium" sx={{ minWidth: 760 }}>
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
                <TableCell width={70}>No</TableCell>
                <TableCell>Curriculum</TableCell>
                <TableCell>Fee</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                      No fee structures yet. Use Create fee structure.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{curriculumName(r.curriculum_id)}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{money(r.term_fee_amount)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => setViewId(r.id)} sx={{ color: primaryDark }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(r)} sx={{ color: primaryRed }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => void deleteRow(r)} sx={{ color: primaryRed }}>
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
            count={totalRows}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: `1px solid ${primaryLight}` }}
          />
        </TableContainer>
      )}

      <Dialog open={!!selectedView} onClose={() => setViewId(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`, color: "#fff" }}>
          Fee structure details
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          {selectedView ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Curriculum
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{curriculumName(selectedView.curriculum_id)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Class
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{className(selectedView.curriculum_class_id)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Term
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{levelName(selectedView.curriculum_class_level_id)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Term fee
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{money(selectedView.term_fee_amount)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Breakdown
              </Typography>
              {Array.isArray(selectedView.payment_breakdown)
                ? selectedView.payment_breakdown.map((p) => (
                    <Box key={p.phase} sx={{ p: 1.5, border: `1px solid ${primaryLight}`, borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                        {p.phase === "first_half" ? "First half" : "Second half"} ({money(p.amount)})
                      </Typography>
                      <Stack spacing={0.5}>
                        {(Array.isArray(p.items) ? p.items : []).map((it, i) => (
                          <Typography key={`${p.phase}-${i}`} variant="body2" color="text.secondary">
                            {it.name}: {money(it.amount)}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  ))
                : null}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !editSaving && setEditOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`, color: "#fff" }}>
          Edit fee structure
        </DialogTitle>
        <DialogContent sx={{ pt: "14px !important", pb: 2 }}>
          <Stack spacing={1.5} sx={{ mt: 0.75 }}>
            <FormControl fullWidth sx={{ mt: 1 }}>
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
            <FormControl fullWidth disabled={!editForm.curriculum_id}>
              <InputLabel>Class</InputLabel>
              <Select
                label="Class"
                value={editForm.curriculum_class_id}
                onChange={(e) => setEditForm((f) => ({ ...f, curriculum_class_id: e.target.value, curriculum_class_level_id: "" }))}
              >
                {classes
                  .filter((c) => String(c.curriculum_id) === String(editForm.curriculum_id))
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!editForm.curriculum_class_id}>
              <InputLabel>Term</InputLabel>
              <Select
                label="Term"
                value={editForm.curriculum_class_level_id}
                onChange={(e) => setEditForm((f) => ({ ...f, curriculum_class_level_id: e.target.value }))}
              >
                {levels
                  .filter((l) => String(l.curriculum_class_id) === String(editForm.curriculum_class_id))
                  .map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <TextField
              label="Term fee amount"
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={editForm.term_fee_amount}
              onChange={(e) => setEditForm((f) => ({ ...f, term_fee_amount: e.target.value }))}
            />
            <Typography variant="caption" color="text.secondary">
              Half target: {halfAmountFromTerm(editForm.term_fee_amount).toFixed(2)} each
            </Typography>

            <Typography sx={{ fontWeight: 700 }}>First half items</Typography>
            {editForm.first_half_items.map((it, i) => (
              <Stack key={`ef-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="Item"
                  fullWidth
                  value={it.name}
                  onChange={(e) =>
                    setEditForm((f) => {
                      const next = [...f.first_half_items];
                      next[i] = { ...next[i], name: e.target.value };
                      return { ...f, first_half_items: next };
                    })
                  }
                />
                <TextField
                  label="Amount"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={it.amount}
                  onChange={(e) =>
                    setEditForm((f) => {
                      const next = [...f.first_half_items];
                      next[i] = { ...next[i], amount: e.target.value };
                      return { ...f, first_half_items: next };
                    })
                  }
                />
                <IconButton
                  disabled={editForm.first_half_items.length <= 1}
                  onClick={() =>
                    setEditForm((f) => ({ ...f, first_half_items: f.first_half_items.filter((_, idx) => idx !== i) }))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setEditForm((f) => ({ ...f, first_half_items: [...f.first_half_items, { name: "", amount: "" }] }))}
              sx={{ alignSelf: "flex-start" }}
            >
              Add item
            </Button>
            <Typography variant="caption" color="text.secondary">
              First half total: {sumItems(editForm.first_half_items).toFixed(2)}
            </Typography>

            <Typography sx={{ fontWeight: 700 }}>Second half items</Typography>
            {editForm.second_half_items.map((it, i) => (
              <Stack key={`es-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="Item"
                  fullWidth
                  value={it.name}
                  onChange={(e) =>
                    setEditForm((f) => {
                      const next = [...f.second_half_items];
                      next[i] = { ...next[i], name: e.target.value };
                      return { ...f, second_half_items: next };
                    })
                  }
                />
                <TextField
                  label="Amount"
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={it.amount}
                  onChange={(e) =>
                    setEditForm((f) => {
                      const next = [...f.second_half_items];
                      next[i] = { ...next[i], amount: e.target.value };
                      return { ...f, second_half_items: next };
                    })
                  }
                />
                <IconButton
                  disabled={editForm.second_half_items.length <= 1}
                  onClick={() =>
                    setEditForm((f) => ({ ...f, second_half_items: f.second_half_items.filter((_, idx) => idx !== i) }))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setEditForm((f) => ({ ...f, second_half_items: [...f.second_half_items, { name: "", amount: "" }] }))}
              sx={{ alignSelf: "flex-start" }}
            >
              Add item
            </Button>
            <Typography variant="caption" color="text.secondary">
              Second half total: {sumItems(editForm.second_half_items).toFixed(2)}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveEdit()} disabled={editSaving} sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
