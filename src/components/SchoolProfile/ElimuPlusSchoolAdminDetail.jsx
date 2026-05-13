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
  Paper,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function profilePhotoUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

const adminTypes = [
  { value: "super_admin", label: "Super Admin" },
  { value: "principal", label: "Principal" },
  { value: "vice_principal", label: "Vice Principal" },
  { value: "accountant", label: "Accountant" },
  { value: "librarian", label: "Librarian" },
  { value: "admin_staff", label: "Admin Staff" },
];

function teacherCardsGridSx(theme, extra = {}) {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: theme.spacing(2.5),
    rowGap: theme.spacing(2.5),
    alignItems: "stretch",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    px: { xs: 0.5, sm: 1 },
    ...extra,
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "minmax(0, 1fr)",
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(2),
    },
  };
}

const teacherCardCellSx = {
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

function DetailCard({ icon: Icon, title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        ...teacherCardCellSx,
        borderRadius: 2,
        border: `1px solid ${accentLight}`,
        boxShadow: `0 8px 28px -12px ${accent}33`,
        overflow: "hidden",
        bgcolor: "rgba(255,255,255,0.98)",
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
          px: 2,
          py: 1.5,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon sx={{ fontSize: 20, opacity: 0.95 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: "0.04em" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5, flex: 1, overflow: "auto" }}>
        {children}
      </Box>
    </Paper>
  );
}

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

  const photoSrc = profilePhotoUrl(admin?.profile_picture);
  const displayName = admin?.user?.full_name || admin?.user?.username || "—";
  const adminTypeLabel = adminTypes.find((t) => t.value === admin?.admin_type)?.label || admin?.admin_type || "—";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: accent }} />
      </Box>
    );
  }

  if (error || !admin) {
    return (
      <Box
        component="form"
        sx={{
          width: `calc(100% + 48px)`,
          maxWidth: "none",
          marginLeft: -3,
          marginRight: -3,
          marginTop: -2.75,
          minHeight: "100%",
          background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        <Stack spacing={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ alignSelf: "flex-start" }}>
            Back to School Admins
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: `calc(100% + 48px)`,
        maxWidth: "none",
        marginLeft: -3,
        marginRight: -3,
        marginTop: -2.75,
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
        px: { xs: 2, sm: 3 },
        py: 3,
      }}
    >
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Tooltip title="Back to School Admins">
            <IconButton onClick={goBack} sx={{ color: accentDark }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Avatar
            src={photoSrc || undefined}
            sx={{ width: 64, height: 64, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}
          >
            {!photoSrc ? displayName.charAt(0).toUpperCase() : null}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: accentDark }}>
              {displayName}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#6B7280" }}>
              {adminTypeLabel}
            </Typography>
          </Box>
        </Stack>

        <Box sx={(theme) => teacherCardsGridSx(theme)}>
          <DetailCard icon={PersonIcon} title="Personal Information">
            <Stack spacing={1.5}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Full Name
              </Typography>
              <Typography>{admin.user?.full_name || "—"}</Typography>

              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Username
              </Typography>
              <Typography>{admin.user?.username || "—"}</Typography>
            </Stack>
          </DetailCard>

          <DetailCard icon={EmailIcon} title="Contact Information">
            <Stack spacing={1.5}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Email
              </Typography>
              <Typography>{admin.user?.email || "—"}</Typography>

              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Phone
              </Typography>
              <Typography>{admin.user?.phone || "—"}</Typography>
            </Stack>
          </DetailCard>

          <DetailCard icon={LocationIcon} title="Address">
            <Typography>{admin.user?.address || "—"}</Typography>
          </DetailCard>

          <DetailCard icon={AdminIcon} title="Admin Details">
            <Stack spacing={1.5}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Admin Type
              </Typography>
              <Typography>{adminTypeLabel}</Typography>

              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Created At
              </Typography>
              <Typography>{new Date(admin.created_at).toLocaleDateString()}</Typography>
            </Stack>
          </DetailCard>
        </Box>
      </Stack>
    </Box>
  );
}