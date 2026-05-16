import React, { useState } from "react";
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
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEventLobby } from "../../hooks/useEventLobby";

function personLabel(entry) {
  return entry?.user?.full_name || entry?.user?.username || "Attendee";
}

const rosterSurfaceSx = {
  bgcolor: "background.paper",
  color: "text.primary",
  "& .MuiTableCell-root": { color: "text.primary" },
};

export default function EventLiveLobbyPanel({ eventId, token, socket, embedded = false }) {
  const [tab, setTab] = useState(0);
  const { loading, error, lobby, busyId, loadLobby, admit, deny, admitAll } = useEventLobby({
    eventId,
    token,
    socket,
    isStaff: true,
  });

  const waiting = lobby?.waiting || [];
  const admitted = lobby?.admitted || [];
  const stats = lobby?.stats || {};

  const tabs = [
    { label: `Waiting (${waiting.length})`, rows: waiting, actions: true },
    { label: `In event (${admitted.length})`, rows: admitted, actions: false },
  ];
  const active = tabs[tab] || tabs[0];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
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
          <Typography variant="subtitle2" sx={{ fontWeight: 800, flex: 1 }}>
            Event lobby
          </Typography>
          <Button size="small" onClick={() => void loadLobby()} disabled={loading}>
            <RefreshRoundedIcon fontSize="small" />
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Admit parents and students from the waiting list. They must open the public join link to enter video.
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: "wrap" }} useFlexGap>
          <Chip size="small" label={`Waiting ${stats.waiting ?? 0}`} color="warning" variant="outlined" />
          <Chip size="small" label={`In event ${stats.in_event ?? 0}`} color="success" variant="outlined" />
        </Stack>
        {waiting.length > 0 ? (
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

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ flexShrink: 0, minHeight: 36 }}>
        {tabs.map((t, i) => (
          <Tab key={t.label} label={t.label} value={i} sx={{ minHeight: 36, fontSize: "0.72rem" }} />
        ))}
      </Tabs>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {loading && !lobby ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="warning" sx={{ m: 1 }}>
            {error}
          </Alert>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                {active.actions ? <TableCell align="right">Actions</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {active.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={active.actions ? 3 : 2} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No one in this list.
                  </TableCell>
                </TableRow>
              ) : (
                active.rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{personLabel(row)}</TableCell>
                    <TableCell>{row.user?.role || "—"}</TableCell>
                    {active.actions ? (
                      <TableCell align="right">
                        <Button size="small" disabled={busyId === row.id} onClick={() => void admit(row.id).catch((e) => alert(e.message))}>
                          Admit
                        </Button>
                        <Button size="small" color="error" disabled={busyId === row.id} onClick={() => void deny(row.id).catch((e) => alert(e.message))}>
                          Deny
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Box>
    </Box>
  );
}
