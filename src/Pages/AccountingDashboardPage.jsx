import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import SavingsIcon from "@mui/icons-material/Savings";
import AddIcon from "@mui/icons-material/Add";
import CurriculumFeeStructuresTab from "../components/Curriculum/CurriculumFeeStructuresTab";
import FeeInvoicesTab from "../components/Curriculum/FeeInvoicesTab";
import FeePaymentsTab from "../components/Curriculum/FeePaymentsTab";
import { elimuViewportSx, fullMainBleedSx, warmCream } from "../components/Accounting/accountingShared";
import { AccountingHero, AccountingTabs, HeroActionButton } from "../components/Accounting/accountingUi";

export default function AccountingDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [invoiceGenOpen, setInvoiceGenOpen] = useState(false);

  const heroActions =
    tab === 0 ? (
      <HeroActionButton startIcon={<AddIcon />} onClick={() => navigate("/accounting/fee-structures/create")}>
        Create fee structure
      </HeroActionButton>
    ) : tab === 1 ? (
      <HeroActionButton startIcon={<ReceiptLongIcon />} onClick={() => setInvoiceGenOpen(true)}>
        Generate invoice
      </HeroActionButton>
    ) : null;

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
      <AccountingHero
        title="Accounting"
        subtitle="Fee structures, invoices, and M-Pesa payments — billing for your school in one place."
        icon={<AccountBalanceIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={heroActions}
      />

      <AccountingTabs
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { label: "Fee structures", value: 0, icon: <SavingsIcon sx={{ fontSize: 18 }} /> },
          { label: "Invoices", value: 1, icon: <ReceiptLongIcon sx={{ fontSize: 18 }} /> },
          { label: "Fee payments", value: 2, icon: <PaidIcon sx={{ fontSize: 18 }} /> },
        ].map((t) => ({ label: t.label, value: t.value }))}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 ? <CurriculumFeeStructuresTab /> : null}
        {tab === 1 ? (
          <FeeInvoicesTab genOpen={invoiceGenOpen} onGenOpenChange={setInvoiceGenOpen} />
        ) : null}
        {tab === 2 ? <FeePaymentsTab /> : null}
      </Box>
    </Box>
  );
}
