import React from "react";
import { Box, Typography } from "@mui/material";

export default function VideoGrid({ localStream, remoteStreams, localVideoRef, localLabel = "You" }) {
  const remotes = Array.from(remoteStreams?.entries?.() || []);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 1.5,
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        p: 1.5,
      }}
    >
      <Box
        sx={{
          position: "relative",
          bgcolor: "#111827",
          borderRadius: 2,
          overflow: "hidden",
          aspectRatio: "16/10",
          minHeight: 160,
        }}
      >
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            left: 8,
            bottom: 8,
            bgcolor: "rgba(0,0,0,0.55)",
            color: "#fff",
            px: 1,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          {localLabel}
        </Typography>
      </Box>

      {remotes.map(([socketId, stream]) => (
        <Box
          key={socketId}
          sx={{
            position: "relative",
            bgcolor: "#111827",
            borderRadius: 2,
            overflow: "hidden",
            aspectRatio: "16/10",
            minHeight: 160,
          }}
        >
          <video
            autoPlay
            playsInline
            ref={(el) => {
              if (el && stream) el.srcObject = stream;
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              left: 8,
              bottom: 8,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "#fff",
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            Participant
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
