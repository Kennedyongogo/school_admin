import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Swal from "sweetalert2";
import ExamReportCardListTab from "./ExamReportCardListTab";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function fetchAllCurricula(token) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 50) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula?${params}`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) break;
    out.push(...(data.data || []));
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

async function fetchClasses(token, curriculumId) {
  if (!curriculumId) return [];
  const res = await fetch(`/api/curricula/${curriculumId}/classes?limit=100`, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  return res.ok && data.success ? data.data || [] : [];
}

async function fetchLevels(token, curriculumId, classId) {
  if (!curriculumId || !classId) return [];
  const res = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/levels`, {
    headers: authHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  return res.ok && data.success ? data.data || [] : [];
}

async function fetchStudents(token, classId) {
  if (!classId) return [];
  const params = new URLSearchParams({ curriculum_class_id: classId, limit: "500" });
  const res = await fetch(`/api/students?${params}`, { headers: authHeaders(token) });
  const data = await res.json().catch(() => ({}));
  return res.ok && data.success ? data.data || [] : [];
}

function studentLabel(s) {
  return s?.user?.full_name?.trim() || s?.user?.username || s?.admission_number || "Student";
}

export default function ExamReportCardsTab() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

  const [template, setTemplate] = useState(null);
  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradedExams, setGradedExams] = useState([]);
  const [sectionTab, setSectionTab] = useState(0);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const [curriculumId, setCurriculumId] = useState("");
  const [classId, setClassId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [selectedExamIds, setSelectedExamIds] = useState(() => new Set());

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const [tplRes, cur] = await Promise.all([
          fetch("/api/report-cards/template", { headers: authHeaders(token) }),
          fetchAllCurricula(token),
        ]);
        const tplData = await tplRes.json().catch(() => ({}));
        if (tplRes.ok && tplData.success) setTemplate(tplData.data);
        setCurricula(cur);
      } catch (e) {
        setError(e.message || "Could not load report card builder.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !curriculumId) {
      setClasses([]);
      return;
    }
    void fetchClasses(token, curriculumId).then(setClasses);
  }, [token, curriculumId]);

  useEffect(() => {
    if (!token || !curriculumId || !classId) {
      setLevels([]);
      return;
    }
    void fetchLevels(token, curriculumId, classId).then(setLevels);
  }, [token, curriculumId, classId]);

  useEffect(() => {
    if (!token || !classId) {
      setStudents([]);
      return;
    }
    void fetchStudents(token, classId).then(setStudents);
  }, [token, classId]);

  const loadGradedExams = useCallback(async () => {
    if (!token || !studentId) {
      setGradedExams([]);
      return;
    }
    const params = new URLSearchParams({
      student_id: studentId,
      ...(curriculumId ? { curriculum_id: curriculumId } : {}),
      ...(classId ? { curriculum_class_id: classId } : {}),
    });
    const res = await fetch(`/api/report-cards/graded-exams?${params}`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      setGradedExams([]);
      setError(data.message || "Could not load graded exams.");
      return;
    }
    setGradedExams(data.data || []);
    setSelectedExamIds(new Set());
    setPreview(null);
  }, [token, studentId, curriculumId, classId]);

  useEffect(() => {
    void loadGradedExams();
  }, [loadGradedExams]);

  const examIdsArray = useMemo(() => Array.from(selectedExamIds).map(String), [selectedExamIds]);

  const resetBuilder = useCallback(() => {
    setCurriculumId("");
    setClassId("");
    setLevelId("");
    setStudentId("");
    setTitle("");
    setSelectedExamIds(new Set());
    setPreview(null);
    setGradedExams([]);
    setClasses([]);
    setLevels([]);
    setStudents([]);
    setError("");
  }, []);

  const toggleExam = (id) => {
    const key = String(id);
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPreview(null);
  };

  const runPreview = async () => {
    if (!studentId || !examIdsArray.length) {
      await Swal.fire({ icon: "info", title: "Select exams", text: "Choose a student and at least one graded exam." });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/report-cards/preview", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          student_id: studentId,
          curriculum_id: curriculumId,
          curriculum_class_id: classId,
          exam_ids: examIdsArray,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not preview report card.");
      }
      setPreview(data.data);
    } catch (e) {
      setPreview(null);
      await Swal.fire({ icon: "error", title: "Preview failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveReportCard = async () => {
    if (!preview?.overall_grade) {
      await Swal.fire({
        icon: "warning",
        title: "Preview first",
        text: "Run preview so overall grading is applied before saving.",
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/report-cards", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          student_id: studentId,
          curriculum_id: curriculumId,
          curriculum_class_id: classId,
          curriculum_class_level_id: levelId || null,
          title: title.trim() || null,
          exam_ids: examIdsArray,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save report card.");
      await Swal.fire({
        icon: "success",
        title: "Report card saved",
        text: "Open it anytime from the Generated report cards tab.",
        timer: 2200,
        showConfirmButton: true,
      });
      resetBuilder();
      setListRefreshKey((k) => k + 1);
      setSectionTab(1);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const selectedStudent = students.find((s) => String(s.id) === String(studentId));
  const className = classes.find((c) => String(c.id) === String(classId))?.name || "";
  const levelName = levels.find((l) => String(l.id) === String(levelId))?.name || "";

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: accent }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Tabs
        value={sectionTab}
        onChange={(_, v) => setSectionTab(v)}
        sx={{
          minHeight: 40,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 40, color: accentDark },
          "& .Mui-selected": { color: accent },
          "& .MuiTabs-indicator": { bgcolor: accent, height: 3 },
        }}
      >
        <Tab label="Create report card" />
        <Tab label="Generated report cards" />
      </Tabs>

      {sectionTab === 1 ? (
        <ExamReportCardListTab refreshKey={listRefreshKey} />
      ) : (
        <>
      {error ? (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          width: "100%",
          maxWidth: "100%",
          gap: 2,
          alignItems: "stretch",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ flex: { xs: "1 1 auto", lg: "3 1 0%" }, minWidth: 0, width: { xs: "100%", lg: "auto" } }}>
          <Card elevation={0} sx={{ border: `1px solid ${accentLight}`, borderRadius: 2, height: "100%" }}>
            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <DescriptionOutlinedIcon sx={{ color: accent }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentDark }}>
                  Report template (preview)
                </Typography>
              </Stack>
              <Box
                sx={{
                  border: `2px solid ${accent}`,
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "#fff",
                  flex: 1,
                  minHeight: { xs: 360, lg: 480 },
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <Box sx={{ bgcolor: accentDark, color: "#fff", px: 2, py: 1.5, textAlign: "center" }}>
                  {template?.logo_url ? (
                    <Box
                      component="img"
                      src={template.logo_url}
                      alt=""
                      sx={{ maxHeight: 48, maxWidth: 160, objectFit: "contain", mb: 0.5, mx: "auto" }}
                    />
                  ) : null}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {template?.school_name || "School name"}
                  </Typography>
                  {template?.tagline ? (
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      {template.tagline}
                    </Typography>
                  ) : null}
                </Box>
                <Box sx={{ flex: 1, p: 2 }}>
                  <Typography variant="overline" color="text.secondary">
                    Student report card
                  </Typography>
                  {selectedStudent ? (
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>{studentLabel(selectedStudent)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {className}
                        {levelName ? ` · ${levelName}` : ""}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Select a student to preview the report card here.
                    </Typography>
                  )}
                  {preview?.lines?.length ? (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 1 }} />
                      <Table size="small" sx={{ width: "100%", "& td, & th": { py: 0.75, fontSize: "0.8rem" } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Exam</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              Marks
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview.lines.map((line) => (
                            <TableRow key={line.exam_id || line.exam_title}>
                              <TableCell>{line.exam_title}</TableCell>
                              <TableCell align="right">
                                {line.marks_obtained}
                                {line.total_marks != null ? ` / ${line.total_marks}` : ""}
                              </TableCell>
                              <TableCell>{line.grade || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Total {preview.total_marks_obtained}
                        {preview.total_marks_possible != null ? ` / ${preview.total_marks_possible}` : ""} · Overall{" "}
                        <strong>{preview.overall_grade}</strong>
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: "1 1 auto", lg: "1 1 0%" }, minWidth: 0, width: { xs: "100%", lg: "auto" } }}>
          <Card elevation={0} sx={{ border: `1px solid ${accentLight}`, borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentDark, mb: 2 }}>
                Build report card
              </Typography>
              <Stack spacing={1.5}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Curriculum</InputLabel>
                    <Select
                      label="Curriculum"
                      value={curriculumId}
                      onChange={(e) => {
                        setCurriculumId(e.target.value);
                        setClassId("");
                        setLevelId("");
                        setStudentId("");
                      }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {curricula.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Class</InputLabel>
                    <Select
                      label="Class"
                      value={classId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        setLevelId("");
                        setStudentId("");
                      }}
                    >
                      <MenuItem value="">Select</MenuItem>
                      {classes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Level (optional)</InputLabel>
                    <Select label="Level (optional)" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
                      <MenuItem value="">—</MenuItem>
                      {levels.map((l) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Student</InputLabel>
                    <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                      <MenuItem value="">Select</MenuItem>
                      {students.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          {studentLabel(s)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                <TextField
                  size="small"
                  label="Report title (optional)"
                  placeholder="e.g. Term 2 · May 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                />

                {studentId ? (
                  <>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
                      Graded exams
                    </Typography>
                    {!gradedExams.length ? (
                      <Alert severity="info">No graded exams for this student in this class yet.</Alert>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Exam</TableCell>
                            <TableCell align="right">Marks</TableCell>
                            <TableCell>Grade</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {gradedExams.map((ex) => {
                            const examKey = String(ex.exam_id);
                            return (
                            <TableRow key={examKey} hover>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedExamIds.has(examKey)}
                                  onChange={() => toggleExam(examKey)}
                                  sx={{ color: accent, "&.Mui-checked": { color: accent } }}
                                />
                              </TableCell>
                              <TableCell>{ex.exam_title}</TableCell>
                              <TableCell align="right">
                                {ex.marks_obtained}
                                {ex.total_marks != null ? ` / ${ex.total_marks}` : ""}
                              </TableCell>
                              <TableCell>{ex.grade || "—"}</TableCell>
                            </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}

                    {preview?.overall_grade ? (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        Overall grade: <strong>{preview.overall_grade}</strong>
                        {preview.total_marks_obtained != null
                          ? ` · ${preview.total_marks_obtained}${
                              preview.total_marks_possible != null ? ` / ${preview.total_marks_possible}` : ""
                            } marks`
                          : ""}
                        . Full preview is shown in the template panel.
                      </Alert>
                    ) : null}

                    <Stack spacing={1} sx={{ pt: 0.5 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<VisibilityOutlinedIcon />}
                        disabled={busy || !examIdsArray.length}
                        onClick={() => void runPreview()}
                        sx={{ borderColor: accent, color: accentDark }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<SaveOutlinedIcon />}
                        disabled={busy || !preview}
                        onClick={() => void saveReportCard()}
                        sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
                      >
                        Save PDF
                      </Button>
                    </Stack>
                  </>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
        </>
      )}
    </Stack>
  );
}
