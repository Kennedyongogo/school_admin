import React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";
import {
  fontBody,
  fontDisplay,
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textPrimary,
  textSecondary,
  textMuted,
  inputSx,
  actionIconSx,
  hrPanelCardSx,
  swalAboveDialog,
  ADMISSION_STATUS,
  ATTENDANCE_STATUS,
  PUBLISH_STATUS,
} from "./hrShared";

export {
  CurriculumHero as HRHero,
  CurriculumTabs as HRTabs,
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

export function hrSwal(options) {
  return Swal.fire({
    confirmButtonColor: primaryDark,
    ...swalAboveDialog,
    ...options,
  });
}

export function HRPanelCard({ children, sx, noPadding }) {
  return (
    <Box sx={{ ...hrPanelCardSx, ...(noPadding ? {} : { p: { xs: 1.5, sm: 2 } }), ...sx }}>
      {children}
    </Box>
  );
}

export function HRStatCard({ icon, label, value, sublabel, accent: accentColor = primaryRed }) {
  return (
    <Box sx={{ ...hrPanelCardSx, p: 2, flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          bgcolor: `${accentColor}0D`,
        }}
      />
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ position: "relative" }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "14px",
            bgcolor: `${accentColor}14`,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.78rem", fontWeight: 700, color: textMuted }}>
            {label}
          </Typography>
          <Typography sx={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: "1.65rem", color: textPrimary, lineHeight: 1.1 }}>
            {value}
          </Typography>
          {sublabel ? (
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.75rem", color: textSecondary, mt: 0.25 }}>
              {sublabel}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

export function HRFilterBar({ children, actions }) {
  return (
    <HRPanelCard noPadding sx={{ p: { xs: 1.5, sm: 2 } }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "flex-end" }}>
        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(auto-fit, minmax(160px, 1fr))" },
            gap: 1.5,
            width: "100%",
            minWidth: 0,
          }}
        >
          {children}
        </Box>
        {actions ? (
          <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </HRPanelCard>
  );
}

export function HRFilterTextField(props) {
  return <TextField fullWidth size="small" sx={inputSx} {...props} />;
}

export function HRFilterSelect({ label, children, ...props }) {
  return (
    <FormControl fullWidth size="small" sx={inputSx}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} {...props}>
        {children}
      </Select>
    </FormControl>
  );
}

export function HRPrimaryButton({ children, ...props }) {
  return (
    <Button
      variant="contained"
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        textTransform: "none",
        borderRadius: "12px",
        px: 2.5,
        bgcolor: primaryRed,
        boxShadow: "0 4px 14px rgba(220,38,38,0.28)",
        "&:hover": { bgcolor: primaryDark },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function HRGhostButton({ children, ...props }) {
  return (
    <Button
      variant="outlined"
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        textTransform: "none",
        borderRadius: "12px",
        px: 2,
        borderColor: primaryLight,
        color: primaryDark,
        "&:hover": { borderColor: primaryRed, bgcolor: warmCream },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

export function HRActionButton({ title, onClick, disabled, children, color = "default" }) {
  const sx =
    color === "error"
      ? { ...actionIconSx, color: primaryRed, "&:hover": { bgcolor: primaryLight } }
      : { ...actionIconSx, color: primaryDark, "&:hover": { bgcolor: primaryLight, color: primaryRed } };
  return (
    <Tooltip title={title || ""} arrow>
      <span>
        <IconButton size="small" onClick={onClick} disabled={disabled} sx={sx}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function HRStatusChip({ status, map, fallbackLabel }) {
  const key = String(status || "").toLowerCase();
  const cfg = map[key] || { label: fallbackLabel || status || "—", color: textSecondary, bg: warmCream };
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

export function HRAdmissionChip({ status }) {
  return <HRStatusChip status={status} map={ADMISSION_STATUS} />;
}

export function HRAttendanceChip({ attended, label }) {
  const key = attended ? "attended" : "pending";
  const cfg = ATTENDANCE_STATUS[key];
  return (
    <Chip
      size="small"
      label={label || cfg.label}
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

export function HRPublishedChip({ published }) {
  return <HRStatusChip status={published ? "published" : "draft"} map={PUBLISH_STATUS} />;
}

export function HRSectionHeader({ title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1.5}
      sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: `1px solid ${primaryLight}`, bgcolor: warmCream }}
    >
      <Box>
        <Typography sx={{ fontFamily: fontBody, fontWeight: 800, fontSize: "1rem", color: primaryDark }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", color: textMuted, mt: 0.2 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Stack direction="row" spacing={1}>{actions}</Stack> : null}
    </Stack>
  );
}

export function HRScopeToggle({ value, onChange, options }) {
  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Chip
            key={opt.value}
            label={opt.label}
            clickable
            onClick={() => onChange(opt.value)}
            sx={{
              fontFamily: fontBody,
              fontWeight: selected ? 700 : 600,
              fontSize: "0.8rem",
              height: 36,
              bgcolor: selected ? primaryRed : "#fff",
              color: selected ? "#fff" : textSecondary,
              border: `1px solid ${selected ? primaryRed : "rgba(220,38,38,0.12)"}`,
              boxShadow: selected ? "0 4px 14px rgba(220,38,38,0.3)" : "0 2px 8px rgba(28,25,23,0.04)",
              "&:hover": { bgcolor: selected ? primaryDark : warmCream },
            }}
          />
        );
      })}
    </Stack>
  );
}

export function HRSubTabs({ activeTab, onChange, tabs }) {
  return (
    <HRPanelCard noPadding sx={{ p: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(220,38,38,0.25)", borderRadius: 4 },
        }}
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.value;
          return (
            <Chip
              key={tab.label}
              label={tab.label}
              onClick={() => onChange(tab.value)}
              sx={{
                fontFamily: fontBody,
                fontWeight: selected ? 700 : 600,
                fontSize: "0.8rem",
                height: 36,
                px: 0.5,
                flexShrink: 0,
                bgcolor: selected ? primaryRed : "#fff",
                color: selected ? "#fff" : textSecondary,
                border: `1px solid ${selected ? primaryRed : "rgba(220,38,38,0.12)"}`,
                boxShadow: selected ? "0 4px 14px rgba(220,38,38,0.3)" : "none",
                "&:hover": { bgcolor: selected ? primaryDark : warmCream },
              }}
            />
          );
        })}
      </Box>
    </HRPanelCard>
  );
}

export function HRTableLoading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress sx={{ color: primaryRed }} />
    </Box>
  );
}

export function HRInfoBanner({ children }) {
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
