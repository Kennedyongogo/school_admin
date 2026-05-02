import React from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Divider,
  Button,
  Avatar,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LoginIcon from "@mui/icons-material/Login";

export default function UserAccount({ open, onClose, currentUser }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -15,
            left: -15,
            width: 80,
            height: 80,
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />

        <PersonIcon sx={{ position: "relative", zIndex: 1, fontSize: 28 }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Account Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
            {currentUser?.full_name}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "white",
            zIndex: 1,
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: "#fafafa" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Name */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PersonIcon sx={{ fontSize: 16 }} />
              Name
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, color: "text.primary" }}
            >
              {currentUser?.full_name}
            </Typography>
          </Box>

          {/* Email */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <EmailIcon sx={{ fontSize: 16 }} />
              Email
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, color: "text.primary" }}
            >
              {currentUser?.email}
            </Typography>
          </Box>

          {/* Phone */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <PhoneIcon sx={{ fontSize: 16 }} />
              Phone Number
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, color: "text.primary" }}
            >
              {currentUser?.phone || "Not provided"}
            </Typography>
          </Box>

          {/* Role */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <WorkIcon sx={{ fontSize: 16 }} />
              Role
            </Typography>
            <Chip
              label={
                currentUser?.role?.charAt(0).toUpperCase() +
                currentUser?.role?.slice(1)
              }
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Status */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              Status
            </Typography>
            <Chip
              icon={
                currentUser?.isActive !== false ? <CheckCircleIcon /> : <CancelIcon />
              }
              label={currentUser?.isActive !== false ? "Active" : "Inactive"}
              color={currentUser?.isActive !== false ? "success" : "error"}
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Last Login */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "text.secondary",
                mb: 1,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LoginIcon sx={{ fontSize: 16 }} />
              Last Login
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500, color: "text.primary" }}
            >
              {currentUser?.lastLogin
                ? new Date(currentUser.lastLogin).toLocaleString()
                : "Current Session"}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
