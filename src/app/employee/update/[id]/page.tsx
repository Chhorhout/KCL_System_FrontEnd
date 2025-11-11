"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from 'sweetalert2';

// API constants
const API_BASE = 'http://localhost:5045';
const EMPLOYEE_ENDPOINT = `${API_BASE}/api/Employee`;
const DEPARTMENT_ENDPOINT = `${API_BASE}/api/Department`;

// Helpers
async function safeParseJson(res: Response): Promise<any> {
  try { return await res.json(); } catch { return null; }
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

export default function UpdateEmployee() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const activeController = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  
  // Department dropdown state
  const [departments, setDepartments] = useState<Array<{ id: string | number; name: string }>>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Validation
  const isValid = useMemo(() => {
    return (
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.trim().includes('@') &&
      phoneNumber.trim().length >= 8 &&
      dateOfBirth.trim() !== '' &&
      hireDate.trim() !== '' &&
      departmentId.trim() !== ''
    );
  }, [firstName, lastName, email, phoneNumber, dateOfBirth, hireDate, departmentId]);

  // Fetch existing employee data
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setFetchLoading(true);
    setError(null);

    fetchWithTimeout(
      `${EMPLOYEE_ENDPOINT}/${id}`,
      { headers: { Accept: 'application/json' } },
      10000,
      controller.signal
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to fetch employee (${res.status})`);
        const data = await safeParseJson(res);
        if (data) {
          setFirstName(data.firstName || data.FirstName || '');
          setLastName(data.lastName || data.LastName || '');
          setEmail(data.email || data.Email || '');
          setPhoneNumber(data.phoneNumber || data.PhoneNumber || '');
          setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '');
          setHireDate(data.hireDate ? new Date(data.hireDate).toISOString().split('T')[0] : '');
          setDepartmentId(data.departmentId || data.DepartmentId || '');
          const imgUrl = data.imageUrl || data.ImageUrl || '';
          setImageUrl(imgUrl);
          if (imgUrl) setImagePreview(imgUrl);
        }
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Failed to fetch employee');
        Swal.fire('Error', err?.message || 'Failed to load employee data', 'error');
      })
      .finally(() => {
        setFetchLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  // Fetch departments on mount
  useEffect(() => {
    const controller = new AbortController();
    setLoadingDepartments(true);
    
    fetchWithTimeout(
      DEPARTMENT_ENDPOINT,
      { headers: { Accept: 'application/json' } },
      10000,
      controller.signal
    )
      .then(async (res) => {
        if (!res.ok) return;
        const data = await safeParseJson(res);
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.data) ? data.data
          : Array.isArray(data?.result) ? data.result
          : [];
        
        const normalized = items.map((item: any) => ({
          id: String(item.id || item.ID || item.departmentId || item.DepartmentId || ''),
          name: String(item.name || item.Name || item.departmentName || item.DepartmentName || 'Unknown'),
        })).filter((d: any) => d.id && d.name !== 'Unknown');
        
        setDepartments(normalized);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!isValid) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    try {
      if (activeController.current) activeController.current.abort();
      const controller = new AbortController();
      activeController.current = controller;

      const payload = {
        id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        hireDate: new Date(hireDate).toISOString(),
        departmentId: departmentId.trim(),
        ...(imageUrl.trim() && { imageUrl: imageUrl.trim() }),
      };

      const res = await fetchWithTimeout(
        `${EMPLOYEE_ENDPOINT}/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: 'application/json' },
          body: JSON.stringify(payload),
        },
        10000,
        controller.signal
      );

      if (!res.ok) {
        const data = await safeParseJson(res);
        const message = (data?.message || data?.error || data?.title) ?? `Failed to update employee (HTTP ${res.status})`;
        throw new Error(String(message));
      }

      Swal.fire('Success', 'Employee updated successfully.', 'success');
      setSuccess(true);
      setTimeout(() => router.push("/employee/list"), 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to update employee");
      Swal.fire('Error', err?.message || 'Failed to update employee', 'error');
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

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5119/api/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      const uploadedUrl = data.fileUrl || data.url || data.imageUrl;
      setImageUrl(uploadedUrl);
      setImagePreview(uploadedUrl);
      setUseUrlInput(false);
    } catch (err) {
      setError("Image upload failed. Please try again or use a URL instead.");
      setUploadingImage(false);
      return;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageUrl("");
    setUseUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setError(null);
    setSuccess(false);
    // Reload original data
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex justify-center items-start bg-[#f7f9fb] p-3 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-2xl bg-white rounded-xl shadow-lg"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-blue-500 rounded-t-xl px-6 py-4">
          <h2 className="text-2xl font-bold text-white mb-2 sm:mb-0">Update Employee</h2>
        </div>

        {/* Form */}
        {fetchLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading employee data...</p>
          </div>
        ) : (
          <motion.form
            ref={formRef}
            onSubmit={handleSubmit}
            className="p-5 sm:p-8 space-y-5"
            autoComplete="off"
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  maxLength={50}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  maxLength={50}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="phoneNumber">
                  Phone Number *
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="dateOfBirth">
                  Date of Birth *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="hireDate">
                  Hire Date *
                </label>
                <input
                  id="hireDate"
                  type="date"
                  value={hireDate}
                  onChange={e => setHireDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="departmentId">
                  Department *
                </label>
                <select
                  id="departmentId"
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100 bg-white"
                  required
                  disabled={loadingDepartments}
                >
                  <option value="">
                    {loadingDepartments ? 'Loading departments...' : 'Select a department'}
                  </option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-blue-900 mb-2" htmlFor="imageUpload">
                  Profile Photo (Optional)
                </label>
                
                {/* Toggle between upload and URL */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseUrlInput(false);
                      if (!imagePreview) fileInputRef.current?.click();
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      !useUrlInput
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseUrlInput(true);
                      setImage(null);
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition ${
                      useUrlInput
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Use URL
                  </button>
                </div>

                {useUrlInput ? (
                  <div>
                    <input
                      id="imageUrl"
                      type="url"
                      placeholder="Enter image URL"
                      value={imageUrl}
                      onChange={e => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value || null);
                      }}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 text-blue-900 disabled:bg-gray-100"
                    />
                    {imageUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img 
                          src={imageUrl} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded border"
                          onError={() => setImagePreview(null)}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-xs text-red-600 hover:text-red-700 underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
                      uploadingImage 
                        ? 'border-blue-400 bg-blue-50' 
                        : imagePreview 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span className="text-sm text-blue-600 font-medium">Uploading...</span>
                      </div>
                    ) : imagePreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-24 w-24 object-cover rounded-full border-2 border-white shadow-md" 
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage();
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-700">Click to change image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                )}
                
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Error/Success */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-red-700 mt-3 text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-green-700 mt-3 text-sm"
              >
                Employee updated successfully!
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex justify-center gap-3 mt-8">
              <Link href="/employee/list">
                <button
                  type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-7 py-2 rounded transition"
                  disabled={loading}
                >
                  Cancel
                </button>
              </Link>
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-7 py-2 rounded transition"
                disabled={loading}
              >
                Reset
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-7 py-2 rounded transition flex items-center gap-2"
                disabled={loading || !isValid}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Employee'
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Back to list below the box */}
        <div className="w-full max-w-2xl mx-auto mt-4 text-center pb-4">
          <Link href="/employee/list">
            <button className="bg-white text-blue-700 font-semibold px-6 py-2 rounded shadow hover:bg-blue-50 transition text-base border border-blue-200">
              ← Back to Employee List
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

