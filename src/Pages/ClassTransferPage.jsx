import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
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
import ViewListIcon from "@mui/icons-material/ViewList";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ClassTransferRegisterPanel from "../components/SchoolProfile/ClassTransferRegisterPanel";
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

function getGallerySlideSpan(container) {
  if (!container) return null;
  const slide = container.querySelector("[data-class-slide]");
  if (!slide) return null;
  const gap = parseFloat(getComputedStyle(container).columnGap || getComputedStyle(container).gap) || 0;
  return slide.offsetWidth + gap;
}

function levelsCacheKey(classId, search) {
  const q = String(search || "").trim().toLowerCase();
  return q ? `${classId}::q::${q}` : String(classId);
}

function patchLevelsCacheForClass(cacheRef, classId, patchFn) {
  if (!classId || !cacheRef.current) return;
  const id = String(classId);
  Object.keys(cacheRef.current).forEach((key) => {
    if (key === id || key.startsWith(`${id}::q::`)) {
      const current = cacheRef.current[key];
      if (!current) return;
      cacheRef.current[key] = patchFn(current);
    }
  });
}

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

function DragStudentGhost({ student, width, x, y, count, ghostRef, offsetRef }) {
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
      {count > 1 ? (
        <Chip
          size="small"
          label={`${count} students`}
          sx={{
            position: "absolute",
            top: -10,
            right: -8,
            fontWeight: 800,
            bgcolor: primaryRed,
            color: "#fff",
            height: 22,
            fontSize: "0.68rem",
            zIndex: 1,
          }}
        />
      ) : null}
      <StudentCardVisual student={student} column />
    </Box>,
    document.body
  );
}

function DraggableStudentCard({
  student,
  column,
  disabled,
  pickupDisabled,
  classId,
  levelId,
  isSelected,
  onToggleSelect,
  onPointerDragStart,
}) {
  const handlePointerDown = (e) => {
    if (disabled || pickupDisabled || e.button !== 0) return;
    if (e.target.closest("[data-select-checkbox]")) return;
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
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0.25,
      }}
    >
      <Checkbox
        data-select-checkbox
        size="small"
        checked={isSelected}
        disabled={disabled || pickupDisabled}
        onChange={() => onToggleSelect(student, classId, levelId)}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        sx={{
          p: 0.35,
          mt: column ? 0.15 : 0.5,
          pointerEvents: "auto",
          color: alpha(primaryRed, 0.45),
          "&.Mui-checked": { color: primaryRed },
        }}
      />
      <Box
        data-student-drag-card
        onPointerDown={handlePointerDown}
        sx={{
          flex: 1,
          minWidth: 0,
          ...studentCardContainerSx(column, { dragging: false }),
          ...(isSelected
            ? {
                borderColor: primaryRed,
                bgcolor: alpha(primaryRed, 0.06),
                boxShadow: `0 0 0 1px ${alpha(primaryRed, 0.2)}`,
              }
            : {}),
          cursor: disabled || pickupDisabled ? "default" : "grab",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          opacity: pickupDisabled ? 0.85 : 1,
          "&[data-drag-active='1']": studentCardContainerSx(column, { dragging: true }),
          "&:active": { cursor: disabled || pickupDisabled ? "default" : "grabbing" },
          "&:hover": disabled || pickupDisabled
            ? {}
            : {
                borderColor: alpha(primaryRed, 0.35),
                boxShadow: `0 8px 20px ${alpha(primaryRed, 0.12)}`,
              },
        }}
      >
        <StudentCardVisual student={student} column={column} />
      </Box>
    </Box>
  );
}

function StudentRoster({
  students,
  compact,
  column,
  transferBusy,
  pickupDisabled,
  classId,
  levelId,
  selectedStudentIds,
  onToggleSelect,
  onPointerDragStart,
}) {
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
          pickupDisabled={pickupDisabled}
          classId={classId}
          levelId={levelId}
          isSelected={selectedStudentIds.has(student.id)}
          onToggleSelect={onToggleSelect}
          onPointerDragStart={onPointerDragStart}
        />
      ))}
    </Stack>
  );
}

function TermDropColumn({
  level,
  classId,
  transferBusy,
  pickupDisabled,
  selectedCount,
  onBulkMoveHere,
  selectedStudentIds,
  onToggleSelect,
  onPointerDragStart,
}) {
  const count = level.student_count ?? level.students?.length ?? 0;
  const canBulkMove = selectedCount > 0 && !transferBusy;

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
        {canBulkMove ? (
          <Button
            size="small"
            variant="contained"
            onClick={() => onBulkMoveHere(classId, level.id)}
            sx={{
              mt: 0.75,
              py: 0.35,
              fontSize: "0.68rem",
              fontWeight: 800,
              borderRadius: 1.5,
              bgcolor: primaryRed,
              "&:hover": { bgcolor: primaryDark },
            }}
          >
            Move {selectedCount} here
          </Button>
        ) : null}
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
          pickupDisabled={pickupDisabled}
          classId={classId}
          levelId={level.id}
          selectedStudentIds={selectedStudentIds}
          onToggleSelect={onToggleSelect}
          onPointerDragStart={onPointerDragStart}
        />
      </Box>
    </Box>
  );
}

function TermColumnsPanel({
  levels,
  loadingLevels,
  classId,
  transferBusy,
  pickupDisabled,
  selectedCount,
  searchQuery,
  onClearSelection,
  onBulkMoveHere,
  selectedStudentIds,
  onToggleSelect,
  onPointerDragStart,
}) {
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

  const hasAnyStudents = levels.some((level) => (level.students || []).length > 0);

  return (
    <Box sx={{ mt: 2 }}>
      {selectedCount > 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          sx={{
            mb: 1.25,
            px: 1.25,
            py: 1,
            borderRadius: 2,
            bgcolor: alpha(primaryRed, 0.08),
            border: `1px solid ${alpha(primaryRed, 0.2)}`,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 700, color: primaryDark }}>
            {selectedCount} student{selectedCount === 1 ? "" : "s"} selected
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Drag selected students together, or use Move here on a term
            </Typography>
            <Button size="small" onClick={onClearSelection} sx={{ fontWeight: 700 }}>
              Clear
            </Button>
          </Stack>
        </Stack>
      ) : null}
      {!hasAnyStudents && searchQuery ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, fontStyle: "italic" }}>
          No students match &ldquo;{searchQuery}&rdquo; in this class.
        </Typography>
      ) : null}
      <Box
        sx={{
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
            pickupDisabled={pickupDisabled}
            selectedCount={selectedCount}
            onBulkMoveHere={onBulkMoveHere}
            selectedStudentIds={selectedStudentIds}
            onToggleSelect={onToggleSelect}
            onPointerDragStart={onPointerDragStart}
          />
        ))}
      </Box>
    </Box>
  );
}

function ClassGalleryCard({
  classItem,
  levels,
  loadingLevels,
  transferBusy,
  selectedCount,
  onClearSelection,
  onBulkMoveHere,
  selectedStudentIds,
  onToggleSelect,
  onPointerDragStart,
  isActiveSlide,
  isDragSession,
  classViewMode,
  onClassViewModeChange,
  classSearchInput = "",
  onClassSearchInputChange = () => {},
  classSearchQuery = "",
  curriculumId,
  registerRefreshKey,
}) {
  return (
    <Box
      data-class-card
      sx={{
        width: "100%",
        borderRadius: "22px",
        bgcolor: "#fff",
        border: isDragSession && !isActiveSlide
          ? `2px solid ${alpha(primaryRed, 0.45)}`
          : "1px solid rgba(220,38,38,0.12)",
        boxShadow: isDragSession && !isActiveSlide
          ? `0 12px 40px -8px ${alpha(primaryRed, 0.28)}`
          : "0 16px 48px -12px rgba(220,38,38,0.22)",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
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
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }} flexWrap="wrap" gap={1}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 800, color: primaryDark, letterSpacing: "0.08em", fontSize: "0.68rem" }}
            >
              {isActiveSlide
                ? classViewMode === "register"
                  ? "Term movement register"
                  : "Terms in this class"
                : "Drop onto a term"}
            </Typography>
            {isActiveSlide ? (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ flex: 1, justifyContent: "flex-end" }}>
              <Button
                size="small"
                variant={classViewMode === "transfer" ? "contained" : "outlined"}
                startIcon={<SwapHorizIcon />}
                onClick={() => onClassViewModeChange("transfer")}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  ...(classViewMode === "transfer"
                    ? { bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }
                    : { borderColor: alpha(primaryRed, 0.35), color: primaryDark }),
                }}
              >
                Transfer
              </Button>
              <Button
                size="small"
                variant={classViewMode === "register" ? "contained" : "outlined"}
                startIcon={<ViewListIcon />}
                onClick={() => onClassViewModeChange("register")}
                sx={{
                  fontWeight: 700,
                  borderRadius: 2,
                  ...(classViewMode === "register"
                    ? { bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }
                    : { borderColor: alpha(primaryRed, 0.35), color: primaryDark }),
                }}
              >
                Register
              </Button>
              <TextField
                size="small"
                placeholder="Search name, admission, placement…"
                value={classSearchInput}
                onChange={(e) => onClassSearchInputChange(e.target.value)}
                sx={{
                  minWidth: { xs: "100%", sm: 200 },
                  maxWidth: { sm: 280 },
                  flex: { sm: "1 1 200px" },
                  "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: alpha(primaryRed, 0.55) }} />
                    </InputAdornment>
                  ),
                  endAdornment: classSearchInput ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Clear search"
                        onClick={() => onClassSearchInputChange("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              {classViewMode === "transfer" && !classSearchQuery ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, width: { xs: "100%", sm: "auto" } }}>
                  Drag within this class or sideways to another class card
                </Typography>
              ) : null}
            </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Neighbouring class — release on a term column
              </Typography>
            )}
          </Stack>

          {isActiveSlide ? (
            <>
              <Box sx={{ display: classViewMode === "transfer" ? "block" : "none" }}>
                <TermColumnsPanel
                  levels={levels}
                  loadingLevels={loadingLevels}
                  classId={classItem.id}
                  transferBusy={transferBusy}
                  pickupDisabled={false}
                  searchQuery={classSearchQuery}
                  selectedCount={selectedCount}
                  onClearSelection={onClearSelection}
                  onBulkMoveHere={onBulkMoveHere}
                  selectedStudentIds={selectedStudentIds}
                  onToggleSelect={onToggleSelect}
                  onPointerDragStart={onPointerDragStart}
                />
              </Box>
              <Box sx={{ display: classViewMode === "register" ? "block" : "none" }}>
                <ClassTransferRegisterPanel
                  classId={classItem.id}
                  levels={levels}
                  curriculumId={curriculumId}
                  searchQuery={classSearchQuery}
                  refreshKey={registerRefreshKey}
                  registerVisible={classViewMode === "register"}
                />
              </Box>
            </>
          ) : (
            <TermColumnsPanel
              levels={levels}
              loadingLevels={loadingLevels}
              classId={classItem.id}
              transferBusy={transferBusy}
              pickupDisabled
              selectedCount={selectedCount}
              onClearSelection={onClearSelection}
              onBulkMoveHere={onBulkMoveHere}
              selectedStudentIds={selectedStudentIds}
              onToggleSelect={onToggleSelect}
              onPointerDragStart={onPointerDragStart}
            />
          )}
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
  const levelsCacheEpochRef = useRef({});
  const levelsRequestRef = useRef(0);
  const levelsForClassIdRef = useRef(null);
  const activeDropZoneRef = useRef(null);
  const bulkDragCardsRef = useRef([]);
  const [transferBusy, setTransferBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [selectedStudents, setSelectedStudents] = useState(() => new Map());
  const [classViewMode, setClassViewMode] = useState("transfer");
  const [registerRefreshKey, setRegisterRefreshKey] = useState(0);
  const [classSearchInput, setClassSearchInput] = useState("");
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [prefetchingLevels, setPrefetchingLevels] = useState(false);
  const [levelsPrefetchTick, setLevelsPrefetchTick] = useState(0);

  const selectedCurriculum = curricula[activeTab] || null;
  const currentClass = classes[classIndex] || null;
  const selectedStudentIds = useMemo(() => new Set(selectedStudents.keys()), [selectedStudents]);
  const selectedCount = selectedStudents.size;

  const showSnack = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStudents(new Map());
  }, []);

  const removeStudentsFromSelection = useCallback((studentIds) => {
    const ids = [...new Set((studentIds || []).filter(Boolean))];
    if (!ids.length) return;
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.delete(id));
      return next.size === prev.size ? prev : next;
    });
  }, []);

  const toggleStudentSelection = useCallback((student, classId, levelId) => {
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, { student, fromClassId: classId, fromLevelId: levelId });
      return next;
    });
  }, []);

  useEffect(() => {
    clearSelection();
    setClassViewMode("transfer");
  }, [activeTab, classIndex, clearSelection]);

  useEffect(() => {
    const timer = setTimeout(() => setClassSearchQuery(classSearchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [classSearchInput]);

  useEffect(() => {
    clearSelection();
  }, [classSearchQuery, clearSelection]);

  const fetchLevelsRaw = useCallback(async (classId, search = "") => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    const q = String(search || "").trim();
    if (q) params.set("search", q);
    const query = params.toString();
    const res = await fetch(
      `/api/class-transfer/classes/${encodeURIComponent(classId)}/levels${query ? `?${query}` : ""}`,
      { headers: authHeaders(token) }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || "Could not load terms.");
    return Array.isArray(data.data?.levels) ? data.data.levels : [];
  }, []);

  const beginCacheFetch = useCallback((classId) => {
    return levelsCacheEpochRef.current[classId] || 0;
  }, []);

  const shouldApplyCacheFetch = useCallback((classId, epoch) => {
    return (levelsCacheEpochRef.current[classId] || 0) === epoch;
  }, []);

  const bumpCacheEpoch = useCallback((...classIds) => {
    classIds.forEach((classId) => {
      if (!classId) return;
      const id = String(classId);
      const bumpKey = (key) => {
        levelsCacheEpochRef.current[key] = (levelsCacheEpochRef.current[key] || 0) + 1;
      };
      bumpKey(id);
      Object.keys(levelsCacheEpochRef.current).forEach((key) => {
        if (key.startsWith(`${id}::q::`)) bumpKey(key);
      });
      Object.keys(levelsCacheRef.current).forEach((key) => {
        if (key.startsWith(`${id}::q::`)) delete levelsCacheRef.current[key];
      });
    });
  }, []);

  const writeLevelsCache = useCallback(
    (classId, rows, epoch) => {
      if (epoch != null && !shouldApplyCacheFetch(classId, epoch)) {
        return false;
      }
      levelsCacheRef.current[classId] = cloneLevels(rows);
      setLevelsPrefetchTick((t) => t + 1);
      return true;
    },
    [shouldApplyCacheFetch]
  );

  const ensureLevelsCached = useCallback(
    async (classId) => {
      const cacheKey = levelsCacheKey(classId, "");
      if (!classId || levelsCacheRef.current[cacheKey]) return;
      const epoch = beginCacheFetch(cacheKey);
      const rows = await fetchLevelsRaw(classId, "");
      writeLevelsCache(cacheKey, rows, epoch);
    },
    [beginCacheFetch, fetchLevelsRaw, writeLevelsCache]
  );

  const getLevelsForClass = useCallback((classId) => {
    void levelsPrefetchTick;
    const baseKey = levelsCacheKey(classId, "");
    return levelsCacheRef.current[baseKey] || [];
  }, [levelsPrefetchTick]);

  const syncLevelsState = useCallback(
    (classId, search = "") => {
      const cacheKey = levelsCacheKey(classId, search);
      const cached = levelsCacheRef.current[cacheKey] ?? levelsCacheRef.current[classId];
      if (cached) {
        setLevels(cloneLevels(cached));
        setLevelsForClassId(classId);
      }
    },
    []
  );

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
      bumpCacheEpoch(fromClassId, toClassId);

      const removeFromClass = (classId, levelId, studentId) => {
        patchLevelsCacheForClass(levelsCacheRef, classId, (levels) =>
          levels.map((level) => {
            if (String(level.id) !== String(levelId)) return level;
            const students = (level.students || []).filter((s) => String(s.id) !== String(studentId));
            return { ...level, students, student_count: students.length };
          })
        );
      };

      const addToClass = (classId, levelId, stud) => {
        patchLevelsCacheForClass(levelsCacheRef, classId, (levels) =>
          levels.map((level) => {
            if (String(level.id) !== String(levelId)) return level;
            if ((level.students || []).some((s) => String(s.id) === String(stud.id))) return level;
            const students = [...(level.students || []), stud];
            return { ...level, students, student_count: students.length };
          })
        );
      };

      removeFromClass(fromClassId, fromLevelId, student.id);
      addToClass(toClassId, toLevelId, student);
      setLevelsPrefetchTick((t) => t + 1);

      if (levelsForClassId === fromClassId || levelsForClassId === toClassId) {
        syncLevelsState(levelsForClassId, classSearchQuery);
      }
      bumpClassCounts(fromClassId, toClassId);
    },
    [bumpCacheEpoch, bumpClassCounts, classSearchQuery, levelsForClassId, syncLevelsState]
  );

  const clearPointerDragUi = useCallback(() => {
    document.body.classList.remove(DRAG_BODY_CLASS);
    document.querySelectorAll("[data-drop-active]").forEach((el) => el.removeAttribute("data-drop-active"));
    bulkDragCardsRef.current.forEach((card) => {
      card.removeAttribute("data-drag-active");
      card.style.pointerEvents = "";
    });
    bulkDragCardsRef.current = [];
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

      if (
        String(source.fromClassId) === String(targetClassId) &&
        String(source.fromLevelId) === String(targetLevelId)
      ) {
        return;
      }

      const token = localStorage.getItem("token");
      setTransferBusy(true);

      try {
        await ensureLevelsCached(source.fromClassId);
        await ensureLevelsCached(targetClassId);
      } catch (e) {
        setTransferBusy(false);
        showSnack(e.message || "Could not load class terms.", "error");
        return;
      }

      const snapshot = {
        fromClassId: source.fromClassId,
        fromLevelId: source.fromLevelId,
        toClassId: targetClassId,
        toLevelId: targetLevelId,
        student: source.student,
        fromLevels: cloneLevels(levelsCacheRef.current[source.fromClassId]),
        toLevels:
          String(source.fromClassId) === String(targetClassId)
            ? null
            : cloneLevels(levelsCacheRef.current[targetClassId]),
        classesSnapshot: classes.map((c) => ({ ...c })),
      };

      applyLocalMove({
        student: source.student,
        fromClassId: source.fromClassId,
        fromLevelId: source.fromLevelId,
        toClassId: targetClassId,
        toLevelId: targetLevelId,
      });
      removeStudentsFromSelection([studentId]);

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
            students: (level.students || []).map((s) =>
              String(s.id) === String(updated.id) ? { ...s, ...updated } : s
            ),
          }));
        }

        setLevelsPrefetchTick((t) => t + 1);
        if (levelsForClassId === snapshot.fromClassId || levelsForClassId === targetClassId) {
          syncLevelsState(levelsForClassId, classSearchQuery);
        }

        showSnack(data.message || "Student moved successfully.");
        setRegisterRefreshKey((k) => k + 1);
      } catch (e) {
        bumpCacheEpoch(snapshot.fromClassId, snapshot.toClassId);
        levelsCacheRef.current[snapshot.fromClassId] = snapshot.fromLevels;
        if (snapshot.toLevels) levelsCacheRef.current[snapshot.toClassId] = snapshot.toLevels;
        setClasses(snapshot.classesSnapshot);
        setLevelsPrefetchTick((t) => t + 1);
        if (levelsForClassId) syncLevelsState(levelsForClassId, classSearchQuery);
        showSnack(e.message || "Could not move student.", "error");
      } finally {
        setTransferBusy(false);
      }
    },
    [
      applyLocalMove,
      bumpCacheEpoch,
      classSearchQuery,
      classes,
      ensureLevelsCached,
      levelsForClassId,
      removeStudentsFromSelection,
      showSnack,
      syncLevelsState,
    ]
  );

  const commitBulkTransfer = useCallback(
    async (targetClassId, targetLevelId) => {
      const items = [...selectedStudents.values()].filter(
        (item) =>
          !(
            String(item.fromClassId) === String(targetClassId) &&
            String(item.fromLevelId) === String(targetLevelId)
          )
      );
      if (!items.length) {
        showSnack("Selected students are already in that term.", "info");
        removeStudentsFromSelection([...selectedStudents.keys()]);
        return;
      }

      const movedIds = items.map((item) => item.student.id);
      const token = localStorage.getItem("token");
      setTransferBusy(true);

      try {
        const classIds = new Set(items.map((i) => i.fromClassId));
        classIds.add(targetClassId);
        await Promise.all([...classIds].map((id) => ensureLevelsCached(id)));
      } catch (e) {
        setTransferBusy(false);
        showSnack(e.message || "Could not load class terms.", "error");
        return;
      }

      const affectedClassIds = new Set(items.flatMap((item) => [item.fromClassId, targetClassId]));
      const levelsSnapshots = {};
      affectedClassIds.forEach((id) => {
        if (levelsCacheRef.current[id]) levelsSnapshots[id] = cloneLevels(levelsCacheRef.current[id]);
      });
      const classesSnapshot = classes.map((c) => ({ ...c }));

      items.forEach((item) => {
        applyLocalMove({
          student: item.student,
          fromClassId: item.fromClassId,
          fromLevelId: item.fromLevelId,
          toClassId: targetClassId,
          toLevelId: targetLevelId,
        });
      });
      removeStudentsFromSelection(movedIds);

      try {
        const res = await fetch("/api/class-transfer/students/move-bulk", {
          method: "POST",
          headers: { ...authHeaders(token), "Content-Type": "application/json" },
          body: JSON.stringify({
            student_ids: items.map((item) => item.student.id),
            curriculum_class_id: targetClassId,
            curriculum_class_level_id: targetLevelId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not move students.");

        const results = Array.isArray(data.data?.results) ? data.data.results : [];
        results.forEach((row) => {
          if (!row.student || !levelsCacheRef.current[targetClassId]) return;
          levelsCacheRef.current[targetClassId] = levelsCacheRef.current[targetClassId].map((level) => ({
            ...level,
            students: (level.students || []).map((s) => (s.id === row.student.id ? { ...s, ...row.student } : s)),
          }));
        });
        if (levelsForClassId === targetClassId) syncLevelsState(targetClassId, classSearchQuery);

        showSnack(data.message || `Moved ${items.length} student(s).`);
        setRegisterRefreshKey((k) => k + 1);
      } catch (e) {
        Object.entries(levelsSnapshots).forEach(([id, snapshot]) => {
          levelsCacheRef.current[id] = snapshot;
        });
        setClasses(classesSnapshot);
        if (levelsForClassId) syncLevelsState(levelsForClassId, classSearchQuery);
        showSnack(e.message || "Could not move students.", "error");
      } finally {
        setTransferBusy(false);
      }
    },
    [
      applyLocalMove,
      classSearchQuery,
      classes,
      ensureLevelsCached,
      levelsForClassId,
      removeStudentsFromSelection,
      selectedStudents,
      showSnack,
      syncLevelsState,
    ]
  );

  const onBulkMoveHere = useCallback(
    (targetClassId, targetLevelId) => {
      if (!targetClassId || !targetLevelId || transferBusy || !selectedCount) return;
      void commitBulkTransfer(targetClassId, targetLevelId);
    },
    [commitBulkTransfer, selectedCount, transferBusy]
  );

  const maybeAutoScrollGallery = useCallback((clientX) => {
    const container = scrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const margin = 88;
    const speed = 22;
    if (clientX < rect.left + margin) {
      container.scrollLeft = Math.max(0, container.scrollLeft - speed);
    } else if (clientX > rect.right - margin) {
      container.scrollLeft = Math.min(
        container.scrollWidth - container.clientWidth,
        container.scrollLeft + speed
      );
    }
  }, []);

  const onPointerDragStart = useCallback(
    (e, payload) => {
      if (transferBusy || pointerDragRef.current) return;

      void Promise.all(classes.map((c) => ensureLevelsCached(c.id)));

      const bulkDrag = selectedStudentIds.has(payload.studentId) && selectedCount > 1;
      const dragCount = bulkDrag ? selectedCount : 1;

      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      dragGhostOffsetRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };

      bulkDragCardsRef.current = [];
      if (bulkDrag) {
        selectedStudentIds.forEach((id) => {
          const wrapper = document.querySelector(`[data-student-id="${CSS.escape(String(id))}"]`);
          const dragCard = wrapper?.querySelector("[data-student-drag-card]");
          if (dragCard) {
            dragCard.setAttribute("data-drag-active", "1");
            dragCard.style.pointerEvents = "none";
            bulkDragCardsRef.current.push(dragCard);
          }
        });
      } else {
        activeCardRef.current = card;
        card.setAttribute("data-drag-active", "1");
        card.style.pointerEvents = "none";
        if (card.setPointerCapture) card.setPointerCapture(e.pointerId);
        dragPointerIdRef.current = e.pointerId;
      }

      document.body.classList.add(DRAG_BODY_CLASS);
      document.body.style.cursor = "grabbing";
      pointerDragRef.current = { ...payload, bulk: bulkDrag };
      setDragGhost({
        student: payload.student,
        width: rect.width,
        x: e.clientX,
        y: e.clientY,
        count: dragCount,
      });

      const highlightAt = (clientX, clientY) => {
        document.querySelectorAll("[data-drop-active]").forEach((el) => el.removeAttribute("data-drop-active"));
        const under = document.elementFromPoint(clientX, clientY);
        const zone = under?.closest?.("[data-term-drop-zone]") || null;
        activeDropZoneRef.current = zone;
        zone?.setAttribute("data-drop-active", "1");
      };

      const onMove = (ev) => {
        if (ev.cancelable) ev.preventDefault();
        moveDragGhost(ev.clientX, ev.clientY);
        maybeAutoScrollGallery(ev.clientX);
        highlightAt(ev.clientX, ev.clientY);
      };

      const onUp = (ev) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);

        const under = document.elementFromPoint(ev.clientX, ev.clientY);
        const zoneFromPoint = under?.closest?.("[data-term-drop-zone]") || null;
        const zoneFromHighlight =
          document.querySelector("[data-term-drop-zone][data-drop-active='1']") || activeDropZoneRef.current;
        const zone = zoneFromPoint || zoneFromHighlight;
        const source = pointerDragRef.current;

        clearPointerDragUi();
        activeDropZoneRef.current = null;

        if (!zone || !source) return;

        const targetClassId = zone.getAttribute("data-class-id");
        const targetLevelId = zone.getAttribute("data-level-id");
        if (!targetClassId || !targetLevelId) return;

        if (source.bulk) {
          void commitBulkTransfer(targetClassId, targetLevelId);
          return;
        }

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
    [
      classes,
      clearPointerDragUi,
      commitBulkTransfer,
      commitTransfer,
      ensureLevelsCached,
      maybeAutoScrollGallery,
      moveDragGhost,
      selectedCount,
      selectedStudentIds,
      transferBusy,
    ]
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
      levelsCacheEpochRef.current = {};
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
    async (classId, search = "") => {
      const token = localStorage.getItem("token");
      if (!token || !classId) {
        setLevels([]);
        setLevelsForClassId(null);
        return;
      }

      const cacheKey = levelsCacheKey(classId, search);
      const cached = levelsCacheRef.current[cacheKey];
      if (cached) {
        setLevels(cloneLevels(cached));
        levelsForClassIdRef.current = String(classId);
        setLevelsForClassId(classId);
        setLoadingLevels(false);
        return;
      }

      const requestId = ++levelsRequestRef.current;
      const epoch = beginCacheFetch(cacheKey);
      if (levelsForClassIdRef.current !== String(classId)) {
        setLevels([]);
        levelsForClassIdRef.current = null;
        setLevelsForClassId(null);
      }
      setLoadingLevels(true);

      try {
        const rows = await fetchLevelsRaw(classId, search);
        if (requestId !== levelsRequestRef.current) return;
        const applied = writeLevelsCache(cacheKey, rows, epoch);
        const resolvedRows = applied
          ? levelsCacheRef.current[cacheKey]
          : levelsCacheRef.current[cacheKey] || rows;
        setLevels(cloneLevels(resolvedRows));
        levelsForClassIdRef.current = String(classId);
        setLevelsForClassId(classId);
      } catch (e) {
        if (requestId !== levelsRequestRef.current) return;
        setError(e.message || "Could not load terms.");
        setLevels([]);
        levelsForClassIdRef.current = String(classId);
        setLevelsForClassId(classId);
      } finally {
        if (requestId === levelsRequestRef.current) {
          setLoadingLevels(false);
        }
      }
    },
    [beginCacheFetch, fetchLevelsRaw, writeLevelsCache]
  );

  useEffect(() => {
    void loadCurricula();
  }, [loadCurricula]);

  useEffect(() => {
    if (selectedCurriculum?.id) {
      void loadClasses(selectedCurriculum.id);
      setClassSearchInput("");
      setClassSearchQuery("");
    } else {
      setClasses([]);
      setCurriculumMeta(null);
      setClassIndex(0);
    }
  }, [selectedCurriculum?.id, loadClasses]);

  useEffect(() => {
    if (currentClass?.id) {
      void loadLevels(currentClass.id, classSearchQuery);
    } else {
      setLevels([]);
      setLevelsForClassId(null);
    }
  }, [currentClass?.id, classSearchQuery, loadLevels]);

  useEffect(() => {
    if (!classes.length) return undefined;
    let cancelled = false;
    const prefetch = async () => {
      setPrefetchingLevels(true);
      try {
        for (const classItem of classes) {
          if (cancelled) return;
          if (levelsCacheRef.current[levelsCacheKey(classItem.id, "")]) continue;
          try {
            const epoch = beginCacheFetch(levelsCacheKey(classItem.id, ""));
            const rows = await fetchLevelsRaw(classItem.id, "");
            if (!cancelled) {
              writeLevelsCache(levelsCacheKey(classItem.id, ""), rows, epoch);
            }
          } catch {
            /* skip class on prefetch failure */
          }
        }
      } finally {
        if (!cancelled) setPrefetchingLevels(false);
      }
    };
    void prefetch();
    return () => {
      cancelled = true;
    };
  }, [beginCacheFetch, classes, fetchLevelsRaw, writeLevelsCache]);

  const isTransferSession = Boolean(dragGhost || selectedCount > 0);

  const applyClassLevelState = useCallback(
    (classId) => {
      if (!classId) {
        setLevels([]);
        setLevelsForClassId(null);
        return;
      }
      const cacheKey = levelsCacheKey(classId, classSearchQuery);
      const cached = levelsCacheRef.current[cacheKey];
      if (cached) {
        setLevels(cloneLevels(cached));
        setLevelsForClassId(classId);
        setLoadingLevels(false);
        return;
      }
      void loadLevels(classId, classSearchQuery);
    },
    [classSearchQuery, loadLevels]
  );

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
      const span = getGallerySlideSpan(container) || container.clientWidth;
      container.scrollTo({ left: index * span, behavior: "smooth" });
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
    const span = getGallerySlideSpan(container) || container.clientWidth;
    const index = Math.round(container.scrollLeft / span);
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
    if (currentClass?.id) void loadLevels(currentClass.id, classSearchQuery);
  };

  const transferHandlers = {
    transferBusy,
    onPointerDragStart,
    selectedCount,
    onClearSelection: clearSelection,
    onBulkMoveHere,
    selectedStudentIds,
    onToggleSelect: toggleStudentSelection,
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
        subtitle="Pick a curriculum, browse classes in the carousel, and drag students between term columns — including neighbouring class cards."
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
                    gap: 2,
                    overflowX: "auto",
                    overflowY: "visible",
                    scrollSnapType: dragGhost ? "none" : "x mandatory",
                    scrollBehavior: "smooth",
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {classes.map((classItem, idx) => {
                    const isActiveSlide = idx === classIndex;
                    const cachedLevels = getLevelsForClass(classItem.id);
                    const levelsReady = levelsForClassId === classItem.id;
                    const slideLevels = isActiveSlide && levelsReady ? levels : cachedLevels;
                    const slideLoading = isActiveSlide
                      ? loadingLevels
                      : prefetchingLevels && !cachedLevels.length;
                    return (
                      <Box
                        key={classItem.id}
                        data-class-slide
                        sx={{
                          flex: "0 0 86%",
                          scrollSnapAlign: "start",
                          scrollSnapStop: "always",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          px: { xs: 1.5, md: 2 },
                          py: { xs: 2.5, md: 3 },
                          boxSizing: "border-box",
                          opacity: isActiveSlide ? 1 : isTransferSession ? 0.96 : 0.52,
                          transform: isActiveSlide ? "none" : "scale(0.985)",
                          transition: "opacity 0.2s, transform 0.2s",
                          pointerEvents: "auto",
                        }}
                      >
                        <ClassGalleryCard
                          classItem={classItem}
                          levels={slideLevels}
                          loadingLevels={slideLoading}
                          isActiveSlide={isActiveSlide}
                          isDragSession={isTransferSession}
                          classViewMode={isActiveSlide ? classViewMode : "transfer"}
                          onClassViewModeChange={setClassViewMode}
                          curriculumId={selectedCurriculum?.id}
                          registerRefreshKey={registerRefreshKey}
                          classSearchInput={classSearchInput}
                          onClassSearchInputChange={setClassSearchInput}
                          classSearchQuery={classSearchQuery}
                          {...transferHandlers}
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
          count={dragGhost.count || 1}
          ghostRef={dragGhostElRef}
          offsetRef={dragGhostOffsetRef}
        />
      ) : null}
    </Box>
  );
}
