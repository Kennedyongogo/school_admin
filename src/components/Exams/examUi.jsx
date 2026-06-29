import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  fontBody,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textSecondary,
  textMuted,
  inputSx,
  actionIconSx,
  EXAM_STATUS,
  SESSION_STATUS,
  examPanelCardSx,
} from "./examShared";

export {
  CurriculumHero as ExamHero,
  CurriculumTabs as ExamTabs,
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

export function ExamStatusChip({ status }) {
  const key = String(status || "draft").toLowerCase();
  const cfg = EXAM_STATUS[key] || { label: status || "—", color: textSecondary, bg: warmCream };
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

export function SessionStatusChip({ status }) {
  const key = String(status || "").toLowerCase();
  const cfg = SESSION_STATUS[key] || { label: status || "—", color: textSecondary, bg: warmCream };
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

export function ExamTypeChip({ examType }) {
  const isPdf = String(examType || "") === "pdf_form";
  return (
    <Chip
      size="small"
      label={isPdf ? "PDF form" : "Online"}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.68rem",
        ml: 0.75,
        bgcolor: isPdf ? "#FEF3C7" : "#EEF2FF",
        color: isPdf ? "#B45309" : "#4338CA",
        border: `1px solid ${isPdf ? "#F59E0B33" : "#6366F133"}`,
      }}
    />
  );
}

export function ExamInfoBanner({ children }) {
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

export function ExamFilterBar({ children, onRefresh, extra }) {
  return (
    <Box sx={{ ...examPanelCardSx, p: { xs: 1.5, sm: 2 } }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "flex-end" }}>
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 1.5,
            width: "100%",
            minWidth: 0,
          }}
        >
          {children}
        </Box>
        <Stack direction="row" spacing={1} flexShrink={0}>
          {extra}
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
              }}
            >
              Refresh
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}

export function FilterField({ label, ...props }) {
  return <TextField fullWidth size="small" label={label} sx={inputSx} {...props} />;
}

/** Static label above input — avoids floating-label clipping in tight toolbars. */
export function MarkingScoreField({ label, value, onChange, disabled, width = 156, sx, inputProps, ...props }) {
  const displayValue = value === "" || value == null ? "" : String(value);
  return (
    <Box sx={{ width, minWidth: width, maxWidth: width, flexShrink: 0 }}>
      <Typography
        component="label"
        variant="caption"
        sx={{
          display: "block",
          mb: 0.5,
          fontWeight: 600,
          color: "text.secondary",
          fontSize: "0.75rem",
          lineHeight: 1.25,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <TextField
        size="small"
        type="number"
        fullWidth
        value={displayValue}
        onChange={onChange}
        disabled={disabled}
        inputProps={{ min: 0, step: 0.01, "aria-label": label, ...inputProps }}
        sx={{
          "& .MuiInputBase-root": {
            height: 40,
          },
          ...sx,
        }}
        {...props}
      />
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

export function ExamSectionHeader({ title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1.5}
      sx={{ mb: 0.5 }}
    >
      <Box>
        <Typography sx={{ fontFamily: fontBody, fontWeight: 800, fontSize: "1.05rem", color: primaryDark }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.84rem", color: textMuted, mt: 0.25 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Stack direction="row" spacing={1} flexWrap="wrap">{actions}</Stack> : null}
    </Stack>
  );
}

export function ExamToolbar({ title, subtitle, onBack, actions }) {
  return (
    <Box
      sx={{
        ...examPanelCardSx,
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {onBack ? (
          <Button
            variant="outlined"
            startIcon={null}
            onClick={onBack}
            sx={{
              minWidth: 40,
              px: 1.25,
              borderColor: primaryLight,
              color: primaryDark,
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "12px",
            }}
          >
            ← Back
          </Button>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fontBody, fontWeight: 800, fontSize: "1.1rem", color: primaryDark }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.82rem", color: textMuted }}>{subtitle}</Typography>
          ) : null}
        </Box>
      </Stack>
      {actions ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {actions}
        </Stack>
      ) : null}
    </Box>
  );
}

export function ExamActionIcon({ title, onClick, disabled, children, color = "default" }) {
  const sx =
    color === "error"
      ? { ...actionIconSx, color: primaryRed, "&:hover": { bgcolor: primaryLight } }
      : { ...actionIconSx, color: primaryDark, "&:hover": { bgcolor: primaryLight, color: primaryRed } };
  return (
    <Tooltip title={title || ""}>
      <span>
        <IconButton size="small" onClick={onClick} disabled={disabled} sx={sx}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function ExamSummaryChips({ items }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      {(items || []).map((item) => (
        <Chip
          key={item.label}
          size="small"
          label={`${item.label}: ${item.value}`}
          sx={{
            fontFamily: fontBody,
            fontWeight: 700,
            fontSize: "0.75rem",
            bgcolor: item.tone === "success" ? "#DCFCE7" : item.tone === "warn" ? "#FEF3C7" : warmCream,
            color: item.tone === "success" ? "#16a34a" : item.tone === "warn" ? "#B45309" : primaryDark,
            border: `1px solid ${primaryLight}`,
          }}
        />
      ))}
    </Stack>
  );
}

export function ExamPanelCard({ children, sx, noPadding }) {
  return (
    <Box sx={{ ...examPanelCardSx, ...(noPadding ? {} : { p: { xs: 1.5, sm: 2 } }), ...sx }}>
      {children}
    </Box>
  );
}

export function ExamPrimaryButton({ children, ...props }) {
  return (
    <Button
      variant="contained"
      sx={{
        bgcolor: primaryRed,
        fontWeight: 700,
        textTransform: "none",
        borderRadius: "12px",
        boxShadow: "0 8px 20px -6px rgba(220,38,38,0.45)",
        "&:hover": { bgcolor: primaryDark },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function ExamGhostButton({ children, ...props }) {
  return (
    <Button
      variant="outlined"
      sx={{
        borderColor: primaryLight,
        color: primaryDark,
        fontWeight: 700,
        textTransform: "none",
        borderRadius: "12px",
        "&:hover": { borderColor: primaryRed, bgcolor: warmCream },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
