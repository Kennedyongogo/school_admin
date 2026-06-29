import React, { useEffect, useState } from "react";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { PremiumDialog, DialogGhostButton } from "../Exams/examUi";
import ExamPdfStudentPreviewPanel from "../Exams/ExamPdfStudentPreviewPanel";
import { createManualAnswerEntry } from "../Exams/pdfManualAnswers";
import AssignmentQuestionFields, { defaultAnswerForQuestionType } from "./AssignmentQuestionFields";

function isPdfAssignment(assignment) {
  return String(assignment?.assignment_type || "").trim() === "pdf_form";
}

function initialAnswersForQuestions(questions) {
  const initial = {};
  (Array.isArray(questions) ? questions : []).forEach((q, idx) => {
    const key = String(q.id || idx + 1);
    initial[key] = defaultAnswerForQuestionType(q.question_type);
  });
  return initial;
}

export default function AssignmentStudentPreviewDialog({ open, assignment, onClose }) {
  const [answers, setAnswers] = useState({});
  const [pdfEntries, setPdfEntries] = useState([createManualAnswerEntry()]);
  const [pdfWorkingPapers, setPdfWorkingPapers] = useState([]);

  useEffect(() => {
    if (!open || !assignment) return;
    if (isPdfAssignment(assignment)) {
      setPdfEntries([createManualAnswerEntry()]);
      setPdfWorkingPapers([]);
      setAnswers({});
      return;
    }
    setAnswers(initialAnswersForQuestions(assignment.questions));
    setPdfEntries([createManualAnswerEntry()]);
    setPdfWorkingPapers([]);
  }, [open, assignment]);

  const addPreviewWorkingPaper = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPdfWorkingPapers((prev) => [
      ...prev,
      {
        id: `preview-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        url,
        name: file.name,
        mime: file.type,
        size: file.size,
      },
    ]);
  };

  const removePreviewWorkingPaper = (id) => {
    setPdfWorkingPapers((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleClose = () => {
    pdfWorkingPapers.forEach((p) => {
      if (p.url?.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    onClose();
  };

  const questions = Array.isArray(assignment?.questions) ? assignment.questions : [];

  return (
    <PremiumDialog
      open={open}
      onClose={handleClose}
      title="Student preview"
      subtitle={assignment?.title || ""}
      maxWidth="lg"
      footer={<DialogGhostButton onClick={handleClose}>Close</DialogGhostButton>}
    >
      <Stack spacing={2}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Preview only — nothing is saved. This is how students will see the assignment.
        </Alert>

        {assignment?.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
            {assignment.description}
          </Typography>
        ) : null}

        {assignment?.instructions ? (
          <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, bgcolor: "#fafafa" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Instructions
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {assignment.instructions}
            </Typography>
          </Box>
        ) : null}

        {assignment?.due_date ? (
          <Typography variant="caption" color="text.secondary">
            Due: {new Date(assignment.due_date).toLocaleString()}
          </Typography>
        ) : null}

        {isPdfAssignment(assignment) ? (
          <ExamPdfStudentPreviewPanel
            entries={pdfEntries}
            onEntriesChange={setPdfEntries}
            workingPapers={pdfWorkingPapers}
            onAddWorkingPaper={addPreviewWorkingPaper}
            onRemoveWorkingPaper={removePreviewWorkingPaper}
          />
        ) : questions.length ? (
          <Stack spacing={2}>
            {questions.map((q, idx) => {
              const key = String(q.id || idx + 1);
              return (
                <Box key={key} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, bgcolor: "#fff" }}>
                  <Typography sx={{ fontWeight: 700, mb: 1.25, lineHeight: 1.45 }}>
                    {idx + 1}. {q.question_text}
                    {q.marks ? ` (${q.marks} marks)` : ""}
                    {q.required ? " *" : ""}
                  </Typography>
                  <AssignmentQuestionFields
                    question={q}
                    value={answers[key]}
                    onChange={(next) => setAnswers((prev) => ({ ...prev, [key]: next }))}
                    previewMode={q.question_type === "file_upload"}
                  />
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Alert severity="warning">No questions on this assignment yet.</Alert>
        )}
      </Stack>
    </PremiumDialog>
  );
}
