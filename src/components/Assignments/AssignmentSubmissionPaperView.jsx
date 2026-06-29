import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import { MarkingScoreField } from "../Exams/examUi";
import { parseAssignmentChoices } from "./assignmentQuestionUtils";

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

function parseAnswerJson(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export function resolveAssignmentAnswerValue(answerRow) {
  if (!answerRow) return null;
  const json = parseAnswerJson(answerRow.answer_json);
  if (json != null) return json;
  return answerRow.answer_text ?? "";
}

function AssignmentAnswerFilePreviewDialog({ file, onClose }) {
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

function UploadedFileCard({ file, onPreview }) {
  const url = absoluteMediaUrl(file.url);
  const kind = previewKindForFile(file);
  const name = file.name || file.url || "Uploaded file";

  return (
    <Box
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#fff",
        maxWidth: 360,
      }}
    >
      {kind === "image" ? (
        <Box
          component="button"
          type="button"
          onClick={() => onPreview(file)}
          sx={{
            display: "block",
            width: "100%",
            border: 0,
            p: 0,
            cursor: "pointer",
            bgcolor: "#f8fafc",
          }}
        >
          <Box
            component="img"
            src={url}
            alt={name}
            sx={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }}
          />
        </Box>
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ py: 3, px: 2, bgcolor: "#f8fafc", minHeight: 120 }}
        >
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 40, color: "#94a3b8", mb: 0.5 }} />
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {kind === "pdf" ? "PDF document" : "Uploaded file"}
          </Typography>
        </Stack>
      )}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.25, py: 1, gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }} noWrap title={name}>
          {name}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => onPreview(file)} aria-label="Preview file">
            <OpenInNewOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}

export default function AssignmentSubmissionPaperView({
  answers = [],
  answerMarks = {},
  answerComments = {},
  onAnswerMarksChange = null,
  onAnswerCommentsChange = null,
}) {
  const [filePreview, setFilePreview] = useState(null);

  const sortedAnswers = useMemo(
    () =>
      [...answers].sort(
        (a, b) => Number(a.order_number || 0) - Number(b.order_number || 0) || String(a.id).localeCompare(String(b.id))
      ),
    [answers]
  );

  if (!sortedAnswers.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No answers captured.
      </Typography>
    );
  }

  return (
    <>
      <Stack spacing={1.5}>
        {sortedAnswers.map((a, idx) => {
          const value = resolveAssignmentAnswerValue(a);
          const qType = a.question_type || "short_text";
          const choiceOptions = parseAssignmentChoices({ options: a.question_options });
          const qNum = a.order_number || idx + 1;
          const maxMarks = Number(a.question_marks || 0);

          return (
            <Box
              key={a.id}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                bgcolor: "#fff",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "flex-end" }}
                justifyContent="space-between"
                spacing={{ xs: 1, sm: 2 }}
                sx={{ mb: 1.25 }}
              >
                <Typography sx={{ fontWeight: 700, flex: 1, minWidth: 0, lineHeight: 1.45, fontSize: { xs: "0.98rem", md: "1.02rem" } }}>
                  Q{qNum}. {a.question_text || "Question"}
                  {maxMarks ? ` (${maxMarks} marks)` : ""}
                </Typography>
                {onAnswerMarksChange && a.id ? (
                  <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ flexShrink: 0 }}>
                    <MarkingScoreField
                      label="Marks"
                      value={answerMarks[a.id] ?? ""}
                      onChange={(e) => onAnswerMarksChange(a.id, e.target.value)}
                      width={120}
                    />
                    {maxMarks ? (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", pb: 1.1 }}>
                        / {maxMarks}
                      </Typography>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>

              <Box
                sx={{
                  borderRadius: 1.5,
                  bgcolor: "#f8fafc",
                  border: "1px solid #eef2f7",
                  p: { xs: 1.25, sm: 1.5 },
                  mb: onAnswerCommentsChange ? 1.25 : 0,
                }}
              >
                {qType === "multiple_choice" ? (
                  choiceOptions.length ? (
                    <RadioGroup value={String(value || "")}>
                      {choiceOptions.map((opt) => (
                        <FormControlLabel
                          key={`${a.id}-mc-${opt}`}
                          value={opt}
                          control={<Radio size="small" disabled />}
                          label={opt}
                        />
                      ))}
                    </RadioGroup>
                  ) : (
                    <Chip label={String(value || "—")} size="small" sx={{ fontWeight: 600 }} />
                  )
                ) : null}

                {qType === "multi_select" ? (
                  choiceOptions.length ? (
                    <Stack spacing={0.25}>
                      {choiceOptions.map((opt) => {
                        const selected = Array.isArray(value) ? value : [];
                        return (
                          <FormControlLabel
                            key={`${a.id}-ms-${opt}`}
                            control={<Checkbox size="small" disabled checked={selected.includes(opt)} />}
                            label={opt}
                          />
                        );
                      })}
                    </Stack>
                  ) : (
                    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
                      {(Array.isArray(value) ? value : []).map((opt) => (
                        <Chip key={`${a.id}-sel-${opt}`} label={opt} size="small" color="primary" variant="outlined" />
                      ))}
                      {!Array.isArray(value) || !value.length ? (
                        <Typography variant="body2" color="text.secondary">
                          No selection
                        </Typography>
                      ) : null}
                    </Stack>
                  )
                ) : null}

                {qType === "file_upload" ? (
                  <Stack spacing={1.25}>
                    {value && typeof value === "object" && Array.isArray(value.files) && value.files.length ? (
                      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5}>
                        {value.files.map((f, fi) => (
                          <UploadedFileCard key={`${a.id}-file-${fi}`} file={f} onPreview={setFilePreview} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No file uploaded
                      </Typography>
                    )}
                  </Stack>
                ) : null}

                {qType !== "multiple_choice" && qType !== "multi_select" && qType !== "file_upload" ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={qType === "essay" || qType === "long_text" ? 3 : 2}
                    value={String(value ?? "")}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  />
                ) : null}
              </Box>

              {onAnswerCommentsChange && a.id ? (
                <TextField
                  fullWidth
                  size="small"
                  label="Comment"
                  placeholder="Feedback for the student on this question"
                  value={answerComments[a.id] ?? ""}
                  onChange={(e) => onAnswerCommentsChange(a.id, e.target.value)}
                  multiline
                  minRows={1}
                  maxRows={4}
                />
              ) : null}
            </Box>
          );
        })}
      </Stack>
      <AssignmentAnswerFilePreviewDialog file={filePreview} onClose={() => setFilePreview(null)} />
    </>
  );
}
