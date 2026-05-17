import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ImageIcon from "@mui/icons-material/Image";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";
import VideocamIcon from "@mui/icons-material/Videocam";
import SummarizeIcon from "@mui/icons-material/Summarize";
import { getApiBaseUrl } from "../../utils/apiBaseUrl";
import EventLiveHostDialog from "./EventLiveHostDialog";
import EventReportDialog from "./EventReportDialog";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import {
  canEndStaleEventLive,
  canManageEventLive,
  canRegenerateEventPoster,
  getEventStatusLabel,
} from "../../utils/eventJoinWindow";

const accent = "#DC2626";
const accentDark = "#B91C1C";
const accentLight = "#FEE2E2";

const COLOR_PALETTES = [
  { value: "academic", label: "Academic" },
  { value: "festive", label: "Festive" },
  { value: "sports", label: "Sports" },
  { value: "news", label: "News" },
  { value: "spring", label: "Spring" },
];

const NEWS_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "announcement", label: "Announcement" },
  { value: "achievement", label: "Achievement" },
  { value: "event", label: "Event" },
  { value: "holiday", label: "Holiday" },
];

const TARGET_AUDIENCES = [
  { value: "all", label: "All" },
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
  { value: "teachers", label: "Teachers" },
  { value: "alumni", label: "Alumni" },
];

const DELIVERY_MODES = [
  { value: "physical", label: "Physical (on-site)" },
  { value: "online", label: "Online (live video)" },
  { value: "hybrid", label: "Hybrid" },
];

const EVENT_TYPES = [
  { value: "sports", label: "Sports" },
  { value: "academic", label: "Academic" },
  { value: "cultural", label: "Cultural" },
  { value: "parent_meeting", label: "Parent meeting" },
  { value: "admission", label: "Admission" },
  { value: "holiday", label: "Holiday" },
  { value: "workshop", label: "Workshop" },
  { value: "competition", label: "Competition" },
  { value: "other", label: "Other" },
];

const swalAboveDialog = {
  didOpen: () => {
    const container = Swal.getContainer();
    if (container) container.style.zIndex = "2000";
  },
};

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function mediaUrl(path) {
  if (!path || typeof path !== "string") return null;
  const t = path.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  const base = getApiBaseUrl();
  return `${base}${t.startsWith("/") ? t : `/${t}`}`;
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function toDatetimeLocal(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseTagsInput(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsToInput(tags) {
  if (!Array.isArray(tags)) return "";
  return tags.join(", ");
}

function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label || value || "—";
}

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "pre-wrap" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function ActionIconTooltip({ title, children }) {
  return (
    <Tooltip title={title} arrow>
      <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>{children}</span>
    </Tooltip>
  );
}

function PublishedChip({ published }) {
  return (
    <Chip
      size="small"
      label={published ? "Published" : "Draft"}
      color={published ? "success" : "default"}
      sx={{ fontWeight: 700 }}
    />
  );
}

const emptyNewsForm = () => ({
  title: "",
  summary: "",
  content: "",
  category: "general",
  target_audience: "all",
  tags: "",
  is_published: true,
  generate_poster: false,
  poster_description: "",
  color_palette: "academic",
});

const newsToForm = (row) => ({
  title: row?.title ?? "",
  summary: row?.summary ?? "",
  content: row?.content ?? "",
  category: row?.category ?? "general",
  target_audience: row?.target_audience ?? "all",
  tags: tagsToInput(row?.tags),
  is_published: row?.is_published !== false,
  generate_poster: false,
  poster_description: row?.summary ?? row?.title ?? "",
  color_palette: row?.poster_color_palette?.palette ?? "academic",
});

const emptyEventForm = () => ({
  title: "",
  description: "",
  event_type: "other",
  delivery_mode: "physical",
  start_date: "",
  end_date: "",
  location: "",
  is_published: true,
  is_featured: false,
  tags: "",
  generate_poster: false,
  poster_description: "",
  color_palette: "festive",
});

const eventToForm = (row) => ({
  title: row?.title ?? "",
  description: row?.description ?? "",
  event_type: row?.event_type ?? "other",
  delivery_mode: row?.delivery_mode ?? "physical",
  start_date: toDatetimeLocal(row?.start_date),
  end_date: toDatetimeLocal(row?.end_date),
  location: row?.location ?? "",
  is_published: row?.is_published !== false,
  is_featured: !!row?.is_featured,
  tags: tagsToInput(row?.tags),
  generate_poster: false,
  poster_description: row?.description ?? row?.title ?? "",
  color_palette: row?.poster_color_palette?.palette ?? "festive",
});

function buildNewsPayload(form, isEdit) {
  const payload = {
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    content: form.content.trim(),
    category: form.category,
    target_audience: form.target_audience,
    tags: parseTagsInput(form.tags),
    is_published: !!form.is_published,
  };
  if (!isEdit && form.generate_poster) {
    payload.generate_poster = true;
    payload.poster_description = form.poster_description.trim() || form.summary.trim() || form.title.trim();
    payload.color_palette = form.color_palette;
  }
  if (isEdit && form.generate_poster) {
    payload.generate_poster = true;
    payload.poster_description = form.poster_description.trim() || form.summary.trim() || form.title.trim();
    payload.color_palette = form.color_palette;
  }
  return payload;
}

function buildEventPayload(form, isEdit) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    event_type: form.event_type,
    delivery_mode: form.delivery_mode,
    start_date: fromDatetimeLocal(form.start_date),
    end_date: fromDatetimeLocal(form.end_date),
    location: form.location.trim() || null,
    is_published: !!form.is_published,
    is_featured: !!form.is_featured,
    tags: parseTagsInput(form.tags),
  };
  if (form.generate_poster) {
    payload.generate_poster = true;
    payload.poster_description =
      form.poster_description.trim() || form.description.trim() || form.title.trim();
    payload.color_palette = form.color_palette;
  }
  return payload;
}

function PosterAiSection({
  form,
  setForm,
  disabled,
  isEdit,
  existingPosterUrl,
  allowRegenerate = true,
}) {
  const showFields = (isEdit || form.generate_poster) && allowRegenerate;
  const posterSrc = mediaUrl(existingPosterUrl);

  return (
    <Stack spacing={1.5} sx={{ pt: 1, borderTop: `1px solid ${accentLight}` }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentDark }}>
        AI poster
      </Typography>
      {isEdit && !allowRegenerate ? (
        <Typography variant="body2" color="text.secondary">
          Poster regeneration is not available after the event&apos;s scheduled end time.
        </Typography>
      ) : null}
      {isEdit && posterSrc ? (
        <Box
          component="img"
          src={posterSrc}
          alt="Current poster"
          sx={{ maxWidth: "100%", maxHeight: 200, borderRadius: 1, border: `1px solid ${accentLight}` }}
        />
      ) : null}
      {isEdit && !posterSrc ? (
        <Typography variant="body2" color="text.secondary">
          No poster yet. Enable regenerate on save to create one.
        </Typography>
      ) : null}
      {allowRegenerate ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={form.generate_poster}
              disabled={disabled}
              onChange={(e) => setForm((f) => ({ ...f, generate_poster: e.target.checked }))}
            />
          }
          label={isEdit ? "Regenerate AI poster on save" : "Generate AI poster"}
        />
      ) : null}
      {showFields ? (
        <Stack spacing={2}>
          <TextField
            label="Poster description"
            fullWidth
            multiline
            minRows={2}
            helperText={isEdit ? "Used when you regenerate the poster on save." : undefined}
            value={form.poster_description}
            disabled={disabled}
            onChange={(e) => setForm((f) => ({ ...f, poster_description: e.target.value }))}
          />
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>Color palette</InputLabel>
            <Select
              label="Color palette"
              value={form.color_palette}
              onChange={(e) => setForm((f) => ({ ...f, color_palette: e.target.value }))}
            >
              {COLOR_PALETTES.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      ) : null}
    </Stack>
  );
}

function NewsFormFields({ form, setForm, disabled, isEdit = false, existingPosterUrl = null }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        required
        fullWidth
        value={form.title}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <TextField
        label="Summary"
        fullWidth
        multiline
        minRows={2}
        value={form.summary}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
      />
      <TextField
        label="Content"
        required
        fullWidth
        multiline
        minRows={5}
        value={form.content}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {NEWS_CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Audience</InputLabel>
          <Select
            label="Audience"
            value={form.target_audience}
            onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value }))}
          >
            {TARGET_AUDIENCES.map((a) => (
              <MenuItem key={a.value} value={a.value}>
                {a.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <TextField
        label="Tags (comma-separated)"
        fullWidth
        value={form.tags}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.is_published}
            disabled={disabled}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
          />
        }
        label="Published"
      />
      <PosterAiSection
        form={form}
        setForm={setForm}
        disabled={disabled}
        isEdit={isEdit}
        existingPosterUrl={existingPosterUrl}
      />
    </Stack>
  );
}

function EventFormFields({
  form,
  setForm,
  disabled,
  isEdit = false,
  existingPosterUrl = null,
  allowPosterRegenerate = true,
}) {
  const isOnlineOnly = form.delivery_mode === "online";
  const isHybrid = form.delivery_mode === "hybrid";
  const showLocation = form.delivery_mode === "physical" || isHybrid;
  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        required
        fullWidth
        value={form.title}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <TextField
        label="Description"
        required
        fullWidth
        multiline
        minRows={4}
        value={form.description}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Event type</InputLabel>
          <Select
            label="Event type"
            value={form.event_type}
            onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
          >
            {EVENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" disabled={disabled}>
          <InputLabel>Delivery</InputLabel>
          <Select
            label="Delivery"
            value={form.delivery_mode}
            onChange={(e) => setForm((f) => ({ ...f, delivery_mode: e.target.value }))}
          >
            {DELIVERY_MODES.map((d) => (
              <MenuItem key={d.value} value={d.value}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Start"
          type="datetime-local"
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={form.start_date}
          disabled={disabled}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
        />
        <TextField
          label="End"
          type="datetime-local"
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={form.end_date}
          disabled={disabled}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
        />
      </Stack>
      {showLocation ? (
        <TextField
          label={isHybrid ? "Venue / location (in-person part)" : "Location"}
          fullWidth
          value={form.location}
          disabled={disabled}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      ) : null}
      {isOnlineOnly || isHybrid ? (
        <Alert severity="info" sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
            In-app live room (no external URL)
          </Typography>
          <Typography variant="body2">
            Saving creates the video room automatically. After save, use <strong>Manage live</strong> (camera
            icon) → <strong>Start live</strong> when the event begins. Students and parents join from the public
            portal: login → waiting room → you admit them.
          </Typography>
        </Alert>
      ) : null}
      <TextField
        label="Tags (comma-separated)"
        fullWidth
        value={form.tags}
        disabled={disabled}
        onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.is_published}
            disabled={disabled}
            onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
          />
        }
        label="Published"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={form.is_featured}
            disabled={disabled}
            onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
          />
        }
        label="Featured"
      />
      <PosterAiSection
        form={form}
        setForm={setForm}
        disabled={disabled}
        isEdit={isEdit}
        existingPosterUrl={existingPosterUrl}
        allowRegenerate={allowPosterRegenerate}
      />
    </Stack>
  );
}

function NewsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");

  const [viewRow, setViewRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyNewsForm());
  const [createSaving, setCreateSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(emptyNewsForm());
  const [editSaving, setEditSaving] = useState(false);
  const [posterLoadingId, setPosterLoadingId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (categoryFilter) params.set("category", categoryFilter);
      if (publishedFilter !== "") params.set("is_published", publishedFilter);

      const res = await fetch(`/api/news?${params.toString()}`, { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load news.");
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalCount(json.pagination?.total ?? 0);
    } catch (e) {
      setError(e.message || "Could not load news.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, categoryFilter, publishedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Title and content are required.",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    setCreateSaving(true);
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(buildNewsPayload(createForm, false)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not create news.");
      setCreateOpen(false);
      setCreateForm(emptyNewsForm());
      await Swal.fire({
        icon: "success",
        title: "News created",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Create failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editRow?.id || !editForm.title.trim() || !editForm.content.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/news/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(buildNewsPayload(editForm, true)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not update news.");
      setEditRow(null);
      await Swal.fire({
        icon: "success",
        title: "News updated",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete news?",
      text: `"${row.title}" will be removed permanently.`,
      showCancelButton: true,
      confirmButtonColor: accentDark,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/news/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not delete.");
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e.message,
        confirmButtonColor: accentDark,
      });
    }
  };

  const handleRegeneratePoster = async (row) => {
    const token = localStorage.getItem("token");
    if (!token || !row?.id) return;
    setPosterLoadingId(row.id);
    try {
      const res = await fetch(`/api/news/${row.id}/generate-poster`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          poster_description: row.summary || row.title,
          color_palette: row.poster_color_palette?.palette || "academic",
          category: row.category,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Poster generation failed.");
      await Swal.fire({
        icon: "success",
        title: "Poster generated",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
      if (viewRow?.id === row.id) setViewRow(json.data);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Poster failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setPosterLoadingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Title, summary…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setPage(0);
              setCategoryFilter(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {NEWS_CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={publishedFilter}
            onChange={(e) => {
              setPage(0);
              setPublishedFilter(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Published</MenuItem>
            <MenuItem value="false">Draft</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateForm(emptyNewsForm());
            setCreateOpen(true);
          }}
          sx={{ ml: { sm: "auto" }, bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
        >
          Add news
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#fff7f7" }}>
                  <TableCell>No.</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Audience</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No news articles found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, maxWidth: 240 }}>{row.title}</TableCell>
                      <TableCell>{labelFor(NEWS_CATEGORIES, row.category)}</TableCell>
                      <TableCell>{labelFor(TARGET_AUDIENCES, row.target_audience)}</TableCell>
                      <TableCell>
                        <PublishedChip published={row.is_published} />
                      </TableCell>
                      <TableCell>{row.view_count ?? 0}</TableCell>
                      <TableCell align="right">
                        <ActionIconTooltip title="View">
                          <IconButton
                            size="small"
                            aria-label="View"
                            onClick={() => setViewRow(row)}
                            sx={{ color: accentDark }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                        <ActionIconTooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label="Edit"
                            onClick={() => {
                              setEditRow(row);
                              setEditForm(newsToForm(row));
                            }}
                            sx={{ color: accent }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                        <ActionIconTooltip title="Regenerate poster">
                          <IconButton
                            size="small"
                            aria-label="Regenerate poster"
                            disabled={posterLoadingId === row.id}
                            onClick={() => handleRegeneratePoster(row)}
                            sx={{ color: accentDark }}
                          >
                            {posterLoadingId === row.id ? (
                              <CircularProgress size={18} />
                            ) : (
                              <ImageIcon fontSize="small" />
                            )}
                          </IconButton>
                        </ActionIconTooltip>
                        <ActionIconTooltip title="Delete">
                          <IconButton
                            size="small"
                            aria-label="Delete"
                            onClick={() => handleDelete(row)}
                            sx={{ color: "#b91c1c" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}
      </Paper>

      <Dialog open={createOpen} onClose={() => !createSaving && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create news</DialogTitle>
        <DialogContent dividers>
          <NewsFormFields form={createForm} setForm={setCreateForm} disabled={createSaving} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={createSaving} sx={{ bgcolor: accent }}>
            {createSaving ? "Saving…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => !editSaving && setEditRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit news</DialogTitle>
        <DialogContent dividers>
          <NewsFormFields
            form={editForm}
            setForm={setEditForm}
            disabled={editSaving}
            isEdit
            existingPosterUrl={editRow?.poster_image}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEdit} disabled={editSaving} sx={{ bgcolor: accent }}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          {viewRow?.title}
          <IconButton onClick={() => setViewRow(null)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <PublishedChip published={viewRow.is_published} />
                <Chip size="small" label={labelFor(NEWS_CATEGORIES, viewRow.category)} />
              </Stack>
              {viewRow.poster_image ? (
                <Box
                  component="img"
                  src={mediaUrl(viewRow.poster_image)}
                  alt="Poster"
                  sx={{ maxWidth: "100%", maxHeight: 280, borderRadius: 1, border: `1px solid ${accentLight}` }}
                />
              ) : null}
              <DetailField label="Summary" value={viewRow.summary} />
              <DetailField label="Content" value={viewRow.content} />
              <DetailField label="Audience" value={labelFor(TARGET_AUDIENCES, viewRow.target_audience)} />
              <DetailField label="Published at" value={fmtDate(viewRow.published_at)} />
              <DetailField label="Views" value={String(viewRow.view_count ?? 0)} />
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function EventsPanel() {
  const [liveHostEvent, setLiveHostEvent] = useState(null);
  const [reportEvent, setReportEvent] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");

  const [viewRow, setViewRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyEventForm());
  const [createSaving, setCreateSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState(emptyEventForm());
  const [editSaving, setEditSaving] = useState(false);
  const [posterLoadingId, setPosterLoadingId] = useState(null);
  const [endLiveBusyId, setEndLiveBusyId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));
      params.set("limit", String(rowsPerPage));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (typeFilter) params.set("event_type", typeFilter);
      if (publishedFilter !== "") params.set("is_published", publishedFilter);

      const res = await fetch(`/api/events?${params.toString()}`, { headers: authHeaders(token) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not load events.");
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalCount(json.pagination?.total ?? 0);
    } catch (e) {
      setError(e.message || "Could not load events.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, typeFilter, publishedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.start_date || !createForm.end_date) {
      await Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Title, description, start and end dates are required.",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;
    setCreateSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(buildEventPayload(createForm, false)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not create event.");
      setCreateOpen(false);
      setCreateForm(emptyEventForm());
      await Swal.fire({
        icon: "success",
        title: "Event created",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Create failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editRow?.id || !editForm.title.trim() || !editForm.description.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/events/${editRow.id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(buildEventPayload(editForm, true)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not update event.");
      setEditRow(null);
      await Swal.fire({
        icon: "success",
        title: "Event updated",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete event?",
      text: `"${row.title}" will be removed permanently.`,
      showCancelButton: true,
      confirmButtonColor: accentDark,
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`/api/events/${row.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not delete.");
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: e.message,
        confirmButtonColor: accentDark,
      });
    }
  };

  const handleEndLive = async (row) => {
    const token = localStorage.getItem("token");
    if (!token || !row?.id) return;
    setEndLiveBusyId(row.id);
    try {
      const res = await fetch(`/api/events/${row.id}/live/end`, {
        method: "POST",
        headers: authHeaders(token),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Could not end live session.");
      await Swal.fire({
        icon: "success",
        title: "Event ended",
        text: json.message || "Live session ended.",
        timer: 2200,
        showConfirmButton: false,
        confirmButtonColor: accentDark,
      });
      void load();
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "End live failed",
        text: e.message,
        confirmButtonColor: accentDark,
      });
    } finally {
      setEndLiveBusyId(null);
    }
  };

  const handleRegeneratePoster = async (row) => {
    const token = localStorage.getItem("token");
    if (!token || !row?.id) return;
    setPosterLoadingId(row.id);
    try {
      const res = await fetch(`/api/events/${row.id}/generate-poster`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          poster_description: row.description || row.title,
          color_palette: row.poster_color_palette?.palette || "festive",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || "Poster generation failed.");
      await Swal.fire({
        icon: "success",
        title: "Poster generated",
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
      void load();
      if (viewRow?.id === row.id) setViewRow(json.data);
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "Poster failed",
        text: e.message,
        confirmButtonColor: accentDark,
        ...swalAboveDialog,
      });
    } finally {
      setPosterLoadingId(null);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Title, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={typeFilter}
            onChange={(e) => {
              setPage(0);
              setTypeFilter(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            {EVENT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={publishedFilter}
            onChange={(e) => {
              setPage(0);
              setPublishedFilter(e.target.value);
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Published</MenuItem>
            <MenuItem value="false">Draft</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateForm(emptyEventForm());
            setCreateOpen(true);
          }}
          sx={{ ml: { sm: "auto" }, bgcolor: accent, "&:hover": { bgcolor: accentDark } }}
        >
          Add event
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#fff7f7" }}>
                  <TableCell>No.</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, idx) => {
                    const showManageLive = canManageEventLive(row);
                    const showEndLive = canEndStaleEventLive(row);
                    const showPosterRegen = canRegenerateEventPoster(row);
                    const sessionLabel = getEventStatusLabel(row);

                    return (
                    <TableRow key={row.id} hover>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, maxWidth: 220 }}>{row.title}</TableCell>
                      <TableCell>{row.location || "—"}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                          <PublishedChip published={row.is_published} />
                          {row.is_featured ? <Chip size="small" label="Featured" color="warning" /> : null}
                          {(row.delivery_mode === "online" || row.delivery_mode === "hybrid") &&
                          sessionLabel !== row.session_status ? (
                            <Chip size="small" label={sessionLabel} color="warning" variant="outlined" />
                          ) : null}
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", verticalAlign: "middle" }}>
                        <Stack
                          direction="row"
                          spacing={0}
                          justifyContent="flex-end"
                          alignItems="center"
                          useFlexGap
                          sx={{ flexWrap: "nowrap" }}
                        >
                        {showManageLive ? (
                          <ActionIconTooltip title="Manage live">
                            <IconButton
                              size="small"
                              aria-label="Manage live"
                              onClick={() => setLiveHostEvent(row)}
                              sx={{ color: accentDark }}
                            >
                              <VideocamIcon fontSize="small" />
                            </IconButton>
                          </ActionIconTooltip>
                        ) : null}
                        {showEndLive ? (
                          <ActionIconTooltip title="End live session (scheduled time has passed)">
                            <IconButton
                              size="small"
                              aria-label="End live"
                              disabled={endLiveBusyId === row.id}
                              onClick={() => void handleEndLive(row)}
                              sx={{ color: "#b91c1c" }}
                            >
                              {endLiveBusyId === row.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <StopCircleOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </ActionIconTooltip>
                        ) : null}
                        {(row.delivery_mode === "online" || row.delivery_mode === "hybrid") ? (
                          <ActionIconTooltip title="Online event report">
                            <IconButton
                              size="small"
                              aria-label="Online event report"
                              onClick={() => setReportEvent(row)}
                              sx={{ color: accentDark }}
                            >
                              <SummarizeIcon fontSize="small" />
                            </IconButton>
                          </ActionIconTooltip>
                        ) : null}
                        <ActionIconTooltip title="View">
                          <IconButton
                            size="small"
                            aria-label="View"
                            onClick={() => setViewRow(row)}
                            sx={{ color: accentDark }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                        <ActionIconTooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label="Edit"
                            onClick={() => {
                              setEditRow(row);
                              setEditForm(eventToForm(row));
                            }}
                            sx={{ color: accent }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                        {showPosterRegen ? (
                          <ActionIconTooltip title="Regenerate poster">
                            <IconButton
                              size="small"
                              aria-label="Regenerate poster"
                              disabled={posterLoadingId === row.id}
                              onClick={() => handleRegeneratePoster(row)}
                              sx={{ color: accentDark }}
                            >
                              {posterLoadingId === row.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <ImageIcon fontSize="small" />
                              )}
                            </IconButton>
                          </ActionIconTooltip>
                        ) : null}
                        <ActionIconTooltip title="Delete">
                          <IconButton
                            size="small"
                            aria-label="Delete"
                            onClick={() => handleDelete(row)}
                            sx={{ color: "#b91c1c" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ActionIconTooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}
      </Paper>

      <Dialog open={createOpen} onClose={() => !createSaving && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create event</DialogTitle>
        <DialogContent dividers>
          <EventFormFields form={createForm} setForm={setCreateForm} disabled={createSaving} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={createSaving} sx={{ bgcolor: accent }}>
            {createSaving ? "Saving…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editRow} onClose={() => !editSaving && setEditRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit event</DialogTitle>
        <DialogContent dividers>
          <EventFormFields
            form={editForm}
            setForm={setEditForm}
            disabled={editSaving}
            isEdit
            existingPosterUrl={editRow?.poster_image}
            allowPosterRegenerate={editRow ? canRegenerateEventPoster(editRow) : true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)} disabled={editSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEdit} disabled={editSaving} sx={{ bgcolor: accent }}>
            {editSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          {viewRow?.title}
          <IconButton onClick={() => setViewRow(null)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewRow ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <PublishedChip published={viewRow.is_published} />
                <Chip size="small" label={labelFor(EVENT_TYPES, viewRow.event_type)} />
                <Chip size="small" label={labelFor(DELIVERY_MODES, viewRow.delivery_mode)} />
                <Chip size="small" label={viewRow.session_status || "scheduled"} />
                {viewRow.is_featured ? <Chip size="small" label="Featured" color="warning" /> : null}
              </Stack>
              {viewRow.poster_image ? (
                <Box
                  component="img"
                  src={mediaUrl(viewRow.poster_image)}
                  alt="Poster"
                  sx={{ maxWidth: "100%", maxHeight: 280, borderRadius: 1, border: `1px solid ${accentLight}` }}
                />
              ) : null}
              <DetailField label="Description" value={viewRow.description} />
              <DetailField label="Start" value={fmtDate(viewRow.start_date)} />
              <DetailField label="End" value={fmtDate(viewRow.end_date)} />
              <DetailField label="Location" value={viewRow.location} />
              {(viewRow.delivery_mode === "online" || viewRow.delivery_mode === "hybrid") ? (
                <DetailField label="Live room" value={viewRow.live_meeting_id || "Created on save"} />
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      <EventLiveHostDialog
        open={!!liveHostEvent}
        event={liveHostEvent}
        onClose={() => setLiveHostEvent(null)}
      />
      <EventReportDialog
        open={!!reportEvent}
        event={reportEvent}
        onClose={() => setReportEvent(null)}
      />
    </Stack>
  );
}

export default function HRNewsEventsTab() {
  const [section, setSection] = useState(0);

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 2 }}>
        <Tabs
          value={section}
          onChange={(_, v) => setSection(v)}
          sx={{
            px: 1,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 700 },
            "& .MuiTabs-indicator": { bgcolor: accent },
          }}
        >
          <Tab label="News" />
          <Tab label="Events" />
        </Tabs>
      </Paper>
      {section === 0 ? <NewsPanel /> : <EventsPanel />}
    </Stack>
  );
}
