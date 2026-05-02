import React, { useState } from "react";
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
import { Save, ArrowBack, QuestionAnswer as FaqIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const FAQCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    question: "",
    answer: "",
    category: "",
    displayOrder: 0,
    status: "active",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () =>
    form.question.trim().length >= 5 && form.answer.trim().length > 0;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/faqs", {
        method: "POST",
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
        throw new Error(data.message || "Failed to create FAQ");
      }
      await Swal.fire({
        title: "Success!",
        text: "FAQ created successfully!",
        icon: "success",
        confirmButtonColor: "#667eea",
      });
      navigate("/faqs");
    } catch (err) {
      setError(err.message || "Failed to create FAQ");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create FAQ",
        icon: "error",
        confirmButtonColor: "#667eea",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
            borderRadius: 2,
            mb: 4,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
            }}
          />
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ position: "relative", zIndex: 1 }}
          >
            <IconButton
              onClick={() => navigate("/faqs")}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
            <FaqIcon sx={{ fontSize: 40 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Create FAQ
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2, position: "relative", zIndex: 1 }}
            >
              {error}
            </Alert>
          )}
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

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSubmit}
                  disabled={!isFormValid() || saving}
                  sx={{
                    flex: 1,
                    background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    color: "white",
                    "&:hover": {
                      background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                      color: "#999",
                    },
                  }}
                >
                  {saving ? "Creating..." : "Create FAQ"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/faqs")}
                  sx={{
                    flex: 1,
                    color: "#6B4E3D",
                    borderColor: "#6B4E3D",
                    "&:hover": {
                      borderColor: "#B85C38",
                      backgroundColor: "rgba(107, 78, 61, 0.1)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default FAQCreate;
