import React, { cloneElement, useEffect, useState } from "react";
import {
  Logout,
  PeopleAlt,
  Settings,
  Event,
  School,
  MenuBook,
  VideocamOutlined,
  Dashboard,
  Badge,
  AccountBalance,
  Quiz,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { styled, useTheme } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Box } from "@mui/material";
import Header from "./Header/Header";

const drawerWidth = 300;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: theme.spacing(1, 0, 1, 1),
  backgroundColor: "#fff",
  color: "#B85C38",
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
  boxShadow: "0 4px 20px rgba(107, 78, 61, 0.3)",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  overflowY: "hidden", // Disable vertical scrollbar
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const Navbar = (props) => {
  const { user } = props; // Expecting user role from props
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(() => {
    return window.innerWidth >= theme.breakpoints.values.md;
  });
  const [menuItems, setMenuItems] = useState([]);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const isNavPathSelected = (path) =>
    location.pathname === path ||
    (path === "/dashboard" && location.pathname.startsWith("/dashboard")) ||
    (path === "/hr" && location.pathname.startsWith("/hr")) ||
    (path === "/accounting" && location.pathname.startsWith("/accounting")) ||
    (path === "/exam" && location.pathname.startsWith("/exam")) ||
    (path === "/elimu-plus" && location.pathname.startsWith("/elimu-plus")) ||
    (path === "/curriculum" && location.pathname.startsWith("/curriculum")) ||
    (path === "/timetable" && location.pathname.startsWith("/timetable")) ||
    (path === "/elimu-plus-online" && location.pathname.startsWith("/elimu-plus-online")) ||
    (path === "/settings" && location.pathname.startsWith("/settings"));

  const logout = () => {
    localStorage.clear();
    navigate("/");
    fetch("/api/admin-users/logout", {
      method: "GET",
      credentials: "include",
    });
  };

  const adminItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "HR", icon: <Badge />, path: "/hr" },
    { text: "Accounting", icon: <AccountBalance />, path: "/accounting" },
    { text: "Exam", icon: <Quiz />, path: "/exam" },
    { text: "Curriculum", icon: <MenuBook />, path: "/curriculum" },
    { text: "Timetable", icon: <Event />, path: "/timetable" },
    { text: "Online", icon: <VideocamOutlined />, path: "/elimu-plus-online" },
    { text: "Users", icon: <PeopleAlt />, path: "/users" },
    { text: "Elimu Plus", icon: <School />, path: "/elimu-plus" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  useEffect(() => {
    if (user) {
      // if (
      //   user.Department ===
      //   "Lands, Physical Planning, Housing and Urban Development"
      // ) {
      //   setMenuItems(adminItems);
      // } else if (user.Department === "ICT") {
      //   // setMenuItems(ICTItems);
      // } else if (user.Department === "Finance and Economic Planning") {
      //   // setMenuItems(financeItems);
      // }
      setMenuItems(adminItems);
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= theme.breakpoints.values.md);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [theme.breakpoints.values.md]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <Header
            setUser={props.setUser}
            handleDrawerOpen={handleDrawerOpen}
            open={open}
          />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Box></Box>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => navigate(item.path)}
              selected={isNavPathSelected(item.path)}
              sx={{
                cursor: "pointer",
                bgcolor: isNavPathSelected(item.path) ? "action.selected" : "transparent",
              }}
            >
              <ListItemIcon>
                {cloneElement(item.icon, {
                  color: isNavPathSelected(item.path) ? "primary" : "textSecondary",
                })}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  cursor: "pointer",
                  color: isNavPathSelected(item.path) ? "primary" : "textSecondary",
                  fontWeight: isNavPathSelected(item.path) ? "bold" : "normal",
                }}
              />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          <ListItem button onClick={logout} sx={{ cursor: "pointer" }}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Navbar;
