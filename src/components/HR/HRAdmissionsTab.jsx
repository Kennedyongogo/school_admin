import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import Swal from "sweetalert2";
import { authHeaders, ADMISSION_STATUS, fmtDateTime, inputSx } from "./hrShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  PremiumDialog,
  DetailField,
  FormSection,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  HRFilterBar,
  HRFilterTextField,
  HRFilterSelect,
  HRAdmissionChip,
  HRActionButton,
  hrSwal,
} from "./hrUi";

const DEFAULT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

function normalizeStatus(value) {
  const raw = String(value || "pending").trim();
  if (["under_review", "documents_verified", "waitlisted"].includes(raw)) return "pending";
  return raw;
}

function toDatetimeLocalValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function notificationHint(result) {
  if (!result) return null;
  if (result.sent) return "An email notification was sent to the applicant.";
  if (result.reason === "no_applicant_email") {
    return "No applicant email on file — notification was not sent.";
  }
  if (result.reason === "smtp_not_configured" || result.reason === "delivery_hook_pending") {
    return "Email notification is prepared but not sent yet (SMTP/nodemailer setup pending).";
  }
  return null;
}

function documentHref(path) {
  if (!path || typeof path !== "string") return null;
  const t = path.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function fileNameFromPath(path) {
  if (!path || typeof path !== "string") return "document";
  const name = path.trim().split("/").pop();
  return name || "document";
}

async function triggerDownload(path) {
  const href = documentHref(path);
  if (!href) return;
  const res = await fetch(href);
  if (!res.ok) throw new Error("Could not download file.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileNameFromPath(path);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function HRAdmissionsTab() {
  const [rows, setRows] = useState([]);
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [editInterviewDate, setEditInterviewDate] = useState("");
  const [editAcceptanceNotes, setEditAcceptanceNotes] = useState("");
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (statusFilter) params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admission-applications?${params.toString()}`, {
        headers: authHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not load admission applications.");
      }
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalCount(json.pagination?.total ?? 0);
      if (Array.isArray(json.statuses) && json.statuses.length > 0) {
        setStatusOptions(json.statuses);
      }
    } catch (e) {
      setError(e.message || "Could not load admission applications.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (value) =>
    statusOptions.find((s) => s.value === normalizeStatus(value))?.label ||
    ADMISSION_STATUS[normalizeStatus(value)]?.label ||
    String(value || "pending")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const openEditStatus = (row) => {
    setEditRow(row);
    setEditStatus(normalizeStatus(row.status));
    setEditInterviewDate(toDatetimeLocalValue(row.interview_date));
    setEditAcceptanceNotes(row.acceptance_notes || "");
    setEditRejectionReason(row.rejection_reason || "");
  };

  const closeEditStatus = () => {
    if (updatingId) return;
    setEditRow(null);
    setEditInterviewDate("");
    setEditAcceptanceNotes("");
    setEditRejectionReason("");
  };

  const buildUpdatePayload = () => {
    const nextStatus = normalizeStatus(editStatus);
    const payload = { status: nextStatus };

    if (nextStatus === "interview_scheduled") {
      payload.interview_date = editInterviewDate ? new Date(editInterviewDate).toISOString() : null;
    }
    if (nextStatus === "accepted") {
      payload.acceptance_notes = editAcceptanceNotes.trim();
    }
    if (nextStatus === "rejected") {
      payload.rejection_reason = editRejectionReason.trim();
    }

    return payload;
  };

  const validateBeforeSave = (payload) => {
    if (payload.status === "interview_scheduled" && !payload.interview_date) {
      return "Select an interview date and time. This will be used to email the applicant.";
    }
    if (payload.status === "accepted" && !String(payload.acceptance_notes || "").trim()) {
      return "Add acceptance notes (e.g. joining date and what the parent should do next).";
    }
    if (payload.status === "rejected" && !String(payload.rejection_reason || "").trim()) {
      return "Add a rejection reason. This will be sent to the applicant by email.";
    }
    return null;
  };

  const handleSaveStatus = async () => {
    if (!editRow?.id) return;
    const payload = buildUpdatePayload();
    const validationError = validateBeforeSave(payload);
    if (validationError) {
      await hrSwal({ icon: "warning", title: "Missing information", text: validationError });
      return;
    }

    const currentStatus = normalizeStatus(editRow.status);
    const unchanged =
      currentStatus === payload.status &&
      (payload.status !== "interview_scheduled" ||
        toDatetimeLocalValue(editRow.interview_date) === editInterviewDate) &&
      (payload.status !== "accepted" ||
        String(editRow.acceptance_notes || "").trim() === String(payload.acceptance_notes || "").trim()) &&
      (payload.status !== "rejected" ||
        String(editRow.rejection_reason || "").trim() === String(payload.rejection_reason || "").trim());

    if (unchanged) {
      await hrSwal({
        icon: "info",
        title: "No change",
        text: `Status is already "${statusLabel(payload.status)}".`,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      await hrSwal({ icon: "warning", title: "Session expired", text: "Please sign in again." });
      return;
    }

    const savedRef = editRow.application_number || "";
    const rowId = editRow.id;

    setUpdatingId(rowId);
    try {
      const res = await fetch(`/api/admission-applications/${rowId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not update application.");
      }

      const updated = json.data || {};
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...updated } : r)));
      if (viewRow?.id === rowId) {
        setViewRow((prev) => (prev ? { ...prev, ...updated } : prev));
      }

      const notifyText = notificationHint(json.notification);
      await hrSwal({
        icon: "success",
        title: "Application updated",
        text: [
          savedRef
            ? `Application ${savedRef} is now ${statusLabel(updated.status || payload.status)}.`
            : `Status is now ${statusLabel(updated.status || payload.status)}.`,
          notifyText,
        ]
          .filter(Boolean)
          .join(" "),
      });
      closeEditStatus();
    } catch (e) {
      await hrSwal({
        icon: "error",
        title: "Update failed",
        text: e.message || "Could not update application.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <HRFilterBar>
        <HRFilterTextField
          label="Search applications"
          placeholder="Name, email, reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <HRFilterSelect
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setPage(0);
            setStatusFilter(e.target.value);
          }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {statusOptions.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </HRFilterSelect>
      </HRFilterBar>

      <TabPanelShell loading={loading} error={error} onDismissError={() => setError("")}>
        <DataTableShell
          pagination={
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage="Rows per page"
              sx={tablePaginationSx}
            />
          }
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>No.</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Curriculum</TableCell>
                <TableCell>Class / Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                    <EmptyTableRow colSpan={7} message="No admission applications found." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.application_number || "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.student_name || "—"}</TableCell>
                    <TableCell>{row.curriculum || "—"}</TableCell>
                    <TableCell>{[row.curriculum_class, row.curriculum_level].filter(Boolean).join(" · ") || "—"}</TableCell>
                    <TableCell>
                      <HRAdmissionChip status={normalizeStatus(row.status)} />
                    </TableCell>
                    <TableCell align="right">
                      <HRActionButton title="View application" onClick={() => setViewRow(row)}>
                        <VisibilityOutlinedIcon fontSize="small" />
                      </HRActionButton>
                      <HRActionButton
                        title="Update status"
                        disabled={updatingId === row.id}
                        onClick={() => openEditStatus(row)}
                      >
                        {updatingId === row.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <EditOutlinedIcon fontSize="small" />
                        )}
                      </HRActionButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      </TabPanelShell>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title="Admission application"
        subtitle={viewRow?.application_number || undefined}
        icon={<AssignmentIndOutlinedIcon sx={{ color: "#fff" }} />}
        maxWidth="md"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>
            {viewRow ? (
              <DialogPrimaryButton
                onClick={() => {
                  const row = viewRow;
                  setViewRow(null);
                  openEditStatus(row);
                }}
              >
                Update status
              </DialogPrimaryButton>
            ) : null}
          </Stack>
        }
      >
        {viewRow ? (
          <Stack spacing={2.5}>
            <Box>
              <HRAdmissionChip status={normalizeStatus(viewRow.status)} />
            </Box>

            {normalizeStatus(viewRow.status) === "interview_scheduled" && viewRow.interview_date ? (
              <FormSection title="Interview">
                <DetailField label="Scheduled for" value={fmtDateTime(viewRow.interview_date)} />
              </FormSection>
            ) : null}

            {normalizeStatus(viewRow.status) === "accepted" && viewRow.acceptance_notes ? (
              <FormSection title="Acceptance details">
                <DetailField label="Notes for applicant" value={viewRow.acceptance_notes} />
              </FormSection>
            ) : null}

            {normalizeStatus(viewRow.status) === "rejected" && viewRow.rejection_reason ? (
              <FormSection title="Rejection">
                <DetailField label="Reason sent to applicant" value={viewRow.rejection_reason} />
              </FormSection>
            ) : null}

            <FormSection title="Programme">
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <DetailField label="Curriculum" value={viewRow.curriculum} />
                <DetailField label="Class" value={viewRow.curriculum_class} />
                <DetailField label="Term / level" value={viewRow.curriculum_level} />
              </Stack>
            </FormSection>

            <FormSection title="Applicant">
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <DetailField label="Name" value={viewRow.applicant_name} />
                <DetailField label="Phone" value={viewRow.applicant_phone} />
                <DetailField label="Email" value={viewRow.applicant_email} />
              </Stack>
            </FormSection>

            <FormSection title="Student">
              <DetailField label="Full name" value={viewRow.student_name} />
            </FormSection>

            <FormSection title="Documents">
              <Stack spacing={1.25}>
                {[
                  ["Student picture", viewRow.student_picture],
                  ["Report card", viewRow.student_reportcard],
                  ["Birth certificate", viewRow.student_birthcertificate],
                ].map(([label, path]) => {
                  const href = documentHref(path);
                  const fileName = fileNameFromPath(path);
                  return (
                    <Stack
                      key={label}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                      {href ? (
                        <DialogGhostButton
                          startIcon={<DownloadOutlinedIcon />}
                          onClick={async () => {
                            try {
                              await triggerDownload(path);
                            } catch (e) {
                              await hrSwal({
                                icon: "error",
                                title: "Download failed",
                                text: e.message || "Could not download file.",
                              });
                            }
                          }}
                        >
                          Download{fileName ? ` (${fileName})` : ""}
                        </DialogGhostButton>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </FormSection>
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={!!editRow}
        onClose={closeEditStatus}
        title="Update application"
        subtitle={editRow ? `${editRow.student_name || "Applicant"}${editRow.application_number ? ` · ${editRow.application_number}` : ""}` : undefined}
        icon={<EditOutlinedIcon sx={{ color: "#fff" }} />}
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={closeEditStatus} disabled={!!updatingId}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={!!updatingId} onClick={() => void handleSaveStatus()} disabled={!editRow}>
              Save & notify
            </DialogPrimaryButton>
          </Stack>
        }
      >
        {editRow ? (
          <Stack spacing={2}>
            <HRFilterSelect
              label="Status"
              value={editStatus}
              disabled={!!updatingId}
              onChange={(e) => setEditStatus(e.target.value)}
            >
              {statusOptions.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </HRFilterSelect>

            {normalizeStatus(editStatus) === "interview_scheduled" ? (
              <>
                <Alert severity="info" sx={{ borderRadius: "12px" }}>
                  Select the interview date and time. When email is configured, the applicant at{" "}
                  <strong>{editRow.applicant_email || "—"}</strong> will be notified automatically.
                </Alert>
                <TextField
                  fullWidth
                  required
                  label="Interview date & time"
                  type="datetime-local"
                  value={editInterviewDate}
                  disabled={!!updatingId}
                  onChange={(e) => setEditInterviewDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                />
              </>
            ) : null}

            {normalizeStatus(editStatus) === "accepted" ? (
              <>
                <Alert severity="success" sx={{ borderRadius: "12px" }}>
                  These notes will be emailed to the applicant (e.g. reporting date, uniform, fees, orientation).
                </Alert>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  label="Acceptance notes"
                  placeholder="Example: Please report on Monday 12 January at 8:00 AM with original birth certificate..."
                  value={editAcceptanceNotes}
                  disabled={!!updatingId}
                  onChange={(e) => setEditAcceptanceNotes(e.target.value)}
                  sx={inputSx}
                />
              </>
            ) : null}

            {normalizeStatus(editStatus) === "rejected" ? (
              <>
                <Alert severity="warning" sx={{ borderRadius: "12px" }}>
                  This reason will be sent to the applicant by email when notification is enabled.
                </Alert>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  label="Rejection reason"
                  placeholder="Brief, respectful reason for the decision..."
                  value={editRejectionReason}
                  disabled={!!updatingId}
                  onChange={(e) => setEditRejectionReason(e.target.value)}
                  sx={inputSx}
                />
              </>
            ) : null}

            {normalizeStatus(editStatus) === "pending" ? (
              <Alert severity="info" sx={{ borderRadius: "12px" }}>
                Application remains in the queue. No email is sent for pending status.
              </Alert>
            ) : null}
          </Stack>
        ) : null}
      </PremiumDialog>
    </Stack>
  );
}
