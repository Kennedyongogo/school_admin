export const PDF_MANUAL_ANSWER_MODE = "manual";
export const PDF_MAX_WORKING_PAPERS = 20;

export function createManualAnswerEntry() {
  return {
    id: `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    question: "",
    answer: "",
  };
}

export function formatLegacyPdfAnswerValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value ?? "").trim();
}

export function normalizeWorkingPapers(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((file, index) => {
    const paper = {
      id: String(file?.id || `paper-${index + 1}`),
      url: String(file?.url || "").trim(),
      name: String(file?.name || "").trim(),
      mime: String(file?.mime || "").trim(),
      size: Number.isFinite(Number(file?.size)) ? Number(file.size) : null,
      uploaded_at: file?.uploaded_at || null,
    };
    const marked = file?.marked_return;
    if (marked && typeof marked === "object" && String(marked.url || "").trim()) {
      paper.marked_return = {
        url: String(marked.url || "").trim(),
        name: String(marked.name || "").trim(),
        mime: String(marked.mime || "").trim(),
        size: Number.isFinite(Number(marked.size)) ? Number(marked.size) : null,
        marked_at: marked.marked_at || null,
        marked_by_user_id: marked.marked_by_user_id != null ? String(marked.marked_by_user_id) : null,
      };
    }
    if (file?.marker_comment != null) {
      paper.marker_comment = String(file.marker_comment);
    }
    return paper;
  });
}

export function parseManualPdfAnswers(raw) {
  if (!raw || typeof raw !== "object") {
    return { mode: PDF_MANUAL_ANSWER_MODE, entries: [], working_papers: [] };
  }
  const working_papers = normalizeWorkingPapers(raw.working_papers);
  if (Array.isArray(raw.entries)) {
    return {
      mode: PDF_MANUAL_ANSWER_MODE,
      entries: raw.entries.map((entry, index) => ({
        id: String(entry?.id || `entry-${index + 1}`),
        question: String(entry?.question ?? ""),
        answer: String(entry?.answer ?? ""),
        marks_obtained:
          entry?.marks_obtained != null && entry.marks_obtained !== ""
            ? Number(entry.marks_obtained)
            : null,
        marker_comment: entry?.marker_comment != null ? String(entry.marker_comment) : null,
      })),
      working_papers,
    };
  }
  const legacyEntries = Object.entries(raw)
    .filter(([key]) => !["mode", "entries", "working_papers"].includes(key))
    .map(([key, value], index) => ({
      id: `legacy-${index + 1}`,
      question: key.replace(/^q/i, "Q"),
      answer: formatLegacyPdfAnswerValue(value),
    }));
  return {
    mode: PDF_MANUAL_ANSWER_MODE,
    entries: legacyEntries,
    working_papers,
  };
}

export function renderManualPdfAnswerRows(raw) {
  const { entries } = parseManualPdfAnswers(raw);
  return entries;
}

export function renderManualPdfWorkingPapers(raw) {
  const { working_papers } = parseManualPdfAnswers(raw);
  return working_papers;
}

export function isImageWorkingPaper(file) {
  return String(file?.mime || "").startsWith("image/");
}

export function isPdfWorkingPaper(file) {
  const mime = String(file?.mime || "").toLowerCase();
  return mime === "application/pdf" || String(file?.name || "").toLowerCase().endsWith(".pdf");
}

export function workingPaperHasMarkedReturn(file) {
  return Boolean(file?.marked_return?.url);
}

export function submissionHasManualPdfEntries(submission) {
  return renderManualPdfAnswerRows(submission?.pdf_answers_json).length > 0;
}
