import { getCachedExamPdfBlobUrl } from "../../utils/pdfExamBlobCache";

export const isPdfFormAssignmentRow = (assignment) =>
  String(assignment?.assignment_type || "").trim() === "pdf_form" || Boolean(assignment?.pdf_template_path);

export async function fetchAssignmentPdfTemplateBlob(assignmentId, token) {
  const res = await fetch(`/api/assignments/${encodeURIComponent(assignmentId)}/pdf-template`, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" } : { Accept: "application/pdf" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Could not load assignment PDF.");
  }
  return res.blob();
}

export async function fetchAssignmentPdfBlobUrl(assignmentId, token) {
  return getCachedExamPdfBlobUrl(assignmentId, () => fetchAssignmentPdfTemplateBlob(assignmentId, token));
}
