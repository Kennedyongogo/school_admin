import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ViewColumnRoundedIcon from "@mui/icons-material/ViewColumnRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import {
  authJsonHeaders,
  fetchAllCurricula,
  fontDisplay,
  fontBody,
  inputSx,
  pageShellSx,
  primaryRed,
  primaryDark,
  primaryLight,
  textMuted,
  textPrimary,
} from "../components/Curriculum/curriculumShared";
import { CurriculumHero, HeroActionButton } from "../components/Curriculum/curriculumUi";

const filterFieldSx = {
  ...inputSx,
  minWidth: 148,
  "& .MuiInputBase-root": { bgcolor: "#fff" },
};

const filterDateSx = {
  ...filterFieldSx,
  minWidth: 136,
};

function formatTermDate(value) {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function termNameKey(name) {
  return String(name || "").trim().toLowerCase();
}

function columnDateSpan(items) {
  const starts = items.map((i) => i.start_date).filter(Boolean).map(String);
  const ends = items.map((i) => i.end_date).filter(Boolean).map(String);
  if (!starts.length && !ends.length) return null;
  const minStart = starts.length ? starts.sort()[0] : null;
  const maxEnd = ends.length ? ends.sort().reverse()[0] : null;
  const a = formatTermDate(minStart);
  const b = formatTermDate(maxEnd);
  if (a && b) return `${a} – ${b}`;
  if (a) return `From ${a}`;
  if (b) return `Until ${b}`;
  return null;
}

function buildBoardColumns(rows) {
  const map = new Map();
  rows.forEach((row) => {
    const key = termNameKey(row.name);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: row.name,
        minOrder: Number(row.level_order) || 0,
        items: [],
      });
    }
    const col = map.get(key);
    col.minOrder = Math.min(col.minOrder, Number(row.level_order) || 0);
    if (!col.label && row.name) col.label = row.name;
    col.items.push(row);
  });

  return Array.from(map.values())
    .map((col) => ({
      ...col,
      items: col.items.sort((a, b) => {
        const curA = a.curriculum_class?.curriculum?.name || "";
        const curB = b.curriculum_class?.curriculum?.name || "";
        if (curA !== curB) return curA.localeCompare(curB);
        const clsA = a.curriculum_class?.name || "";
        const clsB = b.curriculum_class?.name || "";
        return clsA.localeCompare(clsB);
      }),
    }))
    .sort((a, b) => {
      if (a.minOrder !== b.minOrder) return a.minOrder - b.minOrder;
      return a.label.localeCompare(b.label);
    });
}

async function fetchAllTerms(token, params) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 50) {
    const q = new URLSearchParams({ page: String(page), limit: "100" });
    params.forEach((value, key) => {
      if (value != null && String(value).trim() !== "") q.set(key, String(value).trim());
    });
    const res = await fetch(`/api/curricula/all-class-levels?${q}`, { headers: authJsonHeaders(token) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.message || `Could not load terms (${res.status})`);
    }
    out.push(...(Array.isArray(data.data) ? data.data : []));
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

function ClassTermCard({ item }) {
  const cls = item.curriculum_class;
  const cur = cls?.curriculum;
  const start = formatTermDate(item.start_date);
  const end = formatTermDate(item.end_date);

  return (
    <Box
      sx={{
        flexShrink: 0,
        borderRadius: "14px",
        bgcolor: "#fff",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
        overflow: "visible",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: "rgba(220,38,38,0.35)",
          boxShadow: "0 12px 32px rgba(15,23,42,0.1)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          borderRadius: "14px 14px 0 0",
          background: `linear-gradient(90deg, ${primaryRed} 0%, ${primaryLight} 100%)`,
        }}
      />
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              bgcolor: "rgba(220,38,38,0.08)",
              color: primaryDark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <SchoolRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontFamily: fontDisplay,
                fontWeight: 700,
                fontSize: "0.92rem",
                lineHeight: 1.35,
                color: textPrimary,
                wordBreak: "break-word",
              }}
            >
              {cls?.name || "Class"}
            </Typography>
            {cls?.code ? (
              <Typography variant="caption" sx={{ color: textMuted, fontWeight: 600 }}>
                {cls.code}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Chip
          size="small"
          icon={<MenuBookRoundedIcon sx={{ fontSize: "14px !important" }} />}
          label={cur?.name || "Curriculum"}
          sx={{
            mt: 1.25,
            height: 24,
            maxWidth: "100%",
            fontSize: "0.72rem",
            fontWeight: 700,
            bgcolor: "rgba(15,23,42,0.04)",
            "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
          }}
        />

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="flex-start"
          sx={{
            mt: 1.25,
            px: 1,
            py: 0.85,
            borderRadius: "10px",
            bgcolor: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.12)",
          }}
        >
          <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: "#2563EB", mt: 0.1, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "#1E3A8A",
              fontWeight: 600,
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {start && end ? (
              <>
                <Box component="span" sx={{ display: "block" }}>{start}</Box>
                <Box component="span" sx={{ display: "block", opacity: 0.75 }}>to {end}</Box>
              </>
            ) : start ? (
              `Starts ${start}`
            ) : end ? (
              `Ends ${end}`
            ) : (
              "Dates not set for this class term"
            )}
          </Typography>
        </Stack>

        {item.description ? (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              color: textMuted,
              lineHeight: 1.45,
              wordBreak: "break-word",
            }}
          >
            {item.description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function TermColumn({ col, index }) {
  const span = columnDateSpan(col.items);
  const accent = index % 3 === 0 ? primaryRed : index % 3 === 1 ? "#2563EB" : "#7C3AED";

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        borderRadius: "18px",
        bgcolor: "#fff",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 8px 32px rgba(15,23,42,0.06)",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          px: 1.75,
          py: 1.5,
          flexShrink: 0,
          bgcolor: "#fff",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
          borderTop: `3px solid ${accent}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: fontDisplay,
                fontWeight: 800,
                fontSize: "1rem",
                color: textPrimary,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {col.label}
            </Typography>
            {span ? (
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, color: textMuted, lineHeight: 1.4 }}>
                {span}
              </Typography>
            ) : null}
          </Box>
          <Chip
            size="small"
            label={col.items.length}
            sx={{
              height: 26,
              minWidth: 26,
              fontWeight: 800,
              bgcolor: `${accent}14`,
              color: accent,
              border: `1px solid ${accent}33`,
            }}
          />
        </Stack>
        <Typography variant="caption" sx={{ color: textMuted, mt: 0.75, display: "block" }}>
          {col.items.length} class{col.items.length === 1 ? "" : "es"} in this term
        </Typography>
      </Box>

      <Stack
        spacing={1.5}
        sx={{
          p: 1.5,
          pb: 2,
          flexShrink: 0,
        }}
      >
        {col.items.map((item) => (
          <ClassTermCard key={item.id} item={item} />
        ))}
      </Stack>
    </Box>
  );
}

export default function TermActivityMonitorPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [curriculaOptions, setCurriculaOptions] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterCurriculumId, setFilterCurriculumId] = useState(searchParams.get("curriculumId") || "");
  const [filterTermName, setFilterTermName] = useState(searchParams.get("termName") || "");
  const [filterStartFrom, setFilterStartFrom] = useState(searchParams.get("startFrom") || "");
  const [filterStartTo, setFilterStartTo] = useState(searchParams.get("startTo") || "");
  const [filterEndFrom, setFilterEndFrom] = useState(searchParams.get("endFrom") || "");
  const [filterEndTo, setFilterEndTo] = useState(searchParams.get("endTo") || "");

  const hasActiveFilters = Boolean(
    filterCurriculumId || filterTermName || filterStartFrom || filterStartTo || filterEndFrom || filterEndTo
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const list = await fetchAllCurricula(token);
        if (!cancelled) setCurriculaOptions(list);
      } catch {
        if (!cancelled) setCurriculaOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncUrl = useCallback(
    (next) => {
      const params = new URLSearchParams();
      if (next.curriculumId) params.set("curriculumId", next.curriculumId);
      if (next.termName) params.set("termName", next.termName);
      if (next.startFrom) params.set("startFrom", next.startFrom);
      if (next.startTo) params.set("startTo", next.startTo);
      if (next.endFrom) params.set("endFrom", next.endFrom);
      if (next.endTo) params.set("endTo", next.endTo);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const loadBoard = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterCurriculumId) params.set("curriculum_id", filterCurriculumId);
      if (filterTermName) params.set("q", filterTermName);
      if (filterStartFrom) params.set("start_date_from", filterStartFrom);
      if (filterStartTo) params.set("start_date_to", filterStartTo);
      if (filterEndFrom) params.set("end_date_from", filterEndFrom);
      if (filterEndTo) params.set("end_date_to", filterEndTo);
      const data = await fetchAllTerms(token, params);
      setRows(data);
      syncUrl({
        curriculumId: filterCurriculumId,
        termName: filterTermName,
        startFrom: filterStartFrom,
        startTo: filterStartTo,
        endFrom: filterEndFrom,
        endTo: filterEndTo,
      });
    } catch (e) {
      setError(e.message || "Failed to load term activity.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [
    filterCurriculumId,
    filterTermName,
    filterStartFrom,
    filterStartTo,
    filterEndFrom,
    filterEndTo,
    syncUrl,
  ]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const columns = useMemo(() => buildBoardColumns(rows), [rows]);

  const stats = useMemo(() => {
    const curricula = new Set();
    rows.forEach((r) => {
      const id = r.curriculum_class?.curriculum?.id;
      if (id) curricula.add(String(id));
    });
    return {
      termColumns: columns.length,
      classLinks: rows.length,
      curricula: curricula.size,
    };
  }, [rows, columns.length]);

  const clearFilters = () => {
    setFilterCurriculumId("");
    setFilterTermName("");
    setFilterStartFrom("");
    setFilterStartTo("");
    setFilterEndFrom("");
    setFilterEndTo("");
  };

  return (
    <Box sx={{ ...pageShellSx, pb: 4 }}>
      <Stack spacing={3}>
      <CurriculumHero
        title="Monitor term activity"
        subtitle="Scroll the page to see all class cards. Extra term columns scroll sideways within the board."
        icon={<ViewColumnRoundedIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={
          <HeroActionButton
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/curriculum?tab=terms")}
          >
            Back to terms
          </HeroActionButton>
        }
      />

      <Box
        sx={{
          borderRadius: "18px",
          bgcolor: "#fff",
          border: "1px solid rgba(220,38,38,0.1)",
          boxShadow: "0 12px 40px -20px rgba(28,25,23,0.15)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.25, bgcolor: "rgba(220,38,38,0.04)", borderBottom: "1px solid rgba(15,23,42,0.06)" }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${stats.termColumns} term columns`} sx={{ fontWeight: 700 }} />
            <Chip size="small" label={`${stats.classLinks} class placements`} variant="outlined" sx={{ fontWeight: 700 }} />
            <Chip size="small" label={`${stats.curricula} curricula`} variant="outlined" sx={{ fontWeight: 700 }} />
          </Stack>
          {hasActiveFilters ? (
            <Tooltip title="Clear all filters">
              <IconButton size="small" onClick={clearFilters} aria-label="Clear filters">
                <FilterAltOffRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "flex-end",
            gap: 1.5,
            px: 2,
            py: 1.5,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            "& > *": { flex: "0 0 auto" },
          }}
        >
          <FormControl size="small" sx={{ ...filterFieldSx, minWidth: 200 }}>
            <InputLabel id="board-filter-curriculum">Curriculum</InputLabel>
            <Select
              labelId="board-filter-curriculum"
              label="Curriculum"
              value={filterCurriculumId}
              onChange={(e) => setFilterCurriculumId(e.target.value)}
            >
              <MenuItem value="">
                <em>All curricula</em>
              </MenuItem>
              {curriculaOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.type ? ` — ${c.type}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Term name"
            placeholder="e.g. Term 1"
            value={filterTermName}
            onChange={(e) => setFilterTermName(e.target.value)}
            sx={{ ...filterFieldSx, minWidth: 160 }}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, alignSelf: "stretch", my: 0.5 }} />

          <Typography
            variant="caption"
            sx={{
              alignSelf: "center",
              fontWeight: 800,
              color: textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              px: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            Start
          </Typography>
          <TextField
            size="small"
            label="From"
            type="date"
            value={filterStartFrom}
            onChange={(e) => setFilterStartFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={filterDateSx}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filterStartTo}
            onChange={(e) => setFilterStartTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={filterDateSx}
          />

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, alignSelf: "stretch", my: 0.5 }} />

          <Typography
            variant="caption"
            sx={{
              alignSelf: "center",
              fontWeight: 800,
              color: textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              px: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            End
          </Typography>
          <TextField
            size="small"
            label="From"
            type="date"
            value={filterEndFrom}
            onChange={(e) => setFilterEndFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={filterDateSx}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={filterEndTo}
            onChange={(e) => setFilterEndTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={filterDateSx}
          />
        </Box>
      </Box>

      <Box
        sx={{
          borderRadius: "18px",
          bgcolor: "#fff",
          border: "1px solid rgba(220,38,38,0.1)",
          boxShadow: "0 12px 40px -20px rgba(28,25,23,0.15)",
          width: "100%",
          p: { xs: 1.5, sm: 2 },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5, py: 8 }}>
            <CircularProgress sx={{ color: primaryRed }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: fontBody }}>
              Building your term board…
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : columns.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, textAlign: "center" }}>
            <ViewColumnRoundedIcon sx={{ fontSize: 48, color: "rgba(15,23,42,0.2)", mb: 1 }} />
            <Typography sx={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: "1.1rem" }}>
              No terms match your filters
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
              Try clearing filters or add terms from the curriculum terms tab.
            </Typography>
            {hasActiveFilters ? (
              <Button size="small" sx={{ mt: 2 }} onClick={clearFilters} startIcon={<FilterAltOffRoundedIcon />}>
                Clear filters
              </Button>
            ) : null}
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
              overflowY: "visible",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "minmax(260px, 1fr)",
                gap: 2,
                width: "100%",
                minWidth: 0,
              }}
            >
              {columns.map((col, index) => (
                <TermColumn key={col.key} col={col} index={index} />
              ))}
            </Box>
          </Box>
        )}
      </Box>
      </Stack>
    </Box>
  );
}
