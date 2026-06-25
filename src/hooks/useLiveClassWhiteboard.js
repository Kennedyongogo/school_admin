import { useCallback, useEffect, useRef, useState } from "react";
import { getApiBaseUrl } from "../utils/apiBaseUrl";
import { WHITEBOARD_DOCUMENT_STROKE_ID } from "../utils/whiteboardRender";

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function upsertStroke(prev, stroke) {
  const idx = prev.findIndex((s) => s.id === stroke.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = stroke;
    return next;
  }
  return [...prev, stroke];
}

function documentRevision(stroke) {
  return Number(stroke?.revision) || 0;
}

export function useLiveClassWhiteboard({ liveClassId, token, socket, canDraw = true }) {
  const [strokes, setStrokes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pendingIdsRef = useRef(new Set());
  const documentSaveGenerationRef = useRef(0);

  const load = useCallback(async () => {
    if (!liveClassId || !token) return;
    setLoading(true);
    setError("");
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/whiteboard`, {
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load whiteboard");
      setStrokes(Array.isArray(data.data?.strokes) ? data.data.strokes : []);
    } catch (e) {
      setError(e.message || "Failed to load whiteboard");
    } finally {
      setLoading(false);
    }
  }, [liveClassId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!socket || !liveClassId) return undefined;

    const joinRoom = () => socket.emit("join:live-class", liveClassId);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const onStroke = (payload) => {
      if (String(payload?.live_class_id) !== String(liveClassId) || !payload?.stroke?.id) return;

      const incoming = payload.stroke;
      const isOwnPending = pendingIdsRef.current.has(incoming.id);

      if (incoming.id === WHITEBOARD_DOCUMENT_STROKE_ID) {
        if (isOwnPending) return;
        setStrokes((prev) => {
          const current = prev.find((s) => s.id === incoming.id);
          if (current && documentRevision(incoming) < documentRevision(current)) return prev;
          return upsertStroke(prev, incoming);
        });
        return;
      }

      if (isOwnPending) return;
      setStrokes((prev) => upsertStroke(prev, incoming));
    };

    const onClear = (payload) => {
      if (String(payload?.live_class_id) !== String(liveClassId)) return;
      setStrokes([]);
    };

    socket.on("live-whiteboard:stroke", onStroke);
    socket.on("live-whiteboard:clear", onClear);
    return () => {
      socket.off("connect", joinRoom);
      socket.off("live-whiteboard:stroke", onStroke);
      socket.off("live-whiteboard:clear", onClear);
    };
  }, [socket, liveClassId]);

  const upsertStrokeLocal = useCallback((stroke) => {
    if (!stroke?.id) return;
    setStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === stroke.id);
      if (idx >= 0 && stroke.id === WHITEBOARD_DOCUMENT_STROKE_ID) {
        const next = [...prev];
        next[idx] = { ...stroke, revision: prev[idx].revision || 0 };
        return next;
      }
      return upsertStroke(prev, stroke);
    });
  }, []);

  const pushStroke = useCallback(
    async (stroke, { generation } = {}) => {
      if (!liveClassId || !token || !canDraw || !stroke) return null;
      const isDocument = stroke.id === WHITEBOARD_DOCUMENT_STROKE_ID;
      if (isDocument && generation != null) {
        documentSaveGenerationRef.current = Math.max(documentSaveGenerationRef.current, generation);
      }

      pendingIdsRef.current.add(stroke.id);
      setStrokes((prev) => upsertStroke(prev, stroke));

      try {
        const base = getApiBaseUrl();
        const res = await fetch(
          `${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/whiteboard/strokes`,
          {
            method: "POST",
            headers: authHeaders(token),
            body: JSON.stringify({ stroke }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Could not save stroke");

        if (isDocument && generation != null && generation < documentSaveGenerationRef.current) {
          return data.data;
        }

        if (data.data) {
          setStrokes((prev) => upsertStroke(prev, data.data));
        }
        return data.data;
      } catch (e) {
        if (isDocument) {
          setError(e.message || "Could not save annotation");
        } else {
          setStrokes((prev) => prev.filter((s) => s.id !== stroke.id));
          setError(e.message || "Could not save annotation");
        }
        return null;
      } finally {
        pendingIdsRef.current.delete(stroke.id);
      }
    },
    [liveClassId, token, canDraw]
  );

  const clearBoard = useCallback(async () => {
    if (!liveClassId || !token || !canDraw) return false;
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/school-portal/live-class/${encodeURIComponent(liveClassId)}/whiteboard`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not clear whiteboard");
      setStrokes([]);
      return true;
    } catch (e) {
      setError(e.message || "Could not clear whiteboard");
      return false;
    }
  }, [liveClassId, token, canDraw]);

  return { strokes, loading, error, pushStroke, upsertStrokeLocal, clearBoard, reload: load };
}
