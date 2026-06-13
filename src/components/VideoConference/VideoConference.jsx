import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useSocket } from "../../hooks/useSocket";
import { useWebRTC } from "../../hooks/useWebRTC";
import VideoGrid from "./VideoGrid";
import Controls from "./Controls";
import LiveClassHostLayout from "./LiveClassHostLayout";

const EMPTY_ICE = Object.freeze([]);

export default function VideoConference({
  token,
  meetingId,
  liveClassId,
  userName,
  role = "student",
  iceServers,
  onLeave,
  showLobbyPanel = true,
}) {
  const localVideoRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [ready, setReady] = useState(false);
  const joinStartedRef = useRef(false);
  const unmountedRef = useRef(false);
  const [peerNames, setPeerNames] = useState(() => new Map());
  const [mobilePanel, setMobilePanel] = useState("video");
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("md"));

  const stableIce = useMemo(() => {
    if (Array.isArray(iceServers) && iceServers.length) return iceServers;
    return EMPTY_ICE;
  }, [iceServers]);

  const { socket, connected } = useSocket(token);
  const { localStream, remoteStreams, initLocalStream, callUser, closePeer, cleanupPeers, stopLocalStream } = useWebRTC({
    socket,
    iceServers: stableIce,
    enabled: !!meetingId && !!token,
  });

  const callUserRef = useRef(callUser);
  const closePeerRef = useRef(closePeer);
  const cleanupPeersRef = useRef(cleanupPeers);
  const stopLocalStreamRef = useRef(stopLocalStream);
  const initLocalStreamRef = useRef(initLocalStream);
  const onLeaveRef = useRef(onLeave);

  callUserRef.current = callUser;
  closePeerRef.current = closePeer;
  cleanupPeersRef.current = cleanupPeers;
  stopLocalStreamRef.current = stopLocalStream;
  initLocalStreamRef.current = initLocalStream;
  onLeaveRef.current = onLeave;

  const runJoin = useCallback(async () => {
    if (!socket || !meetingId || joinStartedRef.current || unmountedRef.current) return;
    joinStartedRef.current = true;

    try {
      setMediaError("");
      await initLocalStreamRef.current({ video: true, audio: true });
      if (unmountedRef.current) return;

      socket.emit("join-webrtc-room", {
        meetingId,
        liveClassId,
        userName,
        role,
      });
      setReady(true);
    } catch (e) {
      joinStartedRef.current = false;
      if (!unmountedRef.current) {
        const msg =
          e?.name === "NotFoundError" || /not found|device not found/i.test(String(e?.message || ""))
            ? "No camera or microphone found. Connect a device or use a machine with audio/video hardware."
            : e.message || "Could not access camera or microphone.";
        setMediaError(msg);
      }
    }
  }, [socket, meetingId, liveClassId, userName, role]);

  const rememberPeer = useCallback((p) => {
    if (!p?.socketId) return;
    const label = String(p.userName || p.user_name || "").trim() || "Guest";
    setPeerNames((prev) => {
      if (prev.get(p.socketId) === label) return prev;
      const next = new Map(prev);
      next.set(p.socketId, label);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const onUserJoined = (p) => {
      if (!p?.socketId || p.socketId === socket.id) return;
      rememberPeer(p);
      // New joiner calls us — we only answer their offer (avoids offer glare).
    };

    const onRoomParticipants = (participants) => {
      (participants || []).forEach((p) => {
        if (!p?.socketId || p.socketId === socket.id) return;
        rememberPeer(p);
        void callUserRef.current(p.socketId);
      });
    };

    const onUserLeft = ({ socketId }) => {
      if (!socketId) return;
      closePeerRef.current(socketId);
      setPeerNames((prev) => {
        if (!prev.has(socketId)) return prev;
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    };

    socket.on("user-joined", onUserJoined);
    socket.on("room-participants", onRoomParticipants);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("room-participants", onRoomParticipants);
      socket.off("user-left", onUserLeft);
    };
  }, [socket, rememberPeer]);

  useEffect(() => {
    unmountedRef.current = false;
    joinStartedRef.current = false;
    setReady(false);
    setMediaError("");

    if (!socket || !meetingId) return undefined;

    if (connected) {
      void runJoin();
    } else {
      const onConnect = () => {
        void runJoin();
      };
      socket.on("connect", onConnect);
      return () => {
        socket.off("connect", onConnect);
      };
    }

    return undefined;
  }, [socket, meetingId, liveClassId, connected, runJoin]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      joinStartedRef.current = false;
      socket?.emit("leave-webrtc-room");
      cleanupPeersRef.current();
      stopLocalStreamRef.current();
    };
  }, [socket]);

  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream && el.srcObject !== localStream) {
      el.srcObject = localStream;
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
    if (!track) {
      setCamOn(false);
      return;
    }
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const handleLeave = () => {
    unmountedRef.current = true;
    joinStartedRef.current = false;
    cleanupPeers();
    stopLocalStream();
    socket?.emit("leave-webrtc-room");
    onLeaveRef.current?.();
  };

  const hasVideoTrack = !!localStream?.getVideoTracks()?.length;
  const isTeacher = role === "teacher";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%", maxWidth: "100%", overflow: "hidden", bgcolor: "#0b1220" }}>
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
        {role === "teacher" ? <Chip size="small" label="Host" color="primary" sx={{ display: { xs: "none", sm: "flex" } }} /> : null}
      </Box>

      {mediaError ? (
        <Alert severity="warning" sx={{ m: 2 }}>
          {mediaError}
        </Alert>
      ) : null}

      <LiveClassHostLayout
        isTeacher={isTeacher}
        showLobbyPanel={showLobbyPanel}
        isNarrow={isNarrow}
        mobilePanel={mobilePanel}
        onMobilePanelChange={setMobilePanel}
        liveClassId={liveClassId}
        token={token}
        socket={socket}
        userName={userName}
        videoSlot={
          !ready && !mediaError ? (
            <Box sx={{ flex: 1, height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ flex: 1, height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }}>
              <VideoGrid
                localStream={localStream}
                remoteStreams={remoteStreams}
                peerNames={peerNames}
                localVideoRef={localVideoRef}
                localLabel={hasVideoTrack ? userName || "You" : `${userName || "You"} (audio only)`}
                fillHeight
              />
            </Box>
          )
        }
      />

      <Controls micOn={micOn} camOn={camOn && hasVideoTrack} onToggleMic={toggleMic} onToggleCam={toggleCam} onLeave={handleLeave} />
    </Box>
  );
}
