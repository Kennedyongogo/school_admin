import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox,
  Avatar,
  Grid,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { levelsForClass } from "./studentFormLevels";
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

const initialForm = () => ({
  link_user_id: "",
  admission_number: "",
  date_of_birth: "",
  gender: "male",
  curriculum_id: "",
  curriculum_class_id: "",
  curriculum_class_level_id: "",
  enrollment_date: "",
  graduation_year: "",
  blood_group: "",
  medical_conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  is_alumni: false,
});

export default function ElimuPlusStudentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allClassLevels, setAllClassLevels] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const goBack = () => navigate("/elimu-plus", { state: { tab: 3 } });

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
      const [eligibleRes, cRows, classRows, levelRows] = await Promise.all([
        fetch("/api/students/users-without-profile", { headers: authHeaders(token) }),
        fetchAllPages("/api/curricula", token),
        fetchAllPages("/api/curricula/all-classes", token),
        fetchAllPages("/api/curricula/all-class-levels", token),
      ]);
      const eligibleJson = await eligibleRes.json().catch(() => ({}));
      if (eligibleRes.ok && eligibleJson.success && Array.isArray(eligibleJson.data)) {
        setEligibleUsers(eligibleJson.data);
      } else {
        setEligibleUsers([]);
      }
      setCurricula(Array.isArray(cRows) ? cRows : []);
      setAllClasses(Array.isArray(classRows) ? classRows : []);
      setAllClassLevels(Array.isArray(levelRows) ? levelRows : []);
    } catch (e) {
      setError(e.message || "Could not load form data.");
      setEligibleUsers([]);
      setCurricula([]);
      setAllClasses([]);
      setAllClassLevels([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const levelOptions = useMemo(
    () => levelsForClass(allClassLevels, form.curriculum_class_id),
    [allClassLevels, form.curriculum_class_id]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    if (!form.link_user_id) {
      setError("Select a student user account that does not yet have a profile.");
      return;
    }
    if (!form.admission_number?.trim() || !form.date_of_birth || !form.curriculum_id || !form.curriculum_class_id || !form.curriculum_class_level_id) {
      setError("Admission number, date of birth, curriculum, class, and term/level are required.");
      return;
    }

    const gy = form.graduation_year?.toString().trim();
    const graduation_year = gy === "" ? null : Number.parseInt(gy, 10);
    if (graduation_year !== null && Number.isNaN(graduation_year)) {
      setError("Graduation year must be a number.");
      return;
    }

    const body = {
      user_id: form.link_user_id,
      admission_number: form.admission_number.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      curriculum_id: form.curriculum_id,
      curriculum_class_id: form.curriculum_class_id,
      curriculum_class_level_id: form.curriculum_class_level_id,
      enrollment_date: form.enrollment_date?.trim() || null,
      graduation_year,
      blood_group: form.blood_group?.trim() || null,
      medical_conditions: form.medical_conditions?.trim() || null,
      emergency_contact_name: form.emergency_contact_name?.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone?.trim() || null,
      is_alumni: !!form.is_alumni,
    };

    setSaving(true);
    try {
      let res;
      if (profilePhoto) {
        const fd = new FormData();
        fd.append("user_id", form.link_user_id);
        fd.append("admission_number", body.admission_number);
        fd.append("date_of_birth", body.date_of_birth);
        fd.append("gender", body.gender);
        fd.append("curriculum_id", body.curriculum_id);
        fd.append("curriculum_class_id", body.curriculum_class_id);
        fd.append("curriculum_class_level_id", body.curriculum_class_level_id);
        fd.append("enrollment_date", body.enrollment_date ?? "");
        fd.append("graduation_year", graduation_year === null ? "" : String(graduation_year));
        fd.append("blood_group", body.blood_group ?? "");
        fd.append("medical_conditions", body.medical_conditions ?? "");
        fd.append("emergency_contact_name", body.emergency_contact_name ?? "");
        fd.append("emergency_contact_phone", body.emergency_contact_phone ?? "");
        fd.append("is_alumni", body.is_alumni ? "true" : "false");
        fd.append("student_profile_picture", profilePhoto);
        res = await fetch("/api/students", {
          method: "POST",
          headers: authMultipartHeaders(token),
          body: fd,
        });
      } else {
        res = await fetch("/api/students", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(body),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create student.");
      }
      await Swal.fire({
        icon: "success",
        title: "Student created",
        text: data.data?.user?.full_name ? `${data.data.user.full_name} is now enrolled.` : undefined,
        confirmButtonColor: primaryRed,
        timer: 1800,
        showConfirmButton: false,
      });
      navigate("/elimu-plus", { replace: true, state: { tab: 3 } });
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
        title="Create student profile"
        subtitle="Link an existing student user account to enrollment details."
        icon={<PersonAddIcon sx={{ fontSize: 26, color: "#fff" }} />}
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
                    {!profilePhotoPreview ? <PersonAddIcon /> : null}
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
              <FormSection title="Student user">
                <Stack spacing={2}>
                  <FormControl fullWidth required variant="outlined" sx={inputSx}>
                    <InputLabel id="eligible-user-label">Student user (no profile yet)</InputLabel>
                    <Select
                      labelId="eligible-user-label"
                      label="Student user (no profile yet)"
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
                      No student-role users without a profile. Create a user with role Student under User management first, then return here.
                    </Alert>
                  ) : null}
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12}>
              <FormSection title="Enrollment details">
                <Stack spacing={2}>
                  <TextField label="Admission number" required fullWidth value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} sx={inputSx} />
                  <TextField label="Date of birth" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} sx={inputSx} />
                  <FormControl fullWidth variant="outlined" sx={inputSx}>
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select labelId="gender-label" label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required variant="outlined" sx={inputSx}>
                    <InputLabel id="stu-create-curr">Curriculum</InputLabel>
                    <Select
                      labelId="stu-create-curr"
                      label="Curriculum"
                      value={form.curriculum_id === "" ? "" : form.curriculum_id}
                      onChange={(e) => setForm({ ...form, curriculum_id: e.target.value, curriculum_class_id: "", curriculum_class_level_id: "" })}
                    >
                      <MenuItem value="">
                        <em>Select…</em>
                      </MenuItem>
                      {curricula.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required variant="outlined" disabled={!form.curriculum_id} sx={inputSx}>
                    <InputLabel id="stu-create-cc">Class</InputLabel>
                    <Select
                      labelId="stu-create-cc"
                      label="Class"
                      value={form.curriculum_class_id === "" ? "" : form.curriculum_class_id}
                      onChange={(e) => setForm({ ...form, curriculum_class_id: e.target.value, curriculum_class_level_id: "" })}
                    >
                      <MenuItem value="">
                        <em>Select…</em>
                      </MenuItem>
                      {allClasses
                        .filter((cl) => cl.curriculum_id === form.curriculum_id)
                        .map((cl) => (
                          <MenuItem key={cl.id} value={cl.id}>
                            {cl.name}
                            {cl.code ? ` (${cl.code})` : ""}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required variant="outlined" disabled={!form.curriculum_class_id} sx={inputSx}>
                    <InputLabel id="stu-create-level">Term / level</InputLabel>
                    <Select
                      labelId="stu-create-level"
                      label="Term / level"
                      value={form.curriculum_class_level_id === "" ? "" : form.curriculum_class_level_id}
                      onChange={(e) => setForm({ ...form, curriculum_class_level_id: e.target.value })}
                    >
                      <MenuItem value="">
                        <em>{form.curriculum_class_id ? (levelOptions.length ? "Select…" : "No levels for this class") : "Select class first"}</em>
                      </MenuItem>
                      {levelOptions.map((lv) => (
                        <MenuItem key={lv.id} value={lv.id}>
                          {lv.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: -1 }}>
                    Homeroom teacher is set automatically from the teacher assigned as class teacher for this class.
                  </Typography>
                  <TextField label="Enrollment date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} sx={inputSx} />
                  <TextField label="Graduation year" fullWidth type="number" inputProps={{ min: 1900, max: 2100 }} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} sx={inputSx} />
                  <TextField label="Blood group" fullWidth value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} sx={inputSx} />
                  <TextField label="Medical conditions" fullWidth multiline minRows={3} value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} sx={inputSx} />
                  <TextField label="Emergency contact name" fullWidth value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} sx={inputSx} />
                  <TextField label="Emergency contact phone" fullWidth value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} sx={inputSx} />
                  <FormControlLabel
                    control={<Checkbox checked={form.is_alumni} onChange={(e) => setForm({ ...form, is_alumni: e.target.checked })} sx={{ color: primaryRed, "&.Mui-checked": { color: primaryRed } }} />}
                    label="Alumni"
                  />
                </Stack>
              </FormSection>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null} sx={primaryBtnSx}>
              {saving ? "Creating…" : "Create student"}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
