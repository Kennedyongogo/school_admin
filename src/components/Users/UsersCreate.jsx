import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const ALL_ROLES = [
  "super_admin",
  "admin",
  "teacher",
  "student",
  "parent",
  "accountant",
  "librarian",
];

function formatRole(role) {
  if (!role) return "—";
  return String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  username: "",
  email: "",
  password: "",
  full_name: "",
  phone: "",
  address: "",
  role: "admin",
});

async function downloadUsersImportTemplate(token) {
  const res = await fetch("/api/users/import-template", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users-import-template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsersCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm());
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const goBack = () => navigate("/users");

  const handleDownloadImportTemplate = async () => {
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    try {
      await downloadUsersImportTemplate(token);
    } catch (err) {
      setError(err.message || "Could not download template");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    if (!form.username?.trim() || !form.email?.trim() || !form.password || !form.full_name?.trim() || !form.role) {
      setError("Username, email, password, full name, and role are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          role: form.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create user");
      }

      await Swal.fire({
        icon: "success",
        title: "User created",
        text: data.data?.full_name ? `${data.data.full_name} was added.` : "The account was created.",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/users", { replace: true });
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
        /** Pull up into `main`’s default padding so less gap under the fixed top bar. */
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          color: "white",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to users">
            <IconButton
              onClick={goBack}
              aria-label="Back to users"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <PersonAddIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create user
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" sx={{ fontWeight: 700 }} onClick={handleDownloadImportTemplate}>
              Excel template
            </Button>
          }
        >
          Bulk import: User management → Import Excel. Download template: column G (role) is a dropdown of DB roles.
          Columns: username, email, password, full_name, role — optional: phone, address.
        </Alert>

        <Card
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 0,
            border: "none",
            borderBottom: `1px solid ${primaryLight}`,
            boxShadow: "none",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              width: "100%",
              boxSizing: "border-box",
              px: { xs: 2, sm: 3 },
              pt: 3,
              pb: 2,
            }}
          >
            <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
              <TextField
                label="Username"
                required
                fullWidth
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: primaryRed }} />
                    </InputAdornment>
                  ),
                }}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                sx={outlinedFieldSx}
              />
              <FormControl fullWidth variant="outlined" required sx={outlinedFieldSx}>
                <InputLabel htmlFor="create-password" sx={labelSx}>
                  Password
                </InputLabel>
                <OutlinedInput
                  id="create-password"
                  label="Password"
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        sx={{ color: primaryRed }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
              <TextField
                label="Full name"
                required
                fullWidth
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Phone"
                fullWidth
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                minRows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                sx={outlinedFieldSx}
              />
              <FormControl fullWidth sx={outlinedFieldSx}>
                <InputLabel id="create-role-label" sx={labelSx}>
                  Role
                </InputLabel>
                <Select
                  labelId="create-role-label"
                  label="Role"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ALL_ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {formatRole(r)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
                <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ bgcolor: primaryRed, fontWeight: 700, "&:hover": { bgcolor: primaryDark }, minWidth: 140 }}
                >
                  {saving ? "Creating…" : "Create user"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

/** Match Settings.jsx outlined inputs — full width of content area */
const labelSx = {
  color: primaryDark,
  fontWeight: 600,
  "&.Mui-focused": { color: primaryRed },
};

const outlinedFieldSx = {
  width: "100%",
  maxWidth: "100%",
  "& .MuiOutlinedInput-root": {
    width: "100%",
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.95)",
    "& fieldset": { borderColor: "#FECACA" },
    "&:hover fieldset": { borderColor: primaryRed },
    "&.Mui-focused fieldset": {
      borderColor: primaryRed,
      boxShadow: `0 0 0 2px ${primaryLight}`,
    },
  },
  "& .MuiInputLabel-root": { ...labelSx },
};
