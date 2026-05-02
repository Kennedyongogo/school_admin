import React, { useRef, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

export default function ChangePassword(props) {
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
    if (props.isAuthenticated) {
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
      fetch(`/api/auth/${props.currentUser.UserID}`, {
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
            props.setIsAuthenticated(false);
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
    <Box
      sx={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 24,
        color: "black",
        p: 3,
        zIndex: 1300,
        textAlign: "center",
      }}
    >
      <IconButton
        onClick={() => props.setToggleChangePass(false)}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <Close />
      </IconButton>
      <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
        Change Password for {props.currentUser.Name}
      </Typography>
      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {isError}
        </Typography>
      )}
      <Box
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ display: "flex", flexDirection: "column" }}
      >
        <TextField
          inputRef={rfOldPassword}
          label="Enter Old Password *"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
        />
        <TextField
          inputRef={rfNewPassword}
          label="Enter New Password *"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
        />
        <TextField
          inputRef={rfConfirmNewPassword}
          label="Confirm New Password *"
          type="password"
          variant="outlined"
          margin="normal"
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={changePassword}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Submit"}
        </Button>
      </Box>
    </Box>
  );
}
