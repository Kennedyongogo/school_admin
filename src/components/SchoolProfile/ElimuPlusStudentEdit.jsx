import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { ArrowBack as ArrowBackIcon, Edit as EditIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import { levelsForClass, studentLevelIdFromRow } from "./studentFormLevels";

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

function profilePhotoUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function rowToForm(row) {
  const u = row?.user || {};
  const enr = row?.enrollment_date ? String(row.enrollment_date).slice(0, 10) : "";
  const curriculumId = row?.curriculum_id ?? row?.curriculum_class?.curriculum_id ?? "";
  const homeroom =
    row?.class_teacher?.user?.full_name ||
    row?.class_teacher?.user?.username ||
    row?.class_teacher?.user?.email ||
    "";
  return {
    studentId: row?.id || "",
    admission_number: row?.admission_number ?? "",
    date_of_birth: row?.date_of_birth ? String(row.date_of_birth).slice(0, 10) : "",
    gender: row?.gender || "male",
    curriculum_id: curriculumId,
    curriculum_class_id: row?.curriculum_class_id ?? "",
    curriculum_class_level_id: studentLevelIdFromRow(row),
    enrollment_date: enr,
    graduation_year: row?.graduation_year != null ? String(row.graduation_year) : "",
    blood_group: row?.blood_group ?? "",
    medical_conditions: row?.medical_conditions ?? "",
    emergency_contact_name: row?.emergency_contact_name ?? "",
    emergency_contact_phone: row?.emergency_contact_phone ?? "",
    is_alumni: !!row?.is_alumni,
    class_teacher_label: homeroom,
    user_full_name: u.full_name ?? "",
    user_email: u.email ?? "",
    user_username: u.username ?? "",
    user_phone: u.phone ?? "",
    user_address: u.address ?? "",
    user_profile_image: u.profile_image ?? "",
    student_profile_picture_url: row?.profile_picture ?? "",
  };
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

export default function ElimuPlusStudentEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();

  const [form, setForm] = useState(() => rowToForm(location.state?.studentRow || {}));
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
      const [cRows, classRows, levelRows] = await Promise.all([
        fetchAllPages("/api/curricula", token),
        fetchAllPages("/api/curricula/all-classes", token),
        fetchAllPages("/api/curricula/all-class-levels", token),
      ]);
      setCurricula(Array.isArray(cRows) ? cRows : []);
      setAllClasses(Array.isArray(classRows) ? classRows : []);
      setAllClassLevels(Array.isArray(levelRows) ? levelRows : []);

      if (!location.state?.studentRow && studentId) {
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success || !data.data) throw new Error(data.message || "Student not found.");
        setForm(rowToForm(data.data));
      } else if (location.state?.studentRow && studentId) {
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && data.data) {
          setForm(rowToForm(data.data));
        }
      }
    } catch (e) {
      setError(e.message || "Could not load student.");
      setCurricula([]);
      setAllClasses([]);
      setAllClassLevels([]);
    } finally {
      setPageLoading(false);
    }
  }, [location.state?.studentRow, studentId]);

  useEffect(() => {
    void loadData();
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
    if (!form.studentId) {
      setError("Missing student.");
      return;
    }
    if (!form.admission_number?.trim() || !form.date_of_birth || !form.curriculum_id || !form.curriculum_class_id || !form.curriculum_class_level_id) {
      setError("Admission number, date of birth, curriculum, class, and term/level are required.");
      return;
    }
    if (!form.user_full_name?.trim()) {
      setError("Student full name is required.");
      return;
    }
    const gy = form.graduation_year?.toString().trim();
    const graduation_year = gy === "" ? null : Number.parseInt(gy, 10);
    if (graduation_year !== null && Number.isNaN(graduation_year)) {
      setError("Graduation year must be a number.");
      return;
    }

    setSaving(true);
    try {
      const userObj = {
        full_name: form.user_full_name.trim(),
        email: form.user_email?.trim() || undefined,
        username: form.user_username?.trim() || undefined,
        phone: form.user_phone?.trim() || null,
        address: form.user_address?.trim() || null,
        profile_image: form.user_profile_image?.trim() || null,
      };
      const fd = new FormData();
      fd.append("admission_number", form.admission_number.trim());
      fd.append("date_of_birth", form.date_of_birth);
      fd.append("gender", form.gender);
      fd.append("curriculum_id", form.curriculum_id);
      fd.append("curriculum_class_id", form.curriculum_class_id);
      fd.append("curriculum_class_level_id", form.curriculum_class_level_id);
      fd.append("enrollment_date", form.enrollment_date?.trim() || "");
      fd.append("graduation_year", graduation_year === null ? "" : String(graduation_year));
      fd.append("blood_group", form.blood_group?.trim() || "");
      fd.append("medical_conditions", form.medical_conditions?.trim() || "");
      fd.append("emergency_contact_name", form.emergency_contact_name?.trim() || "");
      fd.append("emergency_contact_phone", form.emergency_contact_phone?.trim() || "");
      fd.append("is_alumni", form.is_alumni ? "true" : "false");
      fd.append("user", JSON.stringify(userObj));
      if (profilePhoto) fd.append("student_profile_picture", profilePhoto);
      else fd.append("profile_picture", form.student_profile_picture_url ?? "");

      const res = await fetch(`/api/students/${form.studentId}`, {
        method: "PUT",
        headers: authMultipartHeaders(token),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update student.");
      }
      await Swal.fire({
        icon: "success",
        title: "Student updated",
        timer: 1400,
        showConfirmButton: false,
      });
      navigate("/elimu-plus", { replace: true, state: { tab: 3 } });
    } catch (err) {
      setError(err.message || "Update failed.");
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
              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <EditIcon sx={{ fontSize: 30, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Edit student profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Update full student details.
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
          <Card elevation={0} sx={{ width: "100%", borderRadius: 2, border: `1px solid ${accentLight}`, boxShadow: `0 8px 28px -12px ${accent}33`, overflow: "hidden" }}>
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Student profile photo
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Avatar src={profilePhotoPreview || profilePhotoUrl(form.student_profile_picture_url) || undefined} sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}>
                    {!profilePhotoPreview && !form.student_profile_picture_url ? "?" : null}
                  </Avatar>
                  <Button variant="outlined" component="label" sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Choose photo
                    <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)} />
                  </Button>
                  {(profilePhoto || form.student_profile_picture_url) && (
                    <Button size="small" type="button" onClick={() => { setProfilePhoto(null); setForm((prev) => ({ ...prev, student_profile_picture_url: "" })); }}>
                      Remove
                    </Button>
                  )}
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Account (user)
                </Typography>
                <Stack spacing={2}>
                  <TextField label="Full name" required fullWidth value={form.user_full_name} onChange={(e) => setForm((prev) => ({ ...prev, user_full_name: e.target.value }))} />
                  <TextField label="Email" fullWidth type="email" value={form.user_email} onChange={(e) => setForm((prev) => ({ ...prev, user_email: e.target.value }))} />
                  <TextField label="Username" fullWidth value={form.user_username} onChange={(e) => setForm((prev) => ({ ...prev, user_username: e.target.value }))} />
                  <TextField label="Phone" fullWidth value={form.user_phone} onChange={(e) => setForm((prev) => ({ ...prev, user_phone: e.target.value }))} />
                  <TextField label="Address" fullWidth multiline minRows={2} value={form.user_address} onChange={(e) => setForm((prev) => ({ ...prev, user_address: e.target.value }))} />
                  <TextField label="Profile image URL" fullWidth value={form.user_profile_image} onChange={(e) => setForm((prev) => ({ ...prev, user_profile_image: e.target.value }))} />
                </Stack>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", pt: 1 }}>
                  Student record
                </Typography>
                <Stack spacing={2}>
                  <TextField label="Admission number" required fullWidth value={form.admission_number} onChange={(e) => setForm((prev) => ({ ...prev, admission_number: e.target.value }))} />
                  <TextField label="Date of birth" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))} />
                  <FormControl fullWidth>
                    <InputLabel id="stu-edit-gender">Gender</InputLabel>
                    <Select labelId="stu-edit-gender" label="Gender" value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required>
                    <InputLabel id="stu-edit-curr">Curriculum</InputLabel>
                    <Select labelId="stu-edit-curr" label="Curriculum" value={form.curriculum_id === "" ? "" : form.curriculum_id} onChange={(e) => setForm((prev) => ({ ...prev, curriculum_id: e.target.value, curriculum_class_id: "", curriculum_class_level_id: "" }))}>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {curricula.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required disabled={!form.curriculum_id}>
                    <InputLabel id="stu-edit-cc">Class</InputLabel>
                    <Select labelId="stu-edit-cc" label="Class" value={form.curriculum_class_id === "" ? "" : form.curriculum_class_id} onChange={(e) => setForm((prev) => ({ ...prev, curriculum_class_id: e.target.value, curriculum_class_level_id: "" }))}>
                      <MenuItem value=""><em>Select…</em></MenuItem>
                      {allClasses.filter((cl) => cl.curriculum_id === form.curriculum_id).map((cl) => (
                        <MenuItem key={cl.id} value={cl.id}>{cl.name}{cl.code ? ` (${cl.code})` : ""}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required disabled={!form.curriculum_class_id}>
                    <InputLabel id="stu-edit-level">Term / level</InputLabel>
                    <Select labelId="stu-edit-level" label="Term / level" value={form.curriculum_class_level_id === "" ? "" : form.curriculum_class_level_id} onChange={(e) => setForm((prev) => ({ ...prev, curriculum_class_level_id: e.target.value }))}>
                      <MenuItem value="">
                        <em>{form.curriculum_class_id ? (levelOptions.length ? "Select…" : "No levels for this class") : "Select class first"}</em>
                      </MenuItem>
                      {levelOptions.map((lv) => (
                        <MenuItem key={lv.id} value={lv.id}>{lv.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">
                    Homeroom teacher is assigned automatically from the teacher marked as class teacher for this curriculum class.
                    {form.class_teacher_label ? <> Current: <strong>{form.class_teacher_label}</strong></> : " None configured for this class yet."}
                  </Typography>
                  <TextField label="Enrollment date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.enrollment_date} onChange={(e) => setForm((prev) => ({ ...prev, enrollment_date: e.target.value }))} />
                  <TextField label="Graduation year" fullWidth type="number" inputProps={{ min: 1900, max: 2100 }} value={form.graduation_year} onChange={(e) => setForm((prev) => ({ ...prev, graduation_year: e.target.value }))} />
                  <TextField label="Blood group" fullWidth value={form.blood_group} onChange={(e) => setForm((prev) => ({ ...prev, blood_group: e.target.value }))} />
                  <TextField label="Medical conditions" fullWidth multiline minRows={2} value={form.medical_conditions} onChange={(e) => setForm((prev) => ({ ...prev, medical_conditions: e.target.value }))} />
                  <TextField label="Emergency contact name" fullWidth value={form.emergency_contact_name} onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_name: e.target.value }))} />
                  <TextField label="Emergency contact phone" fullWidth value={form.emergency_contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))} />
                  <FormControlLabel control={<Checkbox checked={form.is_alumni} onChange={(e) => setForm((prev) => ({ ...prev, is_alumni: e.target.checked }))} />} label="Alumni" />
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button type="button" variant="outlined" onClick={goBack} sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null} sx={{ bgcolor: accent, fontWeight: 700, "&:hover": { bgcolor: accentDark }, minWidth: 160 }}>
                    {saving ? "Saving..." : "Save changes"}
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

