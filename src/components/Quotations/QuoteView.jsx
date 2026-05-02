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

const QuoteView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        return;
      }
      const res = await fetch(`/api/quote/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to load quotation request");
      setItem(data.data);
    } catch (err) {
      setError(err.message || "Failed to load quotation request");
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

  const formatCurrency = (value) => {
    if (value == null || value === "") return "—";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Number.isNaN(num) ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  const statusColor = (status) => {
    switch (status) {
      case "new": return "info";
      case "quoted": return "default";
      case "in_progress": return "warning";
      case "completed": return "success";
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
        <Alert severity="error">{error || "Quotation request not found."}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/quotations")} sx={{ mt: 2 }}>
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
            Quotation Request
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/quotations")}
            sx={{ color: "white", borderColor: "rgba(255,255,255,0.7)" }}
          >
            Back to list
          </Button>
        </Box>
        <Box sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip label={item.status.replace("_", " ")} color={statusColor(item.status)} size="small" sx={{ textTransform: "capitalize" }} />
            </Box>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Project Type</Typography>
              <Typography variant="body1" fontWeight={600}>{item.projectType}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Location</Typography>
              <Typography variant="body1">{item.location}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Scale of Operation</Typography>
              <Typography variant="body1">{item.scaleOfOperation}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Expected Outcomes</Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{item.expectedOutcomes}</Typography>
            </Box>
            {item.service && (
              <Box>
                <Typography variant="caption" color="text.secondary">Service</Typography>
                <Typography variant="body1">{item.service}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary">Quote Amount</Typography>
              <Typography variant="body1" fontWeight={600}>{formatCurrency(item.quoteAmount)}</Typography>
            </Box>
            {item.quoteNotes && (
              <Box>
                <Typography variant="caption" color="text.secondary">Quote Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.quoteNotes}</Typography>
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

export default QuoteView;
