import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import { format } from "date-fns";
import Swal from "sweetalert2";
import {
  ExamOnlineCard,
  EmptyListNotice,
  SessionsGrid,
  SessionGridItem,
} from "../components/OnlineHub/OnlineSessionCards";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
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

export default function OnlineScheduledExamsPage() {
  const navigate = useNavigate();
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setExams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = `from=${encodeURIComponent(todayIso)}&days=42&limit=60`;
      const res = await fetch(`/api/exam-schedules/online-upcoming?${q}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load online exams");
      setExams(Array.isArray(data.data) ? data.data : []);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [todayIso]);

  useEffect(() => {
    load();
  }, [load]);

  const toCardExam = (row) => {
    const examTitle = row?.exam?.title || row?.exam?.name || "Online exam";
    const cur = row?.curriculum;
    const cc = row?.curriculum_class;
    const level = row?.curriculum_class_level;
    const teacher = row?.teacher?.user?.full_name || row?.teacher?.user?.username || "";
    const start = row?.start_time ? new Date(row.start_time) : null;
    const end = row?.end_time ? new Date(row.end_time) : null;
    const timeLabel =
      start && end
        ? `${format(start, "yyyy-MM-dd HH:mm")} - ${format(end, "HH:mm")} (${row?.timezone || "UTC"})`
        : "";

    return {
      id: row.id,
      title: examTitle,
      subtitle: [cur?.name && `Curriculum: ${cur.name}`, cc?.name && `Class: ${cc.name}`, level?.name && `Term: ${level.name}`]
        .filter(Boolean)
        .join(" · "),
      slotLabel: [timeLabel, teacher ? `Teacher: ${teacher}` : "", row?.status ? `Status: ${row.status}` : ""]
        .filter(Boolean)
        .join(" · "),
      _raw: row,
    };
  };

  const handleInitiateExam = (exam) => {
    const scheduleId = exam?._raw?.id;
    if (!scheduleId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    void (async () => {
      try {
        const res = await fetch(`/api/exam-schedules/${scheduleId}/initiate-online`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to initiate online exam");
        await Swal.fire({
          icon: "success",
          title: "Online exam initiated",
          text: "Exam session is now marked live.",
          confirmButtonColor: accent,
        });
        await load();
      } catch (error) {
        void Swal.fire({
          icon: "error",
          title: "Could not initiate",
          text: error?.message || "Please try again.",
          confirmButtonColor: accent,
        });
      }
    })();
  };

  return (
    <Box sx={(theme) => ({ ...fullMainBleedSx(theme) })}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #f97316 100%)`,
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
          <QuizOutlined sx={{ fontSize: 34 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Elimu Plus · Online
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Online exams
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
              Scheduled online invigilated exams listed the same way as lessons. Use Initiate when the session is ready.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          py: 3,
          pb: 4,
          px: { xs: 1, sm: 1.5, md: 2 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : exams.length === 0 ? (
          <EmptyListNotice>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                No online exams scheduled yet. Create exam schedules with proctoring/online setup to list them here.
              </Typography>
              <Button
                variant="outlined"
                size="medium"
                onClick={() => navigate(`/timetable/day/${todayIso}?tab=exams`)}
                sx={{ alignSelf: "flex-start", borderColor: accent, color: accentDark, fontWeight: 700 }}
              >
                Open exam calendar (today)
              </Button>
            </Stack>
          </EmptyListNotice>
        ) : (
          <SessionsGrid>
            {exams.map((row) => {
              const exam = toCardExam(row);
              return (
              <SessionGridItem key={exam.id}>
                <ExamOnlineCard exam={exam} onInitiate={handleInitiateExam} />
              </SessionGridItem>
              );
            })}
          </SessionsGrid>
        )}
      </Box>
    </Box>
  );
}
