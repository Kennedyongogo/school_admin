import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import UserAccount from "./userAccount";
import EditUserDetails from "./editUserDetails";
import ChangePassword from "./changePassword";
import { useNavigate } from "react-router-dom";

const LoadingScreen = () => (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 1)",
      zIndex: 1300, // Ensure it covers other components
    }}
  >
    <CircularProgress />
  </Box>
);

// Helper to build URL for uploaded assets using Vite proxy
const buildImageUrl = (imageUrl) => {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;

  // Use relative URLs - Vite proxy will handle routing to backend
  if (imageUrl.startsWith("uploads/")) return `/${imageUrl}`;
  if (imageUrl.startsWith("/uploads/")) return imageUrl;
  return imageUrl;
};

// Helper to get user initials
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function Header(props) {
  const [currentUser, setCurrentUser] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [toggleAccount, setToggleAccount] = useState(false);
  const [toggleEditDetails, setToggleEditDetails] = useState(false);
  const [toggleChangePass, setToggleChangePass] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // Load user from localStorage instead of API call
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser && token) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      props.setUser(userData);
      setLoading(false);
    } else {
      // Redirect to login if no user or token
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

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {loading && <LoadingScreen />}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          color: "white",
          width: "100%",
        }}
      >
        <IconButton
          aria-label="open drawer"
          onClick={props.handleDrawerOpen}
          edge="start"
          sx={{
            color: "white",
            marginRight: 5,
            ...(props.open && { display: "none" }),
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}></Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ mr: 1 }}>
            {currentUser?.full_name}
          </Typography>

          {/* Profile Picture or Avatar */}
          <Box sx={{ mr: 1 }}>
            {currentUser?.profile_image ? (
              <Avatar
                src={buildImageUrl(currentUser.profile_image)}
                alt={currentUser?.full_name}
                sx={{
                  width: 32,
                  height: 32,
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                {getInitials(currentUser?.full_name)}
              </Avatar>
            )}
          </Box>

          <IconButton color="inherit" onClick={handleClick}>
            <ArrowDropDownIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              setToggleAccount(true);
              handleClose();
            }}
          >
            <AccountCircleIcon sx={{ mr: 1 }} /> Account
          </MenuItem>
          <MenuItem
            onClick={() => {
              navigate("/settings");
              handleClose();
            }}
          >
            <LockIcon sx={{ mr: 1 }} /> Change Password
          </MenuItem>
          <MenuItem
            onClick={() => {
              logout();
              handleClose();
            }}
          >
            <LogoutIcon sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>

        {currentUser && (
          <UserAccount
            onClose={() => {
              setToggleAccount(false);
            }}
            open={toggleAccount}
            currentUser={currentUser}
          />
        )}
        {currentUser && (
          <EditUserDetails
            open={toggleEditDetails}
            onClose={() => {
              setToggleEditDetails(false);
            }}
            currentUser={currentUser}
          />
        )}
        {currentUser && (
          <ChangePassword
            open={toggleChangePass}
            onClose={() => {
              setToggleChangePass(false);
            }}
            currentUser={currentUser}
          />
        )}
      </Box>
    </>
  );
}
