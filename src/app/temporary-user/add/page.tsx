"use client";
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Swal from 'sweetalert2';

// API constants
const API_BASE = 'http://localhost:5092/api';
const TEMPORARY_USER_ENDPOINT = `${API_BASE}/TemporaryUser`;

// Helper functions
async function safeParseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    }
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10000, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  function onAbort() { controller.abort(); }
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
    if (signal) signal.removeEventListener('abort', onAbort as any);
  }
}

export default function AddTemporaryUser() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const activeController = useRef<AbortController | null>(null);

  const validate = () => {
    const errors: {[key: string]: string} = {};
    if (!name.trim()) errors.name = "Name is required.";
    else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
    if (!description.trim()) errors.description = "Description is required.";
    else if (description.length < 3) errors.description = "Description must be at least 3 characters.";
    return errors;
  };

  const handleReset = () => {
    setName("");
    setDescription("");
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
    
    setLoading(true);
    try {
      if (activeController.current) activeController.current.abort();
      const controller = new AbortController();
      activeController.current = controller;

      // Try multiple payload formats for API compatibility
      const payloads = [
        { name, description },
        { Name: name, Description: description },
        { temporaryUserName: name, temporaryUserDescription: description },
      ];

      let lastError: any = null;
      for (const payload of payloads) {
        try {
          const res = await fetchWithTimeout(
            TEMPORARY_USER_ENDPOINT,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: 'application/json' },
              body: JSON.stringify(payload),
            },
            10000,
            controller.signal
          );

          if (res.ok) {
            Swal.fire({
              title: 'Success!',
              text: 'Temporary user created successfully.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            });
            setSuccess(true);
            setTimeout(() => router.push("/temporary-user/list"), 1200);
            return;
          } else {
            const data = await safeParseJson(res);
            lastError = data?.message || data?.error || data?.title || `HTTP ${res.status}`;
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            lastError = err?.message || 'Network error';
          }
        }
      }
      throw new Error(lastError || 'Failed to add temporary user');
    } catch (err: any) {
      setError(err?.message || "Failed to add temporary user");
      Swal.fire({
        title: 'Error',
        text: err?.message || 'Failed to add temporary user',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
      activeController.current = null;
    }
  };

  return (
    <div className="min-h-[80vh] flex justify-center items-start bg-[#f7f9fb] p-3 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-3xl bg-white rounded-xl shadow-lg"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-500 rounded-t-xl px-6 py-4">
          <h2 className="text-2xl font-semibold text-white mb-2 sm:mb-0">Add New Temporary User</h2>
          <Link href="/temporary-user/list">
            <button className="bg-white text-blue-700 font-semibold px-6 py-2 rounded shadow hover:bg-blue-50 transition text-base">Back to List</button>
          </Link>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8" autoComplete="off">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <tbody>
                <tr className="flex flex-col sm:table-row">
                  <td className="py-3 px-3 font-semibold text-gray-600 w-full sm:w-1/4 min-w-[140px]">Name</td>
                  <td className="py-3 px-3 flex flex-col items-start gap-2 w-full">
                    <input
                      type="text"
                      className={`w-full border ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-base`}
                      placeholder="Enter temporary user name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                    />
                    {fieldErrors.name && <span className="text-red-500 text-sm">{fieldErrors.name}</span>}
                  </td>
                </tr>
                <tr className="flex flex-col sm:table-row">
                  <td className="py-3 px-3 font-semibold text-gray-600 w-full sm:w-1/4 min-w-[140px]">Description</td>
                  <td className="py-3 px-3 flex flex-col items-start gap-2 w-full">
                    <textarea
                      className={`w-full border ${fieldErrors.description ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black text-base`}
                      placeholder="Enter description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      minLength={3}
                    />
                    {fieldErrors.description && <span className="text-red-500 text-sm">{fieldErrors.description}</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Error/Success */}
          {error && <div className="text-red-600 mt-3 text-base">{error}</div>}
          {success && (
            <div className="text-green-600 mt-3 text-base flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              Temporary user added successfully!
            </div>
          )}
          {/* Buttons */}
          <div className="flex justify-center gap-3 mt-8">
            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-7 py-2 rounded transition text-base"
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-7 py-2 rounded transition text-base flex items-center gap-2"
              disabled={loading || Object.keys(fieldErrors).length > 0}
            >
              {loading && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>}
              {loading ? "Saving..." : "Save Temporary User"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

