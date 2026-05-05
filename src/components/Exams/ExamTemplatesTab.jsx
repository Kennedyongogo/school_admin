import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Visibility as VisibilityIcon } from "@mui/icons-material";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const accent = "#DC2626";
const accentDark = "#B91C1C";
const fieldLibrary = [
  { type: "school_logo", label: "School logo" },
  { type: "school_name", label: "School name" },
  { type: "curriculum", label: "Curriculum" },
  { type: "class", label: "Class" },
  { type: "term", label: "Term" },
  { type: "subject", label: "Subject" },
  { type: "website", label: "Website" },
  { type: "phone", label: "Phone" },
  { type: "address", label: "Address" },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function ExamTemplatesTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState("list"); // list | designer
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState("Untitled template");
  const [pages, setPages] = useState([{ id: uid(), elements: [] }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [curricula, setCurricula] = useState([]);
  const [classes, setClasses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const canvasRef = useRef(null);
  const viewCanvasRef = useRef(null);
  const viewPagesRef = useRef(null);
  const dragRef = useRef(null);
  const elements = useMemo(() => pages[currentPage]?.elements || [], [pages, currentPage]);

  const selected = useMemo(() => elements.find((e) => e.id === selectedId) || null, [elements, selectedId]);
  const dbOptions = useMemo(() => {
    if (!selected) return [];
    if (selected.type === "curriculum") return curricula;
    if (selected.type === "class") return classes;
    if (selected.type === "term") return levels;
    if (selected.type === "subject") return subjects;
    return [];
  }, [selected, curricula, classes, levels, subjects]);

  const loadTemplates = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/exam-templates?page=1&limit=100", { headers: authHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load exam templates");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setRows([]);
      setError(e.message || "Could not load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [curRes, clsRes, lvlRes, subRes, schRes] = await Promise.all([
          fetch("/api/curricula?limit=1000&page=1", { headers: authHeaders(token) }),
          fetch("/api/curricula/all-classes?limit=1000&page=1", { headers: authHeaders(token) }),
          fetch("/api/curricula/all-class-levels?limit=1000&page=1", { headers: authHeaders(token) }),
          fetch("/api/curricula/all-subjects?limit=1000&page=1", { headers: authHeaders(token) }),
          fetch("/api/school-profile/admin", { headers: authHeaders(token) }),
        ]);
        const [curJson, clsJson, lvlJson, subJson, schJson] = await Promise.all([
          curRes.json().catch(() => ({})),
          clsRes.json().catch(() => ({})),
          lvlRes.json().catch(() => ({})),
          subRes.json().catch(() => ({})),
          schRes.json().catch(() => ({})),
        ]);
        setCurricula(Array.isArray(curJson.data) ? curJson.data.map((x) => ({ id: x.id, name: x.name })) : []);
        setClasses(Array.isArray(clsJson.data) ? clsJson.data.map((x) => ({ id: x.id, name: x.name })) : []);
        setLevels(Array.isArray(lvlJson.data) ? lvlJson.data.map((x) => ({ id: x.id, name: x.name })) : []);
        setSubjects(Array.isArray(subJson.data) ? subJson.data.map((x) => ({ id: x.id, name: x.name })) : []);
        setSchoolProfile(schRes.ok && schJson.success ? schJson.data || null : null);
      } catch {
        // optional dataset
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const { id, dx, dy } = dragRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ev.clientX - rect.left - dx;
      const y = ev.clientY - rect.top - dy;
      setPages((prev) =>
        prev.map((p, idx) =>
          idx !== currentPage
            ? p
            : {
                ...p,
                elements: p.elements.map((el) =>
                  el.id === id
                    ? {
                        ...el,
                        x: clamp(Math.round(x), 0, 560),
                        y: clamp(Math.round(y), 0, 760),
                      }
                    : el
                ),
              }
        )
      );
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [currentPage]);

  const addField = (f) => {
    const row = {
      id: uid(),
      type: f.type,
      label: f.label,
      bind_id: null,
      x: 24,
      y: 24 + elements.length * 36,
      w: 180,
      h: 30,
      fontSize: 14,
    };
    setPages((prev) => prev.map((p, idx) => (idx === currentPage ? { ...p, elements: [...p.elements, row] } : p)));
    setSelectedId(row.id);
  };

  const startDrag = (ev, id) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    dragRef.current = { id, dx: ev.clientX - rect.left - el.x, dy: ev.clientY - rect.top - el.y };
    setSelectedId(id);
  };

  const resetDesigner = () => {
    setEditingId(null);
    setTemplateName("Untitled template");
    setPages([{ id: uid(), elements: [] }]);
    setCurrentPage(0);
    setSelectedId(null);
  };

  const saveTemplate = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }
    const name = templateName.trim();
    if (!name) {
      await Swal.fire({ icon: "error", title: "Name required", text: "Template name is required." });
      return;
    }
    setSaving(true);
    try {
      const body = {
        name,
        layout_json: { paper: { width: 595, height: 842 }, pages: pages.map((p) => ({ id: p.id || uid(), elements: p.elements || [] })) },
      };
      const url = editingId ? `/api/exam-templates/${editingId}` : "/api/exam-templates";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(token), body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save template");
      await Swal.fire({ icon: "success", title: editingId ? "Template updated" : "Template saved", timer: 1200, showConfirmButton: false });
      await loadTemplates();
      setEditingId(data.data?.id || editingId);
      setMode("list");
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const openTemplate = (row) => {
    setEditingId(row.id);
    setTemplateName(row.name || "Untitled template");
    const incomingPages = Array.isArray(row.layout_json?.pages)
      ? row.layout_json.pages
      : [{ id: uid(), elements: Array.isArray(row.layout_json?.elements) ? row.layout_json.elements : [] }];
    setPages(
      incomingPages.map((p) => ({
        id: p.id || uid(),
        elements: (Array.isArray(p.elements) ? p.elements : []).map((e) => ({
          ...e,
          id: e.id || uid(),
          bind_id: e.bind_id || null,
          w: e.w ?? 180,
          h: e.h ?? 30,
          fontSize: e.fontSize ?? 14,
        })),
      }))
    );
    setCurrentPage(0);
    setSelectedId(null);
    setMode("designer");
  };

  const removeTemplate = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirm = await Swal.fire({ icon: "warning", title: "Delete template?", text: row.name, showCancelButton: true, confirmButtonColor: accentDark });
    if (!confirm.isConfirmed) return;
    const res = await fetch(`/api/exam-templates/${row.id}`, { method: "DELETE", headers: authHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      await Swal.fire({ icon: "error", title: "Delete failed", text: data.message || "Delete failed" });
      return;
    }
    await loadTemplates();
    if (editingId === row.id) resetDesigner();
  };

  const updateSelected = (patch) => {
    if (!selectedId) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === currentPage ? { ...p, elements: p.elements.map((e) => (e.id === selectedId ? { ...e, ...patch } : e)) } : p
      )
    );
  };

  const startCreate = () => {
    resetDesigner();
    setMode("designer");
  };

  const addBlankPage = () => {
    setPages((prev) => {
      const next = [...prev, { id: uid(), elements: [] }];
      setCurrentPage(next.length - 1);
      setSelectedId(null);
      return next;
    });
  };

  const addPageFromCurrentTemplate = () => {
    setPages((prev) => {
      const source = prev[currentPage] || { elements: [] };
      const clonedElements = (Array.isArray(source.elements) ? source.elements : []).map((el) => ({
        ...el,
        id: uid(),
      }));
      const next = [...prev, { id: uid(), elements: clonedElements }];
      setCurrentPage(next.length - 1);
      setSelectedId(null);
      return next;
    });
  };

  const duplicateCurrentPage = () => {
    addPageFromCurrentTemplate();
  };

  const deleteCurrentPage = async () => {
    if (pages.length <= 1) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete current page?",
      text: `Page ${currentPage + 1}`,
      showCancelButton: true,
      confirmButtonColor: accentDark,
    });
    if (!confirm.isConfirmed) return;
    setPages((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, idx) => idx !== currentPage);
      const nextIndex = Math.max(0, currentPage - 1);
      setCurrentPage(Math.min(nextIndex, next.length - 1));
      setSelectedId(null);
      return next;
    });
  };

  const renderElementText = (el) => {
    if (el.type === "school_logo") return "[School Logo]";
    if (el.type === "school_name") return schoolProfile?.name || el.label || "School name";
    if (el.type === "website") return schoolProfile?.website || el.label || "Website";
    if (el.type === "phone") return schoolProfile?.phone || el.label || "Phone";
    if (el.type === "address") {
      const addr = [schoolProfile?.address, schoolProfile?.city, schoolProfile?.state, schoolProfile?.postal_code, schoolProfile?.country]
        .filter(Boolean)
        .join(", ");
      return addr || el.label || "Address";
    }
    return el.label;
  };

  const schoolLogoUrl = useMemo(() => {
    const raw = String(schoolProfile?.logo_url || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return raw.startsWith("/") ? raw : `/${raw}`;
  }, [schoolProfile]);

  const getLayoutPages = (layoutJson) => {
    if (Array.isArray(layoutJson?.pages) && layoutJson.pages.length > 0) return layoutJson.pages;
    return [{ id: "page-1", elements: Array.isArray(layoutJson?.elements) ? layoutJson.elements : [] }];
  };

  const downloadTemplatePdf = async () => {
    if (!viewRow) return;
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [595, 842] });
      const pageNodes = Array.from(viewPagesRef.current?.querySelectorAll("[data-template-preview-page='true']") || []);
      for (let i = 0; i < pageNodes.length; i += 1) {
        const canvas = await html2canvas(pageNodes[i], { backgroundColor: "#ffffff", scale: 2 });
        const img = canvas.toDataURL("image/png");
        if (i > 0) pdf.addPage([595, 842], "portrait");
        pdf.addImage(img, "PNG", 0, 0, 595, 842);
      }
      const safeName = String(viewRow.name || "exam-template").replace(/[^\w\-]+/g, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Export failed", text: e.message || "Could not generate PDF." });
    }
  };

  const downloadTemplateWord = async () => {
    if (!viewRow) return;
    try {
      const pageNodes = Array.from(viewPagesRef.current?.querySelectorAll("[data-template-preview-page='true']") || []);
      const images = [];
      for (let i = 0; i < pageNodes.length; i += 1) {
        const canvas = await html2canvas(pageNodes[i], { backgroundColor: "#ffffff", scale: 2 });
        images.push(canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, ""));
      }
      const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const htmlBody = images
        .map((_, idx) => `<div style="page-break-after:${idx < images.length - 1 ? "always" : "auto"};"><img src="file:///C:/template-image-${idx + 1}.png" style="width:595pt;height:842pt;display:block;" /></div>`)
        .join("");
      const imageParts = images
        .map(
          (base64, idx) => `--${boundary}
Content-Type: image/png
Content-Transfer-Encoding: base64
Content-Location: file:///C:/template-image-${idx + 1}.png

${base64}
`
        )
        .join("");
      const mhtml = `MIME-Version: 1.0
Content-Type: multipart/related; boundary="${boundary}"; type="text/html"

--${boundary}
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 8bit
Content-Location: file:///C:/template.html

<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #ffffff; }
    .page { width: 595pt; height: 842pt; }
    .page img { width: 595pt; height: 842pt; display: block; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>

${imageParts}--${boundary}--`;
      const blob = new Blob([mhtml], { type: "application/msword" });
      const safeName = String(viewRow.name || "exam-template").replace(/[^\w\-]+/g, "_");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Export failed", text: e.message || "Could not generate Word file." });
    }
  };

  if (mode === "list") {
    return (
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 800 }}>Exam templates</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={startCreate} sx={{ bgcolor: accent, "&:hover": { bgcolor: accentDark } }}>
            Create template
          </Button>
        </Stack>
        <Card elevation={0} sx={{ border: "1px solid #fecaca" }}>
          <CardContent>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : rows.length === 0 ? (
              <Typography color="text.secondary">No templates yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={72}>No</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ color: "text.secondary" }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setViewRow(r)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => openTemplate(r)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => void removeTemplate(r)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="md" fullWidth>
          <DialogTitle>Template preview - {viewRow?.name || ""}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} ref={viewPagesRef}>
              {getLayoutPages(viewRow?.layout_json).map((page, pageIdx) => (
                <Box
                  key={`preview-page-${page.id || pageIdx}`}
                  data-template-preview-page="true"
                  sx={{
                    width: 595,
                    height: 842,
                    position: "relative",
                    mx: "auto",
                    bgcolor: "#fff",
                    border: "1px solid #d1d5db",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}
                >
                  {(Array.isArray(page?.elements) ? page.elements : []).map((el) => (
                    <Box
                      key={el.id || uid()}
                      sx={{
                        position: "absolute",
                        left: el.x || 0,
                        top: el.y || 0,
                        width: el.w || 180,
                        height: el.h || 30,
                        px: 0.7,
                        fontSize: el.fontSize || 14,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {el.type === "school_logo" && schoolLogoUrl ? (
                        <Box component="img" src={schoolLogoUrl} alt="School logo" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        renderElementText(el)
                      )}
                    </Box>
                  ))}
                  <Typography sx={{ position: "absolute", right: 12, bottom: 8, fontSize: 11, color: "text.secondary" }}>Page {pageIdx + 1}</Typography>
                </Box>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => void downloadTemplateWord()}>Download Word</Button>
            <Button onClick={() => void downloadTemplatePdf()}>Download PDF</Button>
            <Button onClick={() => setViewRow(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
        <TextField label="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} size="small" sx={{ minWidth: 240, flex: 1 }} />
        <Button variant="outlined" onClick={() => setMode("list")} sx={{ whiteSpace: "nowrap" }}>
          Templates
        </Button>
        <Button variant="outlined" onClick={resetDesigner} sx={{ whiteSpace: "nowrap" }}>
          New
        </Button>
        <Button variant="contained" disabled={saving} onClick={() => void saveTemplate()} sx={{ bgcolor: accent, whiteSpace: "nowrap", "&:hover": { bgcolor: accentDark } }}>
          {saving ? "Saving..." : "Save template"}
        </Button>
        <Select size="small" value={currentPage} onChange={(e) => { setCurrentPage(Number(e.target.value) || 0); setSelectedId(null); }} sx={{ minWidth: 110 }}>
          {pages.map((p, idx) => (
            <MenuItem key={p.id || idx} value={idx}>
              {`Page ${idx + 1}`}
            </MenuItem>
          ))}
        </Select>
        <Button size="small" variant="outlined" onClick={addBlankPage} sx={{ whiteSpace: "nowrap" }}>
          Add blank page
        </Button>
        <Button size="small" variant="outlined" onClick={addPageFromCurrentTemplate} sx={{ whiteSpace: "nowrap" }}>
          Add page same template
        </Button>
        <Button size="small" variant="outlined" onClick={duplicateCurrentPage} sx={{ whiteSpace: "nowrap" }}>
          Duplicate
        </Button>
        <Button size="small" color="error" variant="outlined" onClick={() => void deleteCurrentPage()} disabled={pages.length <= 1} sx={{ whiteSpace: "nowrap" }}>
          Delete page
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="flex-start">
        <Card elevation={0} sx={{ width: { xs: "100%", lg: 300 }, border: "1px solid #fecaca" }}>
          <CardContent>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Template fields</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {fieldLibrary.map((f) => (
                <Button key={f.type} size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addField(f)}>
                  {f.label}
                </Button>
              ))}
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Selected field</Typography>
            {!selected ? (
              <Typography variant="body2" color="text.secondary">
                Select a field on the sheet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                <TextField size="small" label="Label text" value={selected.label} onChange={(e) => updateSelected({ label: e.target.value })} />
                {["curriculum", "class", "term", "subject"].includes(selected.type) ? (
                  <Select
                    size="small"
                    value={selected.bind_id || ""}
                    displayEmpty
                    onChange={(e) => {
                      const val = e.target.value;
                      const row = dbOptions.find((x) => String(x.id) === String(val));
                      updateSelected({ bind_id: val || null, label: row?.name || selected.label });
                    }}
                  >
                    <MenuItem value="">
                      <em>Select from database</em>
                    </MenuItem>
                    {dbOptions.map((o) => (
                      <MenuItem key={o.id} value={o.id}>
                        {o.name}
                      </MenuItem>
                    ))}
                  </Select>
                ) : null}
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="X" type="number" value={selected.x} onChange={(e) => updateSelected({ x: Number(e.target.value) || 0 })} />
                  <TextField size="small" label="Y" type="number" value={selected.y} onChange={(e) => updateSelected({ y: Number(e.target.value) || 0 })} />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="W" type="number" value={selected.w} onChange={(e) => updateSelected({ w: Number(e.target.value) || 80 })} />
                  <TextField size="small" label="H" type="number" value={selected.h} onChange={(e) => updateSelected({ h: Number(e.target.value) || 24 })} />
                </Stack>
                <TextField size="small" label="Font" type="number" value={selected.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) || 12 })} />
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    setPages((prev) =>
                      prev.map((p, idx) =>
                        idx === currentPage ? { ...p, elements: p.elements.filter((e) => e.id !== selected.id) } : p
                      )
                    );
                    setSelectedId(null);
                  }}
                >
                  Remove field
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>

        <Box sx={{ flex: 1, width: "100%", overflow: "auto", p: 1, border: "1px dashed #fca5a5", borderRadius: 2, bgcolor: "#fff" }}>
          <Box
            ref={canvasRef}
            sx={{
              width: 595,
              height: 842,
              position: "relative",
              mx: "auto",
              bgcolor: "#fff",
              border: "1px solid #d1d5db",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              userSelect: "none",
              overflow: "hidden",
              backgroundImage:
                "linear-gradient(to right, rgba(156,163,175,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(156,163,175,0.2) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {elements.map((el) => (
              <Box
                key={el.id}
                onMouseDown={(e) => startDrag(e, el.id)}
                onClick={() => setSelectedId(el.id)}
                sx={{
                  position: "absolute",
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  border: el.id === selectedId ? "2px solid #dc2626" : "1px dashed #9ca3af",
                  bgcolor: "rgba(255,255,255,0.88)",
                  cursor: "move",
                  display: "flex",
                  alignItems: "center",
                  px: 0.7,
                  fontSize: el.fontSize || 14,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {el.type === "school_logo" && schoolLogoUrl ? (
                  <Box component="img" src={schoolLogoUrl} alt="School logo" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  renderElementText(el)
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
}
