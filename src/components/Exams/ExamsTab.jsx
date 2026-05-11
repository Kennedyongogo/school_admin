import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  UploadFile as UploadFileIcon,
  Visibility as VisibilityIcon,
  PublishedWithChanges as PublishedWithChangesIcon,
  FactCheck as FactCheckIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const accent = "#DC2626";
const accentDark = "#B91C1C";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const emptyQuestion = (index = 1) => ({
  key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  question_text: "",
  question_type: "short_text",
  required: false,
  marks: 0,
  options_text: "",
  correct_answer: "",
  order_number: index,
  canvas_x: 40,
  canvas_y: 120 + (index - 1) * 34,
  canvas_w: 520,
  canvas_h: 26,
  canvas_page: 0,
  diagram_data: "",
  diagram_hotspots: [{ id: `hs-${Date.now()}-1`, x: 50, y: 50, prompt: "", correct_answer: "" }],
  diagram_canvas_x: 40,
  diagram_canvas_y: 220 + (index - 1) * 20,
  diagram_canvas_w: 260,
  diagram_canvas_h: 180,
  diagram_canvas_page: 0,
});

const renderTemplateText = (el, schoolProfile) => {
  if (el.type === "school_name") return schoolProfile?.name || el.label || "School name";
  if (el.type === "website") return schoolProfile?.website || el.label || "Website";
  if (el.type === "phone") return schoolProfile?.phone || el.label || "Phone";
  if (el.type === "address") {
    const addr = [schoolProfile?.address, schoolProfile?.city, schoolProfile?.state, schoolProfile?.postal_code, schoolProfile?.country]
      .filter(Boolean)
      .join(", ");
    return addr || el.label || "Address";
  }
  return el.label || "";
};

const defaultExamLayout = () => ({
  name: { x: 40, y: 80, w: 300, h: 24 },
  instructions: { x: 40, y: 115, w: 520, h: 30 },
  duration: { x: 420, y: 80, w: 140, h: 24 },
  passing_marks: { x: 40, y: 160, w: 180, h: 24 },
  total_marks: { x: 230, y: 160, w: 180, h: 24 },
});

function DiagramDrawInput({ value, hotspots = [], onSave, onArrowPlaced }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const textItemsRef = useRef([]);
  const textBaseImageRef = useRef(null);
  const textDragRef = useRef(null);
  const arrowItemsRef = useRef([]);
  const arrowBaseImageRef = useRef(null);
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState("pen"); // pen | eraser | arrow | line | text
  const [lineStyle, setLineStyle] = useState("solid"); // solid | dashed | dotted
  const [textInput, setTextInput] = useState("");
  const [textSize, setTextSize] = useState(18);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);
  const arrowStartRef = useRef(null);

  const drawTextItems = (ctx) => {
    textItemsRef.current.forEach((item) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.setLineDash([]);
      ctx.fillStyle = "#111827";
      ctx.font = `${Math.max(10, Number(item.size) || 12)}px Arial`;
      ctx.textBaseline = "top";
      ctx.fillText(item.text, item.x, item.y);
    });
  };

  const redrawWithTextItems = (ctx) => {
    if (textBaseImageRef.current) {
      ctx.putImageData(textBaseImageRef.current, 0, 0);
    } else {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    drawTextItems(ctx);
    drawHotspotPromptLabels(ctx);
  };

  const pickTextItemAt = (ctx, x, y) => {
    for (let i = textItemsRef.current.length - 1; i >= 0; i -= 1) {
      const item = textItemsRef.current[i];
      ctx.font = `${Math.max(10, Number(item.size) || 12)}px Arial`;
      const width = ctx.measureText(item.text).width;
      const height = Math.max(10, Number(item.size) || 12);
      if (x >= item.x && x <= item.x + width && y >= item.y && y <= item.y + height) {
        return { index: i, item };
      }
    }
    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (value && String(value).startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
    }
    arrowItemsRef.current = [];
    arrowBaseImageRef.current = null;
    textItemsRef.current = [];
    textBaseImageRef.current = null;
    textDragRef.current = null;
  }, [value]);

  useEffect(() => {
    if (!Array.isArray(hotspots)) return;
    const hotspotIds = new Set(hotspots.map((h) => String(h?.id || "")));
    const filtered = arrowItemsRef.current.filter((item) => hotspotIds.has(String(item.hotspotId || "")));
    if (filtered.length !== arrowItemsRef.current.length) {
      arrowItemsRef.current = filtered;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!arrowBaseImageRef.current && !arrowItemsRef.current.length && !textItemsRef.current.length) return;
    const ctx = canvas.getContext("2d");
    redrawWithArrowItems(ctx);
  }, [hotspots]);

  const getPos = (event, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * canvas.height) / rect.height;
    return { x, y };
  };

  const startDraw = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(event, canvas);
    if (tool === "text") {
      if (!textBaseImageRef.current) {
        textBaseImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      const hit = pickTextItemAt(ctx, x, y);
      if (hit) {
        textDragRef.current = { index: hit.index, dx: x - hit.item.x, dy: y - hit.item.y };
        drawingRef.current = true;
        return;
      }
      const content = String(textInput || "").trim();
      if (!content) return;
      const item = { text: content, x, y, size: Math.max(10, Number(textSize) || 12) };
      textItemsRef.current = [...textItemsRef.current, item];
      textDragRef.current = { index: textItemsRef.current.length - 1, dx: 0, dy: 0 };
      drawingRef.current = true;
      redrawWithTextItems(ctx);
      return;
    }
    drawingRef.current = true;
    if (tool === "arrow" || tool === "line") {
      arrowStartRef.current = { x, y };
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getPos(event, canvas);
    if (!drawingRef.current) return;
    if (tool === "text" && textDragRef.current) {
      const drag = textDragRef.current;
      const idx = drag.index;
      const nextX = Math.max(0, Math.min(canvas.width - 5, x - drag.dx));
      const nextY = Math.max(0, Math.min(canvas.height - 5, y - drag.dy));
      textItemsRef.current = textItemsRef.current.map((item, i) => (i === idx ? { ...item, x: nextX, y: nextY } : item));
      redrawWithTextItems(ctx);
      return;
    }
    if (!["pen", "eraser"].includes(tool)) return;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    if (lineStyle === "dashed") ctx.setLineDash([10, 6]);
    else if (lineStyle === "dotted") ctx.setLineDash([2, 6]);
    else ctx.setLineDash([]);
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = "#111827";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const drawArrow = (ctx, x1, y1, x2, y2, size = 10) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const drawHotspotPromptLabels = (ctx) => {
    if (!Array.isArray(hotspots) || hotspots.length === 0) return;
    hotspots.forEach((hs, idx) => {
      const label = String(hs?.prompt || "").trim();
      if (!label) return;
      const xPct = Number.isFinite(Number(hs?.x)) ? Number(hs.x) : 50;
      const yPct = Number.isFinite(Number(hs?.y)) ? Number(hs.y) : 50;
      const x = (xPct / 100) * ctx.canvas.width;
      const y = (yPct / 100) * ctx.canvas.height;
      const caption = `${idx + 1}. ${label}`;
      ctx.save();
      ctx.font = "12px Arial";
      const textW = ctx.measureText(caption).width;
      const boxX = Math.max(4, Math.min(ctx.canvas.width - textW - 14, x + 8));
      const boxY = Math.max(4, Math.min(ctx.canvas.height - 18, y + 6));
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillRect(boxX - 4, boxY - 2, textW + 8, 16);
      ctx.fillStyle = "#111827";
      ctx.fillText(caption, boxX, boxY + 10);
      ctx.restore();
    });
  };

  const drawArrowItems = (ctx) => {
    arrowItemsRef.current.forEach((item) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = Math.max(1, Number(item.brushSize) || 2);
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#111827";
      if (item.lineStyle === "dashed") ctx.setLineDash([10, 6]);
      else if (item.lineStyle === "dotted") ctx.setLineDash([2, 6]);
      else ctx.setLineDash([]);
      drawArrow(ctx, item.startX, item.startY, item.endX, item.endY, Math.max(8, (Number(item.brushSize) || 2) * 3));
      ctx.setLineDash([]);
    });
  };

  const redrawWithArrowItems = (ctx) => {
    if (arrowBaseImageRef.current) ctx.putImageData(arrowBaseImageRef.current, 0, 0);
    else ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawArrowItems(ctx);
    // Keep text overlays visible when arrows are redrawn.
    drawTextItems(ctx);
    drawHotspotPromptLabels(ctx);
  };

  const drawStraightLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const endDraw = (event) => {
    const canvas = canvasRef.current;
    if ((tool === "arrow" || tool === "line") && drawingRef.current && canvas && arrowStartRef.current && event) {
      const ctx = canvas.getContext("2d");
      const { x, y } = getPos(event, canvas);
      const start = arrowStartRef.current;
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = Math.max(1, brushSize);
      ctx.strokeStyle = "#111827";
      ctx.fillStyle = "#111827";
      if (lineStyle === "dashed") ctx.setLineDash([10, 6]);
      else if (lineStyle === "dotted") ctx.setLineDash([2, 6]);
      else ctx.setLineDash([]);
      if (tool === "arrow") {
        if (!arrowBaseImageRef.current) {
          arrowBaseImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        const hotspotId = `hs-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
        arrowItemsRef.current = [
          ...arrowItemsRef.current,
          {
            hotspotId,
            startX: start.x,
            startY: start.y,
            endX: x,
            endY: y,
            brushSize,
            lineStyle,
          },
        ];
        redrawWithArrowItems(ctx);
        if (typeof onArrowPlaced === "function") {
          const xPct = Number(((x / canvas.width) * 100).toFixed(2));
          const yPct = Number(((y / canvas.height) * 100).toFixed(2));
          onArrowPlaced({ id: hotspotId, x: xPct, y: yPct });
        }
      }
      if (tool === "line") drawStraightLine(ctx, start.x, start.y, x, y);
      ctx.setLineDash([]);
    }
    drawingRef.current = false;
    arrowStartRef.current = null;
    textDragRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    arrowItemsRef.current = [];
    arrowBaseImageRef.current = null;
    textItemsRef.current = [];
    textBaseImageRef.current = null;
    textDragRef.current = null;
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const outCtx = out.getContext("2d");
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, out.width, out.height);
    outCtx.drawImage(canvas, 0, 0);
    onSave(out.toDataURL("image/png"));
  };

  const generateDiagramWithAi = async () => {
    const prompt = String(aiPrompt || "").trim();
    if (!prompt) {
      await Swal.fire({ icon: "error", title: "Prompt required", text: "Write a prompt before generating." });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      await Swal.fire({ icon: "error", title: "Session expired", text: "Please sign in again." });
      return;
    }

    setGeneratingAi(true);
    try {
      const res = await fetch("/api/exams/ai/diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.data?.dataUrl) {
        const modelsTried = Array.isArray(data?.modelsTried) && data.modelsTried.length ? ` Models tried: ${data.modelsTried.join(", ")}` : "";
        throw new Error(`${data?.message || "Could not generate image."}${modelsTried}`);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = data.data.dataUrl;
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const drawW = Math.max(1, Math.round(img.width * scale));
      const drawH = Math.max(1, Math.round(img.height * scale));
      const drawX = Math.round((canvas.width - drawW) / 2);
      const drawY = Math.round((canvas.height - drawH) / 2);
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Generate failed", text: e.message || "Could not generate diagram." });
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Draw diagram
      </Typography>
      <Box
        sx={{
          width: "100%",
          position: "relative",
          border: "1px solid #d1d5db",
          borderRadius: 1,
          backgroundColor: "#fff",
          backgroundImage:
            "linear-gradient(to right, rgba(156,163,175,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(156,163,175,0.35) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          overflow: "hidden",
        }}
      >
        <Box
          component="canvas"
          ref={canvasRef}
          width={1200}
          height={520}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          sx={{
            width: "100%",
            height: "auto",
            display: "block",
            cursor: "crosshair",
            touchAction: "none",
          }}
        />
      </Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
        <TextField
          size="small"
          label="Generate diagram prompt"
          placeholder="e.g. Labelled human heart diagram for grade 8"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          sx={{ minWidth: 280, flex: 1 }}
        />
        <Button size="small" variant="contained" onClick={() => void generateDiagramWithAi()} disabled={generatingAi}>
          {generatingAi ? "Generating..." : "Generate image"}
        </Button>
        <Select size="small" value={tool} onChange={(e) => setTool(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="pen">Pen</MenuItem>
          <MenuItem value="eraser">Eraser</MenuItem>
          <MenuItem value="arrow">Arrow</MenuItem>
          <MenuItem value="line">Straight line</MenuItem>
          <MenuItem value="text">Text</MenuItem>
        </Select>
        <Select size="small" value={lineStyle} onChange={(e) => setLineStyle(e.target.value)} sx={{ minWidth: 110 }}>
          <MenuItem value="solid">Solid</MenuItem>
          <MenuItem value="dashed">Dashed</MenuItem>
          <MenuItem value="dotted">Dotted</MenuItem>
        </Select>
        <TextField
          size="small"
          label="Brush"
          type="number"
          value={brushSize}
          onChange={(e) => setBrushSize(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
          sx={{ width: 90 }}
        />
        {tool === "text" ? (
          <>
            <TextField
              size="small"
              label="Text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size="small"
              label="Size"
              type="number"
              value={textSize}
              onChange={(e) => setTextSize(Math.max(10, Math.min(72, Number(e.target.value) || 10)))}
              sx={{ width: 90 }}
            />
          </>
        ) : null}
        <Button size="small" variant="outlined" onClick={clearCanvas}>
          Clear
        </Button>
        <Button size="small" variant="contained" onClick={saveCanvas}>
          Save drawing to question
        </Button>
      </Stack>
    </Stack>
  );
}

export default function ExamsTab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [mode, setMode] = useState("list");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [duration, setDuration] = useState(60);
  const [instructionLines, setInstructionLines] = useState([""]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [passingMarks, setPassingMarks] = useState(0);
  const [requiresWebcam, setRequiresWebcam] = useState(false);
  const [preventTabSwitch, setPreventTabSwitch] = useState(true);
  const [allowRetake, setAllowRetake] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [status, setStatus] = useState("draft");
  const [examLayout, setExamLayout] = useState(defaultExamLayout);
  const [questions, setQuestions] = useState([emptyQuestion(1)]);
  const [editingId, setEditingId] = useState(null);
  const [currentTemplatePage, setCurrentTemplatePage] = useState(0);
  const [templatePagesForExam, setTemplatePagesForExam] = useState([{ id: "page-1", elements: [] }]);
  const [saving, setSaving] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [statusEditRow, setStatusEditRow] = useState(null);
  const [statusEditValue, setStatusEditValue] = useState("draft");
  const [statusSaving, setStatusSaving] = useState(false);
  const [markingRow, setMarkingRow] = useState(null);
  const [markingLoading, setMarkingLoading] = useState(false);
  const [markingError, setMarkingError] = useState("");
  const [markingSubmissions, setMarkingSubmissions] = useState([]);
  const [markInputs, setMarkInputs] = useState({});
  const [markSavingId, setMarkSavingId] = useState("");
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [simulateRow, setSimulateRow] = useState(null);
  const [simulateAnswers, setSimulateAnswers] = useState({});
  const [generatingFromDoc, setGeneratingFromDoc] = useState(false);
  const [questionGenCount, setQuestionGenCount] = useState(10);
  const [ocrRawText, setOcrRawText] = useState("");
  const [ocrParsedBlocks, setOcrParsedBlocks] = useState([]);
  const questionDocInputRef = useRef(null);
  const questionCanvasRef = useRef(null);
  const questionDragRef = useRef(null);
  const questionResizeRef = useRef(null);
  const diagramDragRef = useRef(null);
  const diagramResizeRef = useRef(null);
  const examMetaDragRef = useRef(null);
  const previewPagesContainerRef = useRef(null);

  const templateMap = useMemo(() => {
    const map = new Map();
    templates.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [templates]);
  const selectedTemplate = useMemo(() => templateMap.get(String(templateId)) || null, [templateMap, templateId]);
  const selectedTemplatePages = useMemo(() => {
    if (Array.isArray(templatePagesForExam) && templatePagesForExam.length) return templatePagesForExam;
    if (!selectedTemplate) return [{ id: "page-1", elements: [] }];
    if (Array.isArray(selectedTemplate?.layout_json?.pages) && selectedTemplate.layout_json.pages.length) {
      return selectedTemplate.layout_json.pages;
    }
    return [{ id: "page-1", elements: Array.isArray(selectedTemplate?.layout_json?.elements) ? selectedTemplate.layout_json.elements : [] }];
  }, [selectedTemplate, templatePagesForExam]);
  const selectedTemplateElementsForCanvas = useMemo(
    () => Array.isArray(selectedTemplatePages[currentTemplatePage]?.elements) ? selectedTemplatePages[currentTemplatePage].elements : [],
    [selectedTemplatePages, currentTemplatePage]
  );
  const instructions = useMemo(
    () =>
      instructionLines
        .map((line) => String(line || "").trim())
        .filter(Boolean)
        .map((line, idx) => `${idx + 1}. ${line}`)
        .join("\n"),
    [instructionLines]
  );

  const buildPreviewPages = (exam) => {
    if (!exam) return [];
    const layout = exam?.exam_layout_json && typeof exam.exam_layout_json === "object" ? exam.exam_layout_json : defaultExamLayout();
    const templatePages = Array.isArray(layout.template_pages_override) && layout.template_pages_override.length
      ? layout.template_pages_override
      : Array.isArray(exam?.template?.layout_json?.pages) && exam.template.layout_json.pages.length
      ? exam.template.layout_json.pages
      : [{ elements: Array.isArray(exam?.template?.layout_json?.elements) ? exam.template.layout_json.elements : [] }];
    const metaBlocks = [
      { key: "name", text: `Name: ${exam?.title || "Untitled exam"}` },
      { key: "instructions", text: `Instructions:\n${exam?.instructions || "-"}` },
      { key: "duration", text: `Duration: ${exam?.duration_minutes || 0} min` },
      { key: "passing_marks", text: `Pass mark: ${exam?.passing_marks || 0}` },
      { key: "total_marks", text: `Total marks: ${exam?.total_marks || 0}` },
    ].map((m) => ({ ...m, ...layout[m.key] }));
    const isFooterEl = (el) => {
      const t = String(el?.type || "").toLowerCase();
      const label = String(el?.label || "").toLowerCase();
      return ["website", "phone", "address"].includes(t) || /website|phone|address/.test(label);
    };
    const computeBounds = (templateElements) => {
      const footerElements = templateElements.filter(isFooterEl);
      const bodyTemplateElements = templateElements.filter((el) => !isFooterEl(el));
      const bodyTopFromTemplate = bodyTemplateElements.length
        ? Math.max(...bodyTemplateElements.map((el) => Number(el?.y || 0) + Number(el?.h || 30))) + 20
        : 120;
      const bodyTopFromMeta = metaBlocks.length
        ? Math.max(...metaBlocks.map((m) => Number(m?.y || 0) + Number(m?.h || 24))) + 16
        : 120;
      const startY = Math.max(120, Math.min(740, Math.max(bodyTopFromTemplate, bodyTopFromMeta)));
      const footerTop = footerElements.length ? Math.min(...footerElements.map((el) => Number(el?.y || 0))) : 822;
      const pageBottom = Math.max(startY + 40, footerTop - 16);
      return { startY, pageBottom };
    };
    const sortedQuestions = (Array.isArray(exam?.questions) ? exam.questions : [])
      .slice()
      .sort((a, b) => Number(a.order_number || 0) - Number(b.order_number || 0));

    const maxQuestionPage = sortedQuestions.length
      ? Math.max(...sortedQuestions.map((q) => Math.max(0, Number(q.canvas_page || 0))))
      : 0;
    const totalPages = Math.max(templatePages.length, maxQuestionPage + 1);
    const pages = Array.from({ length: totalPages }, (_, idx) => ({
      pageNo: idx + 1,
      templateElements: Array.isArray(templatePages[Math.min(idx, templatePages.length - 1)]?.elements)
        ? templatePages[Math.min(idx, templatePages.length - 1)].elements
        : [],
      metaBlocks,
      questions: [],
    }));

    // Position-first rendering: keep saved page/x/y placement exact.
    sortedQuestions.forEach((q) => {
      const targetPage = Math.max(0, Number(q.canvas_page || 0));
      const page = pages[targetPage] || pages[0];
      const { startY } = computeBounds(page.templateElements);
      page.questions.push({
        ...q,
        diagram_data: q.diagram_data || q?.options?.diagram_data || null,
        page_y: Number.isFinite(Number(q.canvas_y)) ? Number(q.canvas_y) : startY,
        page_x: Number(q.canvas_x || 36),
        page_w: Number(q.canvas_w || 520),
      });
    });

    return pages;
  };

  const previewPages = useMemo(() => buildPreviewPages(viewRow), [viewRow, schoolProfile]);
  const simulatePages = useMemo(() => buildPreviewPages(simulateRow), [simulateRow, schoolProfile]);

  const parseQuestionOptions = (q) => {
    if (Array.isArray(q?.options)) return q.options.map((o) => String(o || "").trim()).filter(Boolean);
    if (typeof q?.options === "string") return q.options.split(",").map((o) => o.trim()).filter(Boolean);
    if (typeof q?.options_text === "string") return q.options_text.split(",").map((o) => o.trim()).filter(Boolean);
    return [];
  };

  const renderCanvasQuestionText = (q, index) =>
    `${q.order_number || index + 1}. ${q.question_text || "Untitled question"} (${Number(q.marks) || 0} marks)`;

  const renderCanvasChoiceControls = (q, scopeKey = "canvas") => {
    if (q.question_type === "multiple_choice") {
      return (
        <Stack spacing={0}>
          {parseQuestionOptions(q).map((opt) => (
            <FormControlLabel
              key={`${scopeKey}-radio-${q.key || q.id || "q"}-${opt}`}
              control={<Radio size="small" disabled sx={{ p: 0.4 }} />}
              label={<Typography sx={{ fontSize: 11.5 }}>{opt}</Typography>}
              sx={{ m: 0, pointerEvents: "none" }}
            />
          ))}
        </Stack>
      );
    }
    if (q.question_type === "multi_select") {
      return (
        <Stack spacing={0}>
          {parseQuestionOptions(q).map((opt) => (
            <FormControlLabel
              key={`${scopeKey}-check-${q.key || q.id || "q"}-${opt}`}
              control={<Checkbox size="small" disabled sx={{ p: 0.4 }} />}
              label={<Typography sx={{ fontSize: 11.5 }}>{opt}</Typography>}
              sx={{ m: 0, pointerEvents: "none" }}
            />
          ))}
        </Stack>
      );
    }
    if (q.question_type === "true_false") {
      return (
        <RadioGroup row value="">
          <FormControlLabel
            value="True"
            control={<Radio size="small" disabled sx={{ p: 0.4 }} />}
            label={<Typography sx={{ fontSize: 11.5 }}>True</Typography>}
            sx={{ mr: 1.25, ml: 0, pointerEvents: "none" }}
          />
          <FormControlLabel
            value="False"
            control={<Radio size="small" disabled sx={{ p: 0.4 }} />}
            label={<Typography sx={{ fontSize: 11.5 }}>False</Typography>}
            sx={{ mr: 0, ml: 0, pointerEvents: "none" }}
          />
        </RadioGroup>
      );
    }
    return null;
  };

  const openStudentPreview = (row) => {
    setSimulateRow(row);
    const initialAnswers = {};
    (Array.isArray(row?.questions) ? row.questions : []).forEach((q, idx) => {
      const qKey = String(q.id || q.key || idx + 1);
      if (q.question_type === "diagram_label") {
        const hotspots = Array.isArray(q?.options?.hotspots) ? q.options.hotspots : [];
        initialAnswers[qKey] = hotspots.reduce((acc, hs, hsIdx) => {
          acc[String(hs.id || hsIdx + 1)] = "";
          return acc;
        }, {});
      } else if (q.question_type === "multi_select") {
        initialAnswers[qKey] = [];
      } else {
        initialAnswers[qKey] = "";
      }
    });
    setSimulateAnswers(initialAnswers);
  };

  const load = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [examRes, tplRes, profileRes] = await Promise.all([
        fetch("/api/exams?page=1&limit=200", { headers: authHeaders(token) }),
        fetch("/api/exam-templates?page=1&limit=200", { headers: authHeaders(token) }),
        fetch("/api/school-profile/admin", { headers: authHeaders(token) }),
      ]);
      const [examJson, tplJson, profileJson] = await Promise.all([
        examRes.json().catch(() => ({})),
        tplRes.json().catch(() => ({})),
        profileRes.json().catch(() => ({})),
      ]);
      if (!examRes.ok || !examJson.success) throw new Error(examJson.message || "Could not load exams");
      if (!tplRes.ok || !tplJson.success) throw new Error(tplJson.message || "Could not load templates");
      setRows(Array.isArray(examJson.data) ? examJson.data : []);
      setTemplates(Array.isArray(tplJson.data) ? tplJson.data : []);
      setSchoolProfile(profileRes.ok && profileJson.success ? profileJson.data || null : null);
    } catch (e) {
      setRows([]);
      setError(e.message || "Failed loading exams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const onCreateFromHeader = () => {
      resetForm();
      setMode("create");
    };
    window.addEventListener("exams:create", onCreateFromHeader);
    return () => window.removeEventListener("exams:create", onCreateFromHeader);
  }, []);

  useEffect(() => {
    setCurrentTemplatePage(0);
    const pagesFromTemplate =
      Array.isArray(selectedTemplate?.layout_json?.pages) && selectedTemplate.layout_json.pages.length
        ? selectedTemplate.layout_json.pages
        : [{ id: "page-1", elements: Array.isArray(selectedTemplate?.layout_json?.elements) ? selectedTemplate.layout_json.elements : [] }];
    setTemplatePagesForExam(
      pagesFromTemplate.map((p, idx) => ({
        id: p?.id || `page-${idx + 1}`,
        elements: Array.isArray(p?.elements) ? p.elements : [],
      }))
    );
  }, [templateId]);

  useEffect(() => {
    const onMove = (ev) => {
      const canvas = questionCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (questionDragRef.current) {
        const { key, dx, dy } = questionDragRef.current;
        const x = Math.max(0, Math.min(560, Math.round(ev.clientX - rect.left - dx)));
        const y = Math.max(0, Math.min(800, Math.round(ev.clientY - rect.top - dy)));
        setQuestions((prev) =>
          prev.map((q) =>
            q.key === key ? { ...q, canvas_x: x, canvas_y: y, canvas_page: currentTemplatePage } : q
          )
        );
      }
      if (questionResizeRef.current) {
        const { key, startX, startY, startW, startH } = questionResizeRef.current;
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;
        setQuestions((prev) =>
          prev.map((q) =>
            q.key === key
              ? {
                  ...q,
                  canvas_w: Math.max(120, Math.round(startW + deltaX)),
                  canvas_h: Math.max(24, Math.round(startH + deltaY)),
                }
              : q
          )
        );
      }
      if (diagramDragRef.current) {
        const { key, dx, dy } = diagramDragRef.current;
        const x = Math.max(0, Math.min(560, Math.round(ev.clientX - rect.left - dx)));
        const y = Math.max(0, Math.min(800, Math.round(ev.clientY - rect.top - dy)));
        setQuestions((prev) =>
          prev.map((q) =>
            q.key === key
              ? { ...q, diagram_canvas_x: x, diagram_canvas_y: y, diagram_canvas_page: currentTemplatePage }
              : q
          )
        );
      }
      if (diagramResizeRef.current) {
        const { key, startX, startY, startW, startH } = diagramResizeRef.current;
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;
        setQuestions((prev) =>
          prev.map((q) =>
            q.key === key
              ? {
                  ...q,
                  diagram_canvas_w: Math.max(120, Math.round(startW + deltaX)),
                  diagram_canvas_h: Math.max(80, Math.round(startH + deltaY)),
                }
              : q
          )
        );
      }
      if (examMetaDragRef.current) {
        const { key, dx, dy } = examMetaDragRef.current;
        const x = Math.max(0, Math.min(560, Math.round(ev.clientX - rect.left - dx)));
        const y = Math.max(0, Math.min(800, Math.round(ev.clientY - rect.top - dy)));
        setExamLayout((prev) => ({ ...prev, [key]: { ...prev[key], x, y } }));
      }
    };
    const onUp = () => {
      questionDragRef.current = null;
      questionResizeRef.current = null;
      diagramDragRef.current = null;
      diagramResizeRef.current = null;
      examMetaDragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [currentTemplatePage]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTemplateId("");
    setDuration(60);
    setInstructionLines([""]);
    setTotalMarks(0);
    setPassingMarks(0);
    setRequiresWebcam(false);
    setPreventTabSwitch(true);
    setAllowRetake(false);
    setMaxAttempts(1);
    setStatus("draft");
    setExamLayout(defaultExamLayout());
    setTemplatePagesForExam([{ id: "page-1", elements: [] }]);
    setQuestions([emptyQuestion(1)]);
    setOcrRawText("");
    setOcrParsedBlocks([]);
  };

  const parseInstructionLines = (raw) => {
    const lines = String(raw || "")
      .split("\n")
      .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
      .filter(Boolean);
    return lines.length ? lines : [""];
  };

  const startEditExam = (row) => {
    setEditingId(row.id);
    setMode("create");
    setName(row.title || "");
    setTemplateId(row.template_id || row.template?.id || "");
    setDuration(Number(row.duration_minutes) || 60);
    setInstructionLines(parseInstructionLines(row.instructions));
    setTotalMarks(Number(row.total_marks) || 0);
    setPassingMarks(Number(row.passing_marks) || 0);
    setRequiresWebcam(Boolean(row.requires_webcam));
    setPreventTabSwitch(row.prevent_tab_switch === undefined ? true : Boolean(row.prevent_tab_switch));
    setAllowRetake(Boolean(row.allow_retake));
    setMaxAttempts(Number(row.max_attempts) || 1);
    setStatus(row.status || "draft");
    const layout = row.exam_layout_json && typeof row.exam_layout_json === "object" ? row.exam_layout_json : {};
    const base = defaultExamLayout();
    setExamLayout({
      name: { ...base.name, ...(layout.name || {}) },
      instructions: { ...base.instructions, ...(layout.instructions || {}) },
      duration: { ...base.duration, ...(layout.duration || {}) },
      passing_marks: { ...base.passing_marks, ...(layout.passing_marks || {}) },
      total_marks: { ...base.total_marks, ...(layout.total_marks || {}) },
    });
    const overridePages = Array.isArray(layout.template_pages_override) ? layout.template_pages_override : null;
    const templatePages =
      overridePages && overridePages.length
        ? overridePages
        : Array.isArray(row?.template?.layout_json?.pages) && row.template.layout_json.pages.length
        ? row.template.layout_json.pages
        : [{ id: "page-1", elements: Array.isArray(row?.template?.layout_json?.elements) ? row.template.layout_json.elements : [] }];
    setTemplatePagesForExam(
      templatePages.map((p, idx) => ({
        id: p?.id || `page-${idx + 1}`,
        elements: Array.isArray(p?.elements) ? p.elements : [],
      }))
    );
    setCurrentTemplatePage(0);
    const qs = Array.isArray(row.questions) ? row.questions : [];
    setQuestions(
      qs.length
        ? qs.map((q, idx) => ({
            key: q.id || `${Date.now()}-${idx}`,
            question_text: q.question_text || "",
            question_type: q.question_type || "short_text",
            required: Boolean(q.required),
            marks: Number(q.marks) || 0,
            options_text: Array.isArray(q.options) ? q.options.join(", ") : "",
            correct_answer: q.correct_answer || "",
            order_number: Number(q.order_number) || idx + 1,
            canvas_x: Number(q.canvas_x) || 40,
            canvas_y: Number(q.canvas_y) || 120 + idx * 34,
            canvas_w: Number(q.canvas_w) || 520,
            canvas_h: Number(q.canvas_h) || 26,
            canvas_page: Number.isFinite(Number(q.canvas_page)) ? Number(q.canvas_page) : 0,
            diagram_data: q?.options?.diagram_data || "",
            diagram_hotspots: Array.isArray(q?.options?.hotspots) && q.options.hotspots.length
              ? q.options.hotspots.map((hs, hsIdx) => ({
                  id: hs.id || `hs-${idx + 1}-${hsIdx + 1}`,
                  x: Number.isFinite(Number(hs.x)) ? Number(hs.x) : 50,
                  y: Number.isFinite(Number(hs.y)) ? Number(hs.y) : 50,
                  prompt: hs.prompt || "",
                  correct_answer: hs.correct_answer || "",
                }))
              : [{ id: `hs-${Date.now()}-${idx + 1}`, x: 50, y: 50, prompt: "", correct_answer: "" }],
            diagram_canvas_x: Number(q?.options?.diagram_position?.x) || 40,
            diagram_canvas_y: Number(q?.options?.diagram_position?.y) || 220 + idx * 20,
            diagram_canvas_w: Number(q?.options?.diagram_position?.w) || 260,
            diagram_canvas_h: Number(q?.options?.diagram_position?.h) || 180,
            diagram_canvas_page: Number.isFinite(Number(q?.options?.diagram_position?.page))
              ? Number(q.options.diagram_position.page)
              : 0,
          }))
        : [emptyQuestion(1)]
    );
  };

  const openStatusDialog = (row) => {
    setStatusEditRow(row);
    setStatusEditValue(row?.status || "draft");
  };

  const saveExamStatusOnly = async () => {
    if (!statusEditRow?.id) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/exams/${statusEditRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ status: statusEditValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not update exam status.");
      await Swal.fire({
        icon: "success",
        title: "Exam status updated",
        text: `Status changed to ${statusEditValue}.`,
        timer: 1200,
        showConfirmButton: false,
      });
      setStatusEditRow(null);
      await load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Status update failed",
        text: e.message || "Could not update exam status.",
      });
    } finally {
      setStatusSaving(false);
    }
  };

  const openMarkingDialog = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setMarkingRow(row);
    setMarkingLoading(true);
    setMarkingError("");
    setMarkingSubmissions([]);
    setMarkInputs({});
    try {
      const res = await fetch(`/api/exams/${row.id}/submissions?status=submitted`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load submissions.");
      const submissions = Array.isArray(data?.data?.submissions) ? data.data.submissions : [];
      setMarkingSubmissions(submissions);
      const nextInputs = {};
      submissions.forEach((s) => {
        nextInputs[s.id] = s?.marking?.total_score != null ? String(s.marking.total_score) : "";
      });
      setMarkInputs(nextInputs);
    } catch (e) {
      setMarkingError(e.message || "Could not load submissions.");
    } finally {
      setMarkingLoading(false);
    }
  };

  const saveSubmissionMark = async (submissionId) => {
    const token = localStorage.getItem("token");
    if (!token || !markingRow?.id) return;
    const raw = markInputs[submissionId];
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0) {
      await Swal.fire({ icon: "error", title: "Invalid mark", text: "Enter a valid non-negative score." });
      return;
    }
    setMarkSavingId(submissionId);
    try {
      const res = await fetch(`/api/exams/${markingRow.id}/submissions/${submissionId}/mark`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ total_score: score }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save mark.");
      setMarkingSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                marking: {
                  ...(s.marking || {}),
                  total_score: data?.data?.total_score,
                  percentage: data?.data?.percentage,
                  is_passed: data?.data?.is_passed,
                },
              }
            : s
        )
      );
      await Swal.fire({ icon: "success", title: "Mark saved", timer: 900, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Marking failed", text: e.message || "Could not save mark." });
    } finally {
      setMarkSavingId("");
    }
  };

  const runCleanupStaleDrafts = async () => {
    const token = localStorage.getItem("token");
    if (!token || !markingRow?.id) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Clean stale drafts?",
      text: "This removes old draft submissions for students who already submitted this exam.",
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirm.isConfirmed) return;
    setCleanupRunning(true);
    try {
      const res = await fetch(`/api/exams/${markingRow.id}/submissions/cleanup-stale-drafts`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Cleanup failed.");
      await Swal.fire({
        icon: "success",
        title: "Cleanup complete",
        text: `Deleted ${data?.data?.draft_submissions_deleted || 0} stale drafts.`,
        timer: 1200,
        showConfirmButton: false,
      });
      await openMarkingDialog(markingRow);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Cleanup failed", text: e.message || "Could not clean stale drafts." });
    } finally {
      setCleanupRunning(false);
    }
  };

  const createExam = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const title = name.trim();
    if (!title) {
      await Swal.fire({ icon: "error", title: "Name required", text: "Exam name is required." });
      return;
    }
    if (!templateId) {
      await Swal.fire({ icon: "error", title: "Template required", text: "Please select an exam template." });
      return;
    }
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) {
      await Swal.fire({ icon: "error", title: "Duration invalid", text: "Duration must be greater than zero." });
      return;
    }
    const payloadQuestions = questions.map((q, i) => ({
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      required: Boolean(q.required),
      marks: Number(q.marks) || 0,
      order_number: i + 1,
      correct_answer: q.correct_answer || null,
      canvas_x: Number(q.canvas_x) || 40,
      canvas_y: Number(q.canvas_y) || 120 + i * 34,
      canvas_w: Math.max(120, Number(q.canvas_w) || 520),
      canvas_h: Math.max(24, Number(q.canvas_h) || 26),
      canvas_page: Number.isFinite(Number(q.canvas_page)) ? Number(q.canvas_page) : currentTemplatePage,
      diagram_data: q.diagram_data || "",
      diagram_hotspots: Array.isArray(q.diagram_hotspots) ? q.diagram_hotspots : [],
      options: ["multiple_choice", "multi_select"].includes(q.question_type)
        ? q.options_text
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : q.question_type === "diagram_label"
        ? {
            diagram_data: String(q.diagram_data || "").trim(),
            diagram_position: {
              x: Number(q.diagram_canvas_x) || 40,
              y: Number(q.diagram_canvas_y) || 220 + i * 20,
              w: Math.max(120, Number(q.diagram_canvas_w) || 260),
              h: Math.max(80, Number(q.diagram_canvas_h) || 180),
              page: Number.isFinite(Number(q.diagram_canvas_page)) ? Number(q.diagram_canvas_page) : currentTemplatePage,
            },
            hotspots: (Array.isArray(q.diagram_hotspots) ? q.diagram_hotspots : []).map((hs, hsIdx) => ({
              id: hs.id || `hs-${i + 1}-${hsIdx + 1}`,
              x: Number.isFinite(Number(hs.x)) ? Number(hs.x) : 50,
              y: Number.isFinite(Number(hs.y)) ? Number(hs.y) : 50,
              prompt: String(hs.prompt || "").trim(),
              correct_answer: String(hs.correct_answer || "").trim(),
            })),
          }
        : null,
    }));
    if (payloadQuestions.some((q) => !q.question_text)) {
      await Swal.fire({ icon: "error", title: "Question required", text: "Every question must have text." });
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const res = await fetch(isEdit ? `/api/exams/${editingId}` : "/api/exams", {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          title,
          template_id: templateId,
          duration_minutes: Number(duration),
          total_marks: Number(totalMarks) || 0,
          passing_marks: Number(passingMarks) || 0,
          requires_webcam: Boolean(requiresWebcam),
          prevent_tab_switch: Boolean(preventTabSwitch),
          allow_retake: Boolean(allowRetake),
          max_attempts: allowRetake ? Math.max(1, Number(maxAttempts) || 1) : 1,
          ...(isEdit ? {} : { status }),
          instructions: instructions || null,
          exam_layout_json: { ...examLayout, template_pages_override: selectedTemplatePages },
          questions: payloadQuestions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || (isEdit ? "Failed updating exam" : "Failed creating exam"));
      await Swal.fire({ icon: "success", title: isEdit ? "Exam updated" : "Exam created", timer: 1200, showConfirmButton: false });
      setMode("list");
      resetForm();
      await load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: editingId ? "Update failed" : "Create failed", text: e.message || "Could not save exam." });
    } finally {
      setSaving(false);
    }
  };

  const importQuestionsFromDocument = async (file) => {
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setGeneratingFromDoc(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("questionCount", String(Math.max(1, Number(questionGenCount) || 10)));
      const res = await fetch("/api/exams/ocr/extract-questions-from-document", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !Array.isArray(data?.data)) {
        throw new Error(data?.message || "Could not extract questions from document.");
      }

      const incoming = data.data;
      if (!incoming.length) {
        await Swal.fire({ icon: "info", title: "No questions found", text: "No questions were detected from this document." });
        return;
      }

      setOcrRawText(String(data?.meta?.raw_text || "").trim());
      setOcrParsedBlocks(
        incoming.map((q, idx) => ({
          id: `${Date.now()}-${idx}`,
          text: String(q?.text || "").trim(),
          type: String(q?.type || "short_text"),
          marks: Number.isFinite(Number(q?.marks)) ? Number(q.marks) : 5,
          options: Array.isArray(q?.options) ? q.options : [],
          correctAnswer: String(q?.correctAnswer || "").trim(),
          explanation: String(q?.explanation || "").trim(),
        }))
      );

      await Swal.fire({
        icon: "success",
        title: "OCR extraction ready",
        text: `Detected ${incoming.length} question block(s). Review/merge/split, then add to exam.`,
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Extraction failed", text: e.message || "Could not extract questions." });
    } finally {
      setGeneratingFromDoc(false);
      if (questionDocInputRef.current) questionDocInputRef.current.value = "";
    }
  };

  const updateOcrBlockText = (index, value) => {
    setOcrParsedBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, text: value } : b)));
  };

  const mergeOcrBlockWithNext = (index) => {
    setOcrParsedBlocks((prev) => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const current = prev[index];
      const next = prev[index + 1];
      const merged = {
        ...current,
        text: `${String(current.text || "").trim()}\n${String(next.text || "").trim()}`.trim(),
      };
      return [...prev.slice(0, index), merged, ...prev.slice(index + 2)];
    });
  };

  const splitOcrBlock = (index) => {
    setOcrParsedBlocks((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const target = prev[index];
      const text = String(target.text || "").trim();
      if (!text) return prev;
      let parts = text
        .split(/\n{2,}/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length < 2) {
        const lines = text.split(/\n+/).map((x) => x.trim()).filter(Boolean);
        if (lines.length >= 2) {
          const mid = Math.ceil(lines.length / 2);
          parts = [lines.slice(0, mid).join(" "), lines.slice(mid).join(" ")];
        }
      }
      if (parts.length < 2) return prev;
      const [first, ...rest] = parts;
      const nextBlocks = [
        { ...target, text: first },
        ...rest.map((p, i) => ({ ...target, id: `${target.id}-split-${i + 1}`, text: p })),
      ];
      return [...prev.slice(0, index), ...nextBlocks, ...prev.slice(index + 1)];
    });
  };

  const removeOcrBlock = (index) => {
    setOcrParsedBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const addOcrBlocksToQuestions = () => {
    const validBlocks = ocrParsedBlocks
      .map((b) => ({ ...b, text: String(b?.text || "").trim() }))
      .filter((b) => b.text);
    if (!validBlocks.length) {
      void Swal.fire({ icon: "warning", title: "Nothing to add", text: "No parsed question blocks to add." });
      return;
    }
    setQuestions((prev) => {
      const base = prev.length;
      const mapped = validBlocks.map((block, idx) => ({
        ...emptyQuestion(base + idx + 1),
        question_text: block.text,
        question_type: "short_text",
        marks: Number.isFinite(Number(block?.marks)) ? Number(block.marks) : 5,
        options_text: Array.isArray(block?.options)
          ? block.options.map((x) => String(x || "").trim()).filter(Boolean).join(", ")
          : "",
        correct_answer: String(block?.correctAnswer || "").trim(),
        explanation: String(block?.explanation || "").trim(),
        order_number: base + idx + 1,
        canvas_page: currentTemplatePage,
      }));
      return [...prev, ...mapped];
    });
    void Swal.fire({
      icon: "success",
      title: "Questions added",
      text: `Added ${validBlocks.length} reviewed question(s) to this exam.`,
      timer: 1200,
      showConfirmButton: false,
    });
    setOcrParsedBlocks([]);
    setOcrRawText("");
  };

  const deleteExam = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete exam?",
      text: row.title || row.name || "Exam",
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirmation.isConfirmed) return;
    const res = await fetch(`/api/exams/${row.id}`, { method: "DELETE", headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: data.message || "Delete failed." });
      return;
    }
    await load();
    await Swal.fire({
      icon: "success",
      title: "Exam deleted",
      text: row.title || row.name || "Exam removed successfully.",
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const duplicateExam = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/exams/${row.id}/duplicate`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not duplicate exam.");
      await load();
      await Swal.fire({
        icon: "success",
        title: "Exam duplicated",
        text: `${row.title || row.name || "Exam"} copied to a new draft.`,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Duplicate failed",
        text: e.message || "Could not duplicate exam.",
      });
    }
  };

  const downloadExamPdf = async () => {
    if (!viewRow) return;
    try {
      const pageNodes = Array.from(previewPagesContainerRef.current?.querySelectorAll("[data-exam-preview-page='true']") || []);
      if (!pageNodes.length) return;
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [595, 842] });
      for (let i = 0; i < pageNodes.length; i += 1) {
        const canvas = await html2canvas(pageNodes[i], { backgroundColor: "#ffffff", scale: 2 });
        const img = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([595, 842], "portrait");
        pdf.addImage(img, "PNG", 0, 0, 595, 842);
      }
      const safeName = String(viewRow.title || "exam").replace(/[^\w\-]+/g, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Export failed", text: e.message || "Could not generate PDF." });
    }
  };

  const downloadExamWord = async () => {
    if (!viewRow) return;
    try {
      const pageNodes = Array.from(previewPagesContainerRef.current?.querySelectorAll("[data-exam-preview-page='true']") || []);
      if (!pageNodes.length) return;
      const images = [];
      for (let i = 0; i < pageNodes.length; i += 1) {
        const canvas = await html2canvas(pageNodes[i], { backgroundColor: "#ffffff", scale: 2 });
        images.push(canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""));
      }
      const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const htmlBody = images
        .map(
          (_, idx) => `<div style="page-break-after:${idx < images.length - 1 ? "always" : "auto"};"><img src="file:///C:/exam-page-${idx + 1}.png" style="width:595pt;height:842pt;display:block;" /></div>`
        )
        .join("");
      const imageParts = images
        .map(
          (base64, idx) => `--${boundary}
Content-Type: image/png
Content-Transfer-Encoding: base64
Content-Location: file:///C:/exam-page-${idx + 1}.png

${base64}
`
        )
        .join("");
      const mhtml = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="${boundary}"; type="text/html"

--${boundary}
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 8bit
Content-Location: file:///C:/exam.html

<!doctype html>
<html><head><meta charset="utf-8" />
<style>@page{size:A4 portrait;margin:0;}html,body{margin:0;padding:0;background:#fff;}</style>
</head><body>${htmlBody}</body></html>

${imageParts}--${boundary}--`;
      const blob = new Blob([mhtml], { type: "application/msword" });
      const safeName = String(viewRow.title || "exam").replace(/[^\w\-]+/g, "_");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Export failed", text: e.message || "Could not generate Word file." });
    }
  };

  const startQuestionDrag = (ev, key) => {
    ev.preventDefault();
    const canvas = questionCanvasRef.current;
    const q = questions.find((x) => x.key === key);
    if (!canvas || !q) return;
    const rect = canvas.getBoundingClientRect();
    questionDragRef.current = {
      key,
      dx: ev.clientX - rect.left - Number(q.canvas_x || 0),
      dy: ev.clientY - rect.top - Number(q.canvas_y || 0),
    };
  };

  const startQuestionResize = (ev, key) => {
    ev.preventDefault();
    ev.stopPropagation();
    const q = questions.find((x) => x.key === key);
    if (!q) return;
    questionResizeRef.current = {
      key,
      startX: ev.clientX,
      startY: ev.clientY,
      startW: Number(q.canvas_w || 520),
      startH: Number(q.canvas_h || 26),
    };
  };

  const startDiagramDrag = (ev, key) => {
    ev.preventDefault();
    const canvas = questionCanvasRef.current;
    const q = questions.find((x) => x.key === key);
    if (!canvas || !q) return;
    const rect = canvas.getBoundingClientRect();
    diagramDragRef.current = {
      key,
      dx: ev.clientX - rect.left - Number(q.diagram_canvas_x || 0),
      dy: ev.clientY - rect.top - Number(q.diagram_canvas_y || 0),
    };
  };

  const startDiagramResize = (ev, key) => {
    ev.preventDefault();
    ev.stopPropagation();
    const q = questions.find((x) => x.key === key);
    if (!q) return;
    diagramResizeRef.current = {
      key,
      startX: ev.clientX,
      startY: ev.clientY,
      startW: Number(q.diagram_canvas_w || 260),
      startH: Number(q.diagram_canvas_h || 180),
    };
  };

  const startExamMetaDrag = (ev, metaKey) => {
    ev.preventDefault();
    const canvas = questionCanvasRef.current;
    const row = examLayout?.[metaKey];
    if (!canvas || !row) return;
    const rect = canvas.getBoundingClientRect();
    examMetaDragRef.current = {
      key: metaKey,
      dx: ev.clientX - rect.left - Number(row.x || 0),
      dy: ev.clientY - rect.top - Number(row.y || 0),
    };
  };

  const addBlankTemplatePageForExam = () => {
    setTemplatePagesForExam((prev) => {
      const next = [...prev, { id: `page-${prev.length + 1}`, elements: [] }];
      setCurrentTemplatePage(next.length - 1);
      return next;
    });
  };

  const duplicateCurrentTemplatePageForExam = () => {
    setTemplatePagesForExam((prev) => {
      const source = prev[currentTemplatePage] || { elements: [] };
      const cloned = {
        id: `page-${prev.length + 1}`,
        elements: (Array.isArray(source.elements) ? source.elements : []).map((el) => ({
          ...el,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        })),
      };
      const next = [...prev, cloned];
      setCurrentTemplatePage(next.length - 1);
      return next;
    });
  };

  const deleteCurrentTemplatePageForExam = async () => {
    if (selectedTemplatePages.length <= 1) return;
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete current page?",
      text: `Page ${currentTemplatePage + 1}`,
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirmation.isConfirmed) return;

    const deletedPageIdx = currentTemplatePage;
    const nextPageIdx = Math.max(0, deletedPageIdx - 1);

    setTemplatePagesForExam((prev) => prev.filter((_, idx) => idx !== deletedPageIdx));
    setCurrentTemplatePage(nextPageIdx);

    // Keep questions valid after page deletion.
    setQuestions((prev) =>
      prev.map((q) => {
        const qp = Number.isFinite(Number(q.canvas_page)) ? Number(q.canvas_page) : 0;
        if (qp === deletedPageIdx) return { ...q, canvas_page: nextPageIdx };
        if (qp > deletedPageIdx) return { ...q, canvas_page: qp - 1 };
        return q;
      })
    );
  };

  if (mode === "create") {
    return (
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
          <Typography sx={{ fontWeight: 800 }}>{editingId ? "Edit exam" : "Create exam"}</Typography>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => setMode("list")}>
            Back
          </Button>
        </Stack>
        <Card elevation={0} sx={{ border: "1px solid #fecaca" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <TextField label="Exam name" value={name} onChange={(e) => setName(e.target.value)} />
              <Select fullWidth displayEmpty value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                <MenuItem value="">
                  <em>Select template</em>
                </MenuItem>
                {templates.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
              <TextField fullWidth label="Duration (minutes)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>Instructions</Typography>
                {instructionLines.map((line, idx) => (
                  <Stack key={`instruction-${idx}`} direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ minWidth: 18, color: "text.secondary" }}>{idx + 1}.</Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={`Instruction ${idx + 1}`}
                      value={line}
                      onChange={(e) => setInstructionLines((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))}
                    />
                    <Button
                      color="error"
                      variant="outlined"
                      disabled={instructionLines.length <= 1}
                      onClick={() => setInstructionLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))}
                    >
                      Remove
                    </Button>
                  </Stack>
                ))}
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={() => setInstructionLines((prev) => [...prev, ""])}>
                    Add instruction
                  </Button>
                </Stack>
              </Stack>
              <Typography sx={{ fontWeight: 800, mt: 1 }}>Advanced settings</Typography>
              <TextField fullWidth label="Total marks" type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
              <TextField fullWidth label="Passing marks" type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} />
              {!editingId ? (
                <Select fullWidth value={status} onChange={(e) => setStatus(e.target.value)}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              ) : null}
              <FormControlLabel
                control={<Switch checked={requiresWebcam} onChange={(e) => setRequiresWebcam(e.target.checked)} />}
                label="Require webcam"
              />
              <FormControlLabel
                control={<Switch checked={preventTabSwitch} onChange={(e) => setPreventTabSwitch(e.target.checked)} />}
                label="Prevent tab switch"
              />
              <FormControlLabel
                control={<Switch checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} />}
                label="Allow retake"
              />
              <TextField
                fullWidth
                label="Max attempts"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                disabled={!allowRetake}
              />
              <Stack direction={{ xs: "column", xl: "row" }} spacing={2} alignItems="flex-start">
                <Box sx={{ width: { xs: "100%", xl: 520 }, flexShrink: 0 }}>
                  <Typography sx={{ fontWeight: 800, mt: 1, mb: 1 }}>Questions</Typography>
                  <Stack spacing={1.5}>
                    {questions.map((q, idx) => (
                      <Card key={q.key} variant="outlined">
                        <CardContent>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 700 }}>Question {idx + 1}</Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setQuestions((prev) => {
                                    if (prev.length <= 1) return prev;
                                    return prev.filter((x) => x.key !== q.key).map((x, i) => ({ ...x, order_number: i + 1 }));
                                  })
                                }
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                            <TextField
                              fullWidth
                              label="Question text"
                              value={q.question_text}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, question_text: e.target.value } : x)))
                              }
                            />
                            <Select
                              fullWidth
                              value={q.question_type}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, question_type: e.target.value } : x)))
                              }
                            >
                              <MenuItem value="short_text">Short text</MenuItem>
                              <MenuItem value="long_text">Long text</MenuItem>
                              <MenuItem value="multiple_choice">Single choice</MenuItem>
                              <MenuItem value="multi_select">Multi choice</MenuItem>
                              <MenuItem value="true_false">True / False</MenuItem>
                              <MenuItem value="number">Number</MenuItem>
                              <MenuItem value="essay">Essay</MenuItem>
                              <MenuItem value="diagram_label">Diagram labeling</MenuItem>
                            </Select>
                            <TextField
                              fullWidth
                              label="Expected answer (optional)"
                              value={q.correct_answer}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, correct_answer: e.target.value } : x)))
                              }
                            />
                            <TextField
                              fullWidth
                              label="Marks"
                              type="number"
                              value={q.marks}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, marks: Number(e.target.value) || 0 } : x)))
                              }
                            />
                            <TextField
                              fullWidth
                              label="Question width on canvas"
                              type="number"
                              value={q.canvas_w}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, canvas_w: Math.max(120, Number(e.target.value) || 120) } : x)))
                              }
                            />
                            <TextField
                              fullWidth
                              label="Question height on canvas"
                              type="number"
                              value={q.canvas_h}
                              onChange={(e) =>
                                setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, canvas_h: Math.max(24, Number(e.target.value) || 24) } : x)))
                              }
                            />
                            <Select
                              fullWidth
                              size="small"
                              value={Number.isFinite(Number(q.canvas_page)) ? Number(q.canvas_page) : 0}
                              onChange={(e) =>
                                setQuestions((prev) =>
                                  prev.map((x) => (x.key === q.key ? { ...x, canvas_page: Number(e.target.value) || 0 } : x))
                                )
                              }
                            >
                              {selectedTemplatePages.map((p, idx) => (
                                <MenuItem key={p.id || idx} value={idx}>
                                  {`Question appears on template page ${idx + 1}`}
                                </MenuItem>
                              ))}
                            </Select>
                            {["multiple_choice", "multi_select"].includes(q.question_type) ? (
                              <TextField
                                fullWidth
                                label="Options (comma separated)"
                                value={q.options_text}
                                onChange={(e) =>
                                  setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, options_text: e.target.value } : x)))
                                }
                              />
                            ) : null}
                            {q.question_type === "diagram_label" ? (
                              <Stack spacing={1}>
                                <DiagramDrawInput
                                  value={q.diagram_data || ""}
                                  hotspots={Array.isArray(q.diagram_hotspots) ? q.diagram_hotspots : []}
                                  onSave={(imageDataUrl) =>
                                    setQuestions((prev) =>
                                      prev.map((x) => (x.key === q.key ? { ...x, diagram_data: imageDataUrl } : x))
                                    )
                                  }
                                  onArrowPlaced={({ id, x, y }) =>
                                    setQuestions((prev) =>
                                      prev.map((item) =>
                                        item.key !== q.key
                                          ? item
                                          : {
                                              ...item,
                                              diagram_hotspots: [
                                                ...(Array.isArray(item.diagram_hotspots)
                                                  ? item.diagram_hotspots.filter((hs) => {
                                                      // Drop the default placeholder hotspot once the user starts placing arrows.
                                                      const isPlaceholder =
                                                        (hs?.prompt || "") === "" &&
                                                        (hs?.correct_answer || "") === "" &&
                                                        Number(hs?.x) === 50 &&
                                                        Number(hs?.y) === 50;
                                                      return !isPlaceholder;
                                                    })
                                                  : []),
                                                {
                                                  id: id || `hs-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                                                  x,
                                                  y,
                                                  prompt: "",
                                                  correct_answer: "",
                                                },
                                              ],
                                            }
                                      )
                                    )
                                  }
                                />
                                {(Array.isArray(q.diagram_hotspots) ? q.diagram_hotspots : []).map((hs, hsIdx) => (
                                  <Stack key={hs.id || `${q.key}-hs-${hsIdx}`} direction={{ xs: "column", md: "row" }} spacing={1}>
                                    <TextField
                                      size="small"
                                      label="X (%)"
                                      type="number"
                                      value={hs.x}
                                      onChange={(e) =>
                                        setQuestions((prev) =>
                                          prev.map((x) =>
                                            x.key === q.key
                                              ? {
                                                  ...x,
                                                  diagram_hotspots: x.diagram_hotspots.map((h, i) =>
                                                    i === hsIdx ? { ...h, x: Number(e.target.value) || 0 } : h
                                                  ),
                                                }
                                              : x
                                          )
                                        )
                                      }
                                    />
                                    <TextField
                                      size="small"
                                      label="Y (%)"
                                      type="number"
                                      value={hs.y}
                                      onChange={(e) =>
                                        setQuestions((prev) =>
                                          prev.map((x) =>
                                            x.key === q.key
                                              ? {
                                                  ...x,
                                                  diagram_hotspots: x.diagram_hotspots.map((h, i) =>
                                                    i === hsIdx ? { ...h, y: Number(e.target.value) || 0 } : h
                                                  ),
                                                }
                                              : x
                                          )
                                        )
                                      }
                                    />
                                    <TextField
                                      size="small"
                                      fullWidth
                                      label="Prompt"
                                      value={hs.prompt}
                                      onChange={(e) =>
                                        setQuestions((prev) =>
                                          prev.map((x) =>
                                            x.key === q.key
                                              ? {
                                                  ...x,
                                                  diagram_hotspots: x.diagram_hotspots.map((h, i) =>
                                                    i === hsIdx ? { ...h, prompt: e.target.value } : h
                                                  ),
                                                }
                                              : x
                                          )
                                        )
                                      }
                                    />
                                    <TextField
                                      size="small"
                                      fullWidth
                                      label="Expected label"
                                      value={hs.correct_answer}
                                      onChange={(e) =>
                                        setQuestions((prev) =>
                                          prev.map((x) =>
                                            x.key === q.key
                                              ? {
                                                  ...x,
                                                  diagram_hotspots: x.diagram_hotspots.map((h, i) =>
                                                    i === hsIdx ? { ...h, correct_answer: e.target.value } : h
                                                  ),
                                                }
                                              : x
                                          )
                                        )
                                      }
                                    />
                                    <Button
                                      color="error"
                                      variant="outlined"
                                      onClick={() =>
                                        setQuestions((prev) =>
                                          prev.map((x) =>
                                            x.key === q.key
                                              ? {
                                                  ...x,
                                                  diagram_hotspots: x.diagram_hotspots.filter((_, i) => i !== hsIdx),
                                                }
                                              : x
                                          )
                                        )
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </Stack>
                                ))}
                                <Typography variant="caption" color="text.secondary">
                                  Tip: choose Arrow tool and place arrows on the diagram to auto-create hotspots.
                                </Typography>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                                  <TextField
                                    size="small"
                                    label="Diagram X"
                                    type="number"
                                    value={q.diagram_canvas_x}
                                    onChange={(e) =>
                                      setQuestions((prev) =>
                                        prev.map((x) => (x.key === q.key ? { ...x, diagram_canvas_x: Number(e.target.value) || 0 } : x))
                                      )
                                    }
                                  />
                                  <TextField
                                    size="small"
                                    label="Diagram Y"
                                    type="number"
                                    value={q.diagram_canvas_y}
                                    onChange={(e) =>
                                      setQuestions((prev) =>
                                        prev.map((x) => (x.key === q.key ? { ...x, diagram_canvas_y: Number(e.target.value) || 0 } : x))
                                      )
                                    }
                                  />
                                  <TextField
                                    size="small"
                                    label="Diagram W"
                                    type="number"
                                    value={q.diagram_canvas_w}
                                    onChange={(e) =>
                                      setQuestions((prev) =>
                                        prev.map((x) =>
                                          x.key === q.key ? { ...x, diagram_canvas_w: Math.max(120, Number(e.target.value) || 120) } : x
                                        )
                                      )
                                    }
                                  />
                                  <TextField
                                    size="small"
                                    label="Diagram H"
                                    type="number"
                                    value={q.diagram_canvas_h}
                                    onChange={(e) =>
                                      setQuestions((prev) =>
                                        prev.map((x) =>
                                          x.key === q.key ? { ...x, diagram_canvas_h: Math.max(80, Number(e.target.value) || 80) } : x
                                        )
                                      )
                                    }
                                  />
                                </Stack>
                                <Select
                                  fullWidth
                                  size="small"
                                  value={Number.isFinite(Number(q.diagram_canvas_page)) ? Number(q.diagram_canvas_page) : 0}
                                  onChange={(e) =>
                                    setQuestions((prev) =>
                                      prev.map((x) => (x.key === q.key ? { ...x, diagram_canvas_page: Number(e.target.value) || 0 } : x))
                                    )
                                  }
                                >
                                  {selectedTemplatePages.map((p, idx) => (
                                    <MenuItem key={`${p.id || idx}-diagram`} value={idx}>
                                      {`Diagram appears on template page ${idx + 1}`}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </Stack>
                            ) : null}
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={q.required}
                                  onChange={(e) =>
                                    setQuestions((prev) => prev.map((x) => (x.key === q.key ? { ...x, required: e.target.checked } : x)))
                                  }
                                />
                              }
                              label="Required question"
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <TextField
                        size="small"
                        label="Auto-generate count"
                        type="number"
                        value={questionGenCount}
                        onChange={(e) => setQuestionGenCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                        sx={{ width: 150 }}
                      />
                      <input
                        ref={questionDocInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void importQuestionsFromDocument(file);
                        }}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        onClick={() => questionDocInputRef.current?.click()}
                        disabled={generatingFromDoc}
                      >
                        {generatingFromDoc ? "Extracting..." : "Upload & extract (OCR)"}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          setQuestions((prev) => [
                            ...prev,
                            { ...emptyQuestion(prev.length + 1), canvas_page: currentTemplatePage },
                          ])
                        }
                      >
                        Add question
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => void createExam()}
                        disabled={saving}
                        sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
                      >
                        {saving ? "Saving..." : editingId ? "Update exam" : "Save exam"}
                      </Button>
                    </Stack>
                    {ocrRawText || ocrParsedBlocks.length ? (
                      <Card variant="outlined" sx={{ mt: 1, borderColor: "#fecaca" }}>
                        <CardContent>
                          <Stack spacing={1.25}>
                            <Typography sx={{ fontWeight: 800 }}>OCR review before adding</Typography>
                            <TextField
                              label="Raw extracted text"
                              value={ocrRawText}
                              multiline
                              minRows={4}
                              maxRows={10}
                              InputProps={{ readOnly: true }}
                              fullWidth
                            />
                            <Typography variant="body2" color="text.secondary">
                              Parsed question blocks (edit text, merge/split quickly, then add to exam).
                            </Typography>
                            <Stack spacing={1}>
                              {ocrParsedBlocks.map((b, idx) => (
                                <Card key={b.id || idx} variant="outlined">
                                  <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                                    <Stack spacing={1}>
                                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                        Block {idx + 1}
                                      </Typography>
                                      <TextField
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        value={b.text || ""}
                                        onChange={(e) => updateOcrBlockText(idx, e.target.value)}
                                      />
                                      <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Button size="small" variant="outlined" onClick={() => splitOcrBlock(idx)}>
                                          Split
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={idx >= ocrParsedBlocks.length - 1}
                                          onClick={() => mergeOcrBlockWithNext(idx)}
                                        >
                                          Merge with next
                                        </Button>
                                        <Button size="small" color="error" variant="outlined" onClick={() => removeOcrBlock(idx)}>
                                          Remove
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Button variant="contained" onClick={addOcrBlocksToQuestions} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}>
                                Add reviewed blocks to exam
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setOcrParsedBlocks([]);
                                  setOcrRawText("");
                                }}
                              >
                                Clear OCR review
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    ) : null}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, mt: 1 }}>Template + question placement</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Drag each question block to where it should appear in the selected template.
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Template page
                    </Typography>
                    <Select
                      size="small"
                      value={currentTemplatePage}
                      onChange={(e) => setCurrentTemplatePage(Number(e.target.value) || 0)}
                      sx={{ minWidth: 120 }}
                    >
                      {selectedTemplatePages.map((p, idx) => (
                        <MenuItem key={p.id || idx} value={idx}>
                          {`Page ${idx + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button size="small" variant="outlined" onClick={addBlankTemplatePageForExam} sx={{ whiteSpace: "nowrap" }}>
                      Add page
                    </Button>
                    <Button size="small" variant="outlined" onClick={duplicateCurrentTemplatePageForExam} sx={{ whiteSpace: "nowrap" }}>
                      Duplicate page
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => void deleteCurrentTemplatePageForExam()}
                      disabled={selectedTemplatePages.length <= 1}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Delete page
                    </Button>
                  </Stack>
                  <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems="flex-start">
                    <Stack spacing={1} sx={{ width: { xs: "100%", lg: 260 }, flexShrink: 0 }}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name W"
                          type="number"
                          value={examLayout.name.w}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, name: { ...prev.name, w: Math.max(120, Number(e.target.value) || 120) } }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Name H"
                          type="number"
                          value={examLayout.name.h}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, name: { ...prev.name, h: Math.max(24, Number(e.target.value) || 24) } }))}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Instructions W"
                          type="number"
                          value={examLayout.instructions.w}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, instructions: { ...prev.instructions, w: Math.max(120, Number(e.target.value) || 120) } }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Instructions H"
                          type="number"
                          value={examLayout.instructions.h}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, instructions: { ...prev.instructions, h: Math.max(24, Number(e.target.value) || 24) } }))}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Duration W"
                          type="number"
                          value={examLayout.duration.w}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, duration: { ...prev.duration, w: Math.max(120, Number(e.target.value) || 120) } }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Duration H"
                          type="number"
                          value={examLayout.duration.h}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, duration: { ...prev.duration, h: Math.max(24, Number(e.target.value) || 24) } }))}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Pass W"
                          type="number"
                          value={examLayout.passing_marks.w}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, passing_marks: { ...prev.passing_marks, w: Math.max(120, Number(e.target.value) || 120) } }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Pass H"
                          type="number"
                          value={examLayout.passing_marks.h}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, passing_marks: { ...prev.passing_marks, h: Math.max(24, Number(e.target.value) || 24) } }))}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Total W"
                          type="number"
                          value={examLayout.total_marks.w}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, total_marks: { ...prev.total_marks, w: Math.max(120, Number(e.target.value) || 120) } }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Total H"
                          type="number"
                          value={examLayout.total_marks.h}
                          onChange={(e) => setExamLayout((prev) => ({ ...prev, total_marks: { ...prev.total_marks, h: Math.max(24, Number(e.target.value) || 24) } }))}
                        />
                      </Stack>
                    </Stack>
                    <Box
                      ref={questionCanvasRef}
                      sx={{
                        width: 595,
                        height: 842,
                        position: "relative",
                        mx: { xs: "auto", xl: 0 },
                        bgcolor: "#fff",
                        border: "1px solid #d1d5db",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                        overflow: "hidden",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                        backgroundImage:
                          "linear-gradient(to right, rgba(156,163,175,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(156,163,175,0.2) 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    >
                    {selectedTemplateElementsForCanvas.map((el, index) => (
                      <Box
                        key={`${el.id || "el"}-${index}`}
                        sx={{
                          position: "absolute",
                          left: el.x || 0,
                          top: el.y || 0,
                          width: el.w || 180,
                          height: el.h || 30,
                          px: 0.7,
                          fontSize: el.fontSize || 14,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {el.type === "school_logo" ? (
                          schoolProfile?.logo_url ? (
                            <Box component="img" src={schoolProfile.logo_url.startsWith("/") ? schoolProfile.logo_url : `/${schoolProfile.logo_url}`} alt="School logo" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            "[School Logo]"
                          )
                        ) : (
                          renderTemplateText(el, schoolProfile)
                        )}
                      </Box>
                    ))}
                    {[
                      { key: "name", label: `Name: ${name || "Untitled exam"}` },
                      { key: "instructions", label: `Instructions:\n${instructions || "-"}` },
                      { key: "duration", label: `Duration: ${duration || 0} min` },
                      { key: "passing_marks", label: `Pass mark: ${passingMarks || 0}` },
                      { key: "total_marks", label: `Total marks: ${totalMarks || 0}` },
                    ].map((meta) => {
                      const row = examLayout?.[meta.key] || {};
                      return (
                        <Box
                          key={`meta-${meta.key}`}
                          onMouseDown={(e) => startExamMetaDrag(e, meta.key)}
                          sx={{
                            position: "absolute",
                            left: Number(row.x || 0),
                            top: Number(row.y || 0),
                            width: Number(row.w || 220),
                            height: Number(row.h || 24),
                            px: 1,
                            py: 0.35,
                            border: "1px dashed #9ca3af",
                            bgcolor: "rgba(239,246,255,0.95)",
                            cursor: "move",
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#111827",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {meta.label}
                        </Box>
                      );
                    })}
                    {questions
                      .filter((q) => (Number.isFinite(Number(q.canvas_page)) ? Number(q.canvas_page) : 0) === currentTemplatePage)
                      .map((q, index) => (
                      <Box
                        key={`q-canvas-${q.key}`}
                        onMouseDown={(e) => startQuestionDrag(e, q.key)}
                        sx={{
                          position: "absolute",
                          left: Number(q.canvas_x || 0),
                          top: Number(q.canvas_y || 0),
                          width: Number(q.canvas_w || 520),
                          height: Math.max(
                            Number(q.canvas_h || 26),
                            ["multiple_choice", "multi_select", "true_false"].includes(String(q.question_type || "")) ? 74 : 26
                          ),
                          border: "1px dashed #dc2626",
                          bgcolor: "rgba(255,255,255,0.95)",
                          cursor: "move",
                          fontSize: 12.5,
                          fontWeight: 600,
                          whiteSpace: "pre-line",
                          lineHeight: 1.35,
                          overflow: "hidden",
                        }}
                      >
                        <Typography component="div" sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, mb: 0.25 }}>
                          {renderCanvasQuestionText(q, index)}
                        </Typography>
                        {renderCanvasChoiceControls(q, "create-canvas")}
                        <Box
                          onMouseDown={(e) => startQuestionResize(e, q.key)}
                          sx={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 12,
                            height: 12,
                            bgcolor: "#dc2626",
                            cursor: "nwse-resize",
                            borderTopLeftRadius: 2,
                          }}
                        />
                      </Box>
                    ))}
                    {questions
                      .filter(
                        (q) =>
                          q.question_type === "diagram_label" &&
                          q.diagram_data &&
                          (Number.isFinite(Number(q.diagram_canvas_page)) ? Number(q.diagram_canvas_page) : 0) === currentTemplatePage
                      )
                      .map((q, idx) => (
                        <Box
                          key={`diag-canvas-${q.key}`}
                          onMouseDown={(e) => startDiagramDrag(e, q.key)}
                          sx={{
                            position: "absolute",
                            left: Number(q.diagram_canvas_x || 0),
                            top: Number(q.diagram_canvas_y || 0),
                            width: Number(q.diagram_canvas_w || 260),
                            height: Number(q.diagram_canvas_h || 180),
                            border: "1px dashed #2563eb",
                            bgcolor: "rgba(255,255,255,0.96)",
                            cursor: "move",
                            overflow: "hidden",
                          }}
                        >
                          <Box component="img" src={q.diagram_data} alt="Diagram preview" sx={{ width: "100%", height: "100%", objectFit: "contain", bgcolor: "#fff" }} />
                          <Box
                            sx={{
                              position: "absolute",
                              left: 4,
                              top: 4,
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.5,
                              bgcolor: "rgba(255,255,255,0.9)",
                              color: "#111827",
                              fontSize: 11,
                              lineHeight: 1.1,
                            }}
                          >
                            Diagram {idx + 1}
                          </Box>
                          <Box
                            onMouseDown={(e) => startDiagramResize(e, q.key)}
                            sx={{
                              position: "absolute",
                              right: 0,
                              bottom: 0,
                              width: 12,
                              height: 12,
                              bgcolor: "#2563eb",
                              cursor: "nwse-resize",
                              borderTopLeftRadius: 2,
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
        <Typography sx={{ fontWeight: 800 }}>Exams</Typography>
      </Stack>
      <Card elevation={0} sx={{ border: "1px solid #fecaca" }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} />
            </Box>
          ) : rows.length === 0 ? (
            <Typography color="text.secondary">No exams created yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={70}>No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{r.title || r.name}</TableCell>
                    <TableCell>{r.template?.name || templateMap.get(String(r.template_id))?.name || "-"}</TableCell>
                    <TableCell>{r.status || "draft"}</TableCell>
                    <TableCell>{r.duration_minutes} min</TableCell>
                    <TableCell>{Array.isArray(r.questions) ? r.questions.length : 0}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => setViewRow(r)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Student preview test" onClick={() => openStudentPreview(r)}>
                        <PlayCircleOutlineIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => startEditExam(r)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Duplicate exam" onClick={() => void duplicateExam(r)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="View submissions and mark"
                        onClick={() =>
                          navigate(`/exam/${r.id}/submissions`, {
                            state: { examTitle: r.title || r.name || "Exam" },
                          })
                        }
                      >
                        <FactCheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Edit status" onClick={() => openStatusDialog(r)}>
                        <PublishedWithChangesIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => void deleteExam(r)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!statusEditRow} onClose={() => !statusSaving && setStatusEditRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Update exam status</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {statusEditRow?.title || statusEditRow?.name || "Exam"}
            </Typography>
            <Select fullWidth value={statusEditValue} onChange={(e) => setStatusEditValue(e.target.value)} disabled={statusSaving}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusEditRow(null)} disabled={statusSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void saveExamStatusOnly()} disabled={statusSaving}>
            {statusSaving ? "Saving..." : "Save status"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!markingRow} onClose={() => setMarkingRow(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Submissions and marking - {markingRow?.title || markingRow?.name || "Exam"}
        </DialogTitle>
        <DialogContent>
          {markingLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : markingError ? (
            <Alert severity="error">{markingError}</Alert>
          ) : markingSubmissions.length === 0 ? (
            <Alert severity="info">No student submissions yet for this exam.</Alert>
          ) : (
            <Stack spacing={1.25}>
              {markingSubmissions.map((s, idx) => (
                <Card key={s.id} variant="outlined">
                  <CardContent sx={{ p: 1.25, "&:last-child": { pb: 1.25 } }}>
                    <Stack spacing={1}>
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Typography sx={{ fontWeight: 800 }}>
                          {idx + 1}. {s.student?.user?.full_name || s.student?.user?.username || "Student"}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Typography variant="caption" color="text.secondary">Status: {s.status || "draft"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                          </Typography>
                        </Stack>
                      </Stack>
                      {Array.isArray(s.answers) && s.answers.length ? (
                        <Box sx={{ maxHeight: 180, overflow: "auto", border: "1px solid #eee", borderRadius: 1, p: 1 }}>
                          <Stack spacing={0.75}>
                            {s.answers.map((a) => (
                              <Box key={a.id}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {a.order_number || "Q"}: {a.question_text}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                                  {a.answer_text || (a.answer_json != null ? JSON.stringify(a.answer_json) : "—")}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No answers captured.</Typography>
                      )}
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                        <TextField
                          size="small"
                          label="Total score"
                          type="number"
                          value={markInputs[s.id] ?? ""}
                          onChange={(e) => setMarkInputs((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          sx={{ width: { xs: "100%", sm: 180 } }}
                        />
                        <Button
                          variant="contained"
                          onClick={() => void saveSubmissionMark(s.id)}
                          disabled={markSavingId === s.id || s.status !== "submitted"}
                          sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
                        >
                          {markSavingId === s.id ? "Saving..." : "Save mark"}
                        </Button>
                        {s.marking?.total_score != null ? (
                          <Typography variant="body2" color="text.secondary">
                            Saved: {s.marking.total_score} ({s.marking.percentage ?? 0}% · {s.marking.is_passed ? "Pass" : "Fail"})
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="warning"
            onClick={() => void runCleanupStaleDrafts()}
            disabled={cleanupRunning || markingLoading}
          >
            {cleanupRunning ? "Cleaning..." : "Clean stale drafts"}
          </Button>
          <Button onClick={() => setMarkingRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="md" fullWidth>
        <DialogTitle>Exam preview - {viewRow?.title || viewRow?.name || ""}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} ref={previewPagesContainerRef}>
            {previewPages.map((page) => (
              <Box
                key={`preview-page-${page.pageNo}`}
                data-exam-preview-page="true"
                sx={{
                  width: 595,
                  height: 842,
                  position: "relative",
                  mx: "auto",
                  bgcolor: "#fff",
                  border: "1px solid #d1d5db",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                {page.templateElements.map((el, index) => (
                  <Box
                    key={`${page.pageNo}-${el.id || "el"}-${index}`}
                    sx={{
                      position: "absolute",
                      left: el.x || 0,
                      top: el.y || 0,
                      width: el.w || 180,
                      height: el.h || 30,
                      px: 0.7,
                      fontSize: el.fontSize || 14,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {el.type === "school_logo" ? (
                      schoolProfile?.logo_url ? (
                        <Box component="img" src={schoolProfile.logo_url.startsWith("/") ? schoolProfile.logo_url : `/${schoolProfile.logo_url}`} alt="School logo" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        "[School Logo]"
                      )
                    ) : (
                      renderTemplateText(el, schoolProfile)
                    )}
                  </Box>
                ))}
                {page.metaBlocks.map((meta) => (
                  <Box
                    key={`${page.pageNo}-meta-${meta.key}`}
                    sx={{
                      position: "absolute",
                      left: Number(meta.x || 0),
                      top: Number(meta.y || 0),
                      width: Number(meta.w || 220),
                      height: Number(meta.h || 24),
                      px: 1,
                      py: 0.35,
                      bgcolor: "rgba(255,255,255,0.98)",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#111827",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {meta.text}
                  </Box>
                ))}
                {page.questions.map((q, index) => (
                  <Box
                    key={`${page.pageNo}-q-${q.id || index}`}
                    sx={{
                      position: "absolute",
                      left: Number(q.page_x || 36),
                      top: Number(q.page_y || 120 + index * 34),
                      width: Number(q.page_w || 520),
                      height: Math.max(
                        Number(q.canvas_h || 26),
                        ["multiple_choice", "multi_select", "true_false"].includes(String(q.question_type || "")) ? 74 : 26
                      ),
                      px: 1,
                      py: 0.35,
                      bgcolor: "rgba(255,255,255,0.98)",
                      fontSize: 12.5,
                      fontWeight: 600,
                      whiteSpace: "pre-line",
                      lineHeight: 1.35,
                    }}
                  >
                    <Typography component="div" sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, mb: 0.25 }}>
                      {renderCanvasQuestionText(q, index)}
                    </Typography>
                    {renderCanvasChoiceControls(q, "saved-preview")}
                  </Box>
                ))}
                {page.questions
                  .filter((q) => q.question_type === "diagram_label" && q.diagram_data)
                  .map((q, index) => (
                    <Box
                      key={`${page.pageNo}-diagram-${q.id || index}`}
                      sx={{
                        position: "absolute",
                        left: Number(q?.options?.diagram_position?.x ?? q.diagram_canvas_x ?? 40),
                        top: Number(q?.options?.diagram_position?.y ?? q.diagram_canvas_y ?? 220),
                        width: Number(q?.options?.diagram_position?.w ?? q.diagram_canvas_w ?? 260),
                        height: Number(q?.options?.diagram_position?.h ?? q.diagram_canvas_h ?? 180),
                        bgcolor: "rgba(255,255,255,0.98)",
                        overflow: "hidden",
                      }}
                    >
                      <Box component="img" src={q.diagram_data} alt="Diagram question" sx={{ width: "100%", height: "100%", objectFit: "contain", bgcolor: "#fff" }} />
                    </Box>
                  ))}
                <Typography sx={{ position: "absolute", right: 18, bottom: 10, fontSize: 11, color: "text.secondary" }}>Page {page.pageNo}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => void downloadExamWord()}>Download Word</Button>
          <Button onClick={() => void downloadExamPdf()}>Download PDF</Button>
          <Button onClick={() => setViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!simulateRow} onClose={() => setSimulateRow(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Student real-time preview - {simulateRow?.title || simulateRow?.name || ""}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {simulatePages.map((page) => (
              <Box key={`simulate-page-${page.pageNo}`} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, bgcolor: "#fff" }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Page {page.pageNo}</Typography>
                <Stack spacing={1.25}>
                  {page.questions
                    .slice()
                    .sort((a, b) => Number(a.page_y || 0) - Number(b.page_y || 0))
                    .map((q, idx) => {
                      const qKey = String(q.id || q.key || `${page.pageNo}-${idx + 1}`);
                      const choiceOptions = parseQuestionOptions(q);
                      return (
                        <Box key={`simulate-q-${qKey}`} sx={{ border: "1px solid #f3f4f6", borderRadius: 1.5, p: 1.25 }}>
                          <Typography sx={{ fontWeight: 700, mb: 0.75 }}>
                            {q.order_number || idx + 1}. {q.question_text || "Question"} ({Number(q.marks) || 0} marks) {q.required ? "(Required)" : ""}
                          </Typography>
                          {q.question_type === "short_text" ? (
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Student writes short answer here"
                              value={String(simulateAnswers[qKey] || "")}
                              onChange={(e) => setSimulateAnswers((prev) => ({ ...prev, [qKey]: e.target.value }))}
                            />
                          ) : null}
                          {q.question_type === "true_false" ? (
                            <RadioGroup
                              value={String(simulateAnswers[qKey] || "")}
                              onChange={(e) => setSimulateAnswers((prev) => ({ ...prev, [qKey]: e.target.value }))}
                            >
                              <FormControlLabel value="True" control={<Radio size="small" />} label="True" />
                              <FormControlLabel value="False" control={<Radio size="small" />} label="False" />
                            </RadioGroup>
                          ) : null}
                          {q.question_type === "multiple_choice" ? (
                            <RadioGroup
                              value={String(simulateAnswers[qKey] || "")}
                              onChange={(e) => setSimulateAnswers((prev) => ({ ...prev, [qKey]: e.target.value }))}
                            >
                              {choiceOptions.map((opt) => (
                                <FormControlLabel
                                  key={`${qKey}-radio-${opt}`}
                                  value={opt}
                                  control={<Radio size="small" />}
                                  label={opt}
                                />
                              ))}
                            </RadioGroup>
                          ) : null}
                          {q.question_type === "multi_select" ? (
                            <Stack spacing={0.25}>
                              {choiceOptions.map((opt) => {
                                const selectedValues = Array.isArray(simulateAnswers[qKey]) ? simulateAnswers[qKey] : [];
                                const checked = selectedValues.includes(opt);
                                return (
                                  <FormControlLabel
                                    key={`${qKey}-check-${opt}`}
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={checked}
                                        onChange={(e) =>
                                          setSimulateAnswers((prev) => {
                                            const curr = Array.isArray(prev[qKey]) ? prev[qKey] : [];
                                            return {
                                              ...prev,
                                              [qKey]: e.target.checked ? [...curr, opt] : curr.filter((x) => x !== opt),
                                            };
                                          })
                                        }
                                      />
                                    }
                                    label={opt}
                                  />
                                );
                              })}
                            </Stack>
                          ) : null}
                          {q.question_type === "diagram_label" ? (
                            <Stack spacing={1}>
                              {q.diagram_data ? (
                                <Box sx={{ width: "100%", maxHeight: 220, position: "relative", border: "1px solid #e5e7eb", borderRadius: 1, overflow: "hidden" }}>
                                  <Box component="img" src={q.diagram_data} alt="Diagram" sx={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }} />
                                </Box>
                              ) : null}
                              {(Array.isArray(q?.options?.hotspots) ? q.options.hotspots : []).map((hs, hsIdx) => {
                                const hsKey = String(hs.id || hsIdx + 1);
                                return (
                                  <TextField
                                    key={`${qKey}-hs-${hsKey}`}
                                    fullWidth
                                    size="small"
                                    label={hs.prompt || `Label ${hsIdx + 1}`}
                                    placeholder="Student enters label"
                                    value={String(simulateAnswers[qKey]?.[hsKey] || "")}
                                    onChange={(e) =>
                                      setSimulateAnswers((prev) => ({
                                        ...prev,
                                        [qKey]: { ...(prev[qKey] || {}), [hsKey]: e.target.value },
                                      }))
                                    }
                                  />
                                );
                              })}
                            </Stack>
                          ) : null}
                        </Box>
                      );
                    })}
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              const attempted = Object.values(simulateAnswers || {}).filter((v) => {
                if (Array.isArray(v)) return v.length > 0;
                if (v && typeof v === "object") return Object.values(v).some((x) => String(x || "").trim());
                return String(v || "").trim().length > 0;
              }).length;
              void Swal.fire({
                icon: "info",
                title: "Preview attempt summary",
                text: `Attempted ${attempted} question(s) in student preview mode.`,
              });
            }}
          >
            Check attempt
          </Button>
          <Button onClick={() => setSimulateRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
