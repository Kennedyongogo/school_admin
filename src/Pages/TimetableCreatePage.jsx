import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { format, isValid, parseISO } from "date-fns";
import { showTeacherOverlapSweetAlert } from "../utils/timetableOverlapAlert";
import {
  authHeaders,
  fullMainBleedSx,
  elimuViewportSx,
  warmCream,
  primaryRed,
} from "../components/Timetable/timetableShared";
import {
  TimetableHero,
  FormSection,
  TimetableFilterSelect,
  TimetablePrimaryButton,
  TimetableGhostButton,
  timetableInputSx,
  timetableSwal,
} from "../components/Timetable/timetableUi";

function formatTimeForApi(value) {
  if (!value || !value.isValid?.()) return "";
  return value.format("HH:mm:ss");
}

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
  const [mediaMode, setMediaMode] = useState("optional");

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
        ...(deliveryMode === "online" ? { media_mode: mediaMode || "optional" } : {}),
      };
      const lRes = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/timetables/${tid}/lessons`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(lessonBody),
      });
      const lJson = await lRes.json().catch(() => ({}));
      if (!lRes.ok || !lJson.success) throw new Error(lJson.message || "Timetable created but lesson failed");

      await timetableSwal({
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
      <Box
        component="form"
        onSubmit={submit}
        sx={(theme) => ({
          ...fullMainBleedSx(theme),
          ...elimuViewportSx,
          bgcolor: warmCream,
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 2, sm: 2.5 },
          gap: 2,
          display: "flex",
          flexDirection: "column",
        })}
      >
        <TimetableHero
          title={format(parsedDate, "EEEE, MMM d, yyyy")}
          subtitle="Create a lesson timetable and schedule the first lesson for this day."
          icon={<EventNoteOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
          actions={
            <Tooltip title="Back to day view">
              <IconButton
                type="button"
                onClick={() => navigate(`/timetable/day/${isoDate}`)}
                sx={{
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          }
        />

        {error ? (
          <Alert severity="error" sx={{ borderRadius: "16px" }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: primaryRed }} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            <FormSection title="Curriculum & class">
              <Stack spacing={2}>
                <TimetableFilterSelect
                  label="Curriculum"
                  required
                  value={curriculumId}
                  onChange={(e) => setCurriculumId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select curriculum</em>
                  </MenuItem>
                  {curricula.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TimetableFilterSelect>
                <TimetableFilterSelect
                  label="Curriculum class"
                  required
                  disabled={!curriculumId}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select class</em>
                  </MenuItem>
                  {classes.map((cl) => (
                    <MenuItem key={cl.id} value={cl.id}>
                      {cl.name} ({cl.code})
                    </MenuItem>
                  ))}
                </TimetableFilterSelect>
                <TimetableFilterSelect
                  label="Curriculum term"
                  required
                  disabled={!classId}
                  value={levelId}
                  onChange={(e) => setLevelId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select term</em>
                  </MenuItem>
                  {levels.map((lv) => (
                    <MenuItem key={lv.id} value={lv.id}>
                      {lv.name}
                    </MenuItem>
                  ))}
                </TimetableFilterSelect>
              </Stack>
            </FormSection>

            <FormSection title="Lesson details">
              <Stack spacing={2}>
                <TimetableFilterSelect
                  label="Subject offering"
                  required
                  disabled={!classId}
                  value={curriculumSubjectId}
                  onChange={(e) => setCurriculumSubjectId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select subject</em>
                  </MenuItem>
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TimetableFilterSelect>
                <TimetableFilterSelect
                  label="Teacher"
                  required
                  disabled={!curriculumSubjectId}
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select teacher</em>
                  </MenuItem>
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {teacherLabel(t)}
                    </MenuItem>
                  ))}
                </TimetableFilterSelect>
                <TimetableFilterSelect
                  label="Lesson delivery"
                  value={deliveryMode}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDeliveryMode(next);
                    if (next !== "online") setMediaMode("optional");
                  }}
                >
                  <MenuItem value="physical">Physical (classroom)</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </TimetableFilterSelect>
                {deliveryMode === "online" ? (
                  <TimetableFilterSelect
                    label="Online media"
                    value={mediaMode}
                    onChange={(e) => setMediaMode(e.target.value)}
                  >
                    <MenuItem value="optional">Optional — camera/mic off until turned on</MenuItem>
                    <MenuItem value="audio">Audio class — microphone on when joining</MenuItem>
                    <MenuItem value="video">Video class — camera and microphone on when joining</MenuItem>
                  </TimetableFilterSelect>
                ) : null}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TimePicker
                    label="Start time"
                    ampm
                    value={startTime}
                    onChange={(v) => setStartTime(v)}
                    slotProps={{ textField: { fullWidth: true, required: true, sx: timetableInputSx } }}
                  />
                  <TimePicker
                    label="End time"
                    ampm
                    value={endTime}
                    onChange={(v) => setEndTime(v)}
                    slotProps={{ textField: { fullWidth: true, required: true, sx: timetableInputSx } }}
                  />
                </Stack>
                <TextField
                  label="Timetable name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  sx={timetableInputSx}
                />
              </Stack>
            </FormSection>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <TimetableGhostButton type="button" onClick={() => navigate(`/timetable/day/${isoDate}`)} disabled={saving}>
                Cancel
              </TimetableGhostButton>
              <TimetablePrimaryButton
                type="submit"
                disabled={saving || !formReady || levels.length === 0}
              >
                {saving ? <CircularProgress size={22} color="inherit" /> : "Save timetable"}
              </TimetablePrimaryButton>
            </Stack>
          </Stack>
        )}
      </Box>
    </LocalizationProvider>
  );
}
