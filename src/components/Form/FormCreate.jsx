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
} from "@mui/material";
import {
  Save,
  ArrowBack,
  Article,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import FormBuilder from "./FormBuilder";


const FormCreate = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    is_active: true,
  });

  const [formFields, setFormFields] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const isFormValid = () =>
    formFields.length > 0;

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");

      // Prepare data payload
      const payload = {
        is_active: formData.is_active,
      };

      // First create the form
      const formResponse = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const formResult = await formResponse.json();

      if (formResult.success) {
        const formId = formResult.data.id;

        // Then create the form fields
        if (formFields.length > 0) {
          for (const field of formFields) {
            console.log('Creating field:', field.label, 'conditional_logic:', field.conditional_logic);

            const fieldPayload = {
              form_id: formId,
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
            };

            console.log('fieldPayload being sent:', fieldPayload);

            const fieldResponse = await fetch("/api/form-fields", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(fieldPayload),
            });

            const fieldResult = await fieldResponse.json();
            if (!fieldResult.success) {
              console.error("Failed to create field:", field.label, fieldResult);
              // Continue with other fields even if one fails
            }

            // Create field options if any
            if (field.options && field.options.length > 0) {
              for (const option of field.options) {
                const optionPayload = {
                  form_field_id: fieldResult.data.id,
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
                // Don't check result for options to avoid complexity
              }
            }
          }
        }
        await Swal.fire({
          title: "Success!",
          text: "Form created successfully!",
          icon: "success",
          confirmButtonColor: "#6B4E3D",
        });
        navigate("/forms");
      } else {
        throw new Error(result.message || "Failed to create form");
      }
    } catch (err) {
      console.error("Error creating lodge:", err);
      setError(err.message || "Failed to create lodge");
      await Swal.fire({
        title: "Error!",
        text: err.message || "Failed to create form",
        icon: "error",
        confirmButtonColor: "#6B4E3D",
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
              Create Form
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
                  onClick={handleCreate}
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
                  {saving ? "Creating..." : "Create Form"}
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

export default FormCreate;
