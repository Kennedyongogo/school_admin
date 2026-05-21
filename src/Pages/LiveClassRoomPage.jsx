import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import VideoConference from "../components/VideoConference/VideoConference";
import LiveKitConference from "../components/VideoConference/LiveKitConference";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function LiveClassRoomPage() {
  const { liveClassId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(null);
  const [userName, setUserName] = useState("Teacher");

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      navigate("/", { replace: true });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/school-portal/live-class/${encodeURIComponent(liveClassId)}`, {
          headers: authHeaders(token),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load live class room.");
        if (cancelled) return;
        setRoom(data.data);
        try {
          const saved = localStorage.getItem("user");
          if (saved) {
            const u = JSON.parse(saved);
            setUserName(u?.full_name || u?.username || "Teacher");
          }
        } catch {
          // optional display name
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not open live class.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [liveClassId, navigate, token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!room?.meeting_id) {
    return <Alert severity="warning">This session has no video room configured.</Alert>;
  }

  return (
    <Box sx={{ mx: -3, mt: -3, mb: -3, height: "calc(100vh - 72px)", minHeight: 480, maxWidth: "100vw", overflow: "hidden" }}>
      <Box sx={{ height: "100%", width: "100%", maxWidth: "100%", borderRadius: 0, overflow: "hidden", border: 1, borderColor: "divider" }}>
        {room.video_mode === "livekit" || room.platform === "livekit" ? (
          <LiveKitConference
            token={token}
            liveClassId={liveClassId}
            userName={userName}
            role={room.role || "teacher"}
            mediaMode={room.media_mode || (room.role === "teacher" ? "video" : "optional")}
            onLeave={() => navigate(-1)}
          />
        ) : (
          <VideoConference
            token={token}
            meetingId={room.meeting_id}
            liveClassId={liveClassId}
            userName={userName}
            role={room.role || "teacher"}
            iceServers={room.ice_servers}
            onLeave={() => navigate(-1)}
          />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, px: 3 }}>
        {room.subject_name || "Online class"} — students join from their portal notification or Classes page.
      </Typography>
    </Box>
  );
}
