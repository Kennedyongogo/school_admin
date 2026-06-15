import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
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
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  DeleteOutline as DeleteIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  authHeaders,
  authMultipartHeaders,
  fetchAllPages,
  resolveAssetUrl,
  inputSx,
  primaryRed,
  primaryDark,
  actionIconSx,
} from "./elimuPlusShared";
import {
  PremiumDialog,
  DetailField,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./elimuPlusUi";

function formatClassDisplay(cc) {
  if (!cc) return "—";
  return cc.code ? `${cc.name} (${cc.code})` : cc.name;
}

function rowToForm(row) {
  const u = row.user || {};
  const enr = row.enrollment_date ? String(row.enrollment_date).slice(0, 10) : "";
  const curriculumId = row.curriculum_id ?? row.curriculum_class?.curriculum_id ?? "";
  const homeroom =
    row.class_teacher?.user?.full_name ||
    row.class_teacher?.user?.username ||
    row.class_teacher?.user?.email ||
    "";
  return {
    studentId: row.id,
    admission_number: row.admission_number ?? "",
    date_of_birth: row.date_of_birth ? String(row.date_of_birth).slice(0, 10) : "",
    gender: row.gender || "male",
    curriculum_id: curriculumId,
    curriculum_class_id: row.curriculum_class_id ?? "",
    enrollment_date: enr,
    graduation_year: row.graduation_year != null ? String(row.graduation_year) : "",
    blood_group: row.blood_group ?? "",
    medical_conditions: row.medical_conditions ?? "",
    emergency_contact_name: row.emergency_contact_name ?? "",
    emergency_contact_phone: row.emergency_contact_phone ?? "",
    is_alumni: !!row.is_alumni,
    class_teacher_label: homeroom,
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
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
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
  const [viewRow, setViewRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCurriculumMeta = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [cRows, classRows] = await Promise.all([
        fetchAllPages("/api/curricula", token),
        fetchAllPages("/api/curricula/all-classes", token),
      ]);
      setCurricula(Array.isArray(cRows) ? cRows : []);
      setAllClasses(Array.isArray(classRows) ? classRows : []);
    } catch {
      setCurricula([]);
      setAllClasses([]);
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
    fetchCurriculumMeta();
  }, [active, fetchStudents, fetchCurriculumMeta]);

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
    navigate(`/elimu-plus/students/${row.id}/edit`, {
      state: { studentRow: row },
    });
  };

  const handleDeleteStudent = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({ icon: "error", title: "Session expired", text: "Please sign in again." });
      return;
    }
    const name = row.user?.full_name || row.user?.username || "this student";
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Remove student profile?",
      html: `This removes the <strong>student profile</strong> for <strong>${name}</strong>. The user account stays and can be linked to a new profile later. Section enrollments for this profile are removed.`,
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      confirmButtonText: "Yes, remove profile",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/students/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not remove profile (${res.status})`);
      }
      await fetchStudents();
      await Swal.fire({
        icon: "success",
        title: "Profile removed",
        text: data.message || "Student profile was removed.",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Could not remove profile", text: e.message || "Request failed." });
    } finally {
      setDeletingId(null);
    }
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
    if (!form.admission_number?.trim() || !form.date_of_birth || !form.curriculum_id || !form.curriculum_class_id) {
      setDialogError("Admission number, date of birth, curriculum, and class are required.");
      return;
    }
    if (!form.user_full_name?.trim()) {
      setDialogError("Student full name is required.");
      return;
    }

    const gy = form.graduation_year?.toString().trim();
    const graduation_year = gy === "" ? null : Number.parseInt(gy, 10);
    if (graduation_year !== null && Number.isNaN(graduation_year)) {
      setDialogError("Graduation year must be a number.");
      return;
    }

    const confirmSave = await Swal.fire({
      icon: "question",
      title: "Save changes?",
      text: "Update this student’s profile with the values you entered.",
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
    });
    if (!confirmSave.isConfirmed) return;

    setSaving(true);
    setDialogError(null);

    const studentPayload = {
      admission_number: form.admission_number.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      curriculum_id: form.curriculum_id,
      curriculum_class_id: form.curriculum_class_id,
      enrollment_date: form.enrollment_date?.trim() || null,
      graduation_year,
      blood_group: form.blood_group?.trim() || null,
      medical_conditions: form.medical_conditions?.trim() || null,
      emergency_contact_name: form.emergency_contact_name?.trim() || null,
      emergency_contact_phone: form.emergency_contact_phone?.trim() || null,
      is_alumni: !!form.is_alumni,
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
      fd.append("curriculum_id", studentPayload.curriculum_id);
      fd.append("curriculum_class_id", studentPayload.curriculum_class_id);
      fd.append("enrollment_date", studentPayload.enrollment_date ?? "");
      fd.append("graduation_year", graduation_year === null ? "" : String(graduation_year));
      fd.append("blood_group", studentPayload.blood_group ?? "");
      fd.append("medical_conditions", studentPayload.medical_conditions ?? "");
      fd.append("emergency_contact_name", studentPayload.emergency_contact_name ?? "");
      fd.append("emergency_contact_phone", studentPayload.emergency_contact_phone ?? "");
      fd.append("is_alumni", studentPayload.is_alumni ? "true" : "false");
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

  const viewForm = viewRow ? rowToForm(viewRow) : null;

  return (
    <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
      {!loading && (
        <DataTableShell
          pagination={
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
              sx={tablePaginationSx}
            />
          }
        >
          <Table size="medium" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell width={48} align="center">
                  No.
                </TableCell>
                <TableCell width={56}>Photo</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Admission #</TableCell>
                <TableCell>Curriculum</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="right" width={132}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyTableRow message="No students found." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const name = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = resolveAssetUrl(r.profile_picture);
                  const rowNo = page * rowsPerPage + idx + 1;
                  return (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {rowNo}
                      </TableCell>
                      <TableCell>
                        <Avatar src={photoSrc || undefined} sx={{ width: 36, height: 36, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}>
                          {!photoSrc ? name.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{name}</TableCell>
                      <TableCell>{r.admission_number ?? "—"}</TableCell>
                      <TableCell>{r.curriculum?.name || "—"}</TableCell>
                      <TableCell>{formatClassDisplay(r.curriculum_class)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" aria-label="View student" onClick={() => setViewRow(r)} sx={actionIconSx}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit student" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove profile (keeps user account)">
                          <span>
                            <IconButton
                              size="small"
                              aria-label="Remove student profile"
                              disabled={deletingId === r.id}
                              onClick={() => handleDeleteStudent(r)}
                              sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                            >
                              {deletingId === r.id ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      )}

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.user?.full_name || viewRow?.user?.username || "Student"}
        subtitle="Student profile overview"
        icon={<SchoolIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>
            {viewRow ? (
              <DialogPrimaryButton
                startIcon={<EditIcon />}
                onClick={() => {
                  const row = viewRow;
                  setViewRow(null);
                  openEdit(row);
                }}
              >
                Edit
              </DialogPrimaryButton>
            ) : null}
          </>
        }
      >
        {viewRow && viewForm ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={resolveAssetUrl(viewRow.profile_picture) || undefined}
                sx={{ width: 64, height: 64, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
              >
                {!resolveAssetUrl(viewRow.profile_picture) ? (viewRow.user?.full_name || "?").charAt(0).toUpperCase() : null}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {viewRow.user?.full_name || viewRow.user?.username || "—"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {viewRow.user?.email || "—"}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryDark }}>
              Account (user)
            </Typography>
            <Stack spacing={1}>
              <DetailField label="Full name" value={viewForm.user_full_name} />
              <DetailField label="Email" value={viewForm.user_email} />
              <DetailField label="Username" value={viewForm.user_username} />
              <DetailField label="Phone" value={viewForm.user_phone} />
              <DetailField label="Address" value={viewForm.user_address} />
            </Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryDark }}>
              Student record
            </Typography>
            <Stack spacing={1}>
              <DetailField label="Admission number" value={viewForm.admission_number} />
              <DetailField label="Date of birth" value={viewForm.date_of_birth} />
              <DetailField label="Gender" value={viewForm.gender} />
              <DetailField label="Curriculum" value={viewRow.curriculum?.name} />
              <DetailField label="Class" value={formatClassDisplay(viewRow.curriculum_class)} />
              <DetailField label="Enrollment date" value={viewForm.enrollment_date} />
              <DetailField label="Graduation year" value={viewForm.graduation_year} />
              <DetailField label="Blood group" value={viewForm.blood_group} />
              <DetailField label="Medical conditions" value={viewForm.medical_conditions} />
              <DetailField label="Emergency contact name" value={viewForm.emergency_contact_name} />
              <DetailField label="Emergency contact phone" value={viewForm.emergency_contact_phone} />
              <DetailField label="Homeroom teacher" value={viewForm.class_teacher_label} />
              <DetailField label="Alumni" value={viewForm.is_alumni ? "Yes" : "No"} />
            </Stack>
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="Update student"
        subtitle="Edit student profile and account details"
        icon={<SchoolIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => !saving && setDialogOpen(false)} disabled={saving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={saving} onClick={handleSave}>
              Save changes
            </DialogPrimaryButton>
          </>
        }
      >
        {dialogError ? <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{dialogError}</Alert> : null}
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: primaryDark }}>
          Student profile photo
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <Avatar
            src={profilePhotoPreview || resolveAssetUrl(form.student_profile_picture_url) || undefined}
            sx={{ width: 72, height: 72, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
          >
            {!profilePhotoPreview && !form.student_profile_picture_url ? "?" : null}
          </Avatar>
          <Button variant="outlined" component="label" sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
            Choose photo
            <input type="file" accept="image/*" hidden onChange={(e) => setProfilePhotoFile(e.target.files?.[0] || null)} />
          </Button>
          {(profilePhotoFile || form.student_profile_picture_url) && (
            <Button size="small" onClick={() => { setProfilePhotoFile(null); setForm({ ...form, student_profile_picture_url: "" }); }}>
              Clear photo
            </Button>
          )}
        </Stack>

        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: primaryDark }}>
          Account (user)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Full name" required fullWidth value={form.user_full_name} onChange={(e) => setForm({ ...form, user_full_name: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" fullWidth type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Username" fullWidth value={form.user_username} onChange={(e) => setForm({ ...form, user_username: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Phone" fullWidth value={form.user_phone} onChange={(e) => setForm({ ...form, user_phone: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address" fullWidth multiline minRows={2} value={form.user_address} onChange={(e) => setForm({ ...form, user_address: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Profile image URL"
              fullWidth
              value={form.user_profile_image}
              onChange={(e) => setForm({ ...form, user_profile_image: e.target.value })}
              helperText="Optional path or URL stored on the user record"
              sx={inputSx}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5, fontWeight: 700, color: primaryDark }}>
          Student record
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Admission number" required fullWidth value={form.admission_number} onChange={(e) => setForm({ ...form, admission_number: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Date of birth" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth sx={inputSx}>
              <InputLabel id="stu-gender">Gender</InputLabel>
              <Select labelId="stu-gender" label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={inputSx}>
              <InputLabel id="stu-curr">Curriculum</InputLabel>
              <Select
                labelId="stu-curr"
                label="Curriculum"
                value={form.curriculum_id === "" ? "" : form.curriculum_id}
                onChange={(e) => setForm({ ...form, curriculum_id: e.target.value, curriculum_class_id: "" })}
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
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!form.curriculum_id} sx={inputSx}>
              <InputLabel id="stu-cc">Class</InputLabel>
              <Select
                labelId="stu-cc"
                label="Class"
                value={form.curriculum_class_id === "" ? "" : form.curriculum_class_id}
                onChange={(e) => setForm({ ...form, curriculum_class_id: e.target.value })}
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
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Homeroom teacher is assigned automatically from the teacher marked as class teacher for this curriculum class.
              {form.class_teacher_label ? (
                <>
                  {" "}
                  Current: <strong>{form.class_teacher_label}</strong>
                </>
              ) : (
                " None configured for this class yet."
              )}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Enrollment date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.enrollment_date} onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Graduation year" fullWidth type="number" inputProps={{ min: 1900, max: 2100 }} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Blood group" fullWidth value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Medical conditions" fullWidth multiline minRows={2} value={form.medical_conditions} onChange={(e) => setForm({ ...form, medical_conditions: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Emergency contact name" fullWidth value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Emergency contact phone" fullWidth value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox checked={form.is_alumni} onChange={(e) => setForm({ ...form, is_alumni: e.target.checked })} />} label="Alumni" />
          </Grid>
        </Grid>
      </PremiumDialog>
    </TabPanelShell>
  );
}
