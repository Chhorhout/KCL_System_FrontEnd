"use client";

import { ChevronDownIcon, PencilSquareIcon, TagIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5092/api/Owner";

interface OwnerType {
  id: string;
  name: string;
}

export default function AddOwner() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    ownertypeId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
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
    setForm({ name: "", ownertypeId: "" });
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
      // Debug: Log what we're sending
      console.log('[Owner Add] Submitting form data:', form);
      
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error('[Owner Add] Creation failed:', res.status, errorText);
        throw new Error(errorText || "Failed to add owner");
      }
      
      const responseData = await res.json().catch(() => null);
      console.log('[Owner Add] Owner created successfully:', responseData);
      
      setSuccess(true);
      // Show success message before redirecting
      setTimeout(() => {
        handleReset();
        router.push("/owner/list");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to add owner");
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
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-700/40 via-indigo-500/20 to-transparent p-6 shadow-xl shadow-indigo-900/40 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">
                Owner Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Create Owner</h1>
              <p className="mt-1 text-sm text-slate-300">
                Add a new owner to track asset ownership and management.
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
                  Enter the name of the owner (e.g., company name, person name).
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
                <div className="relative">
                  <select
                    id="ownertypeId"
                    name="ownertypeId"
                    value={form.ownertypeId}
                    onChange={handleChange}
                    disabled={loadingOwnerTypes}
                    className={`appearance-none w-full rounded-xl border bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.ownertypeId
                        ? "border-red-500 focus:ring-red-400"
                        : "border-slate-700 focus:border-indigo-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="" className="bg-slate-950 text-slate-300">
                      {loadingOwnerTypes ? "Loading owner types..." : "Select an owner type"}
                    </option>
                    {ownerTypes.map((type) => (
                      <option key={type.id} value={type.id} className="bg-slate-950 text-white">
                        {type.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDownIcon
                      className={`h-5 w-5 text-slate-400 transition-transform ${
                        loadingOwnerTypes ? "opacity-50" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
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
                Owner added successfully! Redirecting to directory…
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
                  Save owner
                </button>
              </div>
            </div>
          </form>
        </section>
      </motion.div>
    </div>
  );
}

