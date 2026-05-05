import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Divider,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { AccountBalanceWallet as WalletIcon, ArrowBack as ArrowBackIcon, Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
});

export default function CurriculumFeeStructureCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [form, setForm] = useState({
    curriculum_id: "",
    curriculum_class_id: "",
    curriculum_class_level_id: "",
    term_fee_amount: "",
    first_half_items: [{ name: "", amount: "" }],
    second_half_items: [{ name: "", amount: "" }],
  });

  const classOptions = useMemo(
    () => classes.filter((c) => String(c.curriculum_id) === String(form.curriculum_id)),
    [classes, form.curriculum_id]
  );
  const levelOptions = useMemo(
    () => levels.filter((l) => String(l.curriculum_class_id) === String(form.curriculum_class_id)),
    [levels, form.curriculum_class_id]
  );

  const goBack = () => navigate("/accounting", { replace: false });
  const termAmount = Number.parseFloat(form.term_fee_amount);
  const halfAmount = Number.isFinite(termAmount) ? Number.parseFloat((termAmount / 2).toFixed(2)) : 0;
  const sumItems = (items) =>
    (items || []).reduce((acc, it) => acc + (Number.isFinite(Number.parseFloat(it.amount)) ? Number.parseFloat(it.amount) : 0), 0);
  const showErrorAlert = async (message) =>
    Swal.fire({
      icon: "error",
      title: "Validation error",
      text: message,
      confirmButtonColor: primaryRed,
    });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
    } catch (e) {
      setError(e.message || "Could not load form data");
      setCurricula([]);
      setClasses([]);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      await showErrorAlert("Please sign in again.");
      return;
    }
    if (!form.curriculum_id || !form.curriculum_class_id || !form.curriculum_class_level_id) {
      await showErrorAlert("Curriculum, class and term are required.");
      return;
    }
    const term = Number.parseFloat(form.term_fee_amount);
    if (!Number.isFinite(term) || term < 0) {
      await showErrorAlert("Enter a valid non-negative term fee.");
      return;
    }
    const firstItems = form.first_half_items.map((x) => ({ name: String(x.name || "").trim(), amount: Number.parseFloat(x.amount) }));
    const secondItems = form.second_half_items.map((x) => ({ name: String(x.name || "").trim(), amount: Number.parseFloat(x.amount) }));
    if (
      [...firstItems, ...secondItems].some((x) => !x.name || !Number.isFinite(x.amount) || x.amount < 0)
    ) {
      await showErrorAlert("Each breakdown item needs a name and non-negative amount.");
      return;
    }
    const firstTotal = firstItems.reduce((a, b) => a + b.amount, 0);
    const secondTotal = secondItems.reduce((a, b) => a + b.amount, 0);
    if (Math.abs(firstTotal - halfAmount) > 0.01 || Math.abs(secondTotal - halfAmount) > 0.01) {
      await showErrorAlert(`Each half breakdown must total ${halfAmount.toFixed(2)}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/fee-structures", {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          curriculum_id: form.curriculum_id,
          curriculum_class_id: form.curriculum_class_id,
          curriculum_class_level_id: form.curriculum_class_level_id,
          term_fee_amount: term,
          payment_breakdown: [
            { phase: "first_half", amount: halfAmount, items: firstItems },
            { phase: "second_half", amount: halfAmount, items: secondItems },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not create fee structure");

      await Swal.fire({
        icon: "success",
        title: "Fee structure created",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/accounting", { replace: true });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Create failed",
        text: err.message || "Create failed",
        confirmButtonColor: primaryRed,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 2, sm: 2.5 },
          color: "white",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to fee structures">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to fee structures"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <WalletIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create fee structure
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Assign a term fee to curriculum, class and term, then split into two installments.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: primaryRed }} />
          </Box>
        ) : (
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${primaryLight}`,
              boxShadow: `0 8px 28px -12px ${primaryRed}33`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Stack spacing={2.5}>
                <FormControl fullWidth required>
                  <InputLabel>Curriculum</InputLabel>
                  <Select
                    label="Curriculum"
                    value={form.curriculum_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        curriculum_id: e.target.value,
                        curriculum_class_id: "",
                        curriculum_class_level_id: "",
                      }))
                    }
                  >
                    {curricula.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required disabled={!form.curriculum_id}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    label="Class"
                    value={form.curriculum_class_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        curriculum_class_id: e.target.value,
                        curriculum_class_level_id: "",
                      }))
                    }
                  >
                    {classOptions.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth required disabled={!form.curriculum_class_id}>
                  <InputLabel>Term (class level)</InputLabel>
                  <Select
                    label="Term (class level)"
                    value={form.curriculum_class_level_id}
                    onChange={(e) => setForm((f) => ({ ...f, curriculum_class_level_id: e.target.value }))}
                  >
                    {levelOptions.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Term fee amount"
                  required
                  type="number"
                  inputProps={{ min: 0, step: "0.01" }}
                  value={form.term_fee_amount}
                  onChange={(e) => setForm((f) => ({ ...f, term_fee_amount: e.target.value }))}
                />

                <Typography variant="body2" color="text.secondary">
                  Payment is split in two equal halves: <strong>{halfAmount.toFixed(2)}</strong> each.
                </Typography>
                <Divider />
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    First half breakdown (must total {halfAmount.toFixed(2)})
                  </Typography>
                  {form.first_half_items.map((it, i) => (
                    <Stack key={`f-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <TextField
                        label="Item name"
                        fullWidth
                        value={it.name}
                        onChange={(e) =>
                          setForm((f) => {
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
                          setForm((f) => {
                            const next = [...f.first_half_items];
                            next[i] = { ...next[i], amount: e.target.value };
                            return { ...f, first_half_items: next };
                          })
                        }
                      />
                      <IconButton
                        disabled={form.first_half_items.length <= 1}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            first_half_items: f.first_half_items.filter((_, idx) => idx !== i),
                          }))
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        first_half_items: [...f.first_half_items, { name: "", amount: "" }],
                      }))
                    }
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Add item
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Current total: {sumItems(form.first_half_items).toFixed(2)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Second half breakdown (must total {halfAmount.toFixed(2)})
                  </Typography>
                  {form.second_half_items.map((it, i) => (
                    <Stack key={`s-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <TextField
                        label="Item name"
                        fullWidth
                        value={it.name}
                        onChange={(e) =>
                          setForm((f) => {
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
                          setForm((f) => {
                            const next = [...f.second_half_items];
                            next[i] = { ...next[i], amount: e.target.value };
                            return { ...f, second_half_items: next };
                          })
                        }
                      />
                      <IconButton
                        disabled={form.second_half_items.length <= 1}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            second_half_items: f.second_half_items.filter((_, idx) => idx !== i),
                          }))
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        second_half_items: [...f.second_half_items, { name: "", amount: "" }],
                      }))
                    }
                    sx={{ alignSelf: "flex-start" }}
                  >
                    Add item
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Current total: {sumItems(form.second_half_items).toFixed(2)}
                  </Typography>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
                  <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ bgcolor: primaryRed, fontWeight: 700, "&:hover": { bgcolor: primaryDark }, minWidth: 200 }}
                  >
                    {saving ? "Saving…" : "Create fee structure"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
