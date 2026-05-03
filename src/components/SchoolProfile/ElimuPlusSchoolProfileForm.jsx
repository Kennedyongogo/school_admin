import React, { useCallback, useEffect, useState } from "react";
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
import { ArrowBack as ArrowBackIcon, School as SchoolIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeadersMultipart = (token) => ({
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

const EDIT_FIELD_DEFAULTS = {
  name: "",
  short_name: "",
  tagline: "",
  description: "",
  founded_year: "",
  email: "",
  phone: "",
  alternate_phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  postal_code: "",
  website: "",
  facebook_url: "",
  twitter_url: "",
  instagram_url: "",
  linkedin_url: "",
  youtube_url: "",
  logo_url: "",
};

function profileToForm(p) {
  if (!p) return { ...EDIT_FIELD_DEFAULTS };
  return {
    name: p.name ?? "",
    short_name: p.short_name ?? "",
    tagline: p.tagline ?? "",
    description: p.description ?? "",
    founded_year: p.founded_year != null ? String(p.founded_year) : "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    alternate_phone: p.alternate_phone ?? "",
    address: p.address ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    country: p.country ?? "",
    postal_code: p.postal_code ?? "",
    website: p.website ?? "",
    facebook_url: p.facebook_url ?? "",
    twitter_url: p.twitter_url ?? "",
    instagram_url: p.instagram_url ?? "",
    linkedin_url: p.linkedin_url ?? "",
    youtube_url: p.youtube_url ?? "",
    logo_url: p.logo_url ?? "",
  };
}

function formToPayload(form) {
  const py = {};
  const skipKeys = new Set(["logo_url"]);
  const intYear = parseInt(form.founded_year, 10);
  for (const [k, v] of Object.entries(form)) {
    if (skipKeys.has(k)) continue;
    if (k === "founded_year") {
      if (form.founded_year !== "" && !Number.isNaN(intYear)) py.founded_year = intYear;
      else if (form.founded_year === "") py.founded_year = null;
      continue;
    }
    const trimmed = typeof v === "string" ? v.trim() : v;
    py[k] = trimmed === "" ? null : trimmed;
  }
  return py;
}

const labelSx = {
  color: primaryDark,
  fontWeight: 600,
  "&.Mui-focused": { color: primaryRed },
};

/** Match UsersCreate.jsx outlined inputs */
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

function SectionTitle({ children, first }) {
  return (
    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primaryDark, pt: first ? 0 : 2.5 }}>
      {children}
    </Typography>
  );
}

export default function ElimuPlusSchoolProfileForm({ mode }) {
  const navigate = useNavigate();
  const isCreate = mode === "create";
  const [form, setForm] = useState(() => ({ ...EDIT_FIELD_DEFAULTS }));
  const [loadingProfile, setLoadingProfile] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoDraft, setLogoDraft] = useState(null);
  const [logoDraftPreviewUrl, setLogoDraftPreviewUrl] = useState(null);

  const goBack = () => navigate("/elimu-plus");

  useEffect(() => {
    if (!logoDraft) {
      setLogoDraftPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(logoDraft);
    setLogoDraftPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoDraft]);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setError(null);
    try {
      const res = await fetch("/api/school-profile/admin", {
        headers: authHeadersMultipart(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load profile (${res.status})`);
      }
      if (!data.data) {
        navigate("/elimu-plus/create", { replace: true });
        return;
      }
      setForm(profileToForm(data.data));
      setLogoDraft(null);
    } catch (e) {
      setError(e.message || "Failed to load school profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (isCreate) {
      setForm({ ...EDIT_FIELD_DEFAULTS });
      setLogoDraft(null);
      setLoadingProfile(false);
      return;
    }
    loadProfile();
  }, [isCreate, loadProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    if (isCreate) {
      if (!form.email?.trim() || !form.phone?.trim() || !form.address?.trim() || !form.city?.trim()) {
        setError("Email, phone, address, and city are required.");
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      const payload = formToPayload(form);
      for (const [key, value] of Object.entries(payload)) {
        if (value === null || value === undefined) fd.append(key, "");
        else fd.append(key, typeof value === "number" ? String(value) : String(value));
      }
      if (logoDraft) fd.append("school_logo", logoDraft);

      const res = await fetch("/api/school-profile/", {
        method: "PUT",
        headers: authHeadersMultipart(token),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not save profile.");
      }

      await Swal.fire({
        icon: "success",
        title: isCreate ? "School profile created" : "School profile updated",
        text: data.data?.name ? `${data.data.name} saved.` : "Changes saved.",
        timer: 1800,
        showConfirmButton: false,
      });

      navigate("/elimu-plus", { replace: true });
    } catch (err) {
      setError(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!isCreate && loadingProfile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  const mainLogoSrc = logoDraftPreviewUrl || form.logo_url || null;

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
          <Tooltip title="Back to Elimu Plus">
            <IconButton
              onClick={goBack}
              aria-label="Back"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <SchoolIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {isCreate ? "Create school profile" : "Edit school profile"}
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
              <SectionTitle first>Identity</SectionTitle>
              <TextField label="School name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={outlinedFieldSx} />
              <TextField
                label="Short name"
                fullWidth
                value={form.short_name}
                onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                placeholder="e.g. CIS"
                sx={outlinedFieldSx}
              />
              <TextField label="Tagline" fullWidth value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} sx={outlinedFieldSx} />
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Founded year"
                fullWidth
                value={form.founded_year}
                onChange={(e) => setForm({ ...form, founded_year: e.target.value })}
                inputProps={{ inputMode: "numeric" }}
                sx={outlinedFieldSx}
              />

              <SectionTitle>Contact & location</SectionTitle>
              <TextField
                label="Email"
                fullWidth
                required={isCreate}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Phone"
                fullWidth
                required={isCreate}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Alternate phone"
                fullWidth
                value={form.alternate_phone}
                onChange={(e) => setForm({ ...form, alternate_phone: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="Address"
                fullWidth
                required={isCreate}
                multiline
                minRows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField
                label="City"
                fullWidth
                required={isCreate}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                sx={outlinedFieldSx}
              />
              <TextField label="State / County" fullWidth value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="Country" fullWidth value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="Postal code" fullWidth value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} sx={outlinedFieldSx} />

              <SectionTitle>Web & branding</SectionTitle>
              <TextField
                label="Website URL"
                fullWidth
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                sx={outlinedFieldSx}
              />

              <Typography variant="caption" sx={{ color: primaryDark, fontWeight: 700, display: "block" }}>
                School logo
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ pt: 0.5 }}>
                {mainLogoSrc ? (
                  <Box
                    component="img"
                    src={mainLogoSrc}
                    alt="School logo preview"
                    sx={{
                      maxHeight: 56,
                      maxWidth: 200,
                      objectFit: "contain",
                      borderRadius: 1,
                      border: `1px solid ${primaryLight}`,
                      bgcolor: "rgba(255,255,255,0.95)",
                    }}
                  />
                ) : null}
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}
                >
                  {logoDraft ? "Replace logo" : mainLogoSrc ? "Change logo" : "Upload logo"}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setLogoDraft(f);
                      e.target.value = "";
                    }}
                  />
                </Button>
                {logoDraft ? (
                  <Button type="button" size="small" onClick={() => setLogoDraft(null)} sx={{ fontWeight: 600 }}>
                    Discard new file
                  </Button>
                ) : null}
              </Stack>
              <TextField label="Facebook URL" fullWidth value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="Twitter / X URL" fullWidth value={form.twitter_url} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="Instagram URL" fullWidth value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="LinkedIn URL" fullWidth value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} sx={outlinedFieldSx} />
              <TextField label="YouTube URL" fullWidth value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} sx={outlinedFieldSx} />

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
                  {saving ? "Saving…" : isCreate ? "Create profile" : "Save changes"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
