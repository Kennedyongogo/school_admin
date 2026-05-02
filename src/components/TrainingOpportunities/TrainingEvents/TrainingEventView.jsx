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
import { ArrowBack, Edit, Event } from "@mui/icons-material";

const TrainingEventView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
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
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/training-events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load training event");
      setEvent(data.data);
    } catch (err) {
      setError(err.message || "Failed to load training event");
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

  const formatTime = (value) => {
    if (!value) return "—";
    return value;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Training event not found"}
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

  const tags = Array.isArray(event.tags) ? event.tags : [];

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
            background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)",
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
            <Event sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {event.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Training Event Details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/marketplace/training-events/${event.id}/edit`)}
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
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 800 }}>Overview</Typography>

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
                  Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                  {event.location || "—"}
                </Typography>
              </Box>

              <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2.5, gap: 1 }}>
                <Chip label={event.type || "Workshop"} size="small" color="primary" sx={{ fontWeight: 600 }} />
                <Chip
                  label={event.isActive ? "Active" : "Inactive"}
                  size="small"
                  color={event.isActive ? "success" : "default"}
                  variant="outlined"
                />
                {event.featured && (
                  <Chip label="Featured" size="small" color="primary" />
                )}
              </Stack>

              <Grid container spacing={3} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Event Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(event.date)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Start Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatTime(event.startTime)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>End Time</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatTime(event.endTime)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>End Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{formatDate(event.endDate)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Capacity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{event.capacity || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Price</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {event.price ? `${event.currency || "USD"} ${event.price}` : "Free"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Organizer</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{event.organizer || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{event.contactEmail || "—"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Contact Phone</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.25 }}>{event.contactPhone || "—"}</Typography>
                </Grid>
              </Grid>

              {(event.latitude != null || event.longitude != null) && (
                <Box sx={{ pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>Coordinates</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25, fontFamily: "monospace" }}>
                    {event.latitude != null && event.longitude != null
                      ? `${Number(event.latitude).toFixed(6)}, ${Number(event.longitude).toFixed(6)}`
                      : event.latitude != null
                        ? `Lat: ${event.latitude}`
                        : `Lng: ${event.longitude}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Event sx={{ color: "#17cf54" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Description</Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#f0f9f4", border: "1px dashed #c3e6d0" }}>
                <Typography variant="body1" color="text.secondary" whiteSpace="pre-wrap">
                  {event.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Tags */}
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

          {/* Registration URL */}
          {event.registrationUrl && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>Registration</Typography>
                <Button
                  variant="contained"
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)" }}
                >
                  Register Here
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Image */}
          {event.image && (
            <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0", borderLeft: "6px solid #17cf54" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>Event Image</Typography>
                <Box
                  component="img"
                  src={buildImageUrl(event.image)}
                  alt={event.imageAltText || event.title}
                  sx={{
                    width: "100%",
                    maxHeight: 400,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #eee",
                  }}
                />
                {event.imageAltText && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Alt: {event.imageAltText}
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

export default TrainingEventView;
