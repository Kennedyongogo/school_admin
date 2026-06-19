import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import { ElimuPlusTabs } from "../SchoolProfile/elimuPlusUi";
import {
  fontBody,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textSecondary,
  inputSx,
  sumFeeItems,
} from "./accountingShared";

export {
  CurriculumHero as AccountingHero,
  CurriculumTabs as AccountingTabs,
  PremiumDialog,
  DetailField,
  FormSection,
  HeroActionButton,
  DataTableShell,
  TabPanelShell,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  tableHeadRowSx,
  tablePaginationSx,
} from "../Curriculum/curriculumUi";

/** Tabs with optional trailing slot (e.g. search) aligned on the same row. */
export function AccountingTabsRow({ activeTab, onChange, tabs, trailing }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        alignItems: { lg: "center" },
        justifyContent: "space-between",
        gap: 1.5,
        flexShrink: 0,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <ElimuPlusTabs activeTab={activeTab} onChange={onChange} tabs={tabs} />
      </Box>
      {trailing ? (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", lg: "auto" }, minWidth: { lg: 280 } }}>{trailing}</Box>
      ) : null}
    </Box>
  );
}

export function AccountingTabSearchField({ value, onChange, placeholder = "Search…" }) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ fontSize: 20, color: textSecondary }} />
          </InputAdornment>
        ),
      }}
      sx={{
        ...inputSx,
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
          bgcolor: "#fff",
          fontFamily: fontBody,
        },
      }}
    />
  );
}

const INVOICE_STATUS = {
  paid: { label: "Paid", color: "#16a34a", bg: "#DCFCE7" },
  partial: { label: "Partial", color: "#D97706", bg: "#FEF3C7" },
  sent: { label: "Sent", color: "#2563EB", bg: "#DBEAFE" },
  draft: { label: "Draft", color: textSecondary, bg: warmCream },
  cancelled: { label: "Cancelled", color: "#6B7280", bg: "#F3F4F6" },
};

export function InvoiceStatusChip({ status }) {
  const key = String(status || "").toLowerCase();
  const cfg = INVOICE_STATUS[key] || { label: status || "—", color: textSecondary, bg: warmCream };
  return (
    <Chip
      size="small"
      label={cfg.label}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.72rem",
        bgcolor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}22`,
      }}
    />
  );
}

export function PaymentMethodChip({ method }) {
  const m = String(method || "manual").toLowerCase();
  const isMpesa = m === "mpesa";
  return (
    <Chip
      size="small"
      label={isMpesa ? "M-Pesa" : m}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.72rem",
        textTransform: "capitalize",
        bgcolor: isMpesa ? "#ECFDF5" : warmCream,
        color: isMpesa ? "#059669" : textSecondary,
        border: `1px solid ${isMpesa ? "#05966933" : "rgba(220,38,38,0.12)"}`,
      }}
    />
  );
}

export function AccountingInfoBanner({ children }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "16px",
        bgcolor: "#FFFBF7",
        border: `1px solid ${primaryLight}`,
        fontFamily: fontBody,
        fontSize: "0.88rem",
        color: textSecondary,
        lineHeight: 1.55,
      }}
    >
      {children}
    </Box>
  );
}

export function AccountingFilterBar({ children, onRefresh }) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: "18px",
        bgcolor: "#fff",
        border: `1px solid ${primaryLight}`,
        boxShadow: "0 8px 28px -16px rgba(220,38,38,0.2)",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-end" }}>
        <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
          {children}
        </Box>
        {onRefresh ? (
          <Button
            variant="outlined"
            onClick={onRefresh}
            sx={{
              borderColor: primaryRed,
              color: primaryDark,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "12px",
              px: 2.5,
              flexShrink: 0,
            }}
          >
            Refresh
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export function FilterSelect({ label, value, onChange, children, disabled }) {
  return (
    <FormControl fullWidth size="small" disabled={disabled} sx={inputSx}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={onChange}>
        {children}
      </Select>
    </FormControl>
  );
}

export function FeeBreakdownEditor({ title, halfTarget, items, onChange, onAdd, onRemove }) {
  const total = sumFeeItems(items);
  const diff = Math.abs(total - halfTarget);
  const balanced = diff <= 0.01;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "16px",
        bgcolor: warmCream,
        border: `1px solid ${balanced ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.18)"}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontFamily: fontBody, fontWeight: 800, color: primaryDark, fontSize: "0.95rem" }}>
          {title}
        </Typography>
        <Chip
          size="small"
          label={`Target ${halfTarget.toFixed(2)} · Total ${total.toFixed(2)}`}
          sx={{
            fontWeight: 700,
            bgcolor: balanced ? "#DCFCE7" : "#FEE2E2",
            color: balanced ? "#16a34a" : primaryRed,
          }}
        />
      </Stack>
      <Stack spacing={1.25}>
        {items.map((it, i) => (
          <Stack key={`${title}-${i}`} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <TextField
              label="Item name"
              fullWidth
              size="small"
              value={it.name}
              onChange={(e) => onChange(i, "name", e.target.value)}
              sx={inputSx}
            />
            <TextField
              label="Amount"
              type="number"
              size="small"
              inputProps={{ min: 0, step: "0.01" }}
              value={it.amount}
              onChange={(e) => onChange(i, "amount", e.target.value)}
              sx={{ ...inputSx, minWidth: { sm: 140 } }}
            />
            <IconButton
              disabled={items.length <= 1}
              onClick={() => onRemove(i)}
              sx={{ color: primaryRed, alignSelf: { xs: "flex-end", sm: "center" } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={onAdd}
        sx={{
          mt: 1.5,
          borderColor: primaryRed,
          color: primaryDark,
          fontWeight: 700,
          textTransform: "none",
          borderRadius: "10px",
        }}
      >
        Add line item
      </Button>
    </Box>
  );
}

export function FeeBreakdownView({ breakdown }) {
  if (!Array.isArray(breakdown) || !breakdown.length) return null;
  return (
    <Stack spacing={1.25}>
      {breakdown.map((phase) => (
        <Box
          key={phase.phase}
          sx={{
            p: 1.5,
            borderRadius: "14px",
            bgcolor: "#fff",
            border: `1px solid ${primaryLight}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: primaryDark, fontSize: "0.88rem" }}>
              {phase.phase === "first_half" ? "First half" : phase.phase === "second_half" ? "Second half" : phase.phase}
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>KES {Number(phase.amount || 0).toLocaleString()}</Typography>
          </Stack>
          <Stack spacing={0.5}>
            {(Array.isArray(phase.items) ? phase.items : []).map((it, i) => (
              <Stack key={`${phase.phase}-${i}`} direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  {it.name || "Item"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  KES {Number(it.amount || 0).toLocaleString()}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

export function InvoiceAmountSummary({ termFee, amountPaid, balance, creditBalance }) {
  const cards = [
    {
      label: "Total term fee",
      value: termFee,
      hint: "Full fee for this term/level (fixed when the invoice was created)",
    },
    {
      label: "Paid so far",
      value: amountPaid,
      hint: "Sum of all payments recorded on this invoice",
    },
    {
      label: "Outstanding balance",
      value: balance,
      highlight: true,
      hint: "Amount the family still needs to pay",
    },
  ];

  return (
    <Box>
      <AccountingInfoBanner>
        <strong>How to read these amounts:</strong> The term fee is the total bill for this term/level. Payments reduce
        the balance until it reaches zero. &ldquo;Amount due&rdquo; is not shown separately because it matches the term fee
        when the invoice is created.
      </AccountingInfoBanner>
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {cards.map((card) => (
          <Box
            key={card.label}
            sx={{
              p: 2,
              borderRadius: "16px",
              bgcolor: card.highlight ? "#FFFBF7" : "#fff",
              border: `1px solid ${card.highlight ? primaryRed : primaryLight}`,
              boxShadow: card.highlight ? "0 8px 24px -16px rgba(220,38,38,0.25)" : "none",
            }}
          >
            <Typography
              sx={{
                fontFamily: fontBody,
                fontSize: "0.68rem",
                fontWeight: 800,
                color: textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                mb: 0.75,
              }}
            >
              {card.label}
            </Typography>
            <Typography sx={{ fontFamily: fontBody, fontWeight: 800, fontSize: "1.35rem", color: primaryDark }}>
              KES {Number(card.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: textSecondary, lineHeight: 1.45 }}>
              {card.hint}
            </Typography>
          </Box>
        ))}
      </Box>
      {Number(creditBalance) > 0.01 ? (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: "14px",
            bgcolor: "#ECFDF5",
            border: "1px solid rgba(22,163,74,0.25)",
          }}
        >
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.88rem", color: "#166534" }}>
            Level credit from overpayment: <strong>KES {Number(creditBalance).toLocaleString()}</strong>
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
