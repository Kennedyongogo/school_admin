import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import Person from "@mui/icons-material/Person";
import Email from "@mui/icons-material/Email";
import Phone from "@mui/icons-material/Phone";
import Public from "@mui/icons-material/Public";
import Business from "@mui/icons-material/Business";
import Badge from "@mui/icons-material/Badge";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Translate from "@mui/icons-material/Translate";
import Grass from "@mui/icons-material/Grass";

const PRIMARY = "#6B4E3D";

function getProfilePhotoUrl(profile) {
  const url = profile?.profilePhotoUrl ?? profile?.profile_photo_url;
  if (!url || typeof url !== "string") return null;
  if (url.startsWith("http")) return url;
  if (url.startsWith("uploads/")) return `/${url}`;
  if (url.startsWith("/uploads/")) return url;
  return `/${url.startsWith("/") ? url.slice(1) : url}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRole(role) {
  if (!role) return "—";
  return String(role)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function InfoRow({ icon, label, value }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : value;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
      <Box sx={{ color: PRIMARY, mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2">{display}</Typography>
      </Box>
    </Box>
  );
}

export default function MarketplaceUserView({ open, onClose, user }) {
  if (!user) return null;

  const profile = user.profile || {};
  const getProfile = (key) => profile[key] ?? profile[key?.replace(/([A-Z])/g, "_$1").toLowerCase()?.replace(/^_/, "")];
  const country = getProfile("country");
  const region = getProfile("region");
  const district = getProfile("district");
  const locationParts = [country, region, district].filter(Boolean);
  const locationStr = locationParts.length ? locationParts.join(", ") : null;
  const roleSpecific = getProfile("roleSpecificData") || getProfile("role_specific_data");
  const roleSpecificObj = roleSpecific && typeof roleSpecific === "object" ? roleSpecific : {};
  const profilePhotoUrl = getProfilePhotoUrl(profile);
  const displayName = user.fullName || user.full_name || user.email || "?";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
          color: "white",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="span">
          Marketplace User Details
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
            {profilePhotoUrl ? (
              <Box
                component="img"
                src={profilePhotoUrl}
                alt={displayName}
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = "flex";
                }}
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid",
                  borderColor: "divider",
                  boxShadow: 2,
                }}
              />
            ) : null}
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                bgcolor: `${PRIMARY}30`,
                color: PRIMARY,
                display: profilePhotoUrl ? "none" : "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid",
                borderColor: "divider",
                boxShadow: 2,
                fontWeight: 700,
                fontSize: "2rem",
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Box>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 700 }}>
              Account
            </Typography>
            <InfoRow icon={<Person fontSize="small" />} label="Full name" value={user.fullName || user.full_name} />
            <InfoRow icon={<Email fontSize="small" />} label="Email" value={user.email} />
            <InfoRow icon={<Phone fontSize="small" />} label="Phone" value={user.phone} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mt: 1 }}>
              <Chip label={formatRole(user.role)} size="small" sx={{ bgcolor: `${PRIMARY}20`, color: PRIMARY }} />
              <Chip
                label={user.status || "—"}
                size="small"
                color={user.status === "active" ? "success" : "default"}
                sx={{ textTransform: "capitalize" }}
              />
              <Chip
                label={user.profileCompleted ? "Profile completed" : "Profile pending"}
                size="small"
                variant="outlined"
                color={user.profileCompleted ? "success" : "warning"}
              />
            </Box>
            <InfoRow icon={<CalendarToday fontSize="small" />} label="Registered" value={formatDate(user.createdAt)} />
            {user.lastLogin && (
              <InfoRow icon={<CalendarToday fontSize="small" />} label="Last login" value={formatDate(user.lastLogin)} />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 700 }}>
              Profile & location
            </Typography>
            <InfoRow icon={<Public fontSize="small" />} label="Location" value={locationStr} />
            <InfoRow icon={<Translate fontSize="small" />} label="Preferred language" value={getProfile("preferredLanguage") || getProfile("preferred_language")} />
            <InfoRow icon={<Business fontSize="small" />} label="Farm or business name" value={getProfile("farmOrBusinessName") || getProfile("farm_or_business_name")} />
            <InfoRow icon={<Grass fontSize="small" />} label="Primary activity" value={getProfile("primaryActivity") || getProfile("primary_activity")} />
            <InfoRow icon={<Grass fontSize="small" />} label="Scale of operation" value={getProfile("scaleOfOperation") || getProfile("scale_of_operation")} />
            <InfoRow icon={<Badge fontSize="small" />} label="Produces" value={getProfile("produces")} />
            {getProfile("bio") && (
              <InfoRow
                icon={<Person fontSize="small" />}
                label="Bio"
                value={getProfile("bio")}
              />
            )}
            {Object.keys(roleSpecificObj).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600 }}>
                  Role-specific details
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(roleSpecificObj, null, 2).replace(/[{}"]/g, "").trim() || "—"}
                </Typography>
              </Box>
            )}
          </Paper>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
