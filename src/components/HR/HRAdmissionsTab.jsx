import React, { useCallback, useEffect, useState } from "react";
import {
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
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import Swal from "sweetalert2";
import { authHeaders, ADMISSION_STATUS } from "./hrShared";
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
  { value: "under_review", label: "Under review" },
  { value: "documents_verified", label: "Documents verified" },
  { value: "interview_scheduled", label: "Interview scheduled" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
];

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
    statusOptions.find((s) => s.value === value)?.label ||
    ADMISSION_STATUS[value]?.label ||
    String(value || "pending")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const openEditStatus = (row) => {
    setEditRow(row);
    setEditStatus(row.status || "pending");
  };

  const closeEditStatus = () => {
    if (updatingId) return;
    setEditRow(null);
  };

  const handleSaveStatus = async () => {
    if (!editRow?.id) return;
    const nextStatus = String(editStatus || "").trim();
    const currentStatus = String(editRow.status || "pending").trim();

    if (currentStatus === nextStatus) {
      await hrSwal({
        icon: "info",
        title: "No change",
        text: `Status is already "${statusLabel(nextStatus)}".`,
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
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Could not update status.");
      }

      const updatedStatus = json.data?.status || nextStatus;
      setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, status: updatedStatus } : r)));
      if (viewRow?.id === rowId) {
        setViewRow((prev) => (prev ? { ...prev, status: updatedStatus } : prev));
      }

      await hrSwal({
        icon: "success",
        title: "Status updated",
        text: savedRef
          ? `Application ${savedRef} is now ${statusLabel(updatedStatus)}.`
          : `Status is now ${statusLabel(updatedStatus)}.`,
      });
      setEditRow(null);
    } catch (e) {
      await hrSwal({
        icon: "error",
        title: "Update failed",
        text: e.message || "Could not update status.",
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
                      <HRAdmissionChip status={row.status} />
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
              <HRAdmissionChip status={viewRow.status} />
            </Box>

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
        title="Update status"
        subtitle={editRow ? `${editRow.student_name || "Applicant"}${editRow.application_number ? ` · ${editRow.application_number}` : ""}` : undefined}
        icon={<EditOutlinedIcon sx={{ color: "#fff" }} />}
        maxWidth="xs"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={closeEditStatus} disabled={!!updatingId}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={!!updatingId} onClick={() => void handleSaveStatus()} disabled={!editRow}>
              Save
            </DialogPrimaryButton>
          </Stack>
        }
      >
        {editRow ? (
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
        ) : null}
      </PremiumDialog>
    </Stack>
  );
}
