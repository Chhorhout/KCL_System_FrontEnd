"use client";

import {
  BanknotesIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

interface Invoice {
  id: string;
  number: string;
  date: string;
  totalAmount: string;
  description?: string | null;
}

const API_URL = "http://localhost:5092/api/Invoice";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return parsed.toString() === "Invalid Date"
    ? value
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchInvoices(page, pageSize, controller.signal);
    return () => controller.abort();
  }, [page, pageSize]);

  const fetchInvoices = async (pageNum: number, size: number, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const url = new URL(API_URL);
      url.searchParams.append("page", String(pageNum));
      url.searchParams.append("pageSize", String(size));

      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error("Failed to fetch invoices");

      const totalPagesHeader = res.headers.get("X-Total-Pages") || res.headers.get("x-total-pages");
      const totalCountHeader = res.headers.get("X-Total-Count") || res.headers.get("x-total-count");
      const currentPageHeader = res.headers.get("X-Current-Page") || res.headers.get("x-current-page");
      const pageSizeHeader = res.headers.get("X-Page-Size") || res.headers.get("x-page-size");

      if (totalPagesHeader) setTotalPages(Math.max(parseInt(totalPagesHeader, 10) || 1, 1));
      if (totalCountHeader) setTotalCount(Math.max(parseInt(totalCountHeader, 10) || 0, 0));
      if (currentPageHeader) setPage(Math.max(parseInt(currentPageHeader, 10) || 1, 1));
      if (pageSizeHeader) setPageSize(Math.max(parseInt(pageSizeHeader, 10) || size, 1));

      const data = await res.json();
      const normalized: Invoice[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : Array.isArray((data as any)?.result)
              ? (data as any).result
              : [];

      setInvoices(
        normalized.map((item: any) => ({
          id: item.id,
          number: item.number ?? "INV-UNKNOWN",
          date: item.date ?? item.issuedOn ?? "",
          totalAmount: item.totalAmount ?? item.amount ?? "0",
          description: item.description ?? item.notes ?? null,
        })),
      );
      setError(null);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete invoice?",
      text: "This will permanently remove the invoice.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete invoice");
        Swal.fire("Deleted!", "The invoice has been removed.", "success");
        fetchInvoices(page, pageSize);
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete invoice", "error");
      }
    }
  };

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((invoice) => {
      return (
        invoice.number.toLowerCase().includes(term) ||
        invoice.description?.toLowerCase().includes(term) ||
        formatDate(invoice.date).toLowerCase().includes(term)
      );
    });
  }, [invoices, searchTerm]);

  const totalInvoices = totalCount || invoices.length;
  const hasInvoices = totalInvoices > 0;
  const startIndex = hasInvoices ? (page - 1) * pageSize + 1 : 0;
  const endIndex = hasInvoices ? Math.min(startIndex + filteredInvoices.length - 1, totalInvoices) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8 px-4 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 18 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-6"
      >
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-indigo-950/40 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              <BanknotesIcon className="h-4 w-4" />
              Invoice Center
            </span>
            <h1 className="text-3xl font-semibold text-white">Invoices</h1>
            <p className="text-sm text-slate-300">Track billing, payments, and outstanding balances across suppliers.</p>
          </div>
          <Link href="/invoice/add">
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900">
              <PlusCircleIcon className="h-5 w-5" />
              Add Invoice
            </button>
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl shadow-indigo-950/30">
          <div className="flex flex-col gap-4 border-b border-slate-800/60 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-slate-300">Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(Number(e.target.value));
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-300" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
          <div className="space-y-4 p-4">
            {loading ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-emerald-300">
                Loading invoices...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center text-sm text-red-300">
                {error}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-emerald-300">
                No invoices found.
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-emerald-900/20 transition hover:border-emerald-500/40 hover:shadow-emerald-900/40"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow">
                        <BanknotesIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{invoice.number}</p>
                        <p className="text-xs text-emerald-200">ID: {invoice.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/invoice/edit/${invoice.id}`}>
                        <button className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-900">
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-xs font-semibold text-pink-200 shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                        Issue date
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {formatDate(invoice.date)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                        Total amount
                      </p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {currency.format(parseFloat(invoice.totalAmount))}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                        Description
                      </p>
                      <p className="mt-2 text-sm text-slate-100">
                        {invoice.description || "No description provided"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-indigo-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {hasInvoices
                ? `Showing ${startIndex} to ${endIndex} of ${totalInvoices} invoices`
                : "No invoices to display"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  if (pageNum > totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                        page === pageNum
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow"
                          : "text-slate-200 hover:bg-emerald-500/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-emerald-300">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-emerald-500/20"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}

