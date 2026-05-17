import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import EventLiveConference from "../components/EventLive/EventLiveConference";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export default function EventLiveRoomPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);

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
        const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/live`, { headers: authHeaders(token) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not load event live session.");
        if (!cancelled) setSession(data.data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not open event.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, navigate, token]);

  const postLiveAction = async (path) => {
    const res = await fetch(path, { method: "POST", headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Action failed");
    const liveRes = await fetch(`/api/events/${encodeURIComponent(eventId)}/live`, { headers: authHeaders(token) });
    const liveJson = await liveRes.json().catch(() => ({}));
    if (liveRes.ok && liveJson.success) setSession(liveJson.data);
  };

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

  const ev = session?.event;
  const joinWindow = session?.join_window;

  if (!session?.live_configured || !ev?.live_meeting_id) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        This event has no video room yet. Start the live session from HR → News & Events, or save the event as online/hybrid first.
      </Alert>
    );
  }

  return (
    <Box sx={{ mx: -3, mt: -3, mb: -3, height: "calc(100vh - 72px)", minHeight: 520, display: "flex", flexDirection: "column" }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        sx={{ px: 2, py: 1, bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
        useFlexGap
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, flex: 1 }}>
          {ev.title}
        </Typography>
        <Chip size="small" label={ev.session_status || "scheduled"} />
        {joinWindow?.can_join ? <Chip size="small" label="Join open" color="success" /> : <Chip size="small" label="Join closed" />}
        <Button size="small" variant="contained" onClick={() => postLiveAction(`/api/events/${eventId}/live/start`).catch((e) => alert(e.message))}>
          Start live
        </Button>
        <Button size="small" variant="outlined" color="error" onClick={() => postLiveAction(`/api/events/${eventId}/live/end`).catch((e) => alert(e.message))}>
          End live
        </Button>
        <Button size="small" onClick={() => navigate("/hr")}>
          Back to HR
        </Button>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {session.video_mode === "livekit" ? (
          <EventLiveConference
            eventId={eventId}
            token={token}
            eventTitle={ev.title}
            isHost
            canJoinVideo={joinWindow?.can_join !== false}
            onLeave={() => navigate("/hr")}
          />
        ) : (
          <Alert severity="info" sx={{ m: 2 }}>
            WebRTC mode: use the same LiveKit configuration for the best experience.
          </Alert>
        )}
      </Box>
    </Box>
  );
}
