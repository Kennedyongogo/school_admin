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
import { useExamScheduleLobby } from "../../hooks/useExamScheduleLobby";
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

const rosterSurfaceSx = {
  bgcolor: "background.paper",
  color: "text.primary",
  "& .MuiTypography-root:not(.MuiTypography-colorTextSecondary)": { color: "text.primary" },
  "& .MuiTableCell-root": { color: "text.primary" },
};

function useLiveClock(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function ExamScheduleLobbyPanel({ examScheduleId, token, socket, embedded = false, stacked = false }) {
  const [tab, setTab] = useState(0);
  useLiveClock(15000);
  const { loading, error, lobby, busyId, loadLobby, admit, deny, admitAll } = useExamScheduleLobby({
    examScheduleId,
    token,
    socket,
    isTeacher: true,
  });

  const stats = lobby?.stats || {};
  const waiting = lobby?.waiting || [];
  const admitted = lobby?.admitted || [];
  const left = lobby?.left || [];
  const denied = lobby?.denied || [];

  const tabs = [
    { label: `Waiting (${waiting.length})`, rows: waiting, showActions: true },
    { label: `In room (${admitted.length})`, rows: admitted, showActions: false },
    { label: `Left (${left.length})`, rows: left, showActions: false },
    { label: `Denied (${denied.length})`, rows: denied, showActions: false },
  ];
  const active = tabs[tab] || tabs[0];

  return (
    <Box
      sx={{
        width: stacked || embedded ? "100%" : { xs: "100%", md: "min(300px, 30vw)" },
        flex: stacked ? "0 0 auto" : "1 1 auto",
        height: stacked ? "auto" : "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: stacked ? 0 : 0,
        overflow: stacked ? "visible" : "hidden",
        ...rosterSurfaceSx,
      }}
    >
      <Box sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <GroupsRoundedIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            Exam waiting room
          </Typography>
          {socket?.connected ? (
            <Chip size="small" label="Live" color="success" variant="outlined" sx={{ height: 22 }} />
          ) : null}
          <Button size="small" onClick={() => void loadLobby()} disabled={loading} aria-label="Refresh">
            <RefreshRoundedIcon fontSize="small" />
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Admit students before they join video. Same flow as online classes.
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
          <Chip size="small" label={`Waiting ${stats.waiting ?? 0}`} />
          <Chip size="small" label={`In room ${stats.in_room ?? 0}`} color="success" variant="outlined" />
        </Stack>
        {waiting.length ? (
          <Button
            size="small"
            variant="contained"
            sx={{ mt: 1 }}
            disabled={busyId === "all"}
            onClick={() => void admitAll()}
          >
            Admit all waiting
          </Button>
        ) : null}
      </Box>
      {error ? (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      ) : null}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ flexShrink: 0, minHeight: 40 }}>
        {tabs.map((t, i) => (
          <Tab key={t.label} label={t.label} value={i} sx={{ minHeight: 40, fontSize: "0.72rem" }} />
        ))}
      </Tabs>
      <Box sx={{ flex: stacked ? "0 0 auto" : 1, minHeight: stacked ? 280 : 0, maxHeight: stacked ? 420 : "none", overflowY: "auto" }}>
        {loading && !lobby ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    {active.showActions ? "Actions" : "Time"}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                        No students in this list.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  active.rows.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{personLabel(entry)}</TableCell>
                      <TableCell>{statusChip(entry.status)}</TableCell>
                      <TableCell align="right">
                        {active.showActions ? (
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="contained"
                              disabled={busyId === entry.id}
                              onClick={() => void admit(entry.id)}
                            >
                              Admit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              disabled={busyId === entry.id}
                              onClick={() => void deny(entry.id)}
                            >
                              Deny
                            </Button>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {entry.admitted_at ? formatTime(entry.admitted_at) : "—"}
                            {durationLabel(entry) ? ` · ${durationLabel(entry)}` : ""}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
