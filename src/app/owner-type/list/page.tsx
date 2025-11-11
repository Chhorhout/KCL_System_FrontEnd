"use client";

import {
    MagnifyingGlassIcon,
    PlusCircleIcon,
    Squares2X2Icon,
    WrenchScrewdriverIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface OwnerType {
  id: string;
  name: string;
  description?: string | null;
}

export default function OwnerTypeList() {
  const [ownerTypes, setOwnerTypes] = useState<OwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchOwnerTypes(page, pageSize, controller.signal);
    return () => controller.abort();
  }, [page, pageSize]);

  const fetchOwnerTypes = async (pageNum: number, size: number, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const url = new URL("http://localhost:5092/api/OwnerType");
      url.searchParams.append("page", String(pageNum));
      url.searchParams.append("pageSize", String(size));

      const res = await fetch(url.toString(), { signal });
      if (!res.ok) throw new Error("Failed to fetch owner types");

      const totalPagesHeader = res.headers.get("X-Total-Pages") || res.headers.get("x-total-pages");
      const totalCountHeader = res.headers.get("X-Total-Count") || res.headers.get("x-total-count");
      const currentPageHeader = res.headers.get("X-Current-Page") || res.headers.get("x-current-page");
      const pageSizeHeader = res.headers.get("X-Page-Size") || res.headers.get("x-page-size");

      if (totalPagesHeader) setTotalPages(Math.max(parseInt(totalPagesHeader, 10) || 1, 1));
      if (totalCountHeader) setTotalCount(Math.max(parseInt(totalCountHeader, 10) || 0, 0));
      if (currentPageHeader) setPage(Math.max(parseInt(currentPageHeader, 10) || 1, 1));
      if (pageSizeHeader) setPageSize(Math.max(parseInt(pageSizeHeader, 10) || size, 1));

      const data = await res.json();
      const normalized: OwnerType[] = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.items)
          ? (data as any).items
          : Array.isArray((data as any)?.data)
            ? (data as any).data
            : Array.isArray((data as any)?.result)
              ? (data as any).result
              : [];

      setOwnerTypes(
        normalized.map((item: any) => ({
          id: item.id,
          name: item.name ?? "Unnamed",
          description: item.description ?? item.notes ?? null,
        })),
      );
      setError(null);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err.message || "Failed to fetch owner types");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete owner type?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7c3aed",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5092/api/OwnerType/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete owner type");
        Swal.fire("Deleted!", "The owner type has been removed.", "success");
        fetchOwnerTypes(page, pageSize);
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete owner type", "error");
      }
    }
  };

  const filteredOwnerTypes = ownerTypes.filter((ownerType) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      ownerType.name.toLowerCase().includes(term) ||
      (ownerType.description ?? "").toLowerCase().includes(term)
    );
  });

  const totalOwnerTypes = totalCount || ownerTypes.length;
  const hasOwnerTypes = totalOwnerTypes > 0;
  const startIndex = hasOwnerTypes ? (page - 1) * pageSize + 1 : 0;
  const endIndex = hasOwnerTypes
    ? Math.min(startIndex + filteredOwnerTypes.length - 1, totalOwnerTypes)
    : 0;

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
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-200">
              <Squares2X2Icon className="h-4 w-4" />
              Owner Type Catalog
            </span>
            <h1 className="text-3xl font-semibold text-white">Owner Types</h1>
            <p className="text-sm text-slate-300">Curate asset owner classifications for reporting and onboarding workflows.</p>
          </div>
          <Link href="/owner-type/add">
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900">
              <PlusCircleIcon className="h-5 w-5" />
              Add Owner Type
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
                className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 sm:w-auto"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="relative w-full sm:w-80">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-300" />
              <input
                type="text"
                placeholder="Search owner types..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-900/80 py-2 pl-10 pr-4 text-sm text-slate-100 shadow-sm transition placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/90">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Owner type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-purple-500">
                      Loading owner types...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredOwnerTypes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-purple-400">
                      No owner types found.
                    </td>
                  </tr>
                ) : (
                  filteredOwnerTypes.map((ownerType) => (
                    <tr key={ownerType.id} className="hover:bg-indigo-500/10">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
                            <Squares2X2Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {ownerType.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200">
                        {ownerType.description || "No description provided"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link href={`/owner-type/edit/${ownerType.id}`}>
                            <button className="flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-200 shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-slate-900">
                              <WrenchScrewdriverIcon className="h-4 w-4" />
                              Edit
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(ownerType.id)}
                            className="flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-xs font-semibold text-pink-200 shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-slate-900"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-indigo-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {hasOwnerTypes
                ? `Showing ${startIndex} to ${endIndex} of ${totalOwnerTypes} owner types`
                : "No owner types to display"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow"
                          : "text-slate-200 hover:bg-indigo-500/20"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-indigo-300">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-indigo-500/20"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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

