import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Chip,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import {
  authHeaders,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryLight,
  ghostBtnSx,
  resolveAssetUrl,
} from "./elimuPlusShared";
import { ElimuPlusHero, FormSection, DetailField } from "./elimuPlusUi";

const adminTypes = [
  { value: "super_admin", label: "Super Admin" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin_staff", label: "Admin Staff" },
];

export default function ElimuPlusSchoolAdminDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/school-admins/${id}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load school admin (${res.status})`);
        }
        setAdmin(data.data);
      } catch (e) {
        setError(e.message || "Failed to load school admin.");
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAdmin();
  }, [id]);

  const goBack = () => navigate("/elimu-plus", { state: { tab: 4 } });

  const photoSrc = resolveAssetUrl(admin?.profile_picture);
  const displayName = admin?.user?.full_name || admin?.user?.username || "—";
  const adminTypeLabel = adminTypes.find((t) => t.value === admin?.admin_type)?.label || admin?.admin_type || "—";

  if (loading) {
    return (
      <Box sx={{ ...pageShellSx, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...pageShellSx, minHeight: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back to School Admins">
          <IconButton onClick={goBack} aria-label="Back" sx={{ bgcolor: "#fff", border: "1px solid rgba(220,38,38,0.12)", "&:hover": { bgcolor: "#FEE2E2" } }}>
            <ArrowBackIcon sx={{ color: primaryDark }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <ElimuPlusHero
        title={error || !admin ? "School admin" : displayName}
        subtitle={error || !admin ? "School admin profile" : adminTypeLabel}
        icon={<AdminIcon sx={{ fontSize: 26, color: "#fff" }} />}
      />

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {admin ? (
        <>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormSection title="Profile summary">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "center", sm: "flex-start" }}>
                  <Avatar
                    src={photoSrc || undefined}
                    sx={{
                      width: 96,
                      height: 96,
                      fontSize: "2rem",
                      fontWeight: 800,
                      bgcolor: `${primaryRed}18`,
                      color: primaryDark,
                      border: `4px solid ${primaryLight}`,
                    }}
                  >
                    {!photoSrc ? displayName.charAt(0).toUpperCase() : null}
                  </Avatar>
                  <Stack spacing={1.25} sx={{ flex: 1, alignItems: { xs: "center", sm: "flex-start" }, textAlign: { xs: "center", sm: "left" } }}>
                    <Chip icon={<AdminIcon sx={{ fontSize: "18px !important" }} />} label={adminTypeLabel} sx={{ fontWeight: 700, bgcolor: `${primaryRed}12`, border: `1px solid ${primaryLight}` }} />
                    {admin.user?.email ? (
                      <Typography variant="body2" color="text.secondary">
                        {admin.user.email}
                      </Typography>
                    ) : null}
                  </Stack>
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Personal information">
                <Stack spacing={1.5}>
                  <DetailField icon={<PersonIcon fontSize="small" />} label="Full name" value={admin.user?.full_name} />
                  <DetailField icon={<PersonIcon fontSize="small" />} label="Username" value={admin.user?.username} />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Contact information">
                <Stack spacing={1.5}>
                  <DetailField icon={<EmailIcon fontSize="small" />} label="Email" value={admin.user?.email} />
                  <DetailField icon={<PhoneIcon fontSize="small" />} label="Phone" value={admin.user?.phone} />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Address">
                <DetailField icon={<LocationIcon fontSize="small" />} label="Address" value={admin.user?.address} />
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Admin details">
                <Stack spacing={1.5}>
                  <DetailField icon={<AdminIcon fontSize="small" />} label="Admin type" value={adminTypeLabel} />
                  <DetailField icon={<AdminIcon fontSize="small" />} label="Created at" value={admin.created_at ? new Date(admin.created_at).toLocaleDateString() : undefined} />
                </Stack>
              </FormSection>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Back to school admins
            </Button>
          </Stack>
        </>
      ) : null}
    </Box>
  );
}
