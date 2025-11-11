"use client";
import { MapPinIcon } from '@heroicons/react/24/solid';
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from 'sweetalert2';

// API constants
const API_BASE = 'http://localhost:5092/api';
const LOCATION_ENDPOINT = `${API_BASE}/location`;
const DRAFT_KEY = 'add-location-draft-v1';

// Helpers - Enhanced for better data fetching
async function safeParseJson(res: Response): Promise<any> {
  try { 
    return await res.json(); 
  } catch { 
    const text = await res.text().catch(() => '');
    try { 
      return text ? JSON.parse(text) : null; 
    } catch { 
      return null; 
    }
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

// Enhanced list fetcher
async function fetchList(url: string, signal?: AbortSignal): Promise<any[]> {
  try {
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 10000, signal);
    if (!res.ok) return [];
    const data = await safeParseJson(res);
    if (!data) return [];
    
    // Handle various response formats
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.result)) return data.result;
    return [];
  } catch {
    return [];
  }
}

export default function AddLocation() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const activeController = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);

  const nameTrimmed = useMemo(() => name.trim(), [name]);
  const isValid = nameTrimmed.length >= 2 && nameTrimmed.length <= 100;
  const [isChecking, setIsChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<null | { matchedName: string }>(null);
  const checkerController = useRef<AbortController | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!isValid || duplicate) {
      setError("Please enter a valid, unique location name (2-100 characters).");
      return;
    }
    setLoading(true);
    try {
      if (activeController.current) activeController.current.abort();
      const controller = new AbortController();
      activeController.current = controller;

      // Try multiple payload formats for API compatibility
      const payloads = [
        { Name: nameTrimmed },
        { name: nameTrimmed },
        { locationName: nameTrimmed },
        { LocationName: nameTrimmed },
      ];

      let lastError: any = null;
      for (const payload of payloads) {
        try {
          const res = await fetchWithTimeout(
            LOCATION_ENDPOINT,
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
              text: 'Location created successfully.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            });
            setSuccess(true);
            try { localStorage.removeItem(DRAFT_KEY); } catch {}
            setTimeout(() => router.push("/location/list"), 1200);
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

      throw new Error(lastError || 'Failed to create location');
    } catch (err: any) {
      setError(err?.message || "Failed to add location");
      Swal.fire({
        title: 'Error',
        text: err?.message || 'Failed to add location',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    } finally {
      setLoading(false);
      activeController.current = null;
    }
  };

  // Keyboard shortcut: Ctrl/Cmd+Enter to submit
  const onKeyDown = useCallback((ev: KeyboardEvent) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'enter') {
      formRef.current?.requestSubmit();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Load draft on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.name === 'string') {
          setName(parsed.name);
        }
      }
    } catch {}
  }, []);

  // Save draft
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ name })); } catch {}
  }, [name]);

  // Warn on unload if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (nameTrimmed && !success) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [nameTrimmed, success]);

  // Debounced duplicate-name check - enhanced fetching
  useEffect(() => {
    if (!isValid) { setDuplicate(null); return; }
    const timer = setTimeout(async () => {
      try {
        if (checkerController.current) checkerController.current.abort();
        const controller = new AbortController();
        checkerController.current = controller;
        setIsChecking(true);
        setDuplicate(null);

        // Try multiple URL patterns
        const candidates = [
          `${LOCATION_ENDPOINT}?search=${encodeURIComponent(nameTrimmed)}`,
          `${LOCATION_ENDPOINT}?name=${encodeURIComponent(nameTrimmed)}`,
          `${LOCATION_ENDPOINT}?q=${encodeURIComponent(nameTrimmed)}`,
          `${LOCATION_ENDPOINT}`,
        ];

        let list: any[] = [];
        for (const url of candidates) {
          list = await fetchList(url, controller.signal);
          if (list.length > 0) break; // Found data, use it
        }

        const match = list.find((x) => {
          const matchName = String(x?.name ?? x?.Name ?? x?.locationName ?? x?.LocationName ?? '').toLowerCase();
          return matchName === nameTrimmed.toLowerCase();
        });
        
        if (match) {
          setDuplicate({ matchedName: String(match.name ?? match.Name ?? match.locationName ?? match.LocationName) });
        }
      } catch {} finally {
        setIsChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nameTrimmed, isValid]);

  const handleReset = () => {
    setName("");
    setError(null);
    setSuccess(false);
    setDuplicate(null);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  return (
    <div className="min-h-[80vh] flex justify-center items-start bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <MapPinIcon className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Add New Location</h2>
          </div>
          <p className="text-blue-100 text-sm mt-1">Create a new location for your organization</p>
        </div>

        {/* Form */}
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-8 space-y-6 bg-white"
          autoComplete="off"
          initial="hidden"
          animate="visible"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="locationName">
              <MapPinIcon className="h-5 w-5 text-indigo-600" />
              <span>Location Name</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="locationName"
                type="text"
                placeholder="e.g., Building A, Warehouse, Office Floor 5..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={100}
                aria-invalid={!isValid || !!duplicate}
                aria-describedby="nameHelp"
                className={`w-full border-2 rounded-xl px-4 py-3.5 text-base transition-all duration-200 ${
                  duplicate 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                    : isValid 
                      ? 'border-green-300 focus:border-indigo-500 focus:ring-indigo-200' 
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'
                } focus:outline-none focus:ring-4 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-400`}
                required
              />
              {isValid && !duplicate && name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div id="nameHelp" className="flex items-center justify-between text-xs px-1">
              <span className={duplicate ? 'text-red-600 font-semibold flex items-center gap-1' : 'text-gray-500'}>
                {duplicate ? (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    A location with this name already exists.
                  </>
                ) : (
                  'Enter 2–100 characters. Names must be unique.'
                )}
              </span>
              <span className={`font-medium ${isValid ? 'text-green-600' : 'text-gray-400'}`}>
                {isChecking ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Checking...
                  </span>
                ) : (
                  `${name.length}/100`
                )}
              </span>
            </div>
          </div>

          {/* Error/Success */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </div>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-700 text-sm font-medium">Location added successfully!</span>
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !isValid || !!duplicate}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <MapPinIcon className="h-5 w-5" />
                  Add Location
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Back to list below the box */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <Link href="/location/list">
            <button className="w-full bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-gray-300 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Location List
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
