"use client";

import { MapIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5092/api/OwnerType";

export default function EditOwnerType() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`${API_URL}/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load owner type");
        return res.json();
      })
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? data.notes ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Failed to load owner type");
        setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!form.name.trim()) errors.name = "Owner type name is required.";
    if (!form.description.trim()) errors.description = "Description is required.";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});
    fetch(`${API_URL}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? data.notes ?? "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update owner type");
      setSuccess(true);
      setTimeout(() => router.push("/owner-type/list"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update owner type");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-200">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-4 shadow-xl shadow-indigo-900/40">
          Loading owner type…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
      >
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-700/40 via-indigo-500/20 to-transparent p-6 shadow-xl shadow-indigo-900/40 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">
                Owner Type Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Update Owner Type</h1>
              <p className="mt-1 text-sm text-slate-300">
                Adjust naming and descriptions to keep ownership reporting accurate.
              </p>
            </div>
            <Link href="/owner-type/list">
              <button className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:ring-offset-2 focus:ring-offset-slate-950">
                Back to list
              </button>
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <PencilSquareIcon className="h-4 w-4" />
                  </span>
                  Owner type name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="External Vendor"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.name ? "border-red-500 focus:ring-red-400" : "border-slate-700 focus:border-indigo-400"
                  }`}
                />
                <p className="text-xs text-slate-500">
                  This label is shown wherever assets are grouped by owner type.
                </p>
                {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="description"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <MapIcon className="h-4 w-4" />
                  </span>
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Assets supplied and maintained by third-party vendors."
                  rows={4}
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.description
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-indigo-400"
                  }`}
                />
                <p className="text-xs text-slate-500">
                  Provide enough context for finance and logistics teams to understand this classification.
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
                Owner type updated successfully! Redirecting to directory…
              </motion.div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Reset
              </button>
              <div className="flex gap-3">
                <Link href="/owner-type/list">
                  <button className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950">
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Save changes
                </button>
              </div>
            </div>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

