import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0e8d45", // Vihiga green as primary color
      light: "#40a86c", // Lighter variant
      dark: "#0a6231", // Darker variant
    },
    secondary: {
      main: "#f1ea32", // Vihiga yellow as secondary color
      light: "#f4ef5b", // Lighter variant
      dark: "#c1bb28", // Darker variant
    },
    info: {
      main: "#2491cf", // Vihiga blue
      light: "#4fa7d9", // Lighter variant
      dark: "#1b73a5", // Darker variant
    },
    background: {
      default: "#ffffff",
      paper: "#f9f9f9",
      dark: "#090909", // Vihiga dark color
    },
    text: {
      primary: "#090909", // Using Vihiga dark for text
      secondary: "#555555",
    },
    // Keep success color for notifications/status indicators
    success: {
      main: "#0e8d45", // Using Vihiga green for success states
      light: "#40a86c",
      dark: "#0a6231",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
    },
  },
});

export default theme;
