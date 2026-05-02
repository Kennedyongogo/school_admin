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
import { Close, Email, Person, Edit } from "@mui/icons-material";

export default function EditUserDetails({
  open,
  onClose,
  isAuthenticated,
  currentUser,
  setIsAuthenticated,
}) {
  const [isError, setIsError] = useState("");
  const [body, updateBody] = useState({
    email: "",
    full_name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const rfPhone = useRef();
  const rfName = useRef();

  const editDetails = () => {
    if (isAuthenticated) {
      const d = {
        email: rfPhone.current.value,
        full_name: rfName.current.value,
      };

      if (!d.full_name.includes(" ")) {
        return setIsError(
          "Enter a valid name including your Surname and Firstname"
        );
      }
      if (d.full_name.length < 3) {
        return setIsError("Name too short");
      }

      setIsLoading(true);
      updateBody(d);
      setIsError("");

      fetch(`/api/admin-users/${currentUser.id}`, {
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
          } else throw Error("Change of details failed");
        })
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setIsError(data.success);
            setTimeout(() => {
              localStorage.clear();
              setIsAuthenticated(false);
              window.location.href = "/";
            }, 1000);
          }
        })
        .catch((err) => {
          setIsLoading(false);
          setIsError("Update failed!");
        });
    }
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

        <Edit sx={{ position: "relative", zIndex: 1, fontSize: 28 }} />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
            Edit Account Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, fontSize: "0.9rem" }}>
            {currentUser.full_name}
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
              <Person sx={{ fontSize: 16 }} />
              Name
            </Typography>
            <TextField
              inputRef={rfName}
              label="Change Name"
              variant="outlined"
              defaultValue={currentUser.full_name}
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
              <Email sx={{ fontSize: 16 }} />
              Email
            </Typography>
            <TextField
              inputRef={rfPhone}
              label="Change Email"
              variant="outlined"
              type="email"
              defaultValue={currentUser.email}
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
          onClick={editDetails}
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
            "Update Details"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
