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
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Avatar,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { levelsForClass } from "./studentFormLevels";

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

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

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
          <PersonAddIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create student profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Link an existing student user account to enrollment details.
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
                  Profile photo (student record)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || undefined} sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}>
                    {!profilePhotoPreview ? <PersonAddIcon /> : null}
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
                  Student user
                </Typography>
                <FormControl fullWidth required variant="outlined">
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
                {eligibleUsers.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    No student-role users without a profile. Create a user with role Student under User management first, then return here.
                  </Alert>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Enrollment details
                </Typography>

                <TextField
                  label="Admission number"
                  required
                  fullWidth
                  value={form.admission_number}
                  onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
                />
                <TextField
                  label="Date of birth"
                  type="date"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel id="gender-label">Gender</InputLabel>
                  <Select
                    labelId="gender-label"
                    label="Gender"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required variant="outlined">
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
                <FormControl fullWidth required variant="outlined" disabled={!form.curriculum_id}>
                  <InputLabel id="stu-create-cc">Class</InputLabel>
                  <Select
                    labelId="stu-create-cc"
                    label="Class"
                    value={form.curriculum_class_id === "" ? "" : form.curriculum_class_id}
                    onChange={(e) =>
                      setForm({ ...form, curriculum_class_id: e.target.value, curriculum_class_level_id: "" })
                    }
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
                <FormControl fullWidth required variant="outlined" disabled={!form.curriculum_class_id}>
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
                <TextField
                  label="Enrollment date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.enrollment_date}
                  onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
                />
                <TextField
                  label="Graduation year"
                  fullWidth
                  type="number"
                  inputProps={{ min: 1900, max: 2100 }}
                  value={form.graduation_year}
                  onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
                />
                <TextField label="Blood group" fullWidth value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
                <TextField
                  label="Medical conditions"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.medical_conditions}
                  onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })}
                />
                <TextField
                  label="Emergency contact name"
                  fullWidth
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                />
                <TextField
                  label="Emergency contact phone"
                  fullWidth
                  value={form.emergency_contact_phone}
                  onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                />
                <FormControlLabel
                  control={<Checkbox checked={form.is_alumni} onChange={(e) => setForm({ ...form, is_alumni: e.target.checked })} />}
                  label="Alumni"
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                    sx={{ bgcolor: accent, fontWeight: 700, "&:hover": { bgcolor: accentDark }, minWidth: 160 }}
                  >
                    {saving ? "Creating…" : "Create student"}
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
