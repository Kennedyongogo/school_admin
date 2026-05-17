import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Swal from "sweetalert2";
import AdminMeetingReportDialog from "../components/AdminMeetings/AdminMeetingReportDialog";
import EventLiveConference from "../components/EventLive/EventLiveConference";
import { useEventLobby } from "../hooks/useEventLobby";
import { useEventHostAlerts } from "../hooks/useEventHostAlerts";
import { useSocket } from "../hooks/useSocket";
import { getLiveSessionApi } from "../utils/liveSessionApi";
import { primeAlertAudio } from "../utils/liveClassAlertSound";
import {
  canEndStaleAdminMeetingLive,
  canNotifyAdminMeetingStaff,
} from "../utils/adminMeetingJoinWindow";

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function getLocalUserId() {
  try {
    const raw = localStorage.getItem("user") || "{}";
    return JSON.parse(raw)?.id || null;
  } catch {
    return null;
  }
}

export default function AdminMeetingLiveRoomPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyNote, setNotifyNote] = useState("");
  const [liveEpoch, setLiveEpoch] = useState(0);
  const [liveActionBusy, setLiveActionBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const userId = getLocalUserId();

  const { socket } = useSocket(token);
  const isCreator = !!session?.is_creator;
  const meeting = session?.meeting;
  const sessionStatus = String(meeting?.session_status || meeting?.status || "").toLowerCase();
  const isEnded = sessionStatus === "ended" || sessionStatus === "cancelled";
  const isLive = sessionStatus === "live";

  const { loading: lobbyLoading, error: lobbyError, myStatus, leaveLobby } = useEventLobby({
    meetingId,
    token,
    socket,
    isStaff: isCreator,
    enabled: !!session && !isCreator,
  });

  const joinWindow = session?.join_window;
  const joinBlocked = joinWindow?.can_join === false;
  const canNotifyStaff = isCreator && canNotifyAdminMeetingStaff(meeting);
  const canEndStaleLive = isCreator && canEndStaleAdminMeetingLive(meeting);

  useEventHostAlerts({
    socket,
    meetingId,
    token,
    enabled: !!session && isCreator && !!token,
  });

  useEffect(() => {
    if (isCreator && token) primeAlertAudio();
  }, [isCreator, token]);

  const reloadSession = useCallback(async () => {
    const res = await fetch(`/api/admin-meetings/${encodeURIComponent(meetingId)}/live`, {
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load meeting.");
    setSession(data.data);
    return data.data;
  }, [meetingId, token]);

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
        if (!cancelled) await reloadSession();
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not open meeting.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meetingId, navigate, token, reloadSession]);

  useEffect(() => {
    if (!socket || !meetingId) return undefined;
    const api = getLiveSessionApi({ meetingId });

    const onLiveEnded = (payload) => {
      if (String(payload?.meeting_id) !== String(meetingId)) return;
      setLiveEpoch((n) => n + 1);
      void reloadSession().catch(() => {});
    };

    const onLiveStarted = (payload) => {
      if (String(payload?.meeting_id) !== String(meetingId)) return;
      setLiveEpoch((n) => n + 1);
      void reloadSession().catch(() => {});
    };

    const joinRoom = () => socket.emit(api.joinSocket, api.id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    socket.on(api.events.liveEnded, onLiveEnded);
    socket.on(api.events.liveStarted, onLiveStarted);

    return () => {
      socket.off("connect", joinRoom);
      socket.off(api.events.liveEnded, onLiveEnded);
      socket.off(api.events.liveStarted, onLiveStarted);
    };
  }, [socket, meetingId, reloadSession]);

  const notifyStaff = async () => {
    if (!token || !meetingId) return;
    setNotifyBusy(true);
    try {
      const res = await fetch(`/api/admin-meetings/${encodeURIComponent(meetingId)}/notify-staff`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ note: notifyNote.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not notify staff");
      const count = data.data?.in_app_notifications_created ?? 0;
      setNotifyNote("");
      void Swal.fire({
        icon: "success",
        title: "Staff notified",
        text: `Sent ${count} notification(s) to staff.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      void Swal.fire({
        icon: "error",
        title: "Notify failed",
        text: e.message || "Could not notify staff",
      });
    } finally {
      setNotifyBusy(false);
    }
  };

  const postLiveAction = async (path) => {
    setLiveActionBusy(true);
    try {
      const res = await fetch(path, { method: "POST", headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Action failed");
      setLiveEpoch((n) => n + 1);
      await reloadSession();
    } finally {
      setLiveActionBusy(false);
    }
  };

  const handleLeaveMeeting = useCallback(() => {
    void leaveLobby();
    navigate("/elimu-plus-online/meetings");
  }, [leaveLobby, navigate]);

  const canJoinVideo =
    !!session?.live_configured &&
    !!meeting?.live_meeting_id &&
    !isEnded &&
    joinWindow?.can_join !== false &&
    (isCreator || myStatus === "admitted");

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  if (session && joinBlocked) {
    return (
      <Box sx={{ maxWidth: 520, mx: "auto", mt: 6, px: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {joinWindow?.reason || "This meeting is not open for hosting or joining."}
        </Alert>
        <Stack direction="row" spacing={1}>
          {canEndStaleLive ? (
            <Button
              variant="contained"
              color="error"
              disabled={liveActionBusy}
              onClick={() =>
                postLiveAction(`/api/admin-meetings/${meetingId}/live/end`).catch((e) => alert(e.message))
              }
            >
              {liveActionBusy ? "Ending…" : "End live session"}
            </Button>
          ) : null}
          <Button variant="outlined" onClick={() => navigate("/elimu-plus-online/meetings")}>
            Back to meetings
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!session?.live_configured || !meeting?.live_meeting_id) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        {isCreator
          ? "Start the live session to open the video room."
          : "The host has not started this meeting yet."}
      </Alert>
    );
  }

  if (!isCreator && (lobbyLoading || myStatus === "waiting" || myStatus === "none")) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, px: 2, textAlign: "center" }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Waiting for host
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {lobbyError || "You are in the waiting room. The meeting creator must admit you before video opens."}
        </Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate("/elimu-plus-online/meetings")}>
          Back to meetings
        </Button>
      </Box>
    );
  }

  if (!isCreator && myStatus === "denied") {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        The host declined your request to join. Try again later or contact the meeting creator.
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
          {meeting.title}
        </Typography>
        <Chip size="small" label={meeting.session_status || "scheduled"} color={isEnded ? "default" : sessionStatus === "live" ? "success" : "default"} />
        <Button
          size="small"
          variant="outlined"
          startIcon={<AssessmentOutlinedIcon />}
          onClick={() => setReportOpen(true)}
        >
          Report
        </Button>
        {isCreator ? (
          <>
            {canNotifyStaff ? (
              <>
                <TextField
                  size="small"
                  placeholder="Notify note (optional)"
                  value={notifyNote}
                  onChange={(e) => setNotifyNote(e.target.value)}
                  sx={{ minWidth: 160, display: { xs: "none", md: "block" } }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<NotificationsActiveOutlinedIcon />}
                  disabled={notifyBusy}
                  onClick={() => void notifyStaff()}
                >
                  {notifyBusy ? "Sending…" : "Notify staff"}
                </Button>
              </>
            ) : null}
            <Button
              size="small"
              variant="contained"
              disabled={liveActionBusy || isLive || joinWindow?.can_join === false}
              onClick={() =>
                postLiveAction(`/api/admin-meetings/${meetingId}/live/start`).catch((e) => alert(e.message))
              }
            >
              {liveActionBusy ? "…" : isEnded ? "Start live again" : "Start live"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={liveActionBusy || !isLive}
              onClick={() =>
                postLiveAction(`/api/admin-meetings/${meetingId}/live/end`).catch((e) => alert(e.message))
              }
            >
              {liveActionBusy ? "…" : "End live"}
            </Button>
          </>
        ) : null}
        <Button size="small" onClick={handleLeaveMeeting}>
          Back
        </Button>
      </Stack>

      {isEnded ? (
        <Alert severity="info" sx={{ m: 2, flexShrink: 0 }}>
          This meeting has ended. {isCreator ? 'Click "Start live" to open a new session. Staff must be admitted again from the waiting room.' : "Wait for the host to start live and admit you."}
        </Alert>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {session.video_mode === "livekit" && canJoinVideo ? (
          <EventLiveConference
            key={`meeting-live-${meetingId}-${liveEpoch}-${isCreator ? "host" : userId}-${myStatus}`}
            meetingId={meetingId}
            token={token}
            eventTitle={meeting.title}
            isHost={isCreator}
            canJoinVideo={canJoinVideo}
            userId={userId}
            onLeave={handleLeaveMeeting}
          />
        ) : session.video_mode === "livekit" && isEnded ? null : (
          <Alert severity="info" sx={{ m: 2 }}>
            Configure LiveKit on the server for video meetings.
          </Alert>
        )}
      </Box>

      <AdminMeetingReportDialog
        meeting={meeting}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </Box>
  );
}
