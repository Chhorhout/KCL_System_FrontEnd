"use client";
import { UserIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
  createdAt?: string;
  imageUrl?: string;
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return date.toLocaleDateString("en-US", options);
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch users with server-side pagination and search
  const fetchUsers = (pageNum = 1, searchTerm = "", searchBy = "") => {
    setLoading(true);
    const url = new URL("http://localhost:5119/api/users");
    url.searchParams.append("page", pageNum.toString());
    if (searchTerm) url.searchParams.append("searchTerm", searchTerm);
    if (searchBy) url.searchParams.append("searchBy", searchBy);

    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        const totalPagesHeader = res.headers.get('X-Total-Pages');
        const currentPageHeader = res.headers.get('X-Current-Page');
        const pageSizeHeader = res.headers.get('X-Page-Size');
        const totalCountHeader = res.headers.get('X-Total-Count');
        setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
        setPage(currentPageHeader ? parseInt(currentPageHeader) : pageNum);
        setPageSize(pageSizeHeader ? parseInt(pageSizeHeader) : 5);
        setTotalCount(totalCountHeader ? parseInt(totalCountHeader) : 0);
        const data = await res.json();
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers(page, searchTerm, searchBy);
    // eslint-disable-next-line
  }, [page, searchTerm, searchBy]);

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
        // Call the API to delete the user
        const res = await fetch(`http://localhost:5119/api/users/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete user");
        // Refresh the user list from backend
        fetchUsers(page, searchTerm, searchBy);
        Swal.fire("Deleted!", "The user has been deleted.", "success");
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete user", "error");
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
            <span className="text-xl font-semibold text-blue-900">User List</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search..."
              className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black w-full sm:w-64"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            />
            <select
              className="border border-gray-300 rounded px-2 py-2 text-black"
              value={searchBy}
              onChange={e => { setSearchBy(e.target.value); setPage(1); }}
            >
              <option value="">All Fields</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="active">Status</option>
            </select>
            <Link href="/users/add">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition w-full sm:w-auto">
                + Add New User
              </button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-10">Loading...</div>
          ) : error ? (
            <div className="col-span-full text-center text-red-600 py-10">{error}</div>
          ) : users.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-10">No users found.</div>
          ) : (
            users.map((user, idx) => (
              <motion.div
                key={user.id}
                className="bg-white rounded-xl shadow flex flex-col items-center gap-4 border hover:shadow-lg transition p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100, damping: 20 }}
              >
                {/* User Image */}
                <div className="flex-shrink-0 flex items-center justify-center h-24 w-24 bg-gray-100 rounded-full border border-gray-200">
                  {user.imageUrl ? (
                    <img src={user.imageUrl} alt={user.name} className="h-20 w-20 object-cover rounded-full" />
                  ) : (
                    <UserIcon className="h-12 w-12 text-blue-400" />
                  )}
                </div>
                {/* User Details */}
                <div className="flex-1 flex flex-col items-center text-center w-full">
                  <div className="font-bold text-lg text-blue-900 truncate w-full">{user.name}</div>
                  <div className="text-sm text-gray-700 truncate w-full">{user.email}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded text-xs font-semibold">
                      <UserIcon className="h-3 w-3" /> {user.role}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 mt-2 w-full">
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold
                      ${user.active === true ? "bg-green-100 text-green-800" :
                        user.active === false ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"}`}>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.active === true ? '#22c55e' : user.active === false ? '#ef4444' : '#9ca3af' }}></span>
                      {user.active === true ? "Active" : user.active === false ? "Inactive" : "Unknown"}
                    </span>
                    {/* Created Date */}
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Created at {formatShortDate(user.createdAt || "")}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex justify-center gap-3 mt-4 w-full">
                    <Link href={`/users/update/${user.id}`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold">Edit</button>
                    </Link>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                      title="Delete"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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