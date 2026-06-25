import React from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  CircularProgress,
  TableContainer,
} from "@mui/material";
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
  tableContainerSx,
  tableHeadRowSx,
  tablePaginationSx,
  primaryBtnSx,
  ghostBtnSx,
} from "./elimuPlusShared";
export {
  PremiumDialog,
  DetailField,
  FormSection,
  HeroActionButton,
} from "../Users/usersUi";

export function ElimuPlusHero({ title, subtitle, icon, actions }) {
  return (
    <Box
      sx={{
        borderRadius: { xs: "20px", sm: "24px" },
        p: { xs: 2, sm: 2.5 },
        background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 55%, #7F1D1D 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px -12px rgba(220,38,38,0.45)",
        flexShrink: 0,
      }}
    >
      <Box sx={{ position: "absolute", top: -50, right: -30, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)" }} />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Stack direction="row" spacing={1.75} alignItems="center">
          {icon ? (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box>
            <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: { xs: "1.35rem", sm: "1.65rem" }, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontFamily: fontBody, fontSize: "0.88rem", opacity: 0.88, mt: 0.35, maxWidth: 520 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {actions ? (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap" useFlexGap sx={{ flexShrink: 0 }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export function ElimuPlusTabs({ activeTab, onChange, tabs }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        overflowX: "auto",
        py: 0.5,
        flexShrink: 0,
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
              boxShadow: selected ? "0 4px 14px rgba(220,38,38,0.3)" : "0 2px 8px rgba(28,25,23,0.04)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: selected ? primaryDark : warmCream,
                color: selected ? "#fff" : textPrimary,
              },
            }}
          />
        );
      })}
    </Box>
  );
}

export function DataTableShell({ children, pagination }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <TableContainer sx={{ ...tableContainerSx, flex: 1, minHeight: 0, overflow: "auto" }}>
        {children}
      </TableContainer>
      {pagination ? <Box sx={{ flexShrink: 0 }}>{pagination}</Box> : null}
    </Box>
  );
}

export { tableHeadRowSx, tablePaginationSx };

export function TabPanelShell({ children, loading, error, onDismissError }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", pt: 0.5 }}>
      {error ? (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            borderRadius: "14px",
            bgcolor: "#FEF2F2",
            border: "1px solid rgba(220,38,38,0.2)",
            color: primaryDark,
            fontFamily: fontBody,
            fontSize: "0.88rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {error}
          {onDismissError ? (
            <Button size="small" onClick={onDismissError} sx={{ color: primaryRed, fontWeight: 700, textTransform: "none" }}>
              Dismiss
            </Button>
          ) : null}
        </Box>
      ) : null}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        children
      )}
    </Box>
  );
}

export function DialogPrimaryButton({ children, loading, ...props }) {
  return (
    <Button
      variant="contained"
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : props.startIcon}
      sx={{ ...primaryBtnSx, minWidth: 120, ...props.sx }}
      {...props}
    >
      {loading ? "Saving…" : children}
    </Button>
  );
}

export function DialogGhostButton({ children, ...props }) {
  return (
    <Button variant="text" sx={{ ...ghostBtnSx, ...props.sx }} {...props}>
      {children}
    </Button>
  );
}

export function SocialLinkChip({ icon, label, href }) {
  if (!href) return null;
  return (
    <Chip
      icon={icon}
      component="a"
      clickable
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      label={label}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.78rem",
        bgcolor: warmCream,
        color: primaryDark,
        border: `1px solid rgba(220,38,38,0.15)`,
        textDecoration: "none",
        "& .MuiChip-icon": { color: primaryRed },
        "&:hover": { bgcolor: primaryLight, borderColor: primaryRed },
      }}
    />
  );
}

export function EmptyTableRow({ colSpan, message }) {
  return (
    <Typography
      sx={{
        py: 5,
        textAlign: "center",
        fontFamily: fontBody,
        color: textMuted,
        fontWeight: 500,
        fontSize: "0.92rem",
      }}
    >
      {message}
    </Typography>
  );
}
