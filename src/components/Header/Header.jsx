import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  KeyboardArrowDown,
} from "@mui/icons-material";
import UserAccount from "./userAccount";
import EditUserDetails from "./editUserDetails";
import ChangePassword from "./changePassword";
import { useNavigate, useLocation } from "react-router-dom";
import BrandPageLoader from "../Util/BrandPageLoader";
import AdminNotificationBell from "./AdminNotificationBell";

const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const fontDisplay = '"Fraunces", "Georgia", serif';

const PAGE_TITLES = [
  { prefix: "/dashboard", title: "Dashboard", subtitle: "Overview & insights" },
  { prefix: "/hr", title: "HR", subtitle: "Staff & people management" },
  { prefix: "/accounting", title: "Accounting", subtitle: "Fees & finances" },
  { prefix: "/exam", title: "Exams", subtitle: "Assessments & submissions" },
  { prefix: "/curriculum", title: "Curriculum", subtitle: "Courses & programmes" },
  { prefix: "/timetable", title: "Timetable", subtitle: "Schedules & classes" },
  { prefix: "/users", title: "Users", subtitle: "Account management" },
  { prefix: "/elimu-plus", title: "Elimu Plus", subtitle: "School profile & records" },
  { prefix: "/settings", title: "Settings", subtitle: "Preferences & security" },
  { prefix: "/audit", title: "Audit Trail", subtitle: "Admin activity & system logs" },
];

const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  if (imageUrl.startsWith("uploads/")) return `/${imageUrl}`;
  if (imageUrl.startsWith("/uploads/")) return imageUrl;
  return imageUrl;
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

function getPageContext(pathname) {
  const match = PAGE_TITLES.find(({ prefix }) => pathname.startsWith(prefix));
  return match || { title: "Admin Portal", subtitle: "Elimu Plus Homeschool" };
}

export default function Header(props) {
  const [currentUser, setCurrentUser] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [toggleAccount, setToggleAccount] = useState(false);
  const [toggleEditDetails, setToggleEditDetails] = useState(false);
  const [toggleChangePass, setToggleChangePass] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const page = getPageContext(location.pathname);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem("token");

    if (token) {
      fetch("/api/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) return response.json();
          throw new Error("Failed to fetch user");
        })
        .then((response) => {
          const userData = response.data;
          setCurrentUser(userData);
          props.setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          setLoading(false);
        })
        .catch(() => {
          const savedUser = localStorage.getItem("user");
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setCurrentUser(userData);
            props.setUser(userData);
          } else {
            window.location.href = "/";
          }
          setLoading(false);
        });
    } else {
      window.location.href = "/";
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
    fetch("/api/admin/logout", {
      method: "GET",
      credentials: "include",
    });
  };

  const roleLabel =
    currentUser?.role
      ? String(currentUser.role).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Staff";

  return (
    <>
      {loading && <BrandPageLoader message="Loading your account..." />}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "white",
          width: "100%",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <IconButton
            aria-label="Open navigation"
            onClick={props.handleDrawerOpen}
            sx={{
              color: "white",
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              width: 40,
              height: 40,
              flexShrink: 0,
              ...(props.open && { display: "none" }),
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box sx={{ minWidth: 0, display: { xs: props.open ? "none" : "block", sm: "block" } }}>
            <Typography
              sx={{
                fontFamily: fontDisplay,
                fontWeight: 700,
                fontSize: { xs: "1rem", sm: "1.15rem" },
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {page.title}
            </Typography>
            <Typography
              sx={{
                fontFamily: fontBody,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.78)",
                fontWeight: 500,
                display: { xs: "none", md: "block" },
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {page.subtitle}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 }, flexShrink: 0 }}>
          <AdminNotificationBell />

          <Box
            component="button"
            type="button"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              border: "1px solid rgba(255,255,255,0.18)",
              bgcolor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              borderRadius: "14px",
              pl: { xs: 0.75, sm: 1 },
              pr: { xs: 0.75, sm: 1.25 },
              py: 0.75,
              cursor: "pointer",
              color: "inherit",
              font: "inherit",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.16)",
                borderColor: "rgba(255,255,255,0.28)",
              },
            }}
          >
            {currentUser?.profile_image ? (
              <Avatar
                src={buildImageUrl(currentUser.profile_image)}
                alt={currentUser?.full_name}
                sx={{
                  width: 36,
                  height: 36,
                  border: "2px solid rgba(255, 255, 255, 0.35)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.35)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  fontFamily: fontBody,
                }}
              >
                {getInitials(currentUser?.full_name)}
              </Avatar>
            )}

            <Box sx={{ textAlign: "left", display: { xs: "none", sm: "block" } }}>
              <Typography
                sx={{
                  fontFamily: fontBody,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUser?.full_name || "Admin"}
              </Typography>
              <Typography
                sx={{
                  fontFamily: fontBody,
                  fontSize: "0.7rem",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 500,
                }}
              >
                {roleLabel}
              </Typography>
            </Box>

            <KeyboardArrowDown
              sx={{
                fontSize: 20,
                color: "rgba(255,255,255,0.8)",
                display: { xs: "none", sm: "block" },
                transition: "transform 0.2s",
                transform: anchorEl ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: "16px",
                border: "1px solid rgba(220,38,38,0.08)",
                boxShadow: "0 16px 48px rgba(28,25,23,0.14)",
                overflow: "hidden",
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: "#FFFBF7" }}>
            <Typography sx={{ fontFamily: fontBody, fontWeight: 700, fontSize: "0.9rem", color: "#1C1917" }}>
              {currentUser?.full_name || "Admin"}
            </Typography>
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.75rem", color: "#78716C" }}>
              {currentUser?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setToggleAccount(true);
              setAnchorEl(null);
            }}
            sx={{ py: 1.25, fontFamily: fontBody, fontSize: "0.9rem" }}
          >
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" sx={{ color: "#DC2626" }} />
            </ListItemIcon>
            <ListItemText primary="My account" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              setAnchorEl(null);
            }}
            sx={{ py: 1.25, fontFamily: fontBody, fontSize: "0.9rem" }}
          >
            <ListItemIcon>
              <LockIcon fontSize="small" sx={{ color: "#DC2626" }} />
            </ListItemIcon>
            <ListItemText primary="Change password" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              logout();
              setAnchorEl(null);
            }}
            sx={{
              py: 1.25,
              fontFamily: fontBody,
              fontSize: "0.9rem",
              color: "#DC2626",
              "&:hover": { bgcolor: "rgba(220,38,38,0.08)" },
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: "#DC2626" }} />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>

        {currentUser && (
          <UserAccount
            onClose={() => setToggleAccount(false)}
            open={toggleAccount}
            currentUser={currentUser}
          />
        )}
        {currentUser && (
          <EditUserDetails
            open={toggleEditDetails}
            onClose={() => setToggleEditDetails(false)}
            currentUser={currentUser}
          />
        )}
        {currentUser && (
          <ChangePassword
            open={toggleChangePass}
            onClose={() => setToggleChangePass(false)}
            currentUser={currentUser}
          />
        )}
      </Box>
    </>
  );
}
