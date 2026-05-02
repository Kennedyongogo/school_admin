import React, { useState } from "react";
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
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import { Save, ArrowBack, CloudUpload, Close as CloseIcon, Work, Add, Image as ImageIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LocationMapPicker from "./LocationMapPicker";

const CATEGORIES = ["Waste Management", "Dairy Value Chain", "Ag-Tech", "Irrigation", "Other"];
const STATUS_OPTIONS = ["draft", "published", "archived"];
const PROJECT_STATUS_OPTIONS = ["pending", "ongoing", "completed", "cancelled", "on_hold"];

const ChipArrayField = ({ label, value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddItem = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    onChange(value.filter((item) => item !== itemToRemove));
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddItem();
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="contained"
          onClick={handleAddItem}
          disabled={!inputValue.trim() || value.includes(inputValue.trim())}
          startIcon={<Add />}
          sx={{
            minWidth: "auto",
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" },
          }}
        >
          Add
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip key={index} label={item} onDelete={() => handleRemoveItem(item)} size="small" sx={{ backgroundColor: "#6B4E3D", color: "white" }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    shortDescription: "",
    location: "",
    imageAltText: "",
    tags: [],
    category: "",
    featured: false,
    priority: 0,
    displayOrder: 0,
    status: "draft",
    projectStatus: "pending",
    fullContent: "",
    clientName: "",
    startDate: "",
    endDate: "",
    farmersTrained: "",
    roiIncreasePercent: "",
    impactMetrics: [],
    latitude: "",
    longitude: "",
    metaTitle: "",
    metaDescription: "",
  });

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !form.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: `${file.name} is larger than 10MB`,
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid file type",
        text: `${file.name} is not an image`,
      });
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

  const isFormValid = () =>
    form.title.trim() &&
    form.description.trim() &&
    form.location.trim() &&
    form.slug.trim();

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const slug = form.slug.trim() || form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("location", form.location.trim());
      if (form.shortDescription) formData.append("shortDescription", form.shortDescription);
      if (form.imageAltText) formData.append("imageAltText", form.imageAltText);
      formData.append("tags", JSON.stringify(form.tags));
      if (form.category) formData.append("category", form.category);
      formData.append("featured", form.featured);
      formData.append("priority", String(form.priority));
      formData.append("displayOrder", String(form.displayOrder));
      formData.append("status", form.status);
      formData.append("projectStatus", form.projectStatus);
      if (form.fullContent) formData.append("fullContent", form.fullContent);
      if (form.clientName) formData.append("clientName", form.clientName);
      if (form.startDate) formData.append("startDate", form.startDate);
      if (form.endDate) formData.append("endDate", form.endDate);
      if (form.farmersTrained !== "") formData.append("farmersTrained", form.farmersTrained);
      if (form.roiIncreasePercent !== "") formData.append("roiIncreasePercent", form.roiIncreasePercent);
      formData.append("impactMetrics", JSON.stringify(form.impactMetrics));
      if (form.latitude !== "") formData.append("latitude", form.latitude);
      if (form.longitude !== "") formData.append("longitude", form.longitude);
      if (form.metaTitle) formData.append("metaTitle", form.metaTitle);
      if (form.metaDescription) formData.append("metaDescription", form.metaDescription);
      if (imageFile) formData.append("project_image", imageFile);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageFile(null);
        setImagePreview(null);
        await Swal.fire({ title: "Success!", text: "Project created successfully.", icon: "success", confirmButtonColor: "#6B4E3D" });
        navigate("/projects");
      } else {
        throw new Error(result.message || "Failed to create project");
      }
    } catch (err) {
      setError(err.message || "Failed to create project");
      await Swal.fire({ title: "Error!", text: err.message || "Failed to create project", icon: "error", confirmButtonColor: "#6B4E3D" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", p: 3, color: "white", borderRadius: 2, mb: 4, position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <IconButton onClick={() => navigate("/projects")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <Work sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Create Project
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Basic info</Typography>
              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Slug (URL)" value={form.slug} onChange={(e) => handleInputChange("slug", e.target.value)} placeholder="Auto from title" helperText="URL-friendly identifier" />
              <TextField fullWidth label="Location *" value={form.location} onChange={(e) => handleInputChange("location", e.target.value)} />
              <TextField fullWidth label="Short description" multiline rows={2} value={form.shortDescription} onChange={(e) => handleInputChange("shortDescription", e.target.value)} placeholder="Brief for cards/previews" />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />
              <TextField fullWidth label="Full content (detail page)" multiline rows={6} value={form.fullContent} onChange={(e) => handleInputChange("fullContent", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Category & status</Typography>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => handleInputChange("category", e.target.value)}>
                  <MenuItem value="">—</MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Content status</InputLabel>
                <Select value={form.status} label="Content status" onChange={(e) => handleInputChange("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Execution status</InputLabel>
                <Select value={form.projectStatus} label="Execution status" onChange={(e) => handleInputChange("projectStatus", e.target.value)}>
                  {PROJECT_STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />}
                label="Featured"
              />
              <TextField fullWidth type="number" label="Priority" value={form.priority} onChange={(e) => handleInputChange("priority", e.target.value)} inputProps={{ min: 0 }} />
              <TextField fullWidth type="number" label="Display order" value={form.displayOrder} onChange={(e) => handleInputChange("displayOrder", e.target.value)} inputProps={{ min: 0 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Project details</Typography>
              <TextField fullWidth label="Client name" value={form.clientName} onChange={(e) => handleInputChange("clientName", e.target.value)} />
              <TextField fullWidth type="date" label="Start date" value={form.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="date" label="End date" value={form.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="number" label="Farmers trained" value={form.farmersTrained} onChange={(e) => handleInputChange("farmersTrained", e.target.value)} placeholder="e.g. 120" inputProps={{ min: 0 }} helperText="Number of farmers trained (used for portal stats)" />
              <TextField fullWidth type="number" label="ROI increase (%)" value={form.roiIncreasePercent} onChange={(e) => handleInputChange("roiIncreasePercent", e.target.value)} placeholder="e.g. 25" inputProps={{ min: 0, max: 100, step: 0.01 }} helperText="ROI increase percentage (used for portal stats)" />

              <ChipArrayField label="Tags" value={form.tags} onChange={(v) => handleInputChange("tags", v)} placeholder="Add tag" />
              <ChipArrayField label="Impact metrics (labels or key-value)" value={form.impactMetrics} onChange={(v) => handleInputChange("impactMetrics", v)} placeholder="e.g. Farmers trained: 120" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="project-image-upload" onChange={handleImageSelect} />
                  <label htmlFor="project-image-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#6B4E3D", color: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(184, 92, 56, 0.08)" } }}>
                      Upload main image
                    </Button>
                  </label>
                </Box>
                {imagePreview ? (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      position: "relative",
                      maxWidth: 400,
                    }}
                  >
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
                      sx={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        borderRadius: "8px",
                        mb: 1,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#333" }}>
                      {imageFile?.name}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "2px dashed #ccc",
                      borderRadius: 2,
                      p: 3,
                      textAlign: "center",
                      bgcolor: "#f9f9f9",
                      maxWidth: 400,
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 48, opacity: 0.3 }} />
                    <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                      No image selected. Click "Upload main image" to add one.
                    </Typography>
                  </Box>
                )}
                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Map location</Typography>
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

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>SEO</Typography>
              <TextField fullWidth label="Meta title" value={form.metaTitle} onChange={(e) => handleInputChange("metaTitle", e.target.value)} />
              <TextField fullWidth label="Meta description" multiline rows={2} value={form.metaDescription} onChange={(e) => handleInputChange("metaDescription", e.target.value)} />

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleCreate} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>
                  {saving ? "Creating..." : "Create project"}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/projects")} sx={{ flex: 1, color: "#6B4E3D", borderColor: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(107, 78, 61, 0.1)" } }}>
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

export default ProjectCreate;
