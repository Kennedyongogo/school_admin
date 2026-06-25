export const WHITEBOARD_DOCUMENT_STROKE_ID = "__live_class_document__";

const DOCUMENT_PADDING = 16;

export function drawPenStroke(ctx, stroke, width, height) {
  const points = stroke?.points;
  if (!Array.isArray(points) || points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = ((stroke.width || 3) * Math.max(width, height)) / 600;
  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = Math.max(ctx.lineWidth, 12);
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color || "#1565c0";
  }
  ctx.beginPath();
  ctx.moveTo(points[0][0] * width, points[0][1] * height);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0] * width, points[i][1] * height);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawTextStroke(ctx, stroke, width, height) {
  const text = stroke?.text != null ? String(stroke.text) : "";
  if (!text) return;
  ctx.save();
  const scale = Math.max(width, height) / 600;
  const fontSize = Math.max(12, (stroke.fontSize || 18) * scale);
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = stroke.color || "#1565c0";
  ctx.textBaseline = "top";
  const lines = text.split("\n");
  const lineHeight = fontSize * 1.25;
  const x = (stroke.x || 0) * width;
  const y = (stroke.y || 0) * height;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  ctx.restore();
}

export function drawDocumentStroke(ctx, stroke, width, height) {
  const text = stroke?.text != null ? String(stroke.text) : "";
  if (!text) return;
  ctx.save();
  const scale = Math.max(width, height) / 600;
  const fontSize = Math.max(12, (stroke.fontSize || 18) * scale);
  const lineHeight = fontSize * 1.5;
  ctx.font = `400 ${fontSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.fillStyle = stroke.color || "#212121";
  ctx.textBaseline = "top";
  const maxWidth = width - DOCUMENT_PADDING * 2;
  let y = DOCUMENT_PADDING;
  const paragraphs = text.split("\n");
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      y += lineHeight;
      continue;
    }
    const words = paragraph.split(/(\s+)/);
    let line = "";
    for (const word of words) {
      const nextLine = line + word;
      if (line && ctx.measureText(nextLine).width > maxWidth) {
        ctx.fillText(line, DOCUMENT_PADDING, y);
        y += lineHeight;
        line = word.trimStart();
      } else {
        line = nextLine;
      }
    }
    if (line) {
      ctx.fillText(line, DOCUMENT_PADDING, y);
      y += lineHeight;
    }
  }
  ctx.restore();
}

export function drawWhiteboardItem(ctx, stroke, width, height) {
  if (stroke?.tool === "document") {
    drawDocumentStroke(ctx, stroke, width, height);
    return;
  }
  if (stroke?.tool === "text") {
    drawTextStroke(ctx, stroke, width, height);
    return;
  }
  drawPenStroke(ctx, stroke, width, height);
}

export function redrawWhiteboardCanvas(canvas, strokes) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  for (const stroke of strokes) {
    drawWhiteboardItem(ctx, stroke, width, height);
  }
}

export function findDocumentStroke(strokes) {
  if (!Array.isArray(strokes)) return null;
  return (
    strokes.find((s) => s.tool === "document" || s.id === WHITEBOARD_DOCUMENT_STROKE_ID) || null
  );
}
