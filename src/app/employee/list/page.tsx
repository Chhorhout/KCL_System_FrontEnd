"use client";
import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhoneIcon,
  TrashIcon,
  UserIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  hireDate: string;
  departmentId: string;
  imageUrl?: string;
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const API_BASE_URL = 'http://localhost:5045';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Department state
  const [departments, setDepartments] = useState<Map<string, string>>(new Map());
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  // Sort and action menu state
  const [sortBy, setSortBy] = useState<string>('newest');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const fetchEmployees = (signal?: AbortSignal) => {
    setLoading(true);
    const url = `${API_BASE_URL}/api/Employee?page=${page}&pageSize=${pageSize}`;
    fetch(url, { signal, cache: 'no-store', headers: { 'Accept': 'application/json' } })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Failed to fetch employees (${res.status})`);
        }
        // Read pagination headers if present
        const h = res.headers;
        const tp = parseInt(h.get('X-Total-Pages') || h.get('x-total-pages') || '1', 10);
        const tc = parseInt(h.get('X-Total-Count') || h.get('x-total-count') || '0', 10);
        const cp = parseInt(h.get('X-Current-Page') || h.get('x-current-page') || String(page), 10);
        const ps = parseInt(h.get('X-Page-Size') || h.get('x-page-size') || String(pageSize), 10);
        if (!Number.isNaN(tp)) setTotalPages(tp);
        if (!Number.isNaN(tc)) setTotalCount(tc);
        if (!Number.isNaN(cp)) setPage(cp);
        if (!Number.isNaN(ps)) setPageSize(ps);

        let data: any;
        try {
          data = await res.json();
        } catch {
          const text = await res.text().catch(() => '');
          try { data = text ? JSON.parse(text) : []; } catch { data = []; }
        }
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : Array.isArray((data as any)?.result)
                ? (data as any).result
                : [];
        setEmployees(list as any);
        
        // Update totalCount from list length if header wasn't available
        if (!tc || tc === 0) {
          setTotalCount(list.length);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        if ((err as any)?.name === 'AbortError') return; // ignore aborts
        setError((err as any)?.message || 'Failed to fetch employees');
        setLoading(false);
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEmployees(controller.signal);
    return () => controller.abort();
  }, [page, pageSize]);

  // Fetch departments on mount
  useEffect(() => {
    const controller = new AbortController();
    setLoadingDepartments(true);
    
    fetch(`${API_BASE_URL}/api/Department`, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    })
      .then(async (res) => {
        if (!res.ok) return;
        let data: any;
        try {
          data = await res.json();
        } catch {
          return;
        }
        
        const items = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items) ? (data as any).items
          : Array.isArray((data as any)?.data) ? (data as any).data
          : Array.isArray((data as any)?.result) ? (data as any).result
          : [];
        
        const deptMap = new Map<string, string>();
        items.forEach((item: any) => {
          const id = String(item.id || item.ID || item.departmentId || item.DepartmentId || '');
          const name = String(item.name || item.Name || item.departmentName || item.DepartmentName || 'Unknown');
          if (id && name !== 'Unknown') {
            deptMap.set(id, name);
          }
        });
        
        setDepartments(deptMap);
      })
      .catch((err: any) => {
        if (err?.name !== 'AbortError') {
          console.error('Failed to fetch departments:', err);
        }
      })
      .finally(() => {
        setLoadingDepartments(false);
      });
    
    return () => controller.abort();
  }, []);

  // Helper function to get department name
  const getDepartmentName = (deptId: string | undefined): string => {
    if (!deptId) return 'N/A';
    return departments.get(String(deptId)) || `Dept ID: ${deptId}`;
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString();
  };

  const filteredEmployees = employees.filter((e) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const deptId = String((e as any).departmentId || (e as any).DepartmentId || e.departmentId || '');
    const deptName = getDepartmentName(deptId).toLowerCase();
    return (
      fullName.includes(term) ||
      e.email.toLowerCase().includes(term) ||
      String(e.phoneNumber).toLowerCase().includes(term) ||
      deptName.includes(term)
    );
  });

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
        const res = await fetch(`${API_BASE_URL}/api/Employee/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete employee");
        fetchEmployees();
        Swal.fire("Deleted!", "The employee has been deleted.", "success");
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete employee", "error");
      }
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

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
    } else if (sortBy === 'name-asc') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    } else if (sortBy === 'name-desc') {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

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
          <h1 className="text-3xl font-bold text-white mb-2">Employees ({totalCount || filteredEmployees.length})</h1>
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-white">Employees</span>
          </nav>
        </div>

        {/* Filters and Actions */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
              {/* Show per page */}
              <select
                value={pageSize}
                onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-600 rounded-lg pl-10 pr-4 py-2 w-full lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add Button */}
              <Link href="/employee/add">
                <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors flex items-center justify-center">
                  <UserPlusIcon className="h-5 w-5" />
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
          ) : sortedEmployees.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No employees found.</div>
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white">
                        <div className="flex items-center gap-2">
                          EMAIL
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white">
                        <div className="flex items-center gap-2">
                          PHONE
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white">
                        <div className="flex items-center gap-2">
                          DEPARTMENT
                          <ChevronDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sortedEmployees.map((employee) => {
                      const fullName = `${employee.firstName} ${employee.lastName}`.trim() || 'Unnamed';
                      const deptId = String((employee as any).departmentId || (employee as any).DepartmentId || employee.departmentId || '');
                      
                      return (
                        <tr
                          key={employee.id}
                          className="hover:bg-gray-700/50 transition-colors"
                        >
                          {/* Name with Avatar */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {employee.imageUrl ? (
                                  <img
                                    src={employee.imageUrl}
                                    alt={fullName}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                    <UserIcon className="h-6 w-6 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-white">{fullName}</div>
                                <div className="text-xs text-gray-400">Employee</div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{employee.email || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{employee.phoneNumber || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <BuildingOffice2Icon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-300">
                                {loadingDepartments ? 'Loading...' : getDepartmentName(deptId)}
                              </span>
                            </div>
                          </td>

                          {/* Actions Menu */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActionMenu(employee.id);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                <EllipsisHorizontalIcon className="h-5 w-5 text-gray-400 hover:text-white" />
                              </button>

                              {actionMenuOpen === employee.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-10">
                                  <div className="py-1">
                                    <Link
                                      href={`/employee/update/${employee.id}`}
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
                                        handleDelete(employee.id);
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
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredEmployees.length)} of {totalCount || filteredEmployees.length} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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