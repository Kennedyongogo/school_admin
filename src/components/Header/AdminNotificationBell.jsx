import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  keyframes,
} from "@mui/material";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket";
import { playStaffNotificationAlert, primeAlertAudio } from "../../utils/liveClassAlertSound";

const ringPulse = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.15) rotate(-8deg); }
  50% { transform: scale(1.1) rotate(8deg); }
  75% { transform: scale(1.12) rotate(-4deg); }
  100% { transform: scale(1); }
`;

const authHeaders = (token) => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function isMeetingNotification(n) {
  return String(n?.title || "").toLowerCase().includes("staff meeting");
}

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const { socket } = useSocket(token);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [listOpen, setListOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [highlight, setHighlight] = useState(null);
  const [ringAnim, setRingAnim] = useState(false);
  const lastUnreadRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await fetch("/api/admin/notifications", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        console.warn("[notifications]", data.message || res.status);
        setUnreadCount(0);
        setNotifications([]);
        return { unread: 0, list: [] };
      }
      const unread = Number(data.data?.unread_count) || 0;
      const list = Array.isArray(data.data?.notifications) ? data.data.notifications : [];
      setUnreadCount(unread);
      setNotifications(list);
      return { unread, list };
    } catch (e) {
      console.warn("[notifications]", e?.message || e);
      setUnreadCount(0);
      setNotifications([]);
      return { unread: 0, list: [] };
    }
  }, [token]);

  const handleIncoming = useCallback(
    (notification) => {
      if (!notification?.id) return;
      primeAlertAudio();
      playStaffNotificationAlert();
      setRingAnim(true);
      setTimeout(() => setRingAnim(false), 700);
      setHighlight(notification);
      setAlertOpen(true);
      setNotifications((prev) => {
        const next = [notification, ...prev.filter((n) => n.id !== notification.id)];
        return next.slice(0, 80);
      });
      setUnreadCount((c) => c + (notification.is_read ? 0 : 1));
    },
    []
  );

  useEffect(() => {
    if (!token) return undefined;
    primeAlertAudio();
    let cancelled = false;
    (async () => {
      try {
        const { unread } = (await loadNotifications()) || {};
        if (!cancelled) lastUnreadRef.current = unread ?? 0;
      } catch {
        /* ignore */
      }
    })();
    const poll = setInterval(() => {
      void loadNotifications().then((r) => {
        if (!r) return;
        if (lastUnreadRef.current != null && r.unread > lastUnreadRef.current) {
          const newest = r.list.find((n) => !n.is_read);
          if (newest) handleIncoming(newest);
        }
        lastUnreadRef.current = r.unread;
      });
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [token, loadNotifications, handleIncoming]);

  useEffect(() => {
    if (!socket || !token) return undefined;
    const onNew = (payload) => {
      if (payload?.notification) handleIncoming(payload.notification);
    };
    socket.on("admin-notification:new", onNew);
    return () => {
      socket.off("admin-notification:new", onNew);
    };
  }, [socket, token, handleIncoming]);

  const markRead = async (id) => {
    if (!token || !id) return;
    await fetch(`/api/admin/notifications/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
      headers: authHeaders(token),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!token) return;
    await fetch("/api/admin/notifications/mark-all-read", {
      method: "POST",
      headers: authHeaders(token),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const openMeeting = async (n) => {
    const url = n?.action_url || "";
    const match = url.match(/\/live\/meeting\/([^/?#]+)/);
    if (match) {
      if (!n.is_read) await markRead(n.id);
      setAlertOpen(false);
      setListOpen(false);
      navigate(`/live/meeting/${match[1]}`);
      return;
    }
    if (url.startsWith("/")) {
      if (!n.is_read) await markRead(n.id);
      setAlertOpen(false);
      setListOpen(false);
      navigate(url);
    }
  };

  const openBell = () => {
    primeAlertAudio();
    setListOpen(true);
    void loadNotifications();
  };

  if (!token) return null;

  const spotlight = highlight || notifications.find((n) => !n.is_read) || notifications[0];

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={openBell}
        sx={{
          mr: 1,
          animation: ringAnim ? `${ringPulse} 0.7s ease-in-out` : "none",
        }}
      >
        <Badge
          badgeContent={unreadCount > 99 ? "99+" : unreadCount}
          color="warning"
          invisible={unreadCount <= 0}
          sx={{
            "& .MuiBadge-badge": {
              fontWeight: 800,
              boxShadow: "0 0 0 2px rgba(0,0,0,0.15)",
            },
          }}
        >
          <NotificationsNoneRoundedIcon />
        </Badge>
      </IconButton>

      {/* Centered spotlight when a new alert arrives */}
      <Dialog
        open={alertOpen && !!spotlight}
        onClose={() => setAlertOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(15, 118, 110, 0.35)",
          },
        }}
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(4px)", bgcolor: "rgba(15, 23, 42, 0.55)" } },
        }}
      >
        {spotlight ? (
          <>
            <Box
              sx={{
                background: "linear-gradient(135deg, #115E59 0%, #0F766E 50%, #14B8A6 100%)",
                color: "#fff",
                px: 3,
                py: 2.5,
                position: "relative",
              }}
            >
              <IconButton
                onClick={() => setAlertOpen(false)}
                sx={{ position: "absolute", right: 8, top: 8, color: "rgba(255,255,255,0.9)" }}
                size="small"
                aria-label="Close"
              >
                <CloseRoundedIcon />
              </IconButton>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isMeetingNotification(spotlight) ? (
                    <GroupsRoundedIcon sx={{ fontSize: 28 }} />
                  ) : (
                    <NotificationsNoneRoundedIcon sx={{ fontSize: 28 }} />
                  )}
                </Box>
                <Box sx={{ pr: 4 }}>
                  <Chip
                    size="small"
                    label="New alert"
                    sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, mb: 0.5 }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                    {spotlight.title}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <DialogContent sx={{ px: 3, py: 2.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {formatWhen(spotlight.created_at)}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {spotlight.message}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: "wrap" }}>
              <Button onClick={() => setAlertOpen(false)} color="inherit">
                Dismiss
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setAlertOpen(false);
                  setListOpen(true);
                }}
              >
                View all
              </Button>
              {spotlight.action_url ? (
                <Button
                  variant="contained"
                  startIcon={<VideocamRoundedIcon />}
                  onClick={() => void openMeeting(spotlight)}
                  sx={{ bgcolor: "#0F766E", "&:hover": { bgcolor: "#115E59" } }}
                >
                  Open meeting
                </Button>
              ) : null}
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Full list from bell click */}
      <Dialog
        open={listOpen}
        onClose={() => setListOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "85vh",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          },
        }}
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(3px)" } },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button size="small" disabled={unreadCount <= 0} onClick={() => void markAllRead()}>
              Mark all read
            </Button>
            <IconButton onClick={() => setListOpen(false)} aria-label="Close list">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
              <NotificationsNoneRoundedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">No notifications yet.</Typography>
            </Box>
          ) : (
            <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
              {notifications.map((n) => (
                <Box
                  key={n.id}
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: n.is_read ? "transparent" : "action.hover",
                    cursor: n.action_url ? "pointer" : "default",
                    "&:hover": { bgcolor: n.is_read ? "action.hover" : "action.selected" },
                  }}
                  onClick={() => {
                    if (n.action_url) void openMeeting(n);
                    else if (!n.is_read) void markRead(n.id);
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        mt: 0.25,
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        bgcolor: isMeetingNotification(n) ? "#CCFBF1" : "grey.100",
                        color: isMeetingNotification(n) ? "#0F766E" : "text.secondary",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isMeetingNotification(n) ? <GroupsRoundedIcon /> : <NotificationsNoneRoundedIcon />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {n.title}
                        </Typography>
                        {!n.is_read ? <Chip size="small" label="New" color="warning" sx={{ height: 20 }} /> : null}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatWhen(n.created_at)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.message}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
