import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { ArrowBack, Edit, Business } from "@mui/icons-material";

const PartnerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildLogoUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchPartner();
  }, [id]);

  const fetchPartner = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/partners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load partner");
      setPartner(data.data);
    } catch (err) {
      setError(err.message || "Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !partner) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Partner not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/marketplace")}
        >
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const services = Array.isArray(partner.services) ? partner.services : [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
      <Container maxWidth="lg" sx={{ px: 0.5 }}>
        <Box
          sx={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            p: 3,
            color: "white",
            borderRadius: 2,
            position: "relative",
            overflow: "hidden",
            mb: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton
              onClick={() => navigate("/marketplace")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Business sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {partner.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Partner Details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/marketplace/partners/${partner.id}/edit`)}
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
                }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

        <Stack spacing={1.5}>
          {/* Overview */}
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #3b82f6" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 800 }}>Overview</Typography>

              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2.5, gap: 1 }}>
                <Chip
                  label={partner.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={partner.isActive ? "success" : "default"}
                  variant="outlined"
                />
                {partner.featured && (
                  <Chip label="Featured" size="small" color="primary" />
                )}
                {partner.sector && (
                  <Chip label={partner.sector} size="small" variant="outlined" />
                )}
              </Stack>

              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Website</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {(partner.websiteUrl || partner.website) ? (
                      <Button href={partner.websiteUrl || partner.website} target="_blank" rel="noopener noreferrer" size="small">
                        {partner.websiteUrl || partner.website}
                      </Button>
                    ) : "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Sector</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{partner.sector || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{partner.contactEmail || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Phone</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{partner.contactPhone || "—"}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{partner.address || "—"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #3b82f6" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Business sx={{ color: "#3b82f6" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Description</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#dbeafe", border: "1px dashed #93c5fd" }}>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {partner.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Services */}
          {services.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #2563eb" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Services</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {services.map((service, idx) => (
                    <Chip key={idx} label={service} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Logo */}
          {partner.logo && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #3b82f6" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Logo</Typography>
                <Box
                  component="img"
                  src={buildLogoUrl(partner.logo)}
                  alt={partner.logoAltText || partner.name}
                  sx={{
                    maxWidth: 300,
                    maxHeight: 200,
                    objectFit: "contain",
                    borderRadius: 2,
                    border: "1px solid #eee",
                  }}
                />
                {partner.logoAltText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Alt: {partner.logoAltText}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default PartnerView;
