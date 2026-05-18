import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import StudentSelectCards from "./StudentSelectCards";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const RELATIONSHIPS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

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
      await Swal.fire({ icon: "error", title: "Session expired", text: "Please sign in again.", confirmButtonColor: accent });
      return;
    }
    if (!form.user_id) {
      const msg = "Select a parent user account (create the user under User management with role Parent first).";
      setError(msg);
      await Swal.fire({ icon: "warning", title: "Parent user required", text: msg, confirmButtonColor: accent });
      return;
    }
    if (!form.student_ids?.length) {
      const msg = "Select at least one student to link.";
      setError(msg);
      await Swal.fire({ icon: "warning", title: "Students required", text: msg, confirmButtonColor: accent });
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
      await Swal.fire({
        icon: "success",
        title: "Parent profile created",
        text: "The parent profile is linked to the selected student(s).",
        confirmButtonColor: accent,
        timer: 2400,
        showConfirmButton: false,
      });
      navigate("/hr", { state: { tab: 3 }, replace: true });
    } catch (err) {
      const msg = err.message || "Create failed.";
      setError(msg);
      await Swal.fire({ icon: "error", title: "Could not create profile", text: msg, confirmButtonColor: accent });
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
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 45%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${accentDark} 0%, ${accent} 55%, #EF4444 100%)`,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 1.5, sm: 2 },
          color: "white",
          boxShadow: `0 8px 24px ${accent}33`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Tooltip title="Back to Parents">
            <IconButton
              type="button"
              onClick={goBack}
              aria-label="Back"
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <PersonAddIcon sx={{ fontSize: 32, opacity: 0.95 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Create parent profile
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92, mt: 0.25 }}>
              Link an existing parent user to one or more students.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 }, width: "100%", boxSizing: "border-box" }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {pageLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <Card
            elevation={0}
            sx={{
              width: "100%",
              borderRadius: 2,
              border: `1px solid ${accentLight}`,
              boxShadow: `0 8px 28px -12px ${accent}33`,
            }}
          >
            <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1.5 }}
                  >
                    Parent user
                  </Typography>
                  <FormControl fullWidth required size="small">
                    <InputLabel id="parent-user-label">Parent user account</InputLabel>
                    <Select
                      labelId="parent-user-label"
                      label="Parent user account"
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
                    </Select>
                  </FormControl>
                  {eligibleUsers.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                      No users with role Parent found. Create one under User management first, then return here.
                    </Alert>
                  ) : null}
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1.5 }}
                  >
                    Students to link
                  </Typography>
                  <StudentSelectCards
                    students={studentsWithoutParent}
                    selectedIds={form.student_ids}
                    onChange={(ids) => setForm({ ...form, student_ids: ids })}
                    disabled={saving}
                  />
                  {studentsWithoutParent.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                      No students without a parent profile. Create student profiles under Elimu Plus first.
                    </Alert>
                  ) : null}
                </Box>

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, color: accentDark, letterSpacing: "0.04em", textTransform: "uppercase", mb: 1.5 }}
                  >
                    Parent details
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel id="rel-label">Relationship</InputLabel>
                      <Select
                        labelId="rel-label"
                        label="Relationship"
                        value={form.relationship}
                        onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                      >
                        {RELATIONSHIPS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                </Box>

                <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
                  <Button type="button" onClick={goBack} disabled={saving} sx={{ textTransform: "none", fontWeight: 700 }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || !form.user_id || !form.student_ids?.length}
                    startIcon={saving ? null : <PersonAddIcon />}
                    sx={{ textTransform: "none", fontWeight: 700, bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
                  >
                    {saving ? <CircularProgress size={22} color="inherit" /> : "Create parent profile"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
