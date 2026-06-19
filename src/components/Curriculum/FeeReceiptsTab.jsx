import React, { useCallback, useEffect, useState } from "react";
import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  authJsonHeaders,
  formatDateTime,
  formatKes,
  fontBody,
  actionIconSx,
  inputSx,
} from "../Accounting/accountingShared";
import {
  TabPanelShell,
  DataTableShell,
  tableHeadRowSx,
  tablePaginationSx,
  EmptyTableRow,
  PaymentMethodChip,
} from "../Accounting/accountingUi";

function studentName(row) {
  return row?.student?.name || row?.student?.admission_number || "—";
}

async function downloadReceiptPdf(receiptId, receiptNumber) {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await fetch(`/api/fee-receipts/${encodeURIComponent(receiptId)}/pdf`, {
    headers: { ...authJsonHeaders(token), Accept: "application/pdf" },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Could not download receipt PDF.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt-${receiptNumber || receiptId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function FeeReceiptsTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const apiPage = page + 1;
      const params = new URLSearchParams({ page: String(apiPage), limit: String(rowsPerPage) });
      if (search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/fee-receipts?${params}`, { headers: authJsonHeaders(token) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not load receipts.");
      setRows(Array.isArray(data.data) ? data.data : []);
      setTotalCount(Number(data.pagination?.total) || 0);
    } catch (e) {
      setError(e.message || "Load failed.");
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = async (row) => {
    setDownloadingId(row.id);
    setError("");
    try {
      await downloadReceiptPdf(row.id, row.receipt_number);
    } catch (e) {
      setError(e.message || "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <TabPanelShell loading={loading && rows.length === 0} error={error || null} onDismissError={() => setError("")}>
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Search receipt or reference"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ ...inputSx, maxWidth: 360 }}
        />

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
              sx={tablePaginationSx}
            />
          }
        >
          <Table size="medium" sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow sx={tableHeadRowSx}>
                <TableCell>Receipt</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right" width={72}>
                  PDF
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyTableRow message="No payment receipts yet. Receipts appear when fee payments are recorded." />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 700 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <ReceiptLongIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        <span>{r.receipt_number || "—"}</span>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{formatDateTime(r.paid_at)}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody, fontWeight: 600 }}>{studentName(r)}</TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{r.invoice?.invoice_number || "—"}</TableCell>
                    <TableCell>
                      <PaymentMethodChip method={r.payment_method} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: fontBody }}>{r.reference || "—"}</TableCell>
                    <TableCell align="right" sx={{ fontFamily: fontBody, fontWeight: 700 }}>
                      {formatKes(r.amount)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Download receipt PDF">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Download receipt PDF"
                            disabled={downloadingId === r.id}
                            onClick={() => void handleDownload(r)}
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
      </Stack>
    </TabPanelShell>
  );
}
