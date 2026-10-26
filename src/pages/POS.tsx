
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

type Product = {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  pricing?: {
    sellingPrice?: number;
  };
  sellingPrice?: number;
  inventory?: {
    currentStock?: number;
    trackStock?: boolean;
  };
  isActive?: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
  unitPrice: number;
};

type CompletedSale = {
  sale: any;
  items: any[];
};

function getToken() {
  return (
    sessionStorage.getItem("accessToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function getSellingPrice(product: Product) {
  return Number(
    product.pricing?.sellingPrice ?? product.sellingPrice ?? 0
  );
}

function getStock(product: Product) {
  return Number(product.inventory?.currentStock ?? 0);
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "API request failed"
    );
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [saleNote, setSaleNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  async function loadProducts() {
    setLoadingProducts(true);
    setError("");

    try {
      const response = await api.get("/products");
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : payload.data?.products ??
          payload.data?.items ??
          payload.data ??
          [];

      if (!Array.isArray(list)) {
        throw new Error("Unexpected products API response format");
      }

      setProducts(list.filter((p: Product) => p.isActive !== false));
    } catch (err) {
      setError(`Products load failed: ${getErrorMessage(err)}`);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 30);

    return products
      .filter((product) =>
        [
          product.name,
          product.sku,
          product.barcode,
        ].some((value) => value?.toLowerCase().includes(term))
      )
      .slice(0, 50);
  }, [products, search]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxAmount = Math.max(0, Number(tax) || 0);
  const total = Math.max(0, subtotal - discountAmount + taxAmount);

  function addProduct(product: Product) {
    setError("");
    setMessage("");

    const price = getSellingPrice(product);
    if (!Number.isFinite(price) || price < 0) {
      setError(`Invalid selling price for ${product.name}`);
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.product._id === product._id
      );

      if (existing) {
        return current.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1, unitPrice: price }];
    });

    setSearch("");
  }

  function changeQuantity(productId: string, change: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product._id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setCart((current) =>
      current.filter((item) => item.product._id !== productId)
    );
  }

  async function checkout() {
    if (loading) return;

    if (!getToken()) {
      setError(
        "Login token भेटिएन। आफ्नो login page बाट login गरेर फेरि प्रयास गर्नुहोस्।"
      );
      return;
    }

    if (cart.length === 0) {
      setError("पहिले cart मा product थप्नुहोस्।");
      return;
    }

    if (discountAmount > subtotal) {
      setError("Discount subtotal भन्दा बढी हुन सक्दैन।");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const saleNumber = `SALE-${Date.now()}`;

      const saleResponse = await api.post("/sales", {
        saleNumber,
        ...(customerId.trim() ? { customerId: customerId.trim() } : {}),
        discountAmount,
        taxAmount,
        note: saleNote,
      });

      const sale =
        saleResponse.data?.data?.sale ??
        saleResponse.data?.data;

      const saleId = sale?._id;

      if (!saleId) {
        throw new Error("Sale created, but sale ID was not returned");
      }

      for (const item of cart) {
        await api.post(`/sales/${saleId}/items`, {
          productId: item.product._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: 0,
        });
      }

      await api.post(`/sales/${saleId}/complete`);

          // Fetch the saved sale and its actual items from the backend.
          const detailResponse = await api.get(`/sales/${saleId}`);

          const detail = detailResponse.data?.data;

          if (!detail?.sale || !Array.isArray(detail.items)) {
            throw new Error(
              `Sale ${saleNumber} was completed, but its receipt details could not be loaded.`
            );
          }

          setCompletedSale({
            sale: detail.sale,
            items: detail.items,
          });

          setMessage(
            `Sale completed successfully. Sale No: ${
              detail.sale.saleNumber || saleNumber
            }`
          );

          setCart([]);

      setCustomerId("");
      setDiscount("0");
      setTax("0");
      setSaleNote("");
      await loadProducts();
    } catch (err) {
      setError(
        `Checkout failed: ${getErrorMessage(err)}. Sale draft बनेको हुन सक्छ; retry गर्नु अघि Sales API मा status जाँच्नुहोस्।`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
            <p className="mt-1 text-sm text-slate-500">
              Scan or search products, build the cart, and complete a sale.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadProducts()}
            disabled={loadingProducts}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh products
          </button>
        </div>
        {completedSale && (
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Sale completed
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sale No: {completedSale.sale.saleNumber || completedSale.sale._id}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Print Bill
          </button>
        </div>

              <div className="receipt-print mt-5 rounded-lg border border-slate-200 p-5">
                <h2 className="text-center text-xl font-bold">
                  SALES RECEIPT
                </h2>

                <div className="my-4 border-b pb-3 text-sm">
                  <p>
                    Sale No:{" "}
                    {completedSale.sale.saleNumber || completedSale.sale._id}
                  </p>

                  <p>
                    Date:{" "}
                    {completedSale.sale.createdAt
                      ? new Date(completedSale.sale.createdAt).toLocaleString()
                      : "—"}
                  </p>

                  <p>
                    Customer:{" "}
                    {completedSale.sale.customerId?.name || "Walk-in customer"}
                  </p>

                  <p>
                    Payment Status:{" "}
                    {completedSale.sale.paymentStatus || "—"}
                  </p>
                </div>

                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">Product</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody>
                    {completedSale.items.map((item, index) => {
                      const product =
                        typeof item.productId === "object"
                          ? item.productId
                          : null;

                      const quantity = Number(item.quantity || 0);
                      const unitPrice = Number(item.unitPrice || 0);

                      const amount = Number(
                        item.lineTotal ?? quantity * unitPrice
                      );

                      return (
                        <tr
                          key={item._id || index}
                          className="border-b"
                        >
                          <td className="py-2">
                            {product?.name || "Product"}
                          </td>

                          <td className="py-2 text-right">{quantity}</td>

                          <td className="py-2 text-right">
                            ¥{unitPrice.toLocaleString()}
                          </td>

                          <td className="py-2 text-right">
                            ¥{amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>
                      ¥{Number(completedSale.sale.subtotal || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>
                      ¥{Number(completedSale.sale.discountAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>
                      ¥{Number(completedSale.sale.taxAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between border-t pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span>
                      ¥{Number(completedSale.sale.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-center text-xs text-slate-500">
                  Thank you for your purchase.
                </p>
              </div>
            </section>
          )}

          <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }

                    .receipt-print,
                    .receipt-print * {
                      visibility: visible !important;
                    }

                    .receipt-print {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      margin: 0 !important;
                      padding: 12mm !important;
                      border: none !important;
                      box-shadow: none !important;
                      color: #000 !important;
                      background: #fff !important;
                    }

                    @page {
                      margin: 5mm;
                    }
                  }
                `}</style>

        {error && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <section className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <label
                htmlFor="product-search"
                className="mb-2 block text-sm font-semibold"
              >
                Search product / scan barcode
              </label>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="product-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && filteredProducts.length === 1) {
                        addProduct(filteredProducts[0]);
                      }
                    }}
                    placeholder="Product name, SKU or barcode..."
                    className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="hidden items-center rounded-lg bg-slate-100 px-3 text-slate-500 sm:flex">
                  <Barcode size={22} />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Barcode scanner keyboard input भए code scan गरेर Enter थिच्नुहोस्।
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <h2 className="font-semibold">Products</h2>
                <span className="text-sm text-slate-500">
                  {loadingProducts ? "Loading..." : `${filteredProducts.length} shown`}
                </span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  {loadingProducts
                    ? "Loading products..."
                    : "No products found. Search by name, SKU or barcode."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 font-semibold">
                          {product.name}
                        </span>
                        <Plus size={18} className="shrink-0 text-blue-600" />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        SKU: {product.sku || "—"}
                      </p>
                      <p className="mt-3 text-lg font-bold text-blue-700">
                        ¥{getSellingPrice(product).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Stock: {getStock(product).toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit space-y-4 xl:sticky xl:top-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  <h2 className="font-semibold">Current sale</h2>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Cart खाली छ। बायाँबाट product छान्नुहोस्।
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product._id}
                      className="border-b border-slate-100 pb-3 last:border-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            ¥{item.unitPrice.toLocaleString()} each
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product._id)}
                          aria-label={`Remove ${item.product.name}`}
                          className="rounded p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product._id, -1)}
                            className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={15} />
                          </button>
                          <span className="min-w-5 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(item.product._id, 1)}
                            className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-100"
                            aria-label="Increase quantity"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <span className="font-semibold">
                          ¥{(item.quantity * item.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                <div>
                  <label htmlFor="customer-id" className="mb-1 block text-sm font-medium">
                    Customer ID (optional)
                  </label>
                  <input
                    id="customer-id"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    placeholder="MongoDB customer ID"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="discount" className="mb-1 block text-sm font-medium">
                      Discount (¥)
                    </label>
                    <input
                      id="discount"
                      type="number"
                      min="0"
                      step="1"
                      value={discount}
                      onChange={(event) => setDiscount(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="tax" className="mb-1 block text-sm font-medium">
                      Tax (¥)
                    </label>
                    <input
                      id="tax"
                      type="number"
                      min="0"
                      step="1"
                      value={tax}
                      onChange={(event) => setTax(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sale-note" className="mb-1 block text-sm font-medium">
                    Note (optional)
                  </label>
                  <input
                    id="sale-note"
                    value={saleNote}
                    onChange={(event) => setSaleNote(event.target.value)}
                    placeholder="Sale note..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discount</span>
                    <span>−¥{discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax</span>
                    <span>¥{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
                    <span>Total</span>
                    <span>¥{total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void checkout()}
                  disabled={loading || cart.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <CreditCard size={18} />
                  )}
                  {loading ? "Processing sale..." : "Complete sale"}
                </button>
                <p className="text-xs leading-5 text-slate-500">
                  
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
