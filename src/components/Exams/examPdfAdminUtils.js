import {
  clearCachedExamPdfBlobUrl,
  getCachedExamPdfBlobUrl,
} from "../../utils/pdfExamBlobCache";

export const isPdfFormExamRow = (exam) =>
  String(exam?.exam_type || "").trim() === "pdf_form" || Boolean(exam?.pdf_template_path);

export async function fetchExamPdfTemplateBlob(examId, token) {
  const res = await fetch(`/api/exams/${encodeURIComponent(examId)}/pdf-template`, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : { Accept: "application/pdf" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Could not load exam PDF.");
  }
  return res.blob();
}

export async function fetchExamPdfBlobUrl(examId, token) {
  return getCachedExamPdfBlobUrl(examId, () => fetchExamPdfTemplateBlob(examId, token));
}

export { clearCachedExamPdfBlobUrl };
