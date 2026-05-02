import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import { ArrowBack, Save, QuestionAnswer as FaqIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const FAQEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
    displayOrder: 0,
    status: "active",
  });

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
      const faq = data.data;
      setForm({
        question: faq.question || "",
        answer: faq.answer || "",
        category: faq.category || "",
        displayOrder: faq.displayOrder ?? 0,
        status: faq.status || "active",
      });
    } catch (err) {
      setError(err.message || "Failed to load FAQ");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () =>
    form.question.trim().length >= 5 && form.answer.trim().length > 0;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/faqs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: form.question.trim(),
          answer: form.answer.trim(),
          category: form.category || null,
          displayOrder: parseInt(form.displayOrder, 10) || 0,
          status: form.status,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update FAQ");
      }
      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "FAQ updated successfully",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/faqs");
    } catch (err) {
      setError(err.message || "Failed to update FAQ");
      Swal.fire("Error", err.message || "Failed to update FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
            mb: 4,
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
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                Edit FAQ
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {form.question?.length > 60 ? `${form.question.substring(0, 60)}...` : form.question}
              </Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={!isFormValid() || saving}
                sx={{
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  color: "white",
                  "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" },
                  "&:disabled": { backgroundColor: "rgba(255,255,255,0.15)" },
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Card
          sx={{
            backgroundColor: "white",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Question"
                required
                value={form.question}
                onChange={(e) => handleChange("question", e.target.value)}
                inputProps={{ maxLength: 500 }}
                helperText={`${form.question.length}/500 (min 5 characters)`}
              />
              <TextField
                fullWidth
                label="Answer"
                required
                multiline
                rows={5}
                value={form.answer}
                onChange={(e) => handleChange("answer", e.target.value)}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.secondary" }}>
                Meta
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="General">General</MenuItem>
                  <MenuItem value="Pricing">Pricing</MenuItem>
                  <MenuItem value="Services">Services</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Display order"
                type="number"
                value={form.displayOrder}
                onChange={(e) => handleChange("displayOrder", e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Lower numbers appear first"
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  label="Status"
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default FAQEdit;
