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
import { ArrowBack, Save, CloudUpload, Close as CloseIcon, Work, Add } from "@mui/icons-material";
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
        <TextField fullWidth size="small" placeholder={placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} />
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

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

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
  const [existingImage, setExistingImage] = useState(null);
  const [existingImageLoadError, setExistingImageLoadError] = useState(false);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState(null);

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

  // Preview URL for newly selected file (revoke on cleanup to avoid memory leaks)
  useEffect(() => {
    if (!imageFile) {
      setNewImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setNewImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load project");

      const p = data.data;
      const tags = Array.isArray(p.tags) ? p.tags : [];
      const impactMetrics = Array.isArray(p.impactMetrics) ? p.impactMetrics : [];

      setForm({
        slug: p.slug || "",
        title: p.title || "",
        description: p.description || "",
        shortDescription: p.shortDescription || "",
        location: p.location || "",
        imageAltText: p.imageAltText || "",
        tags,
        category: p.category || "",
        featured: !!p.featured,
        priority: p.priority ?? 0,
        displayOrder: p.displayOrder ?? 0,
        status: p.status || "draft",
        projectStatus: p.projectStatus || "pending",
        fullContent: p.fullContent || "",
        clientName: p.clientName || "",
        startDate: p.startDate ? p.startDate.slice(0, 10) : "",
        endDate: p.endDate ? p.endDate.slice(0, 10) : "",
        farmersTrained: p.farmersTrained != null ? String(p.farmersTrained) : "",
        roiIncreasePercent: p.roiIncreasePercent != null ? String(p.roiIncreasePercent) : "",
        impactMetrics: impactMetrics.map((m) => (typeof m === "object" ? JSON.stringify(m) : String(m))),
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
      });
      setExistingImage(p.image || null);
      setExistingImageLoadError(false);
    } catch (err) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => form.title.trim() && form.description.trim() && form.location.trim() && form.slug.trim();

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("slug", form.slug.trim());
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
      if (deleteImage) formData.append("delete_image", "true");

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update project");

      await Swal.fire({ icon: "success", title: "Updated", text: "Project updated successfully", timer: 1400, showConfirmButton: false });
      navigate("/projects");
    } catch (err) {
      setError(err.message || "Failed to update project");
      Swal.fire("Error", err.message || "Failed to update project", "error");
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

  if (error && !form.title) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/projects")}>Back to Projects</Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", p: { xs: 0.5, md: 0.5 } }}>
      <Container maxWidth="lg" sx={{ px: 0.5 }}>
        <Box sx={{ background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", p: 3, color: "white", borderRadius: 2, position: "relative", mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2} position="relative" zIndex={1}>
            <IconButton onClick={() => navigate("/projects")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <Work sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>Edit Project</Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>{form.title}</Typography>
            </Box>
            <Box ml="auto" display="flex" gap={1}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={!isFormValid() || saving} sx={{ background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" }, "&:disabled": { backgroundColor: "rgba(255,255,255,0.15)" } }}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Basic info</Typography>
              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Slug (URL)" value={form.slug} onChange={(e) => handleInputChange("slug", e.target.value)} />
              <TextField fullWidth label="Location *" value={form.location} onChange={(e) => handleInputChange("location", e.target.value)} />
              <TextField fullWidth label="Short description" multiline rows={2} value={form.shortDescription} onChange={(e) => handleInputChange("shortDescription", e.target.value)} placeholder="Brief for cards/previews" />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />
              <TextField fullWidth label="Full content (detail page)" multiline rows={6} value={form.fullContent} onChange={(e) => handleInputChange("fullContent", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Category & status</Typography>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={(e) => handleInputChange("category", e.target.value)}>
                  <MenuItem value="">—</MenuItem>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Content status</InputLabel>
                <Select value={form.status} label="Content status" onChange={(e) => handleInputChange("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Execution status</InputLabel>
                <Select value={form.projectStatus} label="Execution status" onChange={(e) => handleInputChange("projectStatus", e.target.value)}>
                  {PROJECT_STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />} label="Featured" />
              <TextField fullWidth type="number" label="Priority" value={form.priority} onChange={(e) => handleInputChange("priority", e.target.value)} inputProps={{ min: 0 }} />
              <TextField fullWidth type="number" label="Display order" value={form.displayOrder} onChange={(e) => handleInputChange("displayOrder", e.target.value)} inputProps={{ min: 0 }} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Project details</Typography>
              <TextField fullWidth label="Client name" value={form.clientName} onChange={(e) => handleInputChange("clientName", e.target.value)} />
              <TextField fullWidth type="date" label="Start date" value={form.startDate} onChange={(e) => handleInputChange("startDate", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="date" label="End date" value={form.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="number" label="Farmers trained" value={form.farmersTrained} onChange={(e) => handleInputChange("farmersTrained", e.target.value)} placeholder="e.g. 120" inputProps={{ min: 0 }} helperText="Number of farmers trained (used for portal stats)" />
              <TextField fullWidth type="number" label="ROI increase (%)" value={form.roiIncreasePercent} onChange={(e) => handleInputChange("roiIncreasePercent", e.target.value)} placeholder="e.g. 25" inputProps={{ min: 0, max: 100, step: 0.01 }} helperText="ROI increase percentage (used for portal stats)" />

              <ChipArrayField label="Tags" value={form.tags} onChange={(v) => handleInputChange("tags", v)} placeholder="Add tag" />
              <ChipArrayField label="Impact metrics" value={form.impactMetrics} onChange={(v) => handleInputChange("impactMetrics", v)} placeholder="e.g. Farmers trained: 120" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                {existingImage && !deleteImage && !imageFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Current image</Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                      {!existingImageLoadError ? (
                        <Box
                          component="img"
                          src={buildImageUrl(existingImage)}
                          alt={form.imageAltText || form.title}
                          sx={{ maxWidth: 200, maxHeight: 150, objectFit: "cover", borderRadius: 2, border: "1px solid #eee" }}
                          onError={() => setExistingImageLoadError(true)}
                        />
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 200, minHeight: 100, bgcolor: "#f5f5f5", borderRadius: 2, border: "1px solid #eee", p: 2 }}>
                          <Typography variant="body2" color="text.secondary" textAlign="center">Image failed to load</Typography>
                        </Box>
                      )}
                      <Button size="small" color="error" onClick={() => setDeleteImage(true)}>Remove image</Button>
                    </Box>
                  </Box>
                )}
                {imageFile && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>New image (preview)</Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                      {newImagePreviewUrl && (
                        <Box component="img" src={newImagePreviewUrl} alt="Preview" sx={{ maxWidth: 200, maxHeight: 150, objectFit: "cover", borderRadius: 2, border: "1px solid #eee" }} />
                      )}
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{imageFile.name}</Typography>
                        <IconButton size="small" onClick={() => setImageFile(null)} sx={{ alignSelf: "flex-start" }}><CloseIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  </Box>
                )}
                {deleteImage && !imageFile && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Image will be removed on save. Upload a new one to replace.</Typography>}
                <input type="file" accept="image/*" style={{ display: "none" }} id="project-image-upload-edit" onChange={(e) => { setImageFile(e.target.files?.[0] || null); setDeleteImage(false); }} />
                <label htmlFor="project-image-upload-edit">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#6B4E3D", color: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(184, 92, 56, 0.08)" } }}>Upload new image</Button>
                </label>
                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Map location</Typography>
              <Box sx={{ width: "100%" }}>
                <LocationMapPicker latitude={form.latitude} longitude={form.longitude} onLocationChange={(lat, lng) => { handleInputChange("latitude", lat); handleInputChange("longitude", lng); }} />
              </Box>
              <TextField fullWidth label="Latitude" value={form.latitude} InputProps={{ readOnly: true }} helperText="Set via map" />
              <TextField fullWidth label="Longitude" value={form.longitude} InputProps={{ readOnly: true }} helperText="Set via map" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>SEO</Typography>
              <TextField fullWidth label="Meta title" value={form.metaTitle} onChange={(e) => handleInputChange("metaTitle", e.target.value)} />
              <TextField fullWidth label="Meta description" multiline rows={2} value={form.metaDescription} onChange={(e) => handleInputChange("metaDescription", e.target.value)} />

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleSave} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>{saving ? "Saving..." : "Save"}</Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/projects")} sx={{ flex: 1, color: "#6B4E3D", borderColor: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(107, 78, 61, 0.1)" } }}>Cancel</Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProjectEdit;
