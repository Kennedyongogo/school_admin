import React, { useCallback, useMemo } from "react";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import ExamPdfFormPanel from "./ExamPdfFormPanel";
import PdfDocumentPreview from "./PdfDocumentPreview";
import { useFetchedPdfPreview, useLocalPdfPreview } from "../../utils/pdfPreview";
import { fetchExamPdfTemplateBlob } from "./examPdfAdminUtils";

export default function PdfExamFormSection({
  examId,
  pendingPdfFile,
  pdfTemplatePath,
  onPendingFileChange,
  onUploadComplete,
}) {
  const isCreate = !examId;
  const localPreviewUrl = useLocalPdfPreview(pendingPdfFile);

  const fetchBlob = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!examId) throw new Error("Exam not saved yet.");
    return fetchExamPdfTemplateBlob(examId, token);
  }, [examId]);

  const remotePreview = useFetchedPdfPreview({
    id: examId,
    hasPdf: Boolean(pdfTemplatePath),
    fetchBlob,
    enabled: Boolean(examId) && Boolean(pdfTemplatePath) && !pendingPdfFile,
    cacheVersion: pdfTemplatePath,
  });

  const previewUrl = localPreviewUrl || remotePreview.url;
  const previewLoading = !localPreviewUrl && remotePreview.loading;
  const previewError = remotePreview.error;

  const previewTitle = useMemo(() => {
    if (pendingPdfFile?.name) return pendingPdfFile.name;
    if (pdfTemplatePath) return pdfTemplatePath.split("/").pop() || "Exam PDF";
    return "PDF preview";
  }, [pendingPdfFile, pdfTemplatePath]);

  return (
    <Card variant="outlined" sx={{ borderColor: "#fecaca" }}>
      <CardContent>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Exam PDF</Typography>
        {isCreate ? (
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
            ) : null}
          </Stack>
        ) : null}
        {!isCreate ? (
          <Stack spacing={2} sx={{ mb: 2 }}>
            <ExamPdfFormPanel
              examId={examId}
              pdfTemplatePath={pdfTemplatePath}
              onUploadComplete={onUploadComplete}
            />
          </Stack>
        ) : null}
        <PdfDocumentPreview
          url={previewUrl}
          loading={previewLoading}
          error={previewError}
          title={previewTitle}
          height={{ xs: 400, md: 520 }}
          emptyMessage={
            isCreate
              ? "Choose a PDF above to see how it will look for students."
              : "Upload an exam PDF to see the preview here."
          }
        />
      </CardContent>
    </Card>
  );
}
