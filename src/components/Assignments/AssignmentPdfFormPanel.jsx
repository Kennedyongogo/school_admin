import React, { useRef, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Stack,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Swal from "sweetalert2";

const accent = "#DC2626";

export default function AssignmentPdfFormPanel({
  assignmentId,
  onUploadComplete,
  pdfPath,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadPdf = async (file) => {
    if (!file || !assignmentId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("assignment_pdf_template", file);
      const res = await fetch(`/api/assignments/${assignmentId}/pdf-template`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Upload failed.");
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

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Type your assignment in <strong>Microsoft Word</strong>, then <strong>Save as PDF</strong> and upload here.
        Students read the paper, type answers for some questions, and can upload <strong>photos or scans</strong> of
        their working on paper.
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
          disabled={!assignmentId || uploading}
          onClick={() => inputRef.current?.click()}
          sx={{ bgcolor: accent, "&:hover": { bgcolor: "#B91C1C" } }}
        >
          {pdfPath ? "Replace PDF" : "Upload assignment PDF"}
        </Button>
        {pdfPath ? (
          <Chip size="small" color="success" label={`Uploaded: ${pdfPath.split("/").pop()}`} />
        ) : (
          <Chip size="small" label="No PDF uploaded yet" />
        )}
      </Stack>
    </Stack>
  );
}
