import React from "react";
import { Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { fullMainBleedSx, elimuViewportSx, warmCream } from "../components/Exams/examShared";
import { ExamHero, HeroActionButton } from "../components/Exams/examUi";
import AssignmentsTab from "../components/Assignments/AssignmentsTab";

export default function AssignmentManagementPage() {
  const onHeaderCreate = () => {
    window.dispatchEvent(new CustomEvent("assignments:create"));
  };

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
        title="Assignments"
        subtitle="Create homework for your class, collect submissions, and mark student work."
        actions={
          <HeroActionButton startIcon={<AddIcon />} onClick={onHeaderCreate}>
            New assignment
          </HeroActionButton>
        }
      />
      <AssignmentsTab />
    </Box>
  );
}
