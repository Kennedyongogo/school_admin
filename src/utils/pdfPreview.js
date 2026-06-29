import { useEffect, useRef, useState } from "react";
import { getCachedExamPdfBlobUrl, peekCachedExamPdfBlobUrl, clearCachedExamPdfBlobUrl } from "./pdfExamBlobCache";

/** Blob URL for a local File (e.g. before upload). Revoked on change/unmount. */
export function useLocalPdfPreview(file) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!file) {
      setUrl("");
      return undefined;
    }
    const blobUrl = URL.createObjectURL(file);
    setUrl(blobUrl);
    return () => URL.revokeObjectURL(blobUrl);
  }, [file]);

  return url;
}

/** Blob URL for a server PDF, cached by id (exam or assignment). */
export function useFetchedPdfPreview({ id, hasPdf, fetchBlob, enabled = true, cacheVersion = "" }) {
  const [url, setUrl] = useState(() => (id && hasPdf ? peekCachedExamPdfBlobUrl(id) : "") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastCacheVersion = useRef("");

  useEffect(() => {
    if (!enabled || !id || !hasPdf || !fetchBlob) {
      if (!hasPdf) {
        setUrl("");
        setLoading(false);
        setError("");
      }
      return undefined;
    }

    let cancelled = false;
    if (cacheVersion && cacheVersion !== lastCacheVersion.current) {
      clearCachedExamPdfBlobUrl(id);
      lastCacheVersion.current = cacheVersion;
    }

    const cached = peekCachedExamPdfBlobUrl(id);
    if (cached) {
      setUrl(cached);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    setError("");
    getCachedExamPdfBlobUrl(id, fetchBlob)
      .then((blobUrl) => {
        if (!cancelled) setUrl(blobUrl);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Could not load PDF.");
          setUrl("");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, hasPdf, enabled, fetchBlob, cacheVersion]);

  return { url, loading, error };
}
