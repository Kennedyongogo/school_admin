import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Checkbox,
  Grid,
  Avatar,
  Stack,
} from "@mui/material";
import { Edit as EditIcon, Close as CloseIcon } from "@mui/icons-material";
import Swal from "sweetalert2";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const authMultipartHeaders = (token) => ({
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function profilePhotoUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

async function fetchAllPages(path, token) {
  const out = [];
  let pageNum = 1;
  let totalPages = 1;
  do {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${path}${sep}page=${pageNum}&limit=100`, { headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !Array.isArray(data.data)) break;
    out.push(...data.data);
    totalPages = data.pagination?.totalPages ?? 1;
    pageNum += 1;
    if (pageNum > 50) break;
  } while (pageNum <= totalPages);
  return out;
}

function rowToForm(row) {
  const u = row.user || {};
  const enr = row.enrollment_date ? String(row.enrollment_date).slice(0, 10) : "";
  return {
    studentId: row.id,
    admission_number: row.admission_number ?? "",
    date_of_birth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : "",
    gender: row.gender || "male",
    current_class: row.current_class ?? "",
    section: row.section ?? "",
    roll_number: row.roll_number ?? "",
    enrollment_date: enr,
    graduation_year: row.graduation_year != null ? String(row.graduation_year) : "",
    blood_group: row.blood_group ?? "",
    medical_conditions: row.medical_conditions ?? "",
    emergency_contact_name: row.emergency_contact_name ?? "",
    emergency_contact_phone: row.emergency_contact_phone ?? "",
    is_alumni: !!row.is_alumni,
    class_teacher_id: row.class_teacher_id ?? "",
    user_full_name: u.full_name ?? "",
    user_email: u.email ?? "",
    user_username: u.username ?? "",
    user_phone: u.phone ?? "",
    user_address: u.address ?? "",
    user_profile_image: u.profile_image ?? "",
    student_profile_picture_url: row.profile_picture ?? "",
  };
}

export default function ElimuPlusStudentsTab({ active }) {
  const [rows, setRows] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(() => rowToForm({ user: {}, enrollment_date: null }));
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const fetchTeachers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const list = await fetchAllPages("/api/teachers", token);
      setTeachers(Array.isArray(list) ? list : []);
    } catch {
      /* optional for class teacher dropdown */
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students?page=${page + 1}&limit=${rowsPerPage}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load students (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
    } catch (e) {
      setError(e.message || "Failed to load students.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (!active) return;
    fetchStudents();
    fetchTeachers();
  }, [active, fetchStudents, fetchTeachers]);

  useEffect(() => {
    if (!profilePhotoFile) {
      setProfilePhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(profilePhotoFile);
    setProfilePhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profilePhotoFile]);

  const openEdit = (row) => {
    setForm(rowToForm(row));
    setProfilePhotoFile(null);
    setDialogError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDialogError("Please sign in again.");
      return;
    }
    if (!form.studentId) {
      setDialogError("Missing student.");
      return;
    }
    if (!form.admission_number?.trim() || !form.date_of_birth || !form.current_class?.trim()) {
      setDialogError("Admission number, date of birth, and current class are required.");
      return;
    }
    if (!form.user_full_name?.trim()) {
      setDialogError("Student full name is required.");
      return;
    }

    setSaving(true);
    setDialogError(null);

    const gy = form.graduation_year?.toString().trim();
    const graduation_year = gy === "" ? null : Number.parseInt(gy, 10);
    if (graduation_year !== null && Number.isNaN(graduation_year)) {
      setDialogError("Graduation year must be a number.");
      setSaving(false);
      return;
    }

    const studentPayload = {
      admission_number: form.admission_number.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      current_class: form.current_class.trim(),
      section: form.section?.trim() || null,
      roll_number: form.roll_number?.trim() || null,
      enrollment_date: form.enrollment_date?.trim() || null,
      graduation_year,
      blood_group: form.blood_group?.trim() || null,
      medical_conditions: form.medical_conditions?.trim() || null,
      emergency_contact_name: form.emergency_contact_name?.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone?.trim() || null,
      is_alumni: !!form.is_alumni,
      class_teacher_id: form.class_teacher_id ? form.class_teacher_id : null,
    };

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
      fd.append("admission_number", studentPayload.admission_number);
      fd.append("date_of_birth", studentPayload.date_of_birth);
      fd.append("gender", studentPayload.gender);
      fd.append("current_class", studentPayload.current_class);
      fd.append("section", studentPayload.section ?? "");
      fd.append("roll_number", studentPayload.roll_number ?? "");
      fd.append("enrollment_date", studentPayload.enrollment_date ?? "");
      fd.append("graduation_year", graduation_year === null ? "" : String(graduation_year));
      fd.append("blood_group", studentPayload.blood_group ?? "");
      fd.append("medical_conditions", studentPayload.medical_conditions ?? "");
      fd.append("emergency_contact_name", studentPayload.emergency_contact_name ?? "");
      fd.append("emergency_contact_phone", studentPayload.emergency_contact_phone ?? "");
      fd.append("is_alumni", studentPayload.is_alumni ? "true" : "false");
      fd.append("class_teacher_id", studentPayload.class_teacher_id ?? "");
      fd.append("user", JSON.stringify(userObj));
      if (profilePhotoFile) fd.append("student_profile_picture", profilePhotoFile);
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
      setDialogOpen(false);
      await fetchStudents();
      await Swal.fire({
        icon: "success",
        title: "Student updated",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (e) {
      setDialogError(e.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!active) return null;

  return (
    <Box sx={{ pt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: accent }} />
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${accentLight}`,
            boxShadow: `0 8px 28px -12px ${accent}33`,
            bgcolor: "rgba(255,255,255,0.98)",
          }}
        >
          <Table size="medium">
            <TableHead>
              <TableRow
                sx={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                  "& .MuiTableCell-head": { color: "#fff", fontWeight: 700, borderBottom: "none" },
                }}
              >
                <TableCell width={52}>Photo</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Admission #</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Class</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Section</TableCell>
                <TableCell align="right" width={72}>
                  Edit
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      No students found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const name = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = profilePhotoUrl(r.profile_picture);
                  return (
                    <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => openEdit(r)}>
                      <TableCell>
                        <Avatar src={photoSrc || undefined} sx={{ width: 36, height: 36, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}>
                          {!photoSrc ? name.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{name}</TableCell>
                      <TableCell>{r.admission_number}</TableCell>
                      <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{r.current_class}</TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{r.section || "—"}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit details">
                          <IconButton size="small" aria-label="Edit student" onClick={() => openEdit(r)} sx={{ color: accent }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
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
            sx={{
              borderTop: `1px solid ${accentLight}`,
              "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
            }}
          />
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          Update student
          <IconButton aria-label="Close" onClick={() => !saving && setDialogOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: accentDark }}>
            Student profile photo
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
            <Avatar
              src={profilePhotoPreview || profilePhotoUrl(form.student_profile_picture_url) || undefined}
              sx={{ width: 72, height: 72, bgcolor: `${accent}22`, color: accentDark, fontWeight: 700 }}
            >
              {!profilePhotoPreview && !form.student_profile_picture_url ? "?" : null}
            </Avatar>
            <Button variant="outlined" component="label" sx={{ borderColor: accent, color: accentDark, fontWeight: 700 }}>
              Choose photo
              <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} />
            </Button>
            {(profilePhotoFile || form.student_profile_picture_url) && (
              <Button size="small" onClick={() => { setProfilePhotoFile(null); setForm({ ...form, student_profile_picture_url: "" }); }}>
                Clear photo
              </Button>
            )}
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: accentDark }}>
            Account (user)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Full name" required fullWidth value={form.user_full_name} onChange={(e) => setForm({ ...form, user_full_name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" fullWidth type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Username" fullWidth value={form.user_username} onChange={(e) => setForm({ ...form, user_username: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth value={form.user_phone} onChange={(e) => setForm({ ...form, user_phone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" fullWidth multiline minRows={2} value={form.user_address} onChange={(e) => setForm({ ...form, user_address: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Profile image URL"
                fullWidth
                value={form.user_profile_image}
                onChange={(e) => setForm({ ...form, user_profile_image: e.target.value })}
                helperText="Optional path or URL stored on the user record"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5, fontWeight: 700, color: accentDark }}>
            Student record
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Admission number" required fullWidth value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Date of birth" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="stu-gender">Gender</InputLabel>
                <Select labelId="stu-gender" label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Current class" required fullWidth value={form.current_class} onChange={(e) => setForm({ ...form, current_class: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Section" fullWidth value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Roll number" fullWidth value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Enrollment date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Graduation year" fullWidth type="number" inputProps={{ min: 1900, max: 2100 }} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Blood group" fullWidth value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="stu-teacher">Class teacher</InputLabel>
                <Select labelId="stu-teacher" label="Class teacher" value={form.class_teacher_id === "" ? "" : form.class_teacher_id} onChange={(e) => setForm({ ...form, class_teacher_id: e.target.value })}>
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.user?.full_name || t.user?.username || t.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Medical conditions" fullWidth multiline minRows={2} value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Emergency contact name" fullWidth value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Emergency contact phone" fullWidth value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.is_alumni} onChange={(e) => setForm({ ...form, is_alumni: e.target.checked })} />} label="Alumni" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => !saving && setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" disabled={saving} onClick={handleSave} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark }, fontWeight: 700 }}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
