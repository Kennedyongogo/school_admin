import React from "react";
import { Box, Typography } from "@mui/material";
import { School } from "@mui/icons-material";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";

export default function BrandPageLoader({ message = "Loading..." }) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 1)",
        zIndex: 1300,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
          boxShadow: `0 8px 24px -6px ${primaryRed}55`,
        }}
      >
        <School sx={{ fontSize: 44, color: "#fff" }} />
      </Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: primaryDark,
          fontFamily: '"Cormorant Garamond", serif',
          letterSpacing: "0.02em",
        }}
      >
        Elimu Plus
      </Typography>
      <Typography sx={{ color: primaryRed, fontWeight: 600, fontSize: "0.95rem" }}>
        Learn • Lead • Succeed
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
        {message}
      </Typography>
    </Box>
  );
}
