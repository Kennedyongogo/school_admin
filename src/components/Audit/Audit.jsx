import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LanOutlinedIcon from "@mui/icons-material/LanOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import FingerprintOutlinedIcon from "@mui/icons-material/FingerprintOutlined";
import {
  ElimuPlusHero,
  ElimuPlusTabs,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  TabPanelShell,
  PremiumDialog,
  DetailField,
  DialogGhostButton,
} from "../SchoolProfile/elimuPlusUi";
import { fadeUp } from "../Users/usersUi";
import {
  primaryRed,
  primaryDark,
  primaryLight,
  warmCream,
  textPrimary,
  textSecondary,
  textMuted,
  fontBody,
  fontDisplay,
  elimuViewportSx,
  actionIconSx,
  hrPanelCardSx,
} from "../HR/hrShared";
import { getInitials } from "../Users/usersShared";

const resourceTypes = [
  { value: 0, label: "All" },
  { value: 1, label: "Exams" },
  { value: 2, label: "Students" },
  { value: 3, label: "Teachers" },
  { value: 4, label: "Fees" },
  { value: 5, label: "Report cards" },
  { value: 6, label: "Curriculum" },
  { value: 7, label: "Admissions" },
  { value: 8, label: "Users" },
  { value: 9, label: "System" },
  { value: 10, label: "Other" },
];

const resourceTypeValues = [
  "",
  "exam",
  "student",
  "teacher",
  "fee_invoice",
  "report_card",
  "curriculum",
  "admission_application",
  "user",
  "system",
  "other",
];

const ACTION_STYLES = {
  create: { color: "#16A34A", bg: "#DCFCE7" },
  read: { color: "#2563EB", bg: "#DBEAFE" },
  update: { color: "#D97706", bg: "#FEF3C7" },
  delete: { color: "#DC2626", bg: "#FEE2E2" },
  login: { color: "#7C3AED", bg: "#EDE9FE" },
  logout: { color: "#6B7280", bg: "#F3F4F6" },
  default: { color: "#57534E", bg: "#F5F5F4" },
};

const STATUS_STYLES = {
  success: { color: "#16A34A", bg: "#DCFCE7" },
  failed: { color: "#DC2626", bg: "#FEE2E2" },
  pending: { color: "#D97706", bg: "#FEF3C7" },
};

function formatActionText(action) {
  return String(action || "other")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatResourceType(type) {
  if (!type) return "Other";
  return String(type)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionStyle(action) {
  const key = String(action || "").toLowerCase();
  if (ACTION_STYLES[key]) return ACTION_STYLES[key];
  if (key.includes("delete")) return ACTION_STYLES.delete;
  if (key.includes("create")) return ACTION_STYLES.create;
  if (key.includes("update")) return ACTION_STYLES.update;
  if (key.includes("login")) return ACTION_STYLES.login;
  if (key.includes("read")) return ACTION_STYLES.read;
  return ACTION_STYLES.default;
}

function statusStyle(status) {
  return STATUS_STYLES[String(status || "").toLowerCase()] || ACTION_STYLES.default;
}

function AuditChip({ label, tone }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontFamily: fontBody,
        fontWeight: 700,
        fontSize: "0.72rem",
        height: 26,
        borderRadius: "8px",
        color: tone.color,
        bgcolor: tone.bg,
        border: `1px solid ${tone.color}22`,
      }}
    />
  );
}

function JsonBlock({ title, data, variant = "neutral" }) {
  if (!data || (typeof data === "object" && !Object.keys(data).length)) return null;
  const palette =
    variant === "old"
      ? { bg: "#FEF2F2", border: "rgba(220,38,38,0.18)", label: primaryDark }
      : variant === "new"
        ? { bg: "#F0FDF4", border: "rgba(22,163,74,0.18)", label: "#16A34A" }
        : { bg: warmCream, border: "rgba(220,38,38,0.08)", label: textSecondary };

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: `1px solid ${palette.border}`,
        bgcolor: palette.bg,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${palette.border}` }}>
        <Typography sx={{ fontFamily: fontBody, fontSize: "0.72rem", fontWeight: 800, color: palette.label, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </Typography>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: "0.78rem",
          lineHeight: 1.55,
          color: textPrimary,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Box>
  );
}

function StatPill({ label, value, accent = primaryRed }) {
  return (
    <Box
      sx={{
        ...hrPanelCardSx,
        px: 2,
        py: 1.5,
        minWidth: 140,
        flex: 1,
      }}
    >
      <Typography sx={{ fontFamily: fontBody, fontSize: "0.72rem", fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: fontDisplay, fontWeight: 800, fontSize: "1.5rem", color: accent, lineHeight: 1.2, mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function Audit() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please sign in again.");
        return;
      }

      const queryParams = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      const resourceType = resourceTypeValues[selectedTab];
      if (resourceType) queryParams.append("resource_type", resourceType);

      const response = await fetch(`/api/audit-trail?${queryParams}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setAuditLogs(data.data || []);
        setTotalLogs(data.pagination?.total || 0);
      } else {
        setError(data.message || "Could not load audit logs.");
      }
    } catch (err) {
      setError(err.message || "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedTab]);

  useEffect(() => {
    void fetchAuditLogs();
  }, [fetchAuditLogs]);

  const pageStats = useMemo(() => {
    const success = auditLogs.filter((l) => l.status === "success").length;
    const failed = auditLogs.filter((l) => l.status === "failed").length;
    return { success, failed };
  }, [auditLogs]);

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setOpenViewDialog(true);
  };

  const closeDialog = () => {
    setOpenViewDialog(false);
    setSelectedLog(null);
  };

  const handleTabChange = (value) => {
    setSelectedTab(value);
    setPage(0);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        ...elimuViewportSx,
        gap: 2,
        pb: 3,
      }}
    >
      <ElimuPlusHero
        title="Audit Trail"
        subtitle="Track admin portal activity — who did what, when, and whether it succeeded."
        icon={<HistoryIcon sx={{ fontSize: 26 }} />}
        actions={
          <Tooltip title="Refresh logs">
            <IconButton
              onClick={() => void fetchAuditLogs()}
              disabled={loading}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.22)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : <RefreshRoundedIcon />}
            </IconButton>
          </Tooltip>
        }
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <StatPill label="Total entries" value={totalLogs.toLocaleString()} />
        <StatPill label="Success on page" value={pageStats.success} accent="#16A34A" />
        <StatPill label="Failed on page" value={pageStats.failed} accent={primaryRed} />
      </Stack>

      <Box component={motion.div} variants={fadeUp} custom={1} initial="hidden" animate="visible">
        <ElimuPlusTabs activeTab={selectedTab} onChange={handleTabChange} tabs={resourceTypes} />
      </Box>

      <Box
        component={motion.div}
        variants={fadeUp}
        custom={2}
        initial="hidden"
        animate="visible"
        sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
      >
        <TabPanelShell error={error} loading={loading} onDismissError={() => setError(null)}>
          <DataTableShell
            pagination={
              <TablePagination
                component="div"
                count={totalLogs}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={tablePaginationSx}
              />
            }
          >
            <Table sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow sx={tableHeadRowSx}>
                  <TableCell width={56}>#</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center" width={88}>
                    View
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Box sx={{ py: 6, textAlign: "center" }}>
                        <HistoryIcon sx={{ fontSize: 40, color: primaryLight, mb: 1 }} />
                        <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, color: textPrimary }}>
                          No audit logs yet
                        </Typography>
                        <Typography sx={{ fontFamily: fontBody, fontSize: "0.88rem", color: textMuted, mt: 0.5 }}>
                          Activity will appear here as staff use the admin portal.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log, idx) => {
                    const name = log.user?.full_name || "System";
                    return (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{
                          "&:nth-of-type(even)": { bgcolor: "rgba(220,38,38,0.02)" },
                          "&:hover": { bgcolor: "rgba(220,38,38,0.04)" },
                          "& .MuiTableCell-root": {
                            fontFamily: fontBody,
                            borderColor: "rgba(220,38,38,0.06)",
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: textMuted }}>
                          {page * rowsPerPage + idx + 1}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                fontFamily: fontDisplay,
                                bgcolor: primaryRed,
                                color: "#fff",
                              }}
                            >
                              {getInitials(name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, color: textPrimary, fontSize: "0.88rem" }}>
                                {name}
                              </Typography>
                              <Typography sx={{ fontSize: "0.75rem", color: textMuted }} noWrap>
                                {log.user?.email || "System activity"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <AuditChip label={formatActionText(log.action)} tone={actionStyle(log.action)} />
                        </TableCell>
                        <TableCell>
                          <AuditChip label={log.status || "—"} tone={statusStyle(log.status)} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => handleViewLog(log)} sx={actionIconSx}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </TabPanelShell>
      </Box>

      <PremiumDialog
        open={openViewDialog}
        onClose={closeDialog}
        title="Audit log details"
        subtitle={selectedLog ? formatDate(selectedLog.createdAt || selectedLog.created_at) : ""}
        icon={<HistoryIcon />}
        maxWidth="md"
        footer={<DialogGhostButton onClick={closeDialog}>Close</DialogGhostButton>}
      >
        {selectedLog ? (
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: "18px",
                background: `linear-gradient(135deg, ${warmCream} 0%, #fff 100%)`,
                border: "1px solid rgba(220,38,38,0.08)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: primaryRed,
                    color: "#fff",
                    fontFamily: fontDisplay,
                    fontWeight: 700,
                  }}
                >
                  {getInitials(selectedLog.user?.full_name || "System")}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.1rem", color: textPrimary }}>
                    {selectedLog.user?.full_name || "System"}
                  </Typography>
                  <Typography sx={{ fontFamily: fontBody, fontSize: "0.85rem", color: textSecondary }}>
                    {selectedLog.user?.email || "No user email"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                  <AuditChip label={formatActionText(selectedLog.action)} tone={actionStyle(selectedLog.action)} />
                  <AuditChip label={selectedLog.status} tone={statusStyle(selectedLog.status)} />
                </Stack>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <DetailField icon={<CategoryOutlinedIcon fontSize="small" />} label="Resource type" value={formatResourceType(selectedLog.resource_type)} />
              <DetailField icon={<FingerprintOutlinedIcon fontSize="small" />} label="Resource ID" value={selectedLog.resource_id || "—"} />
              <DetailField icon={<LanOutlinedIcon fontSize="small" />} label="IP address" value={selectedLog.ip_address || "—"} />
              <DetailField icon={<ScheduleOutlinedIcon fontSize="small" />} label="Date & time" value={formatDate(selectedLog.createdAt || selectedLog.created_at)} />
            </Box>

            <DetailField
              icon={<DescriptionOutlinedIcon fontSize="small" />}
              label="Description"
              value={selectedLog.description || "—"}
            />

            <JsonBlock title="Previous values" data={selectedLog.old_values} variant="old" />
            <JsonBlock title="New values" data={selectedLog.new_values} variant="new" />
            <JsonBlock title="Metadata" data={selectedLog.metadata} variant="neutral" />

            {selectedLog.error_message ? (
              <Alert severity="error" sx={{ borderRadius: "14px", fontFamily: fontBody }}>
                {selectedLog.error_message}
              </Alert>
            ) : null}
          </Stack>
        ) : null}
      </PremiumDialog>
    </Box>
  );
}
