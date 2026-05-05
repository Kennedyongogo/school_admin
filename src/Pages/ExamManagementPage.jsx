import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import QuizOutlined from "@mui/icons-material/QuizOutlined";
import ExamTemplatesTab from "../components/Exams/ExamTemplatesTab";
import ExamsTab from "../components/Exams/ExamsTab";

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

export default function ExamManagementPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

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
          <QuizOutlined sx={{ fontSize: 34 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ opacity: 0.9 }}>
              Elimu Plus
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Exams
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.5 }}>
              Manage exam templates and created exams.
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
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            minHeight: 42,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              minHeight: 42,
              color: accentDark,
              "&.Mui-selected": { color: accent },
            },
            "& .MuiTabs-indicator": { bgcolor: accent, height: 3, borderRadius: 1 },
          }}
        >
          <Tab label="Exam templates" />
          <Tab label="Exam" />
        </Tabs>

        {tab === 0 ? <ExamTemplatesTab /> : <ExamsTab />}
      </Box>
    </Box>
  );
}
