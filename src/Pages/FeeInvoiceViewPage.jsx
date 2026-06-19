import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Swal from "sweetalert2";
import {
  authJsonHeaders,
  formatDateTime,
  formatKes,
  fullMainBleedSx,
  primaryRed,
  warmCream,
  fontBody,
  ghostBtnSx,
  actionIconSx,
} from "../components/Accounting/accountingShared";
import {
  AccountingHero,
  DataTableShell,
  DetailField,
  FormSection,
  FeeBreakdownView,
  InvoiceAmountSummary,
  InvoiceStatusChip,
  PaymentMethodChip,
  EmptyTableRow,
  tableHeadRowSx,
} from "../components/Accounting/accountingUi";

function studentName(row) {
  return row?.student?.user?.full_name || row?.student?.name || row?.student?.admission_number || "—";
}

function canCancelInvoice(inv) {
  if (!inv || inv.status === "cancelled" || inv.status === "paid") return false;
  return Number(inv.amount_paid || 0) <= 0.01;
}

export default function FeeInvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

  const goBack = () => navigate("/accounting", { state: { tab: 2 } });

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fee-invoices/${encodeURIComponent(id)}`, { headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load invoice.");
      setInvoice(data.data);
    } catch (e) {
      setError(e.message || "Load failed.");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelInvoice = async () => {
    const token = localStorage.getItem("token");
    if (!token || !invoice) return;
    const { value: reason, isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Cancel invoice?",
      text: `Cancel ${invoice.invoice_number}? You can generate a new one for this term/level after cancelling.`,
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
      const res = await fetch(`/api/fee-invoices/${invoice.id}/cancel`, {
        method: "POST",
        headers: authJsonHeaders(token),
        body: JSON.stringify({ reason: reason || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not cancel invoice.");
      await Swal.fire({ icon: "success", title: "Invoice cancelled", timer: 1200, showConfirmButton: false });
      goBack();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Failed", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const downloadReceiptPdf = async (payment) => {
    const token = localStorage.getItem("token");
    if (!token || !payment?.id) return;
    setDownloadingReceiptId(payment.id);
    setError("");
    try {
      const res = await fetch(`/api/fee-receipts/${encodeURIComponent(payment.id)}/pdf`, {
        headers: { ...authJsonHeaders(token), Accept: "application/pdf" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not download receipt PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e.message || "Could not download receipt PDF.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const termTotal = Number(invoice?.term_fee_amount ?? invoice?.amount_due ?? 0);
  const paid = Number(invoice?.amount_paid || 0);
  const balance = Number(invoice?.balance || 0);
  const pct = termTotal > 0 ? Math.min(100, Math.round((paid / termTotal) * 100)) : 0;
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  const breakdown = Array.isArray(invoice?.payment_breakdown) ? invoice.payment_breakdown : [];

  return (
    <Box
      sx={(theme) => ({
        ...fullMainBleedSx(theme),
        minHeight: "100%",
        bgcolor: warmCream,
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <AccountingHero
        title={invoice?.invoice_number || "Invoice"}
        subtitle={
          invoice
            ? `${studentName(invoice)} · ${invoice.curriculum_class_level?.name || invoice.level_name || "—"}`
            : "Invoice details"
        }
        icon={<ReceiptLongIcon sx={{ fontSize: 26, color: "#fff" }} />}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            {invoice ? <InvoiceStatusChip status={invoice.status} /> : null}
            {invoice && canCancelInvoice(invoice) ? (
              <Button
                variant="contained"
                disabled={busy}
                onClick={() => void cancelInvoice()}
                sx={{ bgcolor: "#6B7280", fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "#4B5563" } }}
              >
                Cancel invoice
              </Button>
            ) : null}
            <Tooltip title="Back to invoices">
              <IconButton
                onClick={goBack}
                aria-label="Back to invoices"
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  color: "#fff",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ borderRadius: "14px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: primaryRed }} />
        </Box>
      ) : !invoice ? (
        <Alert severity="warning" sx={{ borderRadius: "14px" }}>
          Invoice not found.
        </Alert>
      ) : (
        <Stack spacing={2.5} sx={{ width: "100%" }}>
          <FormSection title="Payment summary">
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                    Payment progress
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>
                    {pct}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: "rgba(220,38,38,0.12)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 5,
                      bgcolor: pct >= 100 ? "#16a34a" : primaryRed,
                    },
                  }}
                />
              </Box>
              <InvoiceAmountSummary
                termFee={termTotal}
                amountPaid={paid}
                balance={balance}
                creditBalance={invoice.credit_balance}
              />
            </Stack>
          </FormSection>

          <FormSection title="Student & invoice">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Stack spacing={1.25}>
                <DetailField label="Student" value={studentName(invoice)} />
                <DetailField label="Admission no." value={invoice.student?.admission_number} />
                <DetailField label="Class" value={invoice.curriculum_class?.name} />
                <DetailField label="Level / term" value={invoice.curriculum_class_level?.name || invoice.level_name} />
              </Stack>
              <Stack spacing={1.25}>
                <DetailField label="Curriculum" value={invoice.curriculum?.name} />
                <DetailField label="Sent to parent" value={formatDateTime(invoice.sent_at)} />
                <DetailField label="Created" value={formatDateTime(invoice.created_at)} />
                <DetailField label="Notes" value={invoice.notes} />
              </Stack>
            </Box>
          </FormSection>

          {breakdown.length > 0 ? (
            <FormSection title="Fee breakdown (1st & 2nd half)">
              <FeeBreakdownView breakdown={breakdown} />
            </FormSection>
          ) : null}

          <FormSection title="Payment history">
            <DataTableShell>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={tableHeadRowSx}>
                    <TableCell>Receipt</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right" width={72}>
                      PDF
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyTableRow message="No payments recorded on this invoice yet." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                        <TableCell sx={{ fontFamily: fontBody, fontWeight: 700 }}>{p.receipt_number || "—"}</TableCell>
                        <TableCell sx={{ fontFamily: fontBody }}>{formatDateTime(p.paid_at)}</TableCell>
                        <TableCell>
                          <PaymentMethodChip method={p.payment_method} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: fontBody }}>{p.reference || "—"}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: fontBody, fontWeight: 700 }}>
                          {formatKes(p.amount)}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Download receipt PDF">
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Download receipt PDF"
                                disabled={downloadingReceiptId === p.id}
                                onClick={() => void downloadReceiptPdf(p)}
                                sx={actionIconSx}
                              >
                                <DownloadOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </DataTableShell>
          </FormSection>

          <Stack direction="row" justifyContent="flex-start">
            <Button onClick={goBack} sx={ghostBtnSx}>
              Back to invoices
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
