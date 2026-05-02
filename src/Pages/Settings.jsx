import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Check,
  Close,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function Settings({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    Name: user?.full_name || "",
    Email: user?.email || "",
    PhoneNumber: user?.phone || "",
    Position: user?.position || "",
    Role: user?.role || "",
  });
  const [currentUser, setCurrentUser] = useState(user);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("success");
  const [dloading, setDLoading] = useState(false);
  const [ploading, setPLoading] = useState(false);
  const [usr, setUsr] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const checkPasswordCriteria = (password) => {
    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  useEffect(() => {
    checkPasswordCriteria(newPassword);
  }, [newPassword]);

  // Fetch fresh user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(`/api/admin-users/${user?.id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data.success && data.data) {
          setCurrentUser(data.data);
          // Only update userData if no signature is being uploaded
          setUserData((prevData) => ({
            Name: data.data.full_name || "",
            Email: data.data.email || "",
            PhoneNumber: data.data.phone || "",
            Position: data.data.position || "",
            Role: data.data.role || "",
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [user?.id]);

  // Update password handler
  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setUsr(false);
    setMessage(null); // Clear previous messages

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setSeverity("error");
      return;
    }

    if (
      !passwordCriteria.digit ||
      !passwordCriteria.length ||
      !passwordCriteria.lowercase ||
      !passwordCriteria.special ||
      !passwordCriteria.uppercase
    ) {
      setMessage("Enter a strong password!");
      setSeverity("error");
      return;
    }

    setPLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found");
        setSeverity("error");
        setPLoading(false);
        return;
      }

      const response = await fetch(`/api/admin-users/${user?.id}/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage("Password updated successfully.");
        setSeverity("success");
        // Clear message and redirect to home page after a short delay
        setTimeout(() => {
          setMessage(null);
          navigate("/");
        }, 2000); // 2 second delay to show the success message
      } else {
        setMessage(data.message || "Failed to update password.");
        setSeverity("error");
        // Clear error message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage("Failed to update password.");
      setSeverity("error");
      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    setPLoading(false);
  };

  // Update user details handler
  const handleUserUpdate = async () => {
    setDLoading(true);
    setUsr(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("No authentication token found");
        setSeverity("error");
        setDLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        full_name: userData.Name,
        email: userData.Email,
        phone: userData.PhoneNumber,
        position: userData.Position,
        role: userData.Role,
      };

      const response = await fetch(`/api/admin-users/${user?.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();

      if (data.success) {
        // Update current user data with the response
        setCurrentUser(data.data);
        setMessage(data.message || "User details updated successfully.");
        setSeverity("success");
        // Clear success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage(data.message || "Failed to update user details.");
        setSeverity("error");
        // Clear error message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage("Failed to update user details.");
      setSeverity("error");
      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    }
    setDLoading(false);
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          border: "none",
          boxShadow: "none",
          minHeight: "100vh",
        }}
      >
        {/* Header Section */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            p: 3,
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
            position="relative"
            zIndex={1}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                }}
              >
                Account Settings
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Manage your profile and security settings
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<PersonIcon />}
                label={user?.role || "Admin"}
                sx={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                  borderRadius: 3,
                  px: 2,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: "calc(100vh - 200px)" }}
        >
          <Stack spacing={3}>
            {/* User Details Card */}
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 8px 25px rgba(102, 126, 234, 0.15)",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(102, 126, 234, 0.1)",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 35px rgba(102, 126, 234, 0.2)",
                },
              }}
            >
              <CardHeader
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "50%",
                    zIndex: 0,
                  }}
                />
                <Box
                  display="flex"
                  alignItems="center"
                  gap={2}
                  sx={{ position: "relative", zIndex: 1 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      Profile Information
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Update your personal details
                    </Typography>
                  </Box>
                </Box>
              </CardHeader>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {[
                    { field: "Name", label: "Full Name", icon: <PersonIcon />, disabled: false },
                    { field: "Email", label: "Email", icon: <EmailIcon />, disabled: true },
                    {
                      field: "PhoneNumber",
                      label: "Phone Number",
                      icon: <PhoneIcon />,
                      disabled: false,
                    },
                    {
                      field: "Position",
                      label: "Position",
                      icon: <WorkIcon />,
                      disabled: false,
                    },
                    {
                      field: "Role",
                      label: "Role",
                      icon: <WorkIcon />,
                      disabled: true,
                    },
                  ].map(({ field, label, icon, disabled }) => (
                    <FormControl key={field} fullWidth>
                      <InputLabel
                        sx={{
                          color: "#667eea",
                          fontWeight: 600,
                          "&.Mui-focused": {
                            color: "#667eea",
                          },
                        }}
                      >
                        {label}
                      </InputLabel>
                      <OutlinedInput
                        label={label}
                        value={userData[field] || ""}
                        disabled={disabled}
                        onChange={(e) =>
                          setUserData({
                            ...userData,
                            [field]: e.target.value,
                          })
                        }
                        startAdornment={
                          <Box sx={{ mr: 1, color: "#667eea" }}>{icon}</Box>
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: disabled
                              ? "rgba(102, 126, 234, 0.05)"
                              : "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              backgroundColor: disabled
                                ? "rgba(102, 126, 234, 0.05)"
                                : "rgba(102, 126, 234, 0.08)",
                            },
                            "&.Mui-focused": {
                              backgroundColor: "white",
                              boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                            },
                          },
                        }}
                      />
                    </FormControl>
                  ))}

                  {usr && message && (
                    <Alert
                      severity={severity}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 500,
                      }}
                    >
                      {message}
                    </Alert>
                  )}
                </Stack>
              </CardContent>
              <Divider />
              <CardActions sx={{ p: 3, justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleUserUpdate}
                  disabled={dloading}
                  startIcon={
                    dloading ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                    },
                    "&:disabled": {
                      background: "rgba(102, 126, 234, 0.3)",
                      color: "rgba(255, 255, 255, 0.6)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {dloading ? "Updating..." : "Update Profile"}
                </Button>
              </CardActions>
            </Card>

            {/* Password Update Card */}
            <form onSubmit={handlePasswordUpdate}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.15)",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(102, 126, 234, 0.1)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 12px 35px rgba(102, 126, 234, 0.2)",
                  },
                }}
              >
                <CardHeader
                  sx={{
                    background:
                      "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "50%",
                      zIndex: 0,
                    }}
                  />
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={2}
                    sx={{ position: "relative", zIndex: 1 }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        Security Settings
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Update your password for better security
                      </Typography>
                    </Box>
                  </Box>
                </CardHeader>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Password Criteria */}
                    <Box
                      sx={{
                        background: "rgba(102, 126, 234, 0.05)",
                        borderRadius: 2,
                        p: 2,
                        border: "1px solid rgba(102, 126, 234, 0.1)",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: "#667eea",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <LockIcon fontSize="small" />
                        Password Requirements
                      </Typography>
                      <List dense>
                        {[
                          {
                            key: "length",
                            text: "At least 8 characters long",
                          },
                          {
                            key: "uppercase",
                            text: "At least one uppercase letter",
                          },
                          {
                            key: "lowercase",
                            text: "At least one lowercase letter",
                          },
                          { key: "digit", text: "At least one digit" },
                          {
                            key: "special",
                            text: "At least one special character",
                          },
                        ].map(({ key, text }) => (
                          <ListItem key={key} sx={{ py: 0.5, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              {passwordCriteria[key] ? (
                                <Check
                                  sx={{ color: "#27ae60" }}
                                  fontSize="small"
                                />
                              ) : (
                                <Close
                                  sx={{ color: "#e74c3c" }}
                                  fontSize="small"
                                />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={text}
                              primaryTypographyProps={{
                                fontSize: "0.875rem",
                                color: passwordCriteria[key]
                                  ? "#27ae60"
                                  : "#7f8c8d",
                                fontWeight: passwordCriteria[key] ? 600 : 400,
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    {/* Password Fields */}
                    <FormControl fullWidth>
                      <InputLabel
                        sx={{
                          color: "#667eea",
                          fontWeight: 600,
                          "&.Mui-focused": {
                            color: "#667eea",
                          },
                        }}
                      >
                        Current Password
                      </InputLabel>
                      <OutlinedInput
                        label="Current Password"
                        type={showPasswords.oldPassword ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        startAdornment={
                          <Box sx={{ mr: 1, color: "#667eea" }}>
                            <LockIcon />
                          </Box>
                        }
                        endAdornment={
                          <Tooltip
                            title={
                              showPasswords.oldPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            <IconButton
                              onClick={() =>
                                togglePasswordVisibility("oldPassword")
                              }
                              sx={{ color: "#667eea" }}
                            >
                              {showPasswords.oldPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </Tooltip>
                        }
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            "&:hover": {
                              backgroundColor: "rgba(102, 126, 234, 0.08)",
                            },
                            "&.Mui-focused": {
                              backgroundColor: "white",
                              boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                            },
                          },
                        }}
                      />
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel
                            sx={{
                              color: "#667eea",
                              fontWeight: 600,
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          >
                            New Password
                          </InputLabel>
                          <OutlinedInput
                            label="New Password"
                            type={
                              showPasswords.newPassword ? "text" : "password"
                            }
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            startAdornment={
                              <Box sx={{ mr: 1, color: "#667eea" }}>
                                <LockIcon />
                              </Box>
                            }
                            endAdornment={
                              <Tooltip
                                title={
                                  showPasswords.newPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <IconButton
                                  onClick={() =>
                                    togglePasswordVisibility("newPassword")
                                  }
                                  sx={{ color: "#667eea" }}
                                >
                                  {showPasswords.newPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </Tooltip>
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                "&:hover": {
                                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                                },
                                "&.Mui-focused": {
                                  backgroundColor: "white",
                                  boxShadow:
                                    "0 0 0 2px rgba(102, 126, 234, 0.2)",
                                },
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel
                            sx={{
                              color: "#667eea",
                              fontWeight: 600,
                              "&.Mui-focused": {
                                color: "#667eea",
                              },
                            }}
                          >
                            Confirm Password
                          </InputLabel>
                          <OutlinedInput
                            label="Confirm Password"
                            type={
                              showPasswords.confirmPassword
                                ? "text"
                                : "password"
                            }
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              if (e.target.value !== newPassword) {
                                setMessage("Passwords do not match");
                                setSeverity("error");
                              } else setMessage("");
                            }}
                            startAdornment={
                              <Box sx={{ mr: 1, color: "#667eea" }}>
                                <LockIcon />
                              </Box>
                            }
                            endAdornment={
                              <Tooltip
                                title={
                                  showPasswords.confirmPassword
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                <IconButton
                                  onClick={() =>
                                    togglePasswordVisibility("confirmPassword")
                                  }
                                  sx={{ color: "#667eea" }}
                                >
                                  {showPasswords.confirmPassword ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              </Tooltip>
                            }
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "rgba(255, 255, 255, 0.8)",
                                "&:hover": {
                                  backgroundColor: "rgba(102, 126, 234, 0.08)",
                                },
                                "&.Mui-focused": {
                                  backgroundColor: "white",
                                  boxShadow:
                                    "0 0 0 2px rgba(102, 126, 234, 0.2)",
                                },
                              },
                            }}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>

                    {!usr && message && (
                      <Alert
                        severity={severity}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 500,
                        }}
                      >
                        {message}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
                <Divider />
                <CardActions sx={{ p: 3, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={ploading}
                    startIcon={
                      ploading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SecurityIcon />
                      )
                    }
                    sx={{
                      background:
                        "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #ff5252 0%, #e53935 100%)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 6px 20px rgba(255, 107, 107, 0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(255, 107, 107, 0.3)",
                        color: "rgba(255, 255, 255, 0.6)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {ploading ? "Updating..." : "Update Password"}
                  </Button>
                </CardActions>
              </Card>
            </form>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
