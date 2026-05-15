import React, { useEffect, useMemo, useRef } from "react";
import { Box, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import SwipeUpRoundedIcon from "@mui/icons-material/SwipeUpRounded";

function RemoteVideo({ stream, label = "Participant", connecting = false, fill = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (stream) {
      el.srcObject = stream;
      void el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
    return () => {
      if (el.srcObject === stream) el.srcObject = null;
    };
  }, [stream]);

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#111827",
        borderRadius: 2,
        overflow: "hidden",
        aspectRatio: fill ? undefined : { xs: "16/9", sm: "16/10" },
        minHeight: fill ? 0 : { xs: 140, sm: 160 },
        height: fill ? "100%" : undefined,
        flex: fill ? 1 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {stream ? (
        <video ref={ref} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Typography variant="body2" color="grey.500">
          {connecting ? "Connecting…" : "No video"}
        </Typography>
      )}
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
          maxWidth: "calc(100% - 16px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function LocalTile({ localVideoRef, localLabel, pip = false }) {
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#111827",
        borderRadius: pip ? 2 : 2,
        overflow: "hidden",
        width: pip ? { xs: 112, sm: 128 } : "100%",
        height: pip ? { xs: 148, sm: 168 } : undefined,
        aspectRatio: pip ? undefined : { xs: "16/9", sm: "16/10" },
        minHeight: pip ? undefined : { xs: 140, sm: 160 },
        flexShrink: 0,
        boxShadow: pip ? 4 : 0,
        border: pip ? "2px solid rgba(255,255,255,0.35)" : undefined,
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
          left: 6,
          bottom: 6,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "#fff",
          px: 0.75,
          py: 0.25,
          borderRadius: 1,
          fontSize: "0.65rem",
          maxWidth: "calc(100% - 12px)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {localLabel}
      </Typography>
    </Box>
  );
}

export default function VideoGrid({
  localStream,
  remoteStreams,
  peerNames,
  localVideoRef,
  localLabel = "You",
  fillHeight = false,
}) {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));

  const remotePeerIds = useMemo(() => {
    const ids = new Set(peerNames?.keys?.() || []);
    remoteStreams?.forEach((_, id) => ids.add(id));
    return Array.from(ids);
  }, [peerNames, remoteStreams]);

  const totalInCall = 1 + remotePeerIds.length;
  const hasRemotes = remotePeerIds.length > 0;

  if (isNarrow) {
    const primaryId = remotePeerIds[0];
    const primaryStream = primaryId ? remoteStreams?.get?.(primaryId) : null;
    const primaryLabel = primaryId ? peerNames?.get?.(primaryId) || "Guest" : "";
    const extraRemotes = remotePeerIds.slice(1);

    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          bgcolor: "#0b1220",
          overflow: "hidden",
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 1, pb: 0.5 }}>
          {hasRemotes ? (
            <RemoteVideo
              stream={primaryStream}
              label={primaryStream ? primaryLabel : `${primaryLabel} (connecting…)`}
              connecting={!primaryStream}
              fill
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                bgcolor: "#111827",
                p: 2,
                textAlign: "center",
              }}
            >
              <Stack spacing={1} alignItems="center">
                <Typography variant="body1" color="grey.300" sx={{ fontWeight: 600 }}>
                  Waiting for others…
                </Typography>
                <Typography variant="caption" color="grey.500">
                  You are in the room ({totalInCall} on your device). Others appear here when they connect.
                </Typography>
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
            }}
          >
            <LocalTile localVideoRef={localVideoRef} localLabel={localLabel} pip />
          </Box>

          <Chip
            size="small"
            label={`${totalInCall} in call`}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 2,
              bgcolor: "rgba(0,0,0,0.55)",
              color: "#fff",
            }}
          />
        </Box>

        {extraRemotes.length > 0 ? (
          <Box sx={{ flexShrink: 0, px: 1, pb: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5, px: 0.5 }}>
              <SwipeUpRoundedIcon sx={{ fontSize: 16, color: "grey.500" }} />
              <Typography variant="caption" color="grey.500">
                Swipe sideways for {extraRemotes.length} more
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 0.5,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {extraRemotes.map((socketId) => {
                const stream = remoteStreams?.get?.(socketId);
                const label = peerNames?.get?.(socketId) || "Guest";
                return (
                  <Box key={socketId} sx={{ minWidth: 140, width: 140, flexShrink: 0 }}>
                    <RemoteVideo
                      stream={stream}
                      label={stream ? label : `${label} (connecting…)`}
                      connecting={!stream}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 1.5,
        flex: 1,
        height: fillHeight ? "100%" : undefined,
        minHeight: 0,
        overflow: "auto",
        p: 1.5,
        alignContent: fillHeight ? "stretch" : undefined,
      }}
    >
      <LocalTile localVideoRef={localVideoRef} localLabel={localLabel} />
      {remotePeerIds.map((socketId) => {
        const stream = remoteStreams?.get?.(socketId);
        const label = peerNames?.get?.(socketId) || "Guest";
        return (
          <RemoteVideo
            key={socketId}
            stream={stream}
            label={stream ? label : `${label} (connecting…)`}
            connecting={!stream}
            fill={fillHeight}
          />
        );
      })}
    </Box>
  );
}
