import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Article,
} from "@mui/icons-material";

const FormView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/forms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load form");

      setForm(data.data);
    } catch (err) {
      setError(err.message || "Failed to load form");
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

  if (error || !form) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "Form not found"}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/forms")}
        >
          Back to Forms
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
              onClick={() => navigate("/forms")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" },
              }}
            >
              <ArrowBack />
            </IconButton>
            <Article sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                {form.title}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Form details
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/forms/${form.id}/edit`)}
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
                Form Overview
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
                <Chip label={`Title: ${form.title}`} size="small" />
                <Chip label={`Slug: ${form.slug}`} size="small" />
                <Chip label={`Status: ${form.is_active ? "Active" : "Inactive"}`} size="small" color={form.is_active ? "success" : "default"} />
                <Chip label={`Fields: ${form.fields?.length || 0}`} size="small" />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(form.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Updated
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatDate(form.updated_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Success Message
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {form.success_message || "Thank you for your submission!"}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

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
                <Article sx={{ color: "#6B4E3D" }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Description
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#faf6f2",
                  border: "1px dashed #e0d6c8",
                }}
              >
                <Typography variant="body1" sx={{ color: "text.secondary", whiteSpace: "pre-wrap" }}>
                  {form.description || "No description provided."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {Array.isArray(form.fields) && form.fields.length > 0 && (
            <Card
              sx={{
                backgroundColor: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e0e0e0",
                borderLeft: "6px solid #6B4E3D",
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 800 }}>
                  Form Fields ({form.fields.length})
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                  Fields that users will see and fill out in this form
                </Typography>
                <Stack spacing={2}>
                  {form.fields.map((field, idx) => (
                    <Box
                      key={field.id || idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#faf6f2",
                        border: "1px solid #e0d6c8",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {field.label}
                        </Typography>
                        <Chip
                          label={field.field_type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {field.is_required && (
                          <Chip label="Required" size="small" color="error" />
                        )}
                      </Box>

                      <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                        Field Name: {field.field_name}
                      </Typography>

                      {field.placeholder && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          Placeholder: {field.placeholder}
                        </Typography>
                      )}

                      {field.help_text && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          Help Text: {field.help_text}
                        </Typography>
                      )}

                      {field.default_value && (
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                          Default Value: {field.default_value}
                        </Typography>
                      )}

                      {Array.isArray(field.options) && field.options.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                            Options:
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {field.options.map((option, optIdx) => (
                              <Chip
                                key={optIdx}
                                label={`${option.option_label}${option.is_default ? ' (default)' : ''}`}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

        </Stack>
      </Container>
    </Box>
  );
};

export default FormView;
