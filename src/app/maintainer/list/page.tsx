"use client";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

interface Maintainer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function MaintainerList() {
  const [maintainers, setMaintainers] = useState<Maintainer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMaintainers = async (pageNum = 1, searchTerm = "") => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL("http://localhost:5092/api/Maintainer");
      url.searchParams.append("page", pageNum.toString());
      url.searchParams.append("limit", "10");
      if (searchTerm) {
        url.searchParams.append("searchTerm", searchTerm);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch maintainers: ${response.status}`);
      }
      
      // Get pagination headers
      const totalPagesHeader = response.headers.get('X-Total-Pages');
      const currentPageHeader = response.headers.get('X-Current-Page');
      const pageSizeHeader = response.headers.get('X-Page-Size');
      const totalCountHeader = response.headers.get('X-Total-Count');
      
      // Update pagination state
      setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
      setPage(currentPageHeader ? parseInt(currentPageHeader) : pageNum);
      setPageSize(pageSizeHeader ? parseInt(pageSizeHeader) : 10);
      setTotalCount(totalCountHeader ? parseInt(totalCountHeader) : 0);
      
      // Parse and set data
      const data = await response.json();
      console.log('Fetched maintainer data:', data); // Debug log
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setMaintainers(data);
      } else {
        console.error('Expected array but got:', data);
        setMaintainers([]);
      }
      
    } catch (err: any) {
      console.error('Error fetching maintainers:', err);
      setError(err.message || "Failed to fetch maintainers");
      setMaintainers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintainers(page, searchTerm);
    // eslint-disable-next-line
  }, [page, searchTerm]);

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
        const response = await fetch(`http://localhost:5092/api/Maintainer/${id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error(`Failed to delete maintainer: ${response.status}`);
        }
        
        Swal.fire("Deleted!", "The maintainer has been deleted.", "success");
        
        // Refresh the current page or go to previous page if current page becomes empty
        const currentMaintainerCount = maintainers.length;
        if (currentMaintainerCount === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchMaintainers(page, searchTerm);
        }
        
      } catch (err: any) {
        console.error('Error deleting maintainer:', err);
        Swal.fire("Error", err.message || "Failed to delete maintainer", "error");
      }
    }
  };

  return (
    <div className="p-2 sm:p-8 flex justify-center items-start min-h-[80vh] bg-[#f7f9fb]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-semibold text-blue-900">Maintainer List</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search..."
              className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black w-full sm:w-64"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
            <Link href="/maintainer/add">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition w-full sm:w-auto">
                + Add New Maintainer
              </button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl">
          <table className="min-w-full text-base">
            <thead className="sticky top-0 z-10 bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Maintainer Info</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Email</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Phone</th>
                <th className="py-3 px-4 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-6 text-center">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="py-6 text-center text-red-600">{error}</td></tr>
              ) : maintainers.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-gray-400">No maintainers found.</td></tr>
              ) : (
                maintainers.map((maintainer) => (
                  <tr key={maintainer.id} className="border-t hover:bg-blue-50 transition">
                    {/* Maintainer Info */}
                    <td className="py-3 px-4 flex items-center gap-2 font-medium text-blue-900">
                      <UserIcon className="h-5 w-5 text-blue-400" />
                      <div>
                        <div className="font-semibold text-blue-900 text-base">{maintainer.name}</div>
                        <div className="text-xs text-gray-500">ID: {maintainer.id}</div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {maintainer.email}
                      </span>
                    </td>
                    {/* Phone */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {maintainer.phone}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link href={`/maintainer/edit/${maintainer.id}`}>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded" title="Edit">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </Link>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                          title="Delete"
                          onClick={() => handleDelete(maintainer.id)}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Page navigation example" className="mt-6 flex justify-end">
            <ul className="pagination flex gap-1">
              <li className={`page-item ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}>
                <a
                  className="page-link px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => setPage(page - 1)}
                  tabIndex={page === 1 ? -1 : 0}
                  aria-disabled={page === 1}
                >
                  Previous
                </a>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i} className={`page-item ${page === i + 1 ? 'font-bold' : ''}`}>
                  <a
                    className={`page-link px-3 py-1 rounded border border-gray-300 cursor-pointer ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </a>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}>
                <a
                  className="page-link px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={() => setPage(page + 1)}
                  tabIndex={page === totalPages ? -1 : 0}
                  aria-disabled={page === totalPages}
                >
                  Next
                </a>
              </li>
            </ul>
          </nav>
        )}
      </motion.div>
    </div>
  );
} 