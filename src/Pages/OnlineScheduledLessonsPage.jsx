import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { format } from "date-fns";
import {
  LessonOnlineCard,
  EmptyListNotice,
  SessionsGrid,
  SessionGridItem,
} from "../components/OnlineHub/OnlineSessionCards";
import OnlineLessonLiveDialog from "../components/OnlineHub/OnlineLessonLiveDialog";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2),
  marginBottom: "1px",
  boxSizing: "border-box",
  minHeight: "100%",
  background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
});

export default function OnlineScheduledLessonsPage() {
  const navigate = useNavigate();
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveDlg, setLiveDlg] = useState({
    open: false,
    lessonId: null,
    subtitle: "",
    lessonDate: "",
    curriculumClassId: null,
    curriculumClassLabel: "",
  });

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLessons([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = `from=${encodeURIComponent(todayIso)}&days=42&limit=60`;
      const res = await fetch(`/api/curricula/timetable-lessons/online-upcoming?${q}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load lessons");
      setLessons(Array.isArray(data.data) ? data.data : []);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInitiate = (row) => {
    const sub = row?.curriculum_subject?.name ? `${row.curriculum_subject.name}` : "Online lesson";
    const datePart = row?.lesson_date && /^\d{4}-\d{2}-\d{2}$/.test(row.lesson_date) ? row.lesson_date : "";
    const cc = row?.timetable?.curriculum_class;
    const ccLabel = cc ? `${cc.name || ""}${cc.code ? ` (${cc.code})` : ""}`.trim() : "";
    setLiveDlg({
      open: true,
      lessonId: row?.id ?? null,
      subtitle: datePart ? `${sub} · ${datePart}` : sub,
      lessonDate: datePart,
      curriculumClassId: cc?.id ?? null,
      curriculumClassLabel: ccLabel,
    });
  };

  return (
    <Box sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #a0826d 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          color: "#fff",
          boxShadow: `0 8px 24px ${accent}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton
            aria-label="Back"
            onClick={() => navigate("/elimu-plus-online")}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.15)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <CalendarMonthOutlined sx={{ fontSize: 34 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Elimu Plus · Online
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Online lessons
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
              Timetable slots marked <strong>Online</strong>. <strong>Initiate</strong> creates or reuses meeting links;
              use <strong>Day timetable</strong> in the dialog for attendance on that date.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, pb: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : lessons.length === 0 ? (
          <EmptyListNotice>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              No online lessons in the next few weeks. Add them under Timetable (set delivery to Online).
            </Typography>
          </EmptyListNotice>
        ) : (
          <SessionsGrid>
            {lessons.map((row) => (
              <SessionGridItem key={row.id}>
                <LessonOnlineCard row={row} onInitiate={handleInitiate} />
              </SessionGridItem>
            ))}
          </SessionsGrid>
        )}
      </Box>

      <OnlineLessonLiveDialog
        open={liveDlg.open}
        onClose={() =>
          setLiveDlg({
            open: false,
            lessonId: null,
            subtitle: "",
            lessonDate: "",
            curriculumClassId: null,
            curriculumClassLabel: "",
          })
        }
        lessonId={liveDlg.lessonId}
        subtitle={liveDlg.subtitle}
        curriculumClassId={liveDlg.curriculumClassId}
        curriculumClassLabel={liveDlg.curriculumClassLabel}
        lessonDateIso={liveDlg.lessonDate}
        onGoToDayTimetable={(d) => navigate(`/timetable/day/${d}`)}
        onLinksReady={load}
      />
    </Box>
  );
}
