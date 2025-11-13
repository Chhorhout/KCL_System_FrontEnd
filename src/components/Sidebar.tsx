'use client';

import {
  BuildingOffice2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CogIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  FlagIcon,
  FolderIcon,
  HashtagIcon,
  HomeIcon,
  LinkIcon,
  MapPinIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  TagIcon,
  UserCircleIcon,
  UsersIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Sidebar section type definition
type SidebarSection = {
  name: string;
  href?: string;
  icon?: typeof HomeIcon;
  type?: 'header';
};

// Sidebar menu configuration
const sidebarSections: SidebarSection[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'AMS', type: 'header' },
  // Category
  { name: 'Category List', href: '/category/list', icon: Squares2X2Icon },
  // Asset
  { name: 'Asset List', href: '/asset/list', icon: FolderIcon },
  // Asset Type
  { name: 'Asset Type List', href: '/asset-type/list', icon: TagIcon },
  // Asset Status
  { name: 'Asset Status List', href: '/asset-status/list', icon: FlagIcon },
  // Asset Ownership
  { name: 'Asset Ownership List', href: '/asset-ownership/list', icon: LinkIcon },
  // Asset Status History
  { name: 'Asset Status History List', href: '/asset-status-history/list', icon: ClockIcon },
  // Location
  { name: 'Location List', href: '/location/list', icon: MapPinIcon },
  // Supplier
  { name: 'Supplier List', href: '/supplier/list', icon: ShoppingBagIcon },
  // Invoice
  { name: 'Invoice List', href: '/invoice/list', icon: DocumentTextIcon },
  // Owner
  { name: 'Owner List', href: '/owner/list', icon: UserCircleIcon },
  // Owner Type
  { name: 'Owner Type List', href: '/owner-type/list', icon: HashtagIcon },
  // Maintainer
  { name: 'Maintainer List', href: '/maintainer/list', icon: WrenchScrewdriverIcon },
  // Maintainer Type
  { name: 'Maintainer Type List', href: '/maintainer-type/list', icon: TagIcon },
  // Maintenance Part
  { name: 'Maintenance Part List', href: '/maintenance-part/list', icon: CogIcon },
  // Maintenance Record
  { name: 'Maintenance Record List', href: '/maintenance-record/list', icon: ClipboardDocumentListIcon },
  // Temporary User
  { name: 'Temporary User List', href: '/temporary-user/list', icon: UsersIcon },
  // Temporary Used Request
  { name: 'Temporary Used Request List', href: '/temporary-used-request/list', icon: DocumentArrowUpIcon },
  // Temporary Used Record
  { name: 'Temporary Used Record List', href: '/temporary-used-record/list', icon: ClockIcon },
  { name: 'IDP', type: 'header' },
  { name: 'Users List', href: '/users/list', icon: UsersIcon },
  { name: 'HRMS', type: 'header' },
  // Employee
  { name: 'Employee List', href: '/employee/list', icon: UsersIcon },
  // Department
  { name: 'Department List', href: '/department/list', icon: BuildingOffice2Icon },
];

/**
 * Sidebar component for navigation.
 * - Collapsible for compact view.
 * - Highlights the active route.
 * - Section headers for organization.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // Create state for AMS dropdown toggle - default to false (collapsed, user can expand)
  const [amsOpen, setAmsOpen] = useState(false);
  // Create state for IDP dropdown toggle - default to false (collapsed, user can expand)
  const [idpOpen, setIdpOpen] = useState(false);
  // Create state for HRMS dropdown toggle - default to false (collapsed, user can expand)
  const [hrmsOpen, setHrmsOpen] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  // Persist collapsed state and support Ctrl/Cmd+B hotkey
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebar-collapsed');
      if (raw != null) setCollapsed(raw === '1');
    } catch {}
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed(prev => {
          const next = !prev;
          try { localStorage.setItem('sidebar-collapsed', next ? '1' : '0'); } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Reflect current sidebar width to a CSS variable for layout padding sync
  useEffect(() => {
    const widthPx = collapsed ? (hoverExpanded ? 260 : 56) : 260;
    try { document.documentElement.style.setProperty('--sidebar-width', `${widthPx}px`); } catch {}
  }, [collapsed, hoverExpanded]);

  return (
    <motion.aside
      onMouseEnter={() => setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
      animate={{ width: collapsed ? (hoverExpanded ? 260 : 56) : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed top-0 left-0 h-screen flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-lg z-40 overflow-hidden"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Sidebar header/logo */}
      <div className="flex h-auto min-h-[80px] items-center justify-center border-b border-slate-700/50 px-3 py-4">
        <Link href="/" className="flex items-center gap-3 w-full justify-center flex-col">
          <div className="relative flex-shrink-0">
            <Image
              src="/KCL-Logo_no_bg.png"
              alt="KCL Logo"
              width={collapsed && !hoverExpanded ? 48 : 60}
              height={collapsed && !hoverExpanded ? 48 : 60}
              className="object-contain"
              priority
            />
          </div>
          {!(collapsed && !hoverExpanded) && (
            <div className="flex flex-col items-center justify-center min-w-0 w-full">
              <h1 className="text-base font-bold tracking-wide text-center whitespace-normal break-words text-white leading-tight">
                KCL ASSET MANAGEMENT
              </h1>
              <span className="text-sm text-slate-400 mt-0.5">System</span>
            </div>
          )}
        </Link>
      </div>

      {/* User Welcome Section */}
      {!(collapsed && !hoverExpanded) && (
        <div className="px-4 py-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                <UserCircleIcon className="h-8 w-8" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">Welcome!</p>
              <p className="text-xs text-slate-300 truncate">Admin</p>
            </div>
          </div>
        </div>
      )}
      
      {collapsed && !hoverExpanded && (
        <div className="px-2 py-4 border-b border-slate-700/50 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
            <UserCircleIcon className="h-6 w-6" />
          </div>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {sidebarSections.map((section, index) => {
          // Determine if this item is part of AMS section
          let isInAMSSection = false;
          let foundAMS = false;
          for (let i = 0; i <= index; i++) {
            if (sidebarSections[i].name === 'AMS') {
              foundAMS = true;
            }
            if (foundAMS) {
              if (sidebarSections[i].type === 'header' && sidebarSections[i].name !== 'AMS') {
                break;
              }
              if (i === index && section.type !== 'header') {
                isInAMSSection = true;
              }
            }
          }

          // Determine if this item is part of IDP section
          let isInIDPSection = false;
          let foundIDP = false;
          for (let i = 0; i <= index; i++) {
            if (sidebarSections[i].name === 'IDP') {
              foundIDP = true;
            }
            if (foundIDP) {
              if (sidebarSections[i].type === 'header' && sidebarSections[i].name !== 'IDP') {
                break;
              }
              if (i === index && section.type !== 'header') {
                isInIDPSection = true;
              }
            }
          }

          // Determine if this item is part of HRMS section
          let isInHRMSSection = false;
          let foundHRMS = false;
          for (let i = 0; i <= index; i++) {
            if (sidebarSections[i].name === 'HRMS') {
              foundHRMS = true;
            }
            if (foundHRMS) {
              if (sidebarSections[i].type === 'header' && sidebarSections[i].name !== 'HRMS') {
                break;
              }
              if (i === index && section.type !== 'header') {
                isInHRMSSection = true;
              }
            }
          }

          return (
            <div key={section.name} className="relative">
              {section.type === 'header' && section.name === 'AMS' ? (
                // AMS header with toggle
                <div 
                  onClick={() => setAmsOpen(!amsOpen)} 
                  className="mt-3 text-xs font-semibold text-slate-400 px-3 pt-3 border-t border-slate-700/50 cursor-pointer hover:text-slate-200 flex items-center justify-between min-w-0"
                >
                  <span className="whitespace-normal leading-tight min-w-0 flex-1">{section.name}</span>
                  {!(collapsed && !hoverExpanded) && (
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ml-2 ${amsOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              ) : section.type === 'header' && section.name === 'IDP' ? (
                // IDP header with toggle
                <div 
                  onClick={() => setIdpOpen(!idpOpen)} 
                  className="mt-3 text-xs font-semibold text-slate-400 px-3 pt-3 border-t border-slate-700/50 cursor-pointer hover:text-slate-200 flex items-center justify-between min-w-0"
                >
                  <span className="whitespace-normal leading-tight min-w-0 flex-1">{section.name}</span>
                  {!(collapsed && !hoverExpanded) && (
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ml-2 ${idpOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              ) : section.type === 'header' && section.name === 'HRMS' ? (
                // HRMS header with toggle
                <div 
                  onClick={() => setHrmsOpen(!hrmsOpen)} 
                  className="mt-3 text-xs font-semibold text-slate-400 px-3 pt-3 border-t border-slate-700/50 cursor-pointer hover:text-slate-200 flex items-center justify-between min-w-0"
                >
                  <span className="whitespace-normal leading-tight min-w-0 flex-1">{section.name}</span>
                  {!(collapsed && !hoverExpanded) && (
                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform flex-shrink-0 ml-2 ${hrmsOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              ) : section.type === 'header' ? (
                // Other section headers
                <div className="mt-3 text-xs font-semibold text-slate-400 px-3 pt-3 border-t border-slate-700/50">
                  {section.name}
                </div>
              ) : section.href && section.icon && (!isInAMSSection || amsOpen) && (!isInIDPSection || idpOpen) && (!isInHRMSSection || hrmsOpen) ? (
                // Navigation link - show if not in AMS section or if AMS is open
                <Link
                  href={section.href}
                  className={`flex items-start px-3 py-2.5 rounded-md font-medium transition-all relative text-sm min-w-0 ${
                    pathname === section.href
                      ? 'bg-slate-700/70 text-white font-semibold shadow-md'
                      : 'hover:bg-slate-700/40 text-slate-200'
                  }`}
                  aria-current={pathname === section.href ? 'page' : undefined}
                  aria-label={section.name}
                  title={collapsed && !hoverExpanded ? section.name : undefined}
                >
                  {/* Active indicator bar - green line on left */}
                  {pathname === section.href && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-green-500 rounded-r" />
                  )}
                  {/* Icon */}
                  <section.icon
                    className={`h-5 w-5 flex-shrink-0 z-10 mt-0.5 ${(collapsed && !hoverExpanded) ? 'mx-auto' : 'mr-3'} ${
                      pathname === section.href ? 'text-white' : 'text-slate-300'
                    }`}
                  />
                  {/* Link text */}
                  {!(collapsed && !hoverExpanded) && (
                    <span className="z-10 whitespace-normal leading-snug min-w-0 flex-1 text-sm break-words">
                      {section.name}
                    </span>
                  )}
                </Link>
              ) : null}
            </div>
          );
        })}

        {/* Interface section header */}
        {!(collapsed && !hoverExpanded) && (
          <div className="mt-8 text-xs font-semibold text-slate-400 px-3 pt-4 border-t border-slate-700/50">
            INTERFACE
          </div>
        )}

        {/* Profile Settings */}
        <Link
          href="/profile"
          className={`flex items-start px-3 py-2.5 rounded-md font-medium transition-all relative text-sm min-w-0 mt-2 ${
            pathname === '/profile'
              ? 'bg-slate-700/70 text-white font-semibold shadow-md'
              : 'hover:bg-slate-700/40 text-slate-200'
          }`}
          aria-current={pathname === '/profile' ? 'page' : undefined}
          aria-label="Profile Settings"
          title={collapsed && !hoverExpanded ? 'Profile Settings' : undefined}
        >
          {/* Active indicator bar - green line on left */}
          {pathname === '/profile' && (
            <div className="absolute left-0 top-0 h-full w-1 bg-green-500 rounded-r" />
          )}
          {/* Icon */}
          <Cog6ToothIcon
            className={`h-5 w-5 flex-shrink-0 z-10 mt-0.5 ${(collapsed && !hoverExpanded) ? 'mx-auto' : 'mr-3'} ${
              pathname === '/profile' ? 'text-white' : 'text-slate-300'
            }`}
          />
          {/* Link text */}
          {!(collapsed && !hoverExpanded) && (
            <span className="z-10 whitespace-normal leading-snug min-w-0 flex-1 text-sm break-words">
              Profile Settings
            </span>
          )}
        </Link>

        {/* Collapse/Expand button */}
      </nav>
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="bg-slate-700/50 hover:bg-slate-700/70 text-white rounded-lg p-2 shadow w-full flex items-center justify-center text-xs transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          type="button"
        >
          <ChevronLeftIcon
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </motion.aside>
  );
}