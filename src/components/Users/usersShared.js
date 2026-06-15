export const primaryRed = "#DC2626";
export const primaryDark = "#B91C1C";
export const primaryLight = "#FEE2E2";
export const warmCream = "#FFFBF7";
export const textPrimary = "#1C1917";
export const textSecondary = "#78716C";
export const textMuted = "#A8A29E";

export const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
export const fontDisplay = '"Fraunces", "Georgia", serif';

export const ALL_ROLES = [
  "super_admin",
  "admin",
  "teacher",
  "student",
  "parent",
  "accountant",
  "librarian",
];

export function getActorFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Roles the signed-in user may assign when creating or editing users. */
export function assignableRoles(actorRole) {
  if (actorRole === "super_admin") return [...ALL_ROLES];
  if (["admin", "accountant", "librarian"].includes(actorRole)) {
    return ALL_ROLES.filter((role) => role !== "super_admin");
  }
  return [];
}

export const ROLE_TABS = [
  { label: "All users", value: null },
  { label: "Super admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Teacher", value: "teacher" },
  { label: "Student", value: "student" },
  { label: "Parent", value: "parent" },
  { label: "Accountant", value: "accountant" },
  { label: "Librarian", value: "librarian" },
];

export const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

export function formatRole(role) {
  if (!role) return "—";
  return String(role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function roleChipColor(role) {
  switch (role) {
    case "super_admin":
      return { bg: "#991B1B", color: "#fff" };
    case "admin":
      return { bg: primaryRed, color: "#fff" };
    case "teacher":
      return { bg: "#EA580C", color: "#fff" };
    case "student":
      return { bg: "#2563EB", color: "#fff" };
    case "parent":
      return { bg: "#7C3AED", color: "#fff" };
    case "accountant":
      return { bg: "#0D9488", color: "#fff" };
    case "librarian":
      return { bg: "#4B5563", color: "#fff" };
    default:
      return { bg: primaryLight, color: primaryDark };
  }
}

export function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    bgcolor: warmCream,
    fontFamily: fontBody,
    transition: "all 0.22s ease",
    "& fieldset": { borderColor: "rgba(220, 38, 38, 0.15)", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "#FCA5A5" },
    "&.Mui-focused fieldset": {
      borderColor: primaryRed,
      borderWidth: "2px",
      boxShadow: "0 0 0 4px rgba(220, 38, 38, 0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    fontFamily: fontBody,
    fontWeight: 500,
    color: textMuted,
    "&.Mui-focused": { color: primaryRed, fontWeight: 600 },
  },
  "& .MuiInputBase-input": { fontWeight: 500, color: textPrimary },
  "& .MuiSelect-select": { fontFamily: fontBody },
};

export const primaryBtnSx = {
  fontFamily: fontBody,
  fontWeight: 700,
  textTransform: "none",
  borderRadius: "14px",
  px: 3,
  py: 1.25,
  background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
  color: "#fff",
  boxShadow: "0 8px 24px -4px rgba(220, 38, 38, 0.4)",
  "&:hover": { background: `linear-gradient(135deg, ${primaryDark} 0%, #7F1D1D 100%)` },
};

export const ghostBtnSx = {
  fontFamily: fontBody,
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "14px",
  color: textSecondary,
  "&:hover": { bgcolor: warmCream, color: textPrimary },
};

export const pageShellSx = {
  minHeight: "100%",
  background: `linear-gradient(180deg, ${warmCream} 0%, #FFFFFF 45%, rgba(254,226,226,0.2) 100%)`,
  mx: { xs: -1.5, sm: -2, md: -3 },
  mt: { xs: -1, sm: -1.5 },
  px: { xs: 1.5, sm: 2, md: 3 },
  py: { xs: 2, sm: 3 },
  boxSizing: "border-box",
};
