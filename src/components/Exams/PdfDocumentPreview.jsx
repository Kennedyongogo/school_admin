import React from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import StablePdfIframe from "./StablePdfIframe";

const accent = "#DC2626";

export default function PdfDocumentPreview({
  url,
  loading = false,
  error = "",
  emptyMessage = "No PDF to preview yet.",
  title = "PDF preview",
  height = { xs: 360, md: 480 },
}) {
  if (error && !url) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (loading && !url) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height,
          bgcolor: "#f9fafb",
          borderRadius: 1,
          border: "1px solid #e5e7eb",
        }}
      >
        <CircularProgress size={28} sx={{ color: accent }} />
      </Box>
    );
  }

  if (!url) {
    return <Alert severity="info">{emptyMessage}</Alert>;
  }

  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden", bgcolor: "#fff" }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", px: 1.25, py: 0.75, bgcolor: "#f9fafb" }}>
        {title}
      </Typography>
      <StablePdfIframe src={url} title={title} height={height} />
    </Box>
  );
}
