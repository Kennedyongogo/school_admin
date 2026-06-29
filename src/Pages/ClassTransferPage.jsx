import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import TransferWithinAStationIcon from "@mui/icons-material/TransferWithinAStation";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ClassIcon from "@mui/icons-material/Class";
import PeopleIcon from "@mui/icons-material/People";
import LayersIcon from "@mui/icons-material/Layers";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import {
  authHeaders,
  elimuViewportSx,
  fullMainBleedSx,
  warmCream,
  textPrimary,
  fontDisplay,
} from "../components/Exams/examShared";
import { ExamHero } from "../components/Exams/examUi";
import { ElimuPlusTabs } from "../components/SchoolProfile/elimuPlusUi";
import { primaryRed, primaryDark } from "../components/SchoolProfile/elimuPlusShared";

function StudentRoster({ students, compact, column }) {
  if (!students.length) {
    return (
      <Box
        sx={{
          py: compact ? 1.5 : 3,
          px: column ? 1 : 2,
          borderRadius: 2,
          textAlign: "center",
          bgcolor: alpha(primaryRed, 0.03),
          border: `1px dashed ${alpha(primaryRed, 0.2)}`,
        }}
      >
        <PersonOutlineIcon
          sx={{ fontSize: column ? 24 : compact ? 28 : 36, color: alpha(primaryRed, 0.35), mb: 0.5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: column ? "0.75rem" : undefined }}>
          No students yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0}>
      {students.map((student, idx) => (
        <Box
          key={student.id}
          sx={{
            display: "flex",
            alignItems: column ? "flex-start" : "center",
            flexDirection: column ? "column" : "row",
            gap: column ? 0.5 : 1.5,
            py: column ? 1 : 1.25,
            px: column ? 0.25 : 0.5,
            textAlign: column ? "center" : "left",
            borderBottom: idx < students.length - 1 ? `1px solid ${alpha(primaryRed, 0.08)}` : "none",
          }}
        >
          {!column ? (
            <Avatar
              src={student.profile_image || undefined}
              sx={{
                width: 40,
                height: 40,
                bgcolor: alpha(primaryRed, 0.12),
                color: primaryRed,
                fontWeight: 700,
                fontSize: "0.9rem",
              }}
            >
              {(student.full_name || student.admission_number || "?").charAt(0).toUpperCase()}
            </Avatar>
          ) : null}
          <Box sx={{ flex: 1, minWidth: 0, width: column ? "100%" : undefined }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: textPrimary,
                lineHeight: 1.3,
                fontSize: column ? "0.8rem" : undefined,
              }}
              noWrap={!column}
            >
              {student.full_name || student.username || student.admission_number}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: column ? "0.7rem" : undefined }}>
              {student.admission_number}
              {student.gender ? ` · ${student.gender}` : ""}
            </Typography>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function TermColumnsPanel({ levels, loadingLevels }) {
  if (loadingLevels) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={28} sx={{ color: primaryRed }} />
      </Box>
    );
  }

  if (!levels.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: "italic" }}>
        No terms configured for this class yet.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        width: "100%",
        gap: 0.75,
        alignItems: "stretch",
      }}
    >
      {levels.map((level) => {
        const count = level.student_count ?? level.students?.length ?? 0;
        return (
          <Box
            key={level.id}
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${alpha(primaryRed, 0.14)}`,
                bgcolor: alpha(primaryRed, 0.06),
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  lineHeight: 1.25,
                  color: primaryDark,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {level.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {count} student{count === 1 ? "" : "s"}
              </Typography>
            </Box>

            <Box
              sx={{
                mt: 0.75,
                flex: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(primaryRed, 0.1)}`,
                bgcolor: "#fff",
                px: 0.75,
                py: 0.5,
              }}
            >
              <StudentRoster students={level.students || []} compact column />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function ClassGalleryCard({ classItem, levels, loadingLevels }) {
  return (
    <Box
      data-class-card
      sx={{
        width: "100%",
        borderRadius: "22px",
        bgcolor: "#fff",
        border: "1px solid rgba(220,38,38,0.12)",
        boxShadow: "0 16px 48px -12px rgba(220,38,38,0.22)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 6,
          background: `linear-gradient(90deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
        }}
      />
      <Box sx={{ p: { xs: 2.25, md: 2.75 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(primaryRed, 0.08),
              color: primaryRed,
              flexShrink: 0,
            }}
          >
            <ClassIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: fontDisplay,
                fontWeight: 700,
                fontSize: { xs: "1.25rem", md: "1.45rem" },
                color: textPrimary,
                lineHeight: 1.2,
              }}
            >
              {classItem.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Code: <strong>{classItem.code}</strong>
              {classItem.period ? ` · ${classItem.period}` : ""}
            </Typography>
          </Box>
          {classItem.is_active !== undefined ? (
            <Chip
              size="small"
              label={classItem.is_active === false ? "Inactive" : "Active"}
              color={classItem.is_active === false ? "default" : "success"}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          ) : null}
        </Stack>

        {classItem.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
            {classItem.description}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1.25}>
          <Box
            sx={{
              flex: 1,
              p: 1.75,
              borderRadius: 2,
              bgcolor: alpha(primaryRed, 0.04),
              border: `1px solid ${alpha(primaryRed, 0.1)}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PeopleIcon sx={{ color: primaryRed, fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Students
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: textPrimary }}>
                  {classItem.student_count ?? 0}
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 1.75,
              borderRadius: 2,
              bgcolor: alpha(primaryRed, 0.04),
              border: `1px solid ${alpha(primaryRed, 0.1)}`,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <LayersIcon sx={{ color: primaryRed, fontSize: 20 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  Terms / levels
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: "1.2rem", color: textPrimary }}>
                  {classItem.level_count ?? levels.length ?? 0}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 2.5,
            pt: 2.5,
            borderTop: `1px solid ${alpha(primaryRed, 0.1)}`,
          }}
        >
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, color: primaryDark, letterSpacing: "0.08em", fontSize: "0.68rem" }}
          >
            Terms in this class
          </Typography>

          <TermColumnsPanel levels={levels} loadingLevels={loadingLevels} />
        </Box>
      </Box>
    </Box>
  );
}

export default function ClassTransferPage() {
  const scrollRef = useRef(null);
  const [loadingCurricula, setLoadingCurricula] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [curricula, setCurricula] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [classes, setClasses] = useState([]);
  const [curriculumMeta, setCurriculumMeta] = useState(null);
  const [classIndex, setClassIndex] = useState(0);
  const [levels, setLevels] = useState([]);
  const [levelsForClassId, setLevelsForClassId] = useState(null);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const levelsCacheRef = useRef({});
  const levelsRequestRef = useRef(0);

  const selectedCurriculum = curricula[activeTab] || null;
  const currentClass = classes[classIndex] || null;

  const loadCurricula = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoadingCurricula(true);
    setError("");
    try {
      const res = await fetch("/api/class-transfer/curricula", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load curricula.");
      const rows = Array.isArray(data.data) ? data.data : [];
      setCurricula(rows);
      setActiveTab((prev) => (rows.length && prev >= rows.length ? 0 : prev));
    } catch (e) {
      setError(e.message || "Could not load curricula.");
      setCurricula([]);
    } finally {
      setLoadingCurricula(false);
    }
  }, []);

  const loadClasses = useCallback(async (curriculumId) => {
    const token = localStorage.getItem("token");
    if (!token || !curriculumId) {
      setClasses([]);
      setCurriculumMeta(null);
      return;
    }
    setLoadingClasses(true);
    setError("");
    try {
      const res = await fetch(`/api/class-transfer/curricula/${encodeURIComponent(curriculumId)}/classes`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load classes.");
      setCurriculumMeta(data.data?.curriculum || null);
      setClasses(Array.isArray(data.data?.classes) ? data.data.classes : []);
      setClassIndex(0);
      levelsCacheRef.current = {};
      setLevels([]);
      setLevelsForClassId(null);
    } catch (e) {
      setError(e.message || "Could not load classes.");
      setClasses([]);
      setCurriculumMeta(null);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadLevels = useCallback(async (classId) => {
    const token = localStorage.getItem("token");
    if (!token || !classId) {
      setLevels([]);
      setLevelsForClassId(null);
      return;
    }

    const cached = levelsCacheRef.current[classId];
    if (cached) {
      setLevels(cached);
      setLevelsForClassId(classId);
      setLoadingLevels(false);
      return;
    }

    const requestId = ++levelsRequestRef.current;
    setLevels([]);
    setLevelsForClassId(null);
    setLoadingLevels(true);

    try {
      const res = await fetch(`/api/class-transfer/classes/${encodeURIComponent(classId)}/levels`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (requestId !== levelsRequestRef.current) return;
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load terms.");
      const rows = Array.isArray(data.data?.levels) ? data.data.levels : [];
      levelsCacheRef.current[classId] = rows;
      setLevels(rows);
      setLevelsForClassId(classId);
    } catch (e) {
      if (requestId !== levelsRequestRef.current) return;
      setError(e.message || "Could not load terms.");
      setLevels([]);
      setLevelsForClassId(null);
    } finally {
      if (requestId === levelsRequestRef.current) {
        setLoadingLevels(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCurricula();
  }, [loadCurricula]);

  useEffect(() => {
    if (selectedCurriculum?.id) {
      void loadClasses(selectedCurriculum.id);
    } else {
      setClasses([]);
      setCurriculumMeta(null);
      setClassIndex(0);
    }
  }, [selectedCurriculum?.id, loadClasses]);

  useEffect(() => {
    if (currentClass?.id) {
      void loadLevels(currentClass.id);
    } else {
      setLevels([]);
      setLevelsForClassId(null);
    }
  }, [currentClass?.id, loadLevels]);

  const applyClassLevelState = useCallback((classId) => {
    if (!classId) {
      setLevels([]);
      setLevelsForClassId(null);
      return;
    }
    const cached = levelsCacheRef.current[classId];
    if (cached) {
      setLevels(cached);
      setLevelsForClassId(classId);
      setLoadingLevels(false);
    } else {
      setLevels([]);
      setLevelsForClassId(null);
    }
  }, []);

  const selectClassIndex = useCallback(
    (index) => {
      const nextClass = classes[index];
      if (nextClass?.id) applyClassLevelState(nextClass.id);
      setClassIndex(index);
    },
    [classes, applyClassLevelState]
  );

  const scrollToIndex = useCallback(
    (index) => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
      selectClassIndex(index);
    },
    [selectClassIndex]
  );

  const goPrev = () => {
    scrollToIndex(Math.max(0, classIndex - 1));
  };

  const goNext = () => {
    scrollToIndex(Math.min(classes.length - 1, classIndex + 1));
  };

  useEffect(() => {
    if (classes.length && scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      setClassIndex(0);
    }
  }, [classes]);

  const onGalleryScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !classes.length) return;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    const clamped = Math.min(Math.max(0, index), classes.length - 1);
    setClassIndex((prev) => {
      if (prev === clamped) return prev;
      const nextClass = classes[clamped];
      if (nextClass?.id) applyClassLevelState(nextClass.id);
      return clamped;
    });
  }, [classes, applyClassLevelState]);

  const curriculumTabs = useMemo(
    () =>
      curricula.map((c, idx) => ({
        label: c.type ? `${c.name} · ${c.type}` : c.name,
        value: idx,
      })),
    [curricula]
  );

  const onRefresh = () => {
    levelsCacheRef.current = {};
    void loadCurricula();
    if (selectedCurriculum?.id) void loadClasses(selectedCurriculum.id);
    if (currentClass?.id) void loadLevels(currentClass.id);
  };

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        ...elimuViewportSx,
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      })}
    >
      <ExamHero
        title="Class transfer"
        subtitle="Pick a curriculum, then use the arrows to move between classes. Each term column lists its students below."
        icon={<TransferWithinAStationIcon sx={{ fontSize: 28, color: "#fff" }} />}
        actions={
          <IconButton
            onClick={onRefresh}
            aria-label="Refresh"
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <RefreshIcon />
          </IconButton>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {loadingCurricula ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : curricula.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No curricula yet. Add a curriculum first, then classes will appear here for transfer.
        </Alert>
      ) : (
        <>
          <ElimuPlusTabs
            activeTab={activeTab}
            onChange={(v) => {
              setActiveTab(v);
              setClassIndex(0);
            }}
            tabs={curriculumTabs}
          />

          <Box
            sx={(theme) => ({
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              mx: { xs: theme.spacing(-1.5), sm: theme.spacing(-2), md: theme.spacing(-3) },
              mb: { xs: theme.spacing(-2), sm: theme.spacing(-2.5) },
              width: {
                xs: `calc(100% + ${theme.spacing(3)})`,
                sm: `calc(100% + ${theme.spacing(4)})`,
                md: `calc(100% + ${theme.spacing(6)})`,
              },
              borderRadius: { xs: "18px 18px 0 0", sm: "22px 22px 0 0" },
              bgcolor: "#fff",
              border: "1px solid rgba(220,38,38,0.1)",
              borderBottom: "none",
              boxShadow: "0 -4px 40px -12px rgba(220,38,38,0.12)",
              overflow: "visible",
            })}
          >
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.5,
                borderBottom: "1px solid rgba(220,38,38,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Typography sx={{ fontWeight: 700, color: textPrimary }}>
                {curriculumMeta?.name || selectedCurriculum?.name || "Curriculum"}
              </Typography>
              <Chip
                size="small"
                label={
                  loadingClasses
                    ? "Loading…"
                    : classes.length
                      ? `${classIndex + 1} of ${classes.length}`
                      : "No classes"
                }
                sx={{ fontWeight: 700, bgcolor: alpha(primaryRed, 0.08), color: primaryDark }}
              />
            </Box>

            <Box
              sx={{
                position: "relative",
                bgcolor: warmCream,
                minHeight: 280,
              }}
            >
              {classes.length > 0 ? (
                <>
                  <IconButton
                    onClick={goPrev}
                    disabled={loadingClasses || classIndex <= 0}
                    sx={{
                      position: "absolute",
                      left: { xs: 4, md: 12 },
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: 44,
                      height: 44,
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(primaryRed, 0.2)}`,
                      color: primaryRed,
                      boxShadow: "0 8px 24px rgba(28,25,23,0.1)",
                      "&:hover": { bgcolor: alpha(primaryRed, 0.06) },
                      "&.Mui-disabled": { opacity: 0.35 },
                    }}
                    aria-label="Previous class"
                  >
                    <KeyboardArrowLeftIcon />
                  </IconButton>

                  <IconButton
                    onClick={goNext}
                    disabled={loadingClasses || classIndex >= classes.length - 1}
                    sx={{
                      position: "absolute",
                      right: { xs: 4, md: 12 },
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      width: 44,
                      height: 44,
                      bgcolor: "#fff",
                      border: `1px solid ${alpha(primaryRed, 0.2)}`,
                      color: primaryRed,
                      boxShadow: "0 8px 24px rgba(28,25,23,0.1)",
                      "&:hover": { bgcolor: alpha(primaryRed, 0.06) },
                      "&.Mui-disabled": { opacity: 0.35 },
                    }}
                    aria-label="Next class"
                  >
                    <KeyboardArrowRightIcon />
                  </IconButton>
                </>
              ) : null}

            {loadingClasses ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8, bgcolor: warmCream }}>
                <CircularProgress sx={{ color: primaryRed }} />
              </Box>
            ) : !classes.length ? (
              <Box
                sx={{
                  mx: { xs: 2, md: 4 },
                  my: 3,
                  textAlign: "center",
                  py: 6,
                  px: 3,
                  borderRadius: "22px",
                  bgcolor: warmCream,
                }}
              >
                <Box
                  sx={{
                    borderRadius: "22px",
                    bgcolor: "#fff",
                    border: `1px dashed ${alpha(primaryRed, 0.25)}`,
                    py: 6,
                    px: 3,
                  }}
                >
                  <ClassIcon sx={{ fontSize: 48, color: alpha(primaryRed, 0.35), mb: 1 }} />
                  <Typography sx={{ fontWeight: 700, color: textPrimary, mb: 0.5 }}>
                    No classes in this curriculum
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add class bands under Curriculum, then return here to browse them.
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                ref={scrollRef}
                onScroll={onGalleryScroll}
                sx={{
                  width: "100%",
                  display: "flex",
                  overflowX: "auto",
                  overflowY: "visible",
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {classes.map((classItem, idx) => {
                  const isActiveSlide = idx === classIndex;
                  const levelsReady = levelsForClassId === classItem.id;
                  return (
                    <Box
                      key={classItem.id}
                      sx={{
                        flex: "0 0 100%",
                        width: "100%",
                        scrollSnapAlign: "start",
                        scrollSnapStop: "always",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        px: { xs: 7, md: 10 },
                        py: { xs: 2.5, md: 3 },
                        boxSizing: "border-box",
                      }}
                    >
                      <ClassGalleryCard
                        classItem={classItem}
                        levels={isActiveSlide && levelsReady ? levels : []}
                        loadingLevels={isActiveSlide && levelsForClassId !== classItem.id}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
