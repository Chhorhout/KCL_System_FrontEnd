"use client";

import { isAuthenticated } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const isLoginPage = pathname === "/login";

  // Check authentication status
  useEffect(() => {
    // Small delay to ensure localStorage is available
    const checkAuth = () => {
      setIsChecking(false);
      if (!isLoginPage && !isAuthenticated()) {
        router.push('/login');
      }
    };
    
    // Check immediately
    checkAuth();
  }, [pathname, router, isLoginPage]);

  // Show loading state while checking
  if (isChecking && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Allow login page to render without auth check
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Redirecting to login...</p>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col bg-[#f7f9fb] min-h-screen overflow-y-auto" 
        style={{ paddingLeft: 'var(--sidebar-width, 260px)' }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

