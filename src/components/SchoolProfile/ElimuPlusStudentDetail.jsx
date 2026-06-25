import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
} from "@mui/icons-material";
import {
  authHeaders,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryLight,
  ghostBtnSx,
  primaryBtnSx,
  inputSx,
  resolveAssetUrl,
} from "./elimuPlusShared";
import { ElimuPlusHero, FormSection, HeroActionButton } from "./elimuPlusUi";

function formatClassDisplay(cc) {
  if (!cc) return "";
  return cc.code ? `${cc.name} (${cc.code})` : cc.name || "";
}

function formatDateOnly(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function formatLabel(value) {
  if (value == null || value === "") return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function homeroomLabel(row) {
  const t = row?.class_teacher;
  if (!t) return "";
  return t.user?.full_name || t.user?.username || t.user?.email || "";
}

function statusChipColor(status) {
  const s = String(status || "active").toLowerCase();
  if (s === "active") return { bg: "#DCFCE7", color: "#166534", border: "#86EFAC" };
  if (s === "graduated" || s === "pending_payment") return { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
  return { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" };
}

function ReadOnlyField({ label, value, multiline, minRows, type }) {
  const display = value == null || value === "" ? "—" : String(value);
  return (
    <TextField
      label={label}
      fullWidth
      value={display}
      type={type}
      multiline={multiline}
      minRows={minRows}
      slotProps={{ input: { readOnly: true } }}
      sx={inputSx}
    />
  );
}

function FieldStack({ children }) {
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      {children}
    </Stack>
  );
}

export default function ElimuPlusStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.studentRow || null);
  const [loading, setLoading] = useState(!location.state?.studentRow);
  const [error, setError] = useState(null);

  const goBack = () => navigate("/elimu-plus", { state: { tab: 3 } });

  const openEdit = () => {
    navigate(`/elimu-plus/students/${studentId}/edit`, {
      state: { studentRow: student },
    });
  };

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
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`, {
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Could not load student (${res.status})`);
        }
        if (!cancelled) setStudent(data.data || null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "Failed to load student.");
          setStudent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (studentId) void load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const user = student?.user;
  const displayName = user?.full_name || user?.username || "Student";
  const initials = displayName.charAt(0).toUpperCase();
  const photoSrc = resolveAssetUrl(student?.profile_picture);
  const userImageSrc = resolveAssetUrl(user?.profile_image);
  const statusStyle = statusChipColor(student?.account_status);
  const homeroom = homeroomLabel(student);

  if (loading) {
    return (
      <Box sx={{ ...pageShellSx, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 360 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  return (
    <Box sx={{ ...pageShellSx, minHeight: "100%" }}>
      <ElimuPlusHero
        title={displayName}
        subtitle={user?.email || "Student profile"}
        icon={<SchoolIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Back to students">
              <IconButton
                onClick={goBack}
                aria-label="Back to students"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            {student ? (
              <HeroActionButton startIcon={<EditIcon />} onClick={openEdit}>
                Edit profile
              </HeroActionButton>
            ) : null}
          </Stack>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mt: 2, borderRadius: "14px" }}>
          {error}
        </Alert>
      ) : null}

      {student ? (
        <Stack spacing={2.5} sx={{ mt: 0.5, width: "100%" }}>
          <FormSection title="Profile summary">
            <FieldStack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ width: "100%" }}>
                <Avatar
                  src={photoSrc || userImageSrc || undefined}
                  sx={{
                    width: 88,
                    height: 88,
                    fontSize: "2rem",
                    fontWeight: 800,
                    bgcolor: `${primaryRed}18`,
                    color: primaryDark,
                    border: `3px solid ${primaryLight}`,
                    flexShrink: 0,
                  }}
                >
                  {!photoSrc && !userImageSrc ? initials : null}
                </Avatar>
                <Stack spacing={1} sx={{ width: "100%", minWidth: 0 }}>
                  <ReadOnlyField label="Display name" value={displayName} />
                  <ReadOnlyField label="Email" value={user?.email} />
                </Stack>
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ width: "100%" }}>
                <Chip
                  icon={<BadgeIcon sx={{ fontSize: "18px !important" }} />}
                  label={`Admission # ${student.admission_number || "—"}`}
                  sx={{ fontWeight: 700, bgcolor: `${primaryRed}12`, border: `1px solid ${primaryLight}` }}
                />
                <Chip
                  label={student.is_alumni ? "Alumni" : "Current student"}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: student.is_alumni ? "#FEF3C7" : "#DCFCE7",
                    color: student.is_alumni ? "#92400E" : "#166534",
                  }}
                />
                <Chip
                  label={formatLabel(student.account_status || "active")}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`,
                  }}
                />
                {user?.role ? (
                  <Chip label={formatLabel(user.role)} size="small" sx={{ fontWeight: 700, textTransform: "capitalize" }} />
                ) : null}
              </Stack>
            </FieldStack>
          </FormSection>

          <FormSection title="Student profile photo">
            <FieldStack>
              <Avatar
                src={photoSrc || undefined}
                sx={{
                  width: 88,
                  height: 88,
                  bgcolor: `${primaryRed}22`,
                  color: primaryDark,
                  fontWeight: 700,
                  border: `3px solid ${primaryLight}`,
                }}
              >
                {!photoSrc ? initials : null}
              </Avatar>
              <ReadOnlyField label="Profile picture path" value={student.profile_picture} />
            </FieldStack>
          </FormSection>

          <FormSection title="Account (user)">
            <FieldStack>
              <ReadOnlyField label="Full name" value={user?.full_name} />
              <ReadOnlyField label="Email" value={user?.email} />
              <ReadOnlyField label="Username" value={user?.username} />
              <ReadOnlyField label="Phone" value={user?.phone} />
              <ReadOnlyField label="Address" value={user?.address} multiline minRows={2} />
              <ReadOnlyField label="Profile image URL" value={user?.profile_image} />
            </FieldStack>
          </FormSection>

          <FormSection title="Student record">
            <FieldStack>
              <ReadOnlyField label="Admission number" value={student.admission_number} />
              <ReadOnlyField label="Date of birth" value={formatDateOnly(student.date_of_birth)} />
              <ReadOnlyField label="Gender" value={formatLabel(student.gender)} />
              <ReadOnlyField label="Curriculum" value={student.curriculum?.name} />
              <ReadOnlyField label="Class" value={formatClassDisplay(student.curriculum_class)} />
              <ReadOnlyField label="Term / level" value={student.curriculum_class_level?.name} />
              <Typography variant="body2" color="text.secondary" sx={{ width: "100%" }}>
                Homeroom teacher is assigned automatically from the teacher marked as class teacher for this curriculum class.
                {homeroom ? (
                  <>
                    {" "}
                    Current: <strong>{homeroom}</strong>
                  </>
                ) : (
                  " None configured for this class yet."
                )}
              </Typography>
              <ReadOnlyField label="Enrollment date" value={formatDateOnly(student.enrollment_date)} />
              <ReadOnlyField label="Graduation year" value={student.graduation_year != null ? String(student.graduation_year) : ""} />
              <ReadOnlyField label="Blood group" value={student.blood_group} />
              <ReadOnlyField label="Medical conditions" value={student.medical_conditions} multiline minRows={2} />
              <ReadOnlyField label="Emergency contact name" value={student.emergency_contact_name} />
              <ReadOnlyField label="Emergency contact phone" value={student.emergency_contact_phone} />
              <ReadOnlyField label="Alumni" value={student.is_alumni ? "Yes" : "No"} />
            </FieldStack>
          </FormSection>

          <FormSection title="Account status">
            <FieldStack>
              <ReadOnlyField label="Account status" value={formatLabel(student.account_status)} />
              <ReadOnlyField label="Status updated at" value={formatDateTime(student.account_status_updated_at)} />
              <ReadOnlyField label="Last deactivation reason" value={student.last_deactivation_reason} multiline minRows={2} />
              <ReadOnlyField label="Reactivation required" value={student.reactivation_required ? "Yes" : "No"} />
            </FieldStack>
          </FormSection>

          <FormSection title="System">
            <FieldStack>
              <ReadOnlyField label="Student ID" value={student.id} />
              <ReadOnlyField label="User ID" value={student.user_id} />
              <ReadOnlyField label="Class teacher ID" value={student.class_teacher_id} />
              <ReadOnlyField label="Created at" value={formatDateTime(student.created_at)} />
              <ReadOnlyField label="Updated at" value={formatDateTime(student.updated_at)} />
            </FieldStack>
          </FormSection>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end" sx={{ pt: 1, width: "100%" }}>
            <Button type="button" variant="text" onClick={goBack} sx={ghostBtnSx}>
              Back to students list
            </Button>
            <Button type="button" variant="contained" startIcon={<EditIcon />} onClick={openEdit} sx={primaryBtnSx}>
              Edit student
            </Button>
          </Stack>
        </Stack>
      ) : (
        !error && (
          <Typography color="text.secondary" sx={{ py: 4 }}>
            No student data.
          </Typography>
        )
      )}
    </Box>
  );
}
