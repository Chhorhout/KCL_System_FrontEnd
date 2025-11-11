"use client";

import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  BellIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { BuildingOffice2Icon, ComputerDesktopIcon, Squares2X2Icon, UsersIcon } from '@heroicons/react/24/solid';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Asset {
  id: number;
  name: string;
  categoryId: number;
  status: 'active' | 'maintenance' | 'retired';
  location: string;
  lastUpdated: string;
}

interface Category {
  id: number;
  name: string;
}

interface ChartData {
  assetsByCategory: Array<{
    name: string;
    count: number;
  }>;
  assetsByStatus: Array<{
    status: string;
    count: number;
  }>;
  monthlyAssets: Array<{
    month: string;
    count: number;
  }>;
}

// Calendar Widget Component
function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.getDate());
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isWeekend = (dayIndex: number) => {
    const dayOfWeek = (startingDayOfWeek + dayIndex) % 7;
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const days = [];
  // Empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="w-full">
      {/* Compact Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-all hover:scale-110"
            title="Previous month"
          >
            <ChevronLeftIcon className="h-4 w-4 text-gray-400" />
          </button>
          <h3 className="text-sm font-semibold text-white min-w-[100px] text-center">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-700 rounded-md transition-all hover:scale-110"
            title="Next month"
          >
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-medium rounded-md transition-all shadow-sm hover:shadow-md"
        >
          Today
        </button>
      </div>

      {/* Compact Day Names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1.5">
        {dayNames.map((day, idx) => (
          <div
            key={day + idx}
            className="text-center text-[10px] font-bold text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Compact Calendar Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, index) => {
          const dayIndex = index - startingDayOfWeek;
          const isWeekendDay = day !== null && isWeekend(dayIndex);
          const isSelected = selectedDate === day;
          
          return (
            <button
              key={index}
              onClick={() => day !== null && setSelectedDate(day)}
              className={`
                h-8 flex items-center justify-center text-xs rounded-md transition-all relative
                ${day === null
                  ? 'text-transparent cursor-default'
                  : isToday(day!)
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg scale-105 ring-2 ring-indigo-400/50'
                    : isSelected
                      ? 'bg-indigo-600/80 text-white font-semibold ring-1 ring-indigo-400'
                      : isWeekendDay
                        ? 'text-gray-400 hover:bg-gray-700/50'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:scale-105'
                }
              `}
            >
              {day}
              {day !== null && isToday(day!) && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current Date Display */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 font-medium">Today</p>
            <p className="text-xs font-semibold text-white">
              {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-medium">Selected</p>
            <p className="text-xs font-semibold text-gray-400">
              {selectedDate 
                ? new Date(year, month, selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'None'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [counts, setCounts] = useState({
    supplier: 0,
    ownerType: 0,
    invoice: 0,
    asset: 0,
    category: 0,
    employee: 0,
    location: 0,
    department: 0,
    temporaryUser: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    assetsByCategory: [],
    assetsByStatus: [],
    monthlyAssets: [],
  });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  // Debug: Log counts changes
  useEffect(() => {
    console.log('[Hero] Counts state changed:', counts);
  }, [counts]);

  // Debug: Log loading state changes
  useEffect(() => {
    console.log('[Hero] Loading state changed:', isLoading);
  }, [isLoading]);

  // Helper: fetch list-shaped API responses and support header totals
  async function fetchList(url: string): Promise<{ list: any[]; total: number }> {
    try {
      console.log(`[Hero] Fetching from: ${url}`);
      
      // Add timeout to prevent hanging on unreachable servers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const res = await fetch(url, { 
          headers: { Accept: 'application/json' }, 
          cache: 'no-store',
          mode: 'cors',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log(`[Hero] Response status for ${url}: ${res.status} ${res.statusText}`);
        
        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          console.warn(`[Hero] Failed to fetch ${url}: ${res.status} ${res.statusText}`, errorText);
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        let total = parseInt(res.headers.get('X-Total-Count') || res.headers.get('x-total-count') || '0', 10);
        let data: any;
        try {
          data = await res.json();
          console.log(`[Hero] Parsed JSON from ${url}:`, Array.isArray(data) ? `Array with ${data.length} items` : typeof data);
        } catch (jsonError) {
          const text = await res.text().catch(() => '');
          console.warn(`[Hero] JSON parse failed for ${url}, trying text parse...`);
          try { 
            data = text ? JSON.parse(text) : []; 
            console.log(`[Hero] Text parse successful for ${url}`);
          } catch (parseError) { 
            console.error(`[Hero] Both JSON and text parse failed for ${url}:`, parseError);
            data = []; 
          }
        }
        
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : Array.isArray((data as any)?.data)
              ? (data as any).data
              : Array.isArray((data as any)?.result)
                ? (data as any).result
                : Array.isArray((data as any)?.categories)
                  ? (data as any).categories
                  : Array.isArray((data as any)?.categoryList)
                    ? (data as any).categoryList
                    : Array.isArray((data as any)?.temporaryUsers)
                      ? (data as any).temporaryUsers
                      : Array.isArray((data as any)?.temporaryUserList)
                        ? (data as any).temporaryUserList
                        : [];
        
        if (!total) total = list.length;
        console.log(`[Hero] Final result for ${url}: ${list.length} items, total: ${total}`);
        return { list, total };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout after 8 seconds');
        }
        if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Network error - server may be unreachable');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`[Hero] Error fetching ${url}:`, error?.message || error);
      return { list: [], total: 0 };
    }
  }

  // Resilient location list fetcher to support differing endpoints
  async function fetchLocationList(): Promise<{ list: any[]; total: number }> {
    const candidates = [
      'http://localhost:5092/api/location',
      'http://localhost:5092/api/Locationh',
      'http://localhost:5092/api/Location',
    ];
    let lastErr: any = null;
    for (const url of candidates) {
      try {
        const result = await fetchList(url);
        if (result.list && result.list.length >= 0) {
          console.log(`Successfully fetched locations from ${url}:`, result.total);
          return result;
        }
      } catch (e) {
        lastErr = e;
        console.warn(`Failed to fetch locations from ${url}:`, e);
      }
    }
    console.warn('All location endpoints failed, returning empty result');
    return { list: [], total: 0 };
  }

  useEffect(() => {
    async function fetchData() {
      console.log('[Hero] fetchData started');
      setIsLoading(true);
      try {
        console.log('[Hero] Starting API calls...');
        
        // Helper function to safely fetch with fallback
        const fetchWithFallback = async (primary: string, fallback?: string) => {
          try {
            const result = await fetchList(primary);
            if (result.list && result.list.length > 0) {
              return result;
            }
            if (result.total > 0) {
              return result;
            }
            // If primary returned empty but no error, still try fallback if available
            if (fallback) {
              console.log(`[Hero] Primary ${primary} returned empty, trying fallback ${fallback}`);
            }
          } catch (e) {
            console.warn(`[Hero] Primary endpoint ${primary} failed:`, e);
          }
          
          if (fallback) {
            try {
              console.log(`[Hero] Trying fallback: ${fallback}`);
              return await fetchList(fallback);
            } catch (e2) {
              console.error(`[Hero] Fallback ${fallback} also failed:`, e2);
            }
          }
          
          return { list: [], total: 0 };
        };
        
        const tasks = [
          fetchWithFallback('http://localhost:5092/api/OwnerType', 'http://localhost:5092/api/OwnerTypes'),
          fetchWithFallback('http://localhost:5092/api/Invoice', 'http://localhost:5092/api/Invoices'),
          fetchWithFallback('http://localhost:5092/api/Suppliers', 'http://localhost:5092/api/Supplier'),
          fetchWithFallback('http://localhost:5092/api/assets', 'http://localhost:5092/api/assets'),
          fetchWithFallback('http://localhost:5092/api/Categories', 'http://localhost:5092/api/categories'),
          fetchList('http://localhost:5045/api/Employee').catch((e) => {
            console.error('[Hero] Employee endpoint failed:', e);
            return { list: [], total: 0 };
          }),
          fetchLocationList(),
          fetchList('http://localhost:5045/api/Department').catch((e) => {
            console.error('[Hero] Department endpoint failed:', e);
            return { list: [], total: 0 };
          }),
          fetchList('http://localhost:5092/api/TemporaryUser').catch((e) => {
            console.error('[Hero] TemporaryUser endpoint failed:', e);
            return { list: [], total: 0 };
          }),
        ];
        
        console.log('[Hero] Waiting for all promises...');
        const settled = await Promise.allSettled(tasks);
        console.log('[Hero] All promises settled');
        
        const safe = (idx: number) => {
          const result = settled[idx]?.status === 'fulfilled' 
            ? (settled[idx] as PromiseFulfilledResult<any>).value 
            : { list: [], total: 0 };
          if (settled[idx]?.status === 'rejected') {
            console.error(`[Hero] Task ${idx} was rejected:`, (settled[idx] as PromiseRejectedResult).reason);
          }
          return result;
        };
        
        const ownerTypesRes = safe(0);
        const invoicesRes = safe(1);
        const suppliersRes = safe(2);
        const assetsRes = safe(3);
        const categoriesRes = safe(4);
        const employeesRes = safe(5);
        const locationsRes = safe(6);
        const departmentsRes = safe(7);
        const temporaryUsersRes = safe(8);

        // Debug logging - Enhanced
        console.log('=== [Hero] API Fetch Results ===');
        console.log('Owner Types:', {
          total: ownerTypesRes.total,
          listLength: ownerTypesRes.list?.length,
          sample: ownerTypesRes.list?.[0],
        });
        console.log('Invoices:', {
          total: invoicesRes.total,
          listLength: invoicesRes.list?.length,
          sample: invoicesRes.list?.[0],
        });
        console.log('Suppliers:', {
          total: suppliersRes.total,
          listLength: suppliersRes.list?.length,
          sample: suppliersRes.list?.[0],
        });
        console.log('Assets:', { 
          total: assetsRes.total, 
          listLength: assetsRes.list?.length,
          sample: assetsRes.list?.[0] 
        });
        console.log('Categories:', { 
          total: categoriesRes.total, 
          listLength: categoriesRes.list?.length,
          sample: categoriesRes.list?.[0] 
        });
        console.log('Employees:', { 
          total: employeesRes.total, 
          listLength: employeesRes.list?.length,
          sample: employeesRes.list?.[0] 
        });
        console.log('Locations:', { 
          total: locationsRes.total, 
          listLength: locationsRes.list?.length,
          sample: locationsRes.list?.[0] 
        });
        console.log('Departments:', { 
          total: departmentsRes.total, 
          listLength: departmentsRes.list?.length,
          sample: departmentsRes.list?.[0] 
        });
        console.log('TemporaryUsers:', { 
          total: temporaryUsersRes.total, 
          listLength: temporaryUsersRes.list?.length,
          sample: temporaryUsersRes.list?.[0] 
        });
        console.log('=== End API Fetch Results ===');

        const categoriesData = (categoriesRes.list || []) as Category[];
        const assets = (assetsRes.list || []) as Asset[];

        setCategories(categoriesData);
        // Process data for charts
        const assetsByCategory = categoriesData.map((category: Category) => ({
          name: category.name,
          count: assets.filter((asset: any) => (asset.categoryId ?? asset.categoryID ?? asset.CategoryId) === category.id).length
        }));

        const assetsByStatus = [
          { status: 'Active', count: assets.filter((a: any) => (a.status ?? a.Status ?? '').toString().toLowerCase() === 'active').length },
          { status: 'Maintenance', count: assets.filter((a: any) => (a.status ?? a.Status ?? '').toString().toLowerCase() === 'maintenance').length },
          { status: 'Retired', count: assets.filter((a: any) => (a.status ?? a.Status ?? '').toString().toLowerCase() === 'retired').length }
        ];

        // Get last 6 months of data
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toLocaleString('default', { month: 'short' });
        }).reverse();

        const monthlyAssets = last6Months.map(month => ({
          month,
          count: assets.filter((asset: any) => {
            const raw = asset.lastUpdated ?? asset.updatedAt ?? asset.updateDate ?? asset.createdAt;
            if (!raw) return false;
            const assetDate = new Date(raw);
            return assetDate.toString() !== 'Invalid Date' && assetDate.toLocaleString('default', { month: 'short' }) === month;
          }).length
        }));

        // Get 5 most recent assets (guard dates)
        const sortedAssets = [...assets].sort((a: any, b: any) => {
          const da = new Date(a.lastUpdated ?? a.updatedAt ?? a.createdAt ?? 0).getTime();
          const db = new Date(b.lastUpdated ?? b.updatedAt ?? b.createdAt ?? 0).getTime();
          return db - da;
        }).slice(0, 5);

        setRecentAssets(sortedAssets as any);
        setChartData({
          assetsByCategory,
          assetsByStatus,
          monthlyAssets
        });

        const finalCounts = {
          supplier: suppliersRes.total || (suppliersRes.list?.length ?? 0),
          ownerType: ownerTypesRes.total || (ownerTypesRes.list?.length ?? 0),
          invoice: invoicesRes.total || (invoicesRes.list?.length ?? 0),
          asset: assetsRes.total || (assets?.length ?? 0),
          category: categoriesRes.total || (categoriesData?.length ?? 0),
          employee: employeesRes.total || (employeesRes.list?.length ?? 0),
          location: locationsRes.total || (locationsRes.list?.length ?? 0),
          department: departmentsRes.total || (departmentsRes.list?.length ?? 0),
          temporaryUser: temporaryUsersRes.total || (temporaryUsersRes.list?.length ?? 0),
        };

        console.log('[Hero] Final Dashboard counts:', finalCounts);
        console.log('[Hero] Setting counts state...');
        setCounts(finalCounts);
        console.log('[Hero] Counts state updated');
      } catch (error: any) {
        console.error('[Hero] Error in fetchData:', error?.message || error);
        console.error('[Hero] Full error:', error);
        // Set loading to false even on error so UI doesn't stay in loading state
        setIsLoading(false);
      } finally {
        console.log('[Hero] fetchData completed, setting isLoading to false');
        setIsLoading(false);
      }
    }
    console.log('[Hero] useEffect triggered, calling fetchData');
    fetchData();
  }, []);

  // Chart configurations
  const barChartData = {
    labels: chartData.assetsByCategory.map(item => item.name),
    datasets: [
      {
        label: 'Assets by Category',
        data: chartData.assetsByCategory.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartData = {
    labels: chartData.assetsByStatus.map(item => item.status),
    datasets: [
      {
        data: chartData.assetsByStatus.map(item => item.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(234, 179, 8, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: chartData.monthlyAssets.map(item => item.month),
    datasets: [
      {
        label: 'Assets Added',
        data: chartData.monthlyAssets.map(item => item.count),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const cards = [
    {
      label: 'SUPPLIERS',
      value: counts.supplier,
      link: '/supplier/list',
      linkLabel: 'View all suppliers →',
      icon: UsersIcon,
      border: 'border-violet-400',
      iconBg: 'bg-violet-100 text-violet-500',
    },
  {
    label: 'OWNER TYPES',
    value: counts.ownerType,
    link: '/owner-type/list',
    linkLabel: 'View all owner types →',
    icon: Squares2X2Icon,
    border: 'border-fuchsia-400',
    iconBg: 'bg-fuchsia-100 text-fuchsia-500',
  },
  {
    label: 'INVOICES',
    value: counts.invoice,
    link: '/invoice/list',
    linkLabel: 'View all invoices →',
    icon: BanknotesIcon,
    border: 'border-amber-400',
    iconBg: 'bg-amber-100 text-amber-500',
  },
    {
      label: 'ASSET',
      value: counts.asset,
      link: '/asset/list',
      linkLabel: 'View all assets →',
      icon: ComputerDesktopIcon,
      border: 'border-blue-500',
      iconBg: 'bg-blue-100 text-blue-500',
    },
    {
      label: 'CATEGORIES',
      value: counts.category,
      link: '/category/list',
      linkLabel: 'View all categories →',
      icon: Squares2X2Icon,
      border: 'border-green-400',
      iconBg: 'bg-green-100 text-green-500',
    },
    {
      label: 'EMPLOYEE',
      value: counts.employee,
      link: '/employee/list',
      linkLabel: 'View all employees →',
      icon: UsersIcon,
      border: 'border-pink-400',
      iconBg: 'bg-pink-100 text-pink-500',
    },
    {
      label: 'LOCATION',
      value: counts.location,
      link: '/location/list',
      linkLabel: 'View all locations →',
      icon: Squares2X2Icon,
      border: 'border-indigo-400',
      iconBg: 'bg-indigo-100 text-indigo-500',
    },
    {
      label: 'DEPARTMENT',
      value: counts.department,
      link: '/department/list',
      linkLabel: 'View all departments →',
      icon: BuildingOffice2Icon,
      border: 'border-teal-400',
      iconBg: 'bg-teal-100 text-teal-500',
    },
    {
      label: 'TEMPORARY USER',
      value: counts.temporaryUser,
      link: '/temporary-user/list',
      linkLabel: 'View all temporary users →',
      icon: UsersIcon,
      border: 'border-orange-400',
      iconBg: 'bg-orange-100 text-orange-500',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      }
    }
  };

  const numberVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      }
    }
  };

  const LoadingSkeleton = () => (
    <div className="flex-1 min-w-[260px] max-w-xs bg-gray-800 rounded-xl shadow-md p-6 border-t-4 border-gray-700">
      <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse mb-4" />
      <div className="h-4 w-20 bg-gray-700 rounded animate-pulse mb-2" />
      <div className="h-8 w-16 bg-gray-700 rounded animate-pulse mb-4" />
      <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
    </div>
  );

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-3.5rem)] px-4 py-6 w-full bg-gray-900"
    >
      {/* Header Section with Filters and Refresh */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-gray-400">Real-time overview of your asset management system</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={async () => {
                setIsLoading(true);
                setLastUpdate(new Date());
                // Reload data without full page refresh
                try {
                  const refreshTasks = [
                    fetchList('http://localhost:5119/api/assets').catch(() => fetchList('http://localhost:5092/api/assets')).catch(() => ({ list: [], total: 0 })),
                    fetchList('http://localhost:5092/api/Categories').catch(() => fetchList('http://localhost:5092/api/categories')).catch(() => ({ list: [], total: 0 })),
                    fetchList('http://localhost:5045/api/Employee').catch(() => ({ list: [], total: 0 })),
                    fetchLocationList(),
                    fetchList('http://localhost:5045/api/Department').catch(() => ({ list: [], total: 0 })),
                    fetchList('http://localhost:5092/api/TemporaryUser').catch(() => ({ list: [], total: 0 })),
                  ];
                  await Promise.allSettled(refreshTasks);
                  window.location.reload();
                } catch {
                  window.location.reload();
                }
              }}
              className="p-2 bg-gray-800 rounded-lg shadow-sm border border-gray-700 hover:bg-gray-700 transition-colors"
              title="Refresh Data"
            >
              <ArrowPathIcon className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {maintenanceAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg shadow-md p-4 flex items-center gap-3 border border-yellow-500/50"
          >
            <BellIcon className="h-6 w-6 text-white flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {maintenanceAlerts.length} Maintenance Alert{maintenanceAlerts.length > 1 ? 's' : ''} Pending
              </p>
              <p className="text-xs text-white/90">Action required for scheduled maintenance</p>
            </div>
            <Link
              href="/maintenance-record/list"
              className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors border border-white/30"
            >
              View Alerts
            </Link>
          </motion.div>
        )}
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="flex flex-wrap gap-3 mb-3"
      >
        {isLoading ? (
          Array(8).fill(0).map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : (
          cards.map((card) => (
            <motion.div
              key={card.label}
              variants={cardVariants}
              whileHover="hover"
              className={`flex-1 min-w-[200px] max-w-xs bg-gray-800 rounded-xl shadow-md p-3 border-t-4 ${card.border} hover:shadow-lg transition-shadow duration-300`}
            >
              <motion.div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${card.iconBg}`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <card.icon className="w-5 h-5" />
              </motion.div>
              <div className="text-xs font-semibold text-gray-400 mb-1">{card.label}</div>
              <motion.div 
                variants={numberVariants}
                className="text-xl font-bold text-white mb-1"
              >
                {card.value}
              </motion.div>
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href={card.link} className="text-sm text-blue-400 hover:text-blue-300 hover:underline font-medium transition-transform">
                  {card.linkLabel}
                </Link>
              </motion.div>
            </motion.div>
          ))
        )}
      </motion.div>


      {/* Charts Section */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Assets by Status - Doughnut Chart */}
          {chartData.assetsByStatus.some(s => s.count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-400" />
                  Assets by Status
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={doughnutChartData} options={chartOptions} />
              </div>
              <div className="mt-4 space-y-2">
                {chartData.assetsByStatus.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ 
                          backgroundColor: ['rgb(34, 197, 94)', 'rgb(234, 179, 8)', 'rgb(239, 68, 68)'][idx] 
                        }}
                      />
                      <span className="text-gray-300">{status.status}</span>
                    </div>
                    <span className="font-semibold text-white">{status.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Assets by Category - Bar Chart */}
          {chartData.assetsByCategory.some(c => c.count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-indigo-400" />
                  Assets by Category
                </h2>
              </div>
              <div className="h-64">
                <Bar data={barChartData} options={{ ...chartOptions, indexAxis: 'y' as const }} />
              </div>
            </motion.div>
          )}

          {/* Monthly Assets Trend - Line Chart */}
          {chartData.monthlyAssets.some(m => m.count > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
                  Monthly Growth
                </h2>
              </div>
              <div className="h-64">
                <Line data={lineChartData} options={chartOptions} />
              </div>
              <div className="mt-4 p-3 bg-green-900/30 rounded-lg border border-green-700/50">
                <p className="text-xs text-green-300 font-medium">
                  <ArrowTrendingUpIcon className="h-4 w-4 inline mr-1" />
                  {(chartData.monthlyAssets[chartData.monthlyAssets.length - 1]?.count || 0) > (chartData.monthlyAssets[chartData.monthlyAssets.length - 2]?.count || 0)
                    ? 'Growth trend detected'
                    : 'Stable growth'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recent Assets and Quick Actions */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Recent Assets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Recent Assets
              </h2>
              <Link href="/asset/list" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentAssets.length > 0 ? (
                recentAssets.map((asset, index) => (
                  <div
                    key={asset.id || index}
                    className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{asset.name || 'Unnamed Asset'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {asset.location || 'No location'} • {asset.status || 'Unknown'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (asset.status || '').toLowerCase() === 'active'
                        ? 'bg-green-900/50 text-green-300 border border-green-700'
                        : (asset.status || '').toLowerCase() === 'maintenance'
                        ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {asset.status || 'N/A'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No recent assets found</p>
              )}
            </div>
          </motion.div>

          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700"
          >
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <CalendarIcon className="h-5 w-5 text-indigo-400" />
              Calendar
            </h2>
            <CalendarWidget />
          </motion.div>
        </div>
      )}

      {/* Summary Statistics */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 mb-4"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <ChartBarIcon className="h-5 w-5 text-blue-400" />
            System Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Total Assets</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts.asset}</p>
            </div>
            <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <UsersIcon className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Employees</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts.employee}</p>
            </div>
            {counts.temporaryUser > 0 && (
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon className="h-5 w-5 text-orange-400" />
                  <span className="text-sm font-medium text-gray-300">Temp Users</span>
                </div>
                <p className="text-2xl font-bold text-white">{counts.temporaryUser}</p>
              </div>
            )}
            <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <BuildingOffice2Icon className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Locations</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts.location}</p>
            </div>
            <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Squares2X2Icon className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-medium text-gray-300">Categories</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts.category}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex-1" />
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center text-xs text-gray-500"
      >
        Welcome to KCL System 2025
      </motion.footer>
    </motion.div>
  );
} 