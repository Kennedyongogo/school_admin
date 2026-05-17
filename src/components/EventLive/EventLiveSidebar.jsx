import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import BackHandRoundedIcon from "@mui/icons-material/BackHandRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import { useEventInteraction } from "../../hooks/useEventInteraction";

const REACTIONS = [
  "👍",
  "👎",
  "👏",
  "🙌",
  "❤️",
  "😂",
  "😮",
  "😢",
  "😍",
  "🤔",
  "🎉",
  "🔥",
  "💯",
  "✅",
  "❌",
  "⭐",
  "💡",
  "🙋",
];

function authorLabel(author) {
  return author?.full_name || author?.username || "User";
}

const CHAT_ROW_ESTIMATE_PX = 72;
const chatListHeight = 10 * CHAT_ROW_ESTIMATE_PX;

const scrollBodySx = {
  flex: "0 0 auto",
  flexShrink: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
};

const sidebarSurfaceSx = {
  bgcolor: "background.paper",
  color: "text.primary",
  "& .MuiTypography-root:not(.MuiTypography-colorTextSecondary)": { color: "text.primary" },
  "& .MuiInputBase-input": { color: "text.primary" },
};

export default function EventLiveSidebar({
  eventId,
  meetingId,
  token,
  socket,
  isStaff = true,
  userId,
  variant = "sidebar",
}) {
  const isDock = variant === "dock";
  const isMeeting = !!meetingId;
  const [tab, setTab] = useState(0);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);

  const {
    chat,
    reactions,
    raisedHands,
    loading,
    error,
    myHandRaised,
    sendChat,
    markAnswered,
    toggleRaiseHand,
    dismissHand,
    sendReaction,
  } = useEventInteraction({
    eventId,
    meetingId,
    token,
    socket,
    isStaff,
    userId,
  });

  const chatMessages = useMemo(() => chat.filter((m) => !m.is_question), [chat]);
  const questions = useMemo(() => chat.filter((m) => m.is_question), [chat]);
  const openQuestionCount = useMemo(() => questions.filter((m) => !m.is_answered).length, [questions]);
  const isQuestionsTab = tab === 1;
  const list = isQuestionsTab ? questions : chatMessages;

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    setBusy(true);
    try {
      await sendChat({
        message: msg,
        is_question: false,
        parent_id: replyTo?.id || null,
      });
      setText("");
      setReplyTo(null);
    } catch (e) {
      alert(e.message || "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        flex: isDock ? "0 0 auto" : "1 1 auto",
        height: isDock ? "auto" : "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        flexShrink: isDock ? 0 : undefined,
        ...sidebarSurfaceSx,
      }}
    >
      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {isMeeting ? "Meeting interactions" : "Event interactions"}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="nowrap" useFlexGap sx={{ overflowX: "auto", pb: 0.25 }}>
          {REACTIONS.map((emoji) => (
            <IconButton key={emoji} size="small" aria-label={`React ${emoji}`} onClick={() => void sendReaction(emoji)} sx={{ fontSize: "1.1rem" }}>
              {emoji}
            </IconButton>
          ))}
        </Stack>
        <Stack
          spacing={0.25}
          sx={{
            mt: 0.75,
            minHeight: 100,
            maxHeight: 132,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
            pr: 0.5,
          }}
        >
          {reactions.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              {isMeeting
                ? "Reactions appear here for everyone in the meeting."
                : "Reactions appear here for everyone in the event."}
            </Typography>
          ) : (
            reactions.slice(-40).map((r, i) => (
              <Typography
                key={`${r.user_id}-${r.at}-${r.emoji}-${i}`}
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", lineHeight: 1.35, py: 0.15 }}
              >
                <strong>{r.user_name || "Someone"}</strong> {r.emoji}
              </Typography>
            ))
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        {!isStaff ? (
          <Button
            fullWidth
            size="small"
            variant={myHandRaised ? "contained" : "outlined"}
            color={myHandRaised ? "warning" : "primary"}
            startIcon={<BackHandRoundedIcon />}
            onClick={() => void toggleRaiseHand().catch((e) => alert(e.message))}
          >
            {myHandRaised ? "Lower hand" : "Raise hand"}
          </Button>
        ) : null}
        {raisedHands.length > 0 ? (
          <Stack spacing={0.75} sx={{ mt: isStaff ? 0 : 1, maxHeight: 140, overflow: "auto" }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              Raised hands ({raisedHands.length})
            </Typography>
            {raisedHands.map((h) => (
              <Stack key={h.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Chip
                  size="small"
                  icon={<BackHandRoundedIcon sx={{ fontSize: 16 }} />}
                  label={authorLabel(h.user)}
                  color="warning"
                  variant="outlined"
                  sx={{ maxWidth: "100%", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }}
                />
                {isStaff ? (
                  <Button size="small" onClick={() => void dismissHand(h.id).catch((e) => alert(e.message))}>
                    Dismiss
                  </Button>
                ) : null}
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setReplyTo(null);
          setText("");
        }}
        variant="fullWidth"
        sx={{ minHeight: 40, flexShrink: 0 }}
      >
        <Tab label={chatMessages.length ? `Chat (${chatMessages.length})` : "Chat"} sx={{ minHeight: 40, py: 0.5 }} />
        <Tab
          label={openQuestionCount > 0 ? `Questions (${openQuestionCount} open)` : "Questions"}
          sx={{ minHeight: 40, py: 0.5 }}
        />
      </Tabs>

      <Box
        sx={{
          ...scrollBodySx,
          px: 1.5,
          py: 1,
          height: isDock ? chatListHeight : undefined,
          minHeight: isDock ? chatListHeight : 0,
          maxHeight: isDock ? chatListHeight : undefined,
          flex: isDock ? "0 0 auto" : 1,
        }}
      >
        {loading ? (
          <CircularProgress size={28} />
        ) : error ? (
          <Alert severity="warning">{error}</Alert>
        ) : list.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isQuestionsTab ? "No attendee questions yet." : "No chat messages yet."}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {list.map((m) => (
              <Box key={m.id} sx={{ p: 1, borderRadius: 1, border: 1, borderColor: "divider" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {authorLabel(m.author)}
                  </Typography>
                  {m.is_question ? (
                    <Chip size="small" label={m.is_answered ? "Answered" : "Open"} color={m.is_answered ? "success" : "warning"} sx={{ height: 20, fontSize: "0.65rem" }} />
                  ) : null}
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.25 }}>
                  {m.message}
                </Typography>
                {(m.replies || []).map((r) => (
                  <Box key={r.id} sx={{ mt: 1, pl: 1, borderLeft: 2, borderColor: "primary.main" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {authorLabel(r.author)} (reply)
                    </Typography>
                    <Typography variant="body2">{r.message}</Typography>
                  </Box>
                ))}
                {m.is_question ? (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                    <Button size="small" startIcon={<ReplyRoundedIcon />} onClick={() => { setReplyTo(m); setTab(1); }}>
                      Reply
                    </Button>
                    {!m.is_answered ? (
                      <Button
                        size="small"
                        startIcon={<CheckCircleOutlineRoundedIcon />}
                        onClick={() => void markAnswered(m.id).catch((e) => alert(e.message))}
                      >
                        Mark answered
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Divider sx={{ flexShrink: 0 }} />
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        {replyTo ? (
          <Typography variant="caption" color="primary" sx={{ display: "block", mb: 0.5 }}>
            Replying to {authorLabel(replyTo.author)}
            <Button size="small" onClick={() => setReplyTo(null)} sx={{ ml: 1, minWidth: 0 }}>
              Cancel
            </Button>
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isQuestionsTab && !replyTo}
            placeholder={replyTo ? "Reply…" : isQuestionsTab ? "Select a question to reply…" : "Message attendees…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <IconButton color="primary" disabled={busy || !text.trim() || (isQuestionsTab && !replyTo)} onClick={() => void handleSend()}>
            <SendRoundedIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}
