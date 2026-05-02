import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { Event, AttachMoney, Business, PersonAdd, Description, Work } from "@mui/icons-material";
import TrainingEvents from "./TrainingEvents/TrainingEvents";
import Grants from "./Grants/Grants";
import Partners from "./Partners/Partners";
import TrainingRegistrations from "./TrainingRegistrations/TrainingRegistrations";
import GrantApplications from "./GrantApplications/GrantApplications";
import JobOpportunities from "./JobOpportunities/JobOpportunities";

function TabLabel({ icon, label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon}
      <span>{label}</span>
    </Box>
  );
}

export default function TrainingOpportunities() {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
        }}
      >
        <Tab label={<TabLabel icon={<Event fontSize="small" />} label="Training Events" />} />
        <Tab label={<TabLabel icon={<AttachMoney fontSize="small" />} label="Grants" />} />
        <Tab label={<TabLabel icon={<Business fontSize="small" />} label="Partners" />} />
        <Tab label={<TabLabel icon={<PersonAdd fontSize="small" />} label="Registrations" />} />
        <Tab label={<TabLabel icon={<Description fontSize="small" />} label="Grant Applications" />} />
        <Tab label={<TabLabel icon={<Work fontSize="small" />} label="Job Opportunities" />} />
      </Tabs>

      {subTab === 0 && <TrainingEvents />}
      {subTab === 1 && <Grants />}
      {subTab === 2 && <Partners />}
      {subTab === 3 && <TrainingRegistrations />}
      {subTab === 4 && <GrantApplications />}
      {subTab === 5 && <JobOpportunities />}
    </Box>
  );
}
