import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  buildPreviewPages,
  parseQuestionOptions,
  resolveSubmissionAnswerValue,
} from "./examPaperLayout";

const accent = "#DC2626";

const mediaUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const absoluteMediaUrl = (path) => {
  const u = mediaUrl(path);
  if (/^https?:\/\//i.test(u)) return u;
  if (typeof window !== "undefined") return `${window.location.origin}${u}`;
  return u;
};

const previewKindForFile = (file) => {
  const name = String(file?.name || file?.url || "").toLowerCase();
  const mime = String(file?.mime || file?.type || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)) return "image";
  if (mime === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (/\.(doc|docx)$/i.test(name) || mime.includes("word") || mime.includes("document")) return "document";
  return "other";
};

function ExamAnswerFilePreviewDialog({ file, onClose }) {
  if (!file) return null;
  const url = absoluteMediaUrl(file.url);
  const kind = previewKindForFile(file);
  const title = file.name || file.url || "Uploaded file";

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Typography component="span" sx={{ fontWeight: 700, pr: 2 }} noWrap title={title}>
          {title}
        </Typography>
        <IconButton onClick={onClose} aria-label="Close preview" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {kind === "image" ? (
          <Box
            component="img"
            src={url}
            alt={title}
            sx={{ width: "100%", maxHeight: "75vh", objectFit: "contain", display: "block", mx: "auto" }}
          />
        ) : null}
        {kind === "pdf" ? (
          <Box
            component="iframe"
            src={url}
            title={title}
            sx={{ width: "100%", height: "75vh", border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}
          />
        ) : null}
        {kind === "document" ? (
          <Box
            component="iframe"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            title={title}
            sx={{ width: "100%", height: "75vh", border: "1px solid #e5e7eb", borderRadius: 1, bgcolor: "#f9fafb" }}
          />
        ) : null}
        {kind === "other" ? (
          <Stack spacing={1.5} alignItems="center" sx={{ py: 3 }}>
            <Typography color="text.secondary" textAlign="center">
              Inline preview is not available for this file type.
            </Typography>
            <Button variant="outlined" component="a" href={url} target="_blank" rel="noopener noreferrer">
              Open file
            </Button>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function ExamSubmissionPaperView({
  exam,
  answers = [],
  answerMarks = {},
  answerComments = {},
  onAnswerMarksChange = null,
  onAnswerCommentsChange = null,
}) {
  const [filePreview, setFilePreview] = useState(null);
  const pages = useMemo(() => buildPreviewPages(exam), [exam]);

  const answersByQuestionId = useMemo(() => {
    const map = new Map();
    for (const a of answers) {
      const qid = a.question_id || a.question?.id;
      if (qid && !map.has(qid)) map.set(qid, a);
    }
    return map;
  }, [answers]);

  if (!pages.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Exam layout not available. Refresh the page or open the exam in the editor.
      </Typography>
    );
  }

  return (
    <>
    <Stack spacing={2}>
      {pages.map((page) => (
        <Box
          key={`submission-preview-page-${page.pageNo}`}
          sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, bgcolor: "#fff" }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Page {page.pageNo}</Typography>
          <Stack spacing={1.25}>
            {page.questions
              .slice()
              .sort((a, b) => Number(a.page_y || 0) - Number(b.page_y || 0))
              .map((q, idx) => {
                const answerRow = answersByQuestionId.get(q.id);
                const value = resolveSubmissionAnswerValue(answerRow);
                const choiceOptions = parseQuestionOptions(q);
                const qType = q.question_type || "short_text";

                return (
                  <Box
                    key={`submission-q-${q.id || idx}`}
                    sx={{ border: "1px solid #f3f4f6", borderRadius: 1.5, p: 1.25 }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      justifyContent="space-between"
                      spacing={{ xs: 1, sm: 2 }}
                      sx={{ mb: 0.75 }}
                    >
                      <Typography sx={{ fontWeight: 700, flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                        {q.order_number || idx + 1}. {q.question_text || "Question"} ({Number(q.marks) || 0} marks)
                        {q.required ? " (Required)" : ""}
                      </Typography>
                      {onAnswerMarksChange && answerRow?.id ? (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                          <TextField
                            size="small"
                            label="Marks obtained"
                            type="number"
                            value={answerMarks[answerRow.id] ?? ""}
                            onChange={(e) => onAnswerMarksChange(answerRow.id, e.target.value)}
                            sx={{ width: { xs: 120, sm: 140 } }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                            / {Number(q.marks) || 0}
                          </Typography>
                        </Stack>
                      ) : null}
                    </Stack>

                    {qType === "short_text" ? (
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Student writes short answer here"
                        value={String(value ?? "")}
                        disabled
                        InputProps={{ readOnly: true }}
                      />
                    ) : null}

                    {qType === "true_false" ? (
                      <RadioGroup row value={String(value || "")}>
                        <FormControlLabel value="True" control={<Radio size="small" disabled />} label="True" />
                        <FormControlLabel value="False" control={<Radio size="small" disabled />} label="False" />
                      </RadioGroup>
                    ) : null}

                    {qType === "multiple_choice" ? (
                      <RadioGroup value={String(value || "")}>
                        {choiceOptions.map((opt) => (
                          <FormControlLabel
                            key={`${q.id}-radio-${opt}`}
                            value={opt}
                            control={<Radio size="small" disabled />}
                            label={opt}
                          />
                        ))}
                      </RadioGroup>
                    ) : null}

                    {qType === "multi_select" ? (
                      <Stack spacing={0.25}>
                        {choiceOptions.map((opt) => {
                          const selectedValues = Array.isArray(value) ? value : [];
                          return (
                            <FormControlLabel
                              key={`${q.id}-check-${opt}`}
                              control={<Checkbox size="small" disabled checked={selectedValues.includes(opt)} />}
                              label={opt}
                            />
                          );
                        })}
                      </Stack>
                    ) : null}

                    {qType === "diagram_label" ? (
                      <Stack spacing={1}>
                        {q.diagram_data ? (
                          <Box
                            sx={{
                              width: "100%",
                              maxHeight: 220,
                              border: "1px solid #e5e7eb",
                              borderRadius: 1,
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              component="img"
                              src={q.diagram_data}
                              alt="Diagram"
                              sx={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Diagram
                          </Typography>
                        )}
                        {(Array.isArray(q?.options?.hotspots) ? q.options.hotspots : []).map((hs, hsIdx) => {
                          const hsKey = String(hs.id || hsIdx + 1);
                          const answerMap = value && typeof value === "object" ? value : {};
                          return (
                            <TextField
                              key={`${q.id}-hs-${hsKey}`}
                              fullWidth
                              size="small"
                              label={hs.prompt || `Label ${hsIdx + 1}`}
                              placeholder="Student enters label"
                              value={String(answerMap[hsKey] || "")}
                              disabled
                              InputProps={{ readOnly: true }}
                            />
                          );
                        })}
                      </Stack>
                    ) : null}

                    {qType === "file_upload" ? (
                      <Stack spacing={1}>
                        {q?.options?.upload_hint ? (
                          <Typography variant="body2" color="text.secondary">
                            {q.options.upload_hint}
                          </Typography>
                        ) : null}
                        {value && typeof value === "object" && Array.isArray(value.files) && value.files.length ? (
                          <Stack spacing={0.5}>
                            {value.files.map((f, i) => (
                              <Typography key={`${f.url || i}`} variant="body2">
                                <Box
                                  component="button"
                                  type="button"
                                  onClick={() => setFilePreview(f)}
                                  sx={{
                                    color: accent,
                                    fontWeight: 600,
                                    border: 0,
                                    bgcolor: "transparent",
                                    p: 0,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    textDecoration: "underline",
                                    font: "inherit",
                                  }}
                                >
                                  {f.name || f.url || `File ${i + 1}`}
                                </Box>
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Box
                            sx={{
                              border: "1px dashed #9ca3af",
                              borderRadius: 1,
                              p: 1.5,
                              bgcolor: "#f9fafb",
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              No file uploaded
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    ) : null}

                    {onAnswerCommentsChange && answerRow?.id ? (
                      <TextField
                        fullWidth
                        size="small"
                        label="Teacher comment (optional)"
                        placeholder="Feedback for the student on this question"
                        value={answerComments[answerRow.id] ?? ""}
                        onChange={(e) => onAnswerCommentsChange(answerRow.id, e.target.value)}
                        multiline
                        minRows={1}
                        maxRows={4}
                        sx={{ mt: 1 }}
                      />
                    ) : null}
                  </Box>
                );
              })}
            {page.questions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No questions on this page.
              </Typography>
            ) : null}
          </Stack>
        </Box>
      ))}
    </Stack>
    <ExamAnswerFilePreviewDialog file={filePreview} onClose={() => setFilePreview(null)} />
    </>
  );
}
