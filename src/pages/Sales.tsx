
import { useEffect, useState } from "react";
import { Search, RefreshCw, Eye, AlertCircle } from "lucide-react";
import api from "../services/api";

type Customer = {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
};

type Sale = {
  _id: string;
  saleNumber: string;
  saleDate?: string;
  createdAt?: string;
  customerId?: Customer | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  paymentStatus: string;
  note?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const money = (value: number) =>
  `¥${Number(value || 0).toLocaleString("ja-JP")}`;

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
    case "PAID":
      return "bg-green-100 text-green-800";
    case "DRAFT":
    case "UNPAID":
      return "bg-amber-100 text-amber-800";
    case "CANCELLED":
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "PARTIALLY_PAID":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}


export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  async function loadSales() {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };

      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;

      const response = await api.get("/sales", { params });
      const result = response.data?.data;

      if (!response.data?.success || !Array.isArray(result?.sales)) {
        throw new Error("Unexpected sales API response format.");
      }

      setSales(result.sales);
      setPagination(
        result.pagination || {
          page,
          limit: 20,
          total: result.sales.length,
          totalPages: 1,
        }
      );
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? (err as { response?: { data?: { message?: string } } })
              .response?.data?.message
          : err instanceof Error
            ? err.message
            : "Unable to load sales.";

      setError(String(message || "Unable to load sales."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSales();
  }, [page, status, paymentStatus]);

  const filteredSales = sales.filter((sale) => {
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return [
      sale.saleNumber,
      sale.customerId?.name,
      sale.customerId?.phone,
      sale.customerId?.email,
    ].some((value) => value?.toLowerCase().includes(term));
  });

  function openSale(sale: Sale) {
    setSelectedSale(sale);
  }

  async function printSale(sale: Sale) {
    try {
      const response = await api.get(`/sales/${sale._id}`);
      const detail = response.data?.data;

      if (!detail?.sale || !Array.isArray(detail.items)) {
        throw new Error("Sale details were not returned by the API.");
      }

      const savedSale = detail.sale;
      const items = detail.items;

      const escapeHtml = (value: unknown) =>
        String(value ?? "").replace(/[&<>"']/g, (char) => {
          const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          };
          return entities[char];
        });

      const rows = items
        .map((item: Record<string, unknown>) => {
          const product =
            typeof item.productId === "object" && item.productId !== null
              ? (item.productId as Record<string, unknown>)
              : {};

          const quantity = Number(item.quantity || 0);
          const unitPrice = Number(item.unitPrice || 0);
          const amount = Number(
            item.lineTotal ?? quantity * unitPrice
          );

          return `<tr>
            <td>${escapeHtml(product.name || "Product")}</td>
            <td class="num">${quantity}</td>
            <td class="num">${money(unitPrice)}</td>
            <td class="num">${money(amount)}</td>
          </tr>`;
        })
        .join("");

      const printWindow = window.open("", "_blank", "width=800,height=900");

      if (!printWindow) {
        throw new Error("Please allow pop-ups to print the receipt.");
      }

      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Receipt ${escapeHtml(savedSale.saleNumber)}</title>
            <style>
              body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
              h1 { text-align: center; font-size: 22px; }
              .meta { line-height: 1.7; margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 9px 4px; border-bottom: 1px solid #ddd; }
              th { text-align: left; }
              .num { text-align: right; white-space: nowrap; }
              .totals { width: 300px; margin: 20px 0 0 auto; }
              .total { font-size: 18px; font-weight: bold; border-top: 1px solid #111; padding-top: 12px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <h1>SALES RECEIPT</h1>
            <div class="meta">
              <div>Sale No: ${escapeHtml(savedSale.saleNumber)}</div>
              <div>Date: ${escapeHtml(
                savedSale.saleDate || savedSale.createdAt || ""
              )}</div>
              <div>Customer: ${escapeHtml(
                savedSale.customerId?.name || "Walk-in customer"
              )}</div>
              <div>Payment Status: ${escapeHtml(
                savedSale.paymentStatus || "—"
              )}</div>
            </div>
            <table>
              <thead><tr>
                <th>Product</th><th class="num">Qty</th>
                <th class="num">Price</th><th class="num">Amount</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="totals">
              <p>Subtotal: <span style="float:right">${money(savedSale.subtotal)}</span></p>
              <p>Discount: <span style="float:right">${money(savedSale.discountAmount)}</span></p>
              <p>Tax: <span style="float:right">${money(savedSale.taxAmount)}</span></p>
              <p class="total">Total: <span style="float:right">${money(savedSale.totalAmount)}</span></p>
            </div>
            <p style="text-align:center;margin-top:35px">Thank you for your purchase.</p>
            <script>
              window.onload = () => window.print();
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to print receipt."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sales Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review sales, payment status, and receipt details.
            </p>
          </div>

          <button
            onClick={() => void loadSales()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search loaded sales..."
              className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className="rounded-lg border px-3 py-2.5 text-sm"
          >
            <option value="">All sale statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(event) => {
              setPage(1);
              setPaymentStatus(event.target.value);
            }}
            className="rounded-lg border px-3 py-2.5 text-sm"
          >
            <option value="">All payment statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="PAID">Paid</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b p-4">
            <h2 className="font-semibold">Sales records</h2>
            <span className="text-sm text-slate-500">
              {pagination.total} total records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sale Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Sale Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      Loading sales...
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale._id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">
                        {sale.saleNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(
                          sale.saleDate || sale.createdAt || ""
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {sale.customerId?.name || "Walk-in"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                        {money(sale.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(sale.status)}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(sale.paymentStatus)}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openSale(sale)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 hover:bg-slate-100"
                          >
                            <Eye size={15} />
                            View
                          </button>
                          {sale.status === "COMPLETED" && (
                            <button
                              onClick={() => void printSale(sale)}
                              className="rounded-md border px-2 py-1.5 hover:bg-slate-100"
                            >
                              Print
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex items-center justify-between border-t p-4">
            <span className="text-sm text-slate-500">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || page <= 1}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages || 1, current + 1)
                  )
                }
                disabled={loading || page >= pagination.totalPages}
                className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </section>

        {selectedSale && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedSale(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Sale details</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedSale.saleNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="rounded-md border px-3 py-1.5 text-sm"
                >
                  Close
                </button>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Customer</dt>
                  <dd>{selectedSale.customerId?.name || "Walk-in"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Date</dt>
                  <dd>
                    {new Date(
                      selectedSale.saleDate || selectedSale.createdAt || ""
                    ).toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Sale status</dt>
                  <dd>{selectedSale.status}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Payment status</dt>
                  <dd>{selectedSale.paymentStatus}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Paid amount</dt>
                  <dd>{money(selectedSale.paidAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd>{money(selectedSale.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Discount</dt>
                  <dd>{money(selectedSale.discountAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Tax</dt>
                  <dd>{money(selectedSale.taxAmount)}</dd>
                </div>
                <div className="flex justify-between border-t pt-3 text-lg font-bold">
                  <dt>Total</dt>
                  <dd>{money(selectedSale.totalAmount)}</dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-slate-500">
                Viewing a sale does not change its status or record a payment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

