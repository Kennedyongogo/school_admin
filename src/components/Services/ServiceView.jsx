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
  Divider,
} from "@mui/material";
import { ArrowBack, Edit, Build } from "@mui/icons-material";

const ServiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load service");
      setService(data.data);
    } catch (err) {
      setError(err.message || "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !service) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Service not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/services")}
        >
          Back to Services
        </Button>
      </Container>
    );
  }

  const benefits = Array.isArray(service.benefits) ? service.benefits : [];
  const useCases = Array.isArray(service.useCases) ? service.useCases : [];
  const relatedServiceIds = Array.isArray(service.relatedServiceIds) ? service.relatedServiceIds : [];

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
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
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
              onClick={() => navigate("/services")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Build sx={{ fontSize: 40 }} />
            <Box flex={1}>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {service.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Service details • {service.slug}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/services/${service.id}/edit`)}
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

        <Stack spacing={1.5}>
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #B85C38" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Overview</Typography>
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2, gap: 1 }}>
                <Chip label={service.status || "draft"} size="small" color={service.status === "published" ? "success" : "default"} />
                {service.isKeyService && <Chip label="Key service" size="small" />}
                {service.featured && <Chip label="Featured" size="small" color="primary" />}
                {service.badgeLabel && <Chip label={service.badgeLabel} size="small" color={service.badgeColor || "default"} />}
                <Chip label={`Slug: ${service.slug || "—"}`} size="small" variant="outlined" />
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Display order</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{service.displayOrder ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Priority</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{service.priority ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Views</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{service.views ?? 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Created</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatDate(service.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>Updated</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatDate(service.updatedAt)}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {service.shortDescription && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Short description</Typography>
                <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                  {service.shortDescription}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Description</Typography>
              <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                {service.description || "No description."}
              </Typography>
            </CardContent>
          </Card>

          {service.fullContent && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Full content</Typography>
                <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>{service.fullContent}</Typography>
              </CardContent>
            </Card>
          )}

          {(benefits.length > 0 || useCases.length > 0) && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent>
                {benefits.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Benefits</Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {benefits.map((item, idx) => (
                        <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>{item}</Typography>
                      ))}
                    </Box>
                  </Box>
                )}
                {useCases.length > 0 && (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Use cases</Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0 }}>
                      {useCases.map((item, idx) => (
                        <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>{item}</Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {service.image && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Image</Typography>
                <Box
                  component="img"
                  src={buildImageUrl(service.image)}
                  alt={service.imageAltText || service.title}
                  sx={{
                    width: "100%",
                    maxWidth: 400,
                    height: 250,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "2px solid #6B4E3D",
                  }}
                />
              </CardContent>
            </Card>
          )}

          {relatedServiceIds.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Related services</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {relatedServiceIds.map((relatedId) => (
                    <Chip key={relatedId} label={relatedId} size="small" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "0.75rem" }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {(service.metaTitle || service.metaDescription) && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>SEO</Typography>
                {service.metaTitle && <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Meta title:</strong> {service.metaTitle}</Typography>}
                {service.metaDescription && <Typography variant="body2" color="text.secondary">{service.metaDescription}</Typography>}
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default ServiceView;
