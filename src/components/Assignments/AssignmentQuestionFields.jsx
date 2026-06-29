import React from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  defaultAnswerForQuestionType,
  fileUploadConfig,
  parseAssignmentChoices,
} from "./assignmentQuestionUtils";

export default function AssignmentQuestionFields({
  question,
  value,
  onChange,
  disabled = false,
  previewMode = false,
}) {
  const qType = String(question?.question_type || "short_text");
  const choices = parseAssignmentChoices(question);
  const uploadCfg = qType === "file_upload" ? fileUploadConfig(question) : null;
  const uploadedFiles =
    qType === "file_upload" && value && typeof value === "object" && Array.isArray(value.files) ? value.files : [];

  if (qType === "multiple_choice") {
    if (!choices.length) {
      return (
        <Typography variant="body2" color="error">
          No options configured. Edit the assignment and add at least two choices (one per line or comma-separated).
        </Typography>
      );
    }
    return (
      <RadioGroup
        value={String(value || "")}
        onChange={(e) => onChange?.(e.target.value)}
        sx={{ flexDirection: { xs: "column", sm: "row" }, flexWrap: "wrap", gap: { xs: 0, sm: 1 } }}
      >
        {choices.map((opt) => (
          <FormControlLabel
            key={`mc-${opt}`}
            value={opt}
            disabled={disabled}
            control={<Radio size="small" />}
            label={opt}
          />
        ))}
      </RadioGroup>
    );
  }

  if (qType === "multi_select") {
    if (!choices.length) {
      return (
        <Typography variant="body2" color="error">
          No options configured. Edit the assignment and add at least two choices (one per line or comma-separated).
        </Typography>
      );
    }
    const selected = Array.isArray(value) ? value : [];
    return (
      <Stack direction={{ xs: "column", sm: "row" }} flexWrap="wrap" useFlexGap spacing={{ xs: 0.25, sm: 1 }}>
        {choices.map((opt) => (
          <FormControlLabel
            key={`ms-${opt}`}
            control={
              <Checkbox
                size="small"
                disabled={disabled}
                checked={selected.includes(opt)}
                onChange={(e) => {
                  const next = e.target.checked ? [...selected, opt] : selected.filter((x) => x !== opt);
                  onChange?.(next);
                }}
              />
            }
            label={opt}
          />
        ))}
      </Stack>
    );
  }

  if (qType === "file_upload") {
    return (
      <Stack spacing={1}>
        {uploadCfg?.hint ? (
          <Typography variant="body2" color="text.secondary">
            {uploadCfg.hint}
          </Typography>
        ) : null}
        <Typography variant="caption" color="text.secondary">
          {previewMode
            ? "Try choosing a file below to see how upload looks for students."
            : `Upload up to ${uploadCfg?.maxFiles || 1} file(s), max ${uploadCfg?.maxSizeMb || 10} MB each.`}
        </Typography>
        <Button variant="outlined" component="label" size="small" disabled={disabled && !previewMode} sx={{ alignSelf: "flex-start" }}>
          Choose file
          <input
            type="file"
            hidden
            accept={uploadCfg?.accept?.join(",") || "image/*,application/pdf"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (previewMode) {
                onChange?.({
                  files: [
                    ...uploadedFiles,
                    { name: file.name, size: file.size, url: URL.createObjectURL(file), preview: true },
                  ],
                });
                return;
              }
              onChange?.({ files: [...uploadedFiles, { name: file.name, size: file.size, localFile: file }] });
            }}
          />
        </Button>
        {previewMode ? (
          <Typography variant="caption" color="text.secondary">
            Preview only — files are not uploaded to the server.
          </Typography>
        ) : null}
        {uploadedFiles.length ? (
          <Stack spacing={0.5}>
            {uploadedFiles.map((f, fi) => (
              <Typography key={`file-${fi}`} variant="body2">
                {f.name || `File ${fi + 1}`}
              </Typography>
            ))}
          </Stack>
        ) : null}
      </Stack>
    );
  }

  return (
    <TextField
      fullWidth
      multiline
      minRows={qType === "long_text" || qType === "essay" ? 4 : 2}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      placeholder="Student types their answer here"
      sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
    />
  );
}

export { defaultAnswerForQuestionType };
