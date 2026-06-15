import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
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
import {
  Close as CloseIcon,
  DeleteOutline as DeleteIcon,
  EditOutlined as EditIcon,
  VisibilityOutlined as ViewIcon,
  GroupsOutlined as GroupsIcon,
} from "@mui/icons-material";
import StudentSelectCards from "./StudentSelectCards";
import { authHeaders, primaryRed, primaryDark } from "./hrShared";
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
  HRActionButton,
  hrSwal,
} from "./hrUi";
import { Checkbox, FormControlLabel } from "@mui/material";
import { TextField } from "@mui/material";

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

function profileImageUrl(stored) {
  if (!stored || typeof stored !== "string") return null;
  const t = stored.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function rowToEditForm(row) {
  const u = row?.user || {};
  return {
    student_ids: Array.isArray(row?.student_ids) ? [...row.student_ids] : [],
    occupation: row?.occupation ?? "",
    relationship: row?.relationship || "guardian",
    newsletter_subscription: row?.newsletter_subscription !== false,
    user_full_name: u.full_name ?? "",
    user_email: u.email ?? "",
    user_username: u.username ?? "",
    user_phone: u.phone ?? "",
    user_address: u.address ?? "",
  };
}

export default function HRParentsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(() => rowToEditForm({}));
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [studentsPicklist, setStudentsPicklist] = useState([]);
  const [editMetaLoading, setEditMetaLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchParents = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/parents?${params.toString()}`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load parents (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(typeof data.pagination?.total === "number" ? data.pagination.total : 0);
    } catch (e) {
      const msg = e.message || "Failed to load parent profiles.";
      setError(msg);
      setRows([]);
      setTotalCount(0);
      void hrSwal({ icon: "error", title: "Could not load parents", text: msg });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const loadEditStudents = useCallback(async (forRow) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setEditMetaLoading(true);
    try {
      const res = await fetch("/api/parents/students-without-parent", { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      const available = res.ok && json.success && Array.isArray(json.data) ? json.data : [];
      const merged = [...available];
      if (forRow?.students?.length) {
        for (const s of forRow.students) {
          if (s?.id && !merged.some((x) => x.id === s.id)) merged.push(s);
        }
      }
      setStudentsPicklist(merged);
    } catch {
      setStudentsPicklist(forRow?.students || []);
    } finally {
      setEditMetaLoading(false);
    }
  }, []);

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm(rowToEditForm(row));
    setEditError(null);
    loadEditStudents(row);
  };

  const handleSaveEdit = async () => {
    if (!editRow?.id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setEditError("Please sign in again.");
      return;
    }
    if (!editForm.student_ids?.length) {
      setEditError("Select at least one linked student.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const body = {
        student_ids: editForm.student_ids,
        occupation: editForm.occupation?.trim() || null,
        relationship: editForm.relationship,
        newsletter_subscription: editForm.newsletter_subscription,
        user: {
          full_name: editForm.user_full_name?.trim() || undefined,
          email: editForm.user_email?.trim() || undefined,
          username: editForm.user_username?.trim() || undefined,
          phone: editForm.user_phone?.trim() || undefined,
          address: editForm.user_address?.trim() || undefined,
        },
      };
      const res = await fetch(`/api/parents/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not update parent profile.");
      }
      setEditRow(null);
      await hrSwal({
        icon: "success",
        title: "Profile updated",
        text: "Parent profile was saved successfully.",
        timer: 2200,
        showConfirmButton: false,
      });
      fetchParents();
    } catch (e) {
      const msg = e.message || "Update failed.";
      setEditError(msg);
      await hrSwal({ icon: "error", title: "Could not save", text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) {
      await hrSwal({ icon: "error", title: "Session expired", text: "Please sign in again." });
      return;
    }
    const name = row.user?.full_name || row.user?.username || "this parent";
    const confirm = await hrSwal({
      icon: "warning",
      title: "Remove parent profile?",
      html: `This removes the <strong>parent profile</strong> for <strong>${name}</strong>. The user account with role Parent is kept and can be linked to a new profile later.`,
      showCancelButton: true,
      confirmButtonText: "Yes, remove profile",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/parents/${row.id}`, { method: "DELETE", headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not remove profile (${res.status})`);
      }
      await fetchParents();
      await hrSwal({
        icon: "success",
        title: "Profile removed",
        text: data.message || "Parent profile was removed.",
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (e) {
      await hrSwal({
        icon: "error",
        title: "Could not remove profile",
        text: e.message || "Request failed.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <HRFilterBar>
        <HRFilterTextField
          label="Search parents"
          placeholder="Name, email, student, relationship…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </HRFilterBar>

      <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
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
          <Table size="medium" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell width={48} align="center">
                  No.
                </TableCell>
                <TableCell width={56}>Photo</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Relationship</TableCell>
                <TableCell align="right" width={132}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                    <EmptyTableRow colSpan={7} message="No parents yet. Click Create parent profile to get started." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const name = r.user?.full_name || r.user?.username || "—";
                  const photoSrc = profileImageUrl(r.user?.profile_image);
                  const rowNo = page * rowsPerPage + idx + 1;
                  const relLabel =
                    RELATIONSHIPS.find((x) => x.value === r.relationship)?.label || r.relationship || "—";
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {rowNo}
                      </TableCell>
                      <TableCell>
                        <Avatar
                          src={photoSrc || undefined}
                          sx={{ width: 36, height: 36, bgcolor: `${primaryRed}22`, color: primaryDark, fontWeight: 700 }}
                        >
                          {!photoSrc ? name.charAt(0).toUpperCase() : null}
                        </Avatar>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{name}</TableCell>
                      <TableCell>
                        {Array.isArray(r.students) && r.students.length
                          ? r.students
                              .map((s) => s.user?.full_name || s.admission_number)
                              .filter(Boolean)
                              .join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>{r.user?.email || "—"}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{relLabel}</TableCell>
                      <TableCell align="right">
                        <HRActionButton title="View" onClick={() => setViewRow(r)}>
                          <ViewIcon fontSize="small" />
                        </HRActionButton>
                        <HRActionButton title="Edit" onClick={() => openEdit(r)}>
                          <EditIcon fontSize="small" />
                        </HRActionButton>
                        <HRActionButton
                          title="Remove profile (keeps user account)"
                          color="error"
                          disabled={deletingId === r.id}
                          onClick={() => handleDeleteParent(r)}
                        >
                          {deletingId === r.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </HRActionButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DataTableShell>
      </TabPanelShell>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title="Parent profile"
        subtitle={viewRow?.user?.email}
        icon={<GroupsIcon sx={{ color: "#fff" }} />}
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>
            {viewRow ? (
              <DialogPrimaryButton
                onClick={() => {
                  const row = viewRow;
                  setViewRow(null);
                  openEdit(row);
                }}
              >
                Edit
              </DialogPrimaryButton>
            ) : null}
          </Stack>
        }
      >
        {viewRow ? (
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 100%)`,
                color: "#fff",
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={profileImageUrl(viewRow.user?.profile_image) || undefined}
                  sx={{ width: 64, height: 64, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700 }}
                >
                  {!profileImageUrl(viewRow.user?.profile_image)
                    ? (viewRow.user?.full_name || "?").charAt(0).toUpperCase()
                    : null}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {viewRow.user?.full_name || viewRow.user?.username || "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.92 }}>
                    {viewRow.user?.email || "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <DetailField
              label="Students"
              value={
                Array.isArray(viewRow.students) && viewRow.students.length
                  ? viewRow.students.map((s) => s.user?.full_name || s.admission_number).filter(Boolean).join(", ")
                  : "—"
              }
            />
            <DetailField label="Relationship" value={viewRow.relationship || "—"} />
            <DetailField label="Occupation" value={viewRow.occupation || "—"} />
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={!!editRow}
        onClose={() => !saving && setEditRow(null)}
        title="Edit parent profile"
        subtitle={editRow?.user?.full_name}
        icon={<EditIcon sx={{ color: "#fff" }} />}
        maxWidth="md"
        footer={
          <Stack direction="row" spacing={1} justifyContent="flex-end" width="100%">
            <DialogGhostButton onClick={() => setEditRow(null)} disabled={saving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={saving} onClick={handleSaveEdit}>
              Save
            </DialogPrimaryButton>
          </Stack>
        }
      >
        {editError ? (
          <Typography color="error" sx={{ mb: 2, fontWeight: 600 }}>
            {editError}
          </Typography>
        ) : null}
        <Stack spacing={2.5}>
          <FormSection title="Linked students">
            {editMetaLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} sx={{ color: primaryRed }} />
              </Box>
            ) : (
              <StudentSelectCards
                students={studentsPicklist}
                selectedIds={editForm.student_ids}
                onChange={(ids) => setEditForm({ ...editForm, student_ids: ids })}
                disabled={saving}
              />
            )}
          </FormSection>
          <FormSection title="Contact details">
            <Stack spacing={2}>
              <TextField
                label="Full name"
                size="small"
                fullWidth
                value={editForm.user_full_name}
                onChange={(e) => setEditForm({ ...editForm, user_full_name: e.target.value })}
              />
              <TextField
                label="Email"
                size="small"
                fullWidth
                value={editForm.user_email}
                onChange={(e) => setEditForm({ ...editForm, user_email: e.target.value })}
              />
              <TextField
                label="Phone"
                size="small"
                fullWidth
                value={editForm.user_phone}
                onChange={(e) => setEditForm({ ...editForm, user_phone: e.target.value })}
              />
            </Stack>
          </FormSection>
          <FormSection title="Parent details">
            <Stack spacing={2}>
              <HRFilterSelect
                label="Relationship"
                value={editForm.relationship}
                onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
              >
                {RELATIONSHIPS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </HRFilterSelect>
              <TextField
                label="Occupation"
                size="small"
                fullWidth
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editForm.newsletter_subscription}
                    onChange={(e) => setEditForm({ ...editForm, newsletter_subscription: e.target.checked })}
                  />
                }
                label="Newsletter subscription"
              />
            </Stack>
          </FormSection>
        </Stack>
      </PremiumDialog>
    </Stack>
  );
}
