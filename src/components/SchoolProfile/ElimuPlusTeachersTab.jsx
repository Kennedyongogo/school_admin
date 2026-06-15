import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Person as PersonIcon,
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
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./elimuPlusUi";

function rowToEditForm(row) {
  return {
    teacherId: row.id,
    employee_number: row.employee_number ?? "",
    qualification: row.qualification ?? "",
    specialization: row.specialization ?? "",
    years_of_experience: row.years_of_experience != null ? String(row.years_of_experience) : "",
    joining_date: row.joining_date ? String(row.joining_date).slice(0, 10) : "",
    salary: row.salary != null ? String(row.salary) : "",
    bank_account_number: row.bank_account_number ?? "",
    highest_degree: row.highest_degree ?? "",
    department_ids: Array.isArray(row.departments) ? row.departments.map((d) => d.id) : [],
    curriculum_ids: Array.isArray(row.teaching_curricula) ? row.teaching_curricula.map((c) => c.id) : [],
    curriculum_class_ids: Array.isArray(row.teaching_curriculum_classes) ? row.teaching_curriculum_classes.map((c) => c.id) : [],
    curriculum_subject_ids: Array.isArray(row.teaching_curriculum_subjects) ? row.teaching_curriculum_subjects.map((s) => s.id) : [],
    is_class_teacher: !!row.is_class_teacher,
    class_teacher_curriculum_class_id: row.homeroom_curriculum_class?.id || row.class_teacher_curriculum_class_id || "",
    profile_picture_url: row.profile_picture ?? "",
  };
}

export default function ElimuPlusTeachersTab({ active }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(() => rowToEditForm({}));
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [curriculumClasses, setCurriculumClasses] = useState([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState([]);

  const fetchTeachers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teachers?page=${page + 1}&limit=${rowsPerPage}`, { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load teachers (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
    } catch (e) {
      setError(e.message || "Failed to load teachers.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (active) fetchTeachers();
  }, [active, fetchTeachers]);

  useEffect(() => {
    if (!editPhotoFile) {
      setEditPhotoPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(editPhotoFile);
    setEditPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editPhotoFile]);

  const loadEditLookups = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [deptRows, curRows, classesFlat, subjectsFlat] = await Promise.all([
        fetchAllPages("/api/departments", token),
        fetchAllPages("/api/curricula", token),
        fetchAllPages("/api/curricula/all-classes", token),
        fetchAllPages("/api/curricula/all-subjects", token),
      ]);
      setDepartments(Array.isArray(deptRows) ? deptRows : []);
      setCurricula(curRows);
      setCurriculumClasses(classesFlat);
      setCurriculumSubjects(subjectsFlat);
    } catch {
      /* ignore */
    }
  }, []);

  const openEdit = (row) => {
    setEditForm(rowToEditForm(row));
    setEditPhotoFile(null);
    setEditError(null);
    setEditOpen(true);
    loadEditLookups();
  };

  const curriculumClassOptionLabel = (o) => {
    const c = o?.curriculum?.name || "";
    const n = o?.name || "";
    const code = o?.code ? ` (${o.code})` : "";
    return c ? `${c} — ${n}${code}` : `${n}${code}`;
  };

  const saveEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setEditError("Please sign in again.");
      return;
    }
    if (!editForm.teacherId) return;
    if (!editForm.employee_number?.trim() || !editForm.qualification?.trim()) {
      setEditError("Employee number and qualification are required.");
      return;
    }
    if (editForm.is_class_teacher && !String(editForm.class_teacher_curriculum_class_id || "").trim()) {
      setEditError("Select homeroom curriculum class or turn off class teacher.");
      return;
    }

    const yoe = editForm.years_of_experience === "" ? 0 : Number.parseInt(String(editForm.years_of_experience), 10);
    if (Number.isNaN(yoe) || yoe < 0) {
      setEditError("Years of experience must be a non-negative number.");
      return;
    }
    const salaryRaw = editForm.salary?.toString().trim();
    const salary = salaryRaw === "" ? null : Number.parseFloat(salaryRaw);
    if (salary !== null && Number.isNaN(salary)) {
      setEditError("Salary must be a valid number.");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      const fd = new FormData();
      fd.append("employee_number", editForm.employee_number.trim());
      fd.append("qualification", editForm.qualification.trim());
      fd.append("specialization", editForm.specialization?.trim() || "");
      fd.append("years_of_experience", String(yoe));
      fd.append("joining_date", editForm.joining_date?.trim() || "");
      fd.append("salary", salary === null ? "" : String(salary));
      fd.append("bank_account_number", editForm.bank_account_number?.trim() || "");
      fd.append("highest_degree", editForm.highest_degree?.trim() || "");
      fd.append("department_ids", JSON.stringify(editForm.department_ids));
      fd.append("curriculum_ids", JSON.stringify(editForm.curriculum_ids));
      fd.append("curriculum_class_ids", JSON.stringify(editForm.curriculum_class_ids));
      fd.append("curriculum_subject_ids", JSON.stringify(editForm.curriculum_subject_ids));
      fd.append("is_class_teacher", editForm.is_class_teacher ? "true" : "false");
      fd.append(
        "class_teacher_curriculum_class_id",
        editForm.is_class_teacher ? String(editForm.class_teacher_curriculum_class_id).trim() : ""
      );
      if (editPhotoFile) fd.append("teacher_profile_picture", editPhotoFile);
      else fd.append("profile_picture", editForm.profile_picture_url ?? "");

      const res = await fetch(`/api/teachers/${editForm.teacherId}`, {
        method: "PUT",
        headers: authMultipartHeaders(token),
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed.");
      }
      setEditOpen(false);
      await fetchTeachers();
      await Swal.fire({ icon: "success", title: "Teacher updated", timer: 1400, showConfirmButton: false });
    } catch (e) {
      setEditError(e.message || "Update failed.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const name = row?.user?.full_name || row?.user?.username || "this teacher";
    const ok = await Swal.fire({
      icon: "warning",
      title: "Remove teacher profile?",
      text: `The teacher profile for ${name} will be removed. Their login account stays — you can create a new profile for this user later.`,
      showCancelButton: true,
      confirmButtonColor: primaryRed,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Remove profile",
    });
    if (!ok.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/teachers/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed (school admin role may be required).");
      }
      await fetchTeachers();
      Swal.fire({ icon: "success", title: "Profile removed", timer: 1600, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: e.message || "Delete failed" });
    }
  };

  const selectedDepartments = departments.filter((d) => editForm.department_ids.includes(d.id));
  const selectedCurricula = curricula.filter((c) => editForm.curriculum_ids.includes(c.id));
  const selectedTeachingClasses = curriculumClasses.filter((c) => editForm.curriculum_class_ids.includes(c.id));
  const selectedSubjects = curriculumSubjects.filter((s) => editForm.curriculum_subject_ids.includes(s.id));

  if (!active) return null;

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
          <Table size="medium">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell width={56}>No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="center" width={72}>
                  Picture
                </TableCell>
                <TableCell align="right" width={132}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyTableRow message="No teachers yet. Use Create teacher profile in the header." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const displayName = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = resolveAssetUrl(r.profile_picture);
                  return (
                    <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {displayName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Avatar
                          src={photoSrc || undefined}
                          sx={{ width: 40, height: 40, mx: "auto", bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
                        >
                          {!photoSrc ? displayName.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View full profile">
                          <IconButton
                            size="small"
                            aria-label="View teacher profile"
                            onClick={() => navigate(`/elimu-plus/teachers/${r.id}`)}
                            sx={actionIconSx}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit teacher" onClick={() => openEdit(r)} sx={actionIconSx}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete teacher">
                          <IconButton
                            size="small"
                            aria-label="Delete teacher"
                            onClick={() => handleDelete(r)}
                            sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
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
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit teacher"
        subtitle="Update teacher profile and assignments"
        icon={<PersonIcon />}
        maxWidth="md"
        footer={
          <>
            <DialogGhostButton onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editSaving} onClick={saveEdit}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        {editError ? <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{editError}</Alert> : null}
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={editPhotoPreview || resolveAssetUrl(editForm.profile_picture_url) || undefined}
              sx={{ width: 72, height: 72, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
            >
              {!editPhotoPreview && !editForm.profile_picture_url ? "?" : null}
            </Avatar>
            <Button variant="outlined" component="label" sx={{ borderColor: primaryRed, color: primaryDark, fontWeight: 700 }}>
              Choose photo
              <input type="file" accept="image/*" hidden onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)} />
            </Button>
            {(editPhotoFile || editForm.profile_picture_url) && (
              <Button size="small" onClick={() => { setEditPhotoFile(null); setEditForm({ ...editForm, profile_picture_url: "" }); }}>
                Clear photo
              </Button>
            )}
          </Stack>
          <TextField label="Employee number" required fullWidth value={editForm.employee_number} onChange={(e) => setEditForm({ ...editForm, employee_number: e.target.value })} sx={inputSx} />
          <TextField label="Qualification" required fullWidth value={editForm.qualification} onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })} sx={inputSx} />
          <TextField label="Specialization" fullWidth value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} sx={inputSx} />
          <TextField label="Years of experience" type="number" fullWidth inputProps={{ min: 0 }} value={editForm.years_of_experience} onChange={(e) => setEditForm({ ...editForm, years_of_experience: e.target.value })} sx={inputSx} />
          <TextField label="Joining date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editForm.joining_date} onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })} sx={inputSx} />
          <TextField label="Salary" type="number" fullWidth inputProps={{ min: 0, step: "0.01" }} value={editForm.salary} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} sx={inputSx} />
          <TextField label="Bank account number" fullWidth value={editForm.bank_account_number} onChange={(e) => setEditForm({ ...editForm, bank_account_number: e.target.value })} sx={inputSx} />
          <TextField label="Highest degree" fullWidth value={editForm.highest_degree} onChange={(e) => setEditForm({ ...editForm, highest_degree: e.target.value })} sx={inputSx} />

          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: primaryDark }}>
            Teaching assignments
          </Typography>
          <Autocomplete
            multiple
            options={departments}
            getOptionLabel={(o) => (o?.name ? `${o.name} (${o.code || ""})` : "")}
            value={selectedDepartments}
            onChange={(_, v) => setEditForm({ ...editForm, department_ids: v.map((x) => x.id) })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />)
            }
            renderInput={(params) => <TextField {...params} label="Departments" sx={inputSx} />}
          />
          <Autocomplete
            multiple
            options={curricula}
            getOptionLabel={(o) => o?.name || ""}
            value={selectedCurricula}
            onChange={(_, v) => setEditForm({ ...editForm, curriculum_ids: v.map((x) => x.id) })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />)
            }
            renderInput={(params) => <TextField {...params} label="Curricula taught" sx={inputSx} />}
          />
          <Autocomplete
            multiple
            options={curriculumClasses}
            getOptionLabel={curriculumClassOptionLabel}
            value={selectedTeachingClasses}
            onChange={(_, v) => setEditForm({ ...editForm, curriculum_class_ids: v.map((x) => x.id) })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option.name || option.code} {...getTagProps({ index })} key={option.id} size="small" />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Curriculum classes taught" sx={inputSx} />}
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
            onChange={(_, v) => setEditForm({ ...editForm, curriculum_subject_ids: v.map((x) => x.id) })}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option.name} {...getTagProps({ index })} key={option.id} size="small" />
              ))
            }
            renderInput={(params) => <TextField {...params} label="Curriculum subjects taught" sx={inputSx} />}
            ListboxProps={{ style: { maxHeight: 280 } }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={!!editForm.is_class_teacher}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    is_class_teacher: e.target.checked,
                    class_teacher_curriculum_class_id: e.target.checked ? editForm.class_teacher_curriculum_class_id : "",
                  })
                }
                sx={{ color: primaryRed, "&.Mui-checked": { color: primaryRed } }}
              />
            }
            label="Class teacher (homeroom)"
          />
          <FormControl fullWidth variant="outlined" disabled={!editForm.is_class_teacher} sx={inputSx}>
            <InputLabel id="edit-homeroom-label">Homeroom curriculum class</InputLabel>
            <Select
              labelId="edit-homeroom-label"
              label="Homeroom curriculum class"
              value={editForm.is_class_teacher ? editForm.class_teacher_curriculum_class_id || "" : ""}
              onChange={(e) => setEditForm({ ...editForm, class_teacher_curriculum_class_id: e.target.value })}
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
      </PremiumDialog>
    </TabPanelShell>
  );
}
