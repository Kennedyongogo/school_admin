import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import ExamSubmissionPaperView from "../components/Exams/ExamSubmissionPaperView";
import ExamPdfSubmissionView from "../components/Exams/ExamPdfSubmissionView";
import { isPdfFormExamRow } from "../components/Exams/examPdfAdminUtils";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2),
  marginBottom: "1px",
  boxSizing: "border-box",
  minHeight: "100%",
  background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
});

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
  const [markSavingId, setMarkSavingId] = useState("");
  const [gradingId, setGradingId] = useState("");
  const [cleanupRunning, setCleanupRunning] = useState(false);
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

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    setLoading(true);
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
      const pdfExam = isPdfFormExamRow(exam);
      submissions.forEach((s) => {
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
        (s.answers || []).forEach((a) => {
          nextAnswerMarks[a.id] = a.marks_obtained != null ? String(a.marks_obtained) : "";
        });
      });
      setMarkInputs(nextInputs);
      setAnswerMarks(nextAnswerMarks);
      setExpandedById({});
    } catch (e) {
      setError(e.message || "Could not load submissions.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [examId, page, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
      await Swal.fire({ icon: "success", title: "Mark saved", timer: 900, showConfirmButton: false });
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
    setMarkSavingId(submissionId);
    try {
      const promises = submission.answers.map(a => {
        const marks = Number(answerMarks[a.id]);
        if (!Number.isFinite(marks) || marks < 0) return null;
        return fetch(`/api/exams/${examId}/submissions/${submissionId}/answers/${a.id}/mark`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify({ marks_obtained: marks }),
        });
      }).filter(Boolean);
      await Promise.all(promises);
      await load();
      await Swal.fire({ icon: "success", title: "Marks saved", timer: 900, showConfirmButton: false });
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
      ? submission?.marking?.total_score != null ||
        submission.pdf_auto_score != null ||
        Number.isFinite(Number(markInputs[submissionId]))
      : (submission.answers || []).some((a) => a.marks_obtained !== null);
    if (!hasMarks) {
      await Swal.fire({ icon: "warning", title: "Marks required", text: "Please save marks first before grading." });
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
      await load();
      await Swal.fire({ icon: "success", title: "Graded successfully", timer: 900, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Grading failed", text: e.message || "Could not grade the exam." });
    } finally {
      setGradingId("");
    }
  };

  const runCleanupStaleDrafts = async () => {
    const token = localStorage.getItem("token");
    if (!token || !examId) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Clean stale drafts?",
      text: "This removes old draft submissions for students who already submitted this exam.",
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirm.isConfirmed) return;
    setCleanupRunning(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submissions/cleanup-stale-drafts`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Cleanup failed.");
      await Swal.fire({
        icon: "success",
        title: "Cleanup complete",
        text: `Deleted ${data?.data?.draft_submissions_deleted || 0} stale drafts.`,
        timer: 1200,
        showConfirmButton: false,
      });
      void load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Cleanup failed", text: e.message || "Could not clean stale drafts." });
    } finally {
      setCleanupRunning(false);
    }
  };

  return (
    <Box sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #f97316 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          color: "#fff",
          boxShadow: `0 8px 24px ${accent}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate("/exam")} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Exams
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Submissions and Marking
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92 }}>
              {title}
            </Typography>
          </Box>
          <Button variant="contained" color="warning" onClick={() => void runCleanupStaleDrafts()} disabled={cleanupRunning || loading}>
            {cleanupRunning ? "Cleaning..." : "Clean stale drafts"}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ py: 3, pb: 4, px: { xs: 1, sm: 1.5, md: 2 }, width: "100%", boxSizing: "border-box" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : rows.length === 0 ? (
          <Alert severity="info">No student submissions yet for this exam.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {rows.map((s, idx) => {
              const isExpanded = !!expandedById[s.id];
              return (
                <Card key={s.id} variant="outlined" sx={{ width: "100%" }}>
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
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
                          alignItems="center"
                          flexWrap="nowrap"
                          sx={{
                            flexShrink: 0,
                            width: { xs: "100%", lg: "auto" },
                            overflowX: "auto",
                            pb: { xs: 0.25, lg: 0 },
                          }}
                        >
                          {(() => {
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
                            return (
                              <>
                                <TextField
                                  size="small"
                                  label="Total score"
                                  type="number"
                                  value={
                                    isPdfFormExam
                                      ? markInputs[s.id] ?? ""
                                      : (s.answers || []).reduce((sum, a) => sum + Number(answerMarks[a.id] || 0), 0)
                                  }
                                  onChange={
                                    isPdfFormExam
                                      ? (e) => setMarkInputs((prev) => ({ ...prev, [s.id]: e.target.value }))
                                      : undefined
                                  }
                                  disabled={!isPdfFormExam}
                                  sx={{
                                    ...toolbarControlSx,
                                    "& .MuiInputBase-root": {
                                      height: 40,
                                    },
                                    "& .MuiInputLabel-root": {
                                      whiteSpace: "nowrap",
                                      maxWidth: "calc(100% + 24px)",
                                    },
                                    "& .MuiOutlinedInput-notchedOutline legend": {
                                      maxWidth: "100%",
                                    },
                                  }}
                                />
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() =>
                                    void (isPdfFormExam ? saveSubmissionMark(s.id) : saveQuestionMarks(s.id))
                                  }
                                  disabled={markSavingId === s.id || s.status !== "submitted"}
                                  sx={{
                                    ...actionBtnSx,
                                    bgcolor: accent,
                                    "&:hover": { bgcolor: accentDark },
                                  }}
                                >
                                  {markSavingId === s.id
                                    ? "Saving…"
                                    : isPdfFormExam
                                      ? alreadyMarked
                                        ? "Update mark"
                                        : "Save mark"
                                      : alreadyMarked
                                        ? "Update marks"
                                        : "Save marks"}
                                </Button>
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
                                >
                                  {gradingId === s.id ? (
                                    <CircularProgress size={18} sx={{ color: accent }} />
                                  ) : hasResult ? (
                                    "Update grade"
                                  ) : (
                                    "Grade exam"
                                  )}
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
                        const hasMarks = (s.answers || []).some((a) => a.marks_obtained != null);
                        const total = isPdfFormExam
                          ? s.marking?.total_score != null
                            ? s.marking.total_score
                            : null
                          : s.marking?.total_score != null
                            ? s.marking.total_score
                            : hasMarks
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
                              <ExamPdfSubmissionView exam={fullExam} submission={s} />
                            ) : s.pdf_answers_json && typeof s.pdf_answers_json === "object" ? (
                              <ExamPdfSubmissionView exam={examInfo || { id: examId }} submission={s} />
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
                              onAnswerMarksChange={(answerId, value) =>
                                setAnswerMarks((prev) => ({ ...prev, [answerId]: value }))
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
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
        {!loading && !error ? (
          <Box sx={{ mt: 2, borderTop: "1px solid #f1d5d5", pt: 1 }}>
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
      </Box>
    </Box>
  );
}

