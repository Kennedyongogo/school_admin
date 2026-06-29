import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Swal from "sweetalert2";
import StablePdfIframe from "../Exams/StablePdfIframe";
import { MarkingScoreField } from "../Exams/examUi";
import { primaryDark } from "../Exams/examShared";
import {
  renderManualPdfAnswerRows,
  renderManualPdfWorkingPapers,
  isImageWorkingPaper,
  isPdfWorkingPaper,
  workingPaperHasMarkedReturn,
} from "../Exams/pdfManualAnswers";

const mediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

export default function AssignmentPdfSubmissionView({
  assignmentId = null,
  submission,
  entryMarks = {},
  entryComments = {},
  paperComments = {},
  onEntryMarksChange = null,
  onEntryCommentsChange = null,
  onPaperCommentsChange = null,
  onPdfAnswersJsonChange = null,
}) {
  const [pdfAnswersJson, setPdfAnswersJson] = useState(submission?.pdf_answers_json ?? null);
  const [uploadingPaperId, setUploadingPaperId] = useState("");
  const [savingCommentPaperId, setSavingCommentPaperId] = useState("");
  const [removingMarkedPaperId, setRemovingMarkedPaperId] = useState("");
  const fileInputRefs = useRef({});

  const resolvedAssignmentId = assignmentId || null;
  const submissionId = submission?.id || null;
  const canMarkPapers = Boolean(resolvedAssignmentId && submissionId && onPdfAnswersJsonChange);

  useEffect(() => {
    setPdfAnswersJson(submission?.pdf_answers_json ?? null);
  }, [submission?.id]);

  const applyPdfAnswersPatch = (nextJson) => {
    if (!nextJson || typeof nextJson !== "object") return;
    setPdfAnswersJson(nextJson);
    onPdfAnswersJsonChange?.(nextJson);
  };

  const answerRows = useMemo(
    () => renderManualPdfAnswerRows(pdfAnswersJson),
    [pdfAnswersJson]
  );

  const workingPapers = useMemo(
    () => renderManualPdfWorkingPapers(pdfAnswersJson),
    [pdfAnswersJson]
  );

  const uploadMarkedReturn = async (fileId, file) => {
    if (!canMarkPapers || !file) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setUploadingPaperId(fileId);
    try {
      const formData = new FormData();
      formData.append("assignment_pdf_marked_return", file);
      const comment = paperComments[fileId];
      if (comment != null && String(comment).trim() !== "") {
        formData.append("marker_comment", String(comment).trim());
      }
      const res = await fetch(
        `/api/assignments/${resolvedAssignmentId}/submissions/${submissionId}/pdf-working-papers/${encodeURIComponent(fileId)}/marked-return`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not upload marked file.");
      const nextJson = data.data?.pdf_answers_json;
      if (nextJson) {
        applyPdfAnswersPatch(nextJson);
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: error.message || "Could not upload marked file.",
      });
    } finally {
      setUploadingPaperId("");
    }
  };

  const removeMarkedReturn = async (fileId) => {
    if (!canMarkPapers) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove marked file?",
      text: "The marked return for this working paper will be deleted. You can upload a new one later.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: primaryDark,
    });
    if (!confirm.isConfirmed) return;

    setRemovingMarkedPaperId(fileId);
    try {
      const res = await fetch(
        `/api/assignments/${resolvedAssignmentId}/submissions/${submissionId}/pdf-working-papers/${encodeURIComponent(fileId)}/marked-return`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not remove marked file.");
      const nextJson = data.data?.pdf_answers_json;
      if (nextJson) {
        applyPdfAnswersPatch(nextJson);
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Remove failed",
        text: error.message || "Could not remove marked file.",
      });
    } finally {
      setRemovingMarkedPaperId("");
    }
  };

  const savePaperComment = async (fileId) => {
    if (!canMarkPapers) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setSavingCommentPaperId(fileId);
    try {
      const comment = paperComments[fileId] != null ? String(paperComments[fileId]) : "";
      const res = await fetch(
        `/api/assignments/${resolvedAssignmentId}/submissions/${submissionId}/pdf-working-papers/${encodeURIComponent(fileId)}/marking`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ marker_comment: comment.trim() }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save comment.");
      const nextJson = data.data?.pdf_answers_json;
      if (nextJson) {
        applyPdfAnswersPatch(nextJson);
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error.message || "Could not save comment.",
      });
    } finally {
      setSavingCommentPaperId("");
    }
  };

  if (!answerRows.length && !workingPapers.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No PDF answers captured for this submission.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Student answers</Typography>
          {onEntryMarksChange ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
              Per-question marks are for student feedback only. Enter the overall total score above.
            </Typography>
          ) : null}
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
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "flex-end" }}
                  justifyContent="space-between"
                  spacing={{ xs: 1, sm: 2 }}
                  sx={{ mb: 0.75 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }}>
                    Question {row.question || "—"}
                  </Typography>
                  {onEntryMarksChange && row.id ? (
                    <MarkingScoreField
                      label="Marks obtained"
                      value={entryMarks[row.id] ?? ""}
                      onChange={(e) => onEntryMarksChange(row.id, e.target.value)}
                      width={140}
                    />
                  ) : null}
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {row.answer || "—"}
                </Typography>
                {onEntryCommentsChange && row.id ? (
                  <TextField
                    fullWidth
                    size="small"
                    label="Teacher comment (optional)"
                    placeholder="Feedback for the student on this question"
                    value={entryComments[row.id] ?? ""}
                    onChange={(e) => onEntryCommentsChange(row.id, e.target.value)}
                    multiline
                    minRows={1}
                    maxRows={4}
                    sx={{ mt: 1 }}
                  />
                ) : null}
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No typed answers recorded.
            </Typography>
          )}
      </Stack>

      {workingPapers.length ? (
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Uploaded working papers</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Download each student file, mark it offline, then upload the marked copy back for the student to review.
          </Typography>
          <Stack spacing={1.5}>
            {workingPapers.map((file, index) => {
              const fileUrl = mediaUrl(file.url);
              const marked = file.marked_return || null;
              const markedUrl = marked?.url ? mediaUrl(marked.url) : "";
              const hasMarked = workingPaperHasMarkedReturn(file);
              const fileId = file.id;
              const isUploading = uploadingPaperId === fileId;
              const isSavingComment = savingCommentPaperId === fileId;
              const isRemoving = removingMarkedPaperId === fileId;
              return (
                <Box
                  key={file.id || `paper-${index}`}
                  sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 1.5, bgcolor: "#fff" }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Paper {index + 1}: {file.name || "Uploaded file"}
                      </Typography>
                      {hasMarked ? (
                        <Chip
                          size="small"
                          label="Marked return uploaded"
                          color="success"
                          variant="outlined"
                          sx={{ mt: 0.75 }}
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Awaiting marked return"
                          color="warning"
                          variant="outlined"
                          sx={{ mt: 0.75 }}
                        />
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {fileUrl ? (
                        <Button
                          size="small"
                          variant="outlined"
                          component="a"
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<DownloadOutlinedIcon />}
                        >
                          Student file
                        </Button>
                      ) : null}
                      {canMarkPapers ? (
                        <>
                          <input
                            ref={(el) => {
                              if (fileId) fileInputRefs.current[fileId] = el;
                            }}
                            type="file"
                            accept="image/*,application/pdf"
                            hidden
                            onChange={(e) => {
                              const picked = e.target.files?.[0];
                              e.target.value = "";
                              if (picked && fileId) void uploadMarkedReturn(fileId, picked);
                            }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            disabled={isUploading || isRemoving}
                            startIcon={
                              isUploading ? <CircularProgress size={14} color="inherit" /> : <CloudUploadOutlinedIcon />
                            }
                            onClick={() => fileId && fileInputRefs.current[fileId]?.click()}
                          >
                            {hasMarked ? "Replace marked file" : "Upload marked file"}
                          </Button>
                          {hasMarked ? (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              disabled={isUploading || isRemoving}
                              startIcon={
                                isRemoving ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineIcon />
                              }
                              onClick={() => fileId && void removeMarkedReturn(fileId)}
                            >
                              Remove marked
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </Stack>
                  </Stack>

                  {isImageWorkingPaper(file) && fileUrl ? (
                    <Box
                      component="img"
                      src={fileUrl}
                      alt={file.name || `Working paper ${index + 1}`}
                      sx={{
                        width: "100%",
                        maxHeight: 280,
                        objectFit: "contain",
                        borderRadius: 1,
                        border: "1px solid #f3f4f6",
                        mb: 1,
                      }}
                    />
                  ) : isPdfWorkingPaper(file) && fileUrl ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: 320,
                        border: "1px solid #f3f4f6",
                        borderRadius: 1,
                        overflow: "hidden",
                        mb: 1,
                      }}
                    >
                      <StablePdfIframe src={fileUrl} title={`Student paper ${index + 1}`} height={320} />
                    </Box>
                  ) : null}

                  {hasMarked ? (
                    <Box sx={{ mt: 1, pt: 1, borderTop: "1px dashed #e5e7eb" }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                        Marked return
                        {marked?.name ? `: ${marked.name}` : ""}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {markedUrl ? (
                          <Button
                            size="small"
                            variant="outlined"
                            component="a"
                            href={markedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<DownloadOutlinedIcon />}
                          >
                            Open marked file
                          </Button>
                        ) : null}
                      </Stack>
                      {isImageWorkingPaper(marked) && markedUrl ? (
                        <Box
                          component="img"
                          src={markedUrl}
                          alt={marked.name || `Marked paper ${index + 1}`}
                          sx={{
                            width: "100%",
                            maxHeight: 280,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid #dcfce7",
                            bgcolor: "#f0fdf4",
                          }}
                        />
                      ) : isPdfWorkingPaper(marked) && markedUrl ? (
                        <Box
                          sx={{
                            width: "100%",
                            height: 320,
                            border: "1px solid #dcfce7",
                            borderRadius: 1,
                            overflow: "hidden",
                            bgcolor: "#f0fdf4",
                          }}
                        >
                          <StablePdfIframe src={markedUrl} title={`Marked paper ${index + 1}`} height={320} />
                        </Box>
                      ) : null}
                    </Box>
                  ) : null}

                  {canMarkPapers && onPaperCommentsChange ? (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-end" }} sx={{ mt: 1.25 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Teacher comment (optional)"
                        placeholder="Feedback on this working paper for the student"
                        value={paperComments[fileId] ?? ""}
                        onChange={(e) => onPaperCommentsChange(fileId, e.target.value)}
                        multiline
                        minRows={1}
                        maxRows={4}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={isSavingComment || isUploading}
                        onClick={() => fileId && void savePaperComment(fileId)}
                        sx={{ flexShrink: 0, minWidth: 120 }}
                      >
                        {isSavingComment ? "Saving…" : "Save comment"}
                      </Button>
                    </Stack>
                  ) : file.marker_comment ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, fontStyle: "italic" }}>
                      Comment: {file.marker_comment}
                    </Typography>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
