import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardActionArea, Stack, Typography } from "@mui/material";
import VideocamOutlined from "@mui/icons-material/VideocamOutlined";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

export default function ElimuPlusOnlineHub() {
  const navigate = useNavigate();

  const hubCards = [
    {
      key: "classes",
      title: "Online classes",
      subtitle: "Timetable & live slots",
      description:
        "Schedule physical or online lessons, open the calendar by date, and manage attendance from one place.",
      icon: <CalendarMonthOutlined sx={{ fontSize: 42 }} />,
      gradient: `linear-gradient(145deg, #4f4338 0%, #857358 42%, #a0826d 100%)`,
      chipBg: "rgba(242,232,218,0.4)",
      onClick: () => navigate("/elimu-plus-online/lessons"),
    },
    {
      key: "exams",
      title: "Online exams",
      subtitle: "Assessments calendar",
      description:
        "Jump to today’s timetable view with the Exams tab to plan invigilation and online assessment windows.",
      icon: <QuizOutlined sx={{ fontSize: 42 }} />,
      gradient: `linear-gradient(145deg, ${accentDark} 0%, ${accent} 55%, #f97316 120%)`,
      chipBg: "rgba(254,226,226,0.35)",
      onClick: () => navigate("/elimu-plus-online/exams"),
    },
  ];

  return (
    <Box
      sx={{
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
        ml: (theme) => theme.spacing(-3),
        mr: (theme) => theme.spacing(-3),
        mt: (theme) => theme.spacing(-2),
        mb: "1px",
        minHeight: { xs: "calc(100vh - 120px)", md: "calc(100vh - 112px)" },
        maxHeight: { md: "calc(100vh - 112px)" },
        display: "flex",
        flexDirection: "column",
        overflow: { xs: "auto", md: "hidden" },
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 50%, #EA580C 115%)`,
          color: "#fff",
          px: { xs: 2.5, sm: 3 },
          py: { xs: 2, sm: 2.25 },
          boxShadow: `0 12px 40px ${accent}40`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            <VideocamOutlined sx={{ fontSize: 30 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.92, letterSpacing: 1.2, fontWeight: 700 }}>
              Elimu Plus
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
              Online exams & classes
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.94, mt: 0.75, maxWidth: 720 }}>
              Choose <strong>Open</strong> on a card to see upcoming online lessons or online exams in one place — then
              use <strong>Initiate</strong> on each row when you are ready to run that session.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2.5}
        sx={{
          flex: 1,
          minHeight: 0,
          p: { xs: 2, sm: 3 },
          bgcolor: "#faf7f2",
          alignItems: "stretch",
        }}
      >
        {hubCards.map((c) => (
          <Card
            key={c.key}
            elevation={0}
            sx={{
              flex: 1,
              minHeight: { xs: 220, md: 0 },
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid ${accentLight}`,
              boxShadow: "0 18px 48px rgba(15,23,42,0.08)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardActionArea
              onClick={c.onClick}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                minHeight: { xs: 220, md: "100%" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
              }}
            >
              <Box
                sx={{
                  background: c.gradient,
                  color: "#fff",
                  px: 2.5,
                  py: 2,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    bgcolor: c.chipBg,
                    borderRadius: 2,
                    p: 1.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  {c.icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ opacity: 0.92, fontWeight: 700, letterSpacing: 0.8 }}>
                    {c.subtitle}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.25, lineHeight: 1.2 }}>
                    {c.title}
                  </Typography>
                </Box>
              </Box>
              <Stack
                spacing={2}
                sx={{
                  flex: 1,
                  p: 2.5,
                  bgcolor: "#fff",
                  alignItems: "flex-start",
                  textAlign: "left",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {c.description}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ color: accentDark, fontWeight: 800 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    Open
                  </Typography>
                  <ArrowForwardRounded sx={{ fontSize: 20 }} />
                </Stack>
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
