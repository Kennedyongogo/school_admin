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
import { ArrowBack, Save, CloudUpload, Close as CloseIcon, Event, Add } from "@mui/icons-material";
import Swal from "sweetalert2";
import LocationMapPicker from "../../Projects/LocationMapPicker";

const TYPE_OPTIONS = ["Workshop", "Training", "Field day", "Seminar"];

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
            background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)",
            "&:hover": { background: "linear-gradient(135deg, #13a842 0%, #0f8a35 100%)" },
          }}
        >
          Add
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip key={index} label={item} onDelete={() => handleRemoveItem(item)} size="small" sx={{ backgroundColor: "#17cf54", color: "white" }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const TrainingEventEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [deleteImage, setDeleteImage] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    endDate: "",
    location: "",
    latitude: "",
    longitude: "",
    type: "Workshop",
    imageAltText: "",
    registrationUrl: "",
    capacity: "",
    price: "",
    currency: "USD",
    organizer: "",
    contactEmail: "",
    contactPhone: "",
    tags: [],
    featured: false,
    isActive: true,
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
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!imageFile) {
      setNewImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setNewImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/training-events/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load training event");
      
      const event = data.data;
      setForm({
        title: event.title || "",
        description: event.description || "",
        date: event.date ? event.date.split("T")[0] : "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        endDate: event.endDate ? event.endDate.split("T")[0] : "",
        location: event.location || "",
        latitude: event.latitude?.toString() || "",
        longitude: event.longitude?.toString() || "",
        type: event.type || "Workshop",
        imageAltText: event.imageAltText || "",
        registrationUrl: event.registrationUrl || "",
        capacity: event.capacity?.toString() || "",
        price: event.price?.toString() || "",
        currency: event.currency || "USD",
        organizer: event.organizer || "",
        contactEmail: event.contactEmail || "",
        contactPhone: event.contactPhone || "",
        tags: Array.isArray(event.tags) ? event.tags : [],
        featured: event.featured || false,
        isActive: event.isActive !== undefined ? event.isActive : true,
      });
      if (event.image) {
        setExistingImage(event.image);
      }
    } catch (err) {
      setError(err.message || "Failed to load training event");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    setDeleteImage(false);
    event.target.value = "";
  };

  const removeImageFile = () => {
    setImageFile(null);
    setNewImagePreviewUrl(null);
    setDeleteImage(true);
  };

  const isFormValid = () =>
    form.title.trim() &&
    form.description.trim() &&
    form.location.trim() &&
    form.type;

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("location", form.location.trim());
      formData.append("type", form.type);
      if (form.date) formData.append("date", form.date);
      if (form.startTime) formData.append("startTime", form.startTime);
      if (form.endTime) formData.append("endTime", form.endTime);
      if (form.endDate) formData.append("endDate", form.endDate);
      if (form.latitude !== "") formData.append("latitude", form.latitude);
      if (form.longitude !== "") formData.append("longitude", form.longitude);
      if (form.imageAltText) formData.append("imageAltText", form.imageAltText);
      if (form.registrationUrl) formData.append("registrationUrl", form.registrationUrl);
      if (form.capacity !== "") formData.append("capacity", form.capacity);
      if (form.price !== "") formData.append("price", form.price);
      if (form.currency) formData.append("currency", form.currency);
      if (form.organizer) formData.append("organizer", form.organizer);
      if (form.contactEmail) formData.append("contactEmail", form.contactEmail);
      if (form.contactPhone) formData.append("contactPhone", form.contactPhone);
      formData.append("tags", JSON.stringify(form.tags));
      formData.append("featured", form.featured);
      formData.append("isActive", form.isActive);
      if (imageFile) formData.append("training_event_image", imageFile);
      if (deleteImage) formData.append("delete_image", "true");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/training-events/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({ title: "Success!", text: "Training event updated successfully.", icon: "success", confirmButtonColor: "#17cf54" });
        navigate("/marketplace");
      } else {
        throw new Error(result.message || "Failed to update training event");
      }
    } catch (err) {
      setError(err.message || "Failed to update training event");
      await Swal.fire({ title: "Error!", text: err.message || "Failed to update training event", icon: "error", confirmButtonColor: "#17cf54" });
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

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)", p: 3, color: "white", borderRadius: 2, mb: 4, position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <IconButton onClick={() => navigate("/marketplace")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <Event sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Edit Training Event
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Basic Information</Typography>
              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />
              
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select value={form.type} label="Type *" onChange={(e) => handleInputChange("type", e.target.value)}>
                  {TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Date & Time</Typography>
              <TextField fullWidth type="date" label="Event Date" value={form.date} onChange={(e) => handleInputChange("date", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="time" label="Start Time" value={form.startTime} onChange={(e) => handleInputChange("startTime", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="time" label="End Time" value={form.endTime} onChange={(e) => handleInputChange("endTime", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth type="date" label="End Date (for multi-day events)" value={form.endDate} onChange={(e) => handleInputChange("endDate", e.target.value)} InputLabelProps={{ shrink: true }} />

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

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Event Details</Typography>
              <TextField fullWidth label="Organizer" value={form.organizer} onChange={(e) => handleInputChange("organizer", e.target.value)} />
              <TextField fullWidth type="number" label="Capacity" value={form.capacity} onChange={(e) => handleInputChange("capacity", e.target.value)} inputProps={{ min: 0 }} helperText="Maximum number of participants" />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField fullWidth type="number" label="Price" value={form.price} onChange={(e) => handleInputChange("price", e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select value={form.currency} label="Currency" onChange={(e) => handleInputChange("currency", e.target.value)}>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="KES">KES</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField fullWidth label="Registration URL" value={form.registrationUrl} onChange={(e) => handleInputChange("registrationUrl", e.target.value)} helperText="External registration link (optional)" />
              <TextField fullWidth type="email" label="Contact Email" value={form.contactEmail} onChange={(e) => handleInputChange("contactEmail", e.target.value)} />
              <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => handleInputChange("contactPhone", e.target.value)} />

              <ChipArrayField label="Tags" value={form.tags} onChange={(v) => handleInputChange("tags", v)} placeholder="Add tag" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Settings</Typography>
              <FormControlLabel
                control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />}
                label="Featured"
              />
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => handleInputChange("isActive", e.target.checked)} color="primary" />}
                label="Active"
              />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#17cf54" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="training-event-image-upload" onChange={handleImageSelect} />
                  <label htmlFor="training-event-image-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#17cf54", color: "#17cf54", "&:hover": { borderColor: "#13a842", backgroundColor: "rgba(23, 207, 84, 0.08)" } }}>
                      {existingImage ? "Replace image" : "Upload image"}
                    </Button>
                  </label>
                </Box>
                {newImagePreviewUrl ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400 }}>
                    <IconButton onClick={removeImageFile} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" }, zIndex: 2 }} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box component="img" src={newImagePreviewUrl} alt="Preview" sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "8px", mb: 1 }} />
                    <Typography variant="caption" sx={{ color: "#333" }}>{imageFile?.name}</Typography>
                  </Box>
                ) : existingImage && !deleteImage ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400 }}>
                    <IconButton onClick={removeImageFile} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" }, zIndex: 2 }} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box component="img" src={buildImageUrl(existingImage)} alt="Current" onError={() => setExistingImageLoadError(true)} sx={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "8px", mb: 1 }} />
                    {existingImageLoadError && <Typography variant="caption" color="error">Failed to load image</Typography>}
                  </Box>
                ) : (
                  <Box sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center", bgcolor: "#f9f9f9", maxWidth: 400 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>No image selected</Typography>
                  </Box>
                )}
                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleUpdate} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #17cf54 0%, #13a842 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #13a842 0%, #0f8a35 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>
                  {saving ? "Updating..." : "Update Training Event"}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/marketplace")} sx={{ flex: 1, color: "#17cf54", borderColor: "#17cf54", "&:hover": { borderColor: "#13a842", backgroundColor: "rgba(23, 207, 84, 0.1)" } }}>
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

export default TrainingEventEdit;
