import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

const ConsultationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConsultation();
  }, [id]);

  const fetchConsultation = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }
      const res = await fetch(`/api/consultation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load consultation");
      setItem(data.data);
    } catch (err) {
      setError(err.message || "Failed to load consultation");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (value) => {
    if (!value) return "—";
    const d = new Date(`1970-01-01T${value}`);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const statusColor = (status) => {
    switch (status) {
      case "pending": return "warning";
      case "scheduled": return "info";
      case "completed": return "success";
      case "cancelled": return "error";
      case "archived": return "default";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress sx={{ color: "#667eea" }} />
      </Box>
    );
  }

  if (error || !item) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || "Consultation not found."}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/consultations")} sx={{ mt: 2 }}>
          Back to list
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
        p: { xs: 0.5, md: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #6B4E3D 0%, #B85C38 100%)",
            p: 2,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Consultation Booking
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/consultations")}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.7)" }}
          >
            Back to list
          </Button>
        </Box>
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label={item.status} color={statusColor(item.status)} size="small" sx={{ textTransform: "capitalize" }} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Full Name</Typography>
              <Typography variant="body1" fontWeight={600}>{item.fullName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body1">{item.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography variant="body1">{item.phone}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Consultation Type</Typography>
              <Typography variant="body1">{item.consultationType}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Preferred Date</Typography>
              <Typography variant="body1">{formatDate(item.preferredDate)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Preferred Time</Typography>
              <Typography variant="body1">{formatTime(item.preferredTime)}</Typography>
            </Box>
            {item.message && (
              <Box>
                <Typography variant="caption" color="text.secondary">Message</Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{item.message}</Typography>
              </Box>
            )}
            {item.scheduledDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">Scheduled Date/Time</Typography>
                <Typography variant="body1">{formatDate(item.scheduledDate)}</Typography>
              </Box>
            )}
            {item.adminNotes && (
              <Box>
                <Typography variant="caption" color="text.secondary">Admin Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.adminNotes}</Typography>
              </Box>
            )}
            <Divider />
            <Typography variant="caption" color="text.secondary">
              Submitted {formatDate(item.createdAt)}
              {item.reviewedAt && ` · Reviewed ${formatDate(item.reviewedAt)}`}
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default ConsultationView;
