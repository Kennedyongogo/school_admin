import React, { cloneElement, useEffect, useState } from "react";
import {
  Logout,
  PeopleAlt,
  Settings,
  Event,
  School,
  MenuBook,
  Dashboard,
  Badge,
  AccountBalance,
  Quiz,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { styled, useTheme, alpha } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { Box, Typography } from "@mui/material";
import Header from "./Header/Header";

const drawerWidth = 280;
const drawerCollapsedWidth = 72;

const navRed = "#DC2626";
const navRedDark = "#B91C1C";
const navRedLight = "#FEE2E2";
const navRedHoverBg = "rgba(220, 38, 38, 0.08)";
const navRedActiveBg = "rgba(220, 38, 38, 0.12)";
const sidebarBg = "#FFFBF7";
const textPrimary = "#1C1917";
const textMuted = "#78716C";

const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const fontDisplay = '"Fraunces", "Georgia", serif';

const drawerPaperSx = (theme, open) => ({
  border: "none",
  borderRight: `1px solid ${alpha(navRed, 0.08)}`,
  background: `linear-gradient(180deg, ${sidebarBg} 0%, #FFFFFF 55%, ${alpha(navRedLight, 0.35)} 100%)`,
  boxShadow: open ? "4px 0 32px rgba(28, 25, 23, 0.06)" : "2px 0 16px rgba(28, 25, 23, 0.04)",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

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
  width: drawerCollapsedWidth,
});

const DrawerHeader = styled("div", {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: open ? "space-between" : "center",
  padding: open ? theme.spacing(2, 2, 1.5, 2) : theme.spacing(1.5, 0.5),
  minHeight: open ? 80 : 64,
  flexShrink: 0,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  background: `linear-gradient(135deg, ${navRed} 0%, ${navRedDark} 100%)`,
  boxShadow: "0 4px 24px rgba(220, 38, 38, 0.28), inset 0 -1px 0 rgba(255,255,255,0.08)",
  marginLeft: open ? drawerWidth : drawerCollapsedWidth,
  width: open ? `calc(100% - ${drawerWidth}px)` : `calc(100% - ${drawerCollapsedWidth}px)`,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: open
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  }),
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
    pointerEvents: "none",
  },
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": {
      ...openedMixin(theme),
      ...drawerPaperSx(theme, true),
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": {
      ...closedMixin(theme),
      ...drawerPaperSx(theme, false),
    },
  }),
}));

const MENU_SECTIONS = [
  {
    label: "Overview",
    items: [{ text: "Dashboard", icon: <Dashboard />, path: "/dashboard" }],
  },
  {
    label: "Operations",
    items: [
      { text: "HR", icon: <Badge />, path: "/hr" },
      { text: "Accounting", icon: <AccountBalance />, path: "/accounting" },
      { text: "Exam", icon: <Quiz />, path: "/exam" },
      { text: "Curriculum", icon: <MenuBook />, path: "/curriculum" },
      { text: "Timetable", icon: <Event />, path: "/timetable" },
    ],
  },
  {
    label: "Administration",
    items: [
      { text: "Users", icon: <PeopleAlt />, path: "/users" },
      { text: "Elimu Plus", icon: <School />, path: "/elimu-plus" },
    ],
  },
  {
    label: "System",
    items: [{ text: "Settings", icon: <Settings />, path: "/settings" }],
  },
];

const flatMenuItems = MENU_SECTIONS.flatMap((s) => s.items);

function NavIconBox({ selected, children, compact }) {
  return (
    <Box
      sx={{
        width: compact ? 36 : 38,
        height: compact ? 36 : 38,
        borderRadius: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.22s ease",
        background: selected
          ? `linear-gradient(145deg, ${navRed} 0%, ${navRedDark} 100%)`
          : alpha(navRed, 0.06),
        color: selected ? "#fff" : textMuted,
        boxShadow: selected ? "0 4px 12px rgba(220, 38, 38, 0.35)" : "none",
        "& .MuiSvgIcon-root": { fontSize: compact ? 20 : 21 },
      }}
    >
      {children}
    </Box>
  );
}

function NavItem({ item, open, selected, onNavigate }) {
  return (
    <Tooltip title={item.text} placement="right" disableHoverListener={open}>
      <ListItemButton
        onClick={() => onNavigate(item.path)}
        selected={selected}
        sx={{
          justifyContent: open ? "flex-start" : "center",
          gap: open ? 1.5 : 0,
          px: open ? 1.5 : 1,
          py: open ? 0.85 : 1,
          mx: open ? 1.5 : 0.75,
          mb: 0.5,
          borderRadius: "12px",
          minHeight: 46,
          transition: "all 0.2s ease",
          bgcolor: selected ? navRedActiveBg : "transparent",
          "&:hover": {
            bgcolor: selected ? navRedActiveBg : navRedHoverBg,
            transform: open ? "translateX(2px)" : "none",
          },
          "&.Mui-selected": {
            bgcolor: navRedActiveBg,
            "&:hover": { bgcolor: navRedActiveBg },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: open ? 38 : "auto", justifyContent: "center" }}>
          <NavIconBox selected={selected} compact={!open}>
            {cloneElement(item.icon)}
          </NavIconBox>
        </ListItemIcon>
        {open && (
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontFamily: fontBody,
              fontSize: "0.9rem",
              fontWeight: selected ? 700 : 500,
              color: selected ? navRed : textPrimary,
              letterSpacing: "-0.01em",
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}

const Navbar = (props) => {
  const { user } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [open, setOpen] = useState(() => window.innerWidth >= theme.breakpoints.values.md);
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
    (path === "/settings" && location.pathname.startsWith("/settings")) ||
    (path === "/users" && location.pathname.startsWith("/users"));

  const logout = () => {
    localStorage.clear();
    navigate("/");
    fetch("/api/admin-users/logout", {
      method: "GET",
      credentials: "include",
    });
  };

  useEffect(() => {
    if (user) setMenuItems(flatMenuItems);
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= theme.breakpoints.values.md);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [theme.breakpoints.values.md]);

  const sections =
    menuItems.length > 0
      ? MENU_SECTIONS.map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            menuItems.some((m) => m.path === item.path)
          ),
        })).filter((s) => s.items.length > 0)
      : [];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} elevation={0}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: 64, sm: 68 },
            px: { xs: 1.5, sm: 2.5 },
          }}
        >
          <Header
            setUser={props.setUser}
            handleDrawerOpen={handleDrawerOpen}
            open={open}
          />
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeader open={open}>
          {open ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "13px",
                  background: `linear-gradient(145deg, ${navRed} 0%, ${navRedDark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 6px 16px rgba(220, 38, 38, 0.35)",
                }}
              >
                <School sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontFamily: fontDisplay,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: textPrimary,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  Elimu Plus
                </Typography>
                <Typography
                  sx={{
                    fontFamily: fontBody,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: navRed,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Admin Portal
                </Typography>
              </Box>
            </Box>
          ) : (
            <Tooltip title="Elimu Plus Admin" placement="right">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: `linear-gradient(145deg, ${navRed} 0%, ${navRedDark} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
                }}
              >
                <School sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
            </Tooltip>
          )}
          {open && (
            <IconButton
              onClick={handleDrawerClose}
              size="small"
              aria-label="Collapse navigation"
              sx={{
                color: textMuted,
                bgcolor: alpha(navRed, 0.06),
                "&:hover": { bgcolor: alpha(navRed, 0.12), color: navRed },
              }}
            >
              {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}
        </DrawerHeader>

        <Divider sx={{ borderColor: alpha(navRed, 0.08), mx: open ? 2 : 1 }} />

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            py: 1.5,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: alpha(navRed, 0.2),
              borderRadius: 4,
            },
          }}
        >
          {open
            ? sections.map((section) => (
                <Box key={section.label} sx={{ mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: fontBody,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: textMuted,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      px: 2.5,
                      pt: 1,
                      pb: 0.75,
                    }}
                  >
                    {section.label}
                  </Typography>
                  <List disablePadding>
                    {section.items.map((item) => (
                      <NavItem
                        key={item.path}
                        item={item}
                        open={open}
                        selected={isNavPathSelected(item.path)}
                        onNavigate={navigate}
                      />
                    ))}
                  </List>
                </Box>
              ))
            : (
              <List disablePadding sx={{ px: 0.5 }}>
                {menuItems.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    open={open}
                    selected={isNavPathSelected(item.path)}
                    onNavigate={navigate}
                  />
                ))}
              </List>
            )}
        </Box>

        <Divider sx={{ borderColor: alpha(navRed, 0.08), mx: open ? 2 : 1 }} />

        <Box sx={{ py: 1.5, flexShrink: 0 }}>
          <Tooltip title="Logout" placement="right" disableHoverListener={open}>
            <ListItemButton
              onClick={logout}
              sx={{
                justifyContent: open ? "flex-start" : "center",
                gap: open ? 1.5 : 0,
                px: open ? 1.5 : 1,
                py: 1,
                mx: open ? 1.5 : 0.75,
                borderRadius: "12px",
                minHeight: 46,
                "&:hover": {
                  bgcolor: alpha(navRed, 0.08),
                  "& .logout-icon": {
                    bgcolor: alpha(navRed, 0.15),
                    color: navRed,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: open ? 38 : "auto", justifyContent: "center" }}>
                <Box
                  className="logout-icon"
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(textMuted, 0.1),
                    color: textMuted,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Logout sx={{ fontSize: 20 }} />
                </Box>
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary="Sign out"
                  primaryTypographyProps={{
                    fontFamily: fontBody,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: textPrimary,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Navbar;
