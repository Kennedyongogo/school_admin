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
  OutlinedInput,
} from "@mui/material";
import { ArrowBack, Save, CloudUpload, Close as CloseIcon, Build, Add } from "@mui/icons-material";
import Swal from "sweetalert2";

const STATUS_OPTIONS = ["draft", "published", "archived"];
const BADGE_COLORS = ["primary", "info", "success", "warning", "error"];

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
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <TextField fullWidth size="small" placeholder={placeholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} />
        <Button variant="outlined" onClick={handleAddItem} disabled={!inputValue.trim() || value.includes(inputValue.trim())} startIcon={<Add />} sx={{ minWidth: "auto" }}>Add</Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip key={index} label={item} onDelete={() => handleRemoveItem(item)} size="small" />
          ))}
        </Box>
      )}
    </Box>
  );
};

const ServiceEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState(null);
  const [existingImageLoadError, setExistingImageLoadError] = useState(false);

  const [serviceList, setServiceList] = useState([]);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    shortDescription: "",
    image: "",
    imageAltText: "",
    icon: "",
    isKeyService: false,
    badgeLabel: "",
    badgeColor: "",
    displayOrder: 0,
    priority: 0,
    status: "draft",
    featured: false,
    metaTitle: "",
    metaDescription: "",
    fullContent: "",
    benefits: [],
    useCases: [],
    relatedServiceIds: [],
  });

  const buildImageUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchService();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/services?limit=200", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setServiceList(data.data);
      })
      .catch(() => setServiceList([]));
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setNewImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setNewImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const fetchService = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load service");

      const s = data.data;
      const benefits = Array.isArray(s.benefits) ? s.benefits : [];
      const useCases = Array.isArray(s.useCases) ? s.useCases : [];

      setForm({
        slug: s.slug || "",
        title: s.title || "",
        description: s.description || "",
        shortDescription: s.shortDescription || "",
        image: s.image || "",
        imageAltText: s.imageAltText || "",
        icon: s.icon || "",
        isKeyService: !!s.isKeyService,
        badgeLabel: s.badgeLabel || "",
        badgeColor: s.badgeColor || "",
        displayOrder: s.displayOrder ?? 0,
        priority: s.priority ?? 0,
        status: s.status || "draft",
        featured: !!s.featured,
        metaTitle: s.metaTitle || "",
        metaDescription: s.metaDescription || "",
        fullContent: s.fullContent || "",
        benefits,
        useCases,
        relatedServiceIds: Array.isArray(s.relatedServiceIds) ? s.relatedServiceIds : [],
      });
    } catch (err) {
      setError(err.message || "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "title" && !form.slug) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: "Max 10MB" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Invalid file type", text: "Please select an image" });
      return;
    }
    setImageFile(file);
    event.target.value = "";
  };

  const removeNewImage = () => {
    setImageFile(null);
  };

  const isFormValid = () => form.title.trim() && form.description.trim() && form.slug.trim();

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      if (form.shortDescription) formData.append("shortDescription", form.shortDescription);
      formData.append("image", form.image || "");
      if (form.imageAltText) formData.append("imageAltText", form.imageAltText);
      if (form.icon) formData.append("icon", form.icon);
      formData.append("isKeyService", form.isKeyService);
      if (form.badgeLabel) formData.append("badgeLabel", form.badgeLabel);
      if (form.badgeColor) formData.append("badgeColor", form.badgeColor);
      formData.append("displayOrder", String(form.displayOrder));
      formData.append("priority", String(form.priority));
      formData.append("status", form.status);
      formData.append("featured", form.featured);
      if (form.metaTitle) formData.append("metaTitle", form.metaTitle);
      if (form.metaDescription) formData.append("metaDescription", form.metaDescription);
      if (form.fullContent) formData.append("fullContent", form.fullContent);
      formData.append("benefits", JSON.stringify(form.benefits));
      formData.append("useCases", JSON.stringify(form.useCases));
      formData.append("relatedServiceIds", JSON.stringify(form.relatedServiceIds || []));

      if (imageFile) formData.append("service_image", imageFile);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update service");

      await Swal.fire({ icon: "success", title: "Updated", text: "Service updated successfully", timer: 1500, showConfirmButton: false });
      navigate("/services");
    } catch (err) {
      setError(err.message || "Failed to update service");
      Swal.fire("Error", err.message || "Failed to update service", "error");
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
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/services")}>Back to Services</Button>
      </Container>
    );
  }

  const showExistingImage = form.image && !imageFile && !existingImageLoadError;

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%)", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", p: 3, color: "white", borderRadius: 2, mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton onClick={() => navigate("/services")} sx={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <Build sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Edit Service</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>{form.title || "Service"}</Typography>
            </Box>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Basic info</Typography>
              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Slug (URL)" value={form.slug} onChange={(e) => handleInputChange("slug", e.target.value)} helperText="URL-friendly identifier" />
              <TextField fullWidth label="Short description" multiline rows={2} value={form.shortDescription} onChange={(e) => handleInputChange("shortDescription", e.target.value)} placeholder="Brief text for cards/previews" />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input accept="image/*" type="file" id="service-edit-image" style={{ display: "none" }} onChange={handleImageSelect} />
                  <label htmlFor="service-edit-image">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#6B4E3D", color: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(184, 92, 56, 0.08)" } }}>
                      {imageFile ? "Replace image" : "Upload image"}
                    </Button>
                  </label>
                </Box>
                {imageFile && newImagePreviewUrl ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400, mb: 2 }}>
                    <IconButton onClick={removeNewImage} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" }, zIndex: 2 }} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box component="img" src={newImagePreviewUrl} alt="New preview" sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "8px", mb: 1 }} />
                    <Typography variant="caption" sx={{ color: "#333" }}>{imageFile.name}</Typography>
                  </Box>
                ) : showExistingImage ? (
                  <Box sx={{ mb: 2 }}>
                    <Box
                      component="img"
                      src={buildImageUrl(form.image)}
                      alt={form.imageAltText || form.title}
                      onError={() => setExistingImageLoadError(true)}
                      sx={{ width: "100%", maxWidth: 400, height: 200, objectFit: "cover", borderRadius: 2, border: "2px solid #e0e0e0" }}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: "text.secondary" }}>Current image</Typography>
                  </Box>
                ) : existingImageLoadError && !imageFile ? (
                  <Box sx={{ width: "100%", maxWidth: 400, height: 140, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5", borderRadius: 2, border: "1px dashed #ccc", mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Image failed to load</Typography>
                  </Box>
                ) : null}
                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Settings</Typography>
              <FormControlLabel control={<Switch checked={form.isKeyService} onChange={(e) => handleInputChange("isKeyService", e.target.checked)} color="primary" />} label="Key service" />
              <FormControlLabel control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />} label="Featured" />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => handleInputChange("status", e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth type="number" label="Display order" value={form.displayOrder} onChange={(e) => handleInputChange("displayOrder", Number(e.target.value) || 0)} inputProps={{ min: 0 }} />
              <TextField fullWidth type="number" label="Priority" value={form.priority} onChange={(e) => handleInputChange("priority", Number(e.target.value) || 0)} inputProps={{ min: 0 }} />
              <TextField fullWidth label="Badge label" value={form.badgeLabel} onChange={(e) => handleInputChange("badgeLabel", e.target.value)} placeholder="e.g. Specialized" />
              <FormControl fullWidth>
                <InputLabel>Badge color</InputLabel>
                <Select value={form.badgeColor || ""} label="Badge color" onChange={(e) => handleInputChange("badgeColor", e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {BADGE_COLORS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField fullWidth label="Icon name" value={form.icon} onChange={(e) => handleInputChange("icon", e.target.value)} placeholder="e.g. Architecture" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Benefits & use cases</Typography>
              <ChipArrayField label="Benefits" value={form.benefits} onChange={(v) => handleInputChange("benefits", v)} placeholder="Add benefit..." />
              <ChipArrayField label="Use cases" value={form.useCases} onChange={(v) => handleInputChange("useCases", v)} placeholder="Add use case..." />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Related services</Typography>
              <FormControl fullWidth>
                <InputLabel id="related-services-edit-label">Related services</InputLabel>
                <Select
                  labelId="related-services-edit-label"
                  multiple
                  value={form.relatedServiceIds}
                  onChange={(e) => handleInputChange("relatedServiceIds", e.target.value)}
                  input={<OutlinedInput label="Related services" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((id) => {
                        const svc = serviceList.find((s) => s.id === id);
                        return (
                          <Chip
                            key={id}
                            label={svc ? svc.title : id}
                            size="small"
                            onDelete={() =>
                              handleInputChange(
                                "relatedServiceIds",
                                form.relatedServiceIds.filter((x) => x !== id)
                              )
                            }
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {serviceList.filter((s) => s.id !== id).map((svc) => (
                    <MenuItem key={svc.id} value={svc.id} disabled={form.relatedServiceIds.includes(svc.id)}>
                      {svc.title}
                    </MenuItem>
                  ))}
                  {serviceList.length === 0 && <MenuItem disabled>No other services yet</MenuItem>}
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#6B4E3D" }}>Full content & SEO</Typography>
              <TextField fullWidth label="Full content (detail page)" multiline rows={6} value={form.fullContent} onChange={(e) => handleInputChange("fullContent", e.target.value)} />
              <TextField fullWidth label="Meta title" value={form.metaTitle} onChange={(e) => handleInputChange("metaTitle", e.target.value)} />
              <TextField fullWidth label="Meta description" multiline rows={2} value={form.metaDescription} onChange={(e) => handleInputChange("metaDescription", e.target.value)} />

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={<Save />} onClick={handleSave} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/services")} sx={{ flex: 1, color: "#6B4E3D", borderColor: "#6B4E3D", "&:hover": { borderColor: "#B85C38", backgroundColor: "rgba(107, 78, 61, 0.1)" } }}>
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

export default ServiceEdit;
