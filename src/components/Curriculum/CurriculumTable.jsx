import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  IconButton,
  Stack,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  TextField,
} from "@mui/material";
import {
  Add as AddIcon,
  MenuBook as MenuBookIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarMonthIcon,
  Subject as SubjectIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Rule as RuleIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import CurriculumClassesTab from "./CurriculumClassesTab";
import CurriculumClassLevelsTab from "./CurriculumClassLevelsTab";
import CurriculumSubjectsTab from "./CurriculumSubjectsTab";
import CurriculumGradingSystemTab from "./CurriculumGradingSystemTab";
import {
  authJsonHeaders,
  CURRICULUM_TABS,
  pageShellSx,
  elimuViewportSx,
  primaryRed,
  primaryDark,
  actionIconSx,
  truncateText,
  inputSx,
} from "./curriculumShared";
import {
  CurriculumHero,
  CurriculumTabs,
  HeroActionButton,
  PremiumDialog,
  DetailField,
  DataTableShell,
  TabPanelShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./curriculumUi";

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
    [searchParams, setSearchParams, classesCurriculumId, termsClassId, subjectsClassFilterId, subjectsLevelFilterId]
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
    if (pageTab === 0) fetchCurricula();
  }, [fetchCurricula, pageTab]);

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

  const handleTabChange = (v) => {
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

  const renderHeaderActions = () => {
    if (pageTab === 1) {
      return (
        <HeroActionButton variant="contained" startIcon={<SchoolIcon />} onClick={() => classesTabRef.current?.openCreateDialog?.()}>
          Create class
        </HeroActionButton>
      );
    }
    if (pageTab === 2) {
      return (
        <HeroActionButton variant="contained" startIcon={<CalendarMonthIcon />} onClick={() => termsTabRef.current?.openCreateDialog?.()}>
          Add term
        </HeroActionButton>
      );
    }
    if (pageTab === 3) {
      return (
        <HeroActionButton variant="contained" startIcon={<SubjectIcon />} onClick={() => subjectsTabRef.current?.openCreateDialog?.()}>
          Add subject
        </HeroActionButton>
      );
    }
    if (pageTab === 4) {
      return (
        <HeroActionButton variant="contained" startIcon={<RuleIcon />} onClick={() => gradingTabRef.current?.openCreateDialog?.()}>
          Add grading config
        </HeroActionButton>
      );
    }
    return (
      <HeroActionButton variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/curriculum/create")}>
        Create curriculum
      </HeroActionButton>
    );
  };

  return (
    <Box
      sx={{
        ...pageShellSx,
        ...elimuViewportSx,
        mx: { xs: -1.5, sm: -2, md: -3 },
        mt: { xs: -1, sm: -1.5 },
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        gap: 2,
      }}
    >
      <CurriculumHero
        title="Curriculum"
        subtitle="Pathways your school offers — including how long each runs until completion"
        icon={<MenuBookIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={renderHeaderActions()}
      />

      <CurriculumTabs activeTab={pageTab} onChange={handleTabChange} tabs={CURRICULUM_TABS} />

      {error && pageTab === 0 ? (
        <Alert severity="error" sx={{ borderRadius: "14px", flexShrink: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
        ) : (
          <TabPanelShell loading={loading} error={error} onDismissError={() => setError(null)}>
            {!loading && (
              <DataTableShell
                pagination={
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
                    sx={tablePaginationSx}
                  />
                }
              >
                <Table size="medium" sx={{ minWidth: 560 }}>
                  <TableHead>
                    <TableRow sx={tableHeadRowSx}>
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
                          <EmptyTableRow message="No curricula yet. Create one with a name and your own type label." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((r, idx) => (
                        <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{r.type || "—"}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{r.period?.trim() || "—"}</TableCell>
                          <TableCell sx={{ color: "text.secondary", maxWidth: 360 }}>{truncateText(r.description, 140)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View">
                              <IconButton size="small" aria-label="View curriculum" onClick={() => setViewCurriculumRow(r)} sx={actionIconSx}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" aria-label="Edit curriculum" onClick={() => openEditCurriculum(r)} sx={actionIconSx}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                aria-label="Delete curriculum"
                                onClick={() => handleDelete(r)}
                                sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </DataTableShell>
            )}
          </TabPanelShell>
        )}
      </Box>

      <PremiumDialog
        open={!!viewCurriculumRow}
        onClose={() => setViewCurriculumRow(null)}
        title="Curriculum details"
        subtitle={viewCurriculumRow?.type || undefined}
        icon={<MenuBookIcon />}
        footer={<DialogGhostButton onClick={() => setViewCurriculumRow(null)}>Close</DialogGhostButton>}
      >
        {viewCurriculumRow ? (
          <Stack spacing={1.5}>
            <DetailField label="Name" value={viewCurriculumRow.name} />
            <DetailField label="Type" value={viewCurriculumRow.type} />
            <DetailField label="Period" value={viewCurriculumRow.period} />
            <DetailField label="Description" value={truncateText(viewCurriculumRow.description, 600)} />
          </Stack>
        ) : null}
      </PremiumDialog>

      <PremiumDialog
        open={editCurriculumOpen}
        onClose={() => !editCurriculumSaving && setEditCurriculumOpen(false)}
        title="Edit curriculum"
        subtitle="Update pathway name, type, and details"
        icon={<EditIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => setEditCurriculumOpen(false)} disabled={editCurriculumSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editCurriculumSaving} onClick={handleEditCurriculumSubmit}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={2}>
          <TextField label="Name" fullWidth required value={editCurriculumForm.name} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Type" fullWidth required value={editCurriculumForm.type} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, type: e.target.value }))} sx={inputSx} />
          <TextField label="Period" fullWidth value={editCurriculumForm.period} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, period: e.target.value }))} helperText="Optional — length until completion" sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={3} value={editCurriculumForm.description} onChange={(e) => setEditCurriculumForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
        </Stack>
      </PremiumDialog>
    </Box>
  );
}
