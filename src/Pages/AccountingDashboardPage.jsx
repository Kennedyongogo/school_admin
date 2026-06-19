import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AddIcon from "@mui/icons-material/Add";
import CurriculumFeeStructuresTab from "../components/Curriculum/CurriculumFeeStructuresTab";
import FeeInvoicesTab from "../components/Curriculum/FeeInvoicesTab";
import FeePaymentsTab from "../components/Curriculum/FeePaymentsTab";
import FeeReceiptsTab from "../components/Curriculum/FeeReceiptsTab";
import AccountingOverviewTab from "../components/Curriculum/AccountingOverviewTab";
import { elimuViewportSx, fullMainBleedSx, warmCream } from "../components/Accounting/accountingShared";
import {
  AccountingHero,
  AccountingTabsRow,
  AccountingTabSearchField,
  HeroActionButton,
} from "../components/Accounting/accountingUi";

export default function AccountingDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const [invoiceGenOpen, setInvoiceGenOpen] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");

  useEffect(() => {
    if (location.state?.tab != null) {
      setTab(Number(location.state.tab) || 0);
    }
  }, [location.state?.tab]);

  const heroActions =
    tab === 1 ? (
      <HeroActionButton startIcon={<AddIcon />} onClick={() => navigate("/accounting/fee-structures/create")}>
        Create fee structure
      </HeroActionButton>
    ) : tab === 2 ? (
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

      <AccountingTabsRow
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { label: "Dashboard", value: 0 },
          { label: "Fee structures", value: 1 },
          { label: "Invoices", value: 2 },
          { label: "Fee payments", value: 3 },
          { label: "Receipts", value: 4 },
        ]}
        trailing={
          tab === 3 ? (
            <AccountingTabSearchField
              value={paymentSearch}
              onChange={(value) => {
                setPaymentSearch(value);
              }}
              placeholder="Search student, invoice, receipt, reference…"
            />
          ) : null
        }
      />

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === 0 ? <AccountingOverviewTab /> : null}
        {tab === 1 ? <CurriculumFeeStructuresTab /> : null}
        {tab === 2 ? (
          <FeeInvoicesTab genOpen={invoiceGenOpen} onGenOpenChange={setInvoiceGenOpen} />
        ) : null}
        {tab === 3 ? <FeePaymentsTab search={paymentSearch} /> : null}
        {tab === 4 ? <FeeReceiptsTab /> : null}
      </Box>
    </Box>
  );
}
