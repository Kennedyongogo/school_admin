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
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  CalendarMonth as CalendarIcon,
  OpenInNew as OpenInNewIcon,
  School as SchoolIcon,
  Facebook as FacebookIcon,
  X as XIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
} from "@mui/icons-material";
import ElimuPlusDepartmentsTab from "./ElimuPlusDepartmentsTab";
import ElimuPlusTeachersTab from "./ElimuPlusTeachersTab";
import ElimuPlusStudentsTab from "./ElimuPlusStudentsTab";
import ElimuPlusSchoolAdminsTab from "./ElimuPlusSchoolAdminsTab";

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
    <Stack direction="row" spacing={1.1} alignItems="flex-start" sx={{ py: 0.4 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
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
        <Typography variant="caption" sx={{ color: muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </Typography>
        {content}
      </Box>
    </Stack>
  );
}

function normalizeExternalUrl(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function SocialLinkChip({ icon, label, value }) {
  const href = normalizeExternalUrl(value);
  if (!href) return null;
  return (
    <Chip
      icon={icon}
      component="a"
      clickable
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      label={label}
      variant="outlined"
      sx={{
        borderColor: `${accent}44`,
        color: accentDark,
        fontWeight: 700,
        textDecoration: "none",
        "& .MuiChip-icon": { color: accentDark },
        "&:hover": { bgcolor: `${accent}12`, borderColor: accent },
      }}
    />
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
    if (typeof t === "number" && t >= 0 && t <= 4) {
      setTab(t);
    }
  }, [location.state]);

  const logoSrc = useMemo(() => resolveAssetUrl(profile?.logo_url), [profile]);
  const socialLinks = useMemo(
    () => [
      { key: "facebook", label: "Facebook", value: profile?.facebook_url, icon: <FacebookIcon /> },
      { key: "x", label: "X", value: profile?.twitter_url, icon: <XIcon /> },
      { key: "instagram", label: "Instagram", value: profile?.instagram_url, icon: <InstagramIcon /> },
      { key: "linkedin", label: "LinkedIn", value: profile?.linkedin_url, icon: <LinkedInIcon /> },
      { key: "youtube", label: "YouTube", value: profile?.youtube_url, icon: <YouTubeIcon /> },
    ].filter((s) => String(s.value || "").trim() !== ""),
    [profile]
  );

  const fullBleed = (theme) => ({
    width: `calc(100% + ${theme.spacing(6)})`,
    maxWidth: "none",
    marginLeft: theme.spacing(-3),
    marginRight: theme.spacing(-3),
    marginTop: theme.spacing(-2.75),
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
        <Button variant="contained" startIcon={<PersonIcon />} onClick={() => navigate("/elimu-plus/teachers/create")} sx={headerButtonSx}>
          Create teacher profile
        </Button>
      );
    }
    if (tab === 3) {
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
    if (tab === 4) {
      return (
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate("/elimu-plus/school-admins/create")}
          sx={headerButtonSx}
        >
          Create school admin
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
    <Box sx={(theme) => ({ ...fullBleed(theme), pb: 2 })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 45%, #F97316 100%)`,
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.25, sm: 1.6 },
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
        <Stack spacing={1} position="relative" zIndex={1}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={2}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: { xs: "1.2rem", sm: "1.45rem" }, pt: { sm: 0.1 } }}>
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
              minHeight: 38,
              "& .MuiTab-root": {
                color: "rgba(255,255,255,0.72)",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.88rem",
                minHeight: 38,
              },
              "& .Mui-selected": {
                color: "#fff !important",
              },
            }}
          >
            <Tab label="School" disableRipple />
            <Tab label="Department" disableRipple />
            <Tab label="Teachers" disableRipple />
            <Tab label="Students" disableRipple />
            <Tab label="School Admin" disableRipple />
          </Tabs>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.75 }}>
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
                  position: "relative",
                  minHeight: { xs: 210, md: "auto" },
                  overflow: "hidden",
                }}
              >
                {logoSrc ? (
                  <Box
                    component="img"
                    src={logoSrc}
                    alt={profile?.name || "School logo"}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 84, color: "rgba(255,255,255,0.8)" }} />
                  </Box>
                )}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top left, rgba(17,24,39,0.55) 5%, rgba(17,24,39,0.22) 35%, rgba(17,24,39,0.08) 60%, rgba(17,24,39,0) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    right: 10,
                    bottom: 10,
                    zIndex: 2,
                    px: 1.2,
                    py: 0.55,
                    borderRadius: 1.5,
                    bgcolor: "rgba(17,24,39,0.5)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid rgba(255,255,255,0.24)",
                  }}
                >
                  <Typography sx={{ color: "#fff", fontWeight: 800, letterSpacing: "0.02em", fontSize: "0.85rem" }}>
                    Elimu Plus
                  </Typography>
                </Box>
              </Box>

              <CardContent sx={{ flex: 1, py: { xs: 2, md: 2.4 }, px: { xs: 2, sm: 2.6 } }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: ink, letterSpacing: "-0.02em", fontSize: { xs: "1.25rem", sm: "1.45rem" } }}>
                  {profile.name}
                </Typography>
                {profile.tagline && (
                  <Typography sx={{ mt: 0.6, color: muted, fontSize: "0.95rem", fontWeight: 500, fontStyle: "italic" }}>
                    {profile.tagline}
                  </Typography>
                )}
                {profile.description && (
                  <Typography sx={{ mt: 1.1, color: ink, lineHeight: 1.45, opacity: 0.85, fontSize: "0.93rem" }}>
                    {profile.description}
                  </Typography>
                )}

                <Divider sx={{ my: 1.6, borderColor: `${accent}22` }} />

                <Grid container spacing={0.8}>
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
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={1.1} alignItems="flex-start" sx={{ pt: 0.2 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          bgcolor: `${accent}14`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: accentDark,
                          flexShrink: 0,
                        }}
                      >
                        <LanguageIcon fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Social links
                        </Typography>
                        {socialLinks.length === 0 ? (
                          <Typography sx={{ color: ink, fontWeight: 600, fontSize: "0.95rem" }}>—</Typography>
                        ) : (
                          <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 0.45 }}>
                            {socialLinks.map((s) => (
                              <SocialLinkChip key={s.key} icon={s.icon} label={s.label} value={s.value} />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Stack>
          </Card>
        )}

        <ElimuPlusDepartmentsTab ref={deptPanelRef} active={tab === 1} />
        <ElimuPlusTeachersTab active={tab === 2} />
        <ElimuPlusStudentsTab active={tab === 3} />
        <ElimuPlusSchoolAdminsTab active={tab === 4} />
      </Box>
    </Box>
  );
}
