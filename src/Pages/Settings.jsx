import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
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
} from "@mui/icons-material";

// Elimu Plus — align with LoginPage red palette
const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";
const textPrimary = "#1F2937";
const textSecondary = "#6B7280";
const successGreen = "#16A34A";
const failRed = "#DC2626";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

export default function Settings({ user }) {
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
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const [dloading, setDLoading] = useState(false);
  const [ploading, setPLoading] = useState(false);
  const [usr, setUsr] = useState(false);
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const effectiveId = currentUser?.id || user?.id;

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setUsr(false);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setSeverity("error");
      return;
    }

    if (
      !passwordCriteria.digit ||
      !passwordCriteria.length ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.special ||
      !passwordCriteria.uppercase
    ) {
      setMessage("Enter a strong password matching all requirements.");
      setSeverity("error");
      return;
    }

    setPLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token || !effectiveId) {
        setMessage("Not authenticated");
        setSeverity("error");
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
        setMessage(data.message || "Password updated successfully.");
        setSeverity("success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.message || "Failed to update password.");
        setSeverity("error");
      }
    } catch (error) {
      setMessage("Failed to update password.");
      setSeverity("error");
    }
    setPLoading(false);
  };

  const handleUserUpdate = async () => {
    setDLoading(true);
    setUsr(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      if (!token || !effectiveId) {
        setMessage("Not authenticated");
        setSeverity("error");
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
        setMessage(data.message || "Profile updated successfully.");
        setSeverity("success");
      } else {
        setMessage(data.message || "Failed to update profile.");
        setSeverity("error");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage("Failed to update profile.");
      setSeverity("error");
    }
    setDLoading(false);
  };

  const labelSx = {
    color: primaryDark,
    fontWeight: 600,
    "&.Mui-focused": { color: primaryRed },
  };

  const outlinedSx = {
    width: "100%",
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
  };

  const roleLabel = currentUser?.role || user?.role || "";

  /** Full width of the main content column (cancels PageRoutes `main` padding `p: 3`). */
  const fullMainBleedSx = (theme) => ({
    width: `calc(100% + ${theme.spacing(6)})`,
    maxWidth: "none",
    marginLeft: theme.spacing(-3),
    marginRight: theme.spacing(-3),
    boxSizing: "border-box",
  });

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        /** Pull up into `main`’s default padding so less gap under the fixed top bar. */
        marginTop: theme.spacing(-2.5),
        marginBottom: "1px",
        marginLeft: `calc(${theme.spacing(-3)} + 1px)`,
        marginRight: `calc(${theme.spacing(-3)} + 1px)`,
        width: `calc(100% + ${theme.spacing(6)} - 2px)`,
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.25 },
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: "rgba(255,255,255,0.12)",
            borderRadius: "50%",
          }}
        />
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          position="relative"
          zIndex={1}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: "1.35rem", sm: "2rem" } }}>
              Account settings
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92 }}>
              Profile and security — synced with Elimu Plus
            </Typography>
          </Box>
          <Chip
            icon={<PersonIcon sx={{ color: "white !important" }} />}
            label={roleLabel.replace(/_/g, " ") || "Staff"}
            sx={{
              bgcolor: "rgba(255,255,255,0.22)",
              color: "white",
              fontWeight: 700,
              borderRadius: 2,
              textTransform: "capitalize",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ width: "100%", py: { xs: 1, sm: 2 } }}>
        {fetching ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress sx={{ color: primaryRed }} />
          </Box>
        ) : (
          <Stack spacing={0} sx={{ width: "100%" }}>
            {/* 1) Profile — edge-to-edge of main column; inputs full width */}
            <Card
              elevation={0}
              sx={{
                width: "100%",
                borderRadius: 0,
                border: "none",
                borderBottom: `1px solid ${primaryLight}`,
                boxShadow: "none",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
                <CardHeader
                  sx={{
                    background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                    color: "white",
                    py: 2,
                    px: { xs: 2, sm: 3 },
                  }}
                  title={
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.2)",
                          display: "flex",
                        }}
                      >
                        <PersonIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          Profile
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          Name, username, contact — from your account
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <CardContent
                  sx={{
                    flex: 1,
                    pt: 3,
                    pb: 2,
                    width: "100%",
                    boxSizing: "border-box",
                    px: { xs: 2, sm: 3 },
                  }}
                >
                  <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                    <FormControl fullWidth sx={{ width: "100%" }}>
                      <InputLabel sx={labelSx}>Username</InputLabel>
                      <OutlinedInput
                        fullWidth
                        label="Username"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        startAdornment={
                          <Box sx={{ mr: 1, color: primaryRed }}>
                            <BadgeIcon fontSize="small" />
                          </Box>
                        }
                        sx={outlinedSx}
                      />
                    </FormControl>
                    <FormControl fullWidth sx={{ width: "100%" }}>
                      <InputLabel sx={labelSx}>Full name</InputLabel>
                      <OutlinedInput
                        fullWidth
                        label="Full name"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        startAdornment={
                          <Box sx={{ mr: 1, color: primaryRed }}>
                            <PersonIcon fontSize="small" />
                          </Box>
                        }
                        sx={outlinedSx}
                      />
                    </FormControl>
                    <FormControl fullWidth sx={{ width: "100%" }}>
                      <InputLabel sx={labelSx}>Email</InputLabel>
                      <OutlinedInput
                        fullWidth
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        startAdornment={
                          <Box sx={{ mr: 1, color: primaryRed }}>
                            <EmailIcon fontSize="small" />
                          </Box>
                        }
                        sx={outlinedSx}
                      />
                    </FormControl>
                    <FormControl fullWidth sx={{ width: "100%" }}>
                      <InputLabel sx={labelSx}>Phone</InputLabel>
                      <OutlinedInput
                        fullWidth
                        label="Phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        startAdornment={
                          <Box sx={{ mr: 1, color: primaryRed }}>
                            <PhoneIcon fontSize="small" />
                          </Box>
                        }
                        sx={outlinedSx}
                      />
                    </FormControl>
                    <FormControl fullWidth sx={{ width: "100%" }}>
                      <InputLabel sx={labelSx}>Address</InputLabel>
                      <OutlinedInput
                        fullWidth
                        label="Address"
                        multiline
                        minRows={2}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        startAdornment={
                          <Box sx={{ mr: 1, color: primaryRed, alignSelf: "flex-start", mt: 1 }}>
                            <HomeIcon fontSize="small" />
                          </Box>
                        }
                        sx={outlinedSx}
                      />
                    </FormControl>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: primaryLight,
                        border: `1px solid #FECACA`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 600 }}>
                        Role (read-only)
                      </Typography>
                      <Typography variant="body2" sx={{ color: textPrimary, fontWeight: 700, textTransform: "capitalize" }}>
                        {roleLabel.replace(/_/g, " ") || "—"}
                      </Typography>
                    </Box>

                    {usr && message && (
                      <Alert severity={severity} sx={{ borderRadius: 2 }}>
                        {message}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
                <Divider />
                <CardActions
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2.5,
                    justifyContent: "flex-end",
                    bgcolor: backgroundLight,
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={handleUserUpdate}
                    disabled={dloading}
                    startIcon={dloading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{
                      bgcolor: primaryRed,
                      color: "white",
                      fontWeight: 700,
                      textTransform: "none",
                      borderRadius: 2,
                      px: 3,
                      boxShadow: `0 4px 14px ${primaryRed}44`,
                      "&:hover": { bgcolor: primaryDark },
                    }}
                  >
                    {dloading ? "Saving…" : "Save profile"}
                  </Button>
                </CardActions>
              </Card>

            {/* 2) Security — full width below profile */}
            <form onSubmit={handlePasswordUpdate} style={{ width: "100%" }}>
              <Card
                elevation={0}
                sx={{
                  width: "100%",
                  borderRadius: 0,
                  border: "none",
                  boxShadow: "none",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                  <CardHeader
                    sx={{
                      background: `linear-gradient(135deg, #991B1B 0%, ${primaryDark} 100%)`,
                      color: "white",
                      py: 2,
                      px: { xs: 2, sm: 3 },
                    }}
                    title={
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: "50%",
                            bgcolor: "rgba(255,255,255,0.2)",
                            display: "flex",
                          }}
                        >
                          <SecurityIcon />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            Security
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>
                            Change your password securely
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <CardContent
                    sx={{
                      flex: 1,
                      pt: 3,
                      pb: 2,
                      width: "100%",
                      boxSizing: "border-box",
                      px: { xs: 2, sm: 3 },
                    }}
                  >
                    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                      <Box
                        sx={{
                          bgcolor: primaryLight,
                          borderRadius: 2,
                          p: 2,
                          border: `1px solid #FECACA`,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primaryDark, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                          <LockIcon fontSize="small" />
                          Password requirements
                        </Typography>
                        <List dense disablePadding>
                          {[
                            { key: "length", text: "At least 8 characters" },
                            { key: "uppercase", text: "One uppercase letter" },
                            { key: "lowercase", text: "One lowercase letter" },
                            { key: "digit", text: "One digit" },
                            { key: "special", text: "One special character" },
                          ].map(({ key, text }) => (
                            <ListItem key={key} sx={{ py: 0.35, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                {passwordCriteria[key] ? (
                                  <Check sx={{ color: successGreen }} fontSize="small" />
                                ) : (
                                  <Close sx={{ color: failRed }} fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={text}
                                primaryTypographyProps={{
                                  fontSize: "0.8rem",
                                  color: passwordCriteria[key] ? successGreen : textSecondary,
                                  fontWeight: passwordCriteria[key] ? 600 : 400,
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <FormControl fullWidth sx={{ width: "100%" }}>
                        <InputLabel sx={labelSx}>Current password</InputLabel>
                        <OutlinedInput
                          fullWidth
                          label="Current password"
                          type={showPasswords.oldPassword ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          startAdornment={
                            <Box sx={{ mr: 1, color: primaryRed }}>
                              <LockIcon fontSize="small" />
                            </Box>
                          }
                          endAdornment={
                            <Tooltip title={showPasswords.oldPassword ? "Hide" : "Show"}>
                              <IconButton onClick={() => togglePasswordVisibility("oldPassword")} sx={{ color: primaryRed }}>
                                {showPasswords.oldPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                          }
                          sx={outlinedSx}
                        />
                      </FormControl>

                      <FormControl fullWidth sx={{ width: "100%" }}>
                        <InputLabel sx={labelSx}>New password</InputLabel>
                        <OutlinedInput
                          fullWidth
                          label="New password"
                          type={showPasswords.newPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          startAdornment={
                            <Box sx={{ mr: 1, color: primaryRed }}>
                              <LockIcon fontSize="small" />
                            </Box>
                          }
                          endAdornment={
                            <Tooltip title={showPasswords.newPassword ? "Hide" : "Show"}>
                              <IconButton onClick={() => togglePasswordVisibility("newPassword")} sx={{ color: primaryRed }}>
                                {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                          }
                          sx={outlinedSx}
                        />
                      </FormControl>

                      <FormControl fullWidth sx={{ width: "100%" }}>
                        <InputLabel sx={labelSx}>Confirm password</InputLabel>
                        <OutlinedInput
                          fullWidth
                          label="Confirm password"
                          type={showPasswords.confirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (e.target.value && e.target.value !== newPassword) {
                              setMessage("Passwords do not match");
                              setSeverity("error");
                            } else if (!usr) setMessage(null);
                          }}
                          startAdornment={
                            <Box sx={{ mr: 1, color: primaryRed }}>
                              <LockIcon fontSize="small" />
                            </Box>
                          }
                          endAdornment={
                            <Tooltip title={showPasswords.confirmPassword ? "Hide" : "Show"}>
                              <IconButton onClick={() => togglePasswordVisibility("confirmPassword")} sx={{ color: primaryRed }}>
                                {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </Tooltip>
                          }
                          sx={outlinedSx}
                        />
                      </FormControl>

                      {!usr && message && (
                        <Alert severity={severity} sx={{ borderRadius: 2 }}>
                          {message}
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                  <Divider />
                  <CardActions
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: 2.5,
                      justifyContent: "flex-end",
                      bgcolor: backgroundLight,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={ploading}
                      startIcon={ploading ? <CircularProgress size={18} color="inherit" /> : <SecurityIcon />}
                      sx={{
                        bgcolor: primaryRed,
                        color: "white",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        px: 3,
                        boxShadow: `0 4px 14px ${primaryRed}44`,
                        "&:hover": { bgcolor: primaryDark },
                      }}
                    >
                      {ploading ? "Updating…" : "Update password"}
                    </Button>
                  </CardActions>
                </Card>
              </form>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
