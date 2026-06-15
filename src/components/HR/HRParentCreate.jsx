import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import StudentSelectCards from "./StudentSelectCards";
import { authHeaders, fullMainBleedSx, elimuViewportSx, warmCream, primaryRed, primaryDark } from "./hrShared";
import {
  HRHero,
  FormSection,
  HRFilterSelect,
  HRPrimaryButton,
  HRGhostButton,
  hrSwal,
} from "./hrUi";

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const initialForm = () => ({
  user_id: "",
  student_ids: [],
  occupation: "",
  relationship: "guardian",
  newsletter_subscription: true,
});

export default function HRParentCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [studentsWithoutParent, setStudentsWithoutParent] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const goBack = () => navigate("/hr", { state: { tab: 3 } });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    setError(null);
    try {
      const [usersRes, studentsRes] = await Promise.all([
        fetch("/api/parents/users-without-profile", { headers: authHeaders(token) }),
        fetch("/api/parents/students-without-parent", { headers: authHeaders(token) }),
      ]);
      const usersJson = await usersRes.json().catch(() => ({}));
      const studentsJson = await studentsRes.json().catch(() => ({}));
      setEligibleUsers(usersRes.ok && usersJson.success && Array.isArray(usersJson.data) ? usersJson.data : []);
      setStudentsWithoutParent(
        studentsRes.ok && studentsJson.success && Array.isArray(studentsJson.data) ? studentsJson.data : []
      );
    } catch (e) {
      setError(e.message || "Could not load form data.");
      setEligibleUsers([]);
      setStudentsWithoutParent([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      await hrSwal({ icon: "error", title: "Session expired", text: "Please sign in again." });
      return;
    }
    if (!form.user_id) {
      const msg = "Select a parent user account (create the user under User management with role Parent first).";
      setError(msg);
      await hrSwal({ icon: "warning", title: "Parent user required", text: msg });
      return;
    }
    if (!form.student_ids?.length) {
      const msg = "Select at least one student to link.";
      setError(msg);
      await hrSwal({ icon: "warning", title: "Students required", text: msg });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/parents", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          user_id: form.user_id,
          student_ids: form.student_ids,
          relationship: form.relationship,
          occupation: form.occupation?.trim() || null,
          newsletter_subscription: form.newsletter_subscription,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not create parent profile.");
      }
      await hrSwal({
        icon: "success",
        title: "Parent profile created",
        text: "The parent profile is linked to the selected student(s).",
        timer: 2400,
        showConfirmButton: false,
      });
      navigate("/hr", { state: { tab: 3 }, replace: true });
    } catch (err) {
      const msg = err.message || "Create failed.";
      setError(msg);
      await hrSwal({ icon: "error", title: "Could not create profile", text: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        ...elimuViewportSx,
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
        display: "flex",
        flexDirection: "column",
      })}
    >
      <HRHero
        title="Create parent profile"
        subtitle="Link an existing parent user to one or more students."
        icon={<PersonAddIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <Tooltip title="Back to Parents">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: "16px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {pageLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : (
        <Stack spacing={2.5}>
          <FormSection title="Parent user">
            <HRFilterSelect
              label="Parent user account"
              required
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <MenuItem value="">
                <em>Select…</em>
              </MenuItem>
              {eligibleUsers.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.full_name || u.username} ({u.email})
                </MenuItem>
              ))}
            </HRFilterSelect>
            {eligibleUsers.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1.5, borderRadius: "14px" }}>
                No users with role Parent found. Create one under User management first, then return here.
              </Alert>
            ) : null}
          </FormSection>

          <FormSection title="Students to link">
            <StudentSelectCards
              students={studentsWithoutParent}
              selectedIds={form.student_ids}
              onChange={(ids) => setForm({ ...form, student_ids: ids })}
              disabled={saving}
            />
            {studentsWithoutParent.length === 0 ? (
              <Alert severity="info" sx={{ mt: 1.5, borderRadius: "14px" }}>
                No students without a parent profile. Create student profiles under Elimu Plus first.
              </Alert>
            ) : null}
          </FormSection>

          <FormSection title="Parent details">
            <Stack spacing={2}>
              <HRFilterSelect
                label="Relationship"
                required
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
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
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.newsletter_subscription}
                    onChange={(e) => setForm({ ...form, newsletter_subscription: e.target.checked })}
                  />
                }
                label="Newsletter subscription"
              />
            </Stack>
          </FormSection>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <HRGhostButton type="button" onClick={goBack} disabled={saving}>
              Cancel
            </HRGhostButton>
            <HRPrimaryButton
              type="submit"
              disabled={saving || !form.user_id || !form.student_ids?.length}
              startIcon={saving ? null : <PersonAddIcon />}
            >
              {saving ? <CircularProgress size={22} color="inherit" /> : "Create parent profile"}
            </HRPrimaryButton>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
