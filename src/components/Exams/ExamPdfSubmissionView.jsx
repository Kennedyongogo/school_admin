import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { fetchExamPdfBlobUrl } from "./examPdfAdminUtils";

const mediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

function formatAnswerValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "").trim() || "—";
}

function ReadOnlyField({ field, value }) {
  const label = field.label || field.name;
  const type = String(field.type || "Text");

  if (type === "CheckBox") {
    return (
      <FormControlLabel
        control={<Checkbox size="small" disabled checked={Boolean(value)} />}
        label={label}
      />
    );
  }

  if (type === "RadioGroup" && Array.isArray(field.options) && field.options.length) {
    return (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {label}
        </Typography>
        {field.prompt ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
            {field.prompt}
          </Typography>
        ) : null}
        <RadioGroup value={String(value ?? "")}>
          {field.options.map((opt) => (
            <FormControlLabel key={opt} value={opt} control={<Radio size="small" disabled />} label={opt} />
          ))}
        </RadioGroup>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      {field.prompt ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {field.prompt}
        </Typography>
      ) : null}
      <TextField
        fullWidth
        size="small"
        multiline={type === "long_text"}
        minRows={type === "long_text" ? 4 : 1}
        value={formatAnswerValue(value)}
        disabled
        InputProps={{ readOnly: true }}
      />
    </Box>
  );
}

export default function ExamPdfSubmissionView({ exam, submission }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const answers =
    submission?.pdf_answers_json && typeof submission.pdf_answers_json === "object"
      ? submission.pdf_answers_json
      : {};

  const schemaFields = useMemo(() => {
    const schema = Array.isArray(exam?.pdf_field_schema_json) ? exam.pdf_field_schema_json : [];
    if (schema.length) return schema;
    return Object.keys(answers).map((name) => ({ name, label: name, type: "Text" }));
  }, [exam?.pdf_field_schema_json, answers]);

  const breakdown = Array.isArray(submission?.pdf_auto_grading_json?.breakdown)
    ? submission.pdf_auto_grading_json.breakdown
    : [];
  const breakdownByField = useMemo(() => {
    const map = new Map();
    breakdown.forEach((row) => {
      if (row?.fieldName) map.set(row.fieldName, row);
    });
    return map;
  }, [breakdown]);

  const completedUrl = mediaUrl(submission?.pdf_completed_file_path);

  useEffect(() => {
    if (!exam?.id || !exam?.pdf_template_path) return undefined;
    let revoked = "";
    const token = localStorage.getItem("token");
    setPdfLoading(true);
    setPdfError("");
    fetchExamPdfBlobUrl(exam.id, token)
      .then((url) => {
        revoked = url;
        setPdfUrl(url);
      })
      .catch((e) => setPdfError(e.message || "Could not load exam PDF."))
      .finally(() => setPdfLoading(false));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [exam?.id, exam?.pdf_template_path]);

  if (!schemaFields.length && !completedUrl) {
    return (
      <Typography variant="body2" color="text.secondary">
        No PDF answers captured for this submission.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {submission?.pdf_auto_score != null ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Auto-score (answer key): {submission.pdf_auto_score}
          {exam?.total_marks ? ` / ${exam.total_marks}` : ""}
          {submission?.pdf_auto_grading_json?.percentage != null
            ? ` (${submission.pdf_auto_grading_json.percentage}%)`
            : ""}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="stretch">
        {exam?.pdf_template_path ? (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Exam paper</Typography>
            {pdfLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : null}
            {pdfError ? <Alert severity="warning">{pdfError}</Alert> : null}
            {!pdfLoading && pdfUrl ? (
              <Box
                component="iframe"
                title="Exam PDF"
                src={pdfUrl}
                sx={{ width: "100%", height: 480, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#fff" }}
              />
            ) : null}
          </Box>
        ) : null}

        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Student answers</Typography>
          {schemaFields.map((field) => {
            const value = answers[field.name];
            const gradeRow = breakdownByField.get(field.name);
            return (
              <Box
                key={field.name}
                sx={{
                  border: "1px solid",
                  borderColor: gradeRow ? (gradeRow.match ? "#bbf7d0" : "#fecaca") : "#f3f4f6",
                  borderRadius: 1,
                  p: 1.25,
                  bgcolor: gradeRow ? (gradeRow.match ? "#f0fdf4" : "#fef2f2") : "#fff",
                }}
              >
                <ReadOnlyField field={field} value={value} />
                {gradeRow ? (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                    {gradeRow.match ? "Correct" : "Incorrect"}
                    {gradeRow.correctAnswer != null && gradeRow.correctAnswer !== ""
                      ? ` · Expected: ${formatAnswerValue(gradeRow.correctAnswer)}`
                      : ""}
                    {gradeRow.marks != null ? ` · ${gradeRow.marks} marks` : ""}
                  </Typography>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      </Stack>

      {completedUrl ? (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Completed answer sheet</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Button variant="outlined" size="small" component="a" href={completedUrl} target="_blank" rel="noopener noreferrer">
              Open / download PDF
            </Button>
          </Stack>
          <Box
            component="iframe"
            title="Completed PDF"
            src={completedUrl}
            sx={{ width: "100%", height: 420, border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#fff" }}
          />
        </Box>
      ) : null}
    </Stack>
  );
}
