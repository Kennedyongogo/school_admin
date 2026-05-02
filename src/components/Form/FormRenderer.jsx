import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormLabel,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

const FormRenderer = ({ formId, onSubmit }) => {
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldVisibility, setFieldVisibility] = useState({});

  useEffect(() => {
    fetchForm();
  }, [formId]);

  useEffect(() => {
    // Update field visibility when form data changes
    if (form?.fields) {
      updateFieldVisibility();
    }
  }, [formData, form?.fields]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/forms/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load form");

      setForm(data.data);

      // Initialize form data and visibility
      const initialData = {};
      const initialVisibility = {};
      data.data.fields.forEach(field => {
        initialData[field.field_name] = field.default_value || "";
        initialVisibility[field.id] = shouldShowField(field, initialData);
      });
      setFormData(initialData);
      setFieldVisibility(initialVisibility);
    } catch (err) {
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const shouldShowField = (field, currentFormData = formData) => {
    if (!field.conditional_logic) return true;

    const { depends_on_field, show_when_value, hide_when_value } = field.conditional_logic;
    const dependentValue = currentFormData[depends_on_field];

    // If hide_when_value is specified and matches, hide the field
    if (hide_when_value && dependentValue === hide_when_value) {
      return false;
    }

    // If show_when_value is specified, only show when it matches
    if (show_when_value) {
      return dependentValue === show_when_value;
    }

    // If no specific conditions, show by default
    return true;
  };

  const updateFieldVisibility = () => {
    if (!form?.fields) return;

    const newVisibility = {};
    form.fields.forEach(field => {
      newVisibility[field.id] = shouldShowField(field);
    });
    setFieldVisibility(newVisibility);
  };

  const handleInputChange = (fieldName, value) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);

    // Update visibility for fields that depend on this field
    if (form?.fields) {
      const newVisibility = { ...fieldVisibility };
      form.fields.forEach(field => {
        if (field.conditional_logic?.depends_on_field === fieldName) {
          newVisibility[field.id] = shouldShowField(field, newFormData);
        }
      });
      setFieldVisibility(newVisibility);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required visible fields
    const visibleFields = form.fields.filter(field => fieldVisibility[field.id]);
    const missingRequired = visibleFields.filter(field =>
      field.is_required && (!formData[field.field_name] || formData[field.field_name] === "")
    );

    if (missingRequired.length > 0) {
      setError(`Please fill in required fields: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submissionData = {
        form_id: formId,
        responses: formData,
        submitted_at: new Date().toISOString()
      };

      if (onSubmit) {
        await onSubmit(submissionData);
      } else {
        // Default submission logic
        const token = localStorage.getItem("token");
        const res = await fetch("/api/form-submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submissionData),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to submit form");
        }

        alert("Form submitted successfully!");
      }
    } catch (err) {
      setError(err.message || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    if (!fieldVisibility[field.id]) return null;

    const value = formData[field.field_name] || "";
    const isRequired = field.is_required;

    switch (field.field_type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <TextField
            key={field.id}
            fullWidth
            label={`${field.label}${isRequired ? " *" : ""}`}
            type={field.field_type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            required={isRequired}
            helperText={field.help_text}
            sx={{ mb: 2 }}
          />
        );

      case "textarea":
        return (
          <TextField
            key={field.id}
            fullWidth
            multiline
            rows={4}
            label={`${field.label}${isRequired ? " *" : ""}`}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            required={isRequired}
            helperText={field.help_text}
            sx={{ mb: 2 }}
          />
        );

      case "date":
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={`${field.label}${isRequired ? " *" : ""}`}
            value={value}
            onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            required={isRequired}
            helperText={field.help_text}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
        );

      case "select":
        return (
          <FormControl key={field.id} fullWidth sx={{ mb: 2 }}>
            <InputLabel>{`${field.label}${isRequired ? " *" : ""}`}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
              required={isRequired}
              label={`${field.label}${isRequired ? " *" : ""}`}
            >
              {field.options?.map((option, idx) => (
                <MenuItem key={idx} value={option.option_value}>
                  {option.option_label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case "radio":
        return (
          <FormControl key={field.id} component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">
              {`${field.label}${isRequired ? " *" : ""}`}
            </FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleInputChange(field.field_name, e.target.value)}
            >
              {field.options?.map((option, idx) => (
                <FormControlLabel
                  key={idx}
                  value={option.option_value}
                  control={<Radio />}
                  label={option.option_label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case "checkbox":
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={value === "true" || value === true}
                onChange={(e) => handleInputChange(field.field_name, e.target.checked.toString())}
              />
            }
            label={`${field.label}${isRequired ? " *" : ""}`}
            sx={{ mb: 2 }}
          />
        );

      case "checkbox_group":
        return (
          <FormControl key={field.id} component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">
              {`${field.label}${isRequired ? " *" : ""}`}
            </FormLabel>
            {field.options?.map((option, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={Array.isArray(value) ? value.includes(option.option_value) : false}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.option_value]
                        : currentValues.filter(v => v !== option.option_value);
                      handleInputChange(field.field_name, newValues);
                    }}
                  />
                }
                label={option.option_label}
              />
            ))}
          </FormControl>
        );

      default:
        return (
          <Typography key={field.id} color="error" sx={{ mb: 2 }}>
            Unsupported field type: {field.field_type}
          </Typography>
        );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !form) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {form?.title}
          </Typography>

          {form?.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {form.description}
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {form?.fields
                ?.sort((a, b) => a.display_order - b.display_order)
                ?.map(field => renderField(field))}
            </Stack>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{
                  px: 6,
                  py: 1.5,
                  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                  },
                  "&:disabled": {
                    background: "#e0e0e0",
                  },
                }}
              >
                {submitting ? <CircularProgress size={24} /> : (form?.submit_button_text || "Submit")}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default FormRenderer;
