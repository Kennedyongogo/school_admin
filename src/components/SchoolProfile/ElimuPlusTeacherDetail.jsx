import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  WorkOutline as WorkOutlineIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  MenuBook as MenuBookIcon,
  HomeWork as HomeWorkIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import {
  authHeaders,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryLight,
  ghostBtnSx,
  resolveAssetUrl,
} from "./elimuPlusShared";
import { ElimuPlusHero, FormSection, DetailField } from "./elimuPlusUi";

function homeroomLabel(t) {
  const hc = t?.homeroom_curriculum_class;
  if (!hc || (!hc.name && !hc.code)) return null;
  const pathway = hc.curriculum?.name;
  const name = hc.name || hc.code || "";
  return pathway ? `${pathway} — ${name}` : name;
}

function curriculumClassLine(c) {
  const path = c?.curriculum?.name || "";
  const name = c?.name || c?.code || "";
  const code = c?.code && c?.name !== c?.code ? ` (${c.code})` : "";
  return path ? `${path} — ${name}${code}` : `${name}${code}`;
}

function curriculumSubjectLine(s) {
  const c = s?.curriculum?.name || "";
  const cl = s?.curriculum_class?.name;
  const base = s?.name || "";
  return [c, cl, base].filter(Boolean).join(" — ") || base || "—";
}

function StackLines({ items }) {
  if (!items?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.25, py: 0 }}>
      {items.map((line, i) => (
        <Typography key={i} component="li" variant="body2" sx={{ fontWeight: 600, display: "list-item", pl: 0.5 }}>
          {line}
        </Typography>
      ))}
    </Stack>
  );
}

export default function ElimuPlusTeacherDetail() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const goBack = () => navigate("/elimu-plus", { state: { tab: 2 } });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/teachers/${teacherId}`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load teacher (${res.status})`);
        }
        if (!cancelled) setTeacher(data.data || null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load teacher.");
          setTeacher(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (teacherId) load();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  const user = teacher?.user;
  const displayName = user?.full_name || user?.username || "Teacher";
  const initials = displayName.charAt(0).toUpperCase();
  const photoSrc = resolveAssetUrl(teacher?.profile_picture);
  const homeroom = teacher ? homeroomLabel(teacher) : null;

  const departmentLines =
    teacher && Array.isArray(teacher.departments)
      ? teacher.departments.map((d) => (d.code ? `${d.name} (${d.code})` : d.name))
      : [];
  const curriculumNameLines =
    teacher && Array.isArray(teacher.teaching_curricula) ? teacher.teaching_curricula.map((c) => c.name || c.code || "—") : [];
  const classLines =
    teacher && Array.isArray(teacher.teaching_curriculum_classes) ? teacher.teaching_curriculum_classes.map((c) => curriculumClassLine(c)) : [];
  const subjectLines =
    teacher && Array.isArray(teacher.teaching_curriculum_subjects)
      ? teacher.teaching_curriculum_subjects.map((s) => (s.name ? String(s.name) : curriculumSubjectLine(s)))
      : [];

  if (loading) {
    return (
      <Box sx={{ ...pageShellSx, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...pageShellSx, minHeight: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Tooltip title="Back to teachers">
          <IconButton onClick={goBack} aria-label="Back to teachers" sx={{ bgcolor: "#fff", border: "1px solid rgba(220,38,38,0.12)", "&:hover": { bgcolor: "#FEE2E2" } }}>
            <ArrowBackIcon sx={{ color: primaryDark }} />
          </IconButton>
        </Tooltip>
      </Stack>

      <ElimuPlusHero
        title={displayName}
        subtitle={user?.email || "Teacher profile"}
        icon={<PersonIcon sx={{ fontSize: 26, color: "#fff" }} />}
      />

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {teacher ? (
        <>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormSection title="Profile summary">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "center", sm: "flex-start" }}>
                  <Avatar
                    src={photoSrc || undefined}
                    sx={{
                      width: { xs: 112, sm: 128 },
                      height: { xs: 112, sm: 128 },
                      fontSize: "2.75rem",
                      fontWeight: 800,
                      bgcolor: `${primaryRed}18`,
                      color: primaryDark,
                      border: `4px solid ${primaryLight}`,
                      boxShadow: `0 8px 24px ${primaryRed}33`,
                    }}
                  >
                    {!photoSrc ? initials : null}
                  </Avatar>
                  <Stack spacing={1.25} sx={{ flex: 1, width: "100%", alignItems: { xs: "center", sm: "flex-start" }, textAlign: { xs: "center", sm: "left" } }}>
                    <Stack direction="row" flexWrap="wrap" gap={1} justifyContent={{ xs: "center", sm: "flex-start" }}>
                      <Chip icon={<BadgeIcon sx={{ fontSize: "18px !important" }} />} label={`Employee # ${teacher.employee_number || "—"}`} sx={{ fontWeight: 700, bgcolor: `${primaryRed}12`, border: `1px solid ${primaryLight}` }} />
                      {user?.role ? (
                        <Chip label={String(user.role).replace(/_/g, " ")} size="small" sx={{ fontWeight: 700, textTransform: "capitalize" }} />
                      ) : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                      Qualification summary and assignments are organized below. Use the teachers list to edit or remove this profile.
                    </Typography>
                  </Stack>
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Login account">
                <Stack spacing={1.5}>
                  <DetailField icon={<PersonIcon fontSize="small" />} label="Full name" value={user?.full_name} />
                  <DetailField icon={<PersonIcon fontSize="small" />} label="Username" value={user?.username} />
                  <DetailField icon={<EmailIcon fontSize="small" />} label="Email" value={user?.email} />
                  <DetailField icon={<PhoneIcon fontSize="small" />} label="Phone" value={user?.phone} />
                  <DetailField icon={<HomeIcon fontSize="small" />} label="Address" value={user?.address} />
                  <DetailField icon={<BadgeIcon fontSize="small" />} label="Role" value={user?.role ? String(user.role).replace(/_/g, " ") : undefined} />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Employment & credentials">
                <Stack spacing={1.5}>
                  <DetailField icon={<BadgeIcon fontSize="small" />} label="Employee number" value={teacher.employee_number} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Qualification" value={teacher.qualification} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Specialization" value={teacher.specialization} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Years of experience" value={teacher.years_of_experience != null ? String(teacher.years_of_experience) : undefined} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Joining date" value={teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : undefined} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Salary" value={teacher.salary != null ? String(teacher.salary) : undefined} />
                  <DetailField icon={<WorkOutlineIcon fontSize="small" />} label="Bank account" value={teacher.bank_account_number} />
                  <DetailField icon={<SchoolIcon fontSize="small" />} label="Highest degree" value={teacher.highest_degree} />
                </Stack>
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Homeroom (class teacher)">
                <DetailField icon={<HomeWorkIcon fontSize="small" />} label="Homeroom class" value={homeroom || "Not assigned."} />
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Departments & curricula">
                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryDark, display: "block", mb: 1 }}>
                  Departments
                </Typography>
                <StackLines items={departmentLines} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: primaryDark, display: "block", mb: 1, mt: 2.5 }}>
                  Curricula taught
                </Typography>
                <StackLines items={curriculumNameLines} />
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Curriculum classes taught">
                <StackLines items={classLines} />
              </FormSection>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormSection title="Subject offerings">
                <StackLines items={subjectLines} />
              </FormSection>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Back to teachers list
            </Button>
          </Stack>
        </>
      ) : (
        !error && (
          <Typography color="text.secondary" sx={{ py: 4 }}>
            No teacher data.
          </Typography>
        )
      )}
    </Box>
  );
}
