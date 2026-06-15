import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountBalanceWallet as WalletIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authJsonHeaders,
  formatMoney,
  halfAmountFromTerm,
  sumFeeItems,
  inputSx,
  primaryRed,
  warmCream,
  fullMainBleedSx,
  primaryBtnSx,
  ghostBtnSx,
} from "../Accounting/accountingShared";
import {
  AccountingHero,
  FormSection,
  FeeBreakdownEditor,
} from "../Accounting/accountingUi";

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
  const halfAmount = halfAmountFromTerm(form.term_fee_amount);

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

  const updateHalfItem = (half, index, field, value) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setForm((f) => {
      const next = [...f[key]];
      next[index] = { ...next[index], [field]: value };
      return { ...f, [key]: next };
    });
  };

  const addHalfItem = (half) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setForm((f) => ({ ...f, [key]: [...f[key], { name: "", amount: "" }] }));
  };

  const removeHalfItem = (half, index) => {
    const key = half === "first" ? "first_half_items" : "second_half_items";
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== index) }));
  };

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
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <AccountingHero
        title="Create fee structure"
        subtitle="Assign a term fee to curriculum, class and term, then split into two installments."
        icon={<WalletIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={
          <Tooltip title="Back to fee structures">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to fee structures"
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        <Stack spacing={2.5} sx={{ width: "100%" }}>
          <FormSection title="Placement">
            <Stack spacing={2} sx={{ width: "100%" }}>
              <FormControl fullWidth required sx={inputSx}>
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
              <FormControl fullWidth required disabled={!form.curriculum_id} sx={inputSx}>
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
              <FormControl fullWidth required disabled={!form.curriculum_class_id} sx={inputSx}>
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
            </Stack>
          </FormSection>

          <FormSection title="Term fee">
            <Stack spacing={1.5} sx={{ width: "100%" }}>
              <TextField
                label="Term fee amount"
                required
                fullWidth
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={form.term_fee_amount}
                onChange={(e) => setForm((f) => ({ ...f, term_fee_amount: e.target.value }))}
                sx={inputSx}
              />
              <Typography variant="body2" color="text.secondary">
                Payment is split in two equal halves: <strong>{formatMoney(halfAmount)}</strong> each.
              </Typography>
            </Stack>
          </FormSection>

          <FormSection title="Payment breakdown">
            <Stack spacing={2} sx={{ width: "100%" }}>
              <FeeBreakdownEditor
                title={`First half breakdown (must total ${halfAmount.toFixed(2)})`}
                halfTarget={halfAmount}
                items={form.first_half_items}
                onChange={(i, field, value) => updateHalfItem("first", i, field, value)}
                onAdd={() => addHalfItem("first")}
                onRemove={(i) => removeHalfItem("first", i)}
              />
              <FeeBreakdownEditor
                title={`Second half breakdown (must total ${halfAmount.toFixed(2)})`}
                halfTarget={halfAmount}
                items={form.second_half_items}
                onChange={(i, field, value) => updateHalfItem("second", i, field, value)}
                onAdd={() => addHalfItem("second")}
                onRemove={(i) => removeHalfItem("second", i)}
              />
              <Typography variant="caption" color="text.secondary">
                First half total: {sumFeeItems(form.first_half_items).toFixed(2)} · Second half total:{" "}
                {sumFeeItems(form.second_half_items).toFixed(2)}
              </Typography>
            </Stack>
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 0.5 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ ...primaryBtnSx, minWidth: 200 }}
            >
              {saving ? "Saving…" : "Create fee structure"}
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
