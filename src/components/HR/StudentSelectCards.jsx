import React from "react";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  Checkbox,
  Grid,
  Typography,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

function profilePhotoUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function studentDisplayName(s) {
  const u = s?.user || {};
  return u.full_name || u.username || "Student";
}

/**
 * Checkable student cards — 4 per row on sm+ screens, equal height.
 */
export default function StudentSelectCards({ students = [], selectedIds = [], onChange, disabled = false }) {
  const selectedSet = new Set(selectedIds);

  const toggle = (id) => {
    if (disabled) return;
    const next = selectedSet.has(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    onChange(next);
  };

  if (!students.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
        No students available to link.
      </Typography>
    );
  }

  return (
    <Grid container spacing={2}>
      {students.map((s) => {
        const checked = selectedSet.has(s.id);
        const photo = profilePhotoUrl(s.profile_picture);
        const name = studentDisplayName(s);
        return (
          <Grid item xs={6} sm={3} key={s.id}>
            <Card
              elevation={0}
              sx={{
                height: 168,
                border: `2px solid ${checked ? accent : accentLight}`,
                borderRadius: 2,
                bgcolor: checked ? "#fff5f5" : "#fff",
                transition: "border-color 0.15s, background-color 0.15s",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <CardActionArea
                onClick={() => toggle(s.id)}
                disabled={disabled}
                sx={{ height: "100%", p: 1.5, display: "flex", alignItems: "stretch" }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                    position: "relative",
                  }}
                >
                  <Checkbox
                    checked={checked}
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      p: 0,
                      color: accentLight,
                      "&.Mui-checked": { color: accent },
                    }}
                  />
                  <Avatar
                    src={photo || undefined}
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: `${accent}18`,
                      color: accentDark,
                      fontWeight: 700,
                    }}
                  >
                    {!photo ? name.charAt(0).toUpperCase() : <PersonIcon />}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.25,
                      px: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: "100%" }}>
                    {s.admission_number || "—"}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
