import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Swal from "sweetalert2";

const accent = "#DC2626";

export default function ExamPdfFormPanel({
  examId,
  pdfFieldSchema = [],
  pdfAnswerKey = {},
  onAnswerKeyChange,
  onUploadComplete,
  pdfTemplatePath,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [localSchema, setLocalSchema] = useState(pdfFieldSchema);

  const fields = useMemo(() => {
    const list = Array.isArray(localSchema) ? localSchema : Array.isArray(pdfFieldSchema) ? pdfFieldSchema : [];
    return list;
  }, [localSchema, pdfFieldSchema]);

  const uploadPdf = async (file) => {
    if (!file || !examId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("exam_pdf_template", file);
      const res = await fetch(`/api/exams/${examId}/pdf-template`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed.");
      setLocalSchema(data.data?.pdf_field_schema_json || []);
      onUploadComplete?.(data.data);
      if (data.data?.message) {
        await Swal.fire({
          icon: "success",
          title: "PDF uploaded",
          text: data.data.message,
          timer: 3500,
          showConfirmButton: false,
        });
      }
    } catch (e) {
      setError(e.message || "Could not upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const saveAnswerKey = async () => {
    if (!examId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploading(true);
    setError("");
    try {
      const res = await fetch(`/api/exams/${examId}/pdf-answer-key`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pdf_answer_key_json: pdfAnswerKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save answer key.");
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Type your exam in <strong>Microsoft Word</strong>, then <strong>Save as PDF</strong> or <strong>Export → PDF</strong> and
        upload here. You do <em>not</em> need special form fields — the system reads questions (Q1, Q2, …) from the PDF and
        shows answer boxes beside the paper for students.
      </Alert>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadPdf(f);
          }}
        />
        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
          disabled={!examId || uploading}
          onClick={() => inputRef.current?.click()}
          sx={{ bgcolor: accent, "&:hover": { bgcolor: "#B91C1C" } }}
        >
          {pdfTemplatePath ? "Replace PDF" : "Upload exam PDF"}
        </Button>
        {pdfTemplatePath ? (
          <Chip size="small" color="success" label={`Uploaded: ${pdfTemplatePath.split("/").pop()}`} />
        ) : (
          <Chip size="small" label="No PDF uploaded yet" />
        )}
        {fields.length ? <Chip size="small" label={`${fields.length} fields detected`} color="primary" /> : null}
      </Stack>
      {fields.length ? (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Auto-grading answer key (optional)
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Field name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Correct answer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f.name}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {f.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{f.type}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Leave empty for manual marking"
                      value={pdfAnswerKey?.[f.name] ?? ""}
                      onChange={(e) =>
                        onAnswerKeyChange?.({
                          ...pdfAnswerKey,
                          [f.name]: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {examId ? (
            <Box>
              <Button variant="outlined" disabled={uploading} onClick={() => void saveAnswerKey()}>
                Save answer key
              </Button>
            </Box>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
