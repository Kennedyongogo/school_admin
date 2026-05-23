import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const primaryRed = "#DC2626";
const primaryDark = "#B91C1C";
const accentLight = "#FEE2E2";

const authJsonHeaders = (token) => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${token}`,
});

function formatKes(n) {
  return `KES ${Number(n || 0).toLocaleString()}`;
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function studentName(row) {
  return row?.student?.user?.full_name || row?.student?.admission_number || "—";
}

function parentName(row) {
  return row?.parent?.user?.full_name || row?.parent?.user?.username || "—";
}

function DetailRow({ label, value }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: { sm: 160 }, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
        {value ?? "—"}
      </Typography>
    </Stack>
  );
}

export default function FeePaymentsTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [viewRow, setViewRow] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const apiPage = page + 1;
      const res = await fetch(`/api/fee-payments?page=${apiPage}&limit=${rowsPerPage}`, {
        headers: authJsonHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load payments.");
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(Number(data.pagination?.total) || 0);
    } catch (e) {
      setError(e.message || "Load failed.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const openView = async (row) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setViewRow(row);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/fee-payments/${row.id}`, { headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data) setViewRow(data.data);
    } catch {
      /* keep list row */
    } finally {
      setViewLoading(false);
    }
  };

  if (loading && rows.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress sx={{ color: primaryRed }} />
      </Box>
    );
  }

  const inv = viewRow?.fee_invoice;

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <TableContainer component={Card} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" width={56}>
                No
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No fee payments recorded yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => {
                const rowNo = page * rowsPerPage + idx + 1;
                return (
                  <TableRow key={r.id} hover>
                    <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      {rowNo}
                    </TableCell>
                    <TableCell>{formatDateTime(r.paid_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{studentName(r)}</TableCell>
                    <TableCell>{r.fee_invoice?.invoice_number || "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatKes(r.amount)}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{r.payment_method || "—"}</TableCell>
                    <TableCell>{r.reference || "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View payment">
                        <IconButton size="small" onClick={() => void openView(r)} sx={{ color: primaryDark }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Rows per page"
          sx={{
            borderTop: `1px solid ${accentLight}`,
            "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1 },
          }}
        />
      </TableContainer>

      <Dialog open={Boolean(viewRow)} onClose={() => setViewRow(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pr: 6, bgcolor: "#fff5f5", borderBottom: `1px solid ${accentLight}` }}>
          Fee payment details
          <IconButton aria-label="Close" onClick={() => setViewRow(null)} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={28} sx={{ color: primaryRed }} />
            </Box>
          ) : viewRow ? (
            <Stack spacing={1} divider={<Divider flexItem />}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryDark, mb: 0.5 }}>
                  Payment
                </Typography>
                <DetailRow label="Amount" value={formatKes(viewRow.amount)} />
                <DetailRow label="Paid at" value={formatDateTime(viewRow.paid_at)} />
                <DetailRow label="Method" value={viewRow.payment_method} />
                <DetailRow label="Reference" value={viewRow.reference} />
                <DetailRow label="Notes" value={viewRow.notes} />
                <DetailRow label="Recorded by" value={viewRow.recorded_by_user?.full_name || viewRow.recorded_by_user?.username} />
                <DetailRow label="Recorded on" value={formatDateTime(viewRow.created_at)} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryDark, mb: 0.5 }}>
                  Student
                </Typography>
                <DetailRow label="Name" value={studentName(viewRow)} />
                <DetailRow label="Admission no." value={viewRow.student?.admission_number} />
                <DetailRow label="Level" value={viewRow.curriculum_class_level?.name} />
                <DetailRow label="Parent" value={parentName(viewRow)} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: primaryDark, mb: 0.5 }}>
                  Invoice
                </Typography>
                <DetailRow label="Invoice no." value={inv?.invoice_number} />
                <DetailRow label="Status" value={inv?.status} />
                <DetailRow label="Amount due" value={inv ? formatKes(inv.amount_due) : "—"} />
                <DetailRow label="Amount paid (total)" value={inv ? formatKes(inv.amount_paid) : "—"} />
                <DetailRow label="Balance" value={inv ? formatKes(inv.balance) : "—"} />
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
