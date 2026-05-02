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
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material";
import { ArrowBack, Save, CloudUpload, Close as CloseIcon, Business, Add } from "@mui/icons-material";
import Swal from "sweetalert2";

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
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            "&:hover": { background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" },
          }}
        >
          Add
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip key={index} label={item} onDelete={() => handleRemoveItem(item)} size="small" sx={{ backgroundColor: "#3b82f6", color: "white" }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const PartnerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [deleteLogo, setDeleteLogo] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    logoAltText: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    sector: "",
    services: [],
    featured: false,
    isActive: true,
  });
  const [existingLogo, setExistingLogo] = useState(null);
  const [existingLogoLoadError, setExistingLogoLoadError] = useState(false);
  const [newLogoPreviewUrl, setNewLogoPreviewUrl] = useState(null);

  const buildLogoUrl = (path) => {
    if (!path) return null;
    const normalized = path.replace(/\\/g, "/");
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) return normalized;
    return `/${normalized}`;
  };

  useEffect(() => {
    fetchPartner();
  }, [id]);

  useEffect(() => {
    if (!logoFile) {
      setNewLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setNewLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const fetchPartner = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/partners/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load partner");
      
      const partner = data.data;
      setForm({
        name: partner.name || "",
        description: partner.description || "",
        website: partner.websiteUrl || partner.website || "",
        logoAltText: partner.logoAltText || "",
        contactEmail: partner.contactEmail || "",
        contactPhone: partner.contactPhone || "",
        address: partner.address || "",
        sector: partner.sector || "",
        services: Array.isArray(partner.services) ? partner.services : [],
        featured: partner.featured === true,
        isActive: partner.isActive !== undefined ? partner.isActive : true,
      });
      if (partner.logo) {
        setExistingLogo(partner.logo);
      }
    } catch (err) {
      setError(err.message || "Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoSelect = (event) => {
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
    setLogoFile(file);
    setDeleteLogo(false);
    event.target.value = "";
  };

  const removeLogoFile = () => {
    setLogoFile(null);
    setNewLogoPreviewUrl(null);
    setDeleteLogo(true);
  };

  const isFormValid = () =>
    form.name.trim() &&
    form.description.trim();

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      if (form.website) formData.append("website", form.website);
      if (form.logoAltText) formData.append("logoAltText", form.logoAltText);
      if (form.contactEmail) formData.append("contactEmail", form.contactEmail);
      if (form.contactPhone) formData.append("contactPhone", form.contactPhone);
      if (form.address) formData.append("address", form.address);
      if (form.sector) formData.append("sector", form.sector);
      formData.append("services", JSON.stringify(form.services));
      formData.append("featured", form.featured);
      formData.append("isActive", form.isActive);
      if (logoFile) formData.append("partner_logo", logoFile);
      if (deleteLogo) formData.append("delete_logo", "true");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/partners/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        await Swal.fire({ title: "Success!", text: "Partner updated successfully.", icon: "success", confirmButtonColor: "#3b82f6" });
        navigate("/marketplace");
      } else {
        throw new Error(result.message || "Failed to update partner");
      }
    } catch (err) {
      setError(err.message || "Failed to update partner");
      await Swal.fire({ title: "Error!", text: err.message || "Failed to update partner", icon: "error", confirmButtonColor: "#3b82f6" });
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
        <Box sx={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", p: 3, color: "white", borderRadius: 2, mb: 4, position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <IconButton onClick={() => navigate("/marketplace")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <Business sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Edit Partner
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#3b82f6" }}>Basic Information</Typography>
              <TextField fullWidth label="Name *" value={form.name} onChange={(e) => handleInputChange("name", e.target.value)} />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />
              <TextField fullWidth label="Website" value={form.website} onChange={(e) => handleInputChange("website", e.target.value)} helperText="Full URL (e.g., https://example.com)" />
              <TextField fullWidth label="Sector" value={form.sector} onChange={(e) => handleInputChange("sector", e.target.value)} helperText="e.g., 'Agriculture', 'Technology', 'Finance'" />
              <TextField fullWidth label="Address" value={form.address} onChange={(e) => handleInputChange("address", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#3b82f6" }}>Contact Information</Typography>
              <TextField fullWidth type="email" label="Contact Email" value={form.contactEmail} onChange={(e) => handleInputChange("contactEmail", e.target.value)} />
              <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => handleInputChange("contactPhone", e.target.value)} />

              <ChipArrayField label="Services" value={form.services} onChange={(v) => handleInputChange("services", v)} placeholder="Add service" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#3b82f6" }}>Settings</Typography>
              <FormControlLabel
                control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />}
                label="Featured"
              />
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => handleInputChange("isActive", e.target.checked)} color="primary" />}
                label="Active"
              />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#3b82f6" }}>Logo</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="partner-logo-upload" onChange={handleLogoSelect} />
                  <label htmlFor="partner-logo-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#3b82f6", color: "#3b82f6", "&:hover": { borderColor: "#2563eb", backgroundColor: "rgba(59, 130, 246, 0.08)" } }}>
                      {existingLogo ? "Replace logo" : "Upload logo"}
                    </Button>
                  </label>
                </Box>
                {newLogoPreviewUrl ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400 }}>
                    <IconButton onClick={removeLogoFile} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" }, zIndex: 2 }} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box component="img" src={newLogoPreviewUrl} alt="Preview" sx={{ width: "100%", height: 200, objectFit: "contain", borderRadius: "8px", mb: 1 }} />
                    <Typography variant="caption" sx={{ color: "#333" }}>{logoFile?.name}</Typography>
                  </Box>
                ) : existingLogo && !deleteLogo ? (
                  <Box sx={{ p: 2, backgroundColor: "#f8f9fa", borderRadius: 2, border: "1px solid #e0e0e0", position: "relative", maxWidth: 400 }}>
                    <IconButton onClick={removeLogoFile} sx={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" }, zIndex: 2 }} size="small">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    <Box component="img" src={buildLogoUrl(existingLogo)} alt="Current" onError={() => setExistingLogoLoadError(true)} sx={{ width: "100%", height: 200, objectFit: "contain", borderRadius: "8px", mb: 1 }} />
                    {existingLogoLoadError && <Typography variant="caption" color="error">Failed to load logo</Typography>}
                  </Box>
                ) : (
                  <Box sx={{ border: "2px dashed #ccc", borderRadius: 2, p: 3, textAlign: "center", bgcolor: "#f9f9f9", maxWidth: 400 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>No logo selected</Typography>
                  </Box>
                )}
                <TextField fullWidth label="Logo alt text" value={form.logoAltText} onChange={(e) => handleInputChange("logoAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleUpdate} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>
                  {saving ? "Updating..." : "Update Partner"}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/marketplace")} sx={{ flex: 1, color: "#3b82f6", borderColor: "#3b82f6", "&:hover": { borderColor: "#2563eb", backgroundColor: "rgba(59, 130, 246, 0.1)" } }}>
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

export default PartnerEdit;
