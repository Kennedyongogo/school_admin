import React, { useState } from "react";
import { Box, Typography, Paper, Tabs, Tab } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Campaign from "@mui/icons-material/Campaign";
import ContactMail from "@mui/icons-material/ContactMail";
import RequestQuote from "@mui/icons-material/RequestQuote";
import EventAvailable from "@mui/icons-material/EventAvailable";
import Newsletter from "../Newsletter/Newsletter";
import Contacts from "../Contacts/Contacts";
import Quotations from "../Quotations/Quotations";
import Consultations from "../Consultations/Consultations";

export default function Submissions() {
  const [tab, setTab] = useState("newsletter");

  const handleChange = (_, newValue) => {
    setTab(newValue);
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        p: { xs: 0.5, sm: 0.5, md: 0.5 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            Submissions
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Newsletter, contact inquiries, quotation requests, and consultation bookings
          </Typography>
        </Box>

        <TabContext value={tab}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
            <TabList
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
                "& .Mui-selected": { color: "#B85C38" },
                "& .MuiTabs-indicator": { backgroundColor: "#B85C38" },
              }}
            >
              <Tab
                value="newsletter"
                label="Newsletter"
                icon={<Campaign sx={{ fontSize: 20 }} />}
                iconPosition="start"
              />
              <Tab
                value="contacts"
                label="Contacts"
                icon={<ContactMail sx={{ fontSize: 20 }} />}
                iconPosition="start"
              />
              <Tab
                value="quotations"
                label="Quotations"
                icon={<RequestQuote sx={{ fontSize: 20 }} />}
                iconPosition="start"
              />
              <Tab
                value="consultations"
                label="Consultations"
                icon={<EventAvailable sx={{ fontSize: 20 }} />}
                iconPosition="start"
              />
            </TabList>
          </Box>

          <TabPanel value="newsletter" sx={{ p: 0 }}>
            <Newsletter embedded />
          </TabPanel>
          <TabPanel value="contacts" sx={{ p: 0 }}>
            <Contacts embedded />
          </TabPanel>
          <TabPanel value="quotations" sx={{ p: 0 }}>
            <Quotations embedded />
          </TabPanel>
          <TabPanel value="consultations" sx={{ p: 0 }}>
            <Consultations embedded />
          </TabPanel>
        </TabContext>
      </Paper>
    </Box>
  );
}
