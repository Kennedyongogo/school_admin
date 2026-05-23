import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Swal from "sweetalert2";

const primaryRed = "#DC2626";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function studentLevelLabel(s) {
  return (
    s?.curriculum_class_level?.name ||
    s?.curriculum_class_level_id ||
    "—"
  );
}

export default function FeeInvoicesTab({ genOpen: genOpenProp, onGenOpenChange }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [genOpenLocal, setGenOpenLocal] = useState(false);
  const genOpen = genOpenProp !== undefined ? genOpenProp : genOpenLocal;
  const setGenOpen = onGenOpenChange || setGenOpenLocal;
  const [payOpen, setPayOpen] = useState(null);
  const [students, setStudents] = useState([]);
  const [genForm, setGenForm] = useState({ student_id: "", send_to_parent: true, notes: "" });
  const [payAmount, setPayAmount] = useState("");
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

  const recordPayment = async () => {
    const token = localStorage.getItem("token");
    const inv = payOpen;
    if (!token || !inv) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      await Swal.fire({ icon: "warning", title: "Enter a valid amount" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/fee-invoices/${inv.id}/payments`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({ amount, payment_method: "manual" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Payment failed.");
      const receipt = data.data?.payment_receipt;
      setPayOpen(null);
      setPayAmount("");
      await load();
      if (receipt?.has_excess && receipt.excess_from_payment > 0.01) {
        await Swal.fire({
          icon: "info",
          title: "Excess payment recorded",
          html: `
            <p style="text-align:left;margin:0 0 10px">
              Applied to invoice: <strong>KES ${Number(receipt.applied_to_invoice || 0).toLocaleString()}</strong><br/>
              Excess this payment: <strong>KES ${Number(receipt.excess_from_payment || 0).toLocaleString()}</strong><br/>
              Total credit on level: <strong>KES ${Number(receipt.invoice_credit_balance || 0).toLocaleString()}</strong>
            </p>
            <p style="text-align:left;margin:0;color:#4b5563">${receipt.carry_forward_message || ""}</p>
          `,
          confirmButtonText: "OK",
        });
      } else {
        await Swal.fire({ icon: "success", title: "Payment recorded", timer: 1200, showConfirmButton: false });
      }
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Alert severity="info">
        Invoices use each student&apos;s <strong>curriculum Term/level</strong> and the matching fee structure. Ensure the student has class, level, and a fee structure before generating.
      </Alert>
      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Paid</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No invoices yet. Generate one for a student with class, level, and fee structure set.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.invoice_number}</TableCell>
                  <TableCell>{r.student?.user?.full_name || r.student?.admission_number || "—"}</TableCell>
                  <TableCell>{r.curriculum_class_level?.name || "—"}</TableCell>
                  <TableCell>{Number(r.amount_due || 0).toLocaleString()}</TableCell>
                  <TableCell>{Number(r.amount_paid || 0).toLocaleString()}</TableCell>
                  <TableCell>{Number(r.balance || 0).toLocaleString()}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell align="right">
                    <Button size="small" disabled={r.status === "paid"} onClick={() => { setPayOpen(r); setPayAmount(String(r.balance || "")); }}>
                      Record payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate fee invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField select label="Student" required value={genForm.student_id} onChange={(e) => setGenForm((f) => ({ ...f, student_id: e.target.value }))} fullWidth>
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
              <Typography variant="body2" color="text.secondary">
                Fee level: <strong>{studentLevelLabel(selectedStudent)}</strong>
                {!selectedStudent.curriculum_class_level_id ? (
                  <> — set Term/level on the student profile first.</>
                ) : null}
              </Typography>
            ) : null}
            <TextField label="Notes (optional)" value={genForm.notes} onChange={(e) => setGenForm((f) => ({ ...f, notes: e.target.value }))} fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={busy || !genForm.student_id}
            onClick={() => void generateInvoice()}
            sx={{ bgcolor: primaryRed }}
          >
            {busy ? "Saving…" : "Generate & send"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(payOpen)} onClose={() => setPayOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Record payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Invoice {payOpen?.invoice_number} · Balance KES {Number(payOpen?.balance || 0).toLocaleString()}
          </Typography>
          <TextField fullWidth label="Amount (KES)" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(null)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={() => void recordPayment()} sx={{ bgcolor: primaryRed }}>
            {busy ? "Saving…" : "Post payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
