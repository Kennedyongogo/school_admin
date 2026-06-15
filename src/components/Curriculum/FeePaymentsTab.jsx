import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  authJsonHeaders,
  formatKes,
  formatDateTime,
  fontBody,
  actionIconSx,
  primaryRed,
} from "../Accounting/accountingShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  PremiumDialog,
  DetailField,
  FormSection,
  DialogGhostButton,
  EmptyTableRow,
  PaymentMethodChip,
  InvoiceStatusChip,
} from "../Accounting/accountingUi";

function studentName(row) {
  return row?.student?.user?.full_name || row?.student?.admission_number || "—";
}

function parentName(row) {
  return row?.parent?.user?.full_name || row?.parent?.user?.username || "—";
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

  const inv = viewRow?.fee_invoice;

  return (
    <TabPanelShell
      loading={loading && rows.length === 0}
      error={error || null}
      onDismissError={() => setError("")}
    >
      <DataTableShell
        pagination={
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
            sx={tablePaginationSx}
          />
        }
      >
        <Table size="medium" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow sx={tableHeadRowSx}>
              <TableCell align="center" width={56}>
                No
              </TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Invoice</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Reference</TableCell>
              <TableCell align="right" width={80}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyTableRow message="No fee payments recorded yet." />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, idx) => {
                const rowNo = page * rowsPerPage + idx + 1;
                return (
                  <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell align="center" sx={{ color: "text.secondary", fontWeight: 600, fontFamily: fontBody }}>
                      {rowNo}
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{formatDateTime(r.paid_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontFamily: fontBody }}>{studentName(r)}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{r.fee_invoice?.invoice_number || "—"}</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: fontBody }}>{formatKes(r.amount)}</TableCell>
                    <TableCell>
                      <PaymentMethodChip method={r.payment_method} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{r.reference || "—"}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="View payment">
                        <IconButton
                          size="small"
                          aria-label="View payment"
                          onClick={() => void openView(r)}
                          sx={actionIconSx}
                        >
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
      </DataTableShell>

      <PremiumDialog
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="Fee payment details"
        subtitle={viewRow ? formatKes(viewRow.amount) : "Payment information"}
        icon={<PaidIcon />}
        maxWidth="sm"
        footer={<DialogGhostButton onClick={() => setViewRow(null)}>Close</DialogGhostButton>}
      >
        {viewLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} sx={{ color: primaryRed }} />
          </Box>
        ) : viewRow ? (
          <Stack spacing={2}>
            <FormSection title="Payment">
              <Stack spacing={1.25}>
                <DetailField label="Amount" value={formatKes(viewRow.amount)} />
                <DetailField label="Paid at" value={formatDateTime(viewRow.paid_at)} />
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
                    Method
                  </Typography>
                  <PaymentMethodChip method={viewRow.payment_method} />
                </Box>
                <DetailField label="Reference" value={viewRow.reference} />
                <DetailField label="Notes" value={viewRow.notes} />
                <DetailField
                  label="Recorded by"
                  value={viewRow.recorded_by_user?.full_name || viewRow.recorded_by_user?.username}
                />
                <DetailField label="Recorded on" value={formatDateTime(viewRow.created_at)} />
              </Stack>
            </FormSection>
            <FormSection title="Student">
              <Stack spacing={1.25}>
                <DetailField label="Name" value={studentName(viewRow)} />
                <DetailField label="Admission no." value={viewRow.student?.admission_number} />
                <DetailField label="Level" value={viewRow.curriculum_class_level?.name} />
                <DetailField label="Parent" value={parentName(viewRow)} />
              </Stack>
            </FormSection>
            <FormSection title="Invoice">
              <Stack spacing={1.25}>
                <DetailField label="Invoice no." value={inv?.invoice_number} />
                {inv?.status ? (
                  <Box>
                    <InvoiceStatusChip status={inv.status} />
                  </Box>
                ) : (
                  <DetailField label="Status" value="—" />
                )}
                <DetailField label="Amount due" value={inv ? formatKes(inv.amount_due) : "—"} />
                <DetailField label="Amount paid (total)" value={inv ? formatKes(inv.amount_paid) : "—"} />
                <DetailField label="Balance" value={inv ? formatKes(inv.balance) : "—"} />
              </Stack>
            </FormSection>
          </Stack>
        ) : null}
      </PremiumDialog>
    </TabPanelShell>
  );
}
