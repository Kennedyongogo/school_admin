import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock,
  Login as LoginIcon,
  School,
} from "@mui/icons-material";
import Swal from "sweetalert2";

// ============================================
// ELIMU PLUS HOMESCHOOL - RED COLOR PALETTE
// ============================================
const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
/** Highlights on dark hero (red family, no gold) */
const accentRose = "#FCA5A5";
const accentRoseBright = "#F87171";
const backgroundLight = "#FEF2F2";
const textPrimary = "#1F2937";
const textSecondary = "#6B7280";

/** Matches school_api `ADMIN_PORTAL_LOGIN_BLOCKED_ROLES` inverse — blocked: parent, student */
const ADMIN_PORTAL_LOGIN_BLOCKED_ROLES = ["parent", "student"];

// Left panel: rotating hero backgrounds (files in public/images/images/)
const LEFT_PANEL_IMAGES = [
  "/images/images/anilsharma26-children-7047124_1920.jpg",
  "/images/images/ernestoeslava-bus-2690793_1920.jpg",
  "/images/images/startupstockphotos-children-593313_1920.jpg",
];

const SLIDE_INTERVAL_MS = 7000;

export default function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const rfEmail = useRef();
  const rfPassword = useRef();
  const rsEmail = useRef();

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [body, updateBody] = useState({ email: null });
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [leftBgIndex, setLeftBgIndex] = useState(0);

  useEffect(() => {
    if (!isDesktop) return undefined;
    const id = setInterval(() => {
      setLeftBgIndex((i) => (i + 1) % LEFT_PANEL_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isDesktop]);

  const login = async (e) => {
    if (e) e.preventDefault();

    const d = { ...body };
    d.email = rfEmail.current?.value?.toLowerCase?.()?.trim() ?? "";
    d.password = rfPassword.current?.value ?? "";
    updateBody(d);

    if (!validateEmail(d.email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address",
        confirmButtonColor: primaryRed,
      });
      return;
    }

    if (!validatePassword(d.password)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Password",
        text: "Password must be at least 6 characters",
        confirmButtonColor: primaryRed,
      });
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Signing in...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch("/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...d, portal: "admin" }),
      });
      const data = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || data.error || "Invalid credentials",
          confirmButtonColor: primaryRed,
        });
      } else if (data.success && data.data?.user && data.data?.token) {
        const authed = data.data.user;
        if (ADMIN_PORTAL_LOGIN_BLOCKED_ROLES.includes(authed.role)) {
          Swal.fire({
            icon: "warning",
            title: "Access denied",
            text: "This portal is for school staff and teachers only. Parents and students should use their own portal.",
            confirmButtonColor: primaryRed,
          });
          return;
        }
        Swal.fire({
          icon: "success",
          title: "Welcome Back!",
          text: data.message || `Signed in as ${authed.full_name || authed.email}`,
          timer: 1500,
          showConfirmButton: false,
        });
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("userRole", authed.role);
        localStorage.setItem("user", JSON.stringify(authed));
        setTimeout(() => navigate("/analytics"), 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || "Login failed",
          confirmButtonColor: primaryRed,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Login failed. Please try again.",
        confirmButtonColor: primaryRed,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    const d = { Email: rsEmail.current?.value?.toLowerCase?.()?.trim() ?? "" };

    if (!validateEmail(d.Email)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email",
        text: "Please enter a valid email address",
        confirmButtonColor: primaryRed,
      });
      return;
    }

    setResetLoading(true);
    Swal.fire({
      title: "Processing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(d),
      });
      const data = await response.json();

      if (response.ok) {
        setOpenResetDialog(false);
        Swal.fire({
          icon: "success",
          title: "Check Your Email",
          text: "We've sent you a password reset link",
          confirmButtonColor: primaryRed,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || data.message || "Request failed",
          confirmButtonColor: primaryRed,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: primaryRed,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const validateEmail = (email) =>
    String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]/.,;:\s@"]+(\.[^<>()[\]/.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );

  const validatePassword = (password) => password && password.length >= 6;

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "white",
      transition: "all 0.2s ease",
      "& fieldset": { borderColor: "#FCA5A5" },
      "&:hover fieldset": { borderColor: primaryRed, borderWidth: "2px" },
      "&.Mui-focused fieldset": {
        borderColor: primaryRed,
        borderWidth: "2px",
        boxShadow: `0 0 0 3px ${primaryLight}`,
      },
    },
    "& .MuiInputLabel-root": {
      color: textSecondary,
      "&.Mui-focused": { color: primaryRed, fontWeight: 600 },
    },
    "& .MuiInputBase-input": {
      py: "clamp(6px, 1.2vh, 11px)",
      pl: "clamp(36px, 8vw, 48px)",
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        minHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        fontFamily: '"Inter", "Poppins", "Roboto", sans-serif',
        bgcolor: backgroundLight,
      }}
    >
      {/* Left: Visual anchor with premium education theme */}
      {isDesktop && (
        <Box
          sx={{
            width: "50%",
            position: "relative",
            flexShrink: 0,
            overflow: "hidden",
            height: "100dvh",
            maxHeight: "100dvh",
            minHeight: 0,
          }}
        >
          <Box sx={{ position: "absolute", inset: 0, bgcolor: "#111111" }} aria-hidden />
          {LEFT_PANEL_IMAGES.map((src, idx) => (
            <Box
              key={src}
              sx={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                opacity: idx === leftBgIndex ? 1 : 0,
                transition: "opacity 1.5s ease-in-out",
                zIndex: idx === leftBgIndex ? 1 : 0,
                pointerEvents: "none",
              }}
              aria-hidden
            />
          ))}
          {/* Bottom-only darkening (neutral black, no blue tint) — keeps photos clear */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 2,
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.18) 38%, rgba(0, 0, 0, 0) 62%)",
              pointerEvents: "none",
            }}
            aria-hidden
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 3,
              height: "100%",
              maxHeight: "100dvh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "clamp(12px, 2.5vh, 32px) clamp(16px, 4vw, 40px)",
              color: "white",
              minHeight: 0,
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                maxWidth: 400,
                width: "100%",
                flexShrink: 0,
                mt: "auto",
                boxSizing: "border-box",
                textShadow: "0 1px 2px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.35)",
              }}
            >
              <Chip
                label="ADMIN PORTAL"
                sx={{
                  bgcolor: "rgba(255,255,255,0.22)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "1px",
                  mb: "clamp(8px, 1.5vh, 16px)",
                  borderRadius: "8px",
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontSize: "clamp(1.25rem, 3.5vh, 2.5rem)",
                  fontWeight: 800,
                  lineHeight: 1.2,
                  mb: "clamp(8px, 1.2vh, 14px)",
                  overflow: "visible",
                  wordBreak: "break-word",
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome to{" "}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(135deg, #FFE4E6 0%, ${accentRose} 38%, ${primaryRed} 72%, ${primaryDark} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Elimu Plus
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontSize: "clamp(0.75rem, 1.4vh, 1rem)",
                  color: "rgba(255,255,255,0.85)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                  lineHeight: 1.45,
                  mb: "clamp(8px, 1.5vh, 16px)",
                }}
              >
                Africa's Premier Online Homeschool Platform — Empowering the next generation of leaders through quality, accessible education.
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {[
                  { number: "10,000+", label: "Active Students" },
                  { number: "500+", label: "Expert Teachers" },
                  { number: "98%", label: "Parent Satisfaction" },
                ].map((stat, idx) => (
                  <Box key={idx} sx={{ textAlign: "center", minWidth: 72 }}>
                    <Typography
                      sx={{
                        fontSize: "clamp(1rem, 2.2vh, 1.35rem)",
                        fontWeight: 800,
                        color: accentRoseBright,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        color: "rgba(255,255,255,0.7)",
                        textTransform: "uppercase",
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: "clamp(10px, 2vh, 18px)",
                  justifyContent: "flex-start",
                }}
                aria-label="Background slide indicators"
              >
                {LEFT_PANEL_IMAGES.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setLeftBgIndex(idx)}
                    role="tab"
                    aria-selected={idx === leftBgIndex}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLeftBgIndex(idx);
                      }
                    }}
                    sx={{
                      width: idx === leftBgIndex ? 28 : 8,
                      height: 8,
                      borderRadius: 4,
                      bgcolor: idx === leftBgIndex ? "white" : "rgba(255,255,255,0.35)",
                      cursor: "pointer",
                      transition: "all 0.35s ease",
                      "&:focus-visible": { outline: "2px solid white", outlineOffset: 2 },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Right: Login form */}
      <Box
        sx={{
          width: isDesktop ? "50%" : "100%",
          height: "100dvh",
          maxHeight: "100dvh",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "white",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            padding: "clamp(10px, 1.8vh, 24px) clamp(14px, 4vw, 40px)",
            overflow: "hidden",
          }}
        >
          {/* Brand header */}
          <Box
            sx={{
              flexShrink: 0,
              textAlign: "center",
              marginBottom: "clamp(6px, 1.2vh, 14px)",
            }}
          >
            <Box
              sx={{
                width: "clamp(40px, 7vw, 64px)",
                height: "clamp(40px, 7vw, 64px)",
                minWidth: 40,
                minHeight: 40,
                background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: "clamp(6px, 1vh, 12px)",
                boxShadow: `0 8px 20px -5px ${primaryRed}40`,
              }}
            >
              <School
                sx={{
                  color: "white",
                  fontSize: "clamp(22px, 4vw, 36px)",
                }}
              />
            </Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: "clamp(1.05rem, 2vw + 0.45rem, 1.65rem)",
                fontWeight: 800,
                color: textPrimary,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Elimu Plus Homeschool
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Inter', sans-serif",
                color: primaryRed,
                fontSize: "clamp(0.72rem, 1vw + 0.35rem, 0.9rem)",
                mt: 0.25,
                fontWeight: 500,
              }}
            >
              Excellence in Online Education
            </Typography>
          </Box>

          {/* Form area — flex center, no nested scroll */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: "min(440px, 92vw)",
                flexShrink: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  borderRadius: "20px",
                  p: "3px",
                  overflow: "hidden",
                  flexShrink: 1,
                  boxShadow: `0 4px 28px -6px ${primaryRed}33, 0 0 0 1px rgba(220, 38, 38, 0.06)`,
                  "@media (prefers-reduced-motion: reduce)": {
                    "&::before": { animation: "none" },
                  },
                  "@keyframes loginSnakeSpin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "180%",
                    height: "180%",
                    marginLeft: "-90%",
                    marginTop: "-90%",
                    zIndex: 0,
                    background: `conic-gradient(
                      from 0deg,
                      transparent 0deg 52deg,
                      rgba(254, 226, 226, 0.35) 62deg,
                      rgba(252, 165, 165, 0.75) 88deg,
                      ${primaryRed} 118deg,
                      rgba(252, 165, 165, 0.85) 148deg,
                      rgba(254, 226, 226, 0.45) 168deg,
                      transparent 182deg 360deg
                    )`,
                    animation: "loginSnakeSpin 4.5s linear infinite",
                    willChange: "transform",
                    pointerEvents: "none",
                  },
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    boxShadow: "none",
                    borderRadius: "17px",
                    px: "clamp(18px, 2.5vw, 28px)",
                    py: "clamp(22px, 3.2vh, 36px)",
                    minHeight: "clamp(268px, 36dvh, 400px)",
                    border: `1px solid ${primaryLight}`,
                    bgcolor: "white",
                    flexShrink: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                <Box sx={{ mb: "clamp(8px, 1.5vh, 16px)", flexShrink: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: textPrimary,
                      fontSize: "clamp(0.95rem, 1.2vw + 0.45rem, 1.1rem)",
                    }}
                  >
                    Admin Access
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "clamp(0.7rem, 0.9vw + 0.35rem, 0.8rem)", lineHeight: 1.35 }}
                  >
                    Secure portal for school administrators
                  </Typography>
                </Box>

                <form onSubmit={login} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <TextField
                    inputRef={rfEmail}
                    type="email"
                    label="Email Address"
                    placeholder="admin@elimuplus.education"
                    size="small"
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: primaryRed, fontSize: 22 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...inputSx, mb: "clamp(8px, 1.2vh, 12px)" }}
                  />

                  <TextField
                    inputRef={rfPassword}
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    placeholder="••••••••"
                    size="small"
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: primaryRed, fontSize: 22 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ ...inputSx, mb: "clamp(4px, 0.8vh, 8px)" }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          sx={{
                            color: "#FCA5A5",
                            "&.Mui-checked": { color: primaryRed },
                          }}
                        />
                      }
                      label={
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                          Remember this device
                        </Typography>
                      }
                    />
                    <Typography
                      component="button"
                      type="button"
                      variant="caption"
                      onClick={() => setOpenResetDialog(true)}
                      sx={{
                        fontSize: "0.75rem",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: primaryRed,
                        fontWeight: 600,
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      Forgot password?
                    </Typography>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress size={22} color="inherit" />
                      ) : (
                        <LoginIcon sx={{ fontSize: 22 }} />
                      )
                    }
                    sx={{
                      mt: "clamp(10px, 1.8vh, 18px)",
                      py: "clamp(8px, 1.4vh, 11px)",
                      bgcolor: primaryRed,
                      color: "white",
                      fontWeight: 700,
                      fontSize: "clamp(0.8rem, 1.5vw + 0.4rem, 0.875rem)",
                      letterSpacing: "0.03em",
                      borderRadius: "60px",
                      textTransform: "none",
                      boxShadow: `0 4px 14px 0 ${primaryRed}40`,
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: primaryDark,
                        transform: "translateY(-2px)",
                        boxShadow: `0 8px 20px 0 ${primaryRed}60`,
                      },
                      "&:active": { transform: "scale(0.98)" },
                    }}
                  >
                    {loading ? "Signing in..." : "Access Dashboard"}
                  </Button>
                </form>
                </Card>
              </Box>
            </Box>
          </Box>

          {/* Footer — single line on all breakpoints; scroll if needed on very narrow screens */}
          <Box
            sx={{
              flexShrink: 0,
              paddingTop: "clamp(6px, 1vh, 12px)",
              width: "100%",
              minWidth: 0,
              display: "flex",
              justifyContent: "center",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              "&::-webkit-scrollbar": { height: 4 },
              "&::-webkit-scrollbar-thumb": {
                background: `${primaryRed}40`,
                borderRadius: 2,
              },
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{
                flexShrink: 0,
                whiteSpace: "nowrap",
                color: primaryDark,
                fontWeight: 600,
                letterSpacing: { xs: "0.02em", sm: "0.04em" },
                fontSize: "clamp(0.5rem, 1.35vw + 0.28rem, 0.75rem)",
                lineHeight: 1.45,
                px: { xs: 0.5, sm: 1 },
                py: 0.5,
                borderRadius: "8px",
                background: `linear-gradient(180deg, ${primaryLight} 0%, rgba(254, 226, 226, 0.65) 100%)`,
                border: `1px solid rgba(220, 38, 38, 0.22)`,
                boxShadow: `0 1px 3px ${primaryRed}18`,
                textAlign: "center",
              }}
            >
              <Box component="span" sx={{ color: primaryRed, fontWeight: 700 }}>
                ©2026
              </Box>
              <Box component="span" sx={{ color: primaryDark }}>
                {" "}
                by Elimu Plus Homeschooling and Online Education.
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Forgot password dialog */}
      <Dialog
        open={openResetDialog}
        onClose={() => !resetLoading && setOpenResetDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: textPrimary, pb: 1 }}>
          Reset Your Password
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, color: textSecondary }}>
            Enter your registered email address and we'll send you a secure link to reset your password.
          </DialogContentText>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <TextField
              inputRef={rsEmail}
              type="email"
              label="Email Address"
              placeholder="admin@elimuplus.education"
              fullWidth
              sx={{
                ...inputSx,
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  ...inputSx["& .MuiOutlinedInput-root"],
                  borderRadius: "12px",
                },
              }}
            />
            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setOpenResetDialog(false)}
                disabled={resetLoading}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  borderColor: "#FCA5A5",
                  color: textSecondary,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={resetLoading}
                startIcon={resetLoading ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  bgcolor: primaryRed,
                  color: "white",
                  borderRadius: "10px",
                  textTransform: "none",
                  px: 3,
                  "&:hover": { bgcolor: primaryDark },
                }}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}