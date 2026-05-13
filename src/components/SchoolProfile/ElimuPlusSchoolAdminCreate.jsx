import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const authMultipartHeaders = (token) => ({
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

const adminTypes = [
  { value: "super_admin", label: "Super Admin" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin_staff", label: "Admin Staff" },
];

export default function ElimuPlusSchoolAdminCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [form, setForm] = useState({
    link_user_id: "",
    admin_type: "",
  });

  const goBack = () => navigate("/elimu-plus", { state: { tab: 4 } });

  React.useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhoto]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    setError(null);
    try {
      console.log('Fetching from endpoint: /api/admins/users-without-profile');
      const res = await fetch("/api/school-admins/users-without-profile", { headers: authHeaders(token) });
      console.log('Response status:', res.status);
      const data = await res.json().catch(() => ({}));
      console.log('Response data:', data);
      if (res.ok && data.success && Array.isArray(data.data)) {
        setEligibleUsers(data.data);
        console.log('Eligible users set:', data.data);
      } else {
        setEligibleUsers([]);
        console.log('No eligible users or error');
      }
    } catch (e) {
      setError(e.message || "Could not load form data.");
      setEligibleUsers([]);
    } finally {
      setPageLoading(false);
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
      setError("Please sign in again.");
      return;
    }
    if (!form.link_user_id || !form.admin_type) {
      setError("Select a user and admin type.");
      return;
    }

    setSaving(true);
    try {
      let res;
      if (profilePhoto) {
        const fd = new FormData();
        fd.append("profile_picture", profilePhoto);
        fd.append("user_id", form.link_user_id);
        fd.append("admin_type", form.admin_type);
        res = await fetch("/api/school-admins", {
          method: "POST",
          headers: authMultipartHeaders(token),
          body: fd,
        });
      } else {
        res = await fetch("/api/school-admins", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            user_id: form.link_user_id,
            admin_type: form.admin_type,
          }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create school admin.");
      }
      await Swal.fire({
        icon: "success",
        title: "School admin profile created",
        text: data.data?.user?.full_name ? `${data.data.user.full_name} can sign in as admin.` : undefined,
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/elimu-plus", { replace: true, state: { tab: 4 } });
    } catch (err) {
      setError(err.message || "Create failed.");
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
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #EF4444 100%)`,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          color: "white",
          boxShadow: `0 8px 24px ${accent}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to Elimu Plus">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to Elimu Plus"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <PersonIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create school admin profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Choose an existing user account (no admin profile yet), set admin type, and optional profile photo.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, width: "100%", boxSizing: "border-box" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {pageLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <Card
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: 2,
              border: `1px solid ${accentLight}`,
              boxShadow: `0 8px 28px -12px ${accent}33`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Profile photo (school admin record)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || undefined} sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}>
                    {!profilePhotoPreview ? <PersonIcon /> : null}
                  </Avatar>
                  <Button variant="outlined" component="label" sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Choose photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </Button>
                  {profilePhoto && (
                    <Button size="small" type="button" onClick={() => setProfilePhoto(null)}>
                      Remove
                    </Button>
                  )}
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  User account
                </Typography>
                <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                  The person already has a user account. Choose every user that does not yet have a school admin profile below.
                </Typography>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel id="eligible-user-label">User (no admin profile yet)</InputLabel>
                  <Select
                    labelId="eligible-user-label"
                    label="User (no admin profile yet)"
                    value={form.link_user_id}
                    onChange={(e) => setForm({ ...form, link_user_id: e.target.value })}
                    onOpen={() => console.log('Opening dropdown, eligibleUsers:', eligibleUsers)}
                  >
                    <MenuItem value="">
                      <em>Select…</em>
                    </MenuItem>
                    {eligibleUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {eligibleUsers.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No users without a school admin profile. Create a user first under User management, then return here.
                  </Alert>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Admin type
                </Typography>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel id="admin-type-label">Admin type</InputLabel>
                  <Select
                    labelId="admin-type-label"
                    label="Admin type"
                    value={form.admin_type}
                    onChange={(e) => setForm({ ...form, admin_type: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Select…</em>
                    </MenuItem>
                    {adminTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} /> : null}
                    sx={{
                      px: 4,
                      py: 1.25,
                      fontWeight: 700,
                      bgcolor: accent,
                      "&:hover": { bgcolor: accentDark },
                    }}
                  >
                    {saving ? "Creating…" : "Create School Admin Profile"}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}