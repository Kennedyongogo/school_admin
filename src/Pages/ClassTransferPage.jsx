import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Snackbar,
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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

const DRAG_BODY_CLASS = "class-transfer-dragging";

const dropZoneActiveSx = {
  border: `2px solid ${primaryRed} !important`,
  bgcolor: `${alpha(primaryRed, 0.08)} !important`,
  boxShadow: `inset 0 0 0 1px ${alpha(primaryRed, 0.2)}`,
};

function cloneLevels(levels) {
  return (levels || []).map((level) => ({
    ...level,
    students: [...(level.students || [])],
  }));
}

function studentCardContainerSx(column, { ghost = false, dragging = false } = {}) {
  return {
    display: "flex",
    alignItems: column ? "flex-start" : "center",
    flexDirection: column ? "column" : "row",
    gap: column ? 0.5 : 1,
    py: column ? 1 : 1.25,
    px: column ? 0.75 : 1,
    textAlign: column ? "center" : "left",
    borderRadius: 2,
    border: ghost ? `2px solid ${primaryRed}` : `1px solid ${alpha(primaryRed, 0.12)}`,
    bgcolor: "#fff",
    boxShadow: ghost
      ? `0 22px 48px ${alpha(primaryRed, 0.32)}, 0 8px 16px ${alpha("#000", 0.12)}`
      : `0 2px 8px ${alpha(primaryRed, 0.06)}`,
    transition: ghost ? "none" : "border-color 0.2s, box-shadow 0.2s, opacity 0.2s",
    transform: ghost ? "rotate(-1.5deg)" : dragging ? "none" : undefined,
    opacity: dragging ? 0.3 : ghost ? 0.98 : 1,
    ...(dragging
      ? {
          borderStyle: "dashed",
          borderColor: alpha(primaryRed, 0.35),
          bgcolor: alpha(primaryRed, 0.04),
          boxShadow: "none",
        }
      : {}),
    "& *": {
      pointerEvents: "none",
      userSelect: "none",
    },
  };
}

function StudentCardVisual({ student, column }) {
  return (
    <>
      <DragIndicatorIcon
        sx={{
          fontSize: 16,
          color: alpha(primaryRed, 0.45),
          alignSelf: column ? "center" : "flex-start",
          mt: column ? 0 : 0.35,
        }}
      />
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
    </>
  );
}

function DragStudentGhost({ student, width, x, y, ghostRef, offsetRef }) {
  return createPortal(
    <Box
      ref={(el) => {
        ghostRef.current = el;
        if (el && x != null && y != null) {
          const { offsetX, offsetY } = offsetRef.current;
          el.style.transform = `translate3d(${x - offsetX}px, ${y - offsetY}px, 0)`;
        }
      }}
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1400,
        width,
        pointerEvents: "none",
        willChange: "transform",
        ...studentCardContainerSx(true, { ghost: true }),
      }}
    >
      <StudentCardVisual student={student} column />
    </Box>,
    document.body
  );
}

function DraggableStudentCard({ student, column, disabled, classId, levelId, onPointerDragStart }) {
  const handlePointerDown = (e) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    onPointerDragStart(e, {
      studentId: student.id,
      student,
      fromClassId: classId,
      fromLevelId: levelId,
    });
  };

  return (
    <Box
      data-student-id={student.id}
      onPointerDown={handlePointerDown}
      sx={{
        ...studentCardContainerSx(column),
        cursor: disabled ? "default" : "grab",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        "&[data-drag-active='1']": studentCardContainerSx(column, { dragging: true }),
        "&:active": { cursor: disabled ? "default" : "grabbing" },
        "&:hover": disabled
          ? {}
          : {
              borderColor: alpha(primaryRed, 0.35),
              boxShadow: `0 8px 20px ${alpha(primaryRed, 0.12)}`,
            },
      }}
    >
      <StudentCardVisual student={student} column={column} />
    </Box>
  );
}

function StudentRoster({ students, compact, column, transferBusy, classId, levelId, onPointerDragStart }) {
  if (!students.length) {
    return (
      <Box
        sx={{
          py: compact ? 2 : 3,
          px: column ? 1 : 2,
          borderRadius: 2,
          textAlign: "center",
          bgcolor: alpha(primaryRed, 0.03),
          border: `1px dashed ${alpha(primaryRed, 0.2)}`,
          minHeight: column ? 72 : undefined,
          pointerEvents: "none",
        }}
      >
        <PersonOutlineIcon
          sx={{ fontSize: column ? 24 : compact ? 28 : 36, color: alpha(primaryRed, 0.35), mb: 0.5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: column ? "0.75rem" : undefined }}>
          Drop students here
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={0.75}>
      {students.map((student) => (
        <DraggableStudentCard
          key={student.id}
          student={student}
          column={column}
          disabled={transferBusy}
          classId={classId}
          levelId={levelId}
          onPointerDragStart={onPointerDragStart}
        />
      ))}
    </Stack>
  );
}

function TermDropColumn({ level, classId, transferBusy, onPointerDragStart }) {
  const count = level.student_count ?? level.students?.length ?? 0;

  return (
    <Box
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
        data-term-drop-zone
        data-level-id={level.id}
        data-class-id={classId}
        sx={{
          mt: 0.75,
          flex: 1,
          minHeight: 120,
          borderRadius: 2,
          border: `2px dashed ${alpha(primaryRed, 0.18)}`,
          bgcolor: "#fff",
          px: 0.75,
          py: 0.75,
          transition: "border-color 0.15s, background-color 0.15s",
          "&[data-drop-active='1']": dropZoneActiveSx,
        }}
      >
        <StudentRoster
          students={level.students || []}
          compact
          column
          transferBusy={transferBusy}
          classId={classId}
          levelId={level.id}
          onPointerDragStart={onPointerDragStart}
        />
      </Box>
    </Box>
  );
}

function TermColumnsPanel({ levels, loadingLevels, classId, transferBusy, onPointerDragStart }) {
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
      {levels.map((level) => (
          <TermDropColumn
            key={level.id}
            level={level}
            classId={classId}
            transferBusy={transferBusy}
            onPointerDragStart={onPointerDragStart}
          />
        ))}
    </Box>
  );
}

function ClassGalleryCard({ classItem, levels, loadingLevels, transferBusy, onPointerDragStart }) {
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: primaryDark, letterSpacing: "0.08em", fontSize: "0.68rem" }}
            >
              Terms in this class
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Press and drag a student card to another term
            </Typography>
          </Stack>

          <TermColumnsPanel
            levels={levels}
            loadingLevels={loadingLevels}
            classId={classItem.id}
            transferBusy={transferBusy}
            onPointerDragStart={onPointerDragStart}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function ClassTransferPage() {
  const scrollRef = useRef(null);
  const pointerDragRef = useRef(null);
  const activeCardRef = useRef(null);
  const dragPointerIdRef = useRef(null);
  const dragGhostElRef = useRef(null);
  const dragGhostOffsetRef = useRef({ offsetX: 0, offsetY: 0 });
  const [dragGhost, setDragGhost] = useState(null);
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
  const [transferBusy, setTransferBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const selectedCurriculum = curricula[activeTab] || null;
  const currentClass = classes[classIndex] || null;

  const showSnack = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchLevelsRaw = useCallback(async (classId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/class-transfer/classes/${encodeURIComponent(classId)}/levels`, {
      headers: authHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load terms.");
    return Array.isArray(data.data?.levels) ? data.data.levels : [];
  }, []);

  const syncLevelsState = useCallback((classId) => {
    const cached = levelsCacheRef.current[classId];
    if (cached) {
      setLevels(cloneLevels(cached));
      setLevelsForClassId(classId);
    }
  }, []);

  const bumpClassCounts = useCallback((fromClassId, toClassId) => {
    if (fromClassId === toClassId) return;
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === fromClassId) return { ...c, student_count: Math.max(0, (c.student_count ?? 0) - 1) };
        if (c.id === toClassId) return { ...c, student_count: (c.student_count ?? 0) + 1 };
        return c;
      })
    );
  }, []);

  const applyLocalMove = useCallback(
    ({ student, fromClassId, fromLevelId, toClassId, toLevelId }) => {
      const removeFromClass = (classId, levelId, studentId) => {
        if (!levelsCacheRef.current[classId]) return;
        levelsCacheRef.current[classId] = levelsCacheRef.current[classId].map((level) => {
          if (level.id !== levelId) return level;
          const students = (level.students || []).filter((s) => s.id !== studentId);
          return { ...level, students, student_count: students.length };
        });
      };

      const addToClass = (classId, levelId, stud) => {
        if (!levelsCacheRef.current[classId]) return;
        levelsCacheRef.current[classId] = levelsCacheRef.current[classId].map((level) => {
          if (level.id !== levelId) return level;
          if ((level.students || []).some((s) => s.id === stud.id)) return level;
          const students = [...(level.students || []), stud];
          return { ...level, students, student_count: students.length };
        });
      };

      removeFromClass(fromClassId, fromLevelId, student.id);
      addToClass(toClassId, toLevelId, student);

      if (levelsForClassId === fromClassId || levelsForClassId === toClassId) {
        syncLevelsState(levelsForClassId);
      }
      bumpClassCounts(fromClassId, toClassId);
    },
    [bumpClassCounts, levelsForClassId, syncLevelsState]
  );

  const clearPointerDragUi = useCallback(() => {
    document.body.classList.remove(DRAG_BODY_CLASS);
    document.querySelectorAll("[data-drop-active]").forEach((el) => el.removeAttribute("data-drop-active"));
    if (activeCardRef.current) {
      activeCardRef.current.removeAttribute("data-drag-active");
      activeCardRef.current.style.pointerEvents = "";
      if (activeCardRef.current.releasePointerCapture && dragPointerIdRef.current != null) {
        try {
          activeCardRef.current.releasePointerCapture(dragPointerIdRef.current);
        } catch {
          /* pointer may already be released */
        }
      }
      dragPointerIdRef.current = null;
      activeCardRef.current = null;
    }
    document.body.style.cursor = "";
    pointerDragRef.current = null;
    setDragGhost(null);
    dragGhostElRef.current = null;
  }, []);

  const moveDragGhost = useCallback((clientX, clientY) => {
    const { offsetX, offsetY } = dragGhostOffsetRef.current;
    if (dragGhostElRef.current) {
      dragGhostElRef.current.style.transform = `translate3d(${clientX - offsetX}px, ${clientY - offsetY}px, 0)`;
    }
  }, []);

  const commitTransfer = useCallback(
    async ({ studentId, targetClassId, targetLevelId, sourceSnapshot }) => {
      const source = sourceSnapshot;
      if (!source) return;

      if (source.fromClassId === targetClassId && source.fromLevelId === targetLevelId) {
        return;
      }

      const token = localStorage.getItem("token");
      setTransferBusy(true);

      const snapshot = {
        fromClassId: source.fromClassId,
        fromLevelId: source.fromLevelId,
        toClassId: targetClassId,
        toLevelId: targetLevelId,
        student: source.student,
        fromLevels: cloneLevels(levelsCacheRef.current[source.fromClassId]),
        toLevels: source.fromClassId === targetClassId ? null : cloneLevels(levelsCacheRef.current[targetClassId]),
        classesSnapshot: classes.map((c) => ({ ...c })),
      };

      applyLocalMove({
        student: source.student,
        fromClassId: source.fromClassId,
        fromLevelId: source.fromLevelId,
        toClassId: targetClassId,
        toLevelId: targetLevelId,
      });

      try {
        const res = await fetch(`/api/class-transfer/students/${encodeURIComponent(studentId)}/move`, {
          method: "POST",
          headers: { ...authHeaders(token), "Content-Type": "application/json" },
          body: JSON.stringify({
            curriculum_class_id: targetClassId,
            curriculum_class_level_id: targetLevelId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not move student.");

        if (data.data?.student && levelsCacheRef.current[targetClassId]) {
          const updated = data.data.student;
          levelsCacheRef.current[targetClassId] = levelsCacheRef.current[targetClassId].map((level) => ({
            ...level,
            students: (level.students || []).map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
          }));
          if (levelsForClassId === targetClassId) syncLevelsState(targetClassId);
        }

        showSnack(data.message || "Student moved successfully.");
      } catch (e) {
        levelsCacheRef.current[snapshot.fromClassId] = snapshot.fromLevels;
        if (snapshot.toLevels) levelsCacheRef.current[snapshot.toClassId] = snapshot.toLevels;
        setClasses(snapshot.classesSnapshot);
        if (levelsForClassId) syncLevelsState(levelsForClassId);
        showSnack(e.message || "Could not move student.", "error");
      } finally {
        setTransferBusy(false);
      }
    },
    [applyLocalMove, classes, levelsForClassId, showSnack, syncLevelsState]
  );

  const onPointerDragStart = useCallback(
    (e, payload) => {
      if (transferBusy || pointerDragRef.current) return;

      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      dragGhostOffsetRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };

      activeCardRef.current = card;
      card.setAttribute("data-drag-active", "1");
      card.style.pointerEvents = "none";
      if (card.setPointerCapture) card.setPointerCapture(e.pointerId);
      dragPointerIdRef.current = e.pointerId;
      document.body.classList.add(DRAG_BODY_CLASS);
      document.body.style.cursor = "grabbing";
      pointerDragRef.current = payload;
      setDragGhost({ student: payload.student, width: rect.width, x: e.clientX, y: e.clientY });

      const highlightAt = (clientX, clientY) => {
        document.querySelectorAll("[data-drop-active]").forEach((el) => el.removeAttribute("data-drop-active"));
        const under = document.elementFromPoint(clientX, clientY);
        const zone = under?.closest?.("[data-term-drop-zone]");
        zone?.setAttribute("data-drop-active", "1");
      };

      const onMove = (ev) => {
        if (ev.cancelable) ev.preventDefault();
        moveDragGhost(ev.clientX, ev.clientY);
        highlightAt(ev.clientX, ev.clientY);
      };

      const onUp = (ev) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const zone = under?.closest?.("[data-term-drop-zone]");
        const source = pointerDragRef.current;
        clearPointerDragUi();

        if (!zone || !source) return;

        const targetClassId = zone.getAttribute("data-class-id");
        const targetLevelId = zone.getAttribute("data-level-id");
        if (!targetClassId || !targetLevelId) return;

        void commitTransfer({
          studentId: source.studentId,
          targetClassId,
          targetLevelId,
          sourceSnapshot: { ...source },
        });
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [clearPointerDragUi, commitTransfer, moveDragGhost, transferBusy]
  );

  useEffect(() => () => clearPointerDragUi(), [clearPointerDragUi]);

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

  const loadLevels = useCallback(
    async (classId) => {
      const token = localStorage.getItem("token");
      if (!token || !classId) {
        setLevels([]);
        setLevelsForClassId(null);
        return;
      }

      const cached = levelsCacheRef.current[classId];
      if (cached) {
        setLevels(cloneLevels(cached));
        setLevelsForClassId(classId);
        setLoadingLevels(false);
        return;
      }

      const requestId = ++levelsRequestRef.current;
      setLevels([]);
      setLevelsForClassId(null);
      setLoadingLevels(true);

      try {
        const rows = await fetchLevelsRaw(classId);
        if (requestId !== levelsRequestRef.current) return;
        levelsCacheRef.current[classId] = cloneLevels(rows);
        setLevels(cloneLevels(rows));
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
    },
    [fetchLevelsRaw]
  );

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
      setLevels(cloneLevels(cached));
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

  const dragHandlers = {
    transferBusy,
    onPointerDragStart,
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
        subtitle="Pick a curriculum, browse classes with the arrows, and drag students between term columns."
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
                          {...dragHandlers}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3200}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {dragGhost ? (
        <DragStudentGhost
          student={dragGhost.student}
          width={dragGhost.width}
          x={dragGhost.x}
          y={dragGhost.y}
          ghostRef={dragGhostElRef}
          offsetRef={dragGhostOffsetRef}
        />
      ) : null}
    </Box>
  );
}
