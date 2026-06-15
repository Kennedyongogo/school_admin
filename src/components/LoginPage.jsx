import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  Chip,
  Fade,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock,
  Login as LoginIcon,
  School,
  Shield,
  AutoStories,
  Groups,
  TrendingUp,
  Close,
  MarkEmailRead,
} from "@mui/icons-material";
import Swal from "sweetalert2";

// ============================================
// ELIMU PLUS — PREMIUM ADMIN PORTAL PALETTE
// ============================================
const primaryRed = "#DC2626";
const primaryDark = "#991B1B";
const primaryLight = "#FEE2E2";
const accentRose = "#FCA5A5";
const accentRoseBright = "#F87171";
const warmCream = "#FFFBF7";
const textPrimary = "#1C1917";
const textSecondary = "#78716C";
const textMuted = "#A8A29E";

const fontDisplay = '"Fraunces", "Georgia", serif';
const fontBody = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';

/** Matches school_api `ADMIN_PORTAL_LOGIN_BLOCKED_ROLES` inverse — blocked: parent, student */
const ADMIN_PORTAL_LOGIN_BLOCKED_ROLES = ["parent", "student"];

const LEFT_PANEL_IMAGES = [
  "/images/images/anilsharma26-children-7047124_1920.jpg",
  "/images/images/ernestoeslava-bus-2690793_1920.jpg",
  "/images/images/startupstockphotos-children-593313_1920.jpg",
];

const HERO_FEATURES = [
  { icon: AutoStories, label: "Curriculum tools" },
  { icon: Groups, label: "Staff management" },
  { icon: TrendingUp, label: "Live analytics" },
];

const STATS = [
  { number: "10,000+", label: "Active Students" },
  { number: "500+", label: "Expert Teachers" },
  { number: "98%", label: "Satisfaction" },
];

const SLIDE_INTERVAL_MS = 7000;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

function AmbientOrbs() {
  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden>
      <Box
        sx={{
          position: "absolute",
          width: "min(520px, 80vw)",
          height: "min(520px, 80vw)",
          top: "-18%",
          right: "-12%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${primaryLight} 0%, transparent 68%)`,
          opacity: 0.55,
          animation: "orbFloat1 14s ease-in-out infinite",
          "@keyframes orbFloat1": {
            "0%, 100%": { transform: "translate(0, 0) scale(1)" },
            "50%": { transform: "translate(-24px, 18px) scale(1.06)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "min(380px, 65vw)",
          height: "min(380px, 65vw)",
          bottom: "-8%",
          left: "-10%",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(252, 165, 165, 0.35) 0%, transparent 70%)`,
          opacity: 0.5,
          animation: "orbFloat2 18s ease-in-out infinite",
          "@keyframes orbFloat2": {
            "0%, 100%": { transform: "translate(0, 0)" },
            "50%": { transform: "translate(20px, -16px)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </Box>
  );
}

function HeroPanel({ leftBgIndex, compact = false }) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        height: compact ? "clamp(200px, 32vh, 280px)" : "100%",
        minHeight: compact ? undefined : "100dvh",
        flexShrink: 0,
        bgcolor: "#111111",
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

      {/* Bottom-only darkening so photos stay clear */}
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
        component={motion.div}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        sx={{
          position: "relative",
          zIndex: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: compact ? "flex-end" : "space-between",
          p: compact ? "20px 24px" : "clamp(28px, 4vh, 48px) clamp(24px, 4vw, 56px)",
          color: "white",
          boxSizing: "border-box",
        }}
      >
        {!compact && (
          <Box component={motion.div} variants={fadeUp} custom={0}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1.25,
                px: 2,
                py: 1,
                borderRadius: "100px",
                bgcolor: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <School sx={{ fontSize: 20, color: accentRoseBright }} />
              <Typography
                sx={{
                  fontFamily: fontBody,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Elimu Plus
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: compact ? 0 : "auto" }}>
          <Box component={motion.div} variants={fadeUp} custom={compact ? 0 : 1}>
            <Chip
              label="Admin Portal"
              size="small"
              sx={{
                bgcolor: "rgba(220, 38, 38, 0.35)",
                backdropFilter: "blur(10px)",
                color: "white",
                fontFamily: fontBody,
                fontWeight: 700,
                fontSize: "0.68rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                mb: compact ? 1 : 2,
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "6px",
                height: 26,
              }}
            />
            <Typography
              component="h1"
              sx={{
                fontFamily: fontDisplay,
                fontSize: compact ? "clamp(1.35rem, 5vw, 1.75rem)" : "clamp(1.75rem, 3.8vh, 2.85rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                mb: compact ? 0.75 : 1.5,
                textShadow: "0 2px 24px rgba(0,0,0,0.35)",
              }}
            >
              Shape the future of{" "}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(120deg, #FFF1F2 0%, ${accentRose} 40%, ${primaryRed} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                learning
              </Box>
            </Typography>
            {!compact && (
              <Typography
                sx={{
                  fontFamily: fontBody,
                  fontSize: "clamp(0.85rem, 1.5vh, 1.05rem)",
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.6,
                  maxWidth: 420,
                  mb: 3,
                }}
              >
                Africa&apos;s premier online homeschool platform — empowering educators and administrators to deliver excellence at scale.
              </Typography>
            )}
          </Box>

          {!compact && (
            <>
              <Box
                component={motion.div}
                variants={fadeUp}
                custom={2}
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}
              >
                {HERO_FEATURES.map(({ icon: Icon, label }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: "10px",
                      bgcolor: "rgba(255,255,255,0.07)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Icon sx={{ fontSize: 16, color: accentRoseBright }} />
                    <Typography sx={{ fontFamily: fontBody, fontSize: "0.75rem", fontWeight: 500 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box
                component={motion.div}
                variants={fadeUp}
                custom={3}
                sx={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                  pt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {STATS.map((stat) => (
                  <Box key={stat.label}>
                    <Typography
                      sx={{
                        fontFamily: fontDisplay,
                        fontSize: "clamp(1.1rem, 2.2vh, 1.5rem)",
                        fontWeight: 700,
                        color: accentRoseBright,
                        lineHeight: 1.1,
                      }}
                    >
                      {stat.number}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: fontBody,
                        fontSize: "0.65rem",
                        color: "rgba(255,255,255,0.55)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        mt: 0.25,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

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
  const [body, updateBody] = useState({ email: null });
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [leftBgIndex, setLeftBgIndex] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [resetEmailFocused, setResetEmailFocused] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeftBgIndex((i) => (i + 1) % LEFT_PANEL_IMAGES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => rfEmail.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!openResetDialog) return undefined;
    const t = setTimeout(() => rsEmail.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [openResetDialog]);

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
        setTimeout(() => navigate("/dashboard"), 1500);
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
      borderRadius: "14px",
      bgcolor: warmCream,
      fontFamily: fontBody,
      transition: "all 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
      "& fieldset": {
        borderColor: "rgba(220, 38, 38, 0.15)",
        borderWidth: "1.5px",
        transition: "all 0.25s ease",
      },
      "&:hover fieldset": { borderColor: accentRose },
      "&.Mui-focused fieldset": {
        borderColor: primaryRed,
        borderWidth: "2px",
        boxShadow: `0 0 0 4px rgba(220, 38, 38, 0.1)`,
      },
    },
    "& .MuiInputLabel-root": {
      fontFamily: fontBody,
      color: textMuted,
      fontWeight: 500,
      "&.Mui-focused": { color: primaryRed, fontWeight: 600 },
    },
    "& .MuiInputBase-input": {
      py: "14px",
      pl: "52px",
      fontSize: "0.95rem",
      fontWeight: 500,
      color: textPrimary,
      "&::placeholder": { color: textMuted, opacity: 0.7 },
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        height: "100dvh",
        maxHeight: "100dvh",
        width: "100%",
        overflow: "hidden",
        fontFamily: fontBody,
        bgcolor: warmCream,
      }}
    >
      {isDesktop ? (
        <Box sx={{ width: "52%", flexShrink: 0 }}>
          <HeroPanel leftBgIndex={leftBgIndex} />
        </Box>
      ) : (
        <HeroPanel leftBgIndex={leftBgIndex} compact />
      )}

      <Box
        component={motion.div}
        initial={{ opacity: 0, x: isDesktop ? 40 : 0, y: isDesktop ? 0 : 24 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          bgcolor: warmCream,
          mt: isDesktop ? 0 : -3,
          borderRadius: isDesktop ? 0 : "24px 24px 0 0",
          boxShadow: isDesktop ? "none" : "0 -8px 40px rgba(12,10,9,0.12)",
          overflow: "hidden",
          zIndex: 4,
        }}
      >
        <AmbientOrbs />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            px: "clamp(20px, 5vw, 56px)",
            py: "clamp(20px, 3vh, 40px)",
            position: "relative",
            zIndex: 1,
            overflow: "auto",
          }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            sx={{ textAlign: "center", mb: "clamp(16px, 3vh, 32px)", flexShrink: 0 }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(145deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
                boxShadow: `0 12px 32px -8px rgba(220, 38, 38, 0.45)`,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: -2,
                  borderRadius: "20px",
                  background: `linear-gradient(145deg, ${accentRose}, transparent)`,
                  zIndex: -1,
                  opacity: 0.4,
                },
              }}
            >
              <School sx={{ color: "white", fontSize: 30 }} />
            </Box>
            <Typography
              sx={{
                fontFamily: fontDisplay,
                fontSize: "clamp(1.25rem, 2.5vw, 1.65rem)",
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </Typography>
            <Typography
              sx={{
                fontFamily: fontBody,
                color: textSecondary,
                fontSize: "0.9rem",
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              Sign in to your admin dashboard
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 0,
            }}
          >
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              sx={{
                width: "100%",
                maxWidth: 420,
              }}
            >
              <Box
                sx={{
                  borderRadius: "24px",
                  p: "1px",
                  background: `linear-gradient(145deg, rgba(220,38,38,0.25) 0%, rgba(252,165,165,0.15) 50%, rgba(220,38,38,0.08) 100%)`,
                  boxShadow: "0 20px 60px -12px rgba(12,10,9,0.12), 0 0 0 1px rgba(220,38,38,0.06)",
                }}
              >
                <Box
                  sx={{
                    borderRadius: "23px",
                    bgcolor: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    px: "clamp(22px, 4vw, 32px)",
                    py: "clamp(28px, 4vh, 36px)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                    <Shield sx={{ fontSize: 18, color: primaryRed }} />
                    <Typography
                      sx={{
                        fontFamily: fontBody,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: primaryRed,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Secure access
                    </Typography>
                  </Box>

                  <form onSubmit={login}>
                    <Box sx={{ position: "relative", mb: 2 }}>
                      <TextField
                        inputRef={rfEmail}
                        type="email"
                        label="Email address"
                        placeholder="admin@elimuplus.education"
                        fullWidth
                        required
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon
                                sx={{
                                  color: emailFocused ? primaryRed : textMuted,
                                  fontSize: 22,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={inputSx}
                      />
                    </Box>

                    <Box sx={{ position: "relative", mb: 1 }}>
                      <TextField
                        inputRef={rfPassword}
                        type={showPassword ? "text" : "password"}
                        label="Password"
                        placeholder="Enter your password"
                        fullWidth
                        required
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock
                                sx={{
                                  color: passwordFocused ? primaryRed : textMuted,
                                  fontSize: 22,
                                  transition: "color 0.2s",
                                }}
                              />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                size="small"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                sx={{
                                  color: textMuted,
                                  "&:hover": { color: primaryRed, bgcolor: primaryLight },
                                }}
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
                        sx={inputSx}
                      />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                      <Typography
                        component="button"
                        type="button"
                        onClick={() => setOpenResetDialog(true)}
                        sx={{
                          fontFamily: fontBody,
                          fontSize: "0.85rem",
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: primaryRed,
                          fontWeight: 600,
                          px: 1,
                          py: 0.5,
                          borderRadius: "8px",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: primaryLight,
                            textDecoration: "none",
                          },
                        }}
                      >
                        Forgot password?
                      </Typography>
                    </Box>

                    <Button
                      component={motion.button}
                      whileHover={{ scale: loading ? 1 : 1.01, y: loading ? 0 : -2 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
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
                        mt: 3,
                        py: 1.6,
                        fontFamily: fontBody,
                        bgcolor: primaryRed,
                        background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                        color: "white",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        letterSpacing: "0.02em",
                        borderRadius: "14px",
                        textTransform: "none",
                        boxShadow: `0 8px 24px -4px rgba(220, 38, 38, 0.45)`,
                        transition: "box-shadow 0.25s ease",
                        "&:hover": {
                          background: `linear-gradient(135deg, ${primaryDark} 0%, #7F1D1D 100%)`,
                          boxShadow: `0 12px 32px -4px rgba(220, 38, 38, 0.55)`,
                        },
                        "&.Mui-disabled": {
                          background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                          color: "white",
                          opacity: 0.7,
                        },
                      }}
                    >
                      {loading ? "Signing in..." : "Access Dashboard"}
                    </Button>
                  </form>
                </Box>
              </Box>

              <Fade in timeout={800}>
                <Typography
                  sx={{
                    fontFamily: fontBody,
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: textMuted,
                    mt: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.75,
                  }}
                >
                  <Shield sx={{ fontSize: 14 }} />
                  Encrypted connection · Staff &amp; teachers only
                </Typography>
              </Fade>
            </Box>
          </Box>

          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            sx={{ flexShrink: 0, pt: 2, textAlign: "center" }}
          >
            <Typography
              sx={{
                fontFamily: fontBody,
                fontSize: "0.72rem",
                color: textMuted,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              <Box component="span" sx={{ color: primaryRed, fontWeight: 700 }}>
                © 2026
              </Box>{" "}
              Elimu Plus Homeschooling &amp; Online Education
            </Typography>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openResetDialog}
        onClose={() => !resetLoading && setOpenResetDialog(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: { bgcolor: "transparent" },
          },
        }}
        PaperProps={{
          component: motion.div,
          initial: { opacity: 0, scale: 0.96, y: 12 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          sx: {
            borderRadius: "24px",
            overflow: "hidden",
            bgcolor: "white",
            boxShadow: "0 24px 64px -12px rgba(28,25,23,0.22), 0 0 0 1px rgba(220,38,38,0.08)",
            m: 2,
          },
        }}
      >
        <Box sx={{ position: "relative", px: 3, pt: 3, pb: 1 }}>
          <IconButton
            onClick={() => !resetLoading && setOpenResetDialog(false)}
            disabled={resetLoading}
            aria-label="Close"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: textMuted,
              bgcolor: warmCream,
              "&:hover": { bgcolor: primaryLight, color: primaryRed },
            }}
          >
            <Close fontSize="small" />
          </IconButton>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: `linear-gradient(145deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              boxShadow: `0 10px 28px -8px rgba(220, 38, 38, 0.45)`,
            }}
          >
            <Lock sx={{ color: "white", fontSize: 26 }} />
          </Box>

          <Typography
            sx={{
              fontFamily: fontDisplay,
              fontWeight: 700,
              color: textPrimary,
              fontSize: "1.4rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              pr: 4,
            }}
          >
            Reset your password
          </Typography>
          <Typography
            sx={{
              fontFamily: fontBody,
              color: textSecondary,
              fontSize: "0.9rem",
              lineHeight: 1.6,
              mt: 1,
            }}
          >
            Enter your registered email and we&apos;ll send a secure link to reset your password.
          </Typography>
        </Box>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              gap: 1.25,
              alignItems: "flex-start",
              p: 1.75,
              mb: 2.5,
              borderRadius: "14px",
              bgcolor: warmCream,
              border: `1px solid ${primaryLight}`,
            }}
          >
            <MarkEmailRead sx={{ fontSize: 20, color: primaryRed, mt: 0.15, flexShrink: 0 }} />
            <Typography sx={{ fontFamily: fontBody, fontSize: "0.8rem", color: textSecondary, lineHeight: 1.55 }}>
              Check your inbox and spam folder. The link expires after a short time for your security.
            </Typography>
          </Box>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <TextField
              inputRef={rsEmail}
              type="email"
              label="Email address"
              placeholder="admin@elimuplus.education"
              fullWidth
              required
              onFocus={() => setResetEmailFocused(true)}
              onBlur={() => setResetEmailFocused(false)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon
                      sx={{
                        color: resetEmailFocused ? primaryRed : textMuted,
                        fontSize: 22,
                        transition: "color 0.2s",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 3, pb: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={resetLoading}
                startIcon={
                  resetLoading ? <CircularProgress size={18} color="inherit" /> : <MarkEmailRead sx={{ fontSize: 20 }} />
                }
                sx={{
                  fontFamily: fontBody,
                  background: `linear-gradient(135deg, ${primaryRed}, ${primaryDark})`,
                  color: "white",
                  borderRadius: "14px",
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.4,
                  fontSize: "0.95rem",
                  boxShadow: `0 8px 24px -4px rgba(220, 38, 38, 0.4)`,
                  "&:hover": { background: `linear-gradient(135deg, ${primaryDark}, #7F1D1D)` },
                }}
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </Button>
              <Button
                variant="text"
                onClick={() => setOpenResetDialog(false)}
                disabled={resetLoading}
                fullWidth
                sx={{
                  fontFamily: fontBody,
                  borderRadius: "12px",
                  textTransform: "none",
                  color: textSecondary,
                  fontWeight: 600,
                  py: 1,
                  "&:hover": { bgcolor: warmCream, color: textPrimary },
                }}
              >
                Back to sign in
              </Button>
            </Box>
          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
