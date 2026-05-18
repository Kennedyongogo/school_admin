import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExamLiveKitConference from "../components/VideoConference/ExamLiveKitConference";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function ExamLiveRoomPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [room, setRoom] = useState(null);
  const [initiating, setInitiating] = useState(false);

  const ensureLiveSession = async () => {
    const res = await fetch(`/api/exam-schedules/${encodeURIComponent(scheduleId)}/live-session/initiate`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not start exam session.");
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
        let row = null;
        const roomRes = await fetch(`/api/school-portal/exam-schedule/${encodeURIComponent(scheduleId)}`, {
          headers: authHeaders(token),
        });
        const roomData = await roomRes.json().catch(() => ({}));
        if (roomRes.ok && roomData.success) row = roomData.data;

        if (!row?.meeting_id || row?.video_mode !== "livekit") {
          setInitiating(true);
          await ensureLiveSession();
          const again = await fetch(`/api/school-portal/exam-schedule/${encodeURIComponent(scheduleId)}`, {
            headers: authHeaders(token),
          });
          const againData = await again.json().catch(() => ({}));
          if (!again.ok || !againData.success) throw new Error(againData.message || "Could not load exam room.");
          row = againData.data;
        }
        if (cancelled) return;
        if (row?.video_mode !== "livekit") {
          throw new Error("LiveKit is not configured for this exam. Set ONLINE_MEETING_PLATFORM=livekit on the server.");
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
  }, [scheduleId, navigate, token]);

  if (loading || initiating) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">{initiating ? "Starting LiveKit exam session…" : "Loading…"}</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mx: -3, mt: -3, mb: -3, height: "calc(100vh - 72px)", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
          Exam invigilation · {room?.exam_title || "Exam"}
        </Typography>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ExamLiveKitConference
          token={token}
          examScheduleId={scheduleId}
          examTitle={room?.exam_title}
          mediaMode={room?.media_mode || "video"}
          onLeave={() => navigate(-1)}
        />
      </Box>
    </Box>
  );
}
