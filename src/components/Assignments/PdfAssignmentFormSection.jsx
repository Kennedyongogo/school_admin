import React, { useCallback, useMemo } from "react";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import AssignmentPdfFormPanel from "./AssignmentPdfFormPanel";
import PdfDocumentPreview from "../Exams/PdfDocumentPreview";
import { useFetchedPdfPreview, useLocalPdfPreview } from "../../utils/pdfPreview";
import { fetchAssignmentPdfTemplateBlob } from "../Exams/assignmentPdfAdminUtils";

export default function PdfAssignmentFormSection({
  mode,
  assignmentId,
  pendingPdfFile,
  pdfPath,
  onPendingFileChange,
  onUploadComplete,
}) {
  const localPreviewUrl = useLocalPdfPreview(pendingPdfFile);

  const fetchBlob = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!assignmentId) throw new Error("Assignment not saved yet.");
    return fetchAssignmentPdfTemplateBlob(assignmentId, token);
  }, [assignmentId]);

  const remotePreview = useFetchedPdfPreview({
    id: assignmentId,
    hasPdf: Boolean(pdfPath),
    fetchBlob,
    enabled: mode === "edit" && Boolean(assignmentId) && Boolean(pdfPath) && !pendingPdfFile,
    cacheVersion: pdfPath,
  });

  const previewUrl = localPreviewUrl || remotePreview.url;
  const previewLoading = !localPreviewUrl && remotePreview.loading;
  const previewError = remotePreview.error;

  const previewTitle = useMemo(() => {
    if (pendingPdfFile?.name) return pendingPdfFile.name;
    if (pdfPath) return pdfPath.split("/").pop() || "Assignment PDF";
    return "PDF preview";
  }, [pendingPdfFile, pdfPath]);

  return (
    <Card variant="outlined" sx={{ borderColor: "#fecaca" }}>
      <CardContent>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Assignment PDF</Typography>
        {mode === "create" ? (
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Button variant="outlined" component="label">
              Choose PDF file
              <input
                type="file"
                hidden
                accept="application/pdf,.pdf"
                onChange={(e) => onPendingFileChange(e.target.files?.[0] || null)}
              />
            </Button>
            {pendingPdfFile ? (
              <Typography variant="body2">Selected: {pendingPdfFile.name}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Save as PDF from Word, then choose the file here — same as creating a PDF exam.
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            <AssignmentPdfFormPanel
              assignmentId={assignmentId}
              pdfPath={pdfPath}
              onUploadComplete={onUploadComplete}
            />
          </Stack>
        )}
        <PdfDocumentPreview
          url={previewUrl}
          loading={previewLoading}
          error={previewError}
          title={previewTitle}
          height={{ xs: 400, md: 520 }}
          emptyMessage={
            mode === "create"
              ? "Choose a PDF above to see how it will look for students."
              : "Upload an assignment PDF to see the preview here."
          }
        />
      </CardContent>
    </Card>
  );
}
