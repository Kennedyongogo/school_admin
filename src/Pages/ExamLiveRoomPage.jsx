import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExamLiveKitConference from "../components/VideoConference/ExamLiveKitConference";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function needsLiveKitSetup(row) {
  if (!row?.uses_live_invigilation) return false;
  const platform = String(row?.platform || row?.meeting_provider || "").toLowerCase();
  if (platform === "google_meet" || platform === "googlemeet" || platform === "meet") return true;
  const join = String(row?.meeting_join_url || row?.meet_join_url || "").trim();
  if (join.includes("meet.google.com")) return true;
  return row?.video_mode !== "livekit" || !row?.meeting_id;
}

export default function ExamLiveRoomPage() {
  const { scheduleId, examId } = useParams();
  const id = examId || scheduleId;
  const navigate = useNavigate();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const leaveLiveRoomRef = useRef(null);

  const loadRoom = async () => {
    const roomRes = await fetch(`/api/school-portal/exam/${encodeURIComponent(id)}`, {
      headers: authHeaders(token),
    });
    const roomData = await roomRes.json().catch(() => ({}));
    if (!roomRes.ok || !roomData.success) {
      throw new Error(roomData.message || "Could not load exam room.");
    }
    return roomData.data;
  };

  const ensureLiveSession = async () => {
    const res = await fetch(`/api/exams/${encodeURIComponent(id)}/live-session/initiate`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ prefer_livekit: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Could not start LiveKit exam session.");
    }
    return data.data;
  };

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
        let row = await loadRoom();
        if (needsLiveKitSetup(row)) {
          setInitiating(true);
          await ensureLiveSession();
          row = await loadRoom();
        }
        if (cancelled) return;
        if (row?.uses_live_invigilation && (row?.video_mode !== "livekit" || !row?.meeting_id)) {
          throw new Error(
            "LiveKit room was not prepared. In Exams, open this exam again after saving it as Live invigilation with LiveKit configured on the API."
          );
        }
        setRoom(row);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not open exam room.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitiating(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate, token]);

  if (loading || initiating) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: "#0b1220",
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          {initiating ? "Preparing LiveKit exam room…" : "Loading…"}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 560 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/exams")} sx={{ mr: 1 }}>
          Back to exams
        </Button>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1300,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "#0b1220",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <IconButton
        size="small"
        onClick={() => {
          if (leaveLiveRoomRef.current) leaveLiveRoomRef.current();
          else navigate(-1);
        }}
        aria-label="Back"
        sx={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 30,
          bgcolor: "rgba(0,0,0,0.55)",
          color: "#fff",
          "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
        }}
      >
        <ArrowBackIcon fontSize="small" />
      </IconButton>
      <ExamLiveKitConference
        token={token}
        examScheduleId={id}
        mediaMode={room?.media_mode || "video"}
        onRegisterLeave={(fn) => {
          leaveLiveRoomRef.current = fn;
        }}
        onLeave={() => navigate(-1)}
      />
    </Box>
  );
}
