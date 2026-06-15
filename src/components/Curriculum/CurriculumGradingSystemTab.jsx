import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, Edit as EditIcon, Rule as RuleIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { authJsonHeaders, fetchAllCurricula, primaryRed, primaryDark, primaryLight, inputSx, actionIconSx } from "./curriculumShared";
import { PremiumDialog, TabPanelShell, DialogPrimaryButton, DialogGhostButton } from "./curriculumUi";

async function fetchClassesForCurriculum(token, curriculumId) {
  if (!curriculumId) return [];
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula/${curriculumId}/classes?${params}`, {
      headers: authJsonHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `Could not load classes (${res.status})`);
    const chunk = Array.isArray(data.data) ? data.data : [];
    out.push(...chunk);
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

async function fetchSubjectsForCurriculum(token, curriculumId, classId = null) {
  if (!curriculumId) return [];
  const params = new URLSearchParams();
  if (classId) params.set("curriculum_class_id", classId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/curricula/${curriculumId}/subjects${query}`, {
    headers: authJsonHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || `Could not load subjects (${res.status})`);
  return Array.isArray(data.data) ? data.data : [];
}

const defaultSubjectForm = () => ({
  id: "",
  curriculum_id: "",
  curriculum_class_id: "",
  curriculum_subject_id: "",
  min_mark: "0",
  max_mark: "100",
  grade: "",
  remarks: "",
  points: "",
  is_pass: "",
  sort_order: "0",
  is_active: true,
});

const defaultOverallForm = () => ({
  id: "",
  curriculum_id: "",
  curriculum_class_id: "",
  range_from: "0",
  range_to: "50",
  overall_grade: "",
  remarks: "",
  is_pass: "",
  sort_order: "0",
  is_active: true,
});

const CurriculumGradingSystemTab = forwardRef(function CurriculumGradingSystemTab({ curriculumId, onCurriculumChange }, ref) {
  const [subTab, setSubTab] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterCurriculumId, setFilterCurriculumId] = useState(curriculumId || "");
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [dialogClassOptions, setDialogClassOptions] = useState([]);
  const [dialogSubjectOptions, setDialogSubjectOptions] = useState([]);
  const [subjectRows, setSubjectRows] = useState([]);
  const [overallRows, setOverallRows] = useState([]);

  const [subjectOpen, setSubjectOpen] = useState(false);
  const [subjectSaving, setSubjectSaving] = useState(false);
  const [subjectForm, setSubjectForm] = useState(defaultSubjectForm());

  const [overallOpen, setOverallOpen] = useState(false);
  const [overallSaving, setOverallSaving] = useState(false);
  const [overallForm, setOverallForm] = useState(defaultOverallForm());

  useEffect(() => {
    setFilterCurriculumId(curriculumId || "");
  }, [curriculumId]);

  const loadMeta = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const curricula = await fetchAllCurricula(token);
      setCurriculumOptions(curricula);
    } catch (e) {
      setError(e.message || "Failed loading grading metadata.");
    }
  }, []);

  const loadScoped = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !filterCurriculumId) {
      setClassOptions([]);
      setSubjectOptions([]);
      return;
    }
    try {
      const [classes, subjects] = await Promise.all([
        fetchClassesForCurriculum(token, filterCurriculumId),
        fetchSubjectsForCurriculum(token, filterCurriculumId),
      ]);
      setClassOptions(classes);
      setSubjectOptions(subjects);
    } catch (e) {
      setError(e.message || "Failed loading class/subject options.");
    }
  }, [filterCurriculumId]);

  const loadRows = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (filterCurriculumId) q.set("curriculum_id", filterCurriculumId);
      const [subjectRes, overallRes] = await Promise.all([
        fetch(`/api/grading/subject-scales?${q}`, { headers: authJsonHeaders(token) }),
        fetch(`/api/grading/overall-scales?${q}`, { headers: authJsonHeaders(token) }),
      ]);
      const subjectData = await subjectRes.json().catch(() => ({}));
      const overallData = await overallRes.json().catch(() => ({}));
      if (!subjectRes.ok || !subjectData.success) throw new Error(subjectData.message || "Could not load subject scales.");
      if (!overallRes.ok || !overallData.success) throw new Error(overallData.message || "Could not load overall scales.");
      setSubjectRows(Array.isArray(subjectData.data) ? subjectData.data : []);
      setOverallRows(Array.isArray(overallData.data) ? overallData.data : []);
    } catch (e) {
      setError(e.message || "Failed loading grading scales.");
    } finally {
      setLoading(false);
    }
  }, [filterCurriculumId]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void loadScoped();
    void loadRows();
  }, [loadScoped, loadRows]);

  useEffect(() => {
    const loadDialogOptions = async () => {
      const token = localStorage.getItem("token");
      if (!token || !subjectForm.curriculum_id) {
        setDialogClassOptions([]);
        setDialogSubjectOptions([]);
        return;
      }
      try {
        const [classes, subjects] = await Promise.all([
          fetchClassesForCurriculum(token, subjectForm.curriculum_id),
          fetchSubjectsForCurriculum(token, subjectForm.curriculum_id, subjectForm.curriculum_class_id || null),
        ]);
        setDialogClassOptions(classes);
        setDialogSubjectOptions(subjects);
      } catch (e) {
        console.error("Failed to load dialog options:", e);
      }
    };
    void loadDialogOptions();
  }, [subjectForm.curriculum_id, subjectForm.curriculum_class_id]);

  useEffect(() => {
    const loadOverallDialogOptions = async () => {
      const token = localStorage.getItem("token");
      if (!token || !overallForm.curriculum_id) {
        setDialogClassOptions([]);
        return;
      }
      try {
        const classes = await fetchClassesForCurriculum(token, overallForm.curriculum_id);
        setDialogClassOptions(classes);
      } catch (e) {
        console.error("Failed to load overall dialog options:", e);
      }
    };
    void loadOverallDialogOptions();
  }, [overallForm.curriculum_id]);

  useImperativeHandle(ref, () => ({
    openCreateDialog: () => {
      if (subTab === 0) {
        setSubjectForm({ ...defaultSubjectForm(), curriculum_id: filterCurriculumId || "" });
        setSubjectOpen(true);
      } else {
        setOverallForm({ ...defaultOverallForm(), curriculum_id: filterCurriculumId || "" });
        setOverallOpen(true);
      }
    },
  }));

  const saveSubjectScale = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSubjectSaving(true);
    try {
      const isEdit = Boolean(subjectForm.id);
      const payload = {
        curriculum_id: subjectForm.curriculum_id,
        curriculum_class_id: subjectForm.curriculum_class_id,
        curriculum_subject_id: subjectForm.curriculum_subject_id,
        min_mark: Number(subjectForm.min_mark),
        max_mark: Number(subjectForm.max_mark),
        grade: subjectForm.grade.trim(),
        remarks: subjectForm.remarks.trim() || null,
        points: subjectForm.points === "" ? null : Number(subjectForm.points),
        is_pass: subjectForm.is_pass === "" ? null : subjectForm.is_pass === "true",
        sort_order: Number(subjectForm.sort_order || 0),
        is_active: Boolean(subjectForm.is_active),
      };
      const res = await fetch(
        isEdit ? `/api/grading/subject-scales/${subjectForm.id}` : "/api/grading/subject-scales",
        {
          method: isEdit ? "PUT" : "POST",
          headers: authJsonHeaders(token),
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save subject grading scale.");
      setSubjectOpen(false);
      setSubjectForm(defaultSubjectForm());
      await loadRows();
      await Swal.fire({
        icon: "success",
        title: isEdit ? "Subject grading updated" : "Subject grading created",
        text: isEdit ? "Changes saved successfully." : "The subject grading scale was added.",
        confirmButtonColor: primaryRed,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message || "Could not save subject scale." });
    } finally {
      setSubjectSaving(false);
    }
  };

  const saveOverallScale = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setOverallSaving(true);
    try {
      const isEdit = Boolean(overallForm.id);
      const minScore = Number(overallForm.range_from);
      const maxScore = Number(overallForm.range_to);
      if (!overallForm.curriculum_id || !overallForm.curriculum_class_id) {
        throw new Error("Curriculum and class are required.");
      }
      if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
        throw new Error("Range from and range to must be valid numbers.");
      }
      if (minScore > maxScore) {
        throw new Error("Range from cannot be greater than range to.");
      }
      if (!overallForm.overall_grade?.trim()) {
        throw new Error("Overall grade is required.");
      }
      const payload = {
        curriculum_id: overallForm.curriculum_id,
        curriculum_class_id: overallForm.curriculum_class_id,
        min_score: minScore,
        max_score: maxScore,
        overall_grade: overallForm.overall_grade.trim(),
        remarks: overallForm.remarks.trim() || null,
        is_pass: overallForm.is_pass === "" ? null : overallForm.is_pass === "true",
        sort_order: Number(overallForm.sort_order || 0),
        is_active: Boolean(overallForm.is_active),
      };
      const res = await fetch(
        isEdit ? `/api/grading/overall-scales/${overallForm.id}` : "/api/grading/overall-scales",
        {
          method: isEdit ? "PUT" : "POST",
          headers: authJsonHeaders(token),
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save overall grading scale.");
      setOverallOpen(false);
      setOverallForm(defaultOverallForm());
      await loadRows();
      await Swal.fire({
        icon: "success",
        title: isEdit ? "Overall grading updated" : "Overall grading created",
        text: isEdit ? "Changes saved successfully." : "The overall grading scale was added.",
        confirmButtonColor: primaryRed,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message || "Could not save overall scale." });
    } finally {
      setOverallSaving(false);
    }
  };

  const removeScale = async (kind, id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete grading band?",
      showCancelButton: true,
      confirmButtonColor: primaryDark,
    });
    if (!confirmation.isConfirmed) return;
    const url = kind === "subject" ? `/api/grading/subject-scales/${id}` : `/api/grading/overall-scales/${id}`;
    const res = await fetch(url, { method: "DELETE", headers: authJsonHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: data.message || "Could not delete row." });
      return;
    }
    await loadRows();
    await Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "Grading scale removed.",
      confirmButtonColor: primaryRed,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const renderSubjectCards = () => (
    <Stack spacing={1}>
      {!subjectRows.length ? <Alert severity="info">No subject grading scales yet.</Alert> : null}
      {subjectRows.map((row) => (
        <Card key={row.id} variant="outlined" sx={{ borderColor: primaryLight }}>
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {row.curriculum_subject?.name || "Subject"}: {row.grade} ({row.min_mark} - {row.max_mark}
                  {row.points != null ? ` · ${row.points} pts` : ""})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.curriculum?.name || "Curriculum"} | {row.curriculum_class?.name || "Class"} | Active: {row.is_active ? "Yes" : "No"}
                </Typography>
                {row.remarks && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    Remarks: {row.remarks}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    aria-label="Edit subject grading scale"
                    onClick={() => {
                      setSubjectForm({
                        id: row.id,
                        curriculum_id: row.curriculum_id || "",
                        curriculum_class_id: row.curriculum_class_id || "",
                        curriculum_subject_id: row.curriculum_subject_id || "",
                        min_mark: String(row.min_mark ?? 0),
                        max_mark: String(row.max_mark ?? 100),
                        grade: row.grade || "",
                        remarks: row.remarks || "",
                        points: row.points == null ? "" : String(row.points),
                        is_pass: row.is_pass == null ? "" : String(Boolean(row.is_pass)),
                        sort_order: String(row.sort_order ?? 0),
                        is_active: row.is_active !== false,
                      });
                      setSubjectOpen(true);
                    }}
                    sx={actionIconSx}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label="Delete subject grading scale"
                    onClick={() => void removeScale("subject", row.id)}
                    sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  const renderOverallCards = () => (
    <Stack spacing={1}>
      {!overallRows.length ? <Alert severity="info">No overall grading scales yet.</Alert> : null}
      {overallRows.map((row) => (
        <Card key={row.id} variant="outlined" sx={{ borderColor: primaryLight }}>
          <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {row.overall_grade}: total marks {row.min_score} – {row.max_score}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {row.curriculum?.name || "Curriculum"} | {row.curriculum_class?.name || "Class"} | Active: {row.is_active ? "Yes" : "No"}
                </Typography>
                {row.remarks && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    Remarks: {row.remarks}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    aria-label="Edit overall grading scale"
                    onClick={() => {
                      setOverallForm({
                        id: row.id,
                        curriculum_id: row.curriculum_id || "",
                        curriculum_class_id: row.curriculum_class_id || "",
                        range_from: String(row.min_score ?? 0),
                        range_to: String(row.max_score ?? 0),
                        overall_grade: row.overall_grade || "",
                        remarks: row.remarks || "",
                        is_pass: row.is_pass == null ? "" : String(Boolean(row.is_pass)),
                        sort_order: String(row.sort_order ?? 0),
                        is_active: row.is_active !== false,
                      });
                      setOverallOpen(true);
                    }}
                    sx={actionIconSx}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    aria-label="Delete overall grading scale"
                    onClick={() => void removeScale("overall", row.id)}
                    sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );

  return (
    <Stack spacing={1.5}>
      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${primaryLight}` }}>
        <CardContent sx={{ p: 1.5 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
            <FormControl size="small" sx={{ minWidth: 260, ...inputSx }}>
              <InputLabel>Curriculum</InputLabel>
              <Select
                label="Curriculum"
                value={filterCurriculumId}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterCurriculumId(val);
                  onCurriculumChange?.(val);
                }}
              >
                <MenuItem value="">All</MenuItem>
                {curriculumOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => void loadRows()}>
              Refresh
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          "& .MuiTab-root": { textTransform: "none", fontWeight: 700, color: primaryDark, minHeight: 40 },
          "& .MuiTab-root.Mui-selected": { color: primaryRed },
          "& .MuiTabs-indicator": { bgcolor: primaryRed, height: 3 },
        }}
      >
        <Tab label="Subject grading scales" />
        <Tab label="Overall grading scales" />
      </Tabs>

      <TabPanelShell loading={loading} error={error || null} onDismissError={() => setError("")}>
        {!loading && (subTab === 0 ? renderSubjectCards() : renderOverallCards())}
      </TabPanelShell>

      <PremiumDialog
        open={subjectOpen}
        onClose={() => !subjectSaving && setSubjectOpen(false)}
        title={subjectForm.id ? "Edit subject grading scale" : "Create subject grading scale"}
        subtitle="Define mark ranges and grades for a subject"
        icon={<RuleIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => !subjectSaving && setSubjectOpen(false)} disabled={subjectSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={subjectSaving} onClick={() => void saveSubjectScale()}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={1.25}>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Curriculum</InputLabel>
            <Select label="Curriculum" value={subjectForm.curriculum_id} onChange={(e) => setSubjectForm((f) => ({ ...f, curriculum_id: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {curriculumOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Class</InputLabel>
            <Select label="Class" value={subjectForm.curriculum_class_id} onChange={(e) => setSubjectForm((f) => ({ ...f, curriculum_class_id: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {dialogClassOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Subject</InputLabel>
            <Select label="Subject" value={subjectForm.curriculum_subject_id} onChange={(e) => setSubjectForm((f) => ({ ...f, curriculum_subject_id: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {dialogSubjectOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField label="Min mark" type="number" size="small" fullWidth value={subjectForm.min_mark} onChange={(e) => setSubjectForm((f) => ({ ...f, min_mark: e.target.value }))} sx={inputSx} />
            <TextField label="Max mark" type="number" size="small" fullWidth value={subjectForm.max_mark} onChange={(e) => setSubjectForm((f) => ({ ...f, max_mark: e.target.value }))} sx={inputSx} />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField label="Grade" size="small" fullWidth value={subjectForm.grade} onChange={(e) => setSubjectForm((f) => ({ ...f, grade: e.target.value }))} sx={inputSx} />
            <TextField label="Points (optional)" type="number" size="small" fullWidth value={subjectForm.points} onChange={(e) => setSubjectForm((f) => ({ ...f, points: e.target.value }))} sx={inputSx} />
          </Stack>
          <TextField label="Remarks" size="small" fullWidth multiline minRows={2} value={subjectForm.remarks} onChange={(e) => setSubjectForm((f) => ({ ...f, remarks: e.target.value }))} sx={inputSx} />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={overallOpen}
        onClose={() => !overallSaving && setOverallOpen(false)}
        title={overallForm.id ? "Edit overall grading scale" : "Create overall grading scale"}
        subtitle="Define total mark ranges and overall grades"
        icon={<RuleIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => !overallSaving && setOverallOpen(false)} disabled={overallSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={overallSaving} onClick={() => void saveOverallScale()}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={1.25}>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Curriculum</InputLabel>
            <Select label="Curriculum" value={overallForm.curriculum_id} onChange={(e) => setOverallForm((f) => ({ ...f, curriculum_id: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {curriculumOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Class</InputLabel>
            <Select label="Class" value={overallForm.curriculum_class_id} onChange={(e) => setOverallForm((f) => ({ ...f, curriculum_class_id: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {dialogClassOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            When report card totals fall in this range (sum of selected exam marks), students receive this overall grade. Set ranges to match your school&apos;s total mark scale — not limited to 0–100.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField label="Range from" type="number" size="small" fullWidth value={overallForm.range_from} onChange={(e) => setOverallForm((f) => ({ ...f, range_from: e.target.value }))} helperText="Minimum total marks" inputProps={{ min: 0, step: "any" }} sx={inputSx} />
            <TextField label="Range to" type="number" size="small" fullWidth value={overallForm.range_to} onChange={(e) => setOverallForm((f) => ({ ...f, range_to: e.target.value }))} helperText="Maximum total marks" inputProps={{ min: 0, step: "any" }} sx={inputSx} />
          </Stack>
          <TextField label="Overall grade" size="small" fullWidth placeholder="e.g. A, B+, Pass" value={overallForm.overall_grade} onChange={(e) => setOverallForm((f) => ({ ...f, overall_grade: e.target.value }))} sx={inputSx} />
          <TextField label="Remarks" size="small" fullWidth multiline minRows={2} value={overallForm.remarks} onChange={(e) => setOverallForm((f) => ({ ...f, remarks: e.target.value }))} sx={inputSx} />
        </Stack>
      </PremiumDialog>
    </Stack>
  );
});

export default CurriculumGradingSystemTab;
