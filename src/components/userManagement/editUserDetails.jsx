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

export default function EditUserDetails(props) {
  const [isError, setIsError] = useState("");
  const [body, updateBody] = useState({
    Phone: "",
    Name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const rfPhone = useRef();
  const rfName = useRef();

  const editDetails = () => {
    if (props.isAuthenticated) {
      const d = {
        Phone: rfPhone.current.value,
        Name: rfName.current.value,
      };

      if (d.Phone.length < 10) {
        return setIsError("Phone Number must be usually 10 digits");
      }
      if (!d.Name.includes(" ")) {
        return setIsError(
          "Enter a valid name including your Surname and Firstname"
        );
      }
      if (d.Name.length < 3) {
        return setIsError("Name too short");
      }

      setIsLoading(true);
      updateBody(d);
      setIsError("");

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
          } else throw Error("Change of details failed");
        })
        .then((data) => {
          setIsLoading(false);
          if (data.success) {
            setIsError(data.success);
            setTimeout(() => {
              localStorage.clear();
              props.setIsAuthenticated(false);
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
    <Box
      sx={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 400,
        bgcolor: "background.paper",
        color: "black",
        borderRadius: 2,
        boxShadow: 24,
        p: 3,
        zIndex: 1300,
      }}
    >
      <IconButton
        onClick={() => props.setToggleEditDetails(false)}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <Close />
      </IconButton>
      <Typography variant="h6" component="h6" sx={{ mb: 2 }}>
        Edit Account Details for {props.currentUser.Name}
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
          inputRef={rfName}
          label="Change Name"
          variant="outlined"
          margin="normal"
          defaultValue={props.currentUser.Name}
        />
        <TextField
          inputRef={rfPhone}
          label="Change Phone Number"
          variant="outlined"
          margin="normal"
          type="tel"
          defaultValue={props.currentUser.Phone}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={editDetails}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Submit"}
        </Button>
      </Box>
    </Box>
  );
}
