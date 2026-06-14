import React, { useRef } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { createManualAnswerEntry, isImageWorkingPaper, PDF_MAX_WORKING_PAPERS } from "./pdfManualAnswers";

const accent = "#DC2626";

export default function ExamPdfStudentPreviewPanel({
  entries,
  onEntriesChange,
  workingPapers = [],
  onAddWorkingPaper,
  onRemoveWorkingPaper,
  readOnly = false,
  uploadingPaper = false,
  removingPaperId = "",
}) {
  const cameraInputRef = useRef(null);
  const scanInputRef = useRef(null);

  const addEntry = () => {
    if (readOnly || !onEntriesChange) return;
    onEntriesChange([...entries, createManualAnswerEntry()]);
  };

  const updateEntry = (id, patch) => {
    if (readOnly || !onEntriesChange) return;
    onEntriesChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const removeEntry = (id) => {
    if (readOnly || !onEntriesChange || entries.length <= 1) return;
    onEntriesChange(entries.filter((entry) => entry.id !== id));
  };

  const handleFilePick = (file) => {
    if (readOnly || !file || !onAddWorkingPaper) return;
    onAddWorkingPaper(file);
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontWeight: 700 }}>Your answers</Typography>
        {!readOnly ? (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addEntry}>
            Add answer
          </Button>
        ) : null}
      </Stack>
      {entries.map((entry, index) => (
        <Box key={entry.id} sx={{ border: "1px solid #f3f4f6", borderRadius: 1, p: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Answer {index + 1}
            </Typography>
            {!readOnly && entries.length > 1 ? (
              <IconButton size="small" onClick={() => removeEntry(entry.id)} aria-label="Remove answer">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Stack>
          <Stack spacing={1}>
            <TextField
              fullWidth
              size="small"
              label="Question number"
              placeholder="e.g. 1, 2a"
              value={entry.question}
              disabled={readOnly}
              onChange={(e) => updateEntry(entry.id, { question: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Answer"
              placeholder="Type your answer here"
              multiline
              minRows={2}
              value={entry.answer}
              disabled={readOnly}
              onChange={(e) => updateEntry(entry.id, { answer: e.target.value })}
            />
          </Stack>
        </Box>
      ))}

      <Divider />

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Working on paper
      </Typography>
      <Alert severity="info" sx={{ py: 0.5 }}>
        Work on your own paper for the remaining questions. Take <strong>many photos</strong> with your camera, or
        upload <strong>one scanned PDF</strong>. You can mix both.
      </Alert>
      {!readOnly ? (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={uploadingPaper ? <CircularProgress size={16} /> : <CameraAltOutlinedIcon />}
              disabled={uploadingPaper || workingPapers.length >= PDF_MAX_WORKING_PAPERS}
              onClick={() => cameraInputRef.current?.click()}
              sx={{ borderColor: accent, color: accent }}
            >
              Take photo
            </Button>
            <Button
              variant="outlined"
              startIcon={uploadingPaper ? <CircularProgress size={16} /> : <UploadFileOutlinedIcon />}
              disabled={uploadingPaper || workingPapers.length >= PDF_MAX_WORKING_PAPERS}
              onClick={() => scanInputRef.current?.click()}
              sx={{ borderColor: accent, color: accent }}
            >
              Upload scan / file
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Up to {PDF_MAX_WORKING_PAPERS} files · images or PDF · 25 MB each
          </Typography>
          <input
            ref={cameraInputRef}
            type="file"
            hidden
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleFilePick(file);
            }}
          />
          <input
            ref={scanInputRef}
            type="file"
            hidden
            accept="image/*,application/pdf,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              handleFilePick(file);
            }}
          />
        </>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Students use the buttons above during the live exam to upload photos or scanned PDFs.
        </Typography>
      )}

      {workingPapers.length ? (
        <Stack spacing={1}>
          {workingPapers.map((file, index) => {
            const fileUrl = file.url?.startsWith("blob:") || file.url?.startsWith("http")
              ? file.url
              : file.url
                ? (file.url.startsWith("/") ? file.url : `/${file.url}`)
                : "";
            const isImage = isImageWorkingPaper(file);
            return (
              <Box
                key={file.id || `paper-${index}`}
                sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: 1, bgcolor: "#fff" }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Paper {index + 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {file.name || "Uploaded file"}
                    </Typography>
                    {fileUrl ? (
                      <Button
                        size="small"
                        component="a"
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 0.5, px: 0, minWidth: 0 }}
                      >
                        Open file
                      </Button>
                    ) : null}
                    {isImage && fileUrl ? (
                      <Box
                        component="img"
                        src={fileUrl}
                        alt={file.name || `Working paper ${index + 1}`}
                        sx={{
                          mt: 1,
                          width: "100%",
                          maxHeight: 200,
                          objectFit: "contain",
                          borderRadius: 1,
                          border: "1px solid #f3f4f6",
                        }}
                      />
                    ) : null}
                  </Box>
                  {!readOnly && onRemoveWorkingPaper ? (
                    <IconButton
                      size="small"
                      color="error"
                      disabled={removingPaperId === file.id}
                      onClick={() => onRemoveWorkingPaper(file.id)}
                      aria-label="Remove file"
                    >
                      {removingPaperId === file.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteOutlineIcon fontSize="small" />
                      )}
                    </IconButton>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}
