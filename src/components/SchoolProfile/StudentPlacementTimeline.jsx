import React, { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SchoolIcon from "@mui/icons-material/School";
import { alpha } from "@mui/material/styles";
import { primaryRed, primaryDark } from "./elimuPlusShared";

const REASON_LABELS = {
  admission: "Admission",
  term_start: "Started term",
  admin_transfer: "Moved by school",
  placement_update: "Placement updated",
  cancelled: "Cancelled",
};

function formatDate(value) {
  if (!value) return "—";
  const s = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function dateRange(entry) {
  const start = formatDate(entry.started_on);
  const end = entry.is_active ? "Present" : formatDate(entry.completed_on);
  return `${start} → ${end}`;
}

function actorLabel(user) {
  if (!user) return null;
  return user.full_name || user.username || user.email || null;
}

function DetailRow({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1.5 }} sx={{ py: 0.45 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700, minWidth: { sm: 108 }, flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, color: primaryDark, lineHeight: 1.45 }}>
        {value}
      </Typography>
    </Stack>
  );
}

function PlacementEntryCard({ entry, defaultExpanded, compact }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const reason = REASON_LABELS[entry.reason] || entry.reason || "Record";
  const isActive = entry.is_active;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${isActive ? alpha(primaryRed, 0.35) : alpha(primaryRed, 0.12)}`,
        bgcolor: isActive ? alpha(primaryRed, 0.05) : "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((open) => !open);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.5,
          px: compact ? 1.25 : 1.5,
          py: compact ? 1.1 : 1.35,
          cursor: "pointer",
          "&:hover": { bgcolor: alpha(primaryRed, 0.04) },
        }}
      >
        <IconButton
          size="small"
          aria-label={expanded ? "Collapse details" : "Expand details"}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((open) => !open);
          }}
          sx={{
            mt: 0.1,
            color: primaryDark,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>

        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: isActive ? primaryRed : alpha(primaryRed, 0.12),
            color: isActive ? "#fff" : primaryDark,
            mt: 0.15,
          }}
        >
          <SchoolIcon sx={{ fontSize: 17 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: compact ? "0.84rem" : "0.9rem",
              color: primaryDark,
              lineHeight: 1.35,
            }}
          >
            {entry.placement_label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35, fontWeight: 600 }}>
            {dateRange(entry)}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
            <Chip size="small" label={reason} variant="outlined" sx={{ fontWeight: 600, height: 22 }} />
            {isActive ? (
              <Chip size="small" label="Current" color="success" sx={{ fontWeight: 700, height: 22 }} />
            ) : null}
          </Stack>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            px: compact ? 1.75 : 2.25,
            pb: compact ? 1.25 : 1.5,
            pt: 0.25,
            borderTop: `1px solid ${alpha(primaryRed, 0.1)}`,
            bgcolor: alpha(primaryRed, 0.02),
          }}
        >
          <DetailRow label="From" value={entry.previous_registration?.placement_label} />
          {entry.previous_registration ? (
            <DetailRow
              label="Previous period"
              value={`${formatDate(entry.previous_registration.started_on)} → ${formatDate(entry.previous_registration.completed_on)}`}
            />
          ) : null}
          <DetailRow label="Term started" value={formatDate(entry.term_start_date)} />
          <DetailRow
            label="Term ends"
            value={entry.term_end_date ? formatDate(entry.term_end_date) : entry.is_active ? "Open" : "—"}
          />
          <DetailRow label="Record status" value={entry.status ? String(entry.status).replace(/_/g, " ") : null} />
          <DetailRow label="Moved by" value={actorLabel(entry.moved_by_user)} />
          <DetailRow label="Recorded on" value={formatDate(entry.created_at)} />
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function StudentPlacementTimeline({
  entries,
  loading,
  error,
  emptyMessage = "No placement history recorded yet.",
  compact = false,
}) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} sx={{ color: primaryRed }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error" sx={{ py: 1 }}>
        {error}
      </Typography>
    );
  }

  if (!entries?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontStyle: "italic" }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {entries.map((entry) => (
        <PlacementEntryCard
          key={entry.id}
          entry={entry}
          compact={compact}
          defaultExpanded={Boolean(entry.is_active)}
        />
      ))}
    </Stack>
  );
}

export { REASON_LABELS, formatDate as formatPlacementDate };
