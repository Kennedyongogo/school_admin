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
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Article,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import FormBuilder from "./FormBuilder";

const FormEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    is_active: true,
  });

  const [formFields, setFormFields] = useState([]);

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Fetch form data
      const formRes = await fetch(`/api/forms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formDataResponse = await formRes.json();

      if (!formRes.ok || !formDataResponse.success) {
        throw new Error(formDataResponse.message || "Failed to load form");
      }

      const form = formDataResponse.data;
      setFormData({
        is_active: form.is_active ?? true,
      });

      // Fetch form fields
      const fieldsRes = await fetch(`/api/form-fields/form/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fieldsData = await fieldsRes.json();

      if (fieldsRes.ok && fieldsData.success) {
        const fields = (fieldsData.data || []).map(field => {
          // Extract sub_fields from validation_rules for compound fields
          if (field.field_type === 'compound' && field.validation_rules?.sub_fields) {
            return {
              ...field,
              sub_fields: field.validation_rules.sub_fields
            };
          }
          return field;
        });
        setFormFields(fields);
      }

    } catch (err) {
      setError(err.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");

      // Update form basic info
      const formPayload = {
        is_active: formData.is_active,
      };

      const formRes = await fetch(`/api/forms/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formPayload),
      });

      const formResult = await formRes.json();
      if (!formRes.ok || !formResult.success) {
        throw new Error(formResult.message || "Failed to update form");
      }

      // Handle form fields updates
      await updateFormFields();

      await Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Form updated successfully",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/forms");
    } catch (err) {
      setError(err.message || "Failed to update form");
      Swal.fire("Error", err.message || "Failed to update form", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateFormFields = async () => {
    const token = localStorage.getItem("token");

    // Execute operations - deletions are handled immediately when delete icon is clicked
    const promises = [];

    // Process each field in the current formFields
    formFields.forEach((field, index) => {
      field.display_order = index;

      if (field.id) {
        // Existing field - update it
        promises.push(updateField(field, token).catch(err => {
          console.error('Failed to update field:', field.label, err);
          throw new Error(`Failed to update field: ${field.label}`);
        }));
      } else {
        // New field - create it
        promises.push(createField(field, token).catch(err => {
          console.error('Failed to create field:', field.label, err);
          throw new Error(`Failed to create field: ${field.label}`);
        }));
      }
    });

    await Promise.all(promises);
  };

  const createField = async (field, token) => {
    const fieldPayload = {
      form_id: id,
      field_type: field.field_type,
      field_name: field.field_name,
      label: field.label,
      placeholder: field.placeholder,
      help_text: field.help_text,
      default_value: field.default_value,
      is_required: field.is_required,
      validation_rules: field.validation_rules,
      display_order: field.display_order,
      grid_size: field.grid_size,
      conditional_logic: field.conditional_logic,
      sub_fields: field.sub_fields, // For compound fields
    };

    const response = await fetch("/api/form-fields", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fieldPayload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(`Failed to create field: ${field.label}`);
    }

    // Create field options if any
    if (field.options && field.options.length > 0) {
      await createFieldOptions(result.data.id, field.options, token);
    }
  };

  const updateField = async (field, token) => {
    console.log('Updating field:', field.label, 'conditional_logic:', field.conditional_logic);

    const fieldPayload = {
      field_type: field.field_type,
      field_name: field.field_name,
      label: field.label,
      placeholder: field.placeholder,
      help_text: field.help_text,
      default_value: field.default_value,
      is_required: field.is_required,
      is_active: field.is_active ?? true,
      validation_rules: field.validation_rules,
      display_order: field.display_order,
      css_classes: field.css_classes,
      grid_size: field.grid_size,
      conditional_logic: field.conditional_logic,
      sub_fields: field.sub_fields, // For compound fields
    };

    console.log('fieldPayload being sent:', fieldPayload);

    const response = await fetch(`/api/form-fields/${field.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fieldPayload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(`Failed to update field: ${field.label}`);
    }

    // Update field options
    await updateFieldOptions(field.id, field.options || [], token);
  };


  const createFieldOptions = async (fieldId, options, token) => {
    for (const option of options) {
      const optionPayload = {
        form_field_id: fieldId,
        option_value: option.option_value,
        option_label: option.option_label,
        description: option.description,
        display_order: option.display_order,
        is_default: option.is_default,
      };

      await fetch("/api/form-fields/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(optionPayload),
      });
      // Don't check result to avoid stopping the whole process
    }
  };

  const updateFieldOptions = async (fieldId, newOptions, token) => {
    console.log('updateFieldOptions called with fieldId:', fieldId, 'newOptions:', newOptions);

    // Get existing options
    const optionsRes = await fetch(`/api/form-fields/${fieldId}/options`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (optionsRes.ok) {
      const optionsData = await optionsRes.json();
      const existingOptions = optionsData.success ? optionsData.data : [];

      // Separate new options (no id) from existing options (have id)
      const optionsToCreate = newOptions.filter(option => !option.id);
      const optionsToUpdate = [];
      const optionsToDelete = [];

      console.log('Options classification:');
      console.log('optionsToCreate:', optionsToCreate);
      console.log('existingOptions:', existingOptions);

      // For options with IDs, check if they need updating
      newOptions.forEach(option => {
        if (option.id) {
          const existing = existingOptions.find(opt => opt.id === option.id);
          if (existing) {
            // Check if changed
            if (!optionsEqual(option, existing)) {
              optionsToUpdate.push(option);
            }
          }
        }
      });

      // Find existing options that are no longer in newOptions
      existingOptions.forEach(existing => {
        const stillExists = newOptions.some(opt => opt.id === existing.id);
        if (!stillExists) {
          optionsToDelete.push(existing.id);
        }
      });

      // Execute option operations
      const optionPromises = [];

      // Create new options
      optionsToCreate.forEach(option => {
        const promise = fetch("/api/form-fields/options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            form_field_id: fieldId,
            option_value: option.option_value || "",
            option_label: option.option_label || option.option_value || "",
            description: option.description || null,
            display_order: option.display_order || 0,
            is_default: option.is_default || false,
          }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create option "${option.option_value}": ${error}`);
          }
          return response.json();
        });
        optionPromises.push(promise);
      });

      // Update existing options
      optionsToUpdate.forEach(option => {
        const promise = fetch(`/api/form-fields/options/${option.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            option_value: option.option_value || "",
            option_label: option.option_label || option.option_value || "",
            description: option.description || null,
            display_order: option.display_order || 0,
            is_default: option.is_default || false,
          }),
        }).then(async response => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to update option "${option.option_value}": ${error}`);
          }
          return response.json();
        });
        optionPromises.push(promise);
      });

      // Delete removed options
      optionsToDelete.forEach(optionId => {
        const promise = fetch(`/api/form-fields/options/${optionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).then(async response => {
          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to delete option ${optionId}: ${error}`);
          }
        });
        optionPromises.push(promise);
      });

      // Execute all operations
      if (optionPromises.length > 0) {
        try {
          await Promise.all(optionPromises);
        } catch (error) {
          console.error('Option operation failed:', error);
          throw error;
        }
      }
    }
  };

  // Helper functions
  const fieldsEqual = (field1, field2) => {
    return (
      field1.field_type === field2.field_type &&
      field1.field_name === field2.field_name &&
      field1.label === field2.label &&
      field1.placeholder === field2.placeholder &&
      field1.help_text === field2.help_text &&
      field1.default_value === field2.default_value &&
      field1.is_required === field2.is_required &&
      field1.display_order === field2.display_order &&
      JSON.stringify(field1.grid_size) === JSON.stringify(field2.grid_size)
    );
  };

  const optionsEqual = (opt1, opt2) => {
    return (
      opt1.option_value === opt2.option_value &&
      opt1.option_label === opt2.option_label &&
      opt1.description === opt2.description &&
      opt1.display_order === opt2.display_order &&
      opt1.is_default === opt2.is_default
    );
  };

  const isFormValid = () =>
    formFields.length > 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

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
              onClick={() => navigate("/forms")}
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
            <Article sx={{ fontSize: 40 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              Edit Form
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
              <FormBuilder
                fields={formFields}
                onFieldsChange={setFormFields}
              />

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  onClick={handleSave}
                  disabled={!isFormValid() || saving}
                  sx={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
                    },
                    "&:disabled": {
                      background: "#e0e0e0",
                      color: "#999",
                    },
                  }}
                >
                  {saving ? "Saving..." : "Save Form"}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/forms")}
                  sx={{
                    flex: 1,
                    color: "#6B4E3D",
                    borderColor: "#6B4E3D",
                    "&:hover": {
                      borderColor: "#B85C38",
                      backgroundColor: "rgba(184, 92, 56, 0.1)",
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

export default FormEdit;
