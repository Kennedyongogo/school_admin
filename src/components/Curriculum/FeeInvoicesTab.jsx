import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Swal from "sweetalert2";
import {
  authJsonHeaders,
  formatKes,
  formatDateTime,
  inputSx,
  primaryRed,
  fontBody,
  actionIconSx,
} from "../Accounting/accountingShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  PremiumDialog,
  DetailField,
  FormSection,
  DialogPrimaryButton,
  DialogGhostButton,
  EmptyTableRow,
  AccountingInfoBanner,
  InvoiceStatusChip,
  FeeBreakdownView,
} from "../Accounting/accountingUi";

function studentLevelLabel(s) {
  return s?.curriculum_class_level?.name || s?.curriculum_class_level_id || "—";
}

function studentName(row) {
  return row?.student?.user?.full_name || row?.student?.name || row?.student?.admission_number || "—";
}

function findTermInvoice(rows, studentId, levelId) {
  if (!studentId || !levelId) return null;
  return (
    rows.find(
      (r) =>
        String(r.student_id) === String(studentId) &&
        String(r.curriculum_class_level_id) === String(levelId) &&
        r.status !== "cancelled"
    ) || null
  );
}

function canCancelInvoice(inv) {
  if (!inv || inv.status === "cancelled" || inv.status === "paid") return false;
  return Number(inv.amount_paid || 0) <= 0.01;
}

export default function FeeInvoicesTab({ genOpen: genOpenProp, onGenOpenChange }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [genOpenLocal, setGenOpenLocal] = useState(false);
  const genOpen = genOpenProp !== undefined ? genOpenProp : genOpenLocal;
  const setGenOpen = onGenOpenChange || setGenOpenLocal;
  const [viewRow, setViewRow] = useState(null);
  const [students, setStudents] = useState([]);
  const [genForm, setGenForm] = useState({ student_id: "", send_to_parent: true, notes: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/fee-invoices?limit=100", { headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load invoices.");
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message || "Load failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/students?limit=200", { headers: authJsonHeaders(token) })
      .then((r) => r.json())
      .then((d) => setStudents(Array.isArray(d.data) ? d.data : []))
      .catch(() => setStudents([]));
  }, [load]);

  const selectedStudent = students.find((s) => String(s.id) === String(genForm.student_id));
  const selectedTermInvoice = selectedStudent
    ? findTermInvoice(rows, selectedStudent.id, selectedStudent.curriculum_class_level_id)
    : null;
  const generateBlocked = Boolean(selectedTermInvoice);

  const generateInvoice = async () => {
    const token = localStorage.getItem("token");
    if (!token || !genForm.student_id) return;
    setBusy(true);
    try {
      const res = await fetch("/api/fee-invoices/generate", {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({
          student_id: genForm.student_id,
          send_to_parent: Boolean(genForm.send_to_parent),
          notes: genForm.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not generate invoice.");
      setGenOpen(false);
      setGenForm({ student_id: "", send_to_parent: true, notes: "" });
      await load();
      await Swal.fire({ icon: "success", title: "Invoice created", timer: 1200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const cancelInvoice = async (inv) => {
    const token = localStorage.getItem("token");
    if (!token || !inv) return;
    const { value: reason, isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Cancel invoice?",
      text: `Cancel ${inv.invoice_number}? You can generate a new one for this term/level after cancelling.`,
      input: "text",
      inputLabel: "Reason (optional)",
      inputPlaceholder: "Created in error",
      showCancelButton: true,
      confirmButtonText: "Cancel invoice",
      confirmButtonColor: primaryRed,
    });
    if (!isConfirmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/fee-invoices/${inv.id}/cancel`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({ reason: reason || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not cancel invoice.");
      setViewRow(null);
      await load();
      await Swal.fire({ icon: "success", title: "Invoice cancelled", timer: 1200, showConfirmButton: false });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const breakdown = Array.isArray(viewRow?.payment_breakdown) ? viewRow.payment_breakdown : [];

  return (
    <TabPanelShell loading={loading} error={error || null} onDismissError={() => setError("")}>
      <Stack spacing={2}>
        <AccountingInfoBanner>
          <strong>One invoice per student per term/level.</strong> Generate again only when the student moves to a new
          term/level or billing cycle, or after cancelling an invoice that was created in error.
        </AccountingInfoBanner>

        <DataTableShell>
          <Table size="medium" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>Invoice</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" width={80}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyTableRow message="No invoices yet. Generate one for a student with class, level, and fee structure set." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 700 }}>{r.invoice_number}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 600 }}>
                      {r.student?.user?.full_name || r.student?.admission_number || "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>
                      {r.curriculum_class_level?.name || r.level_name || "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 600 }}>{formatKes(r.amount_due)}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{formatKes(r.amount_paid)}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 700 }}>{formatKes(r.balance)}</TableCell>
                    <TableCell>
                      <InvoiceStatusChip status={r.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View invoice">
                        <IconButton
                          size="small"
                          aria-label="View invoice"
                          onClick={() => setViewRow(r)}
                          sx={actionIconSx}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DataTableShell>

        <PremiumDialog
          open={genOpen}
          onClose={() => !busy && setGenOpen(false)}
          title="Generate fee invoice"
          subtitle="Create and send an invoice for a student"
          icon={<ReceiptLongIcon />}
          maxWidth="sm"
          footer={
            <>
              <DialogGhostButton onClick={() => setGenOpen(false)} disabled={busy}>
                Cancel
              </DialogGhostButton>
              <DialogPrimaryButton
                loading={busy}
                disabled={!genForm.student_id || generateBlocked}
                onClick={() => void generateInvoice()}
              >
                Generate & send
              </DialogPrimaryButton>
            </>
          }
        >
          <Stack spacing={2}>
            <FormSection title="Student">
              <TextField
                select
                label="Student"
                required
                value={genForm.student_id}
                onChange={(e) => setGenForm((f) => ({ ...f, student_id: e.target.value }))}
                fullWidth
                sx={inputSx}
              >
                <MenuItem value="">
                  <em>Select student</em>
                </MenuItem>
                {students.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.user?.full_name || s.admission_number} ({s.admission_number})
                    {s.curriculum_class_level?.name ? ` · ${s.curriculum_class_level.name}` : ""}
                  </MenuItem>
                ))}
              </TextField>
              {selectedStudent ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, fontFamily: fontBody }}>
                  Fee level: <strong>{studentLevelLabel(selectedStudent)}</strong>
                  {!selectedStudent.curriculum_class_level_id ? (
                    <> — set Term/level on the student profile first.</>
                  ) : null}
                </Typography>
              ) : null}
              {selectedTermInvoice ? (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: "12px" }}>
                  {selectedTermInvoice.status === "paid" ? (
                    <>
                      This student already has a <strong>paid</strong> invoice for this term/level (
                      {selectedTermInvoice.invoice_number}). Generate a new one only after they move to a new term/level.
                    </>
                  ) : (
                    <>
                      An active invoice already exists ({selectedTermInvoice.invoice_number}, balance{" "}
                      {formatKes(selectedTermInvoice.balance)}). Cancel it first if it was wrong.
                    </>
                  )}
                </Alert>
              ) : null}
            </FormSection>
            <TextField
              label="Notes (optional)"
              value={genForm.notes}
              onChange={(e) => setGenForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
              sx={inputSx}
            />
          </Stack>
        </PremiumDialog>

        <PremiumDialog
          open={Boolean(viewRow)}
          onClose={() => setViewRow(null)}
          title={viewRow?.invoice_number || "Invoice details"}
          subtitle="Invoice and student information"
          icon={<ReceiptLongIcon />}
          maxWidth="sm"
          footer={
            viewRow ? (
              <>
                <DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>
                {canCancelInvoice(viewRow) ? (
                  <DialogPrimaryButton
                    loading={busy}
                    onClick={() => void cancelInvoice(viewRow)}
                    sx={{ bgcolor: "#6B7280", "&:hover": { bgcolor: "#4B5563" } }}
                  >
                    Cancel invoice
                  </DialogPrimaryButton>
                ) : null}
              </>
            ) : null
          }
        >
          {viewRow ? (
            <Stack spacing={2}>
              <FormSection title="Invoice">
                <Stack spacing={1.25}>
                  <DetailField label="Invoice no." value={viewRow.invoice_number} />
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: fontBody,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        mb: 0.5,
                      }}
                    >
                      Status
                    </Typography>
                    <InvoiceStatusChip status={viewRow.status} />
                  </Box>
                  <DetailField label="Term fee" value={formatKes(viewRow.term_fee_amount ?? viewRow.amount_due)} />
                  <DetailField label="Amount due" value={formatKes(viewRow.amount_due)} />
                  <DetailField label="Amount paid" value={formatKes(viewRow.amount_paid)} />
                  <DetailField label="Balance" value={formatKes(viewRow.balance)} />
                  <DetailField label="Level credit" value={formatKes(viewRow.credit_balance)} />
                  <DetailField label="Sent at" value={formatDateTime(viewRow.sent_at)} />
                  <DetailField label="Created" value={formatDateTime(viewRow.created_at)} />
                  <DetailField label="Notes" value={viewRow.notes} />
                </Stack>
              </FormSection>
              <FormSection title="Student">
                <Stack spacing={1.25}>
                  <DetailField label="Name" value={studentName(viewRow)} />
                  <DetailField label="Admission no." value={viewRow.student?.admission_number} />
                  <DetailField
                    label="Level"
                    value={viewRow.curriculum_class_level?.name || viewRow.level_name}
                  />
                </Stack>
              </FormSection>
              {breakdown.length > 0 ? (
                <FormSection title="Payment breakdown">
                  <FeeBreakdownView breakdown={breakdown} />
                </FormSection>
              ) : null}
            </Stack>
          ) : null}
        </PremiumDialog>
      </Stack>
    </TabPanelShell>
  );
}
