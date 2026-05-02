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
import { ArrowBack, Edit, Work } from "@mui/icons-material";

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
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
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load project");
      setProject(data.data);
    } catch (err) {
      setError(err.message || "Failed to load project");
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

  if (error || !project) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Project not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/projects")}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }

  const tags = Array.isArray(project.tags) ? project.tags : [];
  const impactMetrics = Array.isArray(project.impactMetrics) ? project.impactMetrics : [];

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
              onClick={() => navigate("/projects")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Work sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {project.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Project details • {project.slug}
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/projects/${project.id}/edit`)}
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
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #B85C38" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 800 }}>Overview</Typography>

              {/* Location – prominent */}
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                  Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {project.location || "—"}
                </Typography>
              </Box>

              {/* Category, Status, Execution, Featured – chips */}
              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2.5, gap: 1 }}>
                {project.category && (
                  <Chip label={project.category} size="small" sx={{ fontWeight: 600 }} />
                )}
                <Chip
                  label={project.status || "draft"}
                  size="small"
                  color={project.status === "published" ? "success" : "default"}
                  variant="outlined"
                />
                <Chip
                  label={project.projectStatus || "pending"}
                  size="small"
                  variant="outlined"
                />
                {project.featured && (
                  <Chip label="Featured" size="small" color="primary" />
                )}
              </Stack>

              {/* Key metrics & client – 2x2 grid */}
              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Priority</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.priority ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Display order</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.displayOrder ?? "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Views</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.views ?? 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Client</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.clientName || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Farmers trained</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.farmersTrained != null ? project.farmersTrained.toLocaleString() : "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>ROI increase (%)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{project.roiIncreasePercent != null ? `${project.roiIncreasePercent}%` : "—"}</Typography>
                </Grid>
              </Grid>

              {/* Dates */}
              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Start date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(project.startDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>End date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(project.endDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Created</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(project.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Updated</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(project.updatedAt)}</Typography>
                </Grid>
              </Grid>

              {/* Coordinates – compact line */}
              {(project.latitude != null || project.longitude != null) && (
                <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Coordinates</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25, fontFamily: "monospace" }}>
                    {project.latitude != null && project.longitude != null
                      ? `${Number(project.latitude).toFixed(6)}, ${Number(project.longitude).toFixed(6)}`
                      : project.latitude != null
                        ? `Lat: ${project.latitude}`
                        : `Lng: ${project.longitude}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Short description */}
          {project.shortDescription && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Short description</Typography>
                <Typography variant="body1" color="text.secondary">{project.shortDescription}</Typography>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Work sx={{ color: "#6B4E3D" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Description</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#faf6f2", border: "1px dashed #e0d6c8" }}>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {project.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Tags */}
          {tags.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #B85C38" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Tags</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {tags.map((tag, idx) => (
                    <Chip key={idx} label={tag} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Full content */}
          {project.fullContent && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Full content</Typography>
                <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#faf6f2", border: "1px dashed #e0d6c8" }}>
                  <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                    {project.fullContent}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Impact metrics */}
          {impactMetrics.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #B85C38" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Impact metrics</Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {impactMetrics.map((item, idx) => (
                    <Typography key={idx} component="li" variant="body2" sx={{ mb: 1 }}>
                      {typeof item === "object" ? JSON.stringify(item) : String(item)}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* SEO */}
          {(project.metaTitle || project.metaDescription) && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>SEO</Typography>
                {project.metaTitle && (
                  <>
                    <Typography variant="body2" color="text.secondary">Meta title</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{project.metaTitle}</Typography>
                  </>
                )}
                {project.metaDescription && (
                  <>
                    <Typography variant="body2" color="text.secondary">Meta description</Typography>
                    <Typography variant="body1">{project.metaDescription}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Image */}
          {project.image && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #6B4E3D" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Main image</Typography>
                <Box
                  component="img"
                  src={buildImageUrl(project.image)}
                  alt={project.imageAltText || project.title}
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #eee",
                  }}
                />
                {project.imageAltText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Alt: {project.imageAltText}
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

export default ProjectView;
