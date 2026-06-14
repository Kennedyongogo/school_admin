import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { fetchExamPdfBlobUrl } from "./examPdfAdminUtils";
import { renderManualPdfAnswerRows, renderManualPdfWorkingPapers, isImageWorkingPaper } from "./pdfManualAnswers";

const mediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

export default function ExamPdfSubmissionView({ exam, submission }) {
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const answerRows = useMemo(
    () => renderManualPdfAnswerRows(submission?.pdf_answers_json),
    [submission?.pdf_answers_json]
  );

  const workingPapers = useMemo(
    () => renderManualPdfWorkingPapers(submission?.pdf_answers_json),
    [submission?.pdf_answers_json]
  );

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

  if (!answerRows.length && !workingPapers.length && !completedUrl) {
    return (
      <Typography variant="body2" color="text.secondary">
        No PDF answers captured for this submission.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
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
          {answerRows.length ? (
            answerRows.map((row, index) => (
              <Box
                key={row.id || `answer-${index}`}
                sx={{
                  border: "1px solid #f3f4f6",
                  borderRadius: 1,
                  p: 1.25,
                  bgcolor: "#fff",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Question {row.question || "—"}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {row.answer || "—"}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No typed answers recorded.
            </Typography>
          )}
        </Stack>
      </Stack>

      {workingPapers.length ? (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Uploaded working papers</Typography>
          <Stack spacing={1.25}>
            {workingPapers.map((file, index) => {
              const fileUrl = mediaUrl(file.url);
              return (
                <Box
                  key={file.id || `paper-${index}`}
                  sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 1.25, bgcolor: "#fff" }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Paper {index + 1}: {file.name || "Uploaded file"}
                  </Typography>
                  {fileUrl ? (
                    <Button
                      size="small"
                      component="a"
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mt: 0.5 }}
                    >
                      Open file
                    </Button>
                  ) : null}
                  {isImageWorkingPaper(file) && fileUrl ? (
                    <Box
                      component="img"
                      src={fileUrl}
                      alt={file.name || `Working paper ${index + 1}`}
                      sx={{
                        mt: 1,
                        width: "100%",
                        maxHeight: 320,
                        objectFit: "contain",
                        borderRadius: 1,
                        border: "1px solid #f3f4f6",
                      }}
                    />
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : null}

      {completedUrl ? (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Submitted answer sheet</Typography>
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
