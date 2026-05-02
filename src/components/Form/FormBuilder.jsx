import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  TextFields as TextIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Numbers as NumberIcon,
  CalendarToday as DateIcon,
  Subject as TextareaIcon,
  List as SelectIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  CheckBoxOutlined as CheckboxGroupIcon,
  Group as GroupIcon,
} from "@mui/icons-material";

const FIELD_TYPES = [
  { value: "text", label: "Text Input", icon: <TextIcon /> },
  { value: "email", label: "Email", icon: <EmailIcon /> },
  { value: "tel", label: "Phone", icon: <PhoneIcon /> },
  { value: "number", label: "Number", icon: <NumberIcon /> },
  { value: "date", label: "Date", icon: <DateIcon /> },
  { value: "textarea", label: "Text Area", icon: <TextareaIcon /> },
  { value: "select", label: "Dropdown", icon: <SelectIcon /> },
  { value: "radio", label: "Radio Buttons", icon: <RadioIcon /> },
  { value: "checkbox", label: "Single Checkbox", icon: <CheckboxIcon /> },
  { value: "checkbox_group", label: "Multiple Checkboxes", icon: <CheckboxGroupIcon /> },
  { value: "compound", label: "Compound Question", icon: <GroupIcon /> },
];

const FormBuilder = ({ fields = [], onFieldsChange, onSave }) => {
  const [fieldDialog, setFieldDialog] = useState({
    open: false,
    editingIndex: null,
    field: null,
  });

  const [currentField, setCurrentField] = useState({
    field_type: "text",
    field_name: "",
    label: "",
    placeholder: "",
    help_text: "",
    default_value: "",
    is_required: false,
    validation_rules: {},
    grid_size: { xs: 12, sm: 6 },
    options: [],
    sub_fields: [], // For compound fields
  });

  const handleAddField = () => {
    setCurrentField({
      field_type: "text",
      field_name: "",
      label: "",
      placeholder: "",
      help_text: "",
      default_value: "",
      is_required: false,
      validation_rules: {},
      grid_size: { xs: 12, sm: 6 },
      options: [],
      sub_fields: [],
    });
    setFieldDialog({ open: true, editingIndex: null, field: null });
  };

  const handleEditField = (index) => {
    const field = fields[index];
    setCurrentField({ ...field });
    setFieldDialog({ open: true, editingIndex: index, field });
  };

  const handleDeleteField = async (index) => {
    const field = fields[index];
    if (!field.id) {
      // For new fields that haven't been saved to backend yet, just remove from local state
      const newFields = fields.filter((_, i) => i !== index);
      onFieldsChange(newFields);
      return;
    }

    // Delete from backend first
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/form-fields/${field.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to delete field from backend");
      }

      // If backend deletion successful, update local state
      const newFields = fields.filter((_, i) => i !== index);
      onFieldsChange(newFields);
    } catch (error) {
      console.error("Failed to delete field:", error);
      alert(`Failed to delete field: ${error.message}`);
    }
  };

  const handleSaveField = async () => {
    const newFields = [...fields];
    const fieldData = { ...currentField };

    // Generate field name from label if not provided
    if (!fieldData.field_name && fieldData.label) {
      fieldData.field_name = fieldData.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    }

    if (fieldDialog.editingIndex !== null) {
      // Keep the manually set display_order for editing
      newFields[fieldDialog.editingIndex] = { ...fieldData };
    } else {
      // Only set default display_order if not manually set
      if (fieldData.display_order === undefined || fieldData.display_order === null) {
        fieldData.display_order = newFields.length;
      }
      newFields.push(fieldData);
    }

    // Handle options API calls for choice fields
    if ((fieldData.field_type === "select" || fieldData.field_type === "radio" || fieldData.field_type === "checkbox_group") && fieldData.options) {
      try {
        await handleFieldOptionsUpdate(fieldData);
      } catch (error) {
        console.error("Failed to update field options:", error);
        alert(`Failed to update field options: ${error.message}`);
      }
    }

    onFieldsChange(newFields);
    setFieldDialog({ open: false, editingIndex: null, field: null });
  };

  const handleFieldOptionsUpdate = async (fieldData) => {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const existingFieldId = fieldDialog.editingIndex !== null ? fields[fieldDialog.editingIndex]?.id : null;

    if (!existingFieldId) {
      // For new fields, options will be created when the field is saved
      return;
    }

    // Get existing options from the API
    const existingOptionsRes = await fetch(`/api/form-fields/${existingFieldId}/options`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!existingOptionsRes.ok) {
      throw new Error("Failed to fetch existing options");
    }

    const existingOptionsData = await existingOptionsRes.json();
    const existingOptions = existingOptionsData.success ? existingOptionsData.data : [];

    // Separate new options from existing ones
    const optionsToCreate = fieldData.options.filter(option => !option.id);
    const optionsToUpdate = [];
    const optionsToDelete = [];

    // Check which existing options need updating
    fieldData.options.forEach(option => {
      if (option.id) {
        const existing = existingOptions.find(opt => opt.id === option.id);
        if (existing) {
          // Check if option has changed
          if (
            existing.option_value !== option.option_value ||
            existing.option_label !== option.option_label ||
            existing.description !== option.description ||
            existing.display_order !== option.display_order ||
            existing.is_default !== option.is_default
          ) {
            optionsToUpdate.push(option);
          }
        }
      }
    });

    // Find options that were removed
    existingOptions.forEach(existing => {
      const stillExists = fieldData.options.some(opt => opt.id === existing.id);
      if (!stillExists) {
        optionsToDelete.push(existing.id);
      }
    });

    // Execute API calls
    const promises = [];

    // Create new options
    optionsToCreate.forEach(option => {
      promises.push(
        fetch("/api/form-fields/options", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            form_field_id: existingFieldId,
            option_value: option.option_value || "",
            option_label: option.option_label || option.option_value || "",
            description: option.description || null,
            display_order: option.display_order || 0,
            is_default: option.is_default || false,
          }),
        })
      );
    });

    // Update existing options
    optionsToUpdate.forEach(option => {
      promises.push(
        fetch(`/api/form-fields/options/${option.id}`, {
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
        })
      );
    });

    // Delete removed options
    optionsToDelete.forEach(optionId => {
      promises.push(
        fetch(`/api/form-fields/options/${optionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })
      );
    });

    // Wait for all API calls to complete
    await Promise.all(promises);
  };

  const handleMoveField = (fromIndex, toIndex) => {
    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);

    // Update display_order
    newFields.forEach((field, index) => {
      field.display_order = index;
    });

    onFieldsChange(newFields);
  };

  const handleAddOption = () => {
    const currentOptions = currentField.options || [];
    const nextDisplayOrder = currentOptions.length > 0
      ? Math.max(...currentOptions.map(opt => opt.display_order || 0)) + 1
      : 0;

    setCurrentField({
      ...currentField,
      options: [...currentOptions, {
        option_value: "",
        option_label: "",
        display_order: nextDisplayOrder,
        is_default: false
      }],
    });
  };

  const handleUpdateOption = (index, field, value) => {
    const newOptions = [...(currentField.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };

    // If updating option_value, also update option_label to match
    if (field === "option_value") {
      newOptions[index].option_label = value;
    }

    setCurrentField({ ...currentField, options: newOptions });
  };

  const handleRemoveOption = (index) => {
    const newOptions = currentField.options.filter((_, i) => i !== index);
    // Reorder display_order after removal
    newOptions.forEach((option, idx) => {
      option.display_order = idx;
    });
    setCurrentField({ ...currentField, options: newOptions });
  };

  // Compound field functions
  const handleAddSubField = () => {
    const newSubFields = [...(currentField.sub_fields || [])];
    newSubFields.push({
      type: "text",
      label: "",
      field_name: "",
      placeholder: "",
      is_required: false,
    });
    setCurrentField({ ...currentField, sub_fields: newSubFields });
  };

  const handleUpdateSubField = (index, field, value) => {
    const newSubFields = [...(currentField.sub_fields || [])];
    newSubFields[index] = { ...newSubFields[index], [field]: value };

    // Auto-generate field_name from label if empty
    if (field === "label" && (!newSubFields[index].field_name || newSubFields[index].field_name === "")) {
      newSubFields[index].field_name = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    }

    setCurrentField({ ...currentField, sub_fields: newSubFields });
  };

  const handleRemoveSubField = (index) => {
    const newSubFields = (currentField.sub_fields || []).filter((_, i) => i !== index);
    setCurrentField({ ...currentField, sub_fields: newSubFields });
  };

  // Helper function to get options from a dependent field
  const getDependentFieldOptions = (fieldName) => {
    const dependentField = fields.find(field => field.field_name === fieldName);
    if (dependentField && dependentField.options && dependentField.options.length > 0) {
      return dependentField.options;
    }
    return [];
  };

  // Helper function to check if a field has predefined options
  const hasPredefinedOptions = (fieldName) => {
    const dependentField = fields.find(field => field.field_name === fieldName);
    if (!dependentField) return false;

    // Fields with options: select, radio, checkbox_group
    return ['select', 'radio', 'checkbox_group'].includes(dependentField.field_type) &&
           dependentField.options && dependentField.options.length > 0;
  };

  const getFieldTypeIcon = (fieldType) => {
    const fieldTypeObj = FIELD_TYPES.find(ft => ft.value === fieldType);
    return fieldTypeObj ? fieldTypeObj.icon : <TextIcon />;
  };

  const renderFieldPreview = (field) => {
    switch (field.field_type) {
      case "text":
      case "email":
      case "tel":
      case "number":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            placeholder={field.placeholder}
            required={field.is_required}
            type={field.field_type}
          />
        );
      case "date":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            type="date"
            required={field.is_required}
            InputLabelProps={{ shrink: true }}
          />
        );
      case "textarea":
        return (
          <TextField
            fullWidth
            size="small"
            label={field.label}
            multiline
            rows={3}
            placeholder={field.placeholder}
            required={field.is_required}
          />
        );
      case "select":
        return (
          <FormControl fullWidth size="small">
            <InputLabel>{field.label}</InputLabel>
            <Select label={field.label} required={field.is_required}>
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
          <FormControl component="fieldset">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && "*"}
            </Typography>
            {field.options?.map((option, idx) => (
              <FormControlLabel
                key={idx}
                value={option.option_value}
                control={<input type="radio" name={field.field_name} />}
                label={option.option_label}
              />
            ))}
          </FormControl>
        );
      case "checkbox":
        return (
          <FormControlLabel
            control={<input type="checkbox" />}
            label={`${field.label} ${field.is_required ? "*" : ""}`}
          />
        );
      case "checkbox_group":
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {field.label} {field.is_required && "*"}
            </Typography>
            {field.options?.map((option, idx) => (
              <FormControlLabel
                key={idx}
                control={<input type="checkbox" />}
                label={option.option_label}
              />
            ))}
          </Box>
        );
      case "compound":
        return (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {field.label} {field.is_required && "*"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              {field.help_text || "Multiple fields in one question"}
            </Typography>
            <Grid container spacing={2}>
              {(field.sub_fields || []).map((subField, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  {subField.type === 'textarea' ? (
                    <TextField
                      fullWidth
                      size="small"
                      label={subField.label}
                      multiline
                      rows={2}
                      placeholder={subField.placeholder}
                      required={subField.is_required}
                    />
                  ) : subField.type === 'date' ? (
                    <TextField
                      fullWidth
                      size="small"
                      label={subField.label}
                      type="date"
                      required={subField.is_required}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      size="small"
                      label={subField.label}
                      type={subField.type}
                      placeholder={subField.placeholder}
                      required={subField.is_required}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        );
      default:
        return <Typography>Unsupported field type</Typography>;
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Form Fields ({fields.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddField}
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
            },
          }}
        >
          Add Question
        </Button>
      </Box>

      {fields.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center", backgroundColor: "#f9f9f9" }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No fields added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click "Add Question" to start building your form
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddField}
            sx={{
              color: "#6B4E3D",
              borderColor: "#6B4E3D",
              "&:hover": {
                borderColor: "#B85C38",
                backgroundColor: "rgba(184, 92, 56, 0.1)",
              },
            }}
          >
            Add Your First Field
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {fields.map((field, index) => (
            <Card key={index} sx={{ border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <IconButton sx={{ cursor: "grab", color: "#999" }}>
                    <DragIcon />
                  </IconButton>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getFieldTypeIcon(field.field_type)}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {field.label || "Untitled Field"}
                    </Typography>
                    <Chip
                      label={field.field_type}
                      size="small"
                      sx={{ textTransform: "capitalize" }}
                    />
                    {field.is_required && (
                      <Chip label="Required" size="small" color="error" />
                    )}
                  </Box>
                  <Box sx={{ ml: "auto" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditField(index)}
                      sx={{ color: "#3498db", mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteField(index)}
                      sx={{ color: "#e74c3c" }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ pl: 6 }}>
                  {field.help_text && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Help: {field.help_text}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ pl: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Preview:
                  </Typography>
                  <Box sx={{ maxWidth: field.grid_size?.md ? "50%" : "100%" }}>
                    {renderFieldPreview(field)}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Field Editor Dialog */}
      <Dialog
        open={fieldDialog.open}
        onClose={() => setFieldDialog({ open: false, editingIndex: null, field: null })}
        maxWidth={false}
        sx={{
          '& .MuiDialog-paper': {
            width: '750px',
            maxWidth: 'none',
            maxHeight: '90vh',
            overflowY: 'auto'
          }
        }}
      >
        <DialogTitle
          sx={{
            mb: 2,
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            color: "white",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {fieldDialog.editingIndex !== null ? "Edit Question" : "Add New Question"}
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 1 }}>
          <Stack spacing={1.5} sx={{ mt: 0 }}>
            <FormControl fullWidth size="small" sx={{ mt: 3, mb: 1 }}>
              <InputLabel shrink sx={{ top: '6px' }}>Field Type</InputLabel>
              <Select
                value={currentField.field_type}
                onChange={(e) => setCurrentField({ ...currentField, field_type: e.target.value })}
                label="Field Type"
                size="small"
              >
                {FIELD_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Question/Field Label"
              value={currentField.label || ""}
              onChange={(e) => {
                const newLabel = e.target.value;
                const updatedField = { ...currentField, label: newLabel };
                // Auto-generate field_name from label only if field_name is empty or field is new (no id)
                if ((!currentField.field_name || currentField.field_name.trim() === "") && newLabel && !currentField.id) {
                  updatedField.field_name = newLabel
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "_")
                    .replace(/_+/g, "_")
                    .replace(/^_|_$/g, "");
                }
                setCurrentField(updatedField);
              }}
              required
              helperText="This is what users will see as the question"
              sx={{ mt: 1 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Field Name (Technical Identifier)"
              value={currentField.field_name || ""}
              onChange={(e) => {
                const newFieldName = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "_")
                  .replace(/_+/g, "_")
                  .replace(/^_|_$/g, "");
                setCurrentField({ ...currentField, field_name: newFieldName });
              }}
              helperText={fieldDialog.editingIndex !== null && currentField.id 
                ? "⚠️ WARNING: Changing this for existing fields will break existing submissions! Only change if you understand the consequences."
                : "Unique identifier for storing form data. Only lowercase letters, numbers, and underscores."}
              sx={{ 
                mt: 1,
                '& .MuiInputBase-input': fieldDialog.editingIndex !== null && currentField.id 
                  ? { backgroundColor: '#fff3cd' } 
                  : {}
              }}
            />

            {/* Show placeholder only for input-type fields */}
            {(currentField.field_type === 'text' || currentField.field_type === 'email' || currentField.field_type === 'tel' || currentField.field_type === 'number' || currentField.field_type === 'textarea') && (
              <TextField
                fullWidth
                size="small"
                label="Placeholder (optional)"
                value={currentField.placeholder}
                onChange={(e) => setCurrentField({ ...currentField, placeholder: e.target.value })}
                helperText="Example text shown inside the field"
              />
            )}

            {/* Help text is optional for all field types */}
            <TextField
              fullWidth
              size="small"
              label="Help Text (optional)"
              value={currentField.help_text}
              onChange={(e) => setCurrentField({ ...currentField, help_text: e.target.value })}
              helperText="Additional instructions for users"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={currentField.is_required}
                  onChange={(e) => setCurrentField({ ...currentField, is_required: e.target.checked })}
                />
              }
              label="Required field"
            />

            {/* Options for choice fields */}
            {(currentField.field_type === "select" ||
              currentField.field_type === "radio" ||
              currentField.field_type === "checkbox_group") && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Field Options
                </Typography>

                {(currentField.options || []).map((option, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Option {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveOption(index)}
                        sx={{ color: "#e74c3c", p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      label="Option Text"
                      value={option.option_value}
                      onChange={(e) => handleUpdateOption(index, "option_value", e.target.value)}
                      sx={{ mb: 0.5 }}
                      helperText="This will be both the value and display text"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={option.is_default || false}
                          onChange={(e) => handleUpdateOption(index, "is_default", e.target.checked)}
                          size="small"
                        />
                      }
                      label="Default"
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                    />
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddOption}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>
              </>
            )}

            {/* Sub-fields for compound fields */}
            {currentField.field_type === "compound" && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Sub-Fields
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Add multiple input fields within this single question
                </Typography>

                {(currentField.sub_fields || []).map((subField, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1, backgroundColor: "#f9f9f9" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Field {index + 1}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveSubField(index)}
                        sx={{ color: "#e74c3c", p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={subField.type || "text"}
                            onChange={(e) => handleUpdateSubField(index, "type", e.target.value)}
                            label="Type"
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="tel">Phone</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Label"
                          value={subField.label || ""}
                          onChange={(e) => handleUpdateSubField(index, "label", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Field Name"
                          value={subField.field_name || ""}
                          onChange={(e) => handleUpdateSubField(index, "field_name", e.target.value)}
                          helperText="Unique identifier"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Placeholder (optional)"
                          value={subField.placeholder || ""}
                          onChange={(e) => handleUpdateSubField(index, "placeholder", e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={subField.is_required || false}
                              onChange={(e) => handleUpdateSubField(index, "is_required", e.target.checked)}
                              size="small"
                            />
                          }
                          label="Required"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddSubField}
                  sx={{ mt: 1 }}
                >
                  Add Sub-Field
                </Button>
              </>
            )}

            {/* Conditional Logic */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Conditional Logic (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Show or hide this field based on answers to other questions
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={!!currentField.conditional_logic}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCurrentField({
                        ...currentField,
                        conditional_logic: {
                          depends_on_field: "",
                          show_when_value: "",
                          hide_when_value: ""
                        }
                      });
                    } else {
                      setCurrentField({
                        ...currentField,
                        conditional_logic: null
                      });
                    }
                  }}
                />
              }
              label="Enable conditional logic"
            />

            {currentField.conditional_logic && (
              <Box sx={{ mt: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1, backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Show this field when:
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Depends on Question</InputLabel>
                  <Select
                    value={currentField.conditional_logic.depends_on_field || ""}
                    onChange={(e) => setCurrentField({
                      ...currentField,
                      conditional_logic: {
                        ...currentField.conditional_logic,
                        depends_on_field: e.target.value
                      }
                    })}
                    label="Depends on Question"
                  >
                    {fields
                      .filter((_, idx) => fieldDialog.editingIndex === null || idx !== fieldDialog.editingIndex)
                      .map((field, idx) => (
                        <MenuItem key={idx} value={field.field_name}>
                          {field.label} ({field.field_name})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {hasPredefinedOptions(currentField.conditional_logic.depends_on_field) ? (
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Show when answer is</InputLabel>
                    <Select
                      value={currentField.conditional_logic.show_when_value || ""}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        conditional_logic: {
                          ...currentField.conditional_logic,
                          show_when_value: e.target.value
                        }
                      })}
                      label="Show when answer is"
                    >
                      {getDependentFieldOptions(currentField.conditional_logic.depends_on_field).map((option, idx) => (
                        <MenuItem key={idx} value={option.option_value}>
                          {option.option_label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Show when answer is"
                    value={currentField.conditional_logic.show_when_value || ""}
                    onChange={(e) => setCurrentField({
                      ...currentField,
                      conditional_logic: {
                        ...currentField.conditional_logic,
                        show_when_value: e.target.value
                      }
                    })}
                    helperText="Enter the exact answer value that should show this field"
                    sx={{ mb: 2 }}
                  />
                )}

                {hasPredefinedOptions(currentField.conditional_logic.depends_on_field) ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Hide when answer is (optional)</InputLabel>
                    <Select
                      value={currentField.conditional_logic.hide_when_value || ""}
                      onChange={(e) => setCurrentField({
                        ...currentField,
                        conditional_logic: {
                          ...currentField.conditional_logic,
                          hide_when_value: e.target.value
                        }
                      })}
                      label="Hide when answer is (optional)"
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {getDependentFieldOptions(currentField.conditional_logic.depends_on_field).map((option, idx) => (
                        <MenuItem key={idx} value={option.option_value}>
                          {option.option_label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Hide when answer is (optional)"
                    value={currentField.conditional_logic.hide_when_value || ""}
                    onChange={(e) => setCurrentField({
                      ...currentField,
                      conditional_logic: {
                        ...currentField.conditional_logic,
                        hide_when_value: e.target.value
                      }
                    })}
                    helperText="Enter the exact answer value that should hide this field"
                  />
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFieldDialog({ open: false, editingIndex: null, field: null })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveField}
            disabled={!currentField.label?.trim()}
            sx={{
              background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #8B4225 0%, #6B4E3D 100%)",
              },
            }}
          >
            {fieldDialog.editingIndex !== null ? "Update Question" : "Add Question"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FormBuilder;

