import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const authMultipartHeaders = (token) => ({
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

/** Teacher row + junctions only; user account already exists (role teacher). */
const initialForm = () => ({
  link_user_id: "",
  employee_number: "",
  qualification: "",
  specialization: "",
  years_of_experience: "",
  joining_date: "",
  salary: "",
  bank_account_number: "",
  highest_degree: "",
  department_ids: [],
  curriculum_ids: [],
  curriculum_subject_ids: [],
  curriculum_class_ids: [],
  is_class_teacher: false,
  class_teacher_curriculum_class_id: "",
});

async function fetchAllPages(path, token) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  do {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${path}${sep}page=${page}&limit=100`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !Array.isArray(data.data)) break;
    out.push(...data.data);
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
    if (page > 50) break;
  } while (page <= totalPages);
  return out;
}

export default function ElimuPlusTeacherCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [curriculumClasses, setCurriculumClasses] = useState([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const goBack = () => navigate("/elimu-plus", { state: { tab: 2 } });

  useEffect(() => {
    if (!profilePhoto) {
      setProfilePhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhoto]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    setError(null);
    try {
      const [deptRows, eligibleRes] = await Promise.all([
        fetchAllPages("/api/departments", token),
        fetch("/api/teachers/users-without-profile", { headers: authHeaders(token) }),
      ]);
      const eligibleJson = await eligibleRes.json().catch(() => ({}));
      setDepartments(Array.isArray(deptRows) ? deptRows : []);
      if (eligibleRes.ok && eligibleJson.success && Array.isArray(eligibleJson.data)) {
        setEligibleUsers(eligibleJson.data);
      } else {
        setEligibleUsers([]);
      }

      const [curRows, classesFlat, subjectsFlat] = await Promise.all([
        fetchAllPages("/api/curricula", token),
        fetchAllPages("/api/curricula/all-classes", token),
        fetchAllPages("/api/curricula/all-subjects", token),
      ]);
      setCurricula(curRows);
      setCurriculumClasses(classesFlat);
      setCurriculumSubjects(subjectsFlat);
    } catch (e) {
      setError(e.message || "Could not load form data.");
      setEligibleUsers([]);
      setDepartments([]);
      setCurricula([]);
      setCurriculumClasses([]);
      setCurriculumSubjects([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedDepartments = departments.filter((d) => form.department_ids.includes(d.id));
  const selectedCurricula = curricula.filter((c) => form.curriculum_ids.includes(c.id));
  const selectedTeachingClasses = curriculumClasses.filter((c) => form.curriculum_class_ids.includes(c.id));
  const selectedSubjects = curriculumSubjects.filter((s) => form.curriculum_subject_ids.includes(s.id));

  const curriculumClassOptionLabel = (o) => {
    const c = o?.curriculum?.name || "";
    const n = o?.name || "";
    const code = o?.code ? ` (${o.code})` : "";
    return c ? `${c} — ${n}${code}` : `${n}${code}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    if (!form.link_user_id) {
      setError("Select a teacher user account that does not yet have a profile.");
      return;
    }
    if (!form.employee_number?.trim() || !form.qualification?.trim()) {
      setError("Employee number and qualification are required.");
      return;
    }
    if (form.is_class_teacher && !String(form.class_teacher_curriculum_class_id || "").trim()) {
      setError("Select the curriculum class where this teacher is class teacher.");
      return;
    }

    const yoe = form.years_of_experience === "" ? 0 : Number.parseInt(String(form.years_of_experience), 10);
    if (Number.isNaN(yoe) || yoe < 0) {
      setError("Years of experience must be a non-negative number.");
      return;
    }

    const salaryRaw = form.salary?.toString().trim();
    const salary = salaryRaw === "" ? null : Number.parseFloat(salaryRaw);
    if (salary !== null && Number.isNaN(salary)) {
      setError("Salary must be a valid number.");
      return;
    }

    const body = {
      user_id: form.link_user_id,
      employee_number: form.employee_number.trim(),
      qualification: form.qualification.trim(),
      specialization: form.specialization?.trim() || null,
      years_of_experience: yoe,
      joining_date: form.joining_date?.trim() || null,
      salary,
      bank_account_number: form.bank_account_number?.trim() || null,
      highest_degree: form.highest_degree?.trim() || null,
      department_ids: form.department_ids,
      curriculum_ids: form.curriculum_ids,
      curriculum_class_ids: form.curriculum_class_ids,
      curriculum_subject_ids: form.curriculum_subject_ids,
      is_class_teacher: !!form.is_class_teacher,
      class_teacher_curriculum_class_id: form.is_class_teacher ? String(form.class_teacher_curriculum_class_id).trim() : null,
    };

    setSaving(true);
    try {
      let res;
      if (profilePhoto) {
        const fd = new FormData();
        fd.append("user_id", form.link_user_id);
        fd.append("employee_number", body.employee_number);
        fd.append("qualification", body.qualification);
        fd.append("specialization", body.specialization ?? "");
        fd.append("years_of_experience", String(body.years_of_experience));
        fd.append("joining_date", body.joining_date ?? "");
        fd.append("salary", body.salary === null ? "" : String(body.salary));
        fd.append("bank_account_number", body.bank_account_number ?? "");
        fd.append("highest_degree", body.highest_degree ?? "");
        fd.append("department_ids", JSON.stringify(form.department_ids));
        fd.append("curriculum_ids", JSON.stringify(form.curriculum_ids));
        fd.append("curriculum_class_ids", JSON.stringify(form.curriculum_class_ids));
        fd.append("curriculum_subject_ids", JSON.stringify(form.curriculum_subject_ids));
        fd.append("is_class_teacher", form.is_class_teacher ? "true" : "false");
        fd.append("class_teacher_curriculum_class_id", form.is_class_teacher ? String(form.class_teacher_curriculum_class_id).trim() : "");
        fd.append("teacher_profile_picture", profilePhoto);
        res = await fetch("/api/teachers", {
          method: "POST",
          headers: authMultipartHeaders(token),
          body: fd,
        });
      } else {
        res = await fetch("/api/teachers", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create teacher.");
      }
      await Swal.fire({
        icon: "success",
        title: "Teacher profile created",
        text: data.data?.user?.full_name ? `${data.data.user.full_name} can sign in as a teacher.` : undefined,
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/elimu-plus", { replace: true, state: { tab: 2 } });
    } catch (err) {
      setError(err.message || "Create failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #EF4444 100%)`,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          color: "white",
          boxShadow: `0 8px 24px ${accent}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to Elimu Plus">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to Elimu Plus"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <PersonIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create teacher profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Choose teaching assignments first (many curriculum classes allowed), then employment details, then optional homeroom class teacher (exactly one).
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, width: "100%", boxSizing: "border-box" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {pageLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <Card
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: 2,
              border: `1px solid ${accentLight}`,
              boxShadow: `0 8px 28px -12px ${accent}33`,
              overflow: "hidden",
            }}
          >
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Profile photo (teacher record)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || undefined} sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}>
                    {!profilePhotoPreview ? <PersonIcon /> : null}
                  </Avatar>
                  <Button variant="outlined" component="label" sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Choose photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </Button>
                  {profilePhoto && (
                    <Button size="small" type="button" onClick={() => setProfilePhoto(null)}>
                      Remove
                    </Button>
                  )}
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Teacher user
                </Typography>
                <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                  The person already has a user account with role <strong>teacher</strong>. Name, email, and password are managed on that account (User
                  management). Choose every curriculum class group they teach below (many allowed). Homeroom class teacher is separate and limited to one class.
                </Typography>
                <FormControl fullWidth required variant="outlined">
                  <InputLabel id="eligible-teacher-user-label">Teacher user (no profile yet)</InputLabel>
                  <Select
                    labelId="eligible-teacher-user-label"
                    label="Teacher user (no profile yet)"
                    value={form.link_user_id}
                    onChange={(e) => setForm({ ...form, link_user_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Select…</em>
                    </MenuItem>
                    {eligibleUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {eligibleUsers.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No teacher-role users without a profile. Create a user with role Teacher under User management first, then return here.
                  </Alert>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Teaching assignments
                </Typography>
                <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                  Select all curriculum class groups this teacher teaches (e.g. ten classes). That is independent of homeroom: only the homeroom section below picks the single class they are <strong>in charge of</strong>.
                </Typography>
                <Autocomplete
                  multiple
                  options={departments}
                  getOptionLabel={(o) => (o?.name ? `${o.name} (${o.code || ""})` : "")}
                  value={selectedDepartments}
                  onChange={(_, v) => setForm({ ...form, department_ids: v.map((x) => x.id) })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />)
                  }
                  renderInput={(params) => <TextField {...params} label="Departments" placeholder="Select one or more" />}
                />
                <Autocomplete
                  multiple
                  options={curricula}
                  getOptionLabel={(o) => o?.name || ""}
                  value={selectedCurricula}
                  onChange={(_, v) => setForm({ ...form, curriculum_ids: v.map((x) => x.id) })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />)
                  }
                  renderInput={(params) => <TextField {...params} label="Curricula taught" placeholder="Select pathways" />}
                />
                <Autocomplete
                  multiple
                  options={curriculumClasses}
                  getOptionLabel={curriculumClassOptionLabel}
                  value={selectedTeachingClasses}
                  onChange={(_, v) => setForm({ ...form, curriculum_class_ids: v.map((x) => x.id) })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option.name || option.code} {...getTagProps({ index })} key={option.id} size="small" />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Curriculum classes taught" placeholder="Select all class groups they teach" />
                  )}
                  ListboxProps={{ style: { maxHeight: 280 } }}
                />
                <Autocomplete
                  multiple
                  options={curriculumSubjects}
                  getOptionLabel={(o) => {
                    const c = o?.curriculum?.name || "";
                    const cl = o?.curriculum_class?.name;
                    const base = o?.name || "";
                    return [c, cl, base].filter(Boolean).join(" — ");
                  }}
                  value={selectedSubjects}
                  onChange={(_, v) => setForm({ ...form, curriculum_subject_ids: v.map((x) => x.id) })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Curriculum subjects taught" placeholder="Select offerings" />}
                  ListboxProps={{ style: { maxHeight: 280 } }}
                />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Employment (teachers table)
                </Typography>
                <TextField
                  label="Employee number"
                  required
                  fullWidth
                  value={form.employee_number}
                  onChange={(e) => setForm({ ...form, employee_number: e.target.value })}
                />
                <TextField
                  label="Qualification"
                  required
                  fullWidth
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                />
                <TextField label="Specialization" fullWidth value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
                <TextField
                  label="Years of experience"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={form.years_of_experience}
                  onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
                />
                <TextField
                  label="Joining date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.joining_date}
                  onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                />
                <TextField label="Salary" fullWidth type="number" inputProps={{ min: 0, step: "0.01" }} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
                <TextField
                  label="Bank account number"
                  fullWidth
                  value={form.bank_account_number}
                  onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                />
                <TextField label="Highest degree" fullWidth value={form.highest_degree} onChange={(e) => setForm({ ...form, highest_degree: e.target.value })} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Class teacher (homeroom)
                </Typography>
                <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                  Optional: if this teacher is <strong>in charge of one</strong> class group as class teacher, enable this and pick exactly one curriculum class (can match one of the classes they teach above).
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!form.is_class_teacher}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          is_class_teacher: e.target.checked,
                          class_teacher_curriculum_class_id: e.target.checked ? form.class_teacher_curriculum_class_id : "",
                        })
                      }
                      sx={{ color: accent, "&.Mui-checked": { color: accent } }}
                    />
                  }
                  label="This teacher is a class teacher (homeroom)"
                />
                <FormControl fullWidth variant="outlined" disabled={!form.is_class_teacher}>
                  <InputLabel id="homeroom-class-label">Homeroom curriculum class</InputLabel>
                  <Select
                    labelId="homeroom-class-label"
                    label="Homeroom curriculum class"
                    value={form.is_class_teacher ? form.class_teacher_curriculum_class_id || "" : ""}
                    onChange={(e) => setForm({ ...form, class_teacher_curriculum_class_id: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>Select…</em>
                    </MenuItem>
                    {curriculumClasses.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {curriculumClassOptionLabel(o)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ bgcolor: accent, fontWeight: 700, "&:hover": { bgcolor: accentDark }, minWidth: 180 }}
                  >
                    {saving ? "Creating…" : "Create teacher"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
