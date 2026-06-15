import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, MenuBook as MenuBookIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { authJsonHeaders, inputSx, pageShellSx, primaryRed, primaryBtnSx, ghostBtnSx } from "./curriculumShared";
import { CurriculumHero, FormSection } from "./curriculumUi";

const initialForm = () => ({
  name: "",
  description: "",
  type: "",
  period: "",
});

export default function CurriculumCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const goBack = () => navigate("/curriculum");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    if (!form.name?.trim() || !form.type?.trim()) {
      setError("Name and type are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/curricula", {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type.trim(),
          description: form.description?.trim() || null,
          period: form.period?.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create curriculum");
      }

      await Swal.fire({
        icon: "success",
        title: "Curriculum created",
        text: data.data?.name ? `${data.data.name} was added.` : undefined,
        confirmButtonColor: primaryRed,
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/curriculum", { replace: true });
    } catch (err) {
      setError(err.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ ...pageShellSx, minHeight: "100%" }}>
      <CurriculumHero
        title="Create curriculum"
        subtitle="Name your pathway and enter any type label you use (e.g. CBC, IGCSE, 8-4-4)."
        icon={<MenuBookIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={
          <Tooltip title="Back to curricula">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to curricula"
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
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ mt: 0.5, width: "100%" }}>
        <FormSection title="Curriculum details">
          <Stack spacing={2} sx={{ width: "100%" }}>
            <TextField
              label="Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Kenya CBC — Junior School"
              sx={inputSx}
            />
            <TextField
              label="Type"
              required
              fullWidth
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="Any label your school uses (e.g. CBC, British National Curriculum)"
              sx={inputSx}
            />
            <TextField
              label="Period"
              fullWidth
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              placeholder="e.g. 6 years, 4 academic years"
              helperText="Optional: how long the curriculum runs before completion."
              inputProps={{ maxLength: 120 }}
              sx={inputSx}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              sx={inputSx}
            />
          </Stack>
        </FormSection>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ ...primaryBtnSx, minWidth: 160 }}
        >
          {saving ? "Saving…" : "Create curriculum"}
        </Button>
      </Stack>
    </Box>
  );
}
