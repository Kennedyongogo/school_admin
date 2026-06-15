import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Grid,
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
  School as SchoolIcon,
  Facebook as FacebookIcon,
  X as XIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  AutoStories as AutoStoriesIcon,
} from "@mui/icons-material";
import ElimuPlusDepartmentsTab from "./ElimuPlusDepartmentsTab";
import ElimuPlusTeachersTab from "./ElimuPlusTeachersTab";
import ElimuPlusStudentsTab from "./ElimuPlusStudentsTab";
import ElimuPlusSchoolAdminsTab from "./ElimuPlusSchoolAdminsTab";
import ElimuPlusServicesTab from "./ElimuPlusServicesTab";
import ElimuPlusReviewsTab from "./ElimuPlusReviewsTab";
import {
  authHeaders,
  ELIMU_TABS,
  elimuViewportSx,
  resolveAssetUrl,
  normalizeExternalUrl,
  pageShellSx,
  primaryRed,
  primaryDark,
  warmCream,
  textPrimary,
  textSecondary,
  textMuted,
  fontBody,
  fontDisplay,
} from "./elimuPlusShared";
import {
  ElimuPlusHero,
  ElimuPlusTabs,
  HeroActionButton,
  DetailField,
  SocialLinkChip,
} from "./elimuPlusUi";

export default function ElimuPlusSchoolProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const deptPanelRef = useRef(null);
  const servicesPanelRef = useRef(null);
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
      const res = await fetch("/api/school-profile/admin", { headers: authHeaders(token) });
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
    if (typeof t === "number" && t >= 0 && t <= 6) {
      setTab(t);
    }
  }, [location.state]);

  const logoSrc = useMemo(() => resolveAssetUrl(profile?.logo_url), [profile]);
  const addressLine = useMemo(
    () => [profile?.address, profile?.city, profile?.state, profile?.postal_code, profile?.country].filter(Boolean).join(", "),
    [profile]
  );
  const websiteHref = useMemo(() => {
    if (!profile?.website?.trim()) return undefined;
    return normalizeExternalUrl(profile.website);
  }, [profile]);
  const socialLinks = useMemo(
    () =>
      [
        { key: "facebook", label: "Facebook", value: profile?.facebook_url, icon: <FacebookIcon fontSize="small" /> },
        { key: "x", label: "X", value: profile?.twitter_url, icon: <XIcon fontSize="small" /> },
        { key: "instagram", label: "Instagram", value: profile?.instagram_url, icon: <InstagramIcon fontSize="small" /> },
        { key: "linkedin", label: "LinkedIn", value: profile?.linkedin_url, icon: <LinkedInIcon fontSize="small" /> },
        { key: "youtube", label: "YouTube", value: profile?.youtube_url, icon: <YouTubeIcon fontSize="small" /> },
      ].filter((s) => String(s.value || "").trim() !== ""),
    [profile]
  );

  const renderHeaderActions = () => {
    if (tab === 0) {
      if (!profile) {
        return (
          <HeroActionButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/elimu-plus/create")}>
            Create school profile
          </HeroActionButton>
        );
      }
      return (
        <HeroActionButton variant="contained" startIcon={<EditIcon />} onClick={() => navigate("/elimu-plus/edit")}>
          Edit profile
        </HeroActionButton>
      );
    }
    if (tab === 1) {
      return (
        <HeroActionButton variant="contained" startIcon={<AddIcon />} onClick={() => deptPanelRef.current?.openCreateDialog()}>
          Add department
        </HeroActionButton>
      );
    }
    if (tab === 2) {
      return (
        <HeroActionButton variant="contained" startIcon={<PersonIcon />} onClick={() => navigate("/elimu-plus/teachers/create")}>
          Create teacher
        </HeroActionButton>
      );
    }
    if (tab === 3) {
      return (
        <HeroActionButton variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate("/elimu-plus/students/create")}>
          Create student
        </HeroActionButton>
      );
    }
    if (tab === 4) {
      return (
        <HeroActionButton variant="contained" startIcon={<PersonAddIcon />} onClick={() => navigate("/elimu-plus/school-admins/create")}>
          Create school admin
        </HeroActionButton>
      );
    }
    if (tab === 5) {
      return (
        <HeroActionButton variant="contained" startIcon={<AddIcon />} onClick={() => servicesPanelRef.current?.openCreateDialog()}>
          Add service
        </HeroActionButton>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ ...pageShellSx, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...pageShellSx,
        ...elimuViewportSx,
        mx: { xs: -1.5, sm: -2, md: -3 },
        mt: { xs: -1, sm: -1.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
      }}
    >
      <ElimuPlusHero
        title="Elimu Plus"
        subtitle="Manage your school profile, people, services, and public presence"
        icon={<AutoStoriesIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={renderHeaderActions()}
      />

      <ElimuPlusTabs activeTab={tab} onChange={setTab} tabs={ELIMU_TABS} />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: "14px", flexShrink: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 && !profile ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "24px",
              border: "1px dashed rgba(220,38,38,0.25)",
              bgcolor: warmCream,
              p: 4,
              textAlign: "center",
            }}
          >
            <Stack spacing={2} alignItems="center" maxWidth={420}>
              <SchoolIcon sx={{ fontSize: 56, color: primaryRed, opacity: 0.85 }} />
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.35rem", color: textPrimary }}>
                No school profile yet
              </Typography>
              <Typography sx={{ fontFamily: fontBody, color: textSecondary, fontSize: "0.92rem" }}>
                Create your Elimu Plus school profile to showcase contact details, branding, and services on the public site.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/elimu-plus/create")}
                sx={{ borderRadius: "14px", fontWeight: 700, textTransform: "none", bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}
              >
                Create school profile
              </Button>
            </Stack>
          </Box>
        ) : null}

        {tab === 0 && profile ? (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 340px) 1fr" },
              gridTemplateRows: { xs: "auto 1fr", lg: "1fr" },
              gap: 2,
              height: { lg: "calc(100dvh - 220px)" },
              maxHeight: { lg: "calc(100dvh - 220px)" },
            }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "24px",
                overflow: "hidden",
                minHeight: { xs: 240, lg: "100%" },
                border: "1px solid rgba(220,38,38,0.1)",
                boxShadow: "0 20px 60px -20px rgba(28,25,23,0.2)",
                background: `linear-gradient(165deg, ${primaryDark} 0%, ${primaryRed} 55%, #FB923C 100%)`,
              }}
            >
              {logoSrc ? (
                <Box component="img" src={logoSrc} alt={profile.name || "School logo"} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SchoolIcon sx={{ fontSize: 88, color: "rgba(255,255,255,0.75)" }} />
                </Box>
              )}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(28,25,23,0.72) 0%, rgba(28,25,23,0.15) 45%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: 2.5, zIndex: 1 }}>
                <ChipLikeBadge label="Elimu Plus" />
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: { xs: "1.4rem", sm: "1.65rem" }, color: "#fff", mt: 1, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  {profile.name}
                </Typography>
                {profile.tagline ? (
                  <Typography sx={{ fontFamily: fontBody, color: "rgba(255,255,255,0.88)", fontSize: "0.9rem", mt: 0.5, fontStyle: "italic" }}>
                    {profile.tagline}
                  </Typography>
                ) : null}
              </Box>
            </Box>

            <Box
              sx={{
                borderRadius: "24px",
                border: "1px solid rgba(220,38,38,0.08)",
                bgcolor: "#fff",
                boxShadow: "0 16px 48px -16px rgba(28,25,23,0.1)",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2, borderBottom: "1px solid rgba(220,38,38,0.06)", bgcolor: warmCream, flexShrink: 0 }}>
                <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.1rem", color: textPrimary }}>
                  School details
                </Typography>
                {profile.description ? (
                  <Typography sx={{ fontFamily: fontBody, fontSize: "0.88rem", color: textSecondary, mt: 0.75, lineHeight: 1.55 }}>
                    {profile.description}
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: { xs: 2, sm: 2.5 } }}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <DetailField icon={<EmailIcon fontSize="small" />} label="Email" value={profile.email} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailField icon={<PhoneIcon fontSize="small" />} label="Phone" value={profile.phone} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailField icon={<PhoneIcon fontSize="small" />} label="Alternate phone" value={profile.alternate_phone} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailField icon={<LanguageIcon fontSize="small" />} label="Website" value={profile.website} />
                  </Grid>
                  <Grid item xs={12}>
                    <DetailField icon={<LocationIcon fontSize="small" />} label="Address" value={addressLine} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <DetailField icon={<CalendarIcon fontSize="small" />} label="Founded" value={profile.founded_year != null ? String(profile.founded_year) : ""} />
                  </Grid>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 1.75,
                        borderRadius: "14px",
                        bgcolor: warmCream,
                        border: "1px solid rgba(220,38,38,0.08)",
                      }}
                    >
                      <Typography sx={{ fontFamily: fontBody, fontSize: "0.68rem", fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Social links
                      </Typography>
                      {socialLinks.length === 0 ? (
                        <Typography sx={{ fontFamily: fontBody, fontWeight: 600, color: textPrimary, mt: 0.75 }}>
                          —
                        </Typography>
                      ) : (
                        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1 }}>
                          {socialLinks.map((s) => (
                            <SocialLinkChip key={s.key} icon={s.icon} label={s.label} href={normalizeExternalUrl(s.value)} />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
        ) : null}

        <ElimuPlusDepartmentsTab ref={deptPanelRef} active={tab === 1} />
        <ElimuPlusTeachersTab active={tab === 2} />
        <ElimuPlusStudentsTab active={tab === 3} />
        <ElimuPlusSchoolAdminsTab active={tab === 4} />
        <ElimuPlusServicesTab ref={servicesPanelRef} active={tab === 5} />
        <ElimuPlusReviewsTab active={tab === 6} />
      </Box>
    </Box>
  );
}

function ChipLikeBadge({ label }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        px: 1.25,
        py: 0.4,
        borderRadius: "10px",
        bgcolor: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.28)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Typography sx={{ fontFamily: fontBody, fontWeight: 800, fontSize: "0.72rem", color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </Typography>
    </Box>
  );
}
