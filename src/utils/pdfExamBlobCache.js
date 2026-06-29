/** Reuse blob URLs per exam so remounts do not re-download or flash the PDF iframe. */
const urlByExamId = new Map();
const inflightByExamId = new Map();

export async function getCachedExamPdfBlobUrl(examId, fetchBlob) {
  const key = String(examId || "").trim();
  if (!key) throw new Error("Exam id is required to load PDF.");

  if (urlByExamId.has(key)) {
    return urlByExamId.get(key);
  }

  if (inflightByExamId.has(key)) {
    return inflightByExamId.get(key);
  }

  const promise = (async () => {
    const blob = await fetchBlob();
    const url = URL.createObjectURL(blob);
    urlByExamId.set(key, url);
    inflightByExamId.delete(key);
    return url;
  })().catch((error) => {
    inflightByExamId.delete(key);
    throw error;
  });

  inflightByExamId.set(key, promise);
  return promise;
}

export function peekCachedExamPdfBlobUrl(examId) {
  const key = String(examId || "").trim();
  return key ? urlByExamId.get(key) || "" : "";
}

export function clearCachedExamPdfBlobUrl(examId) {
  const key = String(examId || "").trim();
  if (!key) return;
  const url = urlByExamId.get(key);
  if (url) URL.revokeObjectURL(url);
  urlByExamId.delete(key);
  inflightByExamId.delete(key);
}
