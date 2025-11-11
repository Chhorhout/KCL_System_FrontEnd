"use client";

import {
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    CurrencyDollarIcon,
    HashtagIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = "http://localhost:5092/api/Invoice";

export default function AddInvoice() {
  const router = useRouter();
  const [form, setForm] = useState({
    number: "",
    date: "",
    totalAmount: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!form.number.trim()) errors.number = "Invoice number is required.";
    if (!form.date.trim()) errors.date = "Invoice date is required.";
    if (!form.totalAmount.trim()) errors.totalAmount = "Total amount is required.";
    else if (isNaN(Number(form.totalAmount))) errors.totalAmount = "Enter a valid amount.";
    if (!form.description.trim()) errors.description = "Description is required.";
    return errors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm({ number: "", date: "", totalAmount: "", description: "" });
    setError(null);
    setSuccess(false);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add invoice");
      setSuccess(true);
      handleReset();
      setTimeout(() => router.push("/invoice/list"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to add invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      >
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-emerald-700/40 via-emerald-500/20 to-transparent p-6 shadow-xl shadow-emerald-900/40 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
                Invoice Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Create Invoice</h1>
              <p className="mt-1 text-sm text-slate-300">
                Capture billing records to keep cashflow insights accurate.
              </p>
            </div>
            <Link href="/invoice/list">
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:ring-offset-2 focus:ring-offset-slate-950">
                Back to list
              </button>
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-emerald-900/30 backdrop-blur">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="number"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <HashtagIcon className="h-4 w-4" />
                  </span>
                  Invoice number
                </label>
                <input
                  id="number"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  placeholder="INV-2024-001"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.number
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-emerald-400"
                  }`}
                />
                <p className="text-xs text-slate-500">
                  Use your finance numbering sequence to match existing records.
                </p>
                {fieldErrors.number && (
                  <p className="text-xs text-red-400">{fieldErrors.number}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="date"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CalendarDaysIcon className="h-4 w-4" />
                  </span>
                  Invoice date
                </label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.date
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-emerald-400"
                  }`}
                />
                <p className="text-xs text-slate-500">Typically the issue date or billing period end.</p>
                {fieldErrors.date && (
                  <p className="text-xs text-red-400">{fieldErrors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="totalAmount"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <CurrencyDollarIcon className="h-4 w-4" />
                  </span>
                  Total amount
                </label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  value={form.totalAmount}
                  onChange={handleChange}
                  placeholder="1500.00"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.totalAmount
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-emerald-400"
                  }`}
                />
                <p className="text-xs text-slate-500">Enter the billed amount before currency conversion.</p>
                {fieldErrors.totalAmount && (
                  <p className="text-xs text-red-400">{fieldErrors.totalAmount}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="description"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <ClipboardDocumentListIcon className="h-4 w-4" />
                  </span>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Payment for June services."
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    fieldErrors.description
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-emerald-400"
                  }`}
                />
                <p className="text-xs text-slate-500">
                  Provide enough context for finance and audit teams reviewing the invoice.
                </p>
                {fieldErrors.description && (
                  <p className="text-xs text-red-400">{fieldErrors.description}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              >
                Invoice added successfully! Redirecting to directory…
              </motion.div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Reset form
              </button>
              <div className="flex gap-3">
                <Link href="/invoice/list">
                  <button className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950">
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Save invoice
                </button>
              </div>
            </div>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

