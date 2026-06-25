import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  Avatar,
  Button,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
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
  roleChipColor,
  formatRole,
  getInitials,
} from "./usersShared";

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function UsersHero({ title, subtitle, actions, icon, delay = 0 }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      sx={{
        borderRadius: "24px",
        p: { xs: 2.5, sm: 3 },
        background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 55%, #7F1D1D 100%)`,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px -12px rgba(220,38,38,0.45)",
        mb: 3,
      }}
    >
      <Box sx={{ position: "absolute", top: -40, right: -20, width: 180, height: 180, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {icon ? (
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "16px",
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
            <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: { xs: "1.5rem", sm: "1.85rem" }, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontFamily: fontBody, fontSize: "0.9rem", opacity: 0.88, mt: 0.5, maxWidth: 520 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {actions ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export function RoleTabs({ activeTab, onChange, tabs }) {
  return (
    <Box
      component={motion.div}
      variants={fadeUp}
      custom={1}
      initial="hidden"
      animate="visible"
      sx={{
        display: "flex",
        gap: 0.75,
        overflowX: "auto",
        pb: 0.5,
        mb: 2.5,
        "&::-webkit-scrollbar": { height: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(220,38,38,0.25)", borderRadius: 4 },
      }}
    >
      {tabs.map((tab, i) => {
        const selected = activeTab === i;
        return (
          <Chip
            key={tab.label}
            label={tab.label}
            onClick={() => onChange(null, i)}
            sx={{
              fontFamily: fontBody,
              fontWeight: selected ? 700 : 600,
              fontSize: "0.82rem",
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

export function PremiumDialog({ open, onClose, title, subtitle, icon, children, footer, maxWidth = "sm" }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        backdrop: { sx: { bgcolor: "transparent" } },
        paper: {
          sx: {
            borderRadius: "24px",
            overflow: "hidden",
            bgcolor: "#fff",
            boxShadow: "0 24px 64px -12px rgba(28,25,23,0.22)",
            border: "1px solid rgba(220,38,38,0.08)",
          },
        },
      }}
    >
      <Box sx={{ px: 3, pt: 3, pb: 1, position: "relative" }}>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            bgcolor: warmCream,
            color: textSecondary,
            "&:hover": { bgcolor: primaryLight, color: primaryRed },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pr: 5 }}>
          {icon ? (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "14px",
                background: `linear-gradient(145deg, ${primaryRed}, ${primaryDark})`,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(220,38,38,0.35)",
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box>
            <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.3rem", color: textPrimary, letterSpacing: "-0.02em" }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ fontFamily: fontBody, fontSize: "0.85rem", color: textSecondary, mt: 0.25 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      </Box>
      <DialogContent sx={{ px: 3, pt: 2, pb: footer ? 1 : 3 }}>{children}</DialogContent>
      {footer ? (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(220,38,38,0.06)",
            bgcolor: warmCream,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          {footer}
        </Box>
      ) : null}
    </Dialog>
  );
}

export function DetailField({ icon, label, value, compact = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: compact ? 1 : 1.5,
        alignItems: "flex-start",
        p: compact ? 1 : 1.75,
        borderRadius: compact ? "12px" : "14px",
        bgcolor: warmCream,
        border: "1px solid rgba(220,38,38,0.08)",
        height: compact ? "100%" : undefined,
        minHeight: 0,
      }}
    >
      <Box sx={{ color: primaryRed, mt: compact ? 0.1 : 0.15, "& svg": { fontSize: compact ? "1rem" : undefined } }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontFamily: fontBody,
            fontSize: compact ? "0.62rem" : "0.68rem",
            fontWeight: 700,
            color: textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: fontBody,
            fontWeight: 600,
            fontSize: compact ? "0.82rem" : undefined,
            color: textPrimary,
            mt: 0.2,
            wordBreak: "break-word",
            lineHeight: 1.35,
            display: compact ? "-webkit-box" : "block",
            WebkitLineClamp: compact ? 2 : undefined,
            WebkitBoxOrient: compact ? "vertical" : undefined,
            overflow: compact ? "hidden" : undefined,
          }}
        >
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

export function UserAvatar({ name, size = 40 }) {
  const rc = roleChipColor("admin");
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        fontFamily: fontDisplay,
        bgcolor: rc.bg,
        color: "#fff",
        boxShadow: "0 4px 12px rgba(28,25,23,0.12)",
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
}

export function FormSection({ title, children }) {
  return (
    <Box
      sx={{
        borderRadius: "20px",
        border: "1px solid rgba(220,38,38,0.08)",
        bgcolor: "#fff",
        boxShadow: "0 12px 40px -16px rgba(28,25,23,0.1)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid rgba(220,38,38,0.06)", bgcolor: warmCream }}>
        <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.05rem", color: textPrimary }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

export function HeroActionButton({ children, variant = "outlined", ...props }) {
  const isContained = variant === "contained";
  return (
    <Button
      {...props}
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        textTransform: "none",
        borderRadius: "12px",
        px: 2.5,
        py: 1,
        whiteSpace: "nowrap",
        ...(isContained
          ? {
              bgcolor: "rgba(255,255,255,0.95)",
              color: primaryDark,
              boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
              "&:hover": { bgcolor: "#fff", color: primaryRed },
            }
          : {
              borderColor: "rgba(255,255,255,0.5)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.5)",
              "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" },
            }),
        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
}

export function RoleBadge({ role }) {
  const rc = roleChipColor(role);
  return (
    <Chip
      label={formatRole(role)}
      size="small"
      sx={{
        bgcolor: rc.bg,
        color: rc.color,
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.72rem",
        height: 26,
        border: "none",
      }}
    />
  );
}
