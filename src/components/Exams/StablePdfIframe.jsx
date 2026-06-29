import React, { memo } from "react";
import { Box } from "@mui/material";

function StablePdfIframe({ src, title = "Exam PDF", height = 480 }) {
  if (!src) return null;
  return (
    <Box
      component="iframe"
      src={src}
      title={title}
      sx={{ width: "100%", height, border: "none", bgcolor: "#fff", display: "block" }}
    />
  );
}

export default memo(StablePdfIframe, (prev, next) => prev.src === next.src);
