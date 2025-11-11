"use client";
import {
    ChevronDownIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    EllipsisHorizontalIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    UserIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';

// API constants
const API_BASE = 'http://localhost:5092/api';
const TEMPORARY_USER_ENDPOINT = `${API_BASE}/TemporaryUser`;

interface TemporaryUser {
  id: string;
  name: string;
  description: string;
}

// Helper functions for robust data fetching
function getHeaderInt(res: Response, ...names: string[]): number {
  for (const name of names) {
    const v = res.headers.get(name);
    if (v) {
      const n = parseInt(v, 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  function onAbort() { controller.abort(); }
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
    if (signal) signal.removeEventListener('abort', onAbort as any);
  }
}

function extractList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.temporaryUsers)) return payload.temporaryUsers;
  if (Array.isArray(payload?.temporaryUserList)) return payload.temporaryUserList;
  return [];
}

export default function TemporaryUserList() {
  const [temporaryUsers, setTemporaryUsers] = useState<TemporaryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof TemporaryUser>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const activeController = useRef<AbortController | null>(null);

  // Fetch temporary users with server-side pagination - enhanced for robustness
  const fetchTemporaryUsers = async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Cancel any in-flight request
      if (activeController.current) activeController.current.abort();
      const controller = new AbortController();
      activeController.current = controller;

      // Try multiple URL patterns for better compatibility
      const urlPatterns = [
        `${TEMPORARY_USER_ENDPOINT}?page=${pageNum}&pageSize=${pageSize}`,
        `${TEMPORARY_USER_ENDPOINT}?pageNumber=${pageNum}&pageSize=${pageSize}`,
        `${TEMPORARY_USER_ENDPOINT}?page=${pageNum}`,
        `${TEMPORARY_USER_ENDPOINT}?skip=${(pageNum - 1) * pageSize}&take=${pageSize}`,
        `${TEMPORARY_USER_ENDPOINT}?offset=${(pageNum - 1) * pageSize}&limit=${pageSize}`,
        `${TEMPORARY_USER_ENDPOINT}`,
      ];

      let list: any[] = [];
      let res: Response | null = null;

      for (const url of urlPatterns) {
        if (controller.signal.aborted) {
          setLoading(false);
          return;
        }

        try {
          res = await fetchWithTimeout(
            url,
            { 
              headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }, 
              cache: 'no-store',
              mode: 'cors',
            },
            15000,
            controller.signal
          );
          
          const payload = await safeParseJson(res);
          if (payload !== null) {
            list = extractList(payload);
            if (list.length >= 0 || res.ok) {
              break; // Success
            }
          }
          
          if (res.ok) {
            break; // OK response with no data is fine
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') {
            setLoading(false);
            return;
          }
          continue; // Try next pattern
        }
      }

      // Normalize temporary users
      const normalized = list.map((item: any) => ({
        id: String(item?.id ?? item?.ID ?? item?.temporaryUserId ?? ''),
        name: String(item?.name ?? item?.Name ?? item?.temporaryUserName ?? ''),
        description: String(item?.description ?? item?.Description ?? item?.desc ?? ''),
      })).filter(user => user.id);

      // Calculate pagination from headers or data
      let computedPages = 1;
      if (res) {
        const totalPagesHeader = getHeaderInt(res, 'X-Total-Pages', 'x-total-pages');
        const totalCountHeader = getHeaderInt(res, 'X-Total-Count', 'x-total-count');
        const currentPageHeader = getHeaderInt(res, 'X-Current-Page', 'x-current-page');
        const pageSizeHeader = getHeaderInt(res, 'X-Page-Size', 'x-page-size');
        
        if (totalPagesHeader > 0) {
          computedPages = totalPagesHeader;
        } else if (totalCountHeader > 0) {
          computedPages = Math.max(1, Math.ceil(totalCountHeader / (pageSizeHeader || pageSize)));
        }
        
        if (currentPageHeader > 0) {
          setPage(currentPageHeader);
        }
        if (pageSizeHeader > 0) {
          setPageSize(pageSizeHeader);
        }
        if (totalCountHeader > 0) {
          setTotalCount(totalCountHeader);
        }
      }

      if (normalized.length === 0 && !controller.signal.aborted) {
        setError("No temporary users found. Please check your connection and try again.");
      } else {
        setError(null);
      }

      setTemporaryUsers(normalized);
      setTotalPages(Math.max(1, computedPages));
      
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('Fetch temporary users error:', e);
        setError(e?.message || "Failed to fetch temporary users. Please try again.");
      }
    } finally {
      setLoading(false);
      activeController.current = null;
    }
  };

  useEffect(() => {
    fetchTemporaryUsers(page);
    return () => {
      if (activeController.current) activeController.current.abort();
    };
    // eslint-disable-next-line
  }, [page, pageSize]);

  // Filter (client-side, after server-side pagination)
  const filtered = temporaryUsers.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.description.toLowerCase().includes(search.toLowerCase())
  );

  // Sort (client-side, after server-side pagination)
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    if (aVal && bVal && aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal && bVal && aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (col: keyof TemporaryUser) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const toggleActionMenu = (id: string) => {
    setActionMenuOpen(actionMenuOpen === id ? null : id);
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionMenuOpen(null);
    if (actionMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenuOpen]);

  // Delete handler
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        // Try multiple delete endpoint patterns
        const deletePatterns = [
          `${TEMPORARY_USER_ENDPOINT}/${id}`,
          `${TEMPORARY_USER_ENDPOINT}?id=${id}`,
        ];
        
        let deleted = false;
        for (const url of deletePatterns) {
          try {
            const res = await fetchWithTimeout(
              url, 
              { 
                method: "DELETE",
                headers: { 'Accept': 'application/json' }
              },
              10000
            );
            
            if (res.ok || res.status === 204) {
              deleted = true;
              break;
            }
          } catch (err) {
            continue; // Try next pattern
          }
        }
        
        if (!deleted) {
          throw new Error("Failed to delete temporary user");
        }
        
        Swal.fire("Deleted!", "The temporary user has been deleted.", "success");
        fetchTemporaryUsers(page);
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete temporary user", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Temporary Users ({totalCount || sorted.length})</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-white">Temporary Users</span>
          </nav>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search temporary users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button - Right Side */}
            <div className="flex items-center justify-end">
              <Link href="/temporary-user/add">
                <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors flex items-center justify-center">
                  <PlusIcon className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">{error}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No temporary users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        NAME
                        {sortBy === 'name' ? (sortDir === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('description')}>
                      <div className="flex items-center gap-2">
                        DESCRIPTION
                        {sortBy === 'description' ? (sortDir === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sorted.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Name with Icon */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{user.name || 'Unnamed'}</div>
                            <div className="text-xs text-gray-400">Temporary User</div>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{user.description || '-'}</div>
                      </td>

                      {/* Actions Menu */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(user.id);
                            }}
                            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                          </button>

                          {actionMenuOpen === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10">
                              <div className="py-1">
                                <Link
                                  href={`/temporary-user/update/${user.id}`}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                                  onClick={() => setActionMenuOpen(null)}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                  Edit
                                </Link>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionMenuOpen(null);
                                    handleDelete(user.id);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-600 hover:text-red-300 transition-colors"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Pagination */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sorted.length)} of {sorted.length} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>
              
              {/* Page Numbers */}
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
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

