import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";
import api from "../services/api";

type Customer = {
  _id: string;
  name?: string;
  phone?: string;
};

type SaleSummary = {
  _id: string;
  saleNumber?: string;
  saleDate?: string;
  createdAt?: string;
  totalAmount: number;
  paidAmount?: number;
  paymentStatus?: string;
  status?: string;
  customerId?: Customer | null;
};

type ReturnRecord = {
  _id: string;
  returnNumber: string;
  saleId: SaleSummary | string;
  customerId?: Customer | null;
  reason: string;
  note?: string;
  totalRefundAmount: number;
  refundStatus: string;
  status: string;
  returnDate?: string;
  createdAt?: string;
  processedBy?: { name?: string; email?: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Product = {
  _id: string;
  name?: string;
  sku?: string;
  barcode?: string;
};

type SaleItem = {
  _id: string;
  productId: Product | string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ReturnItem = {
  _id: string;
  productId: Product | string;
  saleItemId: SaleItem | string;
  quantity: number;
  unitRefundPrice: number;
  totalRefundAmount: number;
  condition: "GOOD" | "DAMAGED" | "EXPIRED";
  restock: boolean;
  note?: string;
};

type ReturnDetail = {
  salesReturn: ReturnRecord;
  items: ReturnItem[];
};

type ReturnFormItem = {
  saleItemId: string;
  productName: string;
  soldQuantity: number;
  unitPrice: number;
  quantity: number;
  condition: "GOOD" | "DAMAGED" | "EXPIRED";
  restock: boolean;
  note: string;
};

const money = (value: number) =>
  `¥${Number(value || 0).toLocaleString("ja-JP")}`;

const getSaleId = (saleId: SaleSummary | string) =>
  typeof saleId === "string" ? saleId : saleId?._id || "";

const getProduct = (productId: Product | string) =>
  typeof productId === "string"
    ? { _id: productId, name: "Product" }
    : productId;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const responseError = error as {
      response?: { data?: { message?: string } };
    };
    return responseError.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

function statusClass(status: string) {
  switch (status) {
    case "COMPLETED":
    case "REFUNDED":
      return "bg-green-100 text-green-800";
    case "DRAFT":
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "CANCELLED":
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "STORE_CREDIT":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500";

export default function SalesReturns() {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedReturn, setSelectedReturn] =
    useState<ReturnDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [saleItems, setSaleItems] = useState<ReturnFormItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [reason, setReason] = useState("CUSTOMER_REQUEST");
  const [returnNote, setReturnNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };

      if (status) params.status = status;
      if (refundStatus) params.refundStatus = refundStatus;

      const response = await api.get("/sales-returns", { params });
      const result = response.data?.data;

      if (!response.data?.success || !Array.isArray(result?.returns)) {
        throw new Error("Unexpected sales returns API response.");
      }

      setReturns(result.returns);
      setPagination(
        result.pagination || {
          page,
          limit: 20,
          total: result.returns.length,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load sales returns."));
    } finally {
      setLoading(false);
    }
  }, [page, status, refundStatus]);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  const filteredReturns = returns.filter((record) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    const saleId = getSaleId(record.saleId);
    const saleNumber =
      typeof record.saleId === "object"
        ? record.saleId.saleNumber || ""
        : "";

    return [
      record.returnNumber,
      record.customerId?.name,
      record.customerId?.phone,
      record.reason,
      record.status,
      record.refundStatus,
      saleId,
      saleNumber,
    ].some((value) => String(value || "").toLowerCase().includes(term));
  });

  async function openDetails(record: ReturnRecord) {
    setSelectedReturn(null);
    setDetailLoading(true);
    setError("");

    try {
      const response = await api.get(`/sales-returns/${record._id}`);
      const result = response.data?.data;

      if (!response.data?.success || !result?.salesReturn) {
        throw new Error("Sales return details were not returned.");
      }

      setSelectedReturn(result);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load return details."));
    } finally {
      setDetailLoading(false);
    }
  }

  async function openCreateForm() {
    setShowCreate(true);
    setError("");
    setSuccess("");
    setSales([]);
    setSelectedSaleId("");
    setSaleItems([]);
    setReason("CUSTOMER_REQUEST");
    setReturnNote("");
    setSalesLoading(true);

    try {
      const response = await api.get("/sales", {
        params: { page: 1, limit: 100, status: "COMPLETED" },
      });

      const result = response.data?.data;

      if (!response.data?.success || !Array.isArray(result?.sales)) {
        throw new Error("Unexpected sales API response.");
      }

      setSales(result.sales.filter((sale: SaleSummary) => sale.status === "COMPLETED"));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load completed sales."));
    } finally {
      setSalesLoading(false);
    }
  }

  async function loadSaleItems(saleId: string) {
    setSelectedSaleId(saleId);
    setSaleItems([]);
    setError("");

    if (!saleId) return;

    setItemsLoading(true);

    try {
      const response = await api.get(`/sales/${saleId}`);
      const result = response.data?.data;

      if (!response.data?.success || !Array.isArray(result?.items)) {
        throw new Error("Sale items were not returned by the API.");
      }

      const mappedItems: ReturnFormItem[] = result.items.map(
        (item: SaleItem) => {
          const product = getProduct(item.productId);

          return {
            saleItemId: item._id,
            productName: product.name || product.sku || "Product",
            soldQuantity: Number(item.quantity || 0),
            unitPrice: Number(
              item.quantity > 0
                ? Number(item.lineTotal || 0) / item.quantity
                : item.unitPrice || 0
            ),
            quantity: 0,
            condition: "GOOD",
            restock: true,
            note: "",
          };
        }
      );

      setSaleItems(mappedItems);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load sale items."));
    } finally {
      setItemsLoading(false);
    }
  }

  function updateFormItem(
    index: number,
    changes: Partial<ReturnFormItem>
  ) {
    setSaleItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const updated = { ...item, ...changes };

        // Only good-condition items can be returned to stock.
        if (updated.condition !== "GOOD") {
          updated.restock = false;
        }

        return updated;
      })
    );
  }

  const estimatedRefund = saleItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  async function createReturn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedSaleId) {
      setError("Please select a completed sale.");
      return;
    }

    const selectedItems = saleItems.filter((item) => item.quantity > 0);

    if (selectedItems.length === 0) {
      setError("Enter a return quantity for at least one item.");
      return;
    }

    for (const item of selectedItems) {
      if (
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > item.soldQuantity
      ) {
        setError(`Invalid return quantity for ${item.productName}.`);
        return;
      }

      if (item.restock && item.condition !== "GOOD") {
        setError("Only good-condition items can be restocked.");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await api.post(
        `/sales-returns/${selectedSaleId}`,
        {
          reason,
          note: returnNote.trim(),
          items: selectedItems.map((item) => ({
            saleItemId: item.saleItemId,
            quantity: item.quantity,
            condition: item.condition,
            restock: item.restock,
            note: item.note.trim(),
          })),
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to create return.");
      }

      setSuccess(
        `Draft return ${response.data?.data?.salesReturn?.returnNumber || ""} created successfully.`
      );
      setShowCreate(false);
      await loadReturns();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create sales return."));
    } finally {
      setSaving(false);
    }
  }

  async function processReturn(record: ReturnRecord) {
    const confirmed = window.confirm(
      `Process return ${record.returnNumber}?\n\nThis can update inventory stock. Please verify the items and quantities first.`
    );

    if (!confirmed) return;

    setProcessingId(record._id);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/sales-returns/${record._id}/process`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to process return.");
      }

      setSuccess(`Return ${record.returnNumber} processed successfully.`);
      await loadReturns();

      if (selectedReturn?.salesReturn._id === record._id) {
        await openDetails(record);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to process sales return."));
    } finally {
      setProcessingId("");
    }
  }

  const completedCount = returns.filter(
    (record) => record.status === "COMPLETED"
  ).length;

  const pendingRefundCount = returns.filter(
    (record) => record.refundStatus === "PENDING"
  ).length;

  const totalRefundValue = returns.reduce(
    (sum, record) => sum + Number(record.totalRefundAmount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Sales Return Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage returned items, inventory restocking, and refund status.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void loadReturns()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => void openCreateForm()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              New Return
            </button>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto font-semibold"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Current Page Returns</p>
            <p className="mt-2 text-2xl font-bold">{pagination.total}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Completed on Page</p>
            <p className="mt-2 text-2xl font-bold">{completedCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pending Refunds on Page</p>
            <p className="mt-2 text-2xl font-bold">{pendingRefundCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Return Value on Page</p>
            <p className="mt-2 text-2xl font-bold">
              {money(totalRefundValue)}
            </p>
          </div>
        </section>

        <section className="grid gap-3 rounded-xl border bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search return number, customer, sale ID..."
            className={inputClass}
          />

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            className={inputClass}
          >
            <option value="">All return statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={refundStatus}
            onChange={(event) => {
              setPage(1);
              setRefundStatus(event.target.value);
            }}
            className={inputClass}
          >
            <option value="">All refund statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="STORE_CREDIT">Store Credit</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
            <h2 className="font-semibold">Sales return records</h2>
            <span className="text-sm text-slate-500">
              {pagination.total} total records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Return Number</th>
                  <th className="px-4 py-3">Return Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Return Amount</th>
                  <th className="px-4 py-3">Return Status</th>
                  <th className="px-4 py-3">Refund Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      Loading sales returns...
                    </td>
                  </tr>
                ) : filteredReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-500">
                      No sales returns found.
                    </td>
                  </tr>
                ) : (
                  filteredReturns.map((record) => (
                    <tr
                      key={record._id}
                      className="border-t hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {record.returnNumber}
                        <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                          Sale ID: {getSaleId(record.saleId)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {record.returnDate
                          ? new Date(record.returnDate).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {record.customerId?.name || "Walk-in"}
                        {record.customerId?.phone && (
                          <p className="mt-1 text-xs text-slate-500">
                            {record.customerId.phone}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                        {money(record.totalRefundAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(record.status)}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(record.refundStatus)}`}
                        >
                          {record.refundStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => void openDetails(record)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 hover:bg-slate-100"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          {record.status === "DRAFT" && (
                            <button
                              onClick={() => void processReturn(record)}
                              disabled={processingId === record._id}
                              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1.5 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              {processingId === record._id
                                ? "Processing..."
                                : "Process"}
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

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
            <form
              onSubmit={createReturn}
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl md:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Create Sales Return</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a completed sale and enter the items being returned.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-md border p-2 hover:bg-slate-100"
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Completed Sale *</span>
                  <select
                    required
                    value={selectedSaleId}
                    onChange={(event) =>
                      void loadSaleItems(event.target.value)
                    }
                    disabled={salesLoading}
                    className={inputClass}
                  >
                    <option value="">
                      {salesLoading ? "Loading sales..." : "Select a sale"}
                    </option>
                    {sales.map((sale) => (
                      <option key={sale._id} value={sale._id}>
                        {(sale.saleNumber || sale._id) +
                          " — " +
                          (sale.customerId?.name || "Walk-in") +
                          " — " +
                          money(sale.totalAmount)}
                      </option>
                    ))}
                  </select>
                  {!salesLoading && sales.length === 0 && (
                    <span className="text-xs text-amber-700">
                      No completed sales were returned by the API.
                    </span>
                  )}
                </label>

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Return Reason *</span>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className={inputClass}
                  >
                    <option value="CUSTOMER_REQUEST">Customer Request</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="WRONG_ITEM">Wrong Item</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>

              <div className="mt-5">
                <h3 className="mb-2 font-semibold">Return items</h3>

                {itemsLoading ? (
                  <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Loading sale items...
                  </p>
                ) : !selectedSaleId ? (
                  <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Select a completed sale to load its items.
                  </p>
                ) : saleItems.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No items found for this sale.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Sold</th>
                          <th className="p-3">Unit Refund</th>
                          <th className="p-3">Return Qty</th>
                          <th className="p-3">Condition</th>
                          <th className="p-3">Restock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleItems.map((item, index) => (
                          <tr
                            key={item.saleItemId}
                            className="border-t align-top"
                          >
                            <td className="p-3 font-medium">
                              {item.productName}
                            </td>
                            <td className="p-3">{item.soldQuantity}</td>
                            <td className="whitespace-nowrap p-3">
                              {money(item.unitPrice)}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                max={item.soldQuantity}
                                step="any"
                                value={item.quantity}
                                onChange={(event) =>
                                  updateFormItem(index, {
                                    quantity: Number(event.target.value),
                                  })
                                }
                                className="w-24 rounded-md border px-2 py-1.5"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={item.condition}
                                onChange={(event) =>
                                  updateFormItem(index, {
                                    condition: event.target.value as ReturnFormItem["condition"],
                                  })
                                }
                                className="rounded-md border px-2 py-1.5"
                              >
                                <option value="GOOD">Good</option>
                                <option value="DAMAGED">Damaged</option>
                                <option value="EXPIRED">Expired</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={item.restock}
                                  disabled={item.condition !== "GOOD"}
                                  onChange={(event) =>
                                    updateFormItem(index, {
                                      restock: event.target.checked,
                                    })
                                  }
                                />
                                <span className="text-xs">
                                  {item.condition === "GOOD"
                                    ? "Restock"
                                    : "Not allowed"}
                                </span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <label className="mt-4 block space-y-1 text-sm">
                <span className="font-medium">Return Note</span>
                <textarea
                  value={returnNote}
                  onChange={(event) => setReturnNote(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="Optional reason or additional information"
                  className={inputClass}
                />
              </label>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-sm text-slate-500">
                    Estimated refund amount
                  </p>
                  <p className="text-xl font-bold">
                    {money(estimatedRefund)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Final refund amount is calculated and validated by the backend.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="rounded-lg border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || itemsLoading || !selectedSaleId}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Creating..." : "Create Draft Return"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {detailLoading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
            <div className="rounded-xl bg-white px-6 py-5 shadow-xl">
              Loading return details...
            </div>
          </div>
        )}

        {selectedReturn && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
            onClick={() => setSelectedReturn(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl md:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Return Details</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedReturn.salesReturn.returnNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="rounded-md border p-2 hover:bg-slate-100"
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Return Status</p>
                  <p className="mt-1 font-semibold">
                    {selectedReturn.salesReturn.status}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Refund Status</p>
                  <p className="mt-1 font-semibold">
                    {selectedReturn.salesReturn.refundStatus}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="mt-1 font-semibold">
                    {selectedReturn.salesReturn.customerId?.name || "Walk-in"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Reason</p>
                  <p className="mt-1 font-semibold">
                    {selectedReturn.salesReturn.reason}
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Condition</th>
                      <th className="p-3">Restock</th>
                      <th className="p-3 text-right">Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedReturn.items.map((item) => {
                      const product = getProduct(item.productId);

                      return (
                        <tr key={item._id} className="border-t">
                          <td className="p-3">
                            {product.name || product.sku || "Product"}
                          </td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{item.condition}</td>
                          <td className="p-3">
                            {item.restock ? "Yes" : "No"}
                          </td>
                          <td className="whitespace-nowrap p-3 text-right">
                            {money(item.totalRefundAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="text-sm text-slate-500">Total Return Amount</p>
                  <p className="text-xl font-bold">
                    {money(selectedReturn.salesReturn.totalRefundAmount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Processing a return does not mark the refund as paid.
                  </p>
                </div>
                {selectedReturn.salesReturn.status === "DRAFT" && (
                  <button
                    onClick={() =>
                      void processReturn(selectedReturn.salesReturn)
                    }
                    disabled={processingId === selectedReturn.salesReturn._id}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingId === selectedReturn.salesReturn._id
                      ? "Processing..."
                      : "Process Return"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}