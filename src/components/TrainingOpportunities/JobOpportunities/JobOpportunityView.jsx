import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Grid,
} from "@mui/material";
import { ArrowBack, Edit, Work as WorkIcon, Event as EventIcon, Phone as PhoneIcon, Email as EmailIcon } from "@mui/icons-material";

const JobOpportunityView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
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
    fetchOpportunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/job-opportunities/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load job opportunity");
      setOpportunity(data.data);
    } catch (err) {
      setError(err.message || "Failed to load job opportunity");
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

  if (error || !opportunity) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Job opportunity not found"}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/marketplace")}>
          Back to Marketplace
        </Button>
      </Container>
    );
  }

  const typeLabel = opportunity.type || "Job";
  const tags = Array.isArray(opportunity.tags) ? opportunity.tags : [];

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", p: { xs: 0.5, sm: 0.5, md: 0.5 } }}>
      <Container maxWidth="lg" sx={{ px: 0.5 }}>
        <Box sx={{ background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)", p: 3, color: "white", borderRadius: 2, position: "relative", overflow: "hidden", mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton onClick={() => navigate("/marketplace")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <WorkIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {opportunity.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Job Opportunity Details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/marketplace/job-opportunities/${opportunity.id}/edit`)}
                sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}
              >
                Edit
              </Button>
            </Box>
          </Box>
        </Box>

        <Stack spacing={1.5}>
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
                  Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {opportunity.location || "—"}
                </Typography>
              </Box>

              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2 }}>
                <Chip label={typeLabel} size="small" color="primary" sx={{ fontWeight: 700 }} />
                <Chip label={opportunity.isActive ? "Active" : "Inactive"} size="small" color={opportunity.isActive ? "success" : "default"} variant="outlined" />
                {opportunity.featured && <Chip label="Featured" size="small" color="primary" />}
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
                    Contact Email
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                    <EmailIcon color="action" fontSize="small" />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{opportunity.contactEmail || "—"}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
                    Contact Phone
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                    <PhoneIcon color="action" fontSize="small" />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{opportunity.contactPhone || "—"}</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: "#f0f9f4", border: "1px dashed #c3e6d0" }}>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {opportunity.description || "No description provided."}
                </Typography>
              </Box>

              {(opportunity.applyUrl || opportunity.attachmentUrl) && (
                <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {opportunity.applyUrl && (
                    <Button variant="contained" href={opportunity.applyUrl} target="_blank" rel="noopener noreferrer" sx={{ background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)" }}>
                      Apply Here
                    </Button>
                  )}
                  {opportunity.attachmentUrl && (
                    <Button variant="outlined" href={opportunity.attachmentUrl} target="_blank" rel="noopener noreferrer" sx={{ borderColor: "#17cf54", color: "#17cf54" }}>
                      View Attachment
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {tags.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #13a842" }}>
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

          {opportunity.image && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Image</Typography>
                <Box
                  component="img"
                  src={buildImageUrl(opportunity.image)}
                  alt={opportunity.imageAltText || opportunity.title}
                  sx={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 2, border: "1px solid #eee" }}
                />
                {opportunity.imageAltText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Alt: {opportunity.imageAltText}
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

export default JobOpportunityView;

