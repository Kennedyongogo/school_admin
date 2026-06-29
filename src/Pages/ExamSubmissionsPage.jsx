import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TablePagination,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import ExamSubmissionPaperView from "../components/Exams/ExamSubmissionPaperView";
import ExamPdfSubmissionView from "../components/Exams/ExamPdfSubmissionView";
import { isPdfFormExamRow, clearCachedExamPdfBlobUrl } from "../components/Exams/examPdfAdminUtils";
import {
  renderManualPdfAnswerRows,
  renderManualPdfWorkingPapers,
  submissionHasManualPdfEntries,
} from "../components/Exams/pdfManualAnswers";
import {
  ExamHero,
  ExamPanelCard,
  ExamPrimaryButton,
  MarkingScoreField,
  TabPanelShell,
} from "../components/Exams/examUi";
import {
  authJsonHeaders,
  fullMainBleedSx,
  warmCream,
  elimuViewportSx,
  primaryRed,
  primaryDark,
  primaryLight,
} from "../components/Exams/examShared";

const accent = primaryRed;
const accentDark = primaryDark;
const accentLight = primaryLight;

const authHeaders = authJsonHeaders;

export default function ExamSubmissionsPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const examTitleFromState = location.state?.examTitle;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examInfo, setExamInfo] = useState(null);
  const [fullExam, setFullExam] = useState(null);
  const [rows, setRows] = useState([]);
  const [expandedById, setExpandedById] = useState({});
  const [markInputs, setMarkInputs] = useState({});
  const [answerMarks, setAnswerMarks] = useState({});
  const [answerComments, setAnswerComments] = useState({});
  const [pdfEntryMarks, setPdfEntryMarks] = useState({});
  const [pdfEntryComments, setPdfEntryComments] = useState({});
  const [pdfPaperComments, setPdfPaperComments] = useState({});
  const [markSavingId, setMarkSavingId] = useState("");
  const [gradingId, setGradingId] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const title = useMemo(
    () => examInfo?.title || examTitleFromState || `Exam #${examId}`,
    [examInfo?.title, examTitleFromState, examId]
  );

  const isPdfFormExam = useMemo(
    () => isPdfFormExamRow(examInfo || fullExam),
    [examInfo, fullExam]
  );

  const patchSubmissionPdfAnswers = useCallback((submissionId, pdfAnswersJson) => {
    if (!submissionId || !pdfAnswersJson) return;
    setRows((prev) =>
      prev.map((row) => (row.id === submissionId ? { ...row, pdf_answers_json: pdfAnswersJson } : row))
    );
    renderManualPdfWorkingPapers(pdfAnswersJson).forEach((paper) => {
      if (!paper.id) return;
      if (paper.marker_comment != null) {
        setPdfPaperComments((prev) => ({ ...prev, [paper.id]: String(paper.marker_comment) }));
      }
    });
  }, []);

  const patchSubmissionRow = useCallback((submissionId, updater) => {
    setRows((prev) => prev.map((row) => (row.id === submissionId ? updater(row) : row)));
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [res, examRes] = await Promise.all([
        fetch(`/api/exams/${examId}/submissions?status=submitted&page=${page}&limit=${rowsPerPage}`, {
          headers: authHeaders(token),
        }),
        fetch(`/api/exams/${examId}`, { headers: authHeaders(token) }),
      ]);
      const data = await res.json().catch(() => ({}));
      const examJson = await examRes.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load submissions.");
      const exam = data?.data?.exam || null;
      const submissions = Array.isArray(data?.data?.submissions) ? data.data.submissions : [];
      if (examRes.ok && examJson.success) {
        setFullExam(examJson.data || null);
      } else {
        setFullExam(null);
      }
      const pg = data?.data?.pagination || {};
      setExamInfo(exam);
      setRows(submissions);
      setPagination({
        page: Number(pg.page) || page,
        totalPages: Number(pg.totalPages) || 1,
        total: Number(pg.total) || submissions.length,
        limit: Number(pg.limit) || 20,
      });
      const nextInputs = {};
      const nextAnswerMarks = {};
      const nextAnswerComments = {};
      const nextPdfEntryMarks = {};
      const nextPdfEntryComments = {};
      const nextPdfPaperComments = {};
      const pdfExam = isPdfFormExamRow(exam);
      submissions.forEach((s) => {
        const manualPdfEntries = submissionHasManualPdfEntries(s);
        if (pdfExam && manualPdfEntries) {
          const pdfRows = renderManualPdfAnswerRows(s.pdf_answers_json);
          pdfRows.forEach((entry) => {
            nextPdfEntryMarks[entry.id] =
              entry.marks_obtained != null ? String(entry.marks_obtained) : "";
            nextPdfEntryComments[entry.id] =
              entry.marker_comment != null ? String(entry.marker_comment) : "";
          });
        }
        if (pdfExam) {
          nextInputs[s.id] =
            s?.marking?.total_score != null
              ? String(s.marking.total_score)
              : s.pdf_auto_score != null
                ? String(s.pdf_auto_score)
                : "";
        } else {
          nextInputs[s.id] = s?.marking?.total_score != null ? String(s.marking.total_score) : "";
        }
        if (pdfExam) {
          renderManualPdfWorkingPapers(s.pdf_answers_json).forEach((paper) => {
            if (paper.id) {
              nextPdfPaperComments[paper.id] =
                paper.marker_comment != null ? String(paper.marker_comment) : "";
            }
          });
        }
        (s.answers || []).forEach((a) => {
          nextAnswerMarks[a.id] = a.marks_obtained != null ? String(a.marks_obtained) : "";
          nextAnswerComments[a.id] = a.marker_comment != null ? String(a.marker_comment) : "";
        });
      });
      setMarkInputs(nextInputs);
      setAnswerMarks(nextAnswerMarks);
      setAnswerComments(nextAnswerComments);
      setPdfEntryMarks(nextPdfEntryMarks);
      setPdfEntryComments(nextPdfEntryComments);
      setPdfPaperComments(nextPdfPaperComments);
    } catch (e) {
      setError(e.message || "Could not load submissions.");
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [examId, page, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (examId) clearCachedExamPdfBlobUrl(examId);
    };
  }, [examId]);

  const saveSubmissionMark = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    const raw = markInputs[submissionId];
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0) {
      await Swal.fire({ icon: "error", title: "Invalid mark", text: "Enter a valid non-negative score." });
      return;
    }
    setMarkSavingId(submissionId);
    try {
      const res = await fetch(`/api/exams/${examId}/submissions/${submissionId}/mark`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ total_score: score }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save mark.");
      const savedScore = data.data?.total_score != null ? Number(data.data.total_score) : score;
      setRows((prev) =>
        prev.map((row) =>
          row.id === submissionId
            ? {
                ...row,
                marking: {
                  ...(row.marking || {}),
                  total_score: savedScore,
                },
              }
            : row
        )
      );
      setMarkInputs((prev) => ({ ...prev, [submissionId]: String(savedScore) }));
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Marking failed", text: e.message || "Could not save mark." });
    } finally {
      setMarkSavingId("");
    }
  };

  const saveQuestionMarks = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    const submission = rows.find(s => s.id === submissionId);
    if (!submission) return;
    const alreadyMarked = (submission.answers || []).some(a => a.marks_obtained !== null);
    if (alreadyMarked) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Update marks?",
        text: "This submission has already been marked. Do you want to update the marks?",
        showCancelButton: true,
        confirmButtonColor: accentDark,
      });
      if (!confirm.isConfirmed) return;
    }
    const promises = submission.answers
      .map((a) => {
        const marksRaw = answerMarks[a.id];
        const marks = marksRaw === "" || marksRaw == null ? null : Number(marksRaw);
        const comment = answerComments[a.id] != null ? String(answerComments[a.id]) : "";
        const hasMarks = marks != null && Number.isFinite(marks) && marks >= 0;
        const hasComment = comment.trim() !== "";
        if (!hasMarks && !hasComment) return null;
        if (hasMarks && (!Number.isFinite(marks) || marks < 0)) return null;
        const body = {};
        if (hasMarks) body.marks_obtained = marks;
        body.marker_comment = comment.trim();
        return fetch(`/api/exams/${examId}/submissions/${submissionId}/answers/${a.id}/mark`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      })
      .filter(Boolean);
    if (!promises.length) {
      await Swal.fire({ icon: "info", title: "Nothing to save", text: "Enter marks and/or comments for at least one question." });
      return;
    }
    setMarkSavingId(submissionId);
    try {
      const responses = await Promise.all(promises);
      for (const res of responses) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not save marks.");
        }
      }

      patchSubmissionRow(submissionId, (row) => {
        const updatedAnswers = (row.answers || []).map((a) => {
          const marksRaw = answerMarks[a.id];
          const commentRaw = answerComments[a.id];
          const hasMarks = marksRaw !== "" && marksRaw != null;
          const hasComment = String(commentRaw || "").trim() !== "";
          if (!hasMarks && !hasComment) return a;
          return {
            ...a,
            marks_obtained: hasMarks ? Number(marksRaw) : a.marks_obtained,
            marker_comment: hasComment ? String(commentRaw).trim() : a.marker_comment,
          };
        });
        const totalObtained = updatedAnswers.reduce(
          (sum, a) => sum + Number(a.marks_obtained || 0),
          0
        );
        return {
          ...row,
          answers: updatedAnswers,
          marking: {
            ...(row.marking || {}),
            total_score: totalObtained,
          },
        };
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Marking failed", text: e.message || "Could not save marks." });
    } finally {
      setMarkSavingId("");
    }
  };

  const savePdfExamMarking = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    const submission = rows.find((s) => s.id === submissionId);
    if (!submission) return;

    const score = Number(markInputs[submissionId]);
    if (!Number.isFinite(score) || score < 0) {
      await Swal.fire({
        icon: "error",
        title: "Total required",
        text: "Enter the overall total score for this PDF exam before saving.",
      });
      return;
    }

    const entries = renderManualPdfAnswerRows(submission.pdf_answers_json);
    const alreadyMarked =
      submission?.marking?.total_score != null ||
      entries.some((entry) => entry.marks_obtained != null);
    if (alreadyMarked) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Update marks?",
        text: "This submission has already been marked. Do you want to update the marks?",
        showCancelButton: true,
        confirmButtonColor: accentDark,
      });
      if (!confirm.isConfirmed) return;
    }

    setMarkSavingId(submissionId);
    try {
      const questionPromises = entries
        .map((entry) => {
          const marksRaw = pdfEntryMarks[entry.id];
          const marks = marksRaw === "" || marksRaw == null ? null : Number(marksRaw);
          const comment = pdfEntryComments[entry.id] != null ? String(pdfEntryComments[entry.id]) : "";
          const hasMarks = marks != null && Number.isFinite(marks) && marks >= 0;
          const hasComment = comment.trim() !== "";
          if (!hasMarks && !hasComment) return null;
          if (hasMarks && (!Number.isFinite(marks) || marks < 0)) return null;
          const body = {};
          if (hasMarks) body.marks_obtained = marks;
          body.marker_comment = comment.trim();
          return fetch(
            `/api/exams/${examId}/submissions/${submissionId}/pdf-answers/${encodeURIComponent(entry.id)}/mark`,
            {
              method: "PUT",
              headers: authHeaders(token),
              body: JSON.stringify(body),
            }
          );
        })
        .filter(Boolean);

      const totalPromise = fetch(`/api/exams/${examId}/submissions/${submissionId}/mark`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ total_score: score }),
      });

      const results = await Promise.all([totalPromise, ...questionPromises]);
      let savedTotalScore = score;
      for (const res of results) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Could not save marks.");
        }
        if (data.data?.total_score != null) {
          savedTotalScore = Number(data.data.total_score);
        }
      }

      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== submissionId) return row;
          const raw = row.pdf_answers_json;
          let nextRow = {
            ...row,
            marking: {
              ...(row.marking || {}),
              total_score: savedTotalScore,
            },
          };
          if (raw && typeof raw === "object" && Array.isArray(raw.entries)) {
            const entries = raw.entries.map((entry) => {
              const id = String(entry?.id || "");
              if (!id) return entry;
              const marksRaw = pdfEntryMarks[id];
              const commentRaw = pdfEntryComments[id];
              const hasMarks = marksRaw !== "" && marksRaw != null;
              const hasComment = String(commentRaw || "").trim() !== "";
              if (!hasMarks && !hasComment) return entry;
              const next = { ...entry };
              if (hasMarks) next.marks_obtained = Number(marksRaw);
              if (hasComment) next.marker_comment = String(commentRaw).trim();
              return next;
            });
            nextRow = {
              ...nextRow,
              pdf_answers_json: {
                ...raw,
                entries,
                working_papers: Array.isArray(raw.working_papers) ? raw.working_papers : [],
              },
            };
          }
          return nextRow;
        })
      );
      setMarkInputs((prev) => ({ ...prev, [submissionId]: String(savedTotalScore) }));
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Marking failed", text: e.message || "Could not save marks." });
    } finally {
      setMarkSavingId("");
    }
  };

  const gradeExamSubmission = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    const submission = rows.find(s => s.id === submissionId);
    if (!submission) return;
    const hasMarks = isPdfFormExam
      ? submission?.marking?.total_score != null || submission.pdf_auto_score != null
      : (submission.answers || []).some((a) => a.marks_obtained !== null);
    if (!hasMarks) {
      await Swal.fire({
        icon: "warning",
        title: "Total required",
        text: isPdfFormExam
          ? "Enter and save the total score before grading."
          : "Please save marks first before grading.",
      });
      return;
    }
    setGradingId(submissionId);
    try {
      const res = await fetch(`/api/exams/${examId}/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Grading failed.");
      const result = data.data || {};
      patchSubmissionRow(submissionId, (row) => ({
        ...row,
        marking: {
          ...(row.marking || {}),
          grade: result.grade ?? row.marking?.grade ?? null,
          grade_letter: result.grade_letter ?? row.marking?.grade_letter ?? null,
          grade_remarks: result.grade_remarks ?? row.marking?.grade_remarks ?? null,
          points: result.points != null ? result.points : row.marking?.points ?? null,
        },
      }));
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Grading failed", text: e.message || "Could not grade the exam." });
    } finally {
      setGradingId("");
    }
  };

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        ...elimuViewportSx,
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
        display: "flex",
        flexDirection: "column",
      })}
    >
      <ExamHero
        title="Submissions & marking"
        subtitle={title}
        icon={
          <IconButton onClick={() => navigate("/exam")} sx={{ color: "#fff", p: 0, "&:hover": { bgcolor: "transparent" } }}>
            <ArrowBackIcon sx={{ fontSize: 28 }} />
          </IconButton>
        }
      />

      <TabPanelShell loading={loading} error={error} onDismissError={() => setError("")}>
        {rows.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: "16px" }}>No student submissions yet for this exam.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {rows.map((s, idx) => {
              const isExpanded = !!expandedById[s.id];
              return (
                <ExamPanelCard key={s.id}>
                    <Stack spacing={1}>
                      <Stack
                        direction={{ xs: "column", lg: "row" }}
                        justifyContent="space-between"
                        spacing={1}
                        alignItems={{ lg: "center" }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 800 }}>
                            {idx + 1 + (pagination.page - 1) * pagination.limit}. {s.student?.user?.full_name || s.student?.user?.username || "Student"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Adm: {s.student?.admission_number || "—"} · Status: {s.status || "draft"} · Submitted:{" "}
                            {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-end"
                          flexWrap="nowrap"
                          sx={{
                            flexShrink: 0,
                            width: { xs: "100%", lg: "auto" },
                            overflowX: "auto",
                            overflowY: "visible",
                            pt: 0.25,
                            pb: { xs: 0.25, lg: 0 },
                          }}
                        >
                          {(() => {
                            const manualPdfEntries = submissionHasManualPdfEntries(s);
                            const alreadyMarked = isPdfFormExam
                              ? s?.marking?.total_score != null || s.pdf_auto_score != null
                              : (s.answers || []).some((a) => a.marks_obtained !== null);
                            const hasResult = s?.marking?.grade != null;
                            const toolbarControlSx = {
                              width: 156,
                              minWidth: 156,
                              maxWidth: 156,
                              height: 40,
                              minHeight: 40,
                              flexShrink: 0,
                              boxSizing: "border-box",
                            };
                            const actionBtnSx = {
                              ...toolbarControlSx,
                              whiteSpace: "nowrap",
                              px: 1,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              lineHeight: 1.2,
                            };
                            const totalScoreValue = isPdfFormExam
                              ? markInputs[s.id] ?? ""
                              : (s.answers || []).reduce((sum, a) => sum + Number(answerMarks[a.id] || 0), 0);
                            const totalScoreEditable = isPdfFormExam;
                            const onSaveMarks = isPdfFormExam
                              ? manualPdfEntries
                                ? () => savePdfExamMarking(s.id)
                                : () => saveSubmissionMark(s.id)
                              : () => saveQuestionMarks(s.id);
                            return (
                              <>
                                <MarkingScoreField
                                  label="Total score"
                                  value={totalScoreValue}
                                  onChange={
                                    totalScoreEditable
                                      ? (e) => setMarkInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                                      : undefined
                                  }
                                  disabled={!totalScoreEditable}
                                  width={156}
                                />
                                <ExamPrimaryButton
                                  size="small"
                                  onClick={() => void onSaveMarks()}
                                  disabled={markSavingId === s.id || s.status !== "submitted"}
                                  sx={{ ...actionBtnSx, minWidth: 156 }}
                                  startIcon={
                                    markSavingId === s.id ? (
                                      <CircularProgress size={16} sx={{ color: "inherit" }} />
                                    ) : null
                                  }
                                >
                                  {markSavingId === s.id
                                    ? "Saving…"
                                    : isPdfFormExam
                                      ? alreadyMarked
                                        ? "Update marks"
                                        : "Save marks"
                                      : alreadyMarked
                                        ? "Update marks"
                                        : "Save marks"}
                                </ExamPrimaryButton>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => void gradeExamSubmission(s.id)}
                                  disabled={gradingId === s.id || s.status !== "submitted" || !alreadyMarked}
                                  sx={{
                                    ...actionBtnSx,
                                    borderColor: accent,
                                    color: accent,
                                    "&:hover": { bgcolor: accentLight },
                                  }}
                                  startIcon={
                                    gradingId === s.id ? (
                                      <CircularProgress size={16} sx={{ color: accent }} />
                                    ) : null
                                  }
                                >
                                  {gradingId === s.id
                                    ? "Grading…"
                                    : hasResult
                                      ? "Update grade"
                                      : "Grade exam"}
                                </Button>
                              </>
                            );
                          })()}
                          <IconButton
                            size="small"
                            onClick={() => setExpandedById((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                            aria-label={isExpanded ? "Collapse submission" : "Expand submission"}
                            sx={{ flexShrink: 0 }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Stack>
                      </Stack>
                      {s.pdf_auto_score != null && isPdfFormExam ? (
                        <Typography variant="body2" color="text.secondary">
                          Auto-score: {s.pdf_auto_score}
                          {examInfo?.total_marks ? ` / ${examInfo.total_marks}` : ""}
                        </Typography>
                      ) : null}
                      {(() => {
                        const totalMarksObtained = (s.answers || []).reduce(
                          (sum, a) => sum + (a.marks_obtained || 0),
                          0
                        );
                        const hasOnlineMarks = (s.answers || []).some((a) => a.marks_obtained != null);
                        const total = isPdfFormExam
                          ? s.marking?.total_score != null
                            ? s.marking.total_score
                            : null
                          : s.marking?.total_score != null
                            ? s.marking.total_score
                            : hasOnlineMarks
                              ? totalMarksObtained
                              : null;
                        if (total == null) return null;
                        const percentage = examInfo?.total_marks ? ((total / examInfo.total_marks) * 100).toFixed(2) : 0;
                        if (s.marking?.grade) {
                          return (
                            <Typography variant="body2" color="text.secondary">
                              Total: {total} / {examInfo?.total_marks} ({percentage}% · Grade: {s.marking.grade_letter}{s.marking.grade_remarks ? ` (${s.marking.grade_remarks})` : ""}{s.marking.points ? ` - ${s.marking.points} points` : ""})
                            </Typography>
                          );
                        }
                        const isPassed = total >= (examInfo?.passing_marks || 0);
                        return (
                          <Typography variant="body2" color="text.secondary">
                            Total: {total} / {examInfo?.total_marks} ({percentage}% · {isPassed ? "Pass" : "Fail"})
                          </Typography>
                        );
                      })()}
                      {isExpanded ? (
                        <Box sx={{ border: "1px solid #eee", borderRadius: 1, p: 1.25, bgcolor: "#fafafa" }}>
                          {isPdfFormExam ? (
                            fullExam ? (
                              <ExamPdfSubmissionView
                                exam={fullExam}
                                examId={examId}
                                submission={s}
                                entryMarks={submissionHasManualPdfEntries(s) ? pdfEntryMarks : undefined}
                                entryComments={submissionHasManualPdfEntries(s) ? pdfEntryComments : undefined}
                                paperComments={pdfPaperComments}
                                onEntryMarksChange={
                                  submissionHasManualPdfEntries(s)
                                    ? (entryId, value) =>
                                        setPdfEntryMarks((prev) => ({ ...prev, [entryId]: value }))
                                    : null
                                }
                                onEntryCommentsChange={
                                  submissionHasManualPdfEntries(s)
                                    ? (entryId, value) =>
                                        setPdfEntryComments((prev) => ({ ...prev, [entryId]: value }))
                                    : null
                                }
                                onPaperCommentsChange={(paperId, value) =>
                                  setPdfPaperComments((prev) => ({ ...prev, [paperId]: value }))
                                }
                                onPdfAnswersJsonChange={(pdfAnswersJson) =>
                                  patchSubmissionPdfAnswers(s.id, pdfAnswersJson)
                                }
                              />
                            ) : s.pdf_answers_json && typeof s.pdf_answers_json === "object" ? (
                              <ExamPdfSubmissionView
                                exam={examInfo || { id: examId }}
                                examId={examId}
                                submission={s}
                                entryMarks={submissionHasManualPdfEntries(s) ? pdfEntryMarks : undefined}
                                entryComments={submissionHasManualPdfEntries(s) ? pdfEntryComments : undefined}
                                paperComments={pdfPaperComments}
                                onEntryMarksChange={
                                  submissionHasManualPdfEntries(s)
                                    ? (entryId, value) =>
                                        setPdfEntryMarks((prev) => ({ ...prev, [entryId]: value }))
                                    : null
                                }
                                onEntryCommentsChange={
                                  submissionHasManualPdfEntries(s)
                                    ? (entryId, value) =>
                                        setPdfEntryComments((prev) => ({ ...prev, [entryId]: value }))
                                    : null
                                }
                                onPaperCommentsChange={(paperId, value) =>
                                  setPdfPaperComments((prev) => ({ ...prev, [paperId]: value }))
                                }
                                onPdfAnswersJsonChange={(pdfAnswersJson) =>
                                  patchSubmissionPdfAnswers(s.id, pdfAnswersJson)
                                }
                              />
                            ) : (
                              <Alert severity="warning">
                                Could not load exam PDF details. Refresh the page.
                              </Alert>
                            )
                          ) : fullExam ? (
                            <ExamSubmissionPaperView
                              exam={fullExam}
                              answers={s.answers}
                              answerMarks={answerMarks}
                              answerComments={answerComments}
                              onAnswerMarksChange={(answerId, value) =>
                                setAnswerMarks((prev) => ({ ...prev, [answerId]: value }))
                              }
                              onAnswerCommentsChange={(answerId, value) =>
                                setAnswerComments((prev) => ({ ...prev, [answerId]: value }))
                              }
                            />
                          ) : Array.isArray(s.answers) && s.answers.length ? (
                            <Alert severity="warning" sx={{ mb: 1 }}>
                              Could not load exam layout. Refresh the page or check your connection.
                            </Alert>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No answers captured.
                            </Typography>
                          )}
                        </Box>
                      ) : null}
                    </Stack>
                </ExamPanelCard>
              );
            })}
          </Stack>
        )}
        {!loading && !error && rows.length > 0 ? (
          <Box sx={{ mt: 2, borderTop: `1px solid ${primaryLight}`, pt: 1 }}>
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 20, 50, 100]}
              count={pagination.total}
              rowsPerPage={rowsPerPage}
              page={Math.max(0, (pagination.page || 1) - 1)}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
              }}
              labelRowsPerPage="Rows per page"
              sx={{
                "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
              }}
            />
          </Box>
        ) : null}
      </TabPanelShell>
    </Box>
  );
}

