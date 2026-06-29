/** Parse choice options from assignment question records (matches exam-style flexibility). */
export function parseAssignmentChoices(q) {
  const opts = q?.options;
  if (opts && typeof opts === "object" && !Array.isArray(opts) && Array.isArray(opts.choices)) {
    const raw = opts.choices.map((c) => String(c || "").trim()).filter(Boolean);
    if (raw.length === 1 && raw[0].includes(",")) {
      return raw[0].split(",").map((s) => s.trim()).filter(Boolean);
    }
    return raw;
  }
  if (Array.isArray(opts)) return opts.map((o) => String(o || "").trim()).filter(Boolean);
  if (typeof opts === "string") return opts.split(",").map((o) => o.trim()).filter(Boolean);
  if (typeof q?.options_text === "string") {
    return q.options_text.split(",").map((o) => o.trim()).filter(Boolean);
  }
  return [];
}

export function parseChoicesInput(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  if (raw.includes("\n")) {
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatChoicesForInput(choices) {
  if (!Array.isArray(choices) || !choices.length) return "";
  return choices.join("\n");
}

export function fileUploadConfig(q) {
  const o = q?.options && typeof q.options === "object" && !Array.isArray(q.options) ? q.options : {};
  const accept = Array.isArray(o.accept) ? o.accept : ["image/*", "application/pdf"];
  return {
    accept,
    maxFiles: Math.min(5, Math.max(1, Number(o.max_files) || 1)),
    maxSizeMb: Math.min(25, Math.max(1, Number(o.max_size_mb) || 10)),
    hint: String(o.upload_hint || "").trim(),
  };
}

export function defaultAnswerForQuestionType(questionType) {
  if (questionType === "multi_select") return [];
  if (questionType === "file_upload") return { files: [] };
  return "";
}
