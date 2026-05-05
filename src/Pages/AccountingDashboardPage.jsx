import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import SavingsIcon from "@mui/icons-material/Savings";
import CurriculumFeeStructuresTab from "../components/Curriculum/CurriculumFeeStructuresTab";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const backgroundLight = "#FEF2F2";

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: theme.spacing(-2.5),
  marginBottom: "1px",
  boxSizing: "border-box",
});

function Placeholder({ title }) {
  return (
    <Box sx={{ p: 3, border: "1px dashed #fca5a5", borderRadius: 2, bgcolor: "#fff" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: primaryDark }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        This section is ready for the next implementation.
      </Typography>
    </Box>
  );
}

export default function AccountingDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 40%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.25 },
          color: "white",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AccountBalanceIcon sx={{ fontSize: { xs: 36, sm: 42 }, opacity: 0.95 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.35rem", sm: "2rem" } }}>
                Accounting Dashboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25 }}>
                Manage billing setup, fees and payment operations.
              </Typography>
            </Box>
          </Stack>
          {tab === 0 ? (
            <Button
              variant="contained"
              onClick={() => navigate("/accounting/fee-structures/create")}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Create fee structure
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            minHeight: 44,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700, minHeight: 44, color: primaryDark, "&.Mui-selected": { color: primaryRed } },
            "& .MuiTabs-indicator": { bgcolor: primaryRed, height: 3, borderRadius: 1 },
          }}
        >
          <Tab icon={<SavingsIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Fee structures" />
          <Tab icon={<ReceiptLongIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Invoices" />
          <Tab icon={<PaidIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Collections" />
        </Tabs>

        {tab === 0 ? <CurriculumFeeStructuresTab /> : null}
        {tab === 1 ? <Placeholder title="Invoices" /> : null}
        {tab === 2 ? <Placeholder title="Collections" /> : null}
      </Box>
    </Box>
  );
}
