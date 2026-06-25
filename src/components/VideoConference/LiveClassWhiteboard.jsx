import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GestureIcon from "@mui/icons-material/Gesture";
import AutoFixOffIcon from "@mui/icons-material/AutoFixOff";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import { useLiveClassWhiteboard } from "../../hooks/useLiveClassWhiteboard";
import {
  WHITEBOARD_DOCUMENT_STROKE_ID,
  drawPenStroke,
  findDocumentStroke,
  redrawWhiteboardCanvas,
} from "../../utils/whiteboardRender";

const COLORS = ["#1565c0", "#c62828", "#2e7d32", "#ef6c00", "#212121"];
const TEXT_SIZES = [14, 18, 24];
const DOCUMENT_SAVE_MS = 200;

function buildDocumentStroke(text, fontSize, color) {
  return {
    id: WHITEBOARD_DOCUMENT_STROKE_ID,
    tool: "document",
    text,
    fontSize,
    color,
    x: 0,
    y: 0,
  };
}

function DocumentTextLayer({ stroke, sx = {} }) {
  if (!stroke || stroke.text == null || stroke.text === "") return null;
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        p: 2,
        color: stroke.color || "#212121",
        fontSize: stroke.fontSize || 18,
        lineHeight: 1.5,
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "auto",
        bgcolor: "#ffffff",
        boxSizing: "border-box",
        zIndex: 1,
        ...sx,
      }}
    >
      {stroke.text}
    </Box>
  );
}

export default function LiveClassWhiteboard({
  liveClassId,
  token,
  socket,
  canDraw = true,
  canClear = false,
  readOnlyLabel = "View only — your teacher is annotating.",
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const documentAreaRef = useRef(null);
  const documentSaveTimerRef = useRef(null);
  const documentEditingRef = useRef(false);
  const documentSaveGenerationRef = useRef(0);
  const wasDocumentModeRef = useRef(false);
  const drawingRef = useRef(false);
  const currentPointsRef = useRef([]);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [textFontSize, setTextFontSize] = useState(18);
  const [documentText, setDocumentText] = useState("");

  const { strokes, loading, error, pushStroke, upsertStrokeLocal, clearBoard } = useLiveClassWhiteboard({
    liveClassId,
    token,
    socket,
    canDraw,
  });

  const documentStroke = useMemo(() => findDocumentStroke(strokes), [strokes]);
  const penStrokes = useMemo(
    () => strokes.filter((s) => s.tool !== "document" && s.id !== WHITEBOARD_DOCUMENT_STROKE_ID),
    [strokes]
  );
  const isDocumentMode = tool === "text" && canDraw;
  const displayDocument = documentStroke;

  const saveDocument = useCallback(
    async (text, generation) => {
      if (!canDraw) return;
      await pushStroke(buildDocumentStroke(text, textFontSize, color), { generation });
    },
    [canDraw, pushStroke, textFontSize, color]
  );

  const scheduleDocumentSave = useCallback(
    (text, generation) => {
      if (documentSaveTimerRef.current) clearTimeout(documentSaveTimerRef.current);
      documentSaveTimerRef.current = setTimeout(() => {
        void saveDocument(text, generation);
      }, DOCUMENT_SAVE_MS);
    },
    [saveDocument]
  );

  const applyDocumentLocally = useCallback(
    (text, fontSize = textFontSize, strokeColor = color) => {
      upsertStrokeLocal(buildDocumentStroke(text, fontSize, strokeColor));
    },
    [upsertStrokeLocal, textFontSize, color]
  );

  const paintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    redrawWhiteboardCanvas(canvas, penStrokes);
  }, [penStrokes]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(240, Math.floor(rect.height));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    paintCanvas();
  }, [paintCanvas]);

  useEffect(() => {
    resizeCanvas();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeCanvas) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", resizeCanvas);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  useEffect(() => {
    paintCanvas();
  }, [paintCanvas]);

  useEffect(() => {
    if (documentEditingRef.current) return;
    setDocumentText(documentStroke?.text ?? "");
  }, [documentStroke?.text, documentStroke?.id]);

  useEffect(() => {
    if (!isDocumentMode) {
      wasDocumentModeRef.current = false;
      return undefined;
    }
    if (!wasDocumentModeRef.current) {
      setDocumentText(documentStroke?.text ?? "");
      documentEditingRef.current = false;
      wasDocumentModeRef.current = true;
    }
    const frame = requestAnimationFrame(() => documentAreaRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isDocumentMode, documentStroke?.text]);

  useEffect(
    () => () => {
      if (documentSaveTimerRef.current) clearTimeout(documentSaveTimerRef.current);
    },
    []
  );

  const flushDocumentSave = useCallback(() => {
    if (documentSaveTimerRef.current) {
      clearTimeout(documentSaveTimerRef.current);
      documentSaveTimerRef.current = null;
    }
    void saveDocument(documentText, documentSaveGenerationRef.current);
  }, [documentText, saveDocument]);

  const onToolChange = (_, nextTool) => {
    if (!nextTool) return;
    if (tool === "text" && nextTool !== "text") {
      documentEditingRef.current = false;
      flushDocumentSave();
    }
    setTool(nextTool);
  };

  const onDocumentChange = (event) => {
    const text = event.target.value;
    documentEditingRef.current = true;
    documentSaveGenerationRef.current += 1;
    const generation = documentSaveGenerationRef.current;
    setDocumentText(text);
    applyDocumentLocally(text, textFontSize, color);
    scheduleDocumentSave(text, generation);
  };

  const onDocumentStyleChange = useCallback(
    (nextFontSize, nextColor) => {
      if (!isDocumentMode) return;
      documentSaveGenerationRef.current += 1;
      const generation = documentSaveGenerationRef.current;
      applyDocumentLocally(documentText, nextFontSize, nextColor);
      scheduleDocumentSave(documentText, generation);
    },
    [isDocumentMode, applyDocumentLocally, documentText, scheduleDocumentSave]
  );

  const pointerPos = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  };

  const finishStroke = async () => {
    const points = currentPointsRef.current;
    drawingRef.current = false;
    currentPointsRef.current = [];
    if (!canDraw || points.length < 2) return;
    await pushStroke({
      id: crypto.randomUUID(),
      color,
      width: lineWidth,
      tool,
      points,
    });
  };

  const onPointerDown = (event) => {
    if (!canDraw || tool === "text") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    const pos = pointerPos(event);
    if (!pos) return;
    currentPointsRef.current = [pos];
  };

  const onPointerMove = (event) => {
    if (!drawingRef.current || !canDraw || tool === "text") return;
    const pos = pointerPos(event);
    if (!pos) return;
    currentPointsRef.current.push(pos);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    redrawWhiteboardCanvas(canvas, penStrokes);
    drawPenStroke(
      ctx,
      { color, width: lineWidth, tool, points: currentPointsRef.current },
      canvas.width,
      canvas.height
    );
  };

  const onPointerUp = () => {
    if (drawingRef.current) void finishStroke();
  };

  const canvasCursor = !canDraw
    ? "default"
    : tool === "text"
      ? "text"
      : tool === "eraser"
        ? "cell"
        : "crosshair";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        bgcolor: "background.paper",
        borderRadius: 1,
        overflow: "hidden",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 1.5, py: 1, borderBottom: 1, borderColor: "divider", flexWrap: "wrap" }}
      >
        <GestureIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mr: 1 }}>
          Class whiteboard
        </Typography>
        {canDraw ? (
          <>
            <ToggleButtonGroup size="small" exclusive value={tool} onChange={onToolChange}>
              <ToggleButton value="pen">Pen</ToggleButton>
              <ToggleButton value="text">
                <TextFieldsIcon fontSize="small" sx={{ mr: 0.5 }} />
                Type
              </ToggleButton>
              <ToggleButton value="eraser">Eraser</ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={0.5}>
              {COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => {
                    setColor(c);
                    if (tool === "text") onDocumentStyleChange(textFontSize, c);
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: c,
                    cursor: "pointer",
                    border: color === c ? "2px solid #000" : "2px solid transparent",
                  }}
                />
              ))}
            </Stack>
            {tool === "text" ? (
              <ToggleButtonGroup
                size="small"
                exclusive
                value={textFontSize}
                onChange={(_, v) => {
                  if (!v) return;
                  setTextFontSize(v);
                  onDocumentStyleChange(v, color);
                }}
              >
                {TEXT_SIZES.map((s) => (
                  <ToggleButton key={s} value={s}>
                    {s}px
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <ToggleButtonGroup size="small" exclusive value={lineWidth} onChange={(_, v) => v && setLineWidth(v)}>
                {[2, 4, 8].map((w) => (
                  <ToggleButton key={w} value={w}>
                    {w}px
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            )}
            {canClear ? (
              <Tooltip title="Clear whiteboard">
                <IconButton size="small" color="error" onClick={() => void clearBoard()}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : null}
            {tool === "text" ? (
              <Typography variant="caption" color="text.secondary">
                Type on the page — Enter for a new line, Backspace to delete
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <AutoFixOffIcon sx={{ fontSize: 16 }} />
            {readOnlyLabel}
          </Typography>
        )}
      </Stack>

      {error ? (
        <Alert severity="warning" sx={{ m: 1, flexShrink: 0 }}>
          {error}
        </Alert>
      ) : null}

      <Box ref={containerRef} sx={{ flex: 1, minHeight: 200, position: "relative", bgcolor: "#f5f5f5", overflow: "hidden" }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Loading whiteboard…
          </Typography>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                touchAction: isDocumentMode ? "auto" : "none",
                cursor: canvasCursor,
                pointerEvents: isDocumentMode ? "none" : "auto",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
            {!isDocumentMode ? <DocumentTextLayer stroke={displayDocument} /> : null}
            {isDocumentMode ? (
              <Box
                component="textarea"
                ref={documentAreaRef}
                value={documentText}
                onChange={onDocumentChange}
                onBlur={() => {
                  documentEditingRef.current = false;
                  flushDocumentSave();
                }}
                placeholder="Start typing…"
                spellCheck
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  resize: "none",
                  border: 0,
                  outline: "none",
                  p: 2,
                  m: 0,
                  bgcolor: "#ffffff",
                  color,
                  fontSize: textFontSize,
                  lineHeight: 1.5,
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
                  boxSizing: "border-box",
                  zIndex: 2,
                  cursor: "text",
                }}
              />
            ) : null}
          </>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 0.75 }}>
        Draw or type here — everyone in this class sees the same board in real time.
      </Typography>
    </Box>
  );
}
