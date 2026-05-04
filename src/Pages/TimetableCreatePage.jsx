import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { format, isValid, parseISO } from "date-fns";
import Swal from "sweetalert2";
import { showTeacherOverlapSweetAlert } from "../utils/timetableOverlapAlert";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function formatTimeForApi(value) {
  if (!value || !value.isValid?.()) return "";
  return value.format("HH:mm:ss");
}

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
  minHeight: "100%",
  background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
});

/** Match ElimuPlusSchoolProfileForm.jsx */
const labelSx = {
  color: primaryDark,
  fontWeight: 600,
  "&.Mui-focused": { color: primaryRed },
};

const outlinedFieldSx = {
  width: "100%",
  maxWidth: "100%",
  "& .MuiOutlinedInput-root": {
    width: "100%",
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.95)",
    "& fieldset": { borderColor: "#FECACA" },
    "&:hover fieldset": { borderColor: primaryRed },
    "&.Mui-focused fieldset": {
      borderColor: primaryRed,
      boxShadow: `0 0 0 2px ${primaryLight}`,
    },
  },
  "& .MuiInputLabel-root": { ...labelSx },
};

export default function TimetableCreatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isoDate = searchParams.get("date");

  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [curriculumId, setCurriculumId] = useState("");
  const [classId, setClassId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [curriculumSubjectId, setCurriculumSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [name, setName] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("physical");

  const parsedDate = isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate) ? parseISO(isoDate) : null;
  const dateOk = parsedDate && isValid(parsedDate);

  const loadLookups = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const cRes = await fetch("/api/curricula", { headers: authHeaders(token) });
      const cJson = await cRes.json().catch(() => ({}));
      if (!cRes.ok || !cJson.success) throw new Error(cJson.message || "Could not load curricula");
      setCurricula(Array.isArray(cJson.data) ? cJson.data : []);
    } catch (e) {
      setError(e.message || "Failed to load form.");
      setCurricula([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    if (!dateOk || !curriculumId || !curriculumSubjectId) {
      setTeachers([]);
      setTeacherId("");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const q = `curriculum_subject_id=${encodeURIComponent(curriculumSubjectId)}`;
        const res = await fetch(`/api/curricula/${curriculumId}/teachers-for-timetable?${q}`, {
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load teachers");
        if (!cancelled) {
          setTeachers(Array.isArray(data.data) ? data.data : []);
          setTeacherId("");
        }
      } catch {
        if (!cancelled) setTeachers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [curriculumId, curriculumSubjectId, dateOk]);

  useEffect(() => {
    if (!dateOk || !curriculumId) {
      setClasses([]);
      setClassId("");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/curricula/${curriculumId}/classes`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load classes");
        if (!cancelled) {
          setClasses(Array.isArray(data.data) ? data.data : []);
          setClassId("");
        }
      } catch {
        if (!cancelled) setClasses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [curriculumId, dateOk]);

  useEffect(() => {
    if (!dateOk || !curriculumId || !classId) {
      setLevels([]);
      setSubjects([]);
      setLevelId("");
      setCurriculumSubjectId("");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [lvRes, subRes] = await Promise.all([
          fetch(`/api/curricula/${curriculumId}/classes/${classId}/levels`, { headers: authHeaders(token) }),
          fetch(`/api/curricula/${curriculumId}/subjects?curriculum_class_id=${encodeURIComponent(classId)}`, {
            headers: authHeaders(token),
          }),
        ]);
        const lvJson = await lvRes.json().catch(() => ({}));
        const subJson = await subRes.json().catch(() => ({}));
        if (!lvRes.ok || !lvJson.success) throw new Error(lvJson.message || "Could not load terms");
        if (!subRes.ok || !subJson.success) throw new Error(subJson.message || "Could not load subjects");
        if (!cancelled) {
          const lvlRows = Array.isArray(lvJson.data) ? lvJson.data : [];
          const sorted = [...lvlRows].sort((a, b) => (a.level_order ?? 0) - (b.level_order ?? 0));
          setLevels(sorted);
          setLevelId("");
          setSubjects(Array.isArray(subJson.data) ? subJson.data : []);
          setCurriculumSubjectId("");
        }
      } catch (e) {
        if (!cancelled) {
          setLevels([]);
          setSubjects([]);
          setError((prev) => prev || e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [curriculumId, classId, dateOk]);

  useEffect(() => {
    if (dateOk && parsedDate) {
      setName(`Timetable — ${format(parsedDate, "MMM d, yyyy")}`);
    }
  }, [dateOk, parsedDate]);

  useEffect(() => {
    if (!isoDate || !dateOk) navigate("/timetable", { replace: true });
  }, [isoDate, dateOk, navigate]);

  if (!isoDate || !dateOk) return null;

  const teacherLabel = (t) => {
    const u = t?.user;
    return u?.full_name || u?.username || "Teacher";
  };

  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !curriculumId || !classId || !levelId) {
      setError("Choose curriculum, class, and curriculum term.");
      return;
    }
    if (!curriculumSubjectId) {
      setError("Select a subject offering.");
      return;
    }
    if (!teacherId) {
      setError("Select a teacher.");
      return;
    }
    const starts_at = formatTimeForApi(startTime);
    const ends_at = formatTimeForApi(endTime);
    if (!starts_at || !ends_at) {
      setError("Choose start and end time.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const timetableBody = {
        name: name.trim() || null,
        curriculum_class_level_id: levelId,
        is_active: true,
      };
      const tRes = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/timetables`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(timetableBody),
      });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok || !tJson.success) throw new Error(tJson.message || "Could not create timetable");
      const tid = tJson.data?.id;
      if (!tid) throw new Error("Invalid server response");

      const lessonBody = {
        lesson_date: isoDate,
        curriculum_subject_id: curriculumSubjectId,
        teacher_id: teacherId,
        starts_at,
        ends_at,
        teacher_attended: false,
        delivery_mode: deliveryMode === "online" ? "online" : "physical",
      };
      const lRes = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/timetables/${tid}/lessons`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(lessonBody),
      });
      const lJson = await lRes.json().catch(() => ({}));
      if (!lRes.ok || !lJson.success) throw new Error(lJson.message || "Timetable created but lesson failed");

      await Swal.fire({
        icon: "success",
        title: "Timetable created",
        html: `Your lesson timetable and first lesson were saved for <strong>${format(parsedDate, "MMM d, yyyy")}</strong>.`,
        timer: 2400,
        showConfirmButton: false,
      });

      navigate(`/timetable/day/${isoDate}`);
    } catch (err) {
      const msg = err.message || "Create failed.";
      if (showTeacherOverlapSweetAlert(msg)) {
        setError(null);
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const formReady =
    curriculumId &&
    classId &&
    levelId &&
    curriculumSubjectId &&
    teacherId &&
    startTime?.isValid?.() &&
    endTime?.isValid?.();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box component="form" onSubmit={submit} sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            color: "#fff",
            boxShadow: `0 8px 24px ${primaryRed}33`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton
              type="button"
              aria-label="Back"
              onClick={() => navigate(`/timetable/day/${isoDate}`)}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <EventNoteIcon sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.9 }}>
                Create timetable
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {format(parsedDate, "EEEE, MMM d, yyyy")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
            pb: 4,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: primaryRed }} />
            </Box>
          ) : (
            <Card
              elevation={0}
              sx={{
                width: "100%",
                borderRadius: 0,
                border: "none",
                borderBottom: `1px solid ${primaryLight}`,
                boxShadow: "none",
                overflow: "hidden",
              }}
            >
              <CardContent
                sx={{
                  width: "100%",
                  boxSizing: "border-box",
                  px: { xs: 0, sm: 0 },
                  pt: { xs: 0.5, sm: 1 },
                  pb: 1,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Stack spacing={2.5} sx={{ width: "100%", maxWidth: "100%" }}>
                <TextField
                  select
                  required
                  label="Curriculum"
                  fullWidth
                  value={curriculumId}
                  onChange={(e) => setCurriculumId(e.target.value)}
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select curriculum</em>
                  </MenuItem>
                  {curricula.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  label="Curriculum class"
                  fullWidth
                  disabled={!curriculumId}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select class</em>
                  </MenuItem>
                  {classes.map((cl) => (
                    <MenuItem key={cl.id} value={cl.id}>
                      {cl.name} ({cl.code})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  label="Curriculum term"
                  fullWidth
                  disabled={!classId}
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                  helperText={classId && levels.length === 0 ? "No terms defined for this class yet." : " "}
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select term</em>
                  </MenuItem>
                  {levels.map((lv) => (
                    <MenuItem key={lv.id} value={lv.id}>
                      {lv.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  label="Subject offering"
                  fullWidth
                  disabled={!classId}
                  value={curriculumSubjectId}
                  onChange={(e) => setCurriculumSubjectId(e.target.value)}
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select subject</em>
                  </MenuItem>
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  required
                  label="Teacher"
                  fullWidth
                  disabled={!curriculumSubjectId}
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  helperText={
                    curriculumSubjectId
                      ? "Only teachers assigned to this subject offering."
                      : "Choose a subject first."
                  }
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="">
                    <em>Select teacher</em>
                  </MenuItem>
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {teacherLabel(t)}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Lesson delivery"
                  fullWidth
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value)}
                  helperText="Physical for in-room lessons; online for remote / video sessions."
                  sx={outlinedFieldSx}
                >
                  <MenuItem value="physical">Physical (classroom)</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </TextField>

                <Stack spacing={2.5} sx={{ width: "100%" }}>
                  <TimePicker
                    label="Start time"
                    ampm
                    value={startTime}
                    onChange={(v) => setStartTime(v)}
                    slotProps={{
                      textField: { fullWidth: true, required: true, sx: outlinedFieldSx },
                    }}
                  />
                  <TimePicker
                    label="End time"
                    ampm
                    value={endTime}
                    onChange={(v) => setEndTime(v)}
                    slotProps={{
                      textField: { fullWidth: true, required: true, sx: outlinedFieldSx },
                    }}
                  />
                </Stack>

                <TextField
                  label="Timetable name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={outlinedFieldSx}
                />

                <Typography variant="caption" color="text.secondary">
                  The lesson is saved for the calendar date shown in the header. You can review or remove it on the next
                  screen.
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ width: "100%", pt: 0.5 }}>
                  <Button type="button" onClick={() => navigate(`/timetable/day/${isoDate}`)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || !formReady || levels.length === 0}
                    sx={{ bgcolor: primaryRed, fontWeight: 800, "&:hover": { bgcolor: primaryDark } }}
                  >
                    {saving ? <CircularProgress size={22} color="inherit" /> : "Save timetable"}
                  </Button>
                </Stack>
              </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
