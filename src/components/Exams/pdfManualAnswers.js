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
  return raw.map((file, index) => ({
    id: String(file?.id || `paper-${index + 1}`),
    url: String(file?.url || "").trim(),
    name: String(file?.name || "").trim(),
    mime: String(file?.mime || "").trim(),
    size: Number.isFinite(Number(file?.size)) ? Number(file.size) : null,
    uploaded_at: file?.uploaded_at || null,
  }));
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
