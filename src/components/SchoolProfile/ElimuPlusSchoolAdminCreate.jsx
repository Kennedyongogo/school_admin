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
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authHeaders,
  authMultipartHeaders,
  inputSx,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryBtnSx,
  ghostBtnSx,
} from "./elimuPlusShared";
import { ElimuPlusHero, FormSection } from "./elimuPlusUi";

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

  useEffect(() => {
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
      const res = await fetch("/api/school-admins/users-without-profile", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && Array.isArray(data.data)) {
        setEligibleUsers(data.data);
      } else {
        setEligibleUsers([]);
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
        confirmButtonColor: primaryRed,
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
    <Box component="form" onSubmit={handleSubmit} sx={{ ...pageShellSx, minHeight: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back to Elimu Plus">
          <IconButton onClick={goBack} aria-label="Back" sx={{ bgcolor: "#fff", border: "1px solid rgba(220,38,38,0.12)", "&:hover": { bgcolor: "#FEE2E2" } }}>
            <ArrowBackIcon sx={{ color: primaryDark }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <ElimuPlusHero
        title="Create school admin profile"
        subtitle="Choose an existing user account (no admin profile yet), set admin type, and optional profile photo."
        icon={<PersonIcon sx={{ fontSize: 26, color: "#fff" }} />}
      />

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {pageLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormSection title="Profile photo">
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || undefined} sx={{ width: 72, height: 72, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}>
                    {!profilePhotoPreview ? <PersonIcon /> : null}
                  </Avatar>
                  <Button variant="outlined" component="label" sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}>
                    Choose photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </Button>
                  {profilePhoto ? (
                    <Button size="small" type="button" onClick={() => setProfilePhoto(null)} sx={{ fontWeight: 600, textTransform: "none" }}>
                      Remove
                    </Button>
                  ) : null}
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="User account">
                <Stack spacing={2}>
                  <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                    The person already has a user account. Choose a user that does not yet have a school admin profile below.
                  </Typography>
                  <FormControl fullWidth required variant="outlined" sx={inputSx}>
                    <InputLabel id="eligible-user-label">User (no admin profile yet)</InputLabel>
                    <Select
                      labelId="eligible-user-label"
                      label="User (no admin profile yet)"
                      value={form.link_user_id}
                      onChange={(e) => setForm({ ...form, link_user_id: e.target.value })}
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
                  {eligibleUsers.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: "14px" }}>
                      No users without a school admin profile. Create a user first under User management, then return here.
                    </Alert>
                  ) : null}
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Admin type">
                <FormControl fullWidth required variant="outlined" sx={inputSx}>
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
              </FormSection>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null} sx={primaryBtnSx}>
              {saving ? "Creating…" : "Create school admin profile"}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
