import React, { cloneElement, Fragment, useEffect, useState } from "react";
import {
  Logout,
  ExpandLess,
  ExpandMore,
  PeopleAlt,
  Map,
  Dashboard,
  CreditCard,
  MapOutlined,
  StarRateSharp,
  Search,
  DataArray,
  DataObject,
  Help,
  DataUsage,
  AccountCircle,
  Description,
  AccountBalance,
  LocationOn,
  Warning,
  Settings,
  QuestionAnswer,
  Schedule,
  Business,
  Build,
  Folder,
  History,
  Assessment,
  RateReview,
  Favorite,
  Article,
  Event,
  Image,
  ContactMail,
  RequestQuote,
  EventAvailable,
  Campaign,
  Assignment,
  Storefront,
} from "@mui/icons-material";
import { Money } from "@phosphor-icons/react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import { Gear } from "@phosphor-icons/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuilding } from "@fortawesome/free-solid-svg-icons";

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
  const [openSections, setOpenSections] = useState({
    Resources: false,
    System: false,
  });
  const [menuItems, setMenuItems] = useState([]);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleToggle = (section) => {
    setOpenSections((prevState) => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
    fetch("/api/admin-users/logout", {
      method: "GET",
      credentials: "include",
    });
  };

  const adminItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/analytics" },
    {
      text: "Blogs",
      icon: <Article />,
      path: "/blogs",
    },
    {
      text: "Projects",
      icon: <Business />,
      path: "/projects",
    },
    {
      text: "Services",
      icon: <Build />,
      path: "/services",
    },
    {
      text: "Forms",
      icon: <Description />,
      path: "/forms",
    },
    {
      text: "Users",
      icon: <PeopleAlt />,
      path: "/users",
    },
    {
      text: "Marketplace",
      icon: <Storefront />,
      path: "/marketplace",
    },
        {
          text: "Resources",
          icon: <Folder />,
          subItems: [
            {
              text: "Submissions",
              icon: <Assignment />,
              path: "/submissions",
            },
            {
              text: "Documents",
              icon: <Folder />,
              path: "/documents",
            },
            {
              text: "MK Map",
              icon: <Map />,
              path: "/map",
            },
            {
              text: "Reviews",
              icon: <RateReview />,
              path: "/reviews",
            },
            {
              text: "FAQs",
              icon: <QuestionAnswer />,
              path: "/faqs",
            },
          ],
        },
    {
      text: "System",
      icon: <Settings />,
      subItems: [
        {
          text: "Audit Trail",
          icon: <History />,
          path: "/audit",
        },
        {
          text: "Settings",
          icon: <Settings />,
          path: "/settings",
        },
      ],
    },
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
            <Fragment key={item.text}>
              {item.subItems ? (
                <>
                  <ListItem
                    button
                    onClick={() => handleToggle(item.text)}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pr: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", flex: 1 }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText
                        sx={{
                          fontSize: "small",
                          color:
                            location.pathname === item.path
                              ? "primary"
                              : "textSecondary",
                          fontWeight:
                            location.pathname === item.path ? "bold" : "normal",
                        }}
                        primary={item.text}
                      />
                    </Box>
                    <Box sx={{ ml: "auto" }}>
                      {openSections[item.text] ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </Box>
                  </ListItem>
                  {openSections[item.text] && (
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem
                          key={subItem.text}
                          button
                          onClick={() => navigate(subItem.path)}
                          selected={location.pathname === subItem.path}
                          sx={{
                            fontSize: "x-small",
                            pl: 4, // Indent subitems
                            typography: "body2", // Reduce font size
                            fontStyle: "italic", // Italicize text
                            cursor: "pointer",
                            bgcolor:
                              location.pathname === subItem.path
                                ? "action.selected"
                                : "transparent", // Highlight selected subitem
                          }}
                        >
                          <ListItemIcon>{subItem.icon}</ListItemIcon>
                          <ListItemText
                            primary={subItem.text}
                            sx={{
                              fontSize: "x-small",
                              color:
                                location.pathname === item.path
                                  ? "primary"
                                  : "textSecondary",
                              fontWeight:
                                location.pathname === item.path
                                  ? "bold"
                                  : "normal", // Highlight text for selected item
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </>
              ) : (
                <ListItem
                  key={item.text}
                  button
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    cursor: "pointer",
                    bgcolor:
                      location.pathname === item.path
                        ? "action.selected"
                        : "transparent", // Highlight selected item
                  }}
                >
                  <ListItemIcon>
                    {cloneElement(item.icon, {
                      color:
                        location.pathname === item.path
                          ? "primary"
                          : "textSecondary",
                    })}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{
                      cursor: "pointer",
                      color:
                        location.pathname === item.path
                          ? "primary"
                          : "textSecondary",
                      fontWeight:
                        location.pathname === item.path ? "bold" : "normal", // Highlight text for selected item
                    }}
                  />
                </ListItem>
              )}
            </Fragment>
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
