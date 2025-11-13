"use client";

import { PencilSquareIcon, TagIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5092/api/Owner";

interface OwnerType {
  id: string;
  name: string;
}

export default function EditOwner() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    ownertypeId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [ownerTypes, setOwnerTypes] = useState<OwnerType[]>([]);
  const [loadingOwnerTypes, setLoadingOwnerTypes] = useState(true);

  useEffect(() => {
    // Fetch owner types for dropdown
    fetch("http://localhost:5092/api/OwnerType")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch owner types");
        return res.json();
      })
      .then((data) => {
        const normalized: OwnerType[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : [];
        setOwnerTypes(normalized);
        setLoadingOwnerTypes(false);
      })
      .catch((err) => {
        console.error("Error fetching owner types:", err);
        setError("Failed to load owner types");
        setLoadingOwnerTypes(false);
      });
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`${API_URL}/${id}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load owner");
        return res.json();
      })
      .then((data) => {
        // Debug: Log the owner data structure
        console.log('[Owner Edit] Owner data received:', data);
        
        // Try multiple property name variations
        const ownerTypeId = data.ownertypeId || data.ownerTypeId || data.ownerTypeID || data.OwnerTypeId || "";
        
        if (!ownerTypeId) {
          console.warn('[Owner Edit] No owner type ID found. Available properties:', Object.keys(data));
        } else {
          console.log('[Owner Edit] Found owner type ID:', ownerTypeId);
        }
        
        setForm({
          name: data.name ?? "",
          ownertypeId: ownerTypeId,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Failed to load owner");
        setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!form.name.trim()) errors.name = "Owner name is required.";
    if (!form.ownertypeId.trim()) errors.ownertypeId = "Owner type is required.";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        // Try multiple property name variations
        const ownerTypeId = data.ownertypeId || data.ownerTypeId || data.ownerTypeID || data.OwnerTypeId || "";
        setForm({
          name: data.name ?? "",
          ownertypeId: ownerTypeId,
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
      // Debug: Log what we're sending
      console.log('[Owner Edit] Submitting form data:', form);
      
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error('[Owner Edit] Update failed:', res.status, errorText);
        throw new Error(errorText || "Failed to update owner");
      }
      
      console.log('[Owner Edit] Owner updated successfully');
      setSuccess(true);
      setTimeout(() => router.push("/owner/list"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update owner");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-slate-200">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 px-6 py-4 shadow-xl shadow-indigo-900/40">
          Loading owner…
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
                Owner Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Update Owner</h1>
              <p className="mt-1 text-sm text-slate-300">
                Modify owner details and classification.
              </p>
            </div>
            <Link href="/owner/list">
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
                  Owner Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter owner name"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.name ? "border-red-500 focus:ring-red-400" : "border-slate-700 focus:border-indigo-400"
                  }`}
                />
                <p className="text-xs text-slate-500">
                  This label is shown wherever assets are associated with this owner.
                </p>
                {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="ownertypeId"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-200"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <TagIcon className="h-4 w-4" />
                  </span>
                  Owner Type
                </label>
                <select
                  id="ownertypeId"
                  name="ownertypeId"
                  value={form.ownertypeId}
                  onChange={handleChange}
                  disabled={loadingOwnerTypes}
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.ownertypeId
                      ? "border-red-500 focus:ring-red-400"
                      : "border-slate-700 focus:border-indigo-400"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingOwnerTypes ? (
                    <option value="">Loading owner types...</option>
                  ) : (
                    ownerTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-slate-500">
                  Select the type classification for this owner.
                </p>
                {fieldErrors.ownertypeId && (
                  <p className="text-xs text-red-400">{fieldErrors.ownertypeId}</p>
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
                Owner updated successfully! Redirecting to directory…
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
                <Link href="/owner/list">
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
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

