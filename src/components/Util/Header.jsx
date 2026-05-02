import React, { useEffect, useState } from "react";
import jwt from "jsonwebtoken";
import { Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import {
  Menu as MenuIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import UserAccount from "../userManagement/userAccount";
import EditUserDetails from "../userManagement/editUserDetails";
import ChangePassword from "../userManagement/changePassword";

export default function Header2(props) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [toggleAccount, setToggleAccount] = useState(false);
  const [toggleEditDetails, setToggleEditDetails] = useState(false);
  const [toggleChangePass, setToggleChangePass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("gdfhgfhtkn");

    if (token) {
      try {
        const decoded = jwt.decode(token);
        setCurrentUser(decoded);

        if (Date.now() >= decoded.exp * 1000) {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [isAuthenticated]);

  const logout = () => {
    fetch("/api/users/logout", {
      method: "get",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) return res.json();
        else throw new Error();
      })
      .then(() => {
        setIsAuthenticated(false);
        localStorage.clear();
        window.location.href = "/";
      })
      .catch((error) => {});
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1,
        color: "white",
        width: "100%",
      }}
    >
      <IconButton
        color="inherit"
        aria-label="open drawer"
        onClick={props.handleDrawerOpen}
        edge="start"
        sx={{
          marginRight: 5,
          ...(props.open && { display: "none" }),
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box
        sx={{
          marginRight: 5,
          ...(!props.open && { display: "none" }),
        }}
      ></Box>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="body1" sx={{ mr: 1 }}>
          {currentUser.Name}
        </Typography>
        <IconButton color="inherit" onClick={handleClick}>
          <ArrowDropDownIcon />
          <AccountCircleIcon />
        </IconButton>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
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
            setToggleEditDetails(true);
            handleClose();
          }}
        >
          <PersonIcon sx={{ mr: 1 }} /> Edit Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            setToggleChangePass(true);
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

      {toggleAccount && (
        <UserAccount
          setToggleAccount={setToggleAccount}
          currentUser={currentUser}
        />
      )}
      {toggleEditDetails && (
        <EditUserDetails
          setToggleEditDetails={setToggleEditDetails}
          setToggleChangePass={setToggleChangePass}
          setIsAuthenticated={setIsAuthenticated}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
        />
      )}
      {toggleChangePass && (
        <ChangePassword
          setToggleChangePass={setToggleChangePass}
          setIsAuthenticated={setIsAuthenticated}
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
        />
      )}
    </Box>
  );
}
