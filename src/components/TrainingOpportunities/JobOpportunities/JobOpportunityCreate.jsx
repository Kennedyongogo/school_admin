import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  CloudUpload,
  Close as CloseIcon,
  Work as WorkIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import LocationMapPicker from "../../Projects/LocationMapPicker";

const JOB_TYPE_OPTIONS = ["Job", "Internship", "Attachment"];

const JobOpportunityCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    type: "Job",
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    imageAltText: "",
    applyUrl: "",
    attachmentUrl: "",
    contactEmail: "",
    contactPhone: "",
    tags: [],
    featured: false,
    isActive: true,
  });

  const handleInputChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const isFormValid = () => {
    return form.type && form.title.trim() && form.location.trim();
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: `${file.name} is larger than 10MB` });
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Invalid file type", text: `${file.name} is not an image` });
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeImageFile = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }

      const formData = new FormData();
      formData.append("type", form.type);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("location", form.location.trim());
      formData.append("latitude", form.latitude || "");
      formData.append("longitude", form.longitude || "");
      formData.append("imageAltText", form.imageAltText || "");
      formData.append("applyUrl", form.applyUrl || "");
      formData.append("attachmentUrl", form.attachmentUrl || "");
      formData.append("contactEmail", form.contactEmail || "");
      formData.append("contactPhone", form.contactPhone || "");
      formData.append("tags", JSON.stringify(form.tags));
      formData.append("featured", form.featured);
      formData.append("isActive", form.isActive);

      if (imageFile) formData.append("job_opportunity_image", imageFile);

      const response = await fetch("/api/job-opportunities", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create job opportunity");
      }

      setImageFile(null);
      setImagePreview(null);
      await Swal.fire({ title: "Success!", text: "Job opportunity created successfully.", icon: "success", confirmButtonColor: "#17cf54" });
      navigate("/marketplace");
    } catch (err) {
      setError(err.message || "Failed to create job opportunity");
      await Swal.fire({ title: "Error!", text: err.message || "Failed to create job opportunity", icon: "error", confirmButtonColor: "#17cf54" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)", p: 3, color: "white", borderRadius: 2, mb: 4, position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <IconButton onClick={() => navigate("/marketplace")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <WorkIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Create Job Opportunity
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Basic Information</Typography>

              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select value={form.type} label="Type *" onChange={(e) => handleInputChange("type", e.target.value)}>
                  {JOB_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Description" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Location</Typography>
              <TextField fullWidth label="Location *" value={form.location} onChange={(e) => handleInputChange("location", e.target.value)} />
              <Box sx={{ width: "100%" }}>
                <LocationMapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onLocationChange={(lat, lng) => {
                    handleInputChange("latitude", lat);
                    handleInputChange("longitude", lng);
                  }}
                />
              </Box>

              <TextField fullWidth label="Latitude" value={form.latitude} InputProps={{ readOnly: true }} helperText="Set via map" />
              <TextField fullWidth label="Longitude" value={form.longitude} InputProps={{ readOnly: true }} helperText="Set via map" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Contact & Links</Typography>
              <TextField fullWidth type="email" label="Contact Email" value={form.contactEmail} onChange={(e) => handleInputChange("contactEmail", e.target.value)} />
              <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => handleInputChange("contactPhone", e.target.value)} />

              {form.type !== "Attachment" && (
                <TextField
                  fullWidth
                  label="Apply URL"
                  value={form.applyUrl}
                  onChange={(e) => handleInputChange("applyUrl", e.target.value)}
                  helperText="External link for applying (optional)"
                />
              )}

              {form.type === "Attachment" && (
                <TextField
                  fullWidth
                  label="Attachment URL"
                  value={form.attachmentUrl}
                  onChange={(e) => handleInputChange("attachmentUrl", e.target.value)}
                  helperText="Link to attachments/docs (optional)"
                />
              )}

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="job-opportunity-image-upload" onChange={handleImageSelect} />
                  <label htmlFor="job-opportunity-image-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#17cf54", color: "#17cf54", "&:hover": { borderColor: "#13a842", backgroundColor: "rgba(23, 207, 84, 0.08)" } }}>
                      Upload image
                    </Button>
                  </label>
                </Box>

                {imagePreview ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400 }}>
                    <IconButton
                      onClick={removeImageFile}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        color: "white",
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
                        zIndex: 2,
                      }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box
                      component="img"
                      src={imagePreview}
                      alt="Preview"
                      sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "8px", mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>{imageFile?.name}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center", bgcolor: "#f9f9f9", maxWidth: 400 }}>
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No image selected
                    </Typography>
                  </Box>
                )}

                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Settings</Typography>
              <FormControlLabel
                control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />}
                label="Featured"
              />
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => handleInputChange("isActive", e.target.checked)} color="primary" />}
                label="Active"
              />

              <Stack direction="row" spacing={2} sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                  onClick={handleCreate}
                  disabled={!isFormValid() || saving}
                  sx={{
                    flex: 1,
                    background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)",
                    color: "white",
                    "&:hover": { background: "linear-gradient(135deg, #13a842 0%, #0f8a35 100%)" },
                    "&:disabled": { background: "#e0e0e0", color: "#999" },
                  }}
                >
                  {saving ? "Creating..." : "Create Opportunity"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/marketplace")}
                  sx={{ flex: 1, color: "#17cf54", borderColor: "#17cf54", "&:hover": { borderColor: "#13a842", backgroundColor: "rgba(23, 207, 84, 0.1)" } }}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default JobOpportunityCreate;

