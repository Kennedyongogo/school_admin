import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
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
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  AccountTree as AccountTreeIcon,
  Toc as TocIcon,
  Subject as SubjectIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { authJsonHeaders, fetchAllCurricula, truncateText, primaryRed, primaryDark, inputSx, actionIconSx } from "./curriculumShared";
import {
  PremiumDialog,
  DetailField,
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
} from "./curriculumUi";

async function fetchClassesForCurriculum(token, curriculumId) {
  const out = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 100) {
    const params = new URLSearchParams({ page: String(page), limit: "100" });
    const res = await fetch(`/api/curricula/${curriculumId}/classes?${params}`, {
      headers: authJsonHeaders(token),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `Could not load classes (${res.status})`);
    const chunk = Array.isArray(data.data) ? data.data : [];
    out.push(...chunk);
    totalPages = data.pagination?.totalPages ?? 1;
    page += 1;
  }
  return out;
}

async function fetchLevelsForClass(token, curriculumId, classId) {
  const res = await fetch(`/api/curricula/${curriculumId}/classes/${classId}/levels`, {
    headers: authJsonHeaders(token),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.message || `Could not load terms (${res.status})`);
  return Array.isArray(data.data) ? data.data : [];
}

function topicDisplayName(t) {
  return String(t?.name ?? t?.title ?? "").trim();
}

function sortTopicsFlat(flat) {
  return [...flat].sort((a, b) => {
    const oa = a.order_index ?? 0;
    const ob = b.order_index ?? 0;
    if (oa !== ob) return oa - ob;
    return topicDisplayName(a).localeCompare(topicDisplayName(b));
  });
}

function TopicBranch({ nodes }) {
  if (!nodes?.length) return null;
  return (
    <Stack component="ul" sx={{ pl: 2, my: 0, mb: 0 }}>
      {nodes.map((n) => (
        <Typography component="li" key={n.id} variant="body2" sx={{ mb: 0.75 }}>
          <Typography component="span" sx={{ fontWeight: 700 }}>
            {topicDisplayName(n)}
          </Typography>
          {n.description ? (
            <Typography component="span" color="text.secondary" sx={{ display: "block", fontSize: "0.85em", mt: 0.25 }}>
              {truncateText(String(n.description), 120)}
            </Typography>
          ) : null}
          {n.subtopics?.length ? (
            <Stack component="ul" sx={{ pl: 2, my: 0.5, mb: 0 }}>
              {n.subtopics.map((s) => (
                <Typography component="li" key={s.id} variant="caption" color="text.secondary" sx={{ display: "list-item", mb: 0.25 }}>
                  {topicDisplayName(s)}
                  {s.description ? ` — ${truncateText(String(s.description), 60)}` : ""}
                </Typography>
              ))}
            </Stack>
          ) : null}
        </Typography>
      ))}
    </Stack>
  );
}

const CurriculumSubjectsTab = forwardRef(function CurriculumSubjectsTab(
  { curriculumId, filterClassId, filterLevelId, onContextChange },
  ref
) {
  const [curriculaOptions, setCurriculaOptions] = useState([]);
  const [curriculaLoading, setCurriculaLoading] = useState(true);
  const [curriculaError, setCurriculaError] = useState(null);
  const curriculaLoadingRef = useRef(true);
  const curriculaErrorRef = useRef(null);

  useEffect(() => {
    curriculaLoadingRef.current = curriculaLoading;
  }, [curriculaLoading]);
  useEffect(() => {
    curriculaErrorRef.current = curriculaError;
  }, [curriculaError]);

  const [filterCurriculumId, setFilterCurriculumId] = useState(curriculumId || "");
  const [filterClsId, setFilterClsId] = useState(filterClassId || "");
  const [filterLvlId, setFilterLvlId] = useState(filterLevelId || "");
  const [classOptions, setClassOptions] = useState([]);
  const [levelOptions, setLevelOptions] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [levelsLoading, setLevelsLoading] = useState(false);

  useEffect(() => {
    setFilterCurriculumId(curriculumId || "");
  }, [curriculumId]);
  useEffect(() => {
    setFilterClsId(filterClassId || "");
  }, [filterClassId]);
  useEffect(() => {
    setFilterLvlId(filterLevelId || "");
  }, [filterLevelId]);

  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [dialogCurriculumId, setDialogCurriculumId] = useState("");
  const [dialogClassId, setDialogClassId] = useState("");
  const [dialogLevelId, setDialogLevelId] = useState("");
  const [dialogClassOptions, setDialogClassOptions] = useState([]);
  const [dialogLevelOptions, setDialogLevelOptions] = useState([]);
  const [dialogClassesLoading, setDialogClassesLoading] = useState(false);
  const [dialogLevelsLoading, setDialogLevelsLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_core: true,
    is_active: true,
  });

  const [viewRow, setViewRow] = useState(null);
  const [viewTopics, setViewTopics] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    is_core: true,
    is_active: true,
  });
  const [editClassId, setEditClassId] = useState("");
  const [editLevelId, setEditLevelId] = useState("");
  const [editClassOptions, setEditClassOptions] = useState([]);
  const [editLevelOptions, setEditLevelOptions] = useState([]);
  const [editClassesLoading, setEditClassesLoading] = useState(false);
  const [editLevelsLoading, setEditLevelsLoading] = useState(false);

  const [topicsDialogOpen, setTopicsDialogOpen] = useState(false);
  const [topicsDialogSubject, setTopicsDialogSubject] = useState(null);
  const [topicsFlat, setTopicsFlat] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicAddSaving, setTopicAddSaving] = useState(false);
  const [topicForm, setTopicForm] = useState({
    name: "",
    description: "",
    order_index: "0",
  });

  const [topicEditOpen, setTopicEditOpen] = useState(false);
  const [topicEditTopic, setTopicEditTopic] = useState(null);
  const [topicEditSaving, setTopicEditSaving] = useState(false);
  const [topicEditForm, setTopicEditForm] = useState({
    name: "",
    description: "",
    order_index: "0",
    is_active: true,
  });

  const [subtopicsTopic, setSubtopicsTopic] = useState(null);
  const [subtopicsList, setSubtopicsList] = useState([]);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);
  const [subtopicSaving, setSubtopicSaving] = useState(false);
  const [subtopicForm, setSubtopicForm] = useState({ name: "", description: "", order_index: "0" });
  const [subtopicEditingId, setSubtopicEditingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setCurriculaError("Please sign in again.");
        setCurriculaLoading(false);
        return;
      }
      setCurriculaLoading(true);
      setCurriculaError(null);
      try {
        const list = await fetchAllCurricula(token);
        if (!cancelled) setCurriculaOptions(list);
      } catch (e) {
        if (!cancelled) {
          setCurriculaError(e.message || "Failed to load curricula.");
          setCurriculaOptions([]);
        }
      } finally {
        if (!cancelled) setCurriculaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!filterCurriculumId) {
        setClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, filterCurriculumId);
        if (!cancelled) {
          setClassOptions(list);
          if (filterClsId && !list.some((c) => String(c.id) === String(filterClsId))) {
            setFilterClsId("");
            setFilterLvlId("");
            onContextChange?.(filterCurriculumId, "", "");
          }
        }
      } catch {
        if (!cancelled) setClassOptions([]);
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterCurriculumId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!filterCurriculumId || !filterClsId) {
        setLevelOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setLevelsLoading(true);
      try {
        const list = await fetchLevelsForClass(token, filterCurriculumId, filterClsId);
        if (!cancelled) {
          setLevelOptions(list);
          if (filterLvlId && !list.some((l) => String(l.id) === String(filterLvlId))) {
            setFilterLvlId("");
            onContextChange?.(filterCurriculumId, filterClsId, "");
          }
        }
      } catch {
        if (!cancelled) setLevelOptions([]);
      } finally {
        if (!cancelled) setLevelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterCurriculumId, filterClsId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dialogCurriculumId) {
        setDialogClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setDialogClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, dialogCurriculumId);
        if (!cancelled) setDialogClassOptions(list);
      } catch {
        if (!cancelled) setDialogClassOptions([]);
      } finally {
        if (!cancelled) setDialogClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogCurriculumId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dialogCurriculumId || !dialogClassId) {
        setDialogLevelOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setDialogLevelsLoading(true);
      try {
        const list = await fetchLevelsForClass(token, dialogCurriculumId, dialogClassId);
        if (!cancelled) setDialogLevelOptions(list);
      } catch {
        if (!cancelled) setDialogLevelOptions([]);
      } finally {
        if (!cancelled) setDialogLevelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogCurriculumId, dialogClassId]);

  const editCurriculumKey = editRow?.curriculum_id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editOpen || !editCurriculumKey) {
        setEditClassOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setEditClassesLoading(true);
      try {
        const list = await fetchClassesForCurriculum(token, editCurriculumKey);
        if (!cancelled) setEditClassOptions(list);
      } catch {
        if (!cancelled) setEditClassOptions([]);
      } finally {
        if (!cancelled) setEditClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editOpen, editCurriculumKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editOpen || !editCurriculumKey || !editClassId) {
        setEditLevelOptions([]);
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) return;
      setEditLevelsLoading(true);
      try {
        const list = await fetchLevelsForClass(token, editCurriculumKey, editClassId);
        if (!cancelled) setEditLevelOptions(list);
      } catch {
        if (!cancelled) setEditLevelOptions([]);
      } finally {
        if (!cancelled) setEditLevelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editOpen, editCurriculumKey, editClassId]);

  const fetchSubjects = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setSubjectsError("Please sign in again.");
      setRows([]);
      setTotalRows(0);
      setLoadingSubjects(false);
      return;
    }
    setLoadingSubjects(true);
    setSubjectsError(null);
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
      });
      if (filterCurriculumId) params.set("curriculum_id", filterCurriculumId);
      if (filterClsId) params.set("curriculum_class_id", filterClsId);
      if (filterLvlId) params.set("curriculum_class_level_id", filterLvlId);
      const res = await fetch(`/api/curricula/all-subjects?${params}`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Could not load subjects (${res.status})`);
      }
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalRows(data.pagination?.total ?? 0);
    } catch (e) {
      setSubjectsError(e.message || "Failed to load subjects.");
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoadingSubjects(false);
    }
  }, [page, rowsPerPage, filterCurriculumId, filterClsId, filterLvlId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const openCreate = useCallback(() => {
    setDialogCurriculumId(filterCurriculumId || curriculumId || "");
    setDialogClassId("");
    setDialogLevelId("");
    setForm({
      name: "",
      description: "",
      is_core: true,
      is_active: true,
    });
    setDialogOpen(true);
  }, [curriculumId, filterCurriculumId]);

  useImperativeHandle(
    ref,
    () => ({
      openCreateDialog() {
        if (curriculaLoadingRef.current) {
          Swal.fire({ icon: "info", title: "Please wait", text: "Loading curricula…", timer: 1600, showConfirmButton: false });
          return;
        }
        if (curriculaErrorRef.current) {
          Swal.fire({ icon: "error", title: "Unavailable", text: "Fix curriculum loading errors before creating a subject." });
          return;
        }
        openCreate();
      },
    }),
    [openCreate]
  );

  const handleFilterCurriculumChange = (id) => {
    setFilterCurriculumId(id);
    setFilterClsId("");
    setFilterLvlId("");
    setPage(0);
    onContextChange?.(id, "", "");
  };

  const handleFilterClassChange = (clsId) => {
    setFilterClsId(clsId);
    setFilterLvlId("");
    setPage(0);
    onContextChange?.(filterCurriculumId, clsId, "");
  };

  const handleFilterLevelChange = (lvlId) => {
    setFilterLvlId(lvlId);
    setPage(0);
    onContextChange?.(filterCurriculumId, filterClsId, lvlId);
  };

  const buildSubjectPayload = (body) => {
    const payload = {
      name: body.name.trim(),
      description: body.description.trim() || null,
      is_core: body.is_core,
      is_active: body.is_active,
    };
    if (body.curriculum_class_id) payload.curriculum_class_id = body.curriculum_class_id;
    else payload.curriculum_class_id = null;
    if (body.curriculum_class_level_id) payload.curriculum_class_level_id = body.curriculum_class_level_id;
    else payload.curriculum_class_level_id = null;
    return payload;
  };

  const handleCreateSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token || !dialogCurriculumId) {
      Swal.fire({ icon: "warning", title: "Required", text: "Select a curriculum." });
      return;
    }
    const name = form.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Name is required." });
      return;
    }
    setSaving(true);
    try {
      const payload = buildSubjectPayload({
        ...form,
        name,
        curriculum_class_id: dialogClassId || null,
        curriculum_class_level_id: dialogLevelId || null,
      });
      const res = await fetch(`/api/curricula/${dialogCurriculumId}/subjects`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Create failed");
      }
      setDialogOpen(false);
      await Swal.fire({ icon: "success", title: "Subject added", timer: 1400, showConfirmButton: false });
      fetchSubjects();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row) => {
    const token = localStorage.getItem("token");
    const cid = row.curriculum_id;
    if (!token || !cid) return;
    setViewRow(row);
    setViewTopics([]);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${row.id}?include_topics=true`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not load details");
      }
      setViewTopics(Array.isArray(data.data?.topic_tree) ? data.data.topic_tree : []);
    } catch {
      setViewTopics([]);
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditClassId(row.curriculum_class_id || "");
    setEditLevelId(row.curriculum_class_level_id || "");
    setEditForm({
      name: row.name || "",
      description: row.description || "",
      is_core: !!row.is_core,
      is_active: !!row.is_active,
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    const cid = editRow?.curriculum_id;
    if (!token || !editRow?.id || !cid) return;
    const name = editForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Name is required." });
      return;
    }
    setEditSaving(true);
    try {
      const payload = buildSubjectPayload({
        ...editForm,
        name,
        curriculum_class_id: editClassId || null,
        curriculum_class_level_id: editLevelId || null,
      });
      const res = await fetch(`/api/curricula/${cid}/subjects/${editRow.id}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Update failed");
      }
      setEditOpen(false);
      await Swal.fire({ icon: "success", title: "Saved", timer: 1400, showConfirmButton: false });
      fetchSubjects();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setEditSaving(false);
    }
  };

  const loadTopicsForDialog = useCallback(async (subjectRow) => {
    const token = localStorage.getItem("token");
    const cid = subjectRow?.curriculum_id;
    const sid = subjectRow?.id;
    if (!token || !cid || !sid) {
      setTopicsFlat([]);
      return;
    }
    setTopicsLoading(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not load topics");
      }
      setTopicsFlat(Array.isArray(data.data) ? data.data : []);
    } catch {
      setTopicsFlat([]);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const closeSubtopicsPanel = () => {
    setSubtopicsTopic(null);
    setSubtopicsList([]);
    setSubtopicEditingId(null);
    setSubtopicForm({ name: "", description: "", order_index: "0" });
  };

  const openTopicsManageDialog = (row) => {
    setTopicEditOpen(false);
    setTopicEditTopic(null);
    closeSubtopicsPanel();
    setTopicsDialogSubject(row);
    setTopicForm({
      name: "",
      description: "",
      order_index: "0",
    });
    setTopicsDialogOpen(true);
    loadTopicsForDialog(row);
  };

  const closeTopicsManageDialog = () => {
    if (topicAddSaving || topicEditSaving || subtopicSaving) return;
    setTopicsDialogOpen(false);
    setTopicsDialogSubject(null);
    setTopicsFlat([]);
    setTopicEditOpen(false);
    setTopicEditTopic(null);
    closeSubtopicsPanel();
  };

  const openTopicEditDialog = (topicRow) => {
    const subj = topicsDialogSubject;
    if (!subj) return;
    setTopicEditTopic({ ...topicRow, _subject: subj });
    setTopicEditForm({
      name: topicDisplayName(topicRow),
      description: topicRow.description != null ? String(topicRow.description) : "",
      order_index: String(topicRow.order_index ?? 0),
      is_active: topicRow.is_active !== false,
    });
    setTopicEditOpen(true);
  };

  const closeTopicEditDialog = () => {
    if (topicEditSaving) return;
    setTopicEditOpen(false);
    setTopicEditTopic(null);
  };

  const handleTopicEditSave = async () => {
    const token = localStorage.getItem("token");
    const t = topicEditTopic;
    const subj = t?._subject;
    const cid = subj?.curriculum_id;
    const sid = subj?.id;
    const tid = t?.id;
    if (!token || !cid || !sid || !tid) return;
    const name = topicEditForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Topic name is required." });
      return;
    }
    const oi = parseInt(topicEditForm.order_index, 10);
    setTopicEditSaving(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics/${tid}`, {
        method: "PUT",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          name,
          description: topicEditForm.description.trim() || null,
          order_index: Number.isNaN(oi) ? 0 : oi,
          is_active: topicEditForm.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not save topic");
      }
      closeTopicEditDialog();
      await loadTopicsForDialog(subj);
      await Swal.fire({ icon: "success", title: "Topic saved", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setTopicEditSaving(false);
    }
  };

  const handleTopicEditDelete = async () => {
    const token = localStorage.getItem("token");
    const t = topicEditTopic;
    const subj = t?._subject;
    const cid = subj?.curriculum_id;
    const sid = subj?.id;
    const tid = t?.id;
    if (!token || !cid || !sid || !tid) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete topic?",
      text: topicDisplayName(t),
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    const panelTopicId = subtopicsTopic?.id;
    setTopicEditSaving(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics/${tid}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      closeTopicEditDialog();
      if (panelTopicId === tid) {
        closeSubtopicsPanel();
      }
      await loadTopicsForDialog(subj);
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setTopicEditSaving(false);
    }
  };

  const loadSubtopicsForTopic = useCallback(async (topicRow, subjectRow) => {
    const token = localStorage.getItem("token");
    const cid = subjectRow?.curriculum_id;
    const sid = subjectRow?.id;
    const tid = topicRow?.id;
    if (!token || !cid || !sid || !tid) {
      setSubtopicsList([]);
      return;
    }
    setSubtopicsLoading(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics/${tid}/subtopics`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not load subtopics");
      }
      setSubtopicsList(Array.isArray(data.data) ? data.data : []);
    } catch {
      setSubtopicsList([]);
    } finally {
      setSubtopicsLoading(false);
    }
  }, []);

  const toggleSubtopicsPanelForTopic = (topicRow) => {
    const subj = topicsDialogSubject;
    if (!subj) return;
    if (subtopicsTopic?.id === topicRow.id) {
      closeSubtopicsPanel();
      return;
    }
    setSubtopicEditingId(null);
    setSubtopicForm({ name: "", description: "", order_index: "0" });
    setSubtopicsTopic({ ...topicRow, _subject: subj });
    loadSubtopicsForTopic(topicRow, subj);
  };

  const handleSubtopicFormSave = async () => {
    const token = localStorage.getItem("token");
    const t = subtopicsTopic;
    const subj = t?._subject;
    const cid = subj?.curriculum_id;
    const sid = subj?.id;
    const tid = t?.id;
    if (!token || !cid || !sid || !tid) return;
    const name = subtopicForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Subtopic name is required." });
      return;
    }
    const oi = parseInt(subtopicForm.order_index, 10);
    const body = {
      name,
      description: subtopicForm.description.trim() || undefined,
      order_index: Number.isNaN(oi) ? 0 : oi,
    };
    const editingId = subtopicEditingId;
    setSubtopicSaving(true);
    try {
      const url = editingId
        ? `/api/curricula/${cid}/subjects/${sid}/topics/${tid}/subtopics/${editingId}`
        : `/api/curricula/${cid}/subjects/${sid}/topics/${tid}/subtopics`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not save subtopic");
      }
      setSubtopicEditingId(null);
      setSubtopicForm({ name: "", description: "", order_index: "0" });
      await loadSubtopicsForTopic(t, subj);
      await Swal.fire({
        icon: "success",
        title: editingId ? "Updated" : "Added",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSubtopicSaving(false);
    }
  };

  const handleSubtopicDelete = async (sub) => {
    const token = localStorage.getItem("token");
    const t = subtopicsTopic;
    const subj = t?._subject;
    const cid = subj?.curriculum_id;
    const sid = subj?.id;
    const tid = t?.id;
    if (!token || !cid || !sid || !tid || !sub?.id) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete subtopic?",
      text: topicDisplayName(sub),
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    setSubtopicSaving(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics/${tid}/subtopics/${sub.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      if (subtopicEditingId === sub.id) {
        setSubtopicEditingId(null);
        setSubtopicForm({ name: "", description: "", order_index: "0" });
      }
      await loadSubtopicsForTopic(t, subj);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setSubtopicSaving(false);
    }
  };

  const handleAddTopic = async () => {
    const token = localStorage.getItem("token");
    const row = topicsDialogSubject;
    const cid = row?.curriculum_id;
    const sid = row?.id;
    if (!token || !cid || !sid) return;
    const name = topicForm.name.trim();
    if (!name) {
      Swal.fire({ icon: "warning", title: "Required", text: "Topic name is required." });
      return;
    }
    const oi = parseInt(topicForm.order_index, 10);
    const body = {
      name,
      description: topicForm.description.trim() || undefined,
      order_index: Number.isNaN(oi) ? 0 : oi,
    };
    setTopicAddSaving(true);
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${sid}/topics`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not add topic");
      }
      setTopicForm((f) => ({
        ...f,
        name: "",
        description: "",
        order_index: "0",
      }));
      await loadTopicsForDialog(row);
      await Swal.fire({ icon: "success", title: "Topic added", timer: 1200, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    } finally {
      setTopicAddSaving(false);
    }
  };

  const handleDelete = async (row) => {
    const token = localStorage.getItem("token");
    const cid = row.curriculum_id;
    if (!token || !cid) return;
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete subject?",
      text: row.name,
      showCancelButton: true,
      confirmButtonColor: primaryDark,
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/curricula/${cid}/subjects/${row.id}`, {
        method: "DELETE",
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Delete failed");
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1400, showConfirmButton: false });
      fetchSubjects();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error", text: e.message });
    }
  };

  const tableColSpan = 6;
  const actionsWidth = 172;

  const sortedTopicsDisplay = sortTopicsFlat(topicsFlat);

  return (
    <>
      {curriculaError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setCurriculaError(null)}>
          {curriculaError} Managing subjects may be unavailable until this is resolved.
        </Alert>
      )}

      <Stack spacing={2}>
        <Box sx={{ width: "100%", textAlign: "right" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              display: "inline-flex",
              alignItems: { xs: "flex-end", sm: "center" },
              textAlign: "left",
              verticalAlign: "top",
              maxWidth: "100%",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 260 }, ...inputSx }} disabled={curriculaLoading}>
              <InputLabel id="subj-filter-curr-label">Curriculum</InputLabel>
              <Select
                labelId="subj-filter-curr-label"
                label="Curriculum"
                value={filterCurriculumId}
                onChange={(e) => handleFilterCurriculumChange(e.target.value)}
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

            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 240 }, ...inputSx }} disabled={!filterCurriculumId || classesLoading}>
              <InputLabel id="subj-filter-class-label">Class filter</InputLabel>
              <Select
                labelId="subj-filter-class-label"
                label="Class filter"
                value={filterClsId}
                onChange={(e) => handleFilterClassChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>All classes</em>
                </MenuItem>
                {classOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                    {c.code ? ` (${c.code})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: { xs: "min(100%, 320px)", sm: 220 }, ...inputSx }} disabled={!filterClsId || levelsLoading}>
              <InputLabel id="subj-filter-term-label">Term filter</InputLabel>
              <Select
                labelId="subj-filter-term-label"
                label="Term filter"
                value={filterLvlId}
                onChange={(e) => handleFilterLevelChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>All terms</em>
                </MenuItem>
                {levelOptions.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        <TabPanelShell loading={loadingSubjects} error={subjectsError} onDismissError={() => setSubjectsError(null)}>
          {!loadingSubjects && (
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
                  labelRowsPerPage="Rows per page"
                  sx={tablePaginationSx}
                />
              }
            >
              <Table size="medium" sx={{ minWidth: 560, tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell width={52}>No.</TableCell>
                    <TableCell>Curriculum</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Term</TableCell>
                    <TableCell align="right" sx={{ width: actionsWidth, minWidth: actionsWidth, whiteSpace: "nowrap" }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={tableColSpan}>
                        <EmptyTableRow message="No subjects yet. Use Add subject in the header, or adjust filters." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, idx) => (
                      <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.curriculum?.name || "—"}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{r.curriculum_class?.name || "—"}</TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>{r.curriculum_class_level?.name || "—"}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            width: actionsWidth,
                            minWidth: actionsWidth,
                            whiteSpace: "nowrap",
                            verticalAlign: "middle",
                            py: 0.5,
                          }}
                        >
                          <Tooltip title="Topics & subtopics">
                            <IconButton size="small" aria-label="Topics and subtopics" onClick={() => openTopicsManageDialog(r)} sx={actionIconSx}>
                              <AccountTreeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton size="small" aria-label="View subject" onClick={() => openView(r)} sx={actionIconSx}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" aria-label="Edit subject" onClick={() => openEdit(r)} sx={actionIconSx}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              aria-label="Delete subject"
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
      </Stack>

      <PremiumDialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        title="New subject"
        subtitle="Add a subject to a curriculum"
        icon={<SubjectIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => !saving && setDialogOpen(false)} disabled={saving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={saving} onClick={handleCreateSubmit}>
              Create
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={2}>
          <FormControl fullWidth required sx={inputSx} disabled={curriculaLoading}>
            <InputLabel id="dlg-subj-curr-label">Curriculum</InputLabel>
            <Select
              labelId="dlg-subj-curr-label"
              label="Curriculum"
              value={dialogCurriculumId}
              onChange={(e) => {
                setDialogCurriculumId(e.target.value);
                setDialogClassId("");
                setDialogLevelId("");
              }}
            >
              <MenuItem value="">
                <em>Select curriculum</em>
              </MenuItem>
              {curriculaOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={inputSx} disabled={!dialogCurriculumId || dialogClassesLoading}>
            <InputLabel id="dlg-subj-class-label">Class (optional)</InputLabel>
            <Select
              labelId="dlg-subj-class-label"
              label="Class (optional)"
              value={dialogClassId}
              onChange={(e) => {
                setDialogClassId(e.target.value);
                setDialogLevelId("");
              }}
            >
              <MenuItem value="">
                <em>Whole curriculum</em>
              </MenuItem>
              {dialogClassOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={inputSx} disabled={!dialogClassId || dialogLevelsLoading}>
            <InputLabel id="dlg-subj-term-label">Term (optional)</InputLabel>
            <Select labelId="dlg-subj-term-label" label="Term (optional)" value={dialogLevelId} onChange={(e) => setDialogLevelId(e.target.value)}>
              <MenuItem value="">
                <em>Not limited to one term</em>
              </MenuItem>
              {dialogLevelOptions.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Name" fullWidth required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} helperText="Unique per curriculum, or per term if a term is selected" sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={form.is_core ? "Core" : "Non-core"}
              onClick={() => setForm((f) => ({ ...f, is_core: !f.is_core }))}
              color={form.is_core ? "primary" : "default"}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
            <Chip
              label={form.is_active ? "Active" : "Inactive"}
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              color={form.is_active ? "success" : "default"}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
          </Stack>
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={viewRow?.name || "Subject details"}
        subtitle="Subject overview"
        icon={<SubjectIcon />}
        footer={<DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>}
      >
        {viewRow && (
          <Stack spacing={1.5}>
            <DetailField label="Curriculum" value={viewRow.curriculum?.name} />
            <DetailField label="Name" value={viewRow.name} />
            <DetailField
              label="Class / Term"
              value={`${viewRow.curriculum_class?.name || "—"}${viewRow.curriculum_class_level?.name ? ` · ${viewRow.curriculum_class_level.name}` : ""}`}
            />
            <DetailField label="Description" value={truncateText(viewRow.description, 400)} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Topics and subtopics
            </Typography>
            {viewLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={28} sx={{ color: primaryRed }} />
              </Box>
            ) : viewTopics.length === 0 ? (
              <Typography color="text.secondary">None defined yet.</Typography>
            ) : (
              <TopicBranch nodes={viewTopics} />
            )}
          </Stack>
        )}
      </PremiumDialog>

      <PremiumDialog
        open={editOpen}
        onClose={() => !editSaving && setEditOpen(false)}
        title="Edit subject"
        subtitle="Update subject details"
        icon={<SubjectIcon />}
        footer={
          <>
            <DialogGhostButton onClick={() => !editSaving && setEditOpen(false)} disabled={editSaving}>
              Cancel
            </DialogGhostButton>
            <DialogPrimaryButton loading={editSaving} onClick={handleEditSubmit}>
              Save
            </DialogPrimaryButton>
          </>
        }
      >
        <Stack spacing={2}>
          <FormControl fullWidth sx={inputSx} disabled={editClassesLoading}>
            <InputLabel id="edit-subj-class-label">Class (optional)</InputLabel>
            <Select
              labelId="edit-subj-class-label"
              label="Class (optional)"
              value={editClassId}
              onChange={(e) => {
                setEditClassId(e.target.value);
                setEditLevelId("");
              }}
            >
              <MenuItem value="">
                <em>Whole curriculum</em>
              </MenuItem>
              {editClassOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={inputSx} disabled={!editClassId || editLevelsLoading}>
            <InputLabel id="edit-subj-term-label">Term (optional)</InputLabel>
            <Select labelId="edit-subj-term-label" label="Term (optional)" value={editLevelId} onChange={(e) => setEditLevelId(e.target.value)}>
              <MenuItem value="">
                <em>Not limited to one term</em>
              </MenuItem>
              {editLevelOptions.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Name" fullWidth required value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} sx={inputSx} />
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={editForm.is_core ? "Core" : "Non-core"}
              onClick={() => !editSaving && setEditForm((f) => ({ ...f, is_core: !f.is_core }))}
              color={editForm.is_core ? "primary" : "default"}
              sx={{ fontWeight: 600, cursor: editSaving ? "default" : "pointer" }}
            />
            <Chip
              label={editForm.is_active ? "Active" : "Inactive"}
              onClick={() => !editSaving && setEditForm((f) => ({ ...f, is_active: !f.is_active }))}
              color={editForm.is_active ? "success" : "default"}
              sx={{ fontWeight: 600, cursor: editSaving ? "default" : "pointer" }}
            />
          </Stack>
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={topicsDialogOpen}
        onClose={closeTopicsManageDialog}
        title={`Topics — ${topicsDialogSubject?.name || ""}`}
        subtitle="Manage topics and subtopics"
        icon={<AccountTreeIcon />}
        footer={
          <>
            <DialogGhostButton onClick={closeTopicsManageDialog} disabled={topicAddSaving}>
              Close
            </DialogGhostButton>
            <DialogPrimaryButton loading={topicAddSaving} onClick={handleAddTopic}>
              Add topic
            </DialogPrimaryButton>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Use <strong>Edit</strong> (pencil) or click a topic row to change name, description, and order. Use the list icon to show or hide subtopics for that topic. Click the list icon again to hide.
        </Typography>
        <Paper variant="outlined" sx={{ mb: 2, maxHeight: 240, overflow: "auto", borderRadius: 2 }}>
          {topicsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: primaryRed }} />
            </Box>
          ) : sortedTopicsDisplay.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, px: 2, textAlign: "center" }}>
              No topics yet. Add one below.
            </Typography>
          ) : (
            <List dense disablePadding>
              {sortedTopicsDisplay.map((t) => (
                <ListItem
                  key={t.id}
                  disablePadding
                  sx={{
                    bgcolor: subtopicsTopic?.id === t.id ? "action.selected" : undefined,
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={0} alignItems="center" sx={{ pr: 0.5 }}>
                      <Tooltip title="Edit topic">
                        <IconButton
                          size="small"
                          aria-label="Edit topic"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTopicEditDialog(t);
                          }}
                          disabled={topicAddSaving}
                          sx={actionIconSx}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={subtopicsTopic?.id === t.id ? "Hide subtopics" : "Subtopics — add here"}>
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label={subtopicsTopic?.id === t.id ? "Hide subtopics" : "Show subtopics"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubtopicsPanelForTopic(t);
                          }}
                          disabled={topicAddSaving}
                          sx={{ ...actionIconSx, color: subtopicsTopic?.id === t.id ? primaryRed : undefined }}
                        >
                          <TocIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemButton onClick={() => openTopicEditDialog(t)} disabled={topicAddSaving}>
                    <ListItemText
                      primary={topicDisplayName(t)}
                      secondary={t.description ? truncateText(String(t.description), 80) : undefined}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
        {subtopicsTopic ? (
          <Paper variant="outlined" sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: "rgba(254, 226, 226, 0.35)" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Subtopics — {topicDisplayName(subtopicsTopic)}
              </Typography>
              <Button size="small" onClick={closeSubtopicsPanel} disabled={subtopicSaving}>
                Hide
              </Button>
            </Stack>
            <Paper variant="outlined" sx={{ mb: 2, maxHeight: 180, overflow: "auto", borderRadius: 2, bgcolor: "#fff" }}>
              {subtopicsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                  <CircularProgress size={24} sx={{ color: primaryRed }} />
                </Box>
              ) : subtopicsList.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2, px: 2, textAlign: "center" }} variant="body2">
                  No subtopics yet. Add one below.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {subtopicsList.map((s) => (
                    <ListItem
                      key={s.id}
                      secondaryAction={
                        <Stack direction="row" spacing={0}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              aria-label="Edit subtopic"
                              onClick={() => {
                                setSubtopicEditingId(s.id);
                                setSubtopicForm({
                                  name: topicDisplayName(s),
                                  description: s.description != null ? String(s.description) : "",
                                  order_index: String(s.order_index ?? 0),
                                });
                              }}
                              disabled={subtopicSaving}
                              sx={actionIconSx}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              aria-label="Delete subtopic"
                              onClick={() => handleSubtopicDelete(s)}
                              disabled={subtopicSaving}
                              sx={{ ...actionIconSx, "&:hover": { bgcolor: "#FEE2E2", color: primaryRed } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={topicDisplayName(s)}
                        secondary={s.description ? truncateText(String(s.description), 72) : `Order: ${s.order_index ?? 0}`}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              {subtopicEditingId ? "Edit subtopic" : "Add subtopic"}
            </Typography>
            <Stack spacing={1.5}>
              <TextField label="Name" fullWidth required size="small" value={subtopicForm.name} onChange={(e) => setSubtopicForm((f) => ({ ...f, name: e.target.value }))} disabled={subtopicSaving} sx={inputSx} />
              <TextField label="Description" fullWidth multiline minRows={2} size="small" value={subtopicForm.description} onChange={(e) => setSubtopicForm((f) => ({ ...f, description: e.target.value }))} disabled={subtopicSaving} sx={inputSx} />
              <TextField label="Order" fullWidth size="small" type="number" value={subtopicForm.order_index} onChange={(e) => setSubtopicForm((f) => ({ ...f, order_index: e.target.value }))} disabled={subtopicSaving} helperText="Lower numbers appear first" sx={inputSx} />
            </Stack>
            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              {subtopicEditingId ? (
                <DialogGhostButton
                  size="small"
                  onClick={() => {
                    setSubtopicEditingId(null);
                    setSubtopicForm({ name: "", description: "", order_index: "0" });
                  }}
                  disabled={subtopicSaving}
                >
                  Cancel edit
                </DialogGhostButton>
              ) : null}
              <DialogPrimaryButton size="small" loading={subtopicSaving} onClick={handleSubtopicFormSave}>
                {subtopicEditingId ? "Save subtopic" : "Add subtopic"}
              </DialogPrimaryButton>
            </Stack>
          </Paper>
        ) : null}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
          Add topic
        </Typography>
        <Stack spacing={2}>
          <TextField label="Name" fullWidth required size="small" value={topicForm.name} onChange={(e) => setTopicForm((f) => ({ ...f, name: e.target.value }))} disabled={topicAddSaving} sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} size="small" value={topicForm.description} onChange={(e) => setTopicForm((f) => ({ ...f, description: e.target.value }))} disabled={topicAddSaving} sx={inputSx} />
          <TextField label="Order" fullWidth size="small" type="number" value={topicForm.order_index} onChange={(e) => setTopicForm((f) => ({ ...f, order_index: e.target.value }))} disabled={topicAddSaving} helperText="Lower numbers appear first" sx={inputSx} />
        </Stack>
      </PremiumDialog>

      <PremiumDialog
        open={topicEditOpen}
        onClose={closeTopicEditDialog}
        title="Edit topic"
        subtitle="Update topic details"
        icon={<AccountTreeIcon />}
        footer={
          <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
            <Button color="error" onClick={handleTopicEditDelete} disabled={topicEditSaving} sx={{ textTransform: "none", fontWeight: 700 }}>
              Delete topic
            </Button>
            <Stack direction="row" spacing={1}>
              <DialogGhostButton onClick={closeTopicEditDialog} disabled={topicEditSaving}>
                Cancel
              </DialogGhostButton>
              <DialogPrimaryButton loading={topicEditSaving} onClick={handleTopicEditSave}>
                Save
              </DialogPrimaryButton>
            </Stack>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <TextField label="Name" fullWidth required value={topicEditForm.name} onChange={(e) => setTopicEditForm((f) => ({ ...f, name: e.target.value }))} disabled={topicEditSaving} sx={inputSx} />
          <TextField label="Description" fullWidth multiline minRows={2} value={topicEditForm.description} onChange={(e) => setTopicEditForm((f) => ({ ...f, description: e.target.value }))} disabled={topicEditSaving} sx={inputSx} />
          <TextField label="Order" fullWidth type="number" value={topicEditForm.order_index} onChange={(e) => setTopicEditForm((f) => ({ ...f, order_index: e.target.value }))} disabled={topicEditSaving} helperText="Lower numbers appear first" sx={inputSx} />
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              label={topicEditForm.is_active ? "Active" : "Inactive"}
              onClick={() => !topicEditSaving && setTopicEditForm((f) => ({ ...f, is_active: !f.is_active }))}
              color={topicEditForm.is_active ? "success" : "default"}
              sx={{ fontWeight: 600, cursor: topicEditSaving ? "default" : "pointer" }}
            />
          </Stack>
        </Stack>
      </PremiumDialog>
    </>
  );
});

export default CurriculumSubjectsTab;
