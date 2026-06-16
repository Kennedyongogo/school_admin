import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Avatar,
  TextField,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import {
  Check,
  Close,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Shield,
  VerifiedUser,
  History as HistoryIcon,
} from "@mui/icons-material";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const warmCream = "#FFFBF7";
const textPrimary = "#1C1917";
const textSecondary = "#78716C";
const textMuted = "#A8A29E";
const successGreen = "#16A34A";

const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const fontDisplay = '"Fraunces", "Georgia", serif';

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function SettingsSection({ icon, title, subtitle, accent = primaryRed, children, delay = 0, footer }) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
      sx={{
        borderRadius: "22px",
        bgcolor: "#fff",
        border: "1px solid rgba(220,38,38,0.08)",
        boxShadow: "0 16px 48px -16px rgba(28,25,23,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          borderBottom: "1px solid rgba(220,38,38,0.06)",
          background: `linear-gradient(135deg, ${warmCream} 0%, #fff 100%)`,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(145deg, ${accent} 0%, ${primaryDark} 100%)`,
              color: "#fff",
              boxShadow: `0 6px 16px ${accent}40`,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.15rem", color: textPrimary, letterSpacing: "-0.02em" }}>
              {title}
            </Typography>
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.82rem", color: textSecondary, mt: 0.15 }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>{children}</Box>
      {footer ? (
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderTop: "1px solid rgba(220,38,38,0.06)",
            bgcolor: warmCream,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          {footer}
        </Box>
      ) : null}
    </Box>
  );
}

function PasswordCriterion({ met, label }) {
  return (
    <Chip
      size="small"
      icon={met ? <Check sx={{ fontSize: "14px !important" }} /> : <Close sx={{ fontSize: "14px !important" }} />}
      label={label}
      sx={{
        fontFamily: fontBody,
        fontSize: "0.72rem",
        fontWeight: 600,
        height: 28,
        bgcolor: met ? "rgba(22,163,74,0.1)" : "rgba(28,25,23,0.05)",
        color: met ? successGreen : textMuted,
        border: `1px solid ${met ? "rgba(22,163,74,0.25)" : "rgba(28,25,23,0.08)"}`,
        "& .MuiChip-icon": { color: met ? successGreen : textMuted },
      }}
    />
  );
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    bgcolor: warmCream,
    fontFamily: fontBody,
    transition: "all 0.22s ease",
    "& fieldset": { borderColor: "rgba(220,38,38,0.15)", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "#FCA5A5" },
    "&.Mui-focused fieldset": {
      borderColor: primaryRed,
      borderWidth: "2px",
      boxShadow: "0 0 0 4px rgba(220,38,38,0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    fontFamily: fontBody,
    fontWeight: 500,
    color: textMuted,
    "&.Mui-focused": { color: primaryRed, fontWeight: 600 },
  },
  "& .MuiInputBase-input": { fontWeight: 500, color: textPrimary },
};

const primaryBtnSx = {
  fontFamily: fontBody,
  fontWeight: 700,
  textTransform: "none",
  borderRadius: "14px",
  px: 3,
  py: 1.25,
  background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
  color: "#fff",
  boxShadow: "0 8px 24px -4px rgba(220,38,38,0.4)",
  "&:hover": { background: `linear-gradient(135deg, ${primaryDark} 0%, #7F1D1D 100%)` },
};

export default function Settings({ user }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dloading, setDLoading] = useState(false);
  const [ploading, setPLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const applyUserToForm = useCallback((u) => {
    if (!u) return;
    setForm({
      username: u.username ?? "",
      full_name: u.full_name ?? "",
      email: u.email ?? "",
      phone: u.phone ?? "",
      address: u.address ?? "",
    });
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFetching(false);
      return;
    }
    try {
      const response = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
        headers: authHeaders(token),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCurrentUser(data.data);
        applyUserToForm(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetching(false);
    }
  }, [applyUserToForm]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user && !currentUser?.id) {
      setCurrentUser(user);
      applyUserToForm(user);
    }
  }, [user, currentUser?.id, applyUserToForm]);

  const checkPasswordCriteria = (password) => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  useEffect(() => {
    checkPasswordCriteria(newPassword);
  }, [newPassword]);

  const passwordStrength = useMemo(() => {
    const met = Object.values(passwordCriteria).filter(Boolean).length;
    return Math.round((met / 5) * 100);
  }, [passwordCriteria]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const effectiveId = currentUser?.id || user?.id;
  const roleLabel = (currentUser?.role || user?.role || "staff").replace(/_/g, " ");

  const logoutAndRedirect = () => {
    localStorage.clear();
    navigate("/");
    fetch("/api/admin/logout", { method: "GET", credentials: "include" }).catch(() => {});
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure your new password and confirmation are identical.",
        confirmButtonColor: primaryRed,
      });
      return;
    }

    if (
      !passwordCriteria.digit ||
      !passwordCriteria.length ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.special ||
      !passwordCriteria.uppercase
    ) {
      Swal.fire({
        icon: "error",
        title: "Weak password",
        text: "Enter a strong password matching all requirements.",
        confirmButtonColor: primaryRed,
      });
      return;
    }

    setPLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token || !effectiveId) {
        Swal.fire({
          icon: "error",
          title: "Not authenticated",
          text: "Please sign in again.",
          confirmButtonColor: primaryRed,
        });
        setPLoading(false);
        return;
      }

      const response = await fetch(`/api/users/${effectiveId}/password`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(token),
        body: JSON.stringify({
          current_password: oldPassword,
          new_password: newPassword,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        await Swal.fire({
          icon: "success",
          title: "Password updated",
          html: "Your password has been changed.<br/><br/>You will be signed out in a few seconds — please sign in again with your <strong>new password</strong>.",
          confirmButtonColor: primaryRed,
          timer: 4000,
          timerProgressBar: true,
          allowOutsideClick: false,
        });
        logoutAndRedirect();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: data.message || "Failed to update password.",
          confirmButtonColor: primaryRed,
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: primaryRed,
      });
    }
    setPLoading(false);
  };

  const handleUserUpdate = async () => {
    setDLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token || !effectiveId) {
        Swal.fire({
          icon: "error",
          title: "Not authenticated",
          text: "Please sign in again.",
          confirmButtonColor: primaryRed,
        });
        setDLoading(false);
        return;
      }

      const response = await fetch(`/api/users/${effectiveId}`, {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(token),
        body: JSON.stringify({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
        }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setCurrentUser(data.data);
        applyUserToForm(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
        Swal.fire({
          icon: "success",
          title: "Profile saved",
          text: data.message || "Your profile has been updated successfully.",
          confirmButtonColor: primaryRed,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: data.message || "Failed to update profile.",
          confirmButtonColor: primaryRed,
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: "Failed to update profile. Please try again.",
        confirmButtonColor: primaryRed,
      });
    }
    setDLoading(false);
  };

  const buildImageUrl = (imageUrl) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    if (imageUrl.startsWith("uploads/")) return `/${imageUrl}`;
    if (imageUrl.startsWith("/uploads/")) return imageUrl;
    return imageUrl;
  };

  return (
    <Box
      sx={{
        minHeight: "100%",
        background: `linear-gradient(180deg, ${warmCream} 0%, #FFFFFF 45%, rgba(254,226,226,0.2) 100%)`,
        mx: { xs: -1.5, sm: -2, md: -3 },
        mt: { xs: -1, sm: -1.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 3 },
        boxSizing: "border-box",
      }}
    >
      {fetching ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>
          <CircularProgress sx={{ color: primaryRed }} />
          <Typography sx={{ fontFamily: fontBody, color: textSecondary }}>Loading your settings…</Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Hero */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            sx={{
              borderRadius: "24px",
              p: { xs: 2.5, sm: 3 },
              background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 55%, #7F1D1D 100%)`,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px -12px rgba(220,38,38,0.45)",
            }}
          >
            <Box sx={{ position: "absolute", top: -30, right: -20, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Avatar
                src={buildImageUrl(currentUser?.profile_image)}
                alt={form.full_name}
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  fontFamily: fontDisplay,
                  border: "3px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  bgcolor: "rgba(255,255,255,0.15)",
                }}
              >
                {getInitials(form.full_name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 0.75 }}>
                  <Chip
                    icon={<VerifiedUser sx={{ fontSize: "16px !important", color: "rgba(255,255,255,0.9) !important" }} />}
                    label={roleLabel}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontFamily: fontBody,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      textTransform: "capitalize",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  />
                  <Chip
                    icon={<Shield sx={{ fontSize: "16px !important", color: "rgba(255,255,255,0.9) !important" }} />}
                    label="Secure account"
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.9)",
                      fontFamily: fontBody,
                      fontWeight: 600,
                      fontSize: "0.68rem",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  />
                </Stack>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.85rem" }, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  {form.full_name || "Your account"}
                </Typography>
                <Typography sx={{ fontFamily: fontBody, fontSize: "0.9rem", opacity: 0.85, mt: 0.5 }}>
                  {form.email || "Manage your profile and security preferences"}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Content grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 2.5,
              alignItems: "start",
            }}
          >
            {/* Profile */}
            <SettingsSection
              icon={<PersonIcon />}
              title="Profile"
              subtitle="Your personal information and contact details"
              delay={1}
              footer={
                <Button
                  variant="contained"
                  onClick={handleUserUpdate}
                  disabled={dloading}
                  startIcon={dloading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  sx={primaryBtnSx}
                >
                  {dloading ? "Saving…" : "Save profile"}
                </Button>
              }
            >
              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    fullWidth
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
                    label="Full name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: primaryRed, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={inputSx}
                  />
                </Box>

                <TextField
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: primaryRed, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: primaryRed, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={inputSx}
                  />
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: "14px",
                      bgcolor: warmCream,
                      border: `1px solid ${primaryLight}`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ fontFamily: fontBody, fontSize: "0.7rem", fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Role
                    </Typography>
                    <Typography sx={{ fontFamily: fontBody, fontWeight: 700, color: textPrimary, textTransform: "capitalize", mt: 0.25 }}>
                      {roleLabel}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="Address"
                  multiline
                  minRows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.5 }}>
                        <HomeIcon sx={{ color: primaryRed, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={inputSx}
                />
              </Stack>
            </SettingsSection>

            {/* Security */}
            <SettingsSection
              icon={<SecurityIcon />}
              title="Security"
              subtitle="Update your password to keep your account safe"
              accent="#991B1B"
              delay={2}
              footer={
                <Button
                  type="submit"
                  form="password-form"
                  variant="contained"
                  disabled={ploading}
                  startIcon={ploading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                  sx={primaryBtnSx}
                >
                  {ploading ? "Updating…" : "Update password"}
                </Button>
              }
            >
              <Box component="form" id="password-form" onSubmit={handlePasswordUpdate}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "16px",
                      bgcolor: warmCream,
                      border: `1px solid ${primaryLight}`,
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontFamily: fontBody, fontWeight: 700, fontSize: "0.85rem", color: primaryDark, display: "flex", alignItems: "center", gap: 0.75 }}>
                        <LockIcon sx={{ fontSize: 18 }} />
                        Password strength
                      </Typography>
                      <Typography sx={{ fontFamily: fontBody, fontSize: "0.75rem", fontWeight: 700, color: passwordStrength === 100 ? successGreen : textSecondary }}>
                        {passwordStrength}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={passwordStrength}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        mb: 1.5,
                        bgcolor: "rgba(28,25,23,0.06)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background:
                            passwordStrength === 100
                              ? `linear-gradient(90deg, ${successGreen}, #22C55E)`
                              : `linear-gradient(90deg, ${primaryRed}, ${primaryDark})`,
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      <PasswordCriterion met={passwordCriteria.length} label="8+ chars" />
                      <PasswordCriterion met={passwordCriteria.uppercase} label="Uppercase" />
                      <PasswordCriterion met={passwordCriteria.lowercase} label="Lowercase" />
                      <PasswordCriterion met={passwordCriteria.digit} label="Digit" />
                      <PasswordCriterion met={passwordCriteria.special} label="Special" />
                    </Box>
                  </Box>

                  {[
                    { key: "oldPassword", label: "Current password", value: oldPassword, setter: setOldPassword },
                    { key: "newPassword", label: "New password", value: newPassword, setter: setNewPassword },
                    { key: "confirmPassword", label: "Confirm password", value: confirmPassword, setter: setConfirmPassword },
                  ].map((field) => (
                    <TextField
                      key={field.key}
                      label={field.label}
                      type={showPasswords[field.key] ? "text" : "password"}
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      fullWidth
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: primaryRed, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showPasswords[field.key] ? "Hide" : "Show"}>
                              <IconButton
                                onClick={() => togglePasswordVisibility(field.key)}
                                edge="end"
                                sx={{ color: textMuted, "&:hover": { color: primaryRed } }}
                              >
                                {showPasswords[field.key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                      sx={inputSx}
                    />
                  ))}

                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: "14px",
                      bgcolor: "rgba(37,99,235,0.06)",
                      border: "1px solid rgba(37,99,235,0.15)",
                      display: "flex",
                      gap: 1.25,
                      alignItems: "flex-start",
                    }}
                  >
                    <Shield sx={{ fontSize: 20, color: "#2563EB", mt: 0.1, flexShrink: 0 }} />
                    <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", color: textSecondary, lineHeight: 1.55 }}>
                      Use a unique password you don&apos;t share with other sites. You&apos;ll stay signed in on this device after updating.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </SettingsSection>
          </Box>

          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            sx={{
              mt: 2.5,
              p: 2.5,
              borderRadius: "18px",
              border: `1px solid ${primaryLight}`,
              bgcolor: "#fff",
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: primaryLight,
                  color: primaryRed,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HistoryIcon />
              </Box>
              <Box>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, color: textPrimary }}>
                  Audit Trail
                </Typography>
                <Typography sx={{ fontFamily: fontBody, fontSize: "0.85rem", color: textSecondary }}>
                  Review admin portal activity and system logs.
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              onClick={() => navigate("/audit")}
              sx={{
                borderColor: primaryRed,
                color: primaryRed,
                fontFamily: fontBody,
                fontWeight: 700,
                borderRadius: "12px",
                textTransform: "none",
                "&:hover": { borderColor: primaryDark, bgcolor: primaryLight },
              }}
            >
              Open audit trail
            </Button>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
