import React, { useState } from "react";
import { Box } from "@mui/material";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import AddIcon from "@mui/icons-material/Add";
import ExamTemplatesTab from "../components/Exams/ExamTemplatesTab";
import ExamsTab from "../components/Exams/ExamsTab";
import ExamProctorMonitorTab from "../components/Exams/ExamProctorMonitorTab";
import ExamReportCardsTab from "../components/Exams/ExamReportCardsTab";
import { elimuViewportSx, fullMainBleedSx, warmCream, EXAM_TABS } from "../components/Exams/examShared";
import { ExamHero, ExamTabs, HeroActionButton } from "../components/Exams/examUi";

export default function ExamManagementPage() {
  const [tab, setTab] = useState(0);
  const isCreateTab = tab === 0 || tab === 1;
  const actionLabel = tab === 0 ? "Create template" : tab === 1 ? "Create exam" : "";

  const onHeaderCreate = () => {
    if (!isCreateTab) return;
    const eventName = tab === 0 ? "exam-templates:create" : "exams:create";
    window.dispatchEvent(new CustomEvent(eventName));
  };

  const heroActions = isCreateTab ? (
    <HeroActionButton startIcon={<AddIcon />} onClick={onHeaderCreate}>
      {actionLabel}
    </HeroActionButton>
  ) : null;

  const tabIcons = [
    <DescriptionOutlinedIcon sx={{ fontSize: 18 }} />,
    <AssignmentOutlinedIcon sx={{ fontSize: 18 }} />,
    <MonitorHeartOutlinedIcon sx={{ fontSize: 18 }} />,
    <SummarizeOutlinedIcon sx={{ fontSize: 18 }} />,
  ];

  return (
    <Box
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
      <ExamHero
        title="Exams"
        subtitle="Templates, scheduled exams, live proctoring, and report cards — everything for assessment in one place."
        icon={<QuizOutlinedIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={heroActions}
      />

      <ExamTabs
        activeTab={tab}
        onChange={setTab}
        tabs={EXAM_TABS.map((t, i) => ({ label: t.label, value: t.value, icon: tabIcons[i] })).map((t) => ({
          label: t.label,
          value: t.value,
        }))}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 ? <ExamTemplatesTab /> : null}
        {tab === 1 ? <ExamsTab /> : null}
        {tab === 2 ? <ExamProctorMonitorTab /> : null}
        {tab === 3 ? <ExamReportCardsTab /> : null}
      </Box>
    </Box>
  );
}
