import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Grid,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  CalendarMonth as CalendarIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import ElimuPlusDepartmentsTab from "./ElimuPlusDepartmentsTab";
import ElimuPlusStudentsTab from "./ElimuPlusStudentsTab";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const accent = "#DC2626";
const accentDark = "#B91C1C";
const ink = "#111827";
const muted = "#6B7280";

function resolveAssetUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function DetailRow({ icon, label, value, href }) {
  const content =
    href && value ? (
      <Typography
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: accent,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          "&:hover": { textDecoration: "underline" },
        }}
      >
        {value}
        <OpenInNewIcon sx={{ fontSize: 14 }} />
      </Typography>
    ) : (
      <Typography sx={{ color: ink, fontWeight: 600, fontSize: "0.95rem" }}>
        {value && String(value).trim() ? value : "—"}
      </Typography>
    );

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${accent}14`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentDark,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </Typography>
        {content}
      </Box>
    </Stack>
  );
}

const headerButtonSx = {
  bgcolor: "rgba(255,255,255,0.95)",
  color: accentDark,
  fontWeight: 700,
  textTransform: "none",
  borderRadius: 2,
  px: 3,
  py: 1.25,
  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
  "&:hover": { bgcolor: "#fff", color: accent },
};

const primarySolidButtonSx = {
  bgcolor: accent,
  color: "#fff",
  fontWeight: 700,
  textTransform: "none",
  borderRadius: 2,
  px: 3,
  py: 1.25,
  boxShadow: `0 4px 14px ${accent}55`,
  "&:hover": { bgcolor: accentDark, color: "#fff" },
};

export default function ElimuPlusSchoolProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const deptPanelRef = useRef(null);
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/school-profile/admin", {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load profile (${res.status})`);
      }
      setProfile(data.data ?? null);
    } catch (e) {
      setError(e.message || "Failed to load school profile.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const t = location.state?.tab;
    if (typeof t === "number" && t >= 0 && t <= 2) {
      setTab(t);
    }
  }, [location.state]);

  const logoSrc = useMemo(() => resolveAssetUrl(profile?.logo_url), [profile]);

  const fullBleed = (theme) => ({
    width: `calc(100% + ${theme.spacing(6)})`,
    maxWidth: "none",
    marginLeft: theme.spacing(-3),
    marginRight: theme.spacing(-3),
    marginTop: theme.spacing(-1),
    boxSizing: "border-box",
  });

  const renderHeaderActions = () => {
    if (tab === 0) {
      if (!profile) {
        return (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/elimu-plus/create")} sx={primarySolidButtonSx}>
            Create school profile
          </Button>
        );
      }
      return (
        <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate("/elimu-plus/edit")} sx={headerButtonSx}>
          Edit profile
        </Button>
      );
    }
    if (tab === 1) {
      return (
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => deptPanelRef.current?.openCreateDialog()} sx={headerButtonSx}>
          Add department
        </Button>
      );
    }
    if (tab === 2) {
      return (
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate("/elimu-plus/students/create")}
          sx={headerButtonSx}
        >
          Create student
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: accent }} />
      </Box>
    );
  }

  return (
    <Box sx={(theme) => ({ ...fullBleed(theme), pb: 4 })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 45%, #F97316 100%)`,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: 0,
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 12px 40px ${accent}44`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.15,
            backgroundImage: `radial-gradient(circle at 20% 20%, #fff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
        <Stack spacing={1.5} position="relative" zIndex={1}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em", pt: { sm: 0.25 } }}>
              Elimu Plus
            </Typography>
            <Box sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>{renderHeaderActions()}</Box>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: { bgcolor: "#fff", height: 3, borderRadius: "3px 3px 0 0" },
            }}
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                color: "rgba(255,255,255,0.72)",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.95rem",
                minHeight: 44,
              },
              "& .Mui-selected": {
                color: "#fff !important",
              },
            }}
          >
            <Tab label="School" disableRipple />
            <Tab label="Department" disableRipple />
            <Tab label="Students" disableRipple />
          </Tabs>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {tab === 0 && profile && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid rgba(220,38,38,0.12)`,
              boxShadow: "0 24px 48px -24px rgba(17,24,39,0.25), 0 0 0 1px rgba(255,255,255,0.08) inset",
              bgcolor: "#fff",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} alignItems="stretch">
              <Box
                sx={{
                  flex: { xs: "none", md: "0 0 340px" },
                  background: `linear-gradient(165deg, ${accentDark} 0%, ${accent} 55%, #FB923C 100%)`,
                  p: { xs: 3, md: 4 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  minHeight: { xs: 240, md: "auto" },
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 45%)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  sx={{
                    width: { xs: 140, md: 168 },
                    height: { xs: 140, md: 168 },
                    borderRadius: 4,
                    bgcolor: "rgba(255,255,255,0.97)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
                    border: "4px solid rgba(255,255,255,0.35)",
                    overflow: "hidden",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {logoSrc ? (
                    <Box component="img" src={logoSrc} alt={profile?.name || "School logo"} sx={{ width: "88%", height: "88%", objectFit: "contain" }} />
                  ) : (
                    <SchoolIcon sx={{ fontSize: 72, color: accent }} />
                  )}
                </Box>
                {profile?.short_name && (
                  <Chip
                    label={profile.short_name}
                    sx={{
                      mt: 2,
                      bgcolor: "rgba(255,255,255,0.22)",
                      color: "#fff",
                      fontWeight: 700,
                      backdropFilter: "blur(8px)",
                    }}
                  />
                )}
              </Box>

              <CardContent sx={{ flex: 1, py: { xs: 3, md: 4 }, px: { xs: 2.5, sm: 4 } }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: ink, letterSpacing: "-0.02em" }}>
                  {profile.name}
                </Typography>
                {profile.tagline && (
                  <Typography sx={{ mt: 1, color: muted, fontSize: "1.05rem", fontWeight: 500, fontStyle: "italic" }}>
                    {profile.tagline}
                  </Typography>
                )}
                {profile.description && (
                  <Typography sx={{ mt: 2, color: ink, lineHeight: 1.7, opacity: 0.85 }}>
                    {profile.description}
                  </Typography>
                )}

                <Divider sx={{ my: 3, borderColor: `${accent}22` }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <DetailRow icon={<EmailIcon fontSize="small" />} label="Email" value={profile.email} href={profile.email ? `mailto:${profile.email}` : undefined} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={profile.phone} href={profile.phone ? `tel:${profile.phone}` : undefined} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailRow icon={<PhoneIcon fontSize="small" />} label="Alternate phone" value={profile.alternate_phone} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailRow
                      icon={<LanguageIcon fontSize="small" />}
                      label="Website"
                      value={profile.website}
                      href={profile.website?.startsWith("http") ? profile.website : profile.website ? `https://${profile.website}` : undefined}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <DetailRow
                      icon={<LocationIcon fontSize="small" />}
                      label="Address"
                      value={[profile.address, profile.city, profile.state, profile.postal_code, profile.country].filter(Boolean).join(", ")}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailRow icon={<CalendarIcon fontSize="small" />} label="Founded" value={profile.founded_year != null ? String(profile.founded_year) : ""} />
                  </Grid>
                </Grid>
              </CardContent>
            </Stack>
          </Card>
        )}

        <ElimuPlusDepartmentsTab ref={deptPanelRef} active={tab === 1} />
        <ElimuPlusStudentsTab active={tab === 2} />
      </Box>
    </Box>
  );
}
