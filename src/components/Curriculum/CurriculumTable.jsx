import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  MenuBook as MenuBookIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  Subject as SubjectIcon,
  ViewList as ViewListIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Rule as RuleIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import CurriculumClassesTab from "./CurriculumClassesTab";
import CurriculumClassLevelsTab from "./CurriculumClassLevelsTab";
import CurriculumSubjectsTab from "./CurriculumSubjectsTab";
import CurriculumGradingSystemTab from "./CurriculumGradingSystemTab";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const primaryLight = "#FEE2E2";
const backgroundLight = "#FEF2F2";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

const fullMainBleedSx = (theme) => ({
  width: `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
  marginLeft: theme.spacing(-3),
  marginRight: theme.spacing(-3),
  marginTop: "1px",
  marginBottom: "1px",
  boxSizing: "border-box",
});

function truncate(text, max = 120) {
  if (!text || typeof text !== "string") return "—";
  const t = text.trim();
  if (!t) return "—";
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export default function CurriculumTable() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const classesTabRef = useRef(null);
  const termsTabRef = useRef(null);
  const subjectsTabRef = useRef(null);
  const gradingTabRef = useRef(null);

  const [pageTab, setPageTab] = useState(0);
  const [classesCurriculumId, setClassesCurriculumId] = useState("");
  const [termsClassId, setTermsClassId] = useState("");
  const [subjectsClassFilterId, setSubjectsClassFilterId] = useState("");
  const [subjectsLevelFilterId, setSubjectsLevelFilterId] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const [viewCurriculumRow, setViewCurriculumRow] = useState(null);
  const [editCurriculumOpen, setEditCurriculumOpen] = useState(false);
  const [editCurriculumSaving, setEditCurriculumSaving] = useState(false);
  const [editCurriculumId, setEditCurriculumId] = useState(null);
  const [editCurriculumForm, setEditCurriculumForm] = useState({
    name: "",
    type: "",
    period: "",
    description: "",
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    const cid = searchParams.get("curriculumId") || "";
    const rawTermsCls = searchParams.get("classId") || "";
    const termsCls = cid ? rawTermsCls : "";
    const subCls = searchParams.get("subjectClassId") || "";
    const rawSubLvl = searchParams.get("subjectLevelId") || "";
    const subLvl = cid && subCls ? rawSubLvl : "";
    if (tab === "classes") setPageTab(1);
    else if (tab === "terms") setPageTab(2);
    else if (tab === "subjects") setPageTab(3);
    else if (tab === "grading") setPageTab(4);
    else setPageTab(0);
    setClassesCurriculumId(cid);
    setTermsClassId(termsCls);
    setSubjectsClassFilterId(cid ? subCls : "");
    setSubjectsLevelFilterId(subLvl);
  }, [searchParams]);

  const syncTabUrl = useCallback(
    (tabIdx, overrides = {}) => {
      const cid = overrides.curriculumId !== undefined ? overrides.curriculumId : classesCurriculumId;
      const termsCls = overrides.termsClassId !== undefined ? overrides.termsClassId : termsClassId;
      const subCls = overrides.subjectClassId !== undefined ? overrides.subjectClassId : subjectsClassFilterId;
      const subLvl = overrides.subjectLevelId !== undefined ? overrides.subjectLevelId : subjectsLevelFilterId;

      const next = new URLSearchParams(searchParams);
      ["tab", "curriculumId", "classId", "subjectClassId", "subjectLevelId"].forEach((k) => next.delete(k));

      if (tabIdx === 0) {
        setSearchParams(next, { replace: true });
        return;
      }
      if (tabIdx === 1) {
        next.set("tab", "classes");
        if (cid) next.set("curriculumId", cid);
        setSearchParams(next, { replace: true });
        return;
      }
      if (tabIdx === 2) {
        next.set("tab", "terms");
        if (cid) next.set("curriculumId", cid);
        if (termsCls) next.set("classId", termsCls);
        setSearchParams(next, { replace: true });
        return;
      }
      if (tabIdx === 3) {
        next.set("tab", "subjects");
        if (cid) next.set("curriculumId", cid);
        if (subCls) next.set("subjectClassId", subCls);
        if (subLvl) next.set("subjectLevelId", subLvl);
        setSearchParams(next, { replace: true });
        return;
      }
      if (tabIdx === 4) {
        next.set("tab", "grading");
        if (cid) next.set("curriculumId", cid);
        setSearchParams(next, { replace: true });
        return;
      }
      setSearchParams(next, { replace: true });
    },
    [
      searchParams,
      setSearchParams,
      classesCurriculumId,
      termsClassId,
      subjectsClassFilterId,
      subjectsLevelFilterId,
    ]
  );

  const handleTermsContextChange = useCallback(
    (cid, cls) => {
      setClassesCurriculumId(cid);
      setTermsClassId(cls || "");
      syncTabUrl(2, { curriculumId: cid, termsClassId: cls || "" });
    },
    [syncTabUrl]
  );

  const handleSubjectsContextChange = useCallback(
    (cid, cls, lvl) => {
      setClassesCurriculumId(cid);
      setSubjectsClassFilterId(cls || "");
      setSubjectsLevelFilterId(lvl || "");
      syncTabUrl(3, {
        curriculumId: cid,
        subjectClassId: cls || "",
        subjectLevelId: lvl || "",
      });
    },
    [syncTabUrl]
  );

  const fetchCurricula = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      const res = await fetch(`/api/curricula?${params}`, { headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load curricula (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalRows(data.pagination?.total ?? 0);
    } catch (e) {
      setError(e.message || "Failed to load curricula.");
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchCurricula();
  }, [fetchCurricula]);

  const handleDelete = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete curriculum?",
      text: `${row.name} — cannot be undone if programs depend on it.`,
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/curricula/${row.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
      fetchCurricula();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  };

  const handleMainTabChange = (_, v) => {
    setPageTab(v);
    syncTabUrl(v);
  };

  const handleClassesCurriculumChange = (id) => {
    setClassesCurriculumId(id);
    if (pageTab === 1) syncTabUrl(1, { curriculumId: id });
  };

  const openEditCurriculum = (row) => {
    setEditCurriculumId(row.id);
    setEditCurriculumForm({
      name: row.name || "",
      type: row.type || "",
      period: row.period?.trim() ? row.period.trim() : "",
      description: row.description?.trim() ? row.description.trim() : "",
    });
    setEditCurriculumOpen(true);
  };

  const handleEditCurriculumSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !editCurriculumId) return;
    const name = editCurriculumForm.name.trim();
    const type = editCurriculumForm.type.trim();
    if (!name || !type) {
      Swal.fire({ icon: "warning", title: "Required", text: "Name and type are required." });
      return;
    }
    setEditCurriculumSaving(true);
    try {
      const res = await fetch(`/api/curricula/${editCurriculumId}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          type,
          period: editCurriculumForm.period.trim() || null,
          description: editCurriculumForm.description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }
      setEditCurriculumOpen(false);
      await Swal.fire({ icon: "success", title: "Saved", timer: 1400, showConfirmButton: false });
      fetchCurricula();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setEditCurriculumSaving(false);
    }
  };

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        /** Pull up into `main`’s default padding so less gap under the fixed top bar. */
        marginTop: theme.spacing(-2.5),
        minHeight: "100%",
        background: `linear-gradient(180deg, ${backgroundLight} 0%, #fff 40%)`,
      })}
    >
      <Box
        sx={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryRed} 55%, #EF4444 100%)`,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.25 },
          color: "white",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 8px 24px ${primaryRed}33`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            background: "rgba(255,255,255,0.12)",
            borderRadius: "50%",
          }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          position="relative"
          zIndex={1}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <MenuBookIcon sx={{ fontSize: { xs: 36, sm: 42 }, opacity: 0.95 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: "1.35rem", sm: "2rem" } }}>
                Curriculum
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.25 }}>
                Pathways your school offers — including how long each runs until completion.
              </Typography>
            </Box>
          </Stack>
          {pageTab === 1 ? (
            <Button
              variant="contained"
              startIcon={<SchoolIcon />}
              onClick={() => classesTabRef.current?.openCreateDialog?.()}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Create class
            </Button>
          ) : pageTab === 2 ? (
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              onClick={() => termsTabRef.current?.openCreateDialog?.()}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Add term
            </Button>
          ) : pageTab === 3 ? (
            <Button
              variant="contained"
              startIcon={<SubjectIcon />}
              onClick={() => subjectsTabRef.current?.openCreateDialog?.()}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Add subject
            </Button>
          ) : pageTab === 4 ? (
            <Button
              variant="contained"
              startIcon={<RuleIcon />}
              onClick={() => gradingTabRef.current?.openCreateDialog?.()}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Add grading config
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/curriculum/create")}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                color: primaryDark,
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.25,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: "#fff", color: primaryRed },
              }}
            >
              Create curriculum
            </Button>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 2, width: "100%", boxSizing: "border-box" }}>
        <Tabs
          value={pageTab}
          onChange={handleMainTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              minHeight: 44,
              color: primaryDark,
              "&.Mui-selected": { color: primaryRed },
            },
            "& .MuiTabs-indicator": { bgcolor: primaryRed, height: 3, borderRadius: 1 },
          }}
        >
          <Tab icon={<ViewListIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Curricula" />
          <Tab icon={<SchoolIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Classes" />
          <Tab icon={<CalendarMonthIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Terms" />
          <Tab icon={<SubjectIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Subjects" />
          <Tab icon={<RuleIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Grading system" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {pageTab === 1 ? (
          <CurriculumClassesTab ref={classesTabRef} curriculumId={classesCurriculumId} onCurriculumChange={handleClassesCurriculumChange} />
        ) : pageTab === 2 ? (
          <CurriculumClassLevelsTab
            ref={termsTabRef}
            curriculumId={classesCurriculumId}
            classId={termsClassId}
            onContextChange={handleTermsContextChange}
          />
        ) : pageTab === 3 ? (
          <CurriculumSubjectsTab
            ref={subjectsTabRef}
            curriculumId={classesCurriculumId}
            filterClassId={subjectsClassFilterId}
            filterLevelId={subjectsLevelFilterId}
            onContextChange={handleSubjectsContextChange}
          />
        ) : pageTab === 4 ? (
          <CurriculumGradingSystemTab
            ref={gradingTabRef}
            curriculumId={classesCurriculumId}
            onCurriculumChange={(id) => {
              setClassesCurriculumId(id || "");
              syncTabUrl(4, { curriculumId: id || "" });
            }}
          />
        ) : loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: primaryRed }} />
          </Box>
        ) : (
          <TableContainer
            sx={{
              borderRadius: 2,
              overflow: "auto",
              border: `1px solid ${primaryLight}`,
              boxShadow: `0 8px 28px -12px ${primaryRed}33`,
              bgcolor: "rgba(255,255,255,0.98)",
            }}
          >
            <Table size="medium" sx={{ minWidth: 560 }}>
              <TableHead>
                <TableRow
                  sx={{
                    background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
                    "& .MuiTableCell-head": {
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      borderBottom: "none",
                    },
                  }}
                >
                  <TableCell width={56}>No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                        No curricula yet. Create one with a name and your own type label.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ color: "text.secondary" }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{r.type || "—"}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{r.period?.trim() || "—"}</TableCell>
                      <TableCell sx={{ color: "text.secondary", maxWidth: 360 }}>{truncate(r.description, 140)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small" aria-label="View curriculum" onClick={() => setViewCurriculumRow(r)} sx={{ color: primaryDark }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" aria-label="Edit curriculum" onClick={() => openEditCurriculum(r)} sx={{ color: primaryRed }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" aria-label="Delete curriculum" onClick={() => handleDelete(r)} sx={{ color: primaryRed }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                borderTop: `1px solid ${primaryLight}`,
                "& .MuiTablePagination-toolbar": { fontWeight: 600 },
              }}
            />
          </TableContainer>
        )}
      </Box>

      <Dialog open={!!viewCurriculumRow} onClose={() => setViewCurriculumRow(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          Curriculum details
          <IconButton onClick={() => setViewCurriculumRow(null)} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2 }}>
          {viewCurriculumRow && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>{viewCurriculumRow.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                Type
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{viewCurriculumRow.type || "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Period
              </Typography>
              <Typography>{viewCurriculumRow.period?.trim() || "—"}</Typography>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{truncate(viewCurriculumRow.description, 600)}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewCurriculumRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editCurriculumOpen} onClose={() => !editCurriculumSaving && setEditCurriculumOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${primaryRed} 0%, ${primaryDark} 100%)`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          Edit curriculum
          <IconButton onClick={() => setEditCurriculumOpen(false)} disabled={editCurriculumSaving} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 2, overflow: "visible" }}>
          <Stack spacing={2}>
            <TextField label="Name" fullWidth required value={editCurriculumForm.name} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Type" fullWidth required value={editCurriculumForm.type} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, type: e.target.value }))} />
            <TextField label="Period" fullWidth value={editCurriculumForm.period} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, period: e.target.value }))} helperText="Optional — length until completion" />
            <TextField label="Description" fullWidth multiline minRows={3} value={editCurriculumForm.description} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, description: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditCurriculumOpen(false)} disabled={editCurriculumSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditCurriculumSubmit} disabled={editCurriculumSaving} sx={{ bgcolor: primaryRed, "&:hover": { bgcolor: primaryDark } }}>
            {editCurriculumSaving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
