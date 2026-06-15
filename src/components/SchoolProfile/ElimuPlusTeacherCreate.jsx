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
  Avatar,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authHeaders,
  authMultipartHeaders,
  fetchAllPages,
  inputSx,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryBtnSx,
  ghostBtnSx,
} from "./elimuPlusShared";
import { ElimuPlusHero, FormSection } from "./elimuPlusUi";

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
        confirmButtonColor: primaryRed,
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
    <Box component="form" onSubmit={handleSubmit} sx={{ ...pageShellSx, minHeight: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back to Elimu Plus">
          <IconButton onClick={goBack} aria-label="Back" sx={{ bgcolor: "#fff", border: "1px solid rgba(220,38,38,0.12)", "&:hover": { bgcolor: "#FEE2E2" } }}>
            <ArrowBackIcon sx={{ color: primaryDark }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <ElimuPlusHero
        title="Create teacher profile"
        subtitle="Choose teaching assignments first (many curriculum classes allowed), then employment details, then optional homeroom class teacher (exactly one)."
        icon={<PersonIcon sx={{ fontSize: 26, color: "#fff" }} />}
      />

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {pageLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <FormSection title="Profile photo">
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || undefined} sx={{ width: 72, height: 72, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}>
                    {!profilePhotoPreview ? <PersonIcon /> : null}
                  </Avatar>
                  <Button variant="outlined" component="label" sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700, borderRadius: "12px", textTransform: "none" }}>
                    Choose photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </Button>
                  {profilePhoto ? (
                    <Button size="small" type="button" onClick={() => setProfilePhoto(null)} sx={{ fontWeight: 600, textTransform: "none" }}>
                      Remove
                    </Button>
                  ) : null}
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormSection title="Teacher user">
                <Stack spacing={2}>
                  <Typography variant="body2" sx={{ color: "#4B5563", lineHeight: 1.6 }}>
                    The person already has a user account with role <strong>teacher</strong>. Name, email, and password are managed on that account (User
                    management). Choose every curriculum class group they teach below (many allowed). Homeroom class teacher is separate and limited to one class.
                  </Typography>
                  <FormControl fullWidth required variant="outlined" sx={inputSx}>
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
                  {eligibleUsers.length === 0 ? (
                    <Alert severity="info" sx={{ borderRadius: "14px" }}>
                      No teacher-role users without a profile. Create a user with role Teacher under User management first, then return here.
                    </Alert>
                  ) : null}
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12}>
              <FormSection title="Teaching assignments">
                <Stack spacing={2}>
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
                    renderInput={(params) => <TextField {...params} label="Departments" placeholder="Select one or more" sx={inputSx} />}
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
                    renderInput={(params) => <TextField {...params} label="Curricula taught" placeholder="Select pathways" sx={inputSx} />}
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
                      <TextField {...params} label="Curriculum classes taught" placeholder="Select all class groups they teach" sx={inputSx} />
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
                    renderInput={(params) => <TextField {...params} label="Curriculum subjects taught" placeholder="Select offerings" sx={inputSx} />}
                    ListboxProps={{ style: { maxHeight: 280 } }}
                  />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} lg={6}>
              <FormSection title="Employment">
                <Stack spacing={2}>
                  <TextField label="Employee number" required fullWidth value={form.employee_number} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} sx={inputSx} />
                  <TextField label="Qualification" required fullWidth value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} sx={inputSx} />
                  <TextField label="Specialization" fullWidth value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} sx={inputSx} />
                  <TextField label="Years of experience" type="number" fullWidth inputProps={{ min: 0 }} value={form.years_of_experience} onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })} sx={inputSx} />
                  <TextField label="Joining date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} sx={inputSx} />
                  <TextField label="Salary" fullWidth type="number" inputProps={{ min: 0, step: "0.01" }} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} sx={inputSx} />
                  <TextField label="Bank account number" fullWidth value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} sx={inputSx} />
                  <TextField label="Highest degree" fullWidth value={form.highest_degree} onChange={(e) => setForm({ ...form, highest_degree: e.target.value })} sx={inputSx} />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} lg={6}>
              <FormSection title="Class teacher (homeroom)">
                <Stack spacing={2}>
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
                        sx={{ color: primaryRed, "&.Mui-checked": { color: primaryRed } }}
                      />
                    }
                    label="This teacher is a class teacher (homeroom)"
                  />
                  <FormControl fullWidth variant="outlined" disabled={!form.is_class_teacher} sx={inputSx}>
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
                </Stack>
              </FormSection>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null} sx={primaryBtnSx}>
              {saving ? "Creating…" : "Create teacher"}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
