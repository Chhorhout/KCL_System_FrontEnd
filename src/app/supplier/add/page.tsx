"use client";
import { EnvelopeIcon, MapPinIcon, PhoneIcon, UserIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = "http://localhost:5092/api/Suppliers";

export default function AddSupplier() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const validate = () => {
    const errors: {[key: string]: string} = {};
    if (!form.name.trim()) errors.name = "Supplier name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = "Invalid email format.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    if (!form.address.trim()) errors.address = "Address is required.";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setForm({ name: "", email: "", phone: "", address: "" });
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
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Failed to add supplier");
      setSuccess(true);
      handleReset();
      setTimeout(() => router.push("/supplier/list"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to add supplier");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20 }}
        className="mx-auto flex w-full max-w-5xl flex-col gap-6"
      >
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-gradient-to-br from-indigo-700/40 via-indigo-500/20 to-transparent p-6 shadow-xl shadow-indigo-900/40 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/80">Supplier Studio</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Create Supplier</h1>
              <p className="mt-1 text-sm text-slate-300">Capture partner details to unlock onboarding workflows and sourcing insights.</p>
            </div>
            <Link href="/supplier/list">
              <button className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:ring-offset-2 focus:ring-offset-slate-950">
                Back to list
              </button>
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/30 backdrop-blur">
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  Supplier name
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Acme Industrial Supplies"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.name ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 focus:border-indigo-400'
                  }`}
                />
                <p className="text-xs text-slate-500">Use the legal or trading name that appears on invoices and contracts.</p>
                {fieldErrors.name && <p className="text-xs text-red-400">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <EnvelopeIcon className="h-4 w-4" />
                  </span>
                  Contact email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="operations@acmeindustrial.com"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 focus:border-indigo-400'
                  }`}
                />
                <p className="text-xs text-slate-500">Primary inbox for purchase orders, remittance advice, or account queries.</p>
                {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <PhoneIcon className="h-4 w-4" />
                  </span>
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 555 123 4567"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.phone ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 focus:border-indigo-400'
                  }`}
                />
                <p className="text-xs text-slate-500">Prefer direct lines to procurement or account management teams.</p>
                {fieldErrors.phone && <p className="text-xs text-red-400">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                    <MapPinIcon className="h-4 w-4" />
                  </span>
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="742 Evergreen Terrace, Springfield"
                  className={`w-full rounded-xl border bg-slate-950/60 px-4 py-3 text-sm text-white shadow-inner transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.address ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 focus:border-indigo-400'
                  }`}
                />
                <p className="text-xs text-slate-500">Physical location used for shipments, service visits, or billing.</p>
                {fieldErrors.address && <p className="text-xs text-red-400">{fieldErrors.address}</p>}
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
                Supplier added successfully! Redirecting to directory…
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
                <Link href="/supplier/list">
                  <button className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-slate-950">
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:from-violet-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  Save supplier
                </button>
              </div>
            </div>
          </form>
        </section>
      </motion.div>
    </div>
  );
} 