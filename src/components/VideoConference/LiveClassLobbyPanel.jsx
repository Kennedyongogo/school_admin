import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useLiveClassLobby } from "../../hooks/useLiveClassLobby";
import { durationLabel, statusChip } from "../../utils/lobbyDisplay";

function personLabel(entry) {
  return entry?.user?.full_name || entry?.user?.username || entry?.user?.email || "Student";
}

function formatTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

/** LiveKit theme can force white text; keep roster readable on light paper. */
const rosterSurfaceSx = {
  bgcolor: "background.paper",
  color: "text.primary",
  "& .MuiTypography-root:not(.MuiTypography-colorTextSecondary)": { color: "text.primary" },
  "& .MuiTableCell-root": { color: "text.primary" },
  "& .MuiTab-root": { color: "text.secondary" },
  "& .MuiTab-root.Mui-selected": { color: "primary.main" },
  "& .MuiTabs-indicator": { backgroundColor: "primary.main" },
};

function StatCard({ label, value, color = "default" }) {
  const valueColor =
    color === "default" || !color
      ? "text.secondary"
      : typeof color === "string" && color.startsWith("text.")
      ? color
      : `${color}.main`;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 72,
        p: 1,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, color: valueColor }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

/** Tick every 15s so "in class" minutes update live without hammering the server. */
function useLiveClock(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const scrollBodySx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
};

export default function LiveClassLobbyPanel({ liveClassId, token, socket, embedded = false, meetingStyle = false }) {
  const [tab, setTab] = useState(0);
  const now = useLiveClock(15000);
  const { loading, error, lobby, busyId, loadLobby, admit, deny, admitAll } = useLiveClassLobby({
    liveClassId,
    token,
    socket,
    isTeacher: true,
  });

  const stats = lobby?.stats || {};
  const waiting = lobby?.waiting || [];
  const admitted = lobby?.admitted || [];
  const left = lobby?.left || [];
  const denied = lobby?.denied || [];

  const tabs = meetingStyle
    ? [
        { label: `Waiting (${waiting.length})`, rows: waiting, showActions: true },
        { label: `In class (${admitted.length})`, rows: admitted, showActions: false },
      ]
    : [
        { label: `Waiting (${waiting.length})`, rows: waiting, showActions: true },
        { label: `In class (${admitted.length})`, rows: admitted, showActions: false },
        { label: `Left (${left.length})`, rows: left, showActions: false },
        { label: `Denied (${denied.length})`, rows: denied, showActions: false },
      ];

  const active = tabs[tab] || tabs[0];
  const socketLive = socket?.connected;

  return (
    <Box
      sx={{
        width: embedded ? "100%" : { xs: "100%", md: "min(300px, 30vw)" },
        maxWidth: "100%",
        minWidth: 0,
        flex: "1 1 auto",
        height: "100%",
        maxHeight: "100%",
        borderLeft: embedded ? 0 : { md: 1 },
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        ...rosterSurfaceSx,
      }}
    >
      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <GroupsRoundedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: meetingStyle ? 800 : 700, flex: 1 }}>
            {meetingStyle ? "Class lobby" : "Class roster"}
          </Typography>
          {!meetingStyle && socketLive ? (
            <Chip
              size="small"
              icon={<FiberManualRecordIcon sx={{ fontSize: 10, color: "success.main" }} />}
              label="Live"
              color="success"
              variant="outlined"
              sx={{ height: 22, "& .MuiChip-label": { px: 0.5, fontSize: "0.65rem" } }}
            />
          ) : null}
          <Button size="small" onClick={() => void loadLobby()} disabled={loading} aria-label="Refresh roster">
            <RefreshRoundedIcon fontSize="small" />
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.4 }}>
          {meetingStyle
            ? "Admit students from the waiting list. They join from the student portal → Classes."
            : "Updates when students knock, are admitted, or leave. Minutes count up while they stay in class."}
        </Typography>
        {meetingStyle ? (
          <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap" }} useFlexGap>
            <Chip size="small" label={`Waiting ${stats.waiting ?? 0}`} color="warning" variant="outlined" />
            <Chip size="small" label={`In class ${stats.in_class ?? 0}`} color="success" variant="outlined" />
          </Stack>
        ) : null}
        {meetingStyle && waiting.length > 0 ? (
          <Button
            fullWidth
            size="small"
            variant="contained"
            sx={{ mt: 1 }}
            disabled={busyId === "all"}
            onClick={() => void admitAll().catch((e) => alert(e.message))}
          >
            Admit all ({waiting.length})
          </Button>
        ) : null}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {loading && !lobby ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
            {error}
          </Alert>
        ) : (
          <>
            {!meetingStyle ? (
              <Stack
                direction="row"
                spacing={0.75}
                sx={{ p: 1, flexWrap: "wrap", justifyContent: "center", flexShrink: 0 }}
                useFlexGap
              >
                <StatCard label="Waiting" value={stats.waiting ?? 0} color="warning" />
                <StatCard label="In class" value={stats.in_class ?? 0} color="success" />
                <StatCard label="Left" value={stats.left_after_admit ?? 0} color="text.secondary" />
                <StatCard label="Denied" value={stats.denied ?? 0} color="error" />
              </Stack>
            ) : null}

            {!meetingStyle && waiting.length > 0 ? (
              <Box sx={{ px: 1, pb: 1, flexShrink: 0 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  disabled={busyId === "all"}
                  onClick={() => void admitAll().catch((e) => alert(e.message))}
                >
                  {busyId === "all" ? "Admitting…" : `Admit all waiting (${waiting.length})`}
                </Button>
              </Box>
            ) : null}

            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant={meetingStyle ? "fullWidth" : "scrollable"}
              scrollButtons={meetingStyle ? false : "auto"}
              sx={{ minHeight: 36, borderBottom: meetingStyle ? 0 : 1, borderColor: "divider", flexShrink: 0 }}
            >
              {tabs.map((t, i) => (
                <Tab
                  key={t.label}
                  label={t.label}
                  sx={{ minHeight: 36, py: 0, fontSize: meetingStyle ? "0.72rem" : "0.7rem", minWidth: meetingStyle ? undefined : 80 }}
                  value={i}
                />
              ))}
            </Tabs>

            <Box sx={scrollBodySx}>
              <TableContainer sx={{ maxWidth: "100%" }}>
                <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: meetingStyle ? undefined : active.showActions ? "42%" : "55%" }}>
                    {meetingStyle ? "Name" : "Student"}
                  </TableCell>
                  {meetingStyle ? null : (
                    <TableCell sx={{ fontWeight: 700, width: active.showActions ? "28%" : "45%" }}>Time</TableCell>
                  )}
                  {active.showActions ? (
                    <TableCell align={meetingStyle ? "right" : undefined} sx={{ fontWeight: 700, width: meetingStyle ? undefined : "30%" }}>
                      {meetingStyle ? "Actions" : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {active.rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={meetingStyle ? (active.showActions ? 2 : 1) : active.showActions ? 3 : 2}
                      align={meetingStyle ? "center" : undefined}
                      sx={meetingStyle ? { py: 3, color: "text.secondary" } : undefined}
                    >
                      <Typography variant="body2" color="text.secondary">
                        No one in this list.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  active.rows.map((row) => {
                    const chip = statusChip(row, now);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ overflow: "hidden", fontWeight: meetingStyle ? 600 : undefined }}>
                          {meetingStyle ? (
                            personLabel(row)
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                                {personLabel(row)}
                              </Typography>
                              {row.student?.admission_number ? (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {row.student.admission_number}
                                </Typography>
                              ) : null}
                              {chip ? (
                                <Chip
                                  size="small"
                                  label={chip.label}
                                  color={chip.color}
                                  variant={chip.variant || (row.status === "admitted" ? "filled" : "outlined")}
                                  sx={{
                                    mt: 0.25,
                                    height: 20,
                                    fontSize: "0.65rem",
                                    maxWidth: "100%",
                                    ...(row.status === "left"
                                      ? {
                                          color: "info.main",
                                          borderColor: "info.light",
                                          "& .MuiChip-label": { color: "info.dark" },
                                        }
                                      : {}),
                                  }}
                                />
                              ) : null}
                            </>
                          )}
                        </TableCell>
                        {meetingStyle ? null : (
                          <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                            <Typography variant="caption" display="block">
                              {row.status === "admitted"
                                ? "Admitted"
                                : row.status === "waiting"
                                ? "Requested"
                                : row.status === "left"
                                ? "Left"
                                : row.status === "denied"
                                ? "Denied"
                                : "—"}{" "}
                              {formatTime(
                                row.status === "admitted"
                                  ? row.admitted_at
                                  : row.status === "left"
                                  ? row.left_at
                                  : row.requested_at
                              )}
                            </Typography>
                            {durationLabel(row, now) ? (
                              <Typography
                                variant="caption"
                                color={row.status === "left" ? "info.main" : "success.main"}
                                display="block"
                              >
                                {durationLabel(row, now)}
                              </Typography>
                            ) : null}
                          </TableCell>
                        )}
                        {active.showActions ? (
                          <TableCell align={meetingStyle ? "right" : undefined} sx={{ p: meetingStyle ? undefined : 0.5, verticalAlign: "top" }}>
                            {meetingStyle ? (
                              <>
                                <Button size="small" disabled={busyId === row.id} onClick={() => void admit(row.id).catch((e) => alert(e.message))}>
                                  Admit
                                </Button>
                                <Button size="small" color="error" disabled={busyId === row.id} onClick={() => void deny(row.id).catch((e) => alert(e.message))}>
                                  Deny
                                </Button>
                              </>
                            ) : (
                              <Stack direction="column" spacing={0.25} alignItems="stretch">
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={busyId === row.id}
                                  onClick={() => void admit(row.id).catch((e) => alert(e.message))}
                                  sx={{ minWidth: 0, px: 0.75, fontSize: "0.7rem" }}
                                >
                                  Admit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  disabled={busyId === row.id}
                                  onClick={() => void deny(row.id).catch((e) => alert(e.message))}
                                  sx={{ minWidth: 0, px: 0.75, fontSize: "0.7rem" }}
                                >
                                  Deny
                                </Button>
                              </Stack>
                            )}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
