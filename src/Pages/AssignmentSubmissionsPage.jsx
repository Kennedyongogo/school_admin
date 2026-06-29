import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import AssignmentPdfSubmissionView from "../components/Assignments/AssignmentPdfSubmissionView";
import AssignmentSubmissionPaperView from "../components/Assignments/AssignmentSubmissionPaperView";
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

export default function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const titleFromState = location.state?.assignmentTitle;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignmentInfo, setAssignmentInfo] = useState(null);
  const [fullAssignment, setFullAssignment] = useState(null);
  const [rows, setRows] = useState([]);
  const [expandedById, setExpandedById] = useState({});
  const [markInputs, setMarkInputs] = useState({});
  const [answerMarks, setAnswerMarks] = useState({});
  const [answerComments, setAnswerComments] = useState({});
  const [pdfEntryMarks, setPdfEntryMarks] = useState({});
  const [pdfEntryComments, setPdfEntryComments] = useState({});
  const [pdfPaperComments, setPdfPaperComments] = useState({});
  const [markerFeedback, setMarkerFeedback] = useState({});
  const [markSavingId, setMarkSavingId] = useState("");
  const [publishingId, setPublishingId] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const title = useMemo(
    () => assignmentInfo?.title || titleFromState || `Assignment #${assignmentId}`,
    [assignmentInfo?.title, titleFromState, assignmentId]
  );

  const isPdfAssignment = assignmentInfo?.assignment_type === "pdf_form";
  const questionTotal = useMemo(
    () => (fullAssignment?.questions || []).reduce((sum, q) => sum + Number(q.marks || 0), 0),
    [fullAssignment?.questions]
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

  const load = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!token || !assignmentId) return;
    if (!silent) setLoading(true);
    setError("");
    try {
      const [res, assignRes] = await Promise.all([
        fetch(`/api/assignments/${assignmentId}/submissions?status=submitted&page=${page}&limit=${rowsPerPage}`, {
          headers: authHeaders(token),
        }),
        fetch(`/api/assignments/${assignmentId}`, { headers: authHeaders(token) }),
      ]);
      const data = await res.json().catch(() => ({}));
      const assignJson = await assignRes.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load submissions.");
      const assignment = data?.data?.assignment || null;
      const submissions = Array.isArray(data?.data?.submissions) ? data.data.submissions : [];
      if (assignRes.ok && assignJson.success) setFullAssignment(assignJson.data || null);
      else setFullAssignment(null);
      const pg = data?.data?.pagination || {};
      setAssignmentInfo(assignment);
      setRows(submissions);
      const expanded = {};
      submissions.forEach((s) => {
        expanded[s.id] = true;
      });
      setExpandedById(expanded);
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
      const nextFeedback = {};
      const pdfType = assignment?.assignment_type === "pdf_form";
      submissions.forEach((s) => {
        if (pdfType && submissionHasManualPdfEntries(s)) {
          renderManualPdfAnswerRows(s.pdf_answers_json).forEach((entry) => {
            nextPdfEntryMarks[entry.id] = entry.marks_obtained != null ? String(entry.marks_obtained) : "";
            nextPdfEntryComments[entry.id] = entry.marker_comment != null ? String(entry.marker_comment) : "";
          });
        }
        nextInputs[s.id] = s?.marking?.total_score != null ? String(s.marking.total_score) : "";
        if (pdfType) {
          renderManualPdfWorkingPapers(s.pdf_answers_json).forEach((paper) => {
            if (paper.id) nextPdfPaperComments[paper.id] = paper.marker_comment != null ? String(paper.marker_comment) : "";
          });
        }
        (s.answers || []).forEach((a) => {
          nextAnswerMarks[a.id] = a.marks_obtained != null ? String(a.marks_obtained) : "";
          nextAnswerComments[a.id] = a.marker_comment != null ? String(a.marker_comment) : "";
        });
        nextFeedback[s.id] = s?.marking?.marker_feedback != null ? String(s.marking.marker_feedback) : "";
      });
      setMarkInputs(nextInputs);
      setAnswerMarks(nextAnswerMarks);
      setAnswerComments(nextAnswerComments);
      setPdfEntryMarks(nextPdfEntryMarks);
      setPdfEntryComments(nextPdfEntryComments);
      setPdfPaperComments(nextPdfPaperComments);
      setMarkerFeedback(nextFeedback);
    } catch (e) {
      setError(e.message || "Could not load submissions.");
      if (!silent) setRows([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [assignmentId, page, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveQuestionMarks = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !assignmentId) return;
    const submission = rows.find((s) => s.id === submissionId);
    if (!submission) return;
    const promises = (submission.answers || [])
      .map((a) => {
        const marksRaw = answerMarks[a.id];
        const marks = marksRaw === "" || marksRaw == null ? null : Number(marksRaw);
        const comment = answerComments[a.id] != null ? String(answerComments[a.id]) : "";
        const hasMarks = marks != null && Number.isFinite(marks) && marks >= 0;
        const hasComment = comment.trim() !== "";
        if (!hasMarks && !hasComment) return null;
        const body = {};
        if (hasMarks) body.marks_obtained = marks;
        body.marker_comment = comment.trim();
        return fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/answers/${a.id}/mark`, {
          method: "PUT",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      })
      .filter(Boolean);
    if (!promises.length) {
      await Swal.fire({ icon: "info", title: "Nothing to save", text: "Enter marks and/or comments." });
      return;
    }
    setMarkSavingId(submissionId);
    try {
      const responses = await Promise.all(promises);
      for (const res of responses) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not save marks.");
      }
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== submissionId) return row;
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
          const totalObtained = updatedAnswers.reduce((sum, a) => sum + Number(a.marks_obtained || 0), 0);
          return {
            ...row,
            answers: updatedAnswers,
            marking: { ...(row.marking || {}), total_score: totalObtained },
          };
        })
      );
      setMarkInputs((prev) => ({
        ...prev,
        [submissionId]: String(
          (submission.answers || []).reduce((sum, a) => sum + Number(answerMarks[a.id] || 0), 0)
        ),
      }));
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Marking failed", text: e.message });
    } finally {
      setMarkSavingId("");
    }
  };

  const savePdfMarking = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !assignmentId) return;
    const submission = rows.find((s) => s.id === submissionId);
    if (!submission) return;
    const score = Number(markInputs[submissionId]);
    if (!Number.isFinite(score) || score < 0) {
      await Swal.fire({ icon: "error", title: "Total required", text: "Enter the total score." });
      return;
    }
    setMarkSavingId(submissionId);
    try {
      const entries = renderManualPdfAnswerRows(submission.pdf_answers_json);
      const questionPromises = entries
        .map((entry) => {
          const marksRaw = pdfEntryMarks[entry.id];
          const marks = marksRaw === "" || marksRaw == null ? null : Number(marksRaw);
          const comment = pdfEntryComments[entry.id] != null ? String(pdfEntryComments[entry.id]) : "";
          const hasMarks = marks != null && Number.isFinite(marks) && marks >= 0;
          const hasComment = comment.trim() !== "";
          if (!hasMarks && !hasComment) return null;
          const body = {};
          if (hasMarks) body.marks_obtained = marks;
          body.marker_comment = comment.trim();
          return fetch(
            `/api/assignments/${assignmentId}/submissions/${submissionId}/pdf-answers/${encodeURIComponent(entry.id)}/mark`,
            { method: "PUT", headers: authHeaders(token), body: JSON.stringify(body) }
          );
        })
        .filter(Boolean);
      const totalRes = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/mark`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({
          total_score: score,
          marker_feedback: markerFeedback[submissionId] || "",
        }),
      });
      const results = await Promise.all([totalRes, ...questionPromises]);
      let savedTotal = score;
      for (const res of results) {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not save.");
        if (data.data?.total_score != null) savedTotal = Number(data.data.total_score);
      }
      setRows((prev) =>
        prev.map((row) =>
          row.id === submissionId
            ? {
                ...row,
                marking: {
                  ...(row.marking || {}),
                  total_score: savedTotal,
                  marker_feedback: markerFeedback[submissionId] || null,
                },
              }
            : row
        )
      );
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message });
    } finally {
      setMarkSavingId("");
    }
  };

  const publishMarks = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !assignmentId) return;
    setPublishingId(submissionId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/publish-marks`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not publish marks.");
      setRows((prev) =>
        prev.map((row) =>
          row.id === submissionId
            ? { ...row, marking: { ...(row.marking || {}), marks_published: true } }
            : row
        )
      );
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Publish failed", text: e.message });
    } finally {
      setPublishingId("");
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
        title="Assignment submissions"
        subtitle={`${title} · Mark student work and publish results`}
        icon={
          <IconButton onClick={() => navigate("/assignments")} sx={{ color: "#fff", p: 0 }}>
            <ArrowBackIcon sx={{ fontSize: 28 }} />
          </IconButton>
        }
      />

      <TabPanelShell loading={loading} error={error} onDismissError={() => setError("")}>
        {rows.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: "16px" }}>No submissions yet.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {rows.map((s, idx) => {
              const isExpanded = !!expandedById[s.id];
              const isPdf = isPdfAssignment;
              const manualPdf = submissionHasManualPdfEntries(s);
              const onlineTotal = (s.answers || []).reduce((sum, a) => sum + Number(answerMarks[a.id] || 0), 0);
              const displayTotal = isPdf ? markInputs[s.id] ?? "" : onlineTotal;
              const hasMarks = isPdf
                ? s?.marking?.total_score != null
                : (s.answers || []).some((a) => a.marks_obtained != null);
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
                <ExamPanelCard key={s.id}>
                  <Stack spacing={1.25}>
                    <Stack direction={{ xs: "column", lg: "row" }} justifyContent="space-between" spacing={1.25} alignItems={{ lg: "center" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
                            {idx + 1 + (pagination.page - 1) * pagination.limit}.{" "}
                            {s.student?.user?.full_name || s.student?.user?.username || "Student"}
                          </Typography>
                          {s.marking?.marks_published ? (
                            <Chip size="small" label="Published" color="success" sx={{ fontWeight: 700 }} />
                          ) : hasMarks ? (
                            <Chip size="small" label="Marked" sx={{ fontWeight: 700, bgcolor: accentLight, color: accentDark }} />
                          ) : (
                            <Chip size="small" label="Awaiting marks" variant="outlined" sx={{ fontWeight: 600 }} />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          Adm: {s.student?.admission_number || "—"} · Submitted:{" "}
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
                          pt: 0.25,
                        }}
                      >
                        <MarkingScoreField
                          label={isPdf ? "Total score" : "Total (auto)"}
                          value={displayTotal}
                          onChange={isPdf ? (e) => setMarkInputs((prev) => ({ ...prev, [s.id]: e.target.value })) : undefined}
                          disabled={!isPdf}
                          width={156}
                        />
                        <ExamPrimaryButton
                          size="small"
                          disabled={markSavingId === s.id}
                          onClick={() => void (isPdf ? savePdfMarking(s.id) : saveQuestionMarks(s.id))}
                          sx={{ ...actionBtnSx, minWidth: 156 }}
                          startIcon={markSavingId === s.id ? <CircularProgress size={16} color="inherit" /> : null}
                        >
                          {markSavingId === s.id ? "Saving…" : hasMarks ? "Update marks" : "Save marks"}
                        </ExamPrimaryButton>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={publishingId === s.id || !hasMarks}
                          onClick={() => void publishMarks(s.id)}
                          sx={{ ...actionBtnSx, borderColor: accent, color: accent, "&:hover": { bgcolor: accentLight } }}
                          startIcon={publishingId === s.id ? <CircularProgress size={16} sx={{ color: accent }} /> : null}
                        >
                          {publishingId === s.id ? "Publishing…" : s.marking?.marks_published ? "Republish" : "Publish"}
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => setExpandedById((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                          sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5, width: 40, height: 40 }}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Stack>
                    </Stack>
                    {!isPdf && questionTotal > 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Max marks: {questionTotal}
                        {s.marking?.total_score != null ? ` · Saved total: ${s.marking.total_score}` : ""}
                      </Typography>
                    ) : null}
                    {isPdf ? (
                      <TextField
                        size="small"
                        label="Overall feedback (optional)"
                        value={markerFeedback[s.id] ?? ""}
                        onChange={(e) => setMarkerFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        fullWidth
                        multiline
                        minRows={1}
                      />
                    ) : null}
                    {isExpanded ? (
                      <Box
                        sx={{
                          borderTop: `1px solid ${primaryLight}`,
                          pt: 1.5,
                          mt: 0.5,
                        }}
                      >
                        {isPdf ? (
                          <AssignmentPdfSubmissionView
                            assignmentId={assignmentId}
                            submission={s}
                            entryMarks={manualPdf ? pdfEntryMarks : undefined}
                            entryComments={manualPdf ? pdfEntryComments : undefined}
                            paperComments={pdfPaperComments}
                            onEntryMarksChange={
                              manualPdf ? (entryId, value) => setPdfEntryMarks((prev) => ({ ...prev, [entryId]: value })) : null
                            }
                            onEntryCommentsChange={
                              manualPdf ? (entryId, value) => setPdfEntryComments((prev) => ({ ...prev, [entryId]: value })) : null
                            }
                            onPaperCommentsChange={(paperId, value) =>
                              setPdfPaperComments((prev) => ({ ...prev, [paperId]: value }))
                            }
                            onPdfAnswersJsonChange={(json) => patchSubmissionPdfAnswers(s.id, json)}
                          />
                        ) : (
                          <AssignmentSubmissionPaperView
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
                        )}
                      </Box>
                    ) : null}
                  </Stack>
                </ExamPanelCard>
              );
            })}
          </Stack>
        )}
        {!loading && rows.length > 0 ? (
          <Box sx={{ mt: 2, borderTop: `1px solid ${primaryLight}`, pt: 1 }}>
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 20, 50]}
              count={pagination.total}
              rowsPerPage={rowsPerPage}
              page={Math.max(0, (pagination.page || 1) - 1)}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </Box>
        ) : null}
      </TabPanelShell>
    </Box>
  );
}
