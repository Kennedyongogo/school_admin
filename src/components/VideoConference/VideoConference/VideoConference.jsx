import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useSocket } from "../../hooks/useSocket";
import { useWebRTC } from "../../hooks/useWebRTC";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";

export default function VideoConference({
  token,
  meetingId,
  liveClassId,
  userName,
  role = "student",
  iceServers = [],
  onLeave,
}) {
  const localVideoRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [ready, setReady] = useState(false);

  const { socket, connected } = useSocket(token);
  const { localStream, remoteStreams, initLocalStream, callUser, cleanupPeers, stopLocalStream } = useWebRTC({
    socket,
    iceServers,
    enabled: !!meetingId && !!token,
  });

  useEffect(() => {
    if (!meetingId || !socket || !connected) return undefined;

    let cancelled = false;

    const start = async () => {
      try {
        setMediaError("");
        await initLocalStream({ video: true, audio: true });
        if (cancelled) return;
        socket.emit("join-webrtc-room", {
          meetingId,
          liveClassId,
          userName,
          role,
        });
        setReady(true);
      } catch (e) {
        setMediaError(e.message || "Could not access camera or microphone.");
      }
    };

    void start();

    const onUserJoined = ({ socketId }) => {
      if (socketId && socketId !== socket.id) void callUser(socketId);
    };

    const onRoomParticipants = (participants) => {
      (participants || []).forEach((p) => {
        if (p?.socketId && p.socketId !== socket.id) void callUser(p.socketId);
      });
    };

    socket.on("user-joined", onUserJoined);
    socket.on("room-participants", onRoomParticipants);

    return () => {
      cancelled = true;
      socket.off("user-joined", onUserJoined);
      socket.off("room-participants", onRoomParticipants);
      socket.emit("leave-webrtc-room");
      cleanupPeers();
      stopLocalStream();
      setReady(false);
    };
  }, [
    meetingId,
    liveClassId,
    socket,
    connected,
    userName,
    role,
    initLocalStream,
    callUser,
    cleanupPeers,
    stopLocalStream,
  ]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const toggleMic = () => {
    const track = localStream?.getAudioTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    const track = localStream?.getVideoTracks()?.[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const handleLeave = () => {
    cleanupPeers();
    stopLocalStream();
    if (socket) socket.emit("leave-webrtc-room");
    onLeave?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: "#0b1220" }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
          Live class
        </Typography>
        <Chip size="small" label={connected ? "Connected" : "Connecting…"} color={connected ? "success" : "default"} />
        {role === "teacher" ? <Chip size="small" label="Host" color="primary" /> : null}
      </Box>

      {mediaError ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {mediaError}
        </Alert>
      ) : null}

      {!ready && !mediaError ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
          localVideoRef={localVideoRef}
          localLabel={userName || "You"}
        />
      )}

      <Controls micOn={micOn} camOn={camOn} onToggleMic={toggleMic} onToggleCam={toggleCam} onLeave={handleLeave} />
    </Box>
  );
}
