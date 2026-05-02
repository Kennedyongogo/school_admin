import React from "react";
import { Box, IconButton, Typography, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function UserAccount(props) {
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
        onClick={() => props.setToggleAccount(false)}
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
        Account Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Name:</strong> {props.currentUser.Name}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Phone:</strong> {props.currentUser.Phone}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Email:</strong> {props.currentUser.Email}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Department:</strong> {props.currentUser.Department}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Position:</strong> {props.currentUser.Position}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Role:</strong> {props.currentUser.Role}
        </Typography>
        {props.currentUser.Status && (
          <Typography variant="body1">
            <strong>Status:</strong> Active
          </Typography>
        )}
      </Box>
    </Box>
  );
}
