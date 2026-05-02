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
import { ArrowBack, Edit, AttachMoney } from "@mui/icons-material";

const GrantView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grant, setGrant] = useState(null);
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
    fetchGrant();
  }, [id]);

  const fetchGrant = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/grants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load grant");
      setGrant(data.data);
    } catch (err) {
      setError(err.message || "Failed to load grant");
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

  if (error || !grant) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Grant not found"}
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

  const tags = Array.isArray(grant.tags) ? grant.tags : [];

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
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
            <AttachMoney sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {grant.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Grant Details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/marketplace/grants/${grant.id}/edit`)}
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
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #f59e0b" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 800 }}>Overview</Typography>

              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2.5, gap: 1 }}>
                <Chip label={grant.badge || "Funding"} size="small" color="warning" sx={{ fontWeight: 600 }} />
                <Chip
                  label={grant.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={grant.isActive ? "success" : "default"}
                  variant="outlined"
                />
                {grant.featured && (
                  <Chip label="Featured" size="small" color="primary" />
                )}
                {grant.fundingType && (
                  <Chip label={grant.fundingType} size="small" variant="outlined" />
                )}
              </Stack>

              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Amount</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {grant.amount || (grant.amountMin && grant.amountMax ? `${grant.currency || "USD"} ${grant.amountMin} - ${grant.amountMax}` : "—")}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Deadline</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {grant.deadlineText || (grant.isRolling ? "Rolling" : formatDate(grant.deadline)) || "—"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Organization</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{grant.organization || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Sector</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{grant.sector || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Target Audience</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{grant.targetAudience || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{grant.contactEmail || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Phone</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{grant.contactPhone || "—"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #f59e0b" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <AttachMoney sx={{ color: "#f59e0b" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Description</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#fef3c7", border: "1px dashed #fcd34d" }}>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {grant.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Eligibility & Requirements */}
          {(grant.eligibilityCriteria || grant.requirements) && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #d97706" }}>
              <CardContent>
                {grant.eligibilityCriteria && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Eligibility Criteria</Typography>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#fef3c7", border: "1px dashed #fcd34d", mb: 2 }}>
                      <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                        {grant.eligibilityCriteria}
                      </Typography>
                    </Box>
                  </>
                )}
                {grant.requirements && (
                  <>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Requirements</Typography>
                    <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#fef3c7", border: "1px dashed #fcd34d" }}>
                      <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                        {grant.requirements}
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #d97706" }}>
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

          {/* Application URL */}
          {grant.applicationUrl && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #f59e0b" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Application</Typography>
                <Button
                  variant="contained"
                  href={grant.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
                >
                  Apply Here
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Image */}
          {grant.image && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #f59e0b" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Grant Image</Typography>
                <Box
                  component="img"
                  src={buildImageUrl(grant.image)}
                  alt={grant.imageAltText || grant.title}
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #eee",
                  }}
                />
                {grant.imageAltText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Alt: {grant.imageAltText}
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

export default GrantView;
