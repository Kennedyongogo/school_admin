import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
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

/** When online exam API exists, replace with fetched rows. */
const PLACEHOLDER_EXAMS = [];

export default function OnlineScheduledExamsPage() {
  const navigate = useNavigate();
  const todayIso = format(new Date(), "yyyy-MM-dd");

  const handleInitiateExam = (exam) => {
    void Swal.fire({
      icon: "info",
      title: "Exam session",
      text: "Session launch will connect here when online exams are scheduled in the system.",
      confirmButtonColor: accent,
    });
    if (exam?.navigateTo) navigate(exam.navigateTo);
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
        {PLACEHOLDER_EXAMS.length === 0 ? (
          <EmptyListNotice>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                No online exams scheduled yet. When exam slots are stored, they will appear here in the same card layout
                as lessons.
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
            {PLACEHOLDER_EXAMS.map((exam) => (
              <SessionGridItem key={exam.id}>
                <ExamOnlineCard exam={exam} onInitiate={handleInitiateExam} />
              </SessionGridItem>
            ))}
          </SessionsGrid>
        )}
      </Box>
    </Box>
  );
}
