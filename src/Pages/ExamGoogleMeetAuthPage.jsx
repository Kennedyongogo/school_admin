import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Typography } from "@mui/material";

export default function ExamGoogleMeetAuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected === "1") setStatus("ok");
    else if (error) setStatus("error");
    else setStatus("idle");
  }, [params]);

  return (
    <Box sx={{ p: 4, maxWidth: 520, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        Google Meet
      </Typography>
      {status === "ok" ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Google account linked. You can start live exam sessions and create Meet links.
        </Alert>
      ) : status === "error" ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {params.get("error") || "Connection failed."}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Use Connect Google from an exam live room, or call /api/google-meet/oauth/start while logged in.
        </Alert>
      )}
      <Button variant="contained" onClick={() => navigate("/exams")}>
        Back to exams
      </Button>
    </Box>
  );
}
