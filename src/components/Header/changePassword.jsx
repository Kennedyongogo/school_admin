import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Box,
  Alert,
} from "@mui/material";
import { Close, Lock, VpnKey, Security } from "@mui/icons-material";

export default function ChangePassword({
  open,
  onClose,
  isAuthenticated,
  currentUser,
  setIsAuthenticated,
}) {
  const [isError, setIsError] = useState("");
  const [body, updateBody] = useState({
    Password: "",
    NewPassword: "",
    ConfirmNewPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const rfOldPassword = useRef();
  const rfNewPassword = useRef();
  const rfConfirmNewPassword = useRef();

  const changePassword = () => {
    if (isAuthenticated) {
      const d = {
        Password: rfOldPassword.current.value,
        NewPassword: rfNewPassword.current.value,
        ConfirmNewPassword: rfConfirmNewPassword.current.value,
      };

      updateBody(d);
      setIsError("");

      if (!d.Password) return setIsError("Old password is required!");
      if (!d.NewPassword || d.NewPassword.length < 6)
        return setIsError("New Password must be at least 6 characters!");
      if (!validatePassword(d.NewPassword, d.ConfirmNewPassword))
        return setIsError("New Password and Confirm New Password do not match");

      setIsLoading(true);
      fetch(`/api/users/${currentUser.ID}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(d),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else throw new Error("Could not change password");
        })
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setIsError(data.success);
            localStorage.clear();
            setIsAuthenticated(false);
            window.location.href = "/";
          } else {
            setIsError(data.error);
          }
        })
        .catch((err) => {
          setIsLoading(false);
          setIsError("Could not change password!");
        });
    } else {
      setIsError("You have been logged out! Please log in again.");
    }
  };

  const validatePassword = (newPassword, confirmNewPassword) => {
    return confirmNewPassword === newPassword;
  };

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

        <Security sx={{ position: "relative", zIndex: 1, fontSize: 28 }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Change Password
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
            {currentUser.Name}
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
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: "#fafafa" }}>
        {isError && (
          <Alert
            severity={isError.includes("success") ? "success" : "error"}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {isError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={(e) => e.preventDefault()}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
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
                mb: 2,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Lock sx={{ fontSize: 16 }} />
              Current Password
            </Typography>
            <TextField
              inputRef={rfOldPassword}
              label="Enter Old Password *"
              type="password"
              variant="outlined"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

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
                mb: 2,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <VpnKey sx={{ fontSize: 16 }} />
              New Password
            </Typography>
            <TextField
              inputRef={rfNewPassword}
              label="Enter New Password *"
              type="password"
              variant="outlined"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

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
                mb: 2,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Security sx={{ fontSize: 16 }} />
              Confirm New Password
            </Typography>
            <TextField
              inputRef={rfConfirmNewPassword}
              label="Confirm New Password *"
              type="password"
              variant="outlined"
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 3, backgroundColor: "white", borderTop: "1px solid #e0e0e0" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={changePassword}
          disabled={isLoading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            py: 1,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Change Password"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
