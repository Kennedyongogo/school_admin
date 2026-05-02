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
import { Save, ArrowBack, CloudUpload, Close as CloseIcon, AttachMoney, Add, Image as ImageIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const FUNDING_TYPE_OPTIONS = ["Grant", "Loan", "Equity", "Other"];

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
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            "&:hover": { background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" },
          }}
        >
          Add
        </Button>
      </Box>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((item, index) => (
            <Chip key={index} label={item} onDelete={() => handleRemoveItem(item)} size="small" sx={{ backgroundColor: "#f59e0b", color: "white" }} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const GrantCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    title: "",
    badge: "Funding",
    description: "",
    amount: "",
    amountMin: "",
    amountMax: "",
    currency: "USD",
    deadline: "",
    deadlineText: "",
    isRolling: false,
    imageAltText: "",
    applicationUrl: "",
    eligibilityCriteria: "",
    requirements: "",
    fundingType: "",
    sector: "",
    targetAudience: "",
    organization: "",
    contactEmail: "",
    contactPhone: "",
    tags: [],
    featured: false,
    isActive: true,
  });

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    form.badge.trim() &&
    form.description.trim();

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("badge", form.badge.trim());
      formData.append("description", form.description.trim());
      if (form.amount) formData.append("amount", form.amount);
      if (form.amountMin !== "") formData.append("amountMin", form.amountMin);
      if (form.amountMax !== "") formData.append("amountMax", form.amountMax);
      if (form.currency) formData.append("currency", form.currency);
      if (form.deadline) formData.append("deadline", form.deadline);
      if (form.deadlineText) formData.append("deadlineText", form.deadlineText);
      formData.append("isRolling", form.isRolling);
      if (form.imageAltText) formData.append("imageAltText", form.imageAltText);
      if (form.applicationUrl) formData.append("applicationUrl", form.applicationUrl);
      if (form.eligibilityCriteria) formData.append("eligibilityCriteria", form.eligibilityCriteria);
      if (form.requirements) formData.append("requirements", form.requirements);
      if (form.fundingType) formData.append("fundingType", form.fundingType);
      if (form.sector) formData.append("sector", form.sector);
      if (form.targetAudience) formData.append("targetAudience", form.targetAudience);
      if (form.organization) formData.append("organization", form.organization);
      if (form.contactEmail) formData.append("contactEmail", form.contactEmail);
      if (form.contactPhone) formData.append("contactPhone", form.contactPhone);
      formData.append("tags", JSON.stringify(form.tags));
      formData.append("featured", form.featured);
      formData.append("isActive", form.isActive);
      if (imageFile) formData.append("grant_image", imageFile);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/grants", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageFile(null);
        setImagePreview(null);
        await Swal.fire({ title: "Success!", text: "Grant created successfully.", icon: "success", confirmButtonColor: "#f59e0b" });
        navigate("/marketplace");
      } else {
        throw new Error(result.message || "Failed to create grant");
      }
    } catch (err) {
      setError(err.message || "Failed to create grant");
      await Swal.fire({ title: "Error!", text: err.message || "Failed to create grant", icon: "error", confirmButtonColor: "#f59e0b" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, rgba(245, 241, 232, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(232, 224, 209, 0.95) 100%)", py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", p: 3, color: "white", borderRadius: 2, mb: 4, position: "relative" }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative", zIndex: 1 }}>
            <IconButton onClick={() => navigate("/marketplace")} sx={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.3)" } }}>
              <ArrowBack />
            </IconButton>
            <AttachMoney sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              Create Grant
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mt: 2, position: "relative", zIndex: 1 }}>{error}</Alert>}
        </Box>

        <Card sx={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", border: "1px solid #e0e0e0" }}>
          <CardContent sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Stack spacing={3} sx={{ width: "100%" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Basic Information</Typography>
              <TextField fullWidth label="Title *" value={form.title} onChange={(e) => handleInputChange("title", e.target.value)} />
              <TextField fullWidth label="Badge *" value={form.badge} onChange={(e) => handleInputChange("badge", e.target.value)} helperText="e.g., 'Funding', 'Grant'" />
              <TextField fullWidth label="Description *" multiline rows={4} value={form.description} onChange={(e) => handleInputChange("description", e.target.value)} />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Funding Details</Typography>
              <TextField fullWidth label="Amount (display text)" value={form.amount} onChange={(e) => handleInputChange("amount", e.target.value)} helperText="e.g., 'Up to $10,000' or 'Flexible Grants'" />
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField fullWidth type="number" label="Min Amount" value={form.amountMin} onChange={(e) => handleInputChange("amountMin", e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                <TextField fullWidth type="number" label="Max Amount" value={form.amountMax} onChange={(e) => handleInputChange("amountMax", e.target.value)} inputProps={{ min: 0, step: 0.01 }} />
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select value={form.currency} label="Currency" onChange={(e) => handleInputChange("currency", e.target.value)}>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="KES">KES</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Funding Type</InputLabel>
                <Select value={form.fundingType} label="Funding Type" onChange={(e) => handleInputChange("fundingType", e.target.value)}>
                  <MenuItem value="">—</MenuItem>
                  {FUNDING_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Deadline</Typography>
              <TextField fullWidth type="date" label="Deadline" value={form.deadline} onChange={(e) => handleInputChange("deadline", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField fullWidth label="Deadline Text" value={form.deadlineText} onChange={(e) => handleInputChange("deadlineText", e.target.value)} helperText="e.g., 'Open Rolling Basis'" />
              <FormControlLabel
                control={<Switch checked={form.isRolling} onChange={(e) => handleInputChange("isRolling", e.target.checked)} color="primary" />}
                label="Rolling Deadline"
              />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Grant Details</Typography>
              <TextField fullWidth label="Organization" value={form.organization} onChange={(e) => handleInputChange("organization", e.target.value)} />
              <TextField fullWidth label="Sector" value={form.sector} onChange={(e) => handleInputChange("sector", e.target.value)} helperText="e.g., 'Agriculture', 'Technology'" />
              <TextField fullWidth label="Target Audience" value={form.targetAudience} onChange={(e) => handleInputChange("targetAudience", e.target.value)} helperText="e.g., 'Women-led', 'Smallholders'" />
              <TextField fullWidth label="Application URL" value={form.applicationUrl} onChange={(e) => handleInputChange("applicationUrl", e.target.value)} />
              <TextField fullWidth label="Eligibility Criteria" multiline rows={3} value={form.eligibilityCriteria} onChange={(e) => handleInputChange("eligibilityCriteria", e.target.value)} />
              <TextField fullWidth label="Requirements" multiline rows={3} value={form.requirements} onChange={(e) => handleInputChange("requirements", e.target.value)} />
              <TextField fullWidth type="email" label="Contact Email" value={form.contactEmail} onChange={(e) => handleInputChange("contactEmail", e.target.value)} />
              <TextField fullWidth label="Contact Phone" value={form.contactPhone} onChange={(e) => handleInputChange("contactPhone", e.target.value)} />

              <ChipArrayField label="Tags" value={form.tags} onChange={(v) => handleInputChange("tags", v)} placeholder="Add tag" />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Settings</Typography>
              <FormControlLabel
                control={<Switch checked={form.featured} onChange={(e) => handleInputChange("featured", e.target.checked)} color="primary" />}
                label="Featured"
              />
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={(e) => handleInputChange("isActive", e.target.checked)} color="primary" />}
                label="Active"
              />

              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f59e0b" }}>Image</Typography>
              <Box sx={{ width: "100%" }}>
                <Box sx={{ mb: 2 }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} id="grant-image-upload" onChange={handleImageSelect} />
                  <label htmlFor="grant-image-upload">
                    <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { borderColor: "#d97706", backgroundColor: "rgba(245, 158, 11, 0.08)" } }}>
                      Upload image
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
                      No image selected. Click "Upload image" to add one.
                    </Typography>
                  </Box>
                )}
                <TextField fullWidth label="Image alt text" value={form.imageAltText} onChange={(e) => handleInputChange("imageAltText", e.target.value)} sx={{ mt: 2 }} />
              </Box>

              <Box display="flex" gap={2}>
                <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} onClick={handleCreate} disabled={!isFormValid() || saving} sx={{ flex: 1, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white", "&:hover": { background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)" }, "&:disabled": { background: "#e0e0e0", color: "#999" } }}>
                  {saving ? "Creating..." : "Create Grant"}
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate("/marketplace")} sx={{ flex: 1, color: "#f59e0b", borderColor: "#f59e0b", "&:hover": { borderColor: "#d97706", backgroundColor: "rgba(245, 158, 11, 0.1)" } }}>
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

export default GrantCreate;
