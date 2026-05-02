import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  QuestionAnswer as FaqIcon,
  Visibility,
  CalendarToday,
  FormatListNumbered,
} from "@mui/icons-material";

const FAQView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFaq();
  }, [id]);

  const fetchFaq = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/faqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load FAQ");
      setFaq(data.data);
    } catch (err) {
      setError(err.message || "Failed to load FAQ");
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

  if (error || !faq) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "FAQ not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/faqs")}
        >
          Back to FAQs
        </Button>
      </Container>
    );
  }

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
              onClick={() => navigate("/faqs")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <FaqIcon sx={{ fontSize: 40 }} />
            <Box flex={1}>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {faq.question?.length > 60 ? `${faq.question.substring(0, 60)}...` : faq.question}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                FAQ details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/faqs/${faq.id}/edit`)}
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
          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #B85C38",
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                Meta
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <Chip
                  label={`Status: ${faq.status || "—"}`}
                  color={faq.status === "active" ? "success" : "default"}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: "capitalize" }}
                />
                <Chip
                  label={faq.category || "—"}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                <Chip label={`Order: ${faq.displayOrder ?? 0}`} size="small" />
                <Chip
                  icon={<Visibility sx={{ fontSize: 16 }} />}
                  label={`Views: ${faq.views ?? 0}`}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(faq.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(faq.updatedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Status
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {faq.status || "—"}
                  </Typography>
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                  mt: 2,
                  p: 1.5,
                  backgroundColor: "#faf6f2",
                  borderRadius: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Visibility fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Views
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {faq.views ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormatListNumbered fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Display order
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {faq.displayOrder ?? 0}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CalendarToday fontSize="small" sx={{ color: "#B85C38" }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      Updated
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {formatDate(faq.updatedAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {(faq.createdAt || faq.updatedAt) && (
                <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #eee" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Created {formatDate(faq.createdAt)}
                    {faq.updatedAt && faq.updatedAt !== faq.createdAt && ` · Updated ${formatDate(faq.updatedAt)}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card
            sx={{
              backgroundColor: "white",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e0e0e0",
              borderLeft: "6px solid #6B4E3D",
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <FaqIcon sx={{ color: "#6B4E3D" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Question
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {faq.question}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 1 }}>
                Answer
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#faf6f2",
                  border: "1px dashed #e0d6c8",
                }}
              >
                <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {faq.answer || "No answer provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default FAQView;
