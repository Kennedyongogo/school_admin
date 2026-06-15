import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  Download as DownloadIcon,
  InfoOutlined,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  ALL_ROLES,
  authJsonHeaders,
  formatRole,
  getActorFromStorage,
  assignableRoles,
  primaryRed,
  warmCream,
  textSecondary,
  inputSx,
  primaryBtnSx,
  ghostBtnSx,
  pageShellSx,
} from "./usersShared";
import { UsersHero, FormSection, fadeUp } from "./usersUi";

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

  const actor = getActorFromStorage();
  const creatableRoles = assignableRoles(actor?.role);

  const goBack = () => navigate("/users");

  const handleDownloadImportTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: "error", title: "Not signed in", text: "Please sign in again.", confirmButtonColor: primaryRed });
      return;
    }
    try {
      await downloadUsersImportTemplate(token);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Download failed", text: err.message, confirmButtonColor: primaryRed });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire({ icon: "error", title: "Not signed in", text: "Please sign in again.", confirmButtonColor: primaryRed });
      return;
    }
    if (!form.username?.trim() || !form.email?.trim() || !form.password || !form.full_name?.trim() || !form.role) {
      Swal.fire({
        icon: "error",
        title: "Missing fields",
        text: "Username, email, password, full name, and role are required.",
        confirmButtonColor: primaryRed,
      });
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
        text: data.data?.full_name ? `${data.data.full_name} was added successfully.` : "The account was created.",
        confirmButtonColor: primaryRed,
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/users", { replace: true });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Create failed", text: err.message, confirmButtonColor: primaryRed });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={pageShellSx}>
      <UsersHero
        title="Create user"
        subtitle="Add a new account with role-based access"
        icon={<PersonAddIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <Tooltip title="Back to users">
            <IconButton
              onClick={goBack}
              type="button"
              aria-label="Back to users"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        }
      />

      <Box
        component={motion.div}
        variants={fadeUp}
        custom={1}
        initial="hidden"
        animate="visible"
        sx={{
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
          p: 2,
          mb: 3,
          borderRadius: "16px",
          bgcolor: "rgba(37,99,235,0.06)",
          border: "1px solid rgba(37,99,235,0.15)",
        }}
      >
        <InfoOutlined sx={{ color: "#2563EB", fontSize: 22, mt: 0.1, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: "0.85rem", color: textSecondary, lineHeight: 1.55 }}>
            Bulk import? Use <strong>Import Excel</strong> on the users list. Columns: username, email, password, full_name, role — optional: phone, address.
          </Typography>
          <Button
            type="button"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadImportTemplate}
            sx={{ mt: 1, color: primaryRed, fontWeight: 700, textTransform: "none" }}
          >
            Download Excel template
          </Button>
        </Box>
      </Box>

      <Stack spacing={2.5} component={motion.div} variants={fadeUp} custom={2} initial="hidden" animate="visible">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <FormSection title="Account credentials">
            <Stack spacing={2}>
              <TextField
                label="Username"
                required
                fullWidth
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
              <TextField
                label="Email address"
                type="email"
                required
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
              <TextField
                label="Password"
                required
                fullWidth
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" sx={{ color: textSecondary }}>
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </Stack>
          </FormSection>

          <FormSection title="Personal & role">
            <Stack spacing={2}>
              <TextField
                label="Full name"
                required
                fullWidth
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
              <TextField
                label="Phone"
                fullWidth
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
              <TextField
                label="Address"
                fullWidth
                multiline
                minRows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                      <HomeIcon sx={{ color: primaryRed, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
              <FormControl fullWidth required sx={inputSx}>
                <InputLabel>Role</InputLabel>
                <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {(creatableRoles.length ? creatableRoles : ALL_ROLES).map((r) => (
                    <MenuItem key={r} value={r}>
                      {formatRole(r)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {actor?.role !== "super_admin" && creatableRoles.length > 0 ? (
                <Typography sx={{ fontSize: "0.78rem", color: textSecondary }}>
                  Only a super admin can create super admin accounts.
                </Typography>
              ) : null}
            </Stack>
          </FormSection>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            justifyContent: "flex-end",
            pt: 1,
          }}
        >
          <Button type="button" variant="text" onClick={goBack} sx={{ ...ghostBtnSx, py: 1.25 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
            sx={{ ...primaryBtnSx, minWidth: 160 }}
          >
            {saving ? "Creating…" : "Create user"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
