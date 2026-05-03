import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, MenuBook as MenuBookIcon } from "@mui/icons-material";
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
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

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
          <Tooltip title="Back to curricula">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to curricula"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <MenuBookIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create curriculum
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Name your pathway and enter any type label you use (e.g. CBC, IGCSE, 8-4-4).
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
              <TextField
                label="Name"
                required
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Kenya CBC — Junior School"
              />
              <TextField
                label="Type"
                required
                fullWidth
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="Any label your school uses (e.g. CBC, British National Curriculum)"
              />
              <TextField
                label="Period"
                fullWidth
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="e.g. 6 years, 4 academic years — time until this pathway is completed"
                helperText="Optional: how long the curriculum runs before completion."
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
                <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ bgcolor: primaryRed, fontWeight: 700, "&:hover": { bgcolor: primaryDark }, minWidth: 160 }}
                >
                  {saving ? "Saving…" : "Create curriculum"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
