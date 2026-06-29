import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FactCheck as FactCheckIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  Publish as PublishIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  ExamSectionHeader,
  ExamPrimaryButton,
  ExamGhostButton,
  ExamActionIcon,
  EmptyTableRow,
} from "../Exams/examUi";
import AssignmentStudentPreviewDialog from "./AssignmentStudentPreviewDialog";
import { formatChoicesForInput, parseAssignmentChoices, parseChoicesInput } from "./assignmentQuestionUtils";
import { authJsonHeaders, primaryRed, primaryDark } from "../Exams/examShared";

const authHeaders = authJsonHeaders;
const accentDark = primaryDark;

const QUESTION_TYPES = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "essay", label: "Essay" },
  { value: "multiple_choice", label: "Single choice" },
  { value: "multi_select", label: "Multi choice" },
  { value: "file_upload", label: "File upload" },
];

function defaultQuestionOptions(questionType) {
  if (questionType === "file_upload") {
    return {
      accept: ["image/*", "application/pdf"],
      max_files: 1,
      max_size_mb: 10,
      upload_hint: "",
    };
  }
  return { choices: [] };
}

function buildQuestionOptionsForSave(q) {
  if (q.question_type === "multiple_choice" || q.question_type === "multi_select") {
    return { choices: Array.isArray(q.options?.choices) ? q.options.choices : [] };
  }
  if (q.question_type === "file_upload") {
    const o = q.options && typeof q.options === "object" ? q.options : {};
    return {
      accept: Array.isArray(o.accept) ? o.accept : ["image/*", "application/pdf"],
      max_files: Math.min(5, Math.max(1, Number(o.max_files) || 1)),
      max_size_mb: Math.min(25, Math.max(1, Number(o.max_size_mb) || 10)),
      upload_hint: String(o.upload_hint || "").trim(),
    };
  }
  return null;
}

function newQuestionKey() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function AssignmentsTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [previewRow, setPreviewRow] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);

  const [curriculums, setCurriculums] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignmentType, setAssignmentType] = useState("questions");
  const [curriculumId, setCurriculumId] = useState("");
  const [curriculumClassId, setCurriculumClassId] = useState("");
  const [curriculumClassLevelId, setCurriculumClassLevelId] = useState("");
  const [curriculumSubjectId, setCurriculumSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);
  const [questions, setQuestions] = useState([
    { key: newQuestionKey(), question_text: "", question_type: "short_text", marks: 5, required: false, options: { choices: [] } },
  ]);

  const loadReferenceData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [currRes, classRes, subjRes, levelRes] = await Promise.all([
        fetch("/api/curricula", { headers: authHeaders(token) }),
        fetch("/api/curricula/all-classes", { headers: authHeaders(token) }),
        fetch("/api/curricula/all-subjects", { headers: authHeaders(token) }),
        fetch("/api/curricula/all-class-levels", { headers: authHeaders(token) }),
      ]);
      const currJson = await currRes.json().catch(() => ({}));
      const classJson = await classRes.json().catch(() => ({}));
      const subjJson = await subjRes.json().catch(() => ({}));
      const levelJson = await levelRes.json().catch(() => ({}));
      setCurriculums(Array.isArray(currJson.data) ? currJson.data : []);
      setClasses(Array.isArray(classJson.data) ? classJson.data : []);
      setSubjects(Array.isArray(subjJson.data) ? subjJson.data : []);
      setLevels(Array.isArray(levelJson.data) ? levelJson.data : []);
    } catch {
      // Form dropdowns are optional for the list view; assignment fetch surfaces errors.
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments?page=${page + 1}&limit=${rowsPerPage}`, { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load assignments.");
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalCount(Number(json.pagination?.total) || 0);
    } catch (e) {
      setError(e.message || "Could not load assignments.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const onCreate = () => {
      resetForm();
      setMode("create");
    };
    window.addEventListener("assignments:create", onCreate);
    return () => window.removeEventListener("assignments:create", onCreate);
  }, []);

  useEffect(() => {
    if (!curriculumClassId || !curriculumClassLevelId) {
      setClassStudents([]);
      return undefined;
    }
    let cancelled = false;
    const run = async () => {
      setClassStudentsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          curriculum_class_id: curriculumClassId,
          curriculum_class_level_id: curriculumClassLevelId,
          limit: "500",
        });
        const res = await fetch(`/api/students?${params}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const list = res.ok && data.success && Array.isArray(data.data) ? data.data : [];
        setClassStudents(list);
        setAssignedStudentIds((prev) => prev.filter((id) => list.some((s) => String(s.id) === String(id))));
      } catch {
        if (!cancelled) setClassStudents([]);
      } finally {
        if (!cancelled) setClassStudentsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [curriculumClassId, curriculumClassLevelId]);

  const resetForm = () => {
    setEditingId("");
    setTitle("");
    setDescription("");
    setInstructions("");
    setAssignmentType("questions");
    setCurriculumId("");
    setCurriculumClassId("");
    setCurriculumClassLevelId("");
    setCurriculumSubjectId("");
    setDueDate("");
    setAssignedStudentIds([]);
    setQuestions([
      { key: newQuestionKey(), question_text: "", question_type: "short_text", marks: 5, required: false, options: { choices: [] } },
    ]);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
  };

  const openStudentPreview = async (row) => {
    if (!row?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/assignments/${row.id}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load assignment.");
      setPreviewRow(data.data);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Preview unavailable",
        text: e.message || "Could not load assignment.",
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const openEdit = async (row) => {
    const token = localStorage.getItem("token");
    let detail = row;
    try {
      const res = await fetch(`/api/assignments/${row.id}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) detail = data.data;
    } catch {
      /* use list row */
    }
    setEditingId(detail.id);
    setTitle(detail.title || "");
    setDescription(detail.description || "");
    setInstructions(detail.instructions || "");
    setAssignmentType(detail.assignment_type || "questions");
    setCurriculumId(detail.curriculum_id || "");
    setCurriculumClassId(detail.curriculum_class_id || "");
    setCurriculumClassLevelId(detail.curriculum_class_level_id || "");
    setCurriculumSubjectId(detail.curriculum_subject_id || "");
    setDueDate(detail.due_date ? String(detail.due_date).slice(0, 16) : "");
    setAssignedStudentIds(Array.isArray(detail.assigned_student_ids) ? detail.assigned_student_ids.map(String) : []);
    setQuestions(
      Array.isArray(detail.questions) && detail.questions.length
        ? detail.questions.map((q) => ({
            key: q.id || newQuestionKey(),
            question_text: q.question_text || "",
            question_type: q.question_type || "short_text",
            marks: Number(q.marks || 0),
            required: Boolean(q.required),
            options:
              q.question_type === "file_upload"
                ? { ...defaultQuestionOptions("file_upload"), ...(q.options || {}) }
                : ["multiple_choice", "multi_select"].includes(q.question_type)
                  ? { choices: parseAssignmentChoices(q) }
                  : q.options || { choices: [] },
          }))
        : [{ key: newQuestionKey(), question_text: "", question_type: "short_text", marks: 5, required: false, options: { choices: [] } }]
    );
    setMode("edit");
  };

  const filteredClasses = useMemo(
    () => classes.filter((c) => !curriculumId || String(c.curriculum_id) === String(curriculumId)),
    [classes, curriculumId]
  );
  const filteredLevels = useMemo(
    () => levels.filter((l) => !curriculumClassId || String(l.curriculum_class_id) === String(curriculumClassId)),
    [levels, curriculumClassId]
  );
  const filteredSubjects = useMemo(
    () => subjects.filter((s) => !curriculumId || String(s.curriculum_id) === String(curriculumId)),
    [subjects, curriculumId]
  );

  const saveAssignment = async (publishAfterSave = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!title.trim()) {
      await Swal.fire({ icon: "error", title: "Title required", text: "Enter an assignment title." });
      return;
    }
    if (!curriculumClassId || !curriculumClassLevelId) {
      await Swal.fire({ icon: "error", title: "Class required", text: "Select class and term." });
      return;
    }
    if (!assignedStudentIds.length) {
      await Swal.fire({ icon: "error", title: "Students required", text: "Assign at least one student." });
      return;
    }

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      instructions: instructions.trim() || null,
      assignment_type: assignmentType,
      curriculum_id: curriculumId || null,
      curriculum_class_id: curriculumClassId,
      curriculum_class_level_id: curriculumClassLevelId,
      curriculum_subject_id: curriculumSubjectId || null,
      assigned_student_ids: assignedStudentIds,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status: publishAfterSave ? "published" : "draft",
      questions:
        assignmentType === "questions"
          ? questions
              .filter((q) => String(q.question_text || "").trim())
              .map((q, i) => ({
                question_text: q.question_text.trim(),
                question_type: q.question_type,
                marks: Number(q.marks || 0),
                required: Boolean(q.required),
                order_number: i + 1,
                options: buildQuestionOptionsForSave(q),
              }))
          : [],
    };

    if (assignmentType === "questions" && !body.questions.length) {
      await Swal.fire({ icon: "error", title: "Questions required", text: "Add at least one question for an online assignment." });
      return;
    }

    if (assignmentType === "questions") {
      for (const q of body.questions) {
        if (["multiple_choice", "multi_select"].includes(q.question_type)) {
          const choiceCount = Array.isArray(q.options?.choices) ? q.options.choices.length : 0;
          if (choiceCount < 2) {
            await Swal.fire({
              icon: "error",
              title: "Options required",
              text: `Add at least two options for "${q.question_text}" (${q.question_type === "multiple_choice" ? "Single choice" : "Multi choice"}).`,
            });
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const url = mode === "edit" && editingId ? `/api/assignments/${editingId}` : "/api/assignments";
      const method = mode === "edit" && editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save assignment.");
      if (publishAfterSave && data.data?.id && data.data?.status !== "published") {
        await fetch(`/api/assignments/${data.data.id}/publish`, { method: "POST", headers: authHeaders(token) });
      }
      await Swal.fire({ icon: "success", title: publishAfterSave ? "Published" : "Saved", timer: 900, showConfirmButton: false });
      setMode("list");
      resetForm();
      await loadAssignments();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message || "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const publishRow = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`/api/assignments/${row.id}/publish`, { method: "POST", headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      await Swal.fire({ icon: "error", title: "Publish failed", text: data.message || "Could not publish." });
      return;
    }
    await loadAssignments();
  };

  const deleteRow = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete assignment?",
      text: row.title,
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirm.isConfirmed) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/assignments/${row.id}`, { method: "DELETE", headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: data.message || "Could not delete." });
      return;
    }
    await loadAssignments();
  };

  if (mode === "create" || mode === "edit") {
    return (
      <TabPanelShell loading={false} error={error} onDismissError={() => setError("")}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => { setMode("list"); resetForm(); }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
              {mode === "edit" ? "Edit assignment" : "New assignment"}
            </Typography>
          </Stack>

          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />
          <TextField label="Instructions for students" value={instructions} onChange={(e) => setInstructions(e.target.value)} fullWidth multiline minRows={2} />

          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
              <MenuItem value="questions">Online (questions)</MenuItem>
              <MenuItem value="pdf_form">PDF-style (typed answers + file uploads)</MenuItem>
            </Select>
          </FormControl>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Curriculum</InputLabel>
              <Select label="Curriculum" value={curriculumId} onChange={(e) => setCurriculumId(e.target.value)}>
                <MenuItem value="">—</MenuItem>
                {curriculums.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                label="Class"
                value={curriculumClassId}
                onChange={(e) => {
                  setCurriculumClassId(e.target.value);
                  setCurriculumClassLevelId("");
                }}
              >
                <MenuItem value="">—</MenuItem>
                {filteredClasses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Term</InputLabel>
              <Select
                label="Term"
                value={curriculumClassLevelId}
                onChange={(e) => setCurriculumClassLevelId(e.target.value)}
                disabled={!curriculumClassId}
              >
                <MenuItem value="">—</MenuItem>
                {filteredLevels.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Subject (optional)</InputLabel>
              <Select label="Subject (optional)" value={curriculumSubjectId} onChange={(e) => setCurriculumSubjectId(e.target.value)}>
                <MenuItem value="">—</MenuItem>
                {filteredSubjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Due date (optional)"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Assigned students</InputLabel>
            <Select
              multiple
              label="Assigned students"
              value={assignedStudentIds}
              onChange={(e) => setAssignedStudentIds(e.target.value)}
              renderValue={(selected) => `${selected.length} student(s)`}
              disabled={classStudentsLoading}
            >
              {classStudents.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  <Checkbox checked={assignedStudentIds.includes(s.id)} />
                  <ListItemText
                    primary={s.user?.full_name || s.user?.username || s.admission_number}
                    secondary={s.admission_number}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {assignmentType === "questions" ? (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>Questions</Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setQuestions((prev) => [
                      ...prev,
                      { key: newQuestionKey(), question_text: "", question_type: "short_text", marks: 5, required: false, options: { choices: [] } },
                    ])
                  }
                >
                  Add question
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {questions.map((q, idx) => (
                  <Box key={q.key} sx={{ border: "1px solid #eee", borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Question {idx + 1}</Typography>
                      <IconButton size="small" onClick={() => setQuestions((prev) => prev.filter((x) => x.key !== q.key))} disabled={questions.length <= 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Stack spacing={1}>
                      <TextField
                        label="Question text"
                        value={q.question_text}
                        onChange={(e) => setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, question_text: e.target.value } : x)))}
                        fullWidth
                        multiline
                        minRows={2}
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            label="Type"
                            value={q.question_type}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((x) =>
                                  x.key === q.key
                                    ? { ...x, question_type: e.target.value, options: defaultQuestionOptions(e.target.value) }
                                    : x
                                )
                              )
                            }
                          >
                            {QUESTION_TYPES.map((t) => (
                              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Marks"
                          type="number"
                          size="small"
                          value={q.marks}
                          onChange={(e) => setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, marks: e.target.value } : x)))}
                          sx={{ minWidth: 120 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={q.required ? "yes" : "no"}
                            onChange={(e) => setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, required: e.target.value === "yes" } : x)))}
                          >
                            <MenuItem value="no">Optional</MenuItem>
                            <MenuItem value="yes">Required</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                      {["multiple_choice", "multi_select"].includes(q.question_type) ? (
                        <TextField
                          label="Options (one per line or comma-separated)"
                          multiline
                          minRows={3}
                          placeholder={"ruto\nraila\nkenyatta\nmudavadi"}
                          value={formatChoicesForInput(q.options?.choices)}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((x) =>
                                x.key === q.key
                                  ? { ...x, options: { choices: parseChoicesInput(e.target.value) } }
                                  : x
                              )
                            )
                          }
                          fullWidth
                          helperText="Single choice: student picks one. Multi choice: student can pick several."
                        />
                      ) : null}
                      {q.question_type === "file_upload" ? (
                        <Stack spacing={1}>
                          <TextField
                            label="Upload instructions (shown to students)"
                            multiline
                            minRows={2}
                            value={q.options?.upload_hint || ""}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((x) =>
                                  x.key === q.key
                                    ? { ...x, options: { ...defaultQuestionOptions("file_upload"), ...x.options, upload_hint: e.target.value } }
                                    : x
                                )
                              )
                            }
                            fullWidth
                          />
                          <TextField
                            label="Max files"
                            type="number"
                            size="small"
                            inputProps={{ min: 1, max: 5 }}
                            value={q.options?.max_files ?? 1}
                            onChange={(e) =>
                              setQuestions((prev) =>
                                prev.map((x) =>
                                  x.key === q.key
                                    ? {
                                        ...x,
                                        options: {
                                          ...defaultQuestionOptions("file_upload"),
                                          ...x.options,
                                          max_files: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                            sx={{ maxWidth: 160 }}
                          />
                        </Stack>
                      ) : null}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              PDF-style assignments let students type answers per question and upload working papers (images/PDF). No template upload is required.
            </Alert>
          )}

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <ExamGhostButton onClick={() => { setMode("list"); resetForm(); }}>Cancel</ExamGhostButton>
            <ExamPrimaryButton onClick={() => void saveAssignment(false)} disabled={saving}>
              {saving ? "Saving…" : "Save draft"}
            </ExamPrimaryButton>
            <ExamPrimaryButton onClick={() => void saveAssignment(true)} disabled={saving}>
              {saving ? "Publishing…" : "Save & publish"}
            </ExamPrimaryButton>
          </Stack>
        </Stack>
      </TabPanelShell>
    );
  }

  return (
    <TabPanelShell loading={loading} error={error} onDismissError={() => setError("")}>
      <ExamSectionHeader title="Your assignments" />
      <DataTableShell
        pagination={
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Rows per page"
            sx={tablePaginationSx}
          />
        }
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={tableHeadRowSx}>
              <TableCell width={56} align="center">
                No
              </TableCell>
              <TableCell>Assignment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right" width={200}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ border: 0, p: 0 }}>
                  <EmptyTableRow message="No assignments yet. Create one for your class." />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => (
                <TableRow key={r.id} hover>
                  <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{r.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {r.curriculum_class?.name || "—"}
                      {" · "}
                      {r.assignment_type === "pdf_form" ? "PDF-style" : "Online"}
                      {r.teacher?.user?.full_name ? ` · ${r.teacher.user.full_name}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <Chip
                        size="small"
                        color={r.status === "published" ? "success" : "default"}
                        label={r.status || "draft"}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Due: {r.due_date ? new Date(r.due_date).toLocaleString() : "—"}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {r.status !== "published" ? (
                        <IconButton size="small" title="Publish" onClick={() => void publishRow(r)}>
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                      <ExamActionIcon
                        title="Student preview"
                        disabled={previewLoading}
                        onClick={() => void openStudentPreview(r)}
                      >
                        <PlayCircleOutlineIcon fontSize="small" />
                      </ExamActionIcon>
                      <IconButton
                        size="small"
                        title="Submissions"
                        onClick={() => navigate(`/assignments/${r.id}/submissions`, { state: { assignmentTitle: r.title } })}
                      >
                        <FactCheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Edit" onClick={() => void openEdit(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Delete" onClick={() => void deleteRow(r)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableShell>

      <AssignmentStudentPreviewDialog
        open={Boolean(previewRow)}
        assignment={previewRow}
        onClose={() => setPreviewRow(null)}
      />
    </TabPanelShell>
  );
}
