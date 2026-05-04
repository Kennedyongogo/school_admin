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
  Paper,
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
} from "@mui/icons-material";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
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

/** Three equal columns on md+; inset from viewport edges via parent padding + extra horizontal gutter. */
function teacherCardsGridSx(theme, extra = {}) {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: theme.spacing(2.5),
    rowGap: theme.spacing(2.5),
    alignItems: "stretch",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    px: { xs: 1, sm: 2 },
    ...extra,
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "minmax(0, 1fr)",
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(2),
    },
  };
}

const teacherCardCellSx = {
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

/** Fills grid cell height; scroll inside body when content is taller than siblings. */
function DetailCard({ icon: Icon, title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${accentLight}`,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "rgba(255,255,255,0.96)",
        boxShadow: `0 12px 40px -24px ${accent}55`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2.5, py: 1.75, bgcolor: `${accent}08`, borderBottom: `1px solid ${accentLight}`, flexShrink: 0 }}
      >
        {Icon && <Icon sx={{ fontSize: 22, color: accentDark }} />}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: accentDark, lineHeight: 1.25 }}>
          {title}
        </Typography>
      </Stack>
      <Box
        sx={{
          p: 2.5,
          flex: "1 1 auto",
          minHeight: 0,
          overflow: "auto",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

/** Label above value — matches printed roster style. */
function Field({ label, value, mono, placeholder }) {
  const show = value !== null && value !== undefined && String(value).trim() !== "";
  const text = show ? String(value) : placeholder;
  if (text === undefined || text === null) return null;
  return (
    <Box sx={{ mb: 2, "&:last-of-type": { mb: 0 } }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 0.5, letterSpacing: "0.02em" }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          wordBreak: "break-word",
          color: show ? "text.primary" : "text.secondary",
          fontFamily: mono ? "ui-monospace, monospace" : undefined,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
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
  const photoSrc = profilePhotoUrl(teacher?.profile_picture);
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

  return (
    <Box
      sx={(theme) => ({
        width: `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
        marginLeft: theme.spacing(-3),
        marginRight: theme.spacing(-3),
        marginTop: theme.spacing(-2.5),
        marginBottom: "1px",
        boxSizing: "border-box",
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 42%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 52%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          pb: { xs: 8, sm: 10 },
          color: "#fff",
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 3 }}>
          <Tooltip title="Back to teachers">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back to teachers"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ opacity: 0.9, letterSpacing: 1 }}>
              Teacher profile
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15, mt: 0.5 }}>
              {loading ? "Loading…" : displayName}
            </Typography>
            {!loading && user?.email && (
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1, opacity: 0.95 }}>
                <EmailIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">{user.email}</Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4, mt: { xs: -6, sm: -7 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : teacher ? (
          <>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                p: { xs: 2.5, sm: 3 },
                mb: 3,
                border: `1px solid ${accentLight}`,
                bgcolor: "rgba(255,255,255,0.98)",
                boxShadow: `0 20px 50px -28px ${accent}66`,
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "center", sm: "flex-start" }}>
                <Avatar
                  src={photoSrc || undefined}
                  sx={{
                    width: { xs: 112, sm: 128 },
                    height: { xs: 112, sm: 128 },
                    fontSize: "2.75rem",
                    fontWeight: 800,
                    bgcolor: `${accent}18`,
                    color: accentDark,
                    border: `4px solid ${accentLight}`,
                    boxShadow: `0 8px 24px ${accent}33`,
                  }}
                >
                  {!photoSrc ? initials : null}
                </Avatar>
                <Stack spacing={1.25} sx={{ flex: 1, width: "100%", alignItems: { xs: "center", sm: "flex-start" }, textAlign: { xs: "center", sm: "left" } }}>
                  <Stack direction="row" flexWrap="wrap" gap={1} justifyContent={{ xs: "center", sm: "flex-start" }}>
                    <Chip icon={<BadgeIcon sx={{ fontSize: "18px !important" }} />} label={`Employee # ${teacher.employee_number || "—"}`} sx={{ fontWeight: 700, bgcolor: `${accent}12`, border: `1px solid ${accentLight}` }} />
                    {user?.role && (
                      <Chip label={String(user.role).replace(/_/g, " ")} size="small" sx={{ fontWeight: 700, textTransform: "capitalize" }} />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
                    Qualification summary and assignments are organized below. Use the teachers list to edit or remove this profile.
                  </Typography>
                  <Button variant="outlined" onClick={goBack} sx={{ alignSelf: { xs: "center", sm: "flex-start" }, borderColor: accent, color: accentDark, fontWeight: 700 }}>
                    Back to teachers list
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Box sx={(theme) => teacherCardsGridSx(theme, { mb: 2.5 })}>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={PersonIcon} title="Login account (user)">
                  <Field label="Full name" value={user?.full_name} placeholder="—" />
                  <Field label="Username" value={user?.username} mono placeholder="—" />
                  <Field label="Email" value={user?.email} placeholder="—" />
                  <Field label="Phone" value={user?.phone} placeholder="—" />
                  <Field label="Address" value={user?.address} placeholder="—" />
                  <Field
                    label="Role"
                    value={user?.role ? String(user.role).replace(/_/g, " ") : undefined}
                    placeholder="—"
                  />
                </DetailCard>
              </Box>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={WorkOutlineIcon} title="Employment & credentials">
                  <Field label="Employee number" value={teacher.employee_number} mono placeholder="—" />
                  <Field label="Qualification" value={teacher.qualification} placeholder="—" />
                  <Field label="Specialization" value={teacher.specialization} placeholder="—" />
                  <Field
                    label="Years of experience"
                    value={teacher.years_of_experience != null ? String(teacher.years_of_experience) : undefined}
                    placeholder="—"
                  />
                  <Field
                    label="Joining date"
                    value={teacher.joining_date ? String(teacher.joining_date).slice(0, 10) : undefined}
                    placeholder="—"
                  />
                  <Field label="Salary" value={teacher.salary != null ? String(teacher.salary) : undefined} placeholder="—" />
                  <Field label="Bank account" value={teacher.bank_account_number} mono placeholder="—" />
                  <Field label="Highest degree" value={teacher.highest_degree} placeholder="—" />
                </DetailCard>
              </Box>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={HomeWorkIcon} title="Homeroom (class teacher)">
                  <Field label="Homeroom class" value={homeroom || undefined} placeholder="Not assigned." />
                </DetailCard>
              </Box>
            </Box>

            <Box sx={(theme) => teacherCardsGridSx(theme, {})}>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={SchoolIcon} title="Departments & curricula">
                  <Typography variant="caption" sx={{ fontWeight: 800, color: accentDark, display: "block", mb: 1 }}>
                    Departments
                  </Typography>
                  <StackLines items={departmentLines} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: accentDark, display: "block", mb: 1, mt: 2.5 }}>
                    Curricula taught
                  </Typography>
                  <StackLines items={curriculumNameLines} />
                </DetailCard>
              </Box>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={ClassIcon} title="Curriculum classes taught">
                  <StackLines items={classLines} />
                </DetailCard>
              </Box>
              <Box sx={teacherCardCellSx}>
                <DetailCard icon={MenuBookIcon} title="Subject offerings">
                  <StackLines items={subjectLines} />
                </DetailCard>
              </Box>
            </Box>
          </>
        ) : (
          !error && (
            <Typography color="text.secondary" sx={{ py: 4 }}>
              No teacher data.
            </Typography>
          )
        )}
      </Box>
    </Box>
  );
}
