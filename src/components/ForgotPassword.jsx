import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
  Alert,
  Divider,
} from "@mui/material";

export default function ForgotPassword(props) {
  const email = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState("");
  const [body, updateBody] = useState({ Email: null });

  const resetPassword = () => {
    let d = body;
    d.Email = email.current.value;
    updateBody(d);
    setIsError("");

    const validateEmail = (email) => {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    };

    if (!validateEmail(body.Email)) {
      return setIsError("Please provide a valid email address");
    }

    if (validateEmail(body.Email)) {
      setIsLoading(true);
      fetch("api/auth/forgot", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Email: email.current.value }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else throw Error("Failed");
        })
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setMessage("Password reset email sent");
            setTimeout(() => {
              props.showForgotPassword(false);
            }, 1000);
          } else {
            if (data?.error) {
              setIsError(data.error);
            }
          }
        })
        .catch(() => {
          setIsError("An error occurred. Please try again.");
          setIsLoading(false);
        });
    }
  };

  return (
    <Dialog open={props.open} onClose={() => props.showForgotPassword(false)}>
      <DialogTitle>Forgot Password</DialogTitle>
      <Divider />
      <DialogContent sx={{ minWidth: "30vw" }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          We'll generate a password and send to this email
        </Typography>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPassword();
          }}
        >
          <TextField
            inputRef={email}
            type="email"
            label="Your email"
            variant="outlined"
            fullWidth
            margin="normal"
            required
            gutterBottom
          />
        </form>
        {isError && <Alert severity="error">{isError}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => props.showForgotPassword(false)}
          color="secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={resetPassword}
          variant="contained"
          color="primary"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? <CircularProgress size={24} /> : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
