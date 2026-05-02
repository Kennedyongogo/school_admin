import * as React from "react";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/material";

export default function NotFound() {
  return (
    <Box
      marginTop={8}
      sx={{ display: "grid", height: "60vh", placeContent: "center" }}
    >
      <Stack
        spacing={2}
        component={Card}
        sx={{ boxShadow: "0px 8px 24px #60606040", p: 3 }}
      >
        <Typography variant="h4" textAlign="center" color="primary">
          Not Found!
        </Typography>
        <Divider />
        <Typography variant="body1" textAlign="center" color="secondary">
          This page does not exist or you are not authorised to view it! Contact
          Administrator
        </Typography>
      </Stack>
    </Box>
  );
}
