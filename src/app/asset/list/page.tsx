"use client";
import { FolderIcon, TagIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';

interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  owner: string;
  status?: string;
  createdAt: string;
  haveWarranty?: boolean;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  active?: boolean;
  categoryName?: string;
  supplierName?: string;
  location?: string;
  imageUrl?: string;
}

function formatShortDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US"); // Change locale as needed
}

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch assets with server-side pagination and search
  const fetchAssets = (pageNum = 1) => {
    setLoading(true);
    const url = new URL('http://localhost:5119/api/assets');
    url.searchParams.append("page", pageNum.toString());
    // Removed searchTerm and searchBy from the URL
    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch assets");
        const totalPagesHeader = res.headers.get('X-Total-Pages');
        const currentPageHeader = res.headers.get('X-Current-Page');
        const pageSizeHeader = res.headers.get('X-Page-Size');
        const totalCountHeader = res.headers.get('X-Total-Count');
        setTotalPages(totalPagesHeader ? parseInt(totalPagesHeader) : 1);
        setPage(currentPageHeader ? parseInt(currentPageHeader) : pageNum);
        setPageSize(pageSizeHeader ? parseInt(pageSizeHeader) : 4);
        setTotalCount(totalCountHeader ? parseInt(totalCountHeader) : 0);
        const data = await res.json();
        setAssets(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssets(page);
    // eslint-disable-next-line
  }, [page]);

  // Check for expiring warranties
  useEffect(() => {
    const checkExpiringWarranties = () => {
      assets.forEach(asset => {
        if (asset.haveWarranty && asset.warrantyEndDate) {
          const daysLeft = Math.ceil((new Date(asset.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 1 && daysLeft > 0) {
            Swal.fire({
              title: 'Warranty Expiring Soon!',
              text: `The warranty for asset "${asset.name}" (SN: ${asset.serialNumber}) will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}!`,
              icon: 'warning',
              confirmButtonColor: '#3085d6',
            });
          }
        }
      });
    };

    if (!loading && assets.length > 0) {
      checkExpiringWarranties();
    }
  }, [assets, loading]);

  // Client-side filtering
  const filteredAssets = assets.filter(asset => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    switch (searchBy) {
      case "name":
        return asset.name?.toLowerCase().includes(term);
      case "serialnumber":
        return asset.serialNumber?.toLowerCase().includes(term);
      case "owner":
        return asset.owner?.toLowerCase().includes(term);
      case "status":
        return (asset.status ? asset.status.toLowerCase() : "").includes(term);
      case "havewarranty":
        return (asset.haveWarranty ? "yes" : "no").includes(term);
      case "warrantystart":
        return (asset.warrantyStartDate || "").toLowerCase().includes(term);
      case "warrantyend":
        return (asset.warrantyEndDate || "").toLowerCase().includes(term);
      case "active":
        return (asset.active ? "active" : "inactive").includes(term);
      default:
        // Search all fields
        return (
          asset.name?.toLowerCase().includes(term) ||
          asset.serialNumber?.toLowerCase().includes(term) ||
          asset.owner?.toLowerCase().includes(term) ||
          (asset.status ? asset.status.toLowerCase() : "").includes(term) ||
          (asset.haveWarranty ? "yes" : "no").includes(term) ||
          (asset.warrantyStartDate || "").toLowerCase().includes(term) ||
          (asset.warrantyEndDate || "").toLowerCase().includes(term) ||
          (asset.active ? "active" : "inactive").includes(term)
        );
    }
  });

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
        const res = await fetch(`http://localhost:5119/api/Assets/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete asset");
        Swal.fire("Deleted!", "The asset has been deleted.", "success");
        fetchAssets(page);
      } catch (err: any) {
        Swal.fire("Error", err.message || "Failed to delete asset", "error");
      }
    }
  };

  return (
    <div className="p-2 sm:p-8 flex justify-center items-start min-h-[80vh] bg-[#f7f9fb]">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-4 sm:p-6">
        {/* Top controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <FolderIcon className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-semibold text-blue-900">Asset List</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search assets"
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
              <option value="serialnumber">Serial Number</option>
              <option value="owner">Owner</option>
              <option value="havewarranty">Has Warranty</option>
              <option value="warrantystart">Warranty Start</option>
              <option value="warrantyend">Warranty End</option>
              <option value="active">Active</option>
            </select>
            <Link href="/asset/add">
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition w-full sm:w-auto">
                + Add New Asset
              </button>
            </Link>
          </div>
        </div>
        {/* Asset grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full text-center py-10">Loading...</div>
          ) : error ? (
            <div className="col-span-full text-center text-red-600 py-10">{error}</div>
          ) : filteredAssets.length === 0 ? (
            <div className="col-span-full text-center text-gray-400 py-10">No assets found.</div>
          ) : (
            filteredAssets.map((asset, idx) => (
              <motion.div
                key={asset.id}
                className="bg-white rounded-2xl shadow flex flex-row items-center gap-8 border hover:shadow-xl transition p-8 flex-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 100, damping: 20 }}
                style={{ minHeight: 180, maxWidth: 900, width: "100%" }}
              >
                {/* Image */}
                <div className="flex-shrink-0 flex items-center justify-center h-36 w-36 bg-gray-100 rounded-xl border border-gray-200">
                  {asset.imageUrl ? (
                    <img src={asset.imageUrl} alt={asset.name} className="h-32 w-32 object-contain" />
                  ) : (
                    <TagIcon className="h-20 w-20 text-blue-400" />
                  )}
                </div>
                {/* Details */}
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="font-bold text-2xl text-blue-900 truncate">{asset.name}</div>
                  <div className="text-base text-gray-700 truncate">SN: {asset.serialNumber}</div>
                  <div className="text-base text-gray-500 truncate">
                    {asset.categoryName || "Unknown Category"}
                    {asset.supplierName ? <span className="mx-1">· {asset.supplierName}</span> : null}
                  </div>
                  {/* Location */}
                  <div className="text-base text-gray-600 truncate">
                    {asset.location ? `Location: ${asset.location}` : "Location: -"}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-base font-semibold
                      ${asset.active === true ? "bg-green-100 text-green-800" :
                        asset.active === false ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"}`}>
                      <span className="h-3 w-3 rounded-full mr-1" style={{ backgroundColor: asset.active === true ? '#22c55e' : asset.active === false ? '#ef4444' : '#9ca3af' }}></span>
                      {asset.active === true ? "Active" : asset.active === false ? "Inactive" : "Unknown"}
                    </span>
                    {/* Warranty */}
                    {asset.haveWarranty && asset.warrantyEndDate ? (
                      (() => {
                        const daysLeft = Math.ceil((new Date(asset.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 0 ? (
                          <span className={`font-semibold text-base ${daysLeft <= 1 ? 'text-red-600' : 'text-green-600'}`}>
                            {daysLeft} day{daysLeft === 1 ? '' : 's'} left in warranty
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold text-base">Expired on {formatShortDate(asset.warrantyEndDate)}</span>
                        );
                      })()
                    ) : (
                      <span className="text-gray-500 font-semibold text-base">No Warranty</span>
                    )}
                  </div>
                  {/* Actions at the bottom */}
                  <div className="flex justify-center gap-6 mt-8 w-full">
                    <Link href={`/asset/update/${asset.id}`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-base font-semibold w-28">Edit</button>
                    </Link>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded text-base font-semibold w-28"
                      title="Delete"
                      onClick={() => handleDelete(asset.id)}
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
      </div>
    </div>
  );
} 