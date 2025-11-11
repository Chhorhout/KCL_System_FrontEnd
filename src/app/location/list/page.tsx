"use client";
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Swal from 'sweetalert2';

// === API constants ===
const API_BASE = 'http://localhost:5092/api';
const LOCATION_ENDPOINT = `${API_BASE}/location`;
const PAGE_SIZE = 10;

// === Types ===
type RawLocation = {
  id?: string | number;
  ID?: string | number;
  locationId?: string | number;
  LocationId?: string | number;
  name?: string;
  Name?: string;
  locationName?: string;
  LocationName?: string;
  [key: string]: any;
};

interface Location {
  id: string;
  name: string;
}

// === Helpers ===
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
      // Try to extract JSON from text if it's wrapped
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

function extractList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.locations)) return payload.locations;
  if (Array.isArray(payload?.locationList)) return payload.locationList;
  if (typeof payload === 'object') {
    // Check if it's a single item that should be wrapped in array
    if (payload.id || payload.ID || payload.locationId || payload.name || payload.Name) {
      return [payload];
    }
  }
  return [];
}

function normalizeLocation(raw: RawLocation): Location | null {
  const idSource = raw?.id ?? raw?.ID ?? raw?.locationId ?? raw?.LocationId;
  const nameSource = raw?.name ?? raw?.Name ?? raw?.locationName ?? raw?.LocationName;
  if (idSource == null) return null;
  return { id: String(idSource), name: String(nameSource ?? '') };
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  function onAbort() { controller.abort(); }
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
    if (signal) signal.removeEventListener('abort', onAbort as any);
  }
}

async function fetchJsonListWithRetry(url: string, init: RequestInit, attempts = 3, signal?: AbortSignal): Promise<{ list: any[]; res: Response | null }> {
  let lastErr: any = null;
  let lastRes: Response | null = null;
  
  for (let i = 0; i < attempts; i++) {
    try {
      // Check if signal was aborted before attempting fetch
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      
      const res = await fetchWithTimeout(url, init, 15000, signal);
      lastRes = res;
      
      // Check again after fetch in case it was aborted during fetch
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      
      // Even if status is not ok, try to parse the response (some APIs return data with error codes)
      const payload = await safeParseJson(res);
      
      if (payload !== null) {
        const list = extractList(payload);
        // Accept if we got data, even if status is not 200
        if (list.length >= 0 || res.ok) {
          return { list: list || [], res };
        }
      }
      
      // If status is ok but no data, that's fine - return empty
      if (res.ok) {
        return { list: [], res };
      }
      
      throw new Error(`HTTP ${res.status}`);
    } catch (e: any) {
      // If it's an abort error, re-throw it immediately (don't retry)
      if (e?.name === 'AbortError' || e?.message?.includes('abort')) {
        throw e;
      }
      
      lastErr = e;
      // Exponential backoff: 200ms, 400ms, 800ms
      if (i < attempts - 1) {
        await new Promise(r => setTimeout(r, 200 * Math.pow(2, i)));
      }
    }
  }
  
  // Return empty result instead of throwing - more resilient
  return { list: [], res: lastRes };
}

export default function LocationList() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const activeController = useRef<AbortController | null>(null);

  const fetchLocations = async (page: number) => {
    // Don't set loading if we already have data (for smoother UX)
    if (locations.length === 0) {
      setLoading(true);
    }
    setError(null);
    
    // Cancel any in-flight request
    if (activeController.current) {
      activeController.current.abort();
    }
    const controller = new AbortController();
    activeController.current = controller;
    
    try {

      // Try multiple URL patterns for better compatibility (including alternative endpoints)
      const urlPatterns = [
        `${LOCATION_ENDPOINT}?page=${page}&limit=${pageSize}`,
        `${LOCATION_ENDPOINT}?page=${page}&pageSize=${pageSize}`,
        `${LOCATION_ENDPOINT}?pageNumber=${page}&pageSize=${pageSize}`,
        `${LOCATION_ENDPOINT}?page=${page}`,
        `${LOCATION_ENDPOINT}?skip=${(page - 1) * pageSize}&take=${pageSize}`,
        `${LOCATION_ENDPOINT}?offset=${(page - 1) * pageSize}&limit=${pageSize}`,
        `${LOCATION_ENDPOINT}`,
        // Try alternative endpoint names
        `${API_BASE}/Location?page=${page}&limit=${pageSize}`,
        `${API_BASE}/locations?page=${page}&limit=${pageSize}`,
      ];

      let list: any[] = [];
      let res: Response | null = null;
      let successCount = 0;

      // Try each URL pattern with retries
      let aborted = false;
      for (const url of urlPatterns) {
        // Check if aborted before each attempt
        if (controller.signal.aborted) {
          aborted = true;
          break;
        }

        try {
          const result = await fetchJsonListWithRetry(
            url,
            { 
              headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }, 
              cache: 'no-store',
              mode: 'cors', // Handle CORS better
            },
            3, // 3 retry attempts per URL
            controller.signal
          );
          
          list = result.list || [];
          res = result.res;
          
          // If we got any data, consider it success
          if (Array.isArray(list) && list.length >= 0) {
            successCount++;
            // If we got data or a valid response, use it
            if (list.length > 0 || res?.ok) {
              break; // Success with data
            }
          }
        } catch (e: any) {
          // If aborted, don't continue trying other URLs
          if (e?.name === 'AbortError' || e?.message?.includes('abort') || controller.signal.aborted) {
            aborted = true;
            break;
          }
          // Log error but continue trying other patterns
          console.warn(`Failed to fetch from ${url}:`, e.message || e);
          continue;
        }
      }

      // If aborted, don't update state or set error
      if (aborted || controller.signal.aborted) {
        return;
      }

      // Normalize the data regardless of where it came from
      const normalized = (list as RawLocation[])
        .map(normalizeLocation)
        .filter((x): x is Location => !!x);

      // Calculate pagination
      let computedPages = 1;
      if (res) {
        const totalPagesHeader = getHeaderInt(res, 'X-Total-Pages', 'x-total-pages');
        const totalCountHeader = getHeaderInt(res, 'X-Total-Count', 'x-total-count');
        
        if (totalPagesHeader > 0) {
          computedPages = totalPagesHeader;
        } else if (totalCountHeader > 0) {
          computedPages = Math.max(1, Math.ceil(totalCountHeader / pageSize));
        } else if (normalized.length > 0) {
          // Estimate pages based on current data (might be inaccurate but better than 1)
          computedPages = Math.max(1, Math.ceil(normalized.length / pageSize));
          // If we got a full page, there might be more
          if (normalized.length >= pageSize) {
            computedPages = Math.max(computedPages, page + 1);
          }
        }
      } else if (normalized.length > 0) {
        computedPages = Math.max(1, Math.ceil(normalized.length / pageSize));
      }

      // If no response was successful, only set error if we don't have existing data
      if (normalized.length === 0 && successCount === 0) {
        if (locations.length === 0) {
          setError("No locations found. Please check your connection and try again.");
        }
        setLoading(false);
        activeController.current = null;
        return;
      }

      // Update total count from headers if available
      if (res) {
        const totalCountHeader = getHeaderInt(res, 'X-Total-Count', 'x-total-count');
        if (totalCountHeader > 0) {
          setTotalCount(totalCountHeader);
        } else if (normalized.length > 0) {
          setTotalCount(normalized.length);
        }
      } else if (normalized.length > 0) {
        setTotalCount(normalized.length);
      }

      setLocations(normalized);
      setTotalPages(Math.max(1, computedPages));
      setError(null); // Clear any previous errors on success
      
      // Ensure current page is valid
      if (currentPage > computedPages && computedPages > 0) {
        setCurrentPage(1);
      }
      
    } catch (e: any) {
      // Only set error if it's not an abort and we don't have existing data
      if (e?.name !== 'AbortError' && !e?.message?.includes('abort')) {
        if (locations.length === 0) {
          console.error('Fetch locations error:', e);
          setError(e?.message || "Failed to fetch locations. Please try again.");
        }
      }
    } finally {
      setLoading(false);
      // Only clear controller if it's still the active one
      if (activeController.current === controller && !controller.signal.aborted) {
        activeController.current = null;
      }
    }
  };

  useEffect(() => {
    fetchLocations(currentPage);
    return () => {
      if (activeController.current) activeController.current.abort();
    };
  }, [currentPage, pageSize]);

  const filteredLocations = query.trim()
    ? locations.filter(l => (l.name || '').toLowerCase().includes(query.trim().toLowerCase()))
    : locations;

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

  const sortedLocations = [...filteredLocations].sort((a, b) => {
    if (sortBy === 'newest') {
      // If there's no date field, sort by name as fallback
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'oldest') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-asc') {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (sortBy === 'name-desc') {
      return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
    }
    return 0;
  });

  const handleRefresh = () => {
    fetchLocations(currentPage);
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You won't be able to recover "${name}"!`,
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
          `${LOCATION_ENDPOINT}/${id}`,
          `${LOCATION_ENDPOINT}?id=${id}`,
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
          throw new Error("Failed to delete location");
        }
        
        Swal.fire("Deleted!", "The location has been deleted.", "success");
        fetchLocations(currentPage);
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete location", "error");
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
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
          <h1 className="text-3xl font-bold text-white mb-2">Locations ({totalCount > 0 ? totalCount : filteredLocations.length})</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-white">Locations</span>
          </nav>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              {/* Show per page */}
              <select
                value={pageSize}
                onChange={(e) => { setCurrentPage(1); setPageSize(Number(e.target.value)); }}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>Show 10</option>
                <option value={25}>Show 25</option>
                <option value={50}>Show 50</option>
                <option value={100}>Show 100</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:flex-initial">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add Button */}
              <Link href="/location/add">
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
          ) : sortedLocations.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No locations found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700 border-b border-gray-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white">
                        <div className="flex items-center gap-2">
                          NAME
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sortedLocations.map((location) => {
                      return (
                        <tr
                          key={location.id}
                          className="hover:bg-gray-700/50 transition-colors"
                        >
                          {/* Name with Icon */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                  <MapPinIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-white">{location.name || 'Unnamed'}</div>
                                <div className="text-xs text-gray-400">Location</div>
                              </div>
                            </div>
                          </td>

                          {/* Actions Menu */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActionMenu(location.id);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                              </button>

                              {actionMenuOpen === location.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10">
                                  <div className="py-1">
                                    <Link
                                      href={`/location/update/${location.id}`}
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
                                        handleDelete(location.id, location.name);
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLocations.length)} of {totalCount || filteredLocations.length} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreviousPage()}
                disabled={currentPage <= 1}
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
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handleNextPage()}
                disabled={currentPage >= totalPages}
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