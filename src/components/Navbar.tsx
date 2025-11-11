'use client';

import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Advanced Navbar component for the KCL AMS application.
 * Features:
 * - Modern gradient design with glassmorphism effects
 * - Interactive dropdown menus for user profile and notifications
 * - Search functionality
 * - Smooth animations and transitions
 * - Responsive and accessible
 */
// Navigation items for search functionality
const navigationItems = [
  { name: 'Dashboard', href: '/', keywords: ['dashboard', 'home', 'main'] },
  { name: 'Category List', href: '/category/list', keywords: ['category', 'categories'] },
  { name: 'Asset List', href: '/asset/list', keywords: ['asset', 'assets'] },
  { name: 'Asset Type List', href: '/asset-type/list', keywords: ['asset type', 'type'] },
  { name: 'Asset Status List', href: '/asset-status/list', keywords: ['asset status', 'status'] },
  { name: 'Asset Ownership List', href: '/asset-ownership/list', keywords: ['asset ownership', 'ownership'] },
  { name: 'Asset Status History List', href: '/asset-status-history/list', keywords: ['asset status history', 'history'] },
  { name: 'Location List', href: '/location/list', keywords: ['location', 'locations'] },
  { name: 'Supplier List', href: '/supplier/list', keywords: ['supplier', 'suppliers'] },
  { name: 'Invoice List', href: '/invoice/list', keywords: ['invoice', 'invoices'] },
  { name: 'Owner List', href: '/owner/list', keywords: ['owner', 'owners'] },
  { name: 'Owner Type List', href: '/owner-type/list', keywords: ['owner type'] },
  { name: 'Maintainer List', href: '/maintainer/list', keywords: ['maintainer', 'maintainers'] },
  { name: 'Maintainer Type List', href: '/maintainer-type/list', keywords: ['maintainer type'] },
  { name: 'Maintenance Part List', href: '/maintenance-part/list', keywords: ['maintenance part', 'part'] },
  { name: 'Maintenance Record List', href: '/maintenance-record/list', keywords: ['maintenance record', 'record'] },
  { name: 'Temporary User List', href: '/temporary-user/list', keywords: ['temporary user', 'temp user'] },
  { name: 'Temporary Used Request List', href: '/temporary-used-request/list', keywords: ['temporary request', 'temp request'] },
  { name: 'Temporary Used Record List', href: '/temporary-used-record/list', keywords: ['temporary record', 'temp record'] },
  { name: 'Users List', href: '/users/list', keywords: ['user', 'users'] },
  { name: 'Employee List', href: '/employee/list', keywords: ['employee', 'employees', 'staff'] },
  { name: 'Department List', href: '/department/list', keywords: ['department', 'departments'] },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof navigationItems>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Example user data (replace with real data or props/context as needed)
  const user = {
    initials: 'JD',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Administrator',
  };

  // Example notifications
  const notifications = [
    { id: 1, message: 'New asset added', time: '5 min ago', unread: true },
    { id: 2, message: 'Maintenance scheduled', time: '1 hour ago', unread: true },
    { id: 3, message: 'System update available', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Search functionality - filter navigation items based on query
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return navigationItems.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const keywordMatch = item.keywords.some(keyword => keyword.toLowerCase().includes(query));
      return nameMatch || keywordMatch;
    }).slice(0, 8); // Limit to 8 results
  }, [searchQuery]);

  // Update search results when query changes
  useEffect(() => {
    setSearchResults(filteredSearchResults);
    if (searchQuery.trim() && filteredSearchResults.length > 0) {
      setSearchOpen(true);
    }
  }, [searchQuery, filteredSearchResults]);

  // Handle search navigation
  const handleSearchSelect = (href: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    router.push(href);
  };

  // Handle search with Enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredSearchResults.length > 0) {
      handleSearchSelect(filteredSearchResults[0].href);
    }
    if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      const searchElement = searchRef.current || searchResultsRef.current;
      if (searchElement && !searchElement.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <nav
      className="h-14 bg-gradient-to-r from-gray-800 via-gray-850 to-gray-900 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-30 shadow-lg"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side: App Title with gradient */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-30"></div>
            <h1 className="relative text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-wide">
              KCL
            </h1>
          </div>
        </div>

        {/* Center: Search Bar with Results */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 relative" ref={searchRef}>
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search Here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchQuery.trim() && filteredSearchResults.length > 0) {
                  setSearchOpen(true);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white z-10"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            
            {/* Search Results Dropdown */}
            <AnimatePresence>
              {searchOpen && searchQuery.trim() && filteredSearchResults.length > 0 && (
                <motion.div
                  ref={searchResultsRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-2">
                    {filteredSearchResults.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleSearchSelect(item.href)}
                        className={`w-full px-4 py-2.5 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                          pathname === item.href
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                        }`}
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {pathname === item.href && (
                          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {searchOpen && searchQuery.trim() && filteredSearchResults.length === 0 && (
                <motion.div
                  ref={searchResultsRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 text-center z-50"
                >
                  <p className="text-sm text-gray-400">No results found</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Actions & User Info */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserMenuOpen(false);
              }}
              className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="View notifications"
              type="button"
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full border-2 border-gray-800 shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-red-500 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors ${
                            notification.unread ? 'bg-gray-700/20' : ''
                          }`}
                        >
                          <p className="text-sm text-white font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-700">
                    <button className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium text-center">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="User menu"
              type="button"
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-xs font-bold text-white">{user.initials}</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-white">{user.name}</p>
                <p className="text-[10px] text-gray-400">{user.role}</p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-700">
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                    <p className="text-xs text-blue-400 mt-1">{user.role}</p>
                  </div>
                  <div className="py-2">
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors flex items-center gap-3"
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      <span>Preferences</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-700 py-2">
                    <button
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-3"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Dropdown */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-700 bg-gray-800/95 backdrop-blur-sm"
            ref={searchRef}
          >
            <div className="p-3">
              <div className="relative" ref={searchResultsRef}>
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <input
                  type="text"
                  placeholder="Search Here"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white z-10"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
                
                {/* Mobile Search Results */}
                {searchQuery.trim() && filteredSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700/95 border border-gray-600 rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto z-50">
                    {filteredSearchResults.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleSearchSelect(item.href)}
                        className={`w-full px-4 py-3 text-left text-sm rounded-lg transition-colors flex items-center gap-3 ${
                          pathname === item.href
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                        }`}
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.trim() && filteredSearchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-700/95 border border-gray-600 rounded-lg shadow-xl p-4 text-center z-50">
                    <p className="text-sm text-gray-400">No results found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}