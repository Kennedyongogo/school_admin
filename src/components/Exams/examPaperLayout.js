export const defaultExamLayout = () => ({
  name: { x: 40, y: 80, w: 300, h: 24 },
  instructions: { x: 40, y: 115, w: 520, h: 30 },
  duration: { x: 420, y: 80, w: 140, h: 24 },
  passing_marks: { x: 40, y: 160, w: 180, h: 24 },
  total_marks: { x: 230, y: 160, w: 180, h: 24 },
});

export const renderTemplateText = (el, schoolProfile) => {
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

export const parseQuestionOptions = (q) => {
  if (Array.isArray(q?.options)) return q.options.map((o) => String(o || "").trim()).filter(Boolean);
  if (typeof q?.options === "string") return q.options.split(",").map((o) => o.trim()).filter(Boolean);
  if (typeof q?.options_text === "string") return q.options_text.split(",").map((o) => o.trim()).filter(Boolean);
  return [];
};

/** Build paginated template layout with question positions (matches exam preview / student paper). */
export const buildPreviewPages = (exam) => {
  if (!exam) return [];
  const layout = exam?.exam_layout_json && typeof exam.exam_layout_json === "object" ? exam.exam_layout_json : defaultExamLayout();
  const templatePages =
    Array.isArray(layout.template_pages_override) && layout.template_pages_override.length
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

export const resolveSubmissionAnswerValue = (answerRow) => {
  if (!answerRow) return "";
  if (answerRow.answer_json !== null && answerRow.answer_json !== undefined) return answerRow.answer_json;
  return answerRow.answer_text || "";
};
