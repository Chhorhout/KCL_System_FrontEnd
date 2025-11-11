"use client";
import { BuildingOffice2Icon } from '@heroicons/react/24/solid';
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from 'sweetalert2';

// API constants
const API_BASE = 'http://localhost:5045/api';
const DEPARTMENT_ENDPOINT = `${API_BASE}/Department`;

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

export default function UpdateDepartment() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const activeController = useRef<AbortController | null>(null);

  const nameTrimmed = useMemo(() => name.trim(), [name]);
  const isValid = nameTrimmed.length >= 2 && nameTrimmed.length <= 100;
  const [isChecking, setIsChecking] = useState(false);
  const [duplicate, setDuplicate] = useState<null | { matchedName: string }>(null);
  const checkerController = useRef<AbortController | null>(null);

  // Fetch existing department data - enhanced for better compatibility
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setFetchLoading(true);
    setError(null);

    // Try multiple endpoint patterns
    const urlPatterns = [
      `${DEPARTMENT_ENDPOINT}/${id}`,
      `${DEPARTMENT_ENDPOINT}?id=${id}`,
    ];

    const fetchData = async () => {
      for (const url of urlPatterns) {
        try {
          const res = await fetchWithTimeout(
            url,
            { headers: { Accept: 'application/json' } },
            10000,
            controller.signal
          );
          
          if (res.ok) {
            const data = await safeParseJson(res);
            if (data) {
              // Try multiple property names
              const fetchedName = data.name || data.Name || data.departmentName || data.DepartmentName || '';
              if (fetchedName) {
                setName(fetchedName);
                setFetchLoading(false);
                return;
              }
            }
          }
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          continue; // Try next pattern
        }
      }
      
      // If all patterns failed
      setError('Failed to fetch department data');
      setFetchLoading(false);
      Swal.fire('Error', 'Failed to load department data', 'error');
    };

    fetchData();
    return () => controller.abort();
  }, [id]);

  // Debounced duplicate-name check - enhanced fetching
  useEffect(() => {
    if (!isValid || !nameTrimmed) { setDuplicate(null); return; }
    const timer = setTimeout(async () => {
      try {
        if (checkerController.current) checkerController.current.abort();
        const controller = new AbortController();
        checkerController.current = controller;
        setIsChecking(true);
        setDuplicate(null);

        // Try multiple URL patterns
        const candidates = [
          `${DEPARTMENT_ENDPOINT}?search=${encodeURIComponent(nameTrimmed)}`,
          `${DEPARTMENT_ENDPOINT}?name=${encodeURIComponent(nameTrimmed)}`,
          `${DEPARTMENT_ENDPOINT}?q=${encodeURIComponent(nameTrimmed)}`,
          `${DEPARTMENT_ENDPOINT}`,
        ];

        let list: any[] = [];
        for (const url of candidates) {
          list = await fetchList(url, controller.signal);
          if (list.length > 0) break; // Found data, use it
        }

        // Check for duplicate but exclude current department
        const match = list.find((x) => {
          const matchId = String(x?.id || x?.ID || x?.departmentId || x?.DepartmentId || '');
          const matchName = String(x?.name ?? x?.Name ?? x?.departmentName ?? x?.DepartmentName ?? '').toLowerCase();
          return matchName === nameTrimmed.toLowerCase() && matchId !== id;
        });
        
        if (match) {
          setDuplicate({ matchedName: String(match.name ?? match.Name ?? match.departmentName ?? match.DepartmentName) });
        }
      } catch {} finally {
        setIsChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [nameTrimmed, isValid, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!isValid || duplicate) {
      setError("Please enter a valid, unique department name (2-100 characters).");
      return;
    }

    setLoading(true);
    try {
      if (activeController.current) activeController.current.abort();
      const controller = new AbortController();
      activeController.current = controller;

      // Try multiple payload formats for API compatibility
      const payloads = [
        { id, Name: nameTrimmed },
        { id, name: nameTrimmed },
        { departmentId: id, departmentName: nameTrimmed },
        { DepartmentId: id, DepartmentName: nameTrimmed },
      ];

      let lastError: any = null;
      for (const payload of payloads) {
        try {
          const res = await fetchWithTimeout(
            `${DEPARTMENT_ENDPOINT}/${id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json", Accept: 'application/json' },
              body: JSON.stringify(payload),
            },
            10000,
            controller.signal
          );

          if (res.ok) {
            Swal.fire({
              title: 'Success!',
              text: 'Department updated successfully.',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              confirmButtonText: 'OK'
            });
            setSuccess(true);
            setTimeout(() => router.push("/department/list"), 1200);
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

      throw new Error(lastError || 'Failed to update department');
    } catch (err: any) {
      setError(err?.message || "Failed to update department");
      Swal.fire({
        title: 'Error',
        text: err?.message || 'Failed to update department',
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

  const handleReset = () => {
    setError(null);
    setSuccess(false);
    // Reload original data
    window.location.reload();
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
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <BuildingOffice2Icon className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Update Department</h2>
          </div>
          <p className="text-indigo-100 text-sm mt-1">Modify department information</p>
        </div>

        {/* Form */}
        {fetchLoading ? (
          <div className="p-12 text-center bg-white">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading department data...</p>
          </div>
        ) : (
          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="p-8 space-y-6 bg-white"
            autoComplete="off"
            initial="hidden"
            animate="visible"
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="departmentName">
                <BuildingOffice2Icon className="h-5 w-5 text-purple-600" />
                <span>Department Name</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="departmentName"
                  type="text"
                  placeholder="e.g., Human Resources, IT, Finance..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={100}
                  className={`w-full border-2 rounded-xl px-4 py-3.5 text-base transition-all duration-200 ${
                    duplicate 
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
                      : isValid 
                        ? 'border-green-300 focus:border-purple-500 focus:ring-purple-200' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
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
              <div className="flex items-center justify-between text-xs px-1">
                <span className={duplicate ? 'text-red-600 font-semibold flex items-center gap-1' : 'text-gray-500'}>
                  {duplicate ? (
                    <>
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      A department with this name already exists.
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
                  <span className="text-green-700 text-sm font-medium">Department updated successfully!</span>
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
              <Link href="/department/list" className="flex-1 max-w-[150px]">
                <button
                  type="button"
                  className="w-full px-6 py-3 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={loading}
                >
                  Cancel
                </button>
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 max-w-[150px] px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={loading}
              >
                Reset
              </button>
              <button
                type="submit"
                className="flex-1 max-w-[200px] px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !isValid || !!duplicate}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <BuildingOffice2Icon className="h-5 w-5" />
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Back to list below the box */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <Link href="/department/list">
            <button className="w-full bg-white hover:bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200 border-2 border-gray-300 hover:border-purple-400 hover:text-purple-600 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Department List
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
